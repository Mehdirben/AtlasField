"""
Analysis router - Satellite data analysis endpoints
"""
from typing import List
from datetime import datetime, timedelta
from collections import defaultdict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, extract

from app.database import get_db
from app.models import User, Site, Analysis, AnalysisType, Alert, AlertSeverity, AlertType, SiteType
from app.schemas import AnalysisRequest, AnalysisResponse, YieldPrediction, BiomassEstimate, ForestTrends, ForestAnalysisData, FieldTrends, FieldAnalysisData
from app.auth import get_current_user
from app.services.sentinel_hub import SentinelHubService
from app.services.analysis import AnalysisService


router = APIRouter(prefix="/analysis", tags=["Analysis"])


async def create_alert_from_analysis(
    db: AsyncSession,
    site: Site,
    analysis_type: AnalysisType,
    mean_value: float,
    interpretation: str,
    analysis_data: dict = None
):
    """Create an alert if the analysis results indicate problems"""
    alert = None
    
    if analysis_type in (AnalysisType.NDVI, AnalysisType.COMPLETE, AnalysisType.FUSION):
        if mean_value < 0.2:
            alert = Alert(
                site_id=site.id,
                alert_type=AlertType.VEGETATION_HEALTH,
                severity=AlertSeverity.CRITICAL,
                title=f"Critical: Very Low Vegetation on {site.name}",
                message=f"Vegetation analysis shows critically low values (value: {mean_value:.3f}). "
                        f"This indicates very sparse or severely stressed vegetation. Immediate inspection required. "
                        f"Possible causes: pest infestation, severe drought, disease outbreak.",
            )
        elif mean_value < 0.3:
            alert = Alert(
                site_id=site.id,
                alert_type=AlertType.VEGETATION_HEALTH,
                severity=AlertSeverity.HIGH,
                title=f"Warning: Low Vegetation Health on {site.name}",
                message=f"Vegetation analysis indicates low health (value: {mean_value:.3f}). "
                        f"Your vegetation may be experiencing significant stress.",
            )
        elif mean_value < 0.4:
            alert = Alert(
                site_id=site.id,
                alert_type=AlertType.VEGETATION_HEALTH,
                severity=AlertSeverity.MEDIUM,
                title=f"Attention: Moderate Vegetation Stress on {site.name}",
                message=f"Vegetation analysis shows moderate stress levels (value: {mean_value:.3f}). "
                        f"Consider increasing monitoring frequency.",
            )
    
    if not alert and analysis_type in (AnalysisType.MOISTURE, AnalysisType.COMPLETE):
        # For COMPLETE, we might want to check moisture if explicitly available in analysis_data
        # but create_alert_from_analysis is currently called with mean_value which is NDVI for fields.
        # However, if analysis_type is MOISTURE, mean_value IS moisture.
        if analysis_type == AnalysisType.MOISTURE:
            if mean_value < 0.1:
                alert = Alert(
                    site_id=site.id,
                    alert_type=AlertType.DROUGHT_STRESS,
                    severity=AlertSeverity.CRITICAL,
                    title=f"Critical: Severe Drought on {site.name}",
                    message=f"Moisture analysis indicates severe drought conditions (value: {mean_value:.3f}). "
                            f"Urgent attention required to prevent damage.",
                )
        elif mean_value < 0.2:
            alert = Alert(
                site_id=site.id,
                alert_type=AlertType.DROUGHT_STRESS,
                severity=AlertSeverity.HIGH,
                title=f"Warning: Low Moisture on {site.name}",
                message=f"Moisture analysis shows low moisture (value: {mean_value:.3f}). "
                        f"Monitor conditions closely.",
            )
    
    elif analysis_type == AnalysisType.FOREST and analysis_data:
        # Forest-specific alerts
        fire_risk = analysis_data.get("fire_risk_level", "low")
        nbr = analysis_data.get("nbr", 0.5)
        ndmi = analysis_data.get("ndmi", 0.3)
        
        if fire_risk == "critical":
            alert = Alert(
                site_id=site.id,
                alert_type=AlertType.FIRE_RISK,
                severity=AlertSeverity.CRITICAL,
                title=f"🔥 CRITICAL: Fire Risk on {site.name}",
                message=f"Forest analysis indicates CRITICAL fire risk. NBR: {nbr:.3f}, NDMI: {ndmi:.3f}. "
                        f"Extremely dry conditions detected. Take immediate precautions.",
            )
        elif fire_risk == "high":
            alert = Alert(
                site_id=site.id,
                alert_type=AlertType.FIRE_RISK,
                severity=AlertSeverity.HIGH,
                title=f"⚠️ High Fire Risk on {site.name}",
                message=f"Forest analysis shows elevated fire risk. NBR: {nbr:.3f}, NDMI: {ndmi:.3f}. "
                        f"Dry vegetation conditions detected. Monitor closely.",
            )
        
        # Check for deforestation
        deforestation_risk = analysis_data.get("deforestation_risk", "low")
        if deforestation_risk == "high":
            alert = Alert(
                site_id=site.id,
                alert_type=AlertType.DEFORESTATION,
                severity=AlertSeverity.CRITICAL,
                title=f"🌲 Deforestation Alert: {site.name}",
                message=f"Significant vegetation loss detected in forest area. "
                        f"NDVI has dropped to {mean_value:.3f}. Investigate potential deforestation.",
            )
        
        # Drought stress for forests
        if ndmi < 0.15:
            if alert is None:  # Don't override more severe alerts
                alert = Alert(
                    site_id=site.id,
                    alert_type=AlertType.DROUGHT_STRESS,
                    severity=AlertSeverity.HIGH,
                    title=f"Forest Drought Stress: {site.name}",
                    message=f"Low moisture content detected in forest (NDMI: {ndmi:.3f}). "
                            f"Trees may be experiencing water stress.",
                )
    
    if alert:
        db.add(alert)
        await db.commit()
        return alert
    
    return None


@router.post("/{site_id}", response_model=AnalysisResponse)
async def run_analysis(
    site_id: int,
    request: AnalysisRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Run satellite analysis on a site (field or forest)"""
    # Get site
    result = await db.execute(
        select(Site)
        .where(Site.id == site_id, Site.user_id == current_user.id)
    )
    site = result.scalar_one_or_none()
    
    if not site:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Site not found"
        )
    
    # Extract bounding box from geometry
    coords = site.geometry.get("coordinates", [[]])[0]
    if not coords:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid site geometry"
        )
    
    # Calculate bbox
    lons = [c[0] for c in coords]
    lats = [c[1] for c in coords]
    bbox = (min(lons), min(lats), max(lons), max(lats))
    
    # Run analysis based on type
    sentinel_service = SentinelHubService()
    
    try:
        # Auto-select FOREST analysis for forest sites if NDVI/COMPLETE requested
        effective_analysis_type = request.analysis_type
        if site.site_type == SiteType.FOREST and request.analysis_type in (AnalysisType.NDVI, AnalysisType.COMPLETE):
            effective_analysis_type = AnalysisType.FOREST
        
        if effective_analysis_type == AnalysisType.FOREST:
            # Forest-specific comprehensive analysis
            analysis_data = await sentinel_service.get_forest_analysis(bbox)
            
            # Auto-detect forest type if not set
            if site.site_type == SiteType.FOREST and not site.forest_type:
                classification = analysis_data.get("forest_classification", {})
                detected_type = classification.get("detected_type")
                if detected_type and detected_type != "unknown":
                    site.forest_type = detected_type
                    await db.commit()
        elif effective_analysis_type == AnalysisType.COMPLETE:
            # For complete analysis, combine multiple data sources
            ndvi_data = await sentinel_service.get_ndvi(bbox)
            analysis_data = ndvi_data  # Use NDVI as the primary base
            
            # Auto-detect crop type for fields if not set
            if site.site_type == SiteType.FIELD and not site.crop_type:
                try:
                    crop_classification = await sentinel_service.get_crop_classification(bbox)
                    detected_crop = crop_classification.get("detected_type")
                    if detected_crop and detected_crop not in ("unknown", "fallow"):
                        site.crop_type = detected_crop
                        await db.commit()
                    # Store crop classification data in analysis
                    analysis_data["crop_classification"] = crop_classification
                except Exception:
                    pass  # Don't fail analysis if crop detection fails
                    
        elif effective_analysis_type == AnalysisType.NDVI:
            analysis_data = await sentinel_service.get_ndvi(bbox)
            
            # Also try to detect crop type on NDVI analysis if not set
            if site.site_type == SiteType.FIELD and not site.crop_type:
                try:
                    crop_classification = await sentinel_service.get_crop_classification(bbox)
                    detected_crop = crop_classification.get("detected_type")
                    if detected_crop and detected_crop not in ("unknown", "fallow"):
                        site.crop_type = detected_crop
                        await db.commit()
                    analysis_data["crop_classification"] = crop_classification
                except Exception:
                    pass
                    
        elif effective_analysis_type == AnalysisType.RVI:
            analysis_data = await sentinel_service.get_rvi(bbox)
        elif effective_analysis_type == AnalysisType.FUSION:
            analysis_data = await sentinel_service.get_fused_analysis(bbox)
        else:
            # Default to NDVI
            analysis_data = await sentinel_service.get_ndvi(bbox)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Satellite data service unavailable: {str(e)}. Please check Sentinel Hub credentials are configured."
        )
    
    # Generate detailed report based on site type
    if effective_analysis_type == AnalysisType.FOREST:
        # Use forest-specific detailed report generator
        detailed_report = AnalysisService.generate_forest_detailed_report(
            mean_value=analysis_data.get("mean", 0.5),
            min_value=analysis_data.get("min", 0.3),
            max_value=analysis_data.get("max", 0.7),
            cloud_coverage=analysis_data.get("cloud_coverage", 10),
            nbr=analysis_data.get("nbr", 0.3),
            ndmi=analysis_data.get("ndmi", 0.2),
            fire_risk_level=analysis_data.get("fire_risk_level", "low"),
            canopy_health=analysis_data.get("canopy_health", "Good"),
            carbon_estimate=analysis_data.get("carbon_estimate_tonnes_ha", 80),
            deforestation_risk=analysis_data.get("deforestation_risk", "low"),
            forest_classification=analysis_data.get("forest_classification", {}),
            area_hectares=site.area_hectares,
            forest_name=site.name,
            forest_type=site.forest_type,
            baseline_carbon=site.baseline_carbon_t_ha,
            baseline_canopy=site.baseline_canopy_cover
        )
        
        # Set baseline values on first forest analysis if not already set
        if site.baseline_carbon_t_ha is None:
            site.baseline_carbon_t_ha = analysis_data.get("carbon_estimate_tonnes_ha", 80)
            site.baseline_canopy_cover = analysis_data.get("forest_classification", {}).get("canopy_cover_percent", analysis_data.get("mean", 0.5) * 100)
            site.baseline_date = datetime.utcnow()
            await db.commit()
    else:
        # Use field/agriculture detailed report generator
        detailed_report = AnalysisService.generate_detailed_report(
            analysis_type=effective_analysis_type,
            mean_value=analysis_data.get("mean"),
            min_value=analysis_data.get("min"),
            max_value=analysis_data.get("max"),
            cloud_coverage=analysis_data.get("cloud_coverage"),
            crop_type=site.crop_type if site.site_type == SiteType.FIELD else None,
            area_hectares=site.area_hectares,
            field_name=site.name
        )
    
    # Merge detailed report into raw_data
    raw_data = analysis_data.get("raw_data", {})
    raw_data["detailed_report"] = detailed_report
    
    # For forest analysis, include additional forest data
    if effective_analysis_type == AnalysisType.FOREST:
        raw_data["forest_data"] = {
            "nbr": analysis_data.get("nbr"),
            "ndmi": analysis_data.get("ndmi"),
            "fire_risk_level": analysis_data.get("fire_risk_level"),
            "canopy_health": analysis_data.get("canopy_health"),
            "forest_classification": analysis_data.get("forest_classification"),
            "carbon_estimate_tonnes_ha": analysis_data.get("carbon_estimate_tonnes_ha"),
            "deforestation_risk": analysis_data.get("deforestation_risk")
        }
    
    # Create analysis record
    new_analysis = Analysis(
        site_id=site.id,
        analysis_type=effective_analysis_type,
        satellite_date=datetime.utcnow() - timedelta(days=2),  # Approximate
        data=raw_data,
        mean_value=analysis_data.get("mean"),
        min_value=analysis_data.get("min"),
        max_value=analysis_data.get("max"),
        cloud_coverage=analysis_data.get("cloud_coverage"),
        interpretation=analysis_data.get("interpretation"),
    )
    
    db.add(new_analysis)
    await db.commit()
    await db.refresh(new_analysis)
    
    # Create alert if needed
    await create_alert_from_analysis(
        db=db,
        site=site,
        analysis_type=effective_analysis_type,
        mean_value=analysis_data.get("mean", 0.5),
        interpretation=analysis_data.get("interpretation", ""),
        analysis_data=analysis_data if effective_analysis_type == AnalysisType.FOREST else None
    )
    
    return new_analysis


@router.get("/{site_id}/history", response_model=List[AnalysisResponse])
async def get_analysis_history(
    site_id: int,
    analysis_type: AnalysisType = None,
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get analysis history for a site"""
    # Verify site ownership
    result = await db.execute(
        select(Site)
        .where(Site.id == site_id, Site.user_id == current_user.id)
    )
    site = result.scalar_one_or_none()
    
    if not site:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Site not found"
        )
    
    # Build query
    query = select(Analysis).where(Analysis.site_id == site_id)
    
    if analysis_type:
        query = query.where(Analysis.analysis_type == analysis_type)
    
    query = query.order_by(Analysis.created_at.desc()).limit(limit)
    
    result = await db.execute(query)
    analyses = result.scalars().all()
    
    return analyses


@router.get("/{site_id}/yield", response_model=YieldPrediction)
async def predict_yield(
    site_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get yield prediction for a site (fields only)"""
    # Get site
    result = await db.execute(
        select(Site)
        .where(Site.id == site_id, Site.user_id == current_user.id)
    )
    site = result.scalar_one_or_none()
    
    if not site:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Site not found"
        )
    
    # Yield prediction only makes sense for agricultural fields
    if site.site_type == SiteType.FOREST:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Yield prediction is only available for agricultural fields, not forests"
        )
    
    # Get historical NDVI values
    result = await db.execute(
        select(Analysis)
        .where(Analysis.site_id == site_id, Analysis.analysis_type == AnalysisType.NDVI)
        .order_by(Analysis.created_at.desc())
        .limit(10)
    )
    analyses = result.scalars().all()
    
    ndvi_history = [a.mean_value for a in analyses if a.mean_value is not None]
    
    if not ndvi_history:
        # Use default value if no history
        ndvi_history = [0.5]
    
    # Calculate yield prediction
    prediction = AnalysisService.predict_yield(
        ndvi_history=ndvi_history,
        crop_type=site.crop_type or "wheat",
        area_ha=site.area_hectares or 1.0
    )
    
    return YieldPrediction(**prediction)


@router.get("/{site_id}/biomass", response_model=BiomassEstimate)
async def estimate_biomass(
    site_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get biomass estimate for a site"""
    # Get site
    result = await db.execute(
        select(Site)
        .where(Site.id == site_id, Site.user_id == current_user.id)
    )
    site = result.scalar_one_or_none()
    
    if not site:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Site not found"
        )
    
    # Get latest analyses
    result = await db.execute(
        select(Analysis)
        .where(Analysis.site_id == site_id)
        .order_by(Analysis.created_at.desc())
        .limit(5)
    )
    analyses = result.scalars().all()
    
    # Extract NDVI and RVI values
    ndvi_value = 0.5
    rvi_value = 0.5
    
    for a in analyses:
        if a.analysis_type == AnalysisType.NDVI and a.mean_value:
            ndvi_value = a.mean_value
        if a.analysis_type == AnalysisType.RVI and a.mean_value:
            rvi_value = a.mean_value
    
    # Calculate biomass
    biomass = AnalysisService.estimate_biomass(ndvi=ndvi_value, rvi=rvi_value)
    
    return BiomassEstimate(**biomass)


@router.get("/{site_id}/forest-trends", response_model=ForestTrends)
async def get_forest_trends(
    site_id: int,
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get analysis-by-analysis forest trends from stored analysis records"""
    # Get site
    result = await db.execute(
        select(Site)
        .where(Site.id == site_id, Site.user_id == current_user.id)
    )
    site = result.scalar_one_or_none()
    
    if not site:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Site not found"
        )
    
    # Only available for forest sites
    if site.site_type != SiteType.FOREST:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Forest trends are only available for forest sites"
        )
    
    # Get all FOREST analyses for this site, ordered by date (oldest first for change calculation)
    result = await db.execute(
        select(Analysis)
        .where(Analysis.site_id == site_id, Analysis.analysis_type == AnalysisType.FOREST)
        .order_by(Analysis.created_at.asc())
        .limit(limit)
    )
    analyses = result.scalars().all()
    
    if len(analyses) < 2:
        return ForestTrends(
            analyses=[],
            overall_trend="unknown",
            has_sufficient_data=False,
            message="Insufficient data: At least 2 forest analyses are required for trend comparison."
        )
    
    # Extract data from each analysis and calculate changes from previous
    analysis_data_list = []
    prev_data = None
    ndvi_changes = []
    carbon_changes = []
    
    for analysis in analyses:
        forest_data = analysis.data.get("forest_data", {})
        detailed_report = analysis.data.get("detailed_report", {})
        
        # Extract values with fallbacks
        ndvi = analysis.mean_value or 0.5
        nbr = forest_data.get("nbr", detailed_report.get("fire_risk_assessment", {}).get("nbr_value", 0.3))
        ndmi = forest_data.get("ndmi", detailed_report.get("fire_risk_assessment", {}).get("ndmi_value", 0.2))
        carbon = forest_data.get("carbon_estimate_tonnes_ha", detailed_report.get("carbon_sequestration", {}).get("current_carbon_stock_t_ha", 80))
        canopy = forest_data.get("canopy_cover_percent", detailed_report.get("canopy_health", {}).get("canopy_cover_percent", (ndvi * 100)))
        fire_risk = forest_data.get("fire_risk_level", detailed_report.get("fire_risk_assessment", {}).get("risk_level", "low"))
        deforestation = forest_data.get("deforestation_risk", detailed_report.get("deforestation_monitoring", {}).get("risk_level", "low"))
        
        current_data = {
            "ndvi": ndvi,
            "nbr": nbr,
            "ndmi": ndmi,
            "carbon": carbon,
            "canopy": canopy
        }
        
        # Calculate changes from previous analysis
        ndvi_change = None
        nbr_change = None
        carbon_change = None
        canopy_change = None
        
        if prev_data:
            def calc_pct(curr, prev):
                if prev == 0:
                    return 0
                return round(((curr - prev) / abs(prev)) * 100, 1)
            
            ndvi_change = calc_pct(ndvi, prev_data["ndvi"])
            nbr_change = calc_pct(nbr, prev_data["nbr"])
            carbon_change = calc_pct(carbon, prev_data["carbon"])
            canopy_change = calc_pct(canopy, prev_data["canopy"])
            
            ndvi_changes.append(ndvi_change)
            carbon_changes.append(carbon_change)
        
        analysis_entry = ForestAnalysisData(
            analysis_id=analysis.id,
            date=analysis.created_at,
            ndvi=round(ndvi, 3),
            nbr=round(nbr, 3),
            ndmi=round(ndmi, 3),
            carbon_stock_t_ha=round(carbon, 2),
            canopy_cover_percent=round(canopy, 1),
            fire_risk_level=fire_risk,
            deforestation_risk=deforestation,
            ndvi_change_pct=ndvi_change,
            nbr_change_pct=nbr_change,
            carbon_change_pct=carbon_change,
            canopy_change_pct=canopy_change
        )
        analysis_data_list.append(analysis_entry)
        prev_data = current_data
    
    # Reverse to show most recent first
    analysis_data_list.reverse()
    
    # Calculate average changes and overall trend
    avg_ndvi_change = round(sum(ndvi_changes) / len(ndvi_changes), 1) if ndvi_changes else None
    avg_carbon_change = round(sum(carbon_changes) / len(carbon_changes), 1) if carbon_changes else None
    
    # Determine overall trend
    if avg_ndvi_change is not None and avg_carbon_change is not None:
        if avg_ndvi_change > 2 and avg_carbon_change > 0:
            overall_trend = "improving"
        elif avg_ndvi_change < -2 or avg_carbon_change < -2:
            overall_trend = "declining"
        else:
            overall_trend = "stable"
    else:
        overall_trend = "unknown"
    
    # Baseline comparison if available
    baseline_comparison = None
    if site.baseline_carbon_t_ha and analysis_data_list:
        current = analysis_data_list[0]  # Most recent
        baseline_comparison = {
            "baseline_date": site.baseline_date.isoformat() if site.baseline_date else None,
            "baseline_carbon_t_ha": site.baseline_carbon_t_ha,
            "baseline_canopy_cover": site.baseline_canopy_cover,
            "carbon_change_from_baseline_pct": round(((current.carbon_stock_t_ha - site.baseline_carbon_t_ha) / site.baseline_carbon_t_ha) * 100, 1) if site.baseline_carbon_t_ha else None,
            "canopy_change_from_baseline_pct": round(((current.canopy_cover_percent - site.baseline_canopy_cover) / site.baseline_canopy_cover) * 100, 1) if site.baseline_canopy_cover else None
        }
    
    return ForestTrends(
        analyses=analysis_data_list,
        overall_trend=overall_trend,
        avg_ndvi_change=avg_ndvi_change,
        avg_carbon_change=avg_carbon_change,
        baseline_comparison=baseline_comparison,
        has_sufficient_data=True,
        message=None
    )


@router.get("/{site_id}/field-trends", response_model=FieldTrends)
async def get_field_trends(
    site_id: int,
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get analysis-by-analysis field trends from stored analysis records"""
    # Get site
    result = await db.execute(
        select(Site)
        .where(Site.id == site_id, Site.user_id == current_user.id)
    )
    site = result.scalar_one_or_none()
    
    if not site:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Site not found"
        )
    
    # Only available for field sites
    if site.site_type != SiteType.FIELD:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Field trends are only available for agricultural fields"
        )
    
    # Get all COMPLETE or NDVI analyses for this site, ordered by date (oldest first for change calculation)
    result = await db.execute(
        select(Analysis)
        .where(
            Analysis.site_id == site_id, 
            Analysis.analysis_type.in_([AnalysisType.COMPLETE, AnalysisType.NDVI])
        )
        .order_by(Analysis.created_at.asc())
        .limit(limit)
    )
    analyses = result.scalars().all()
    
    if len(analyses) < 2:
        return FieldTrends(
            analyses=[],
            overall_trend="unknown",
            has_sufficient_data=False,
            message="Insufficient data: At least 2 analyses are required for trend comparison."
        )
    
    # Extract data from each analysis and calculate changes from previous
    analysis_data_list = []
    prev_data = None
    ndvi_changes = []
    yield_changes = []
    
    first_analysis = analyses[0]
    baseline_detailed = first_analysis.data.get("detailed_report", {})
    baseline_ndvi = first_analysis.mean_value or 0.5
    baseline_yield = baseline_detailed.get("yield_prediction", {}).get("predicted_yield_per_ha")
    
    for analysis in analyses:
        detailed_report = analysis.data.get("detailed_report", {})
        
        # Extract values with fallbacks
        ndvi = analysis.mean_value or 0.5
        yield_val = detailed_report.get("yield_prediction", {}).get("predicted_yield_per_ha")
        biomass = detailed_report.get("biomass_analysis", {}).get("estimated_biomass_t_ha")
        moisture = detailed_report.get("moisture_assessment", {}).get("estimated_moisture")
        
        # Multiply moisture by 100 for percentage
        if moisture is not None:
            moisture = round(moisture * 100, 1)
            
        current_data = {
            "ndvi": ndvi,
            "yield": yield_val
        }
        
        # Calculate changes from previous analysis
        ndvi_change = None
        yield_change = None
        
        if prev_data:
            def calc_pct(curr, prev):
                if prev is None or curr is None or prev == 0:
                    return None
                return round(((curr - prev) / abs(prev)) * 100, 1)
            
            ndvi_change = calc_pct(ndvi, prev_data["ndvi"])
            yield_change = calc_pct(yield_val, prev_data["yield"])
            
            if ndvi_change is not None:
                ndvi_changes.append(ndvi_change)
            if yield_change is not None:
                yield_changes.append(yield_change)
        
        analysis_entry = FieldAnalysisData(
            analysis_id=analysis.id,
            date=analysis.created_at,
            ndvi=round(ndvi, 3),
            yield_per_ha=yield_val,
            biomass_t_ha=biomass,
            moisture_pct=moisture,
            ndvi_change_pct=ndvi_change,
            yield_change_pct=yield_change
        )
        analysis_data_list.append(analysis_entry)
        prev_data = current_data
    
    # Reverse to show most recent first
    analysis_data_list.reverse()
    
    # Calculate average changes and overall trend
    avg_ndvi_change = round(sum(ndvi_changes) / len(ndvi_changes), 1) if ndvi_changes else None
    avg_yield_change = round(sum(yield_changes) / len(yield_changes), 1) if yield_changes else None
    
    last_analysis = analyses[-1]
    last_detailed = last_analysis.data.get("detailed_report", {})
    last_ndvi = last_analysis.mean_value or 0.5
    last_yield = last_detailed.get("yield_prediction", {}).get("predicted_yield_per_ha")
    
    def calc_pct_raw(curr, prev):
        if prev is None or curr is None or prev == 0:
            return 0
        return round(((curr - prev) / abs(prev)) * 100, 1)

    baseline_comparison = {
        "baseline_date": first_analysis.created_at,
        "baseline_ndvi": baseline_ndvi,
        "baseline_yield": baseline_yield,
        "ndvi_change_from_baseline_pct": calc_pct_raw(last_ndvi, baseline_ndvi),
        "yield_change_from_baseline_pct": calc_pct_raw(last_yield, baseline_yield)
    }

    # Determine overall trend
    if avg_ndvi_change is not None:
        if avg_ndvi_change > 1:
            overall_trend = "improving"
        elif avg_ndvi_change < -1:
            overall_trend = "declining"
        else:
            overall_trend = "stable"
    else:
        overall_trend = "unknown"
    
    return FieldTrends(
        analyses=analysis_data_list,
        overall_trend=overall_trend,
        avg_ndvi_change=avg_ndvi_change,
        avg_yield_change=avg_yield_change,
        baseline_comparison=baseline_comparison,
        has_sufficient_data=True,
        message=None
    )