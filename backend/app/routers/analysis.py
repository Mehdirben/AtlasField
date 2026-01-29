"""
Analysis router - Satellite data analysis endpoints
"""
from typing import List
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import User, Site, Analysis, AnalysisType, Alert, AlertSeverity, AlertType, SiteType
from app.schemas import AnalysisRequest, AnalysisResponse, YieldPrediction, BiomassEstimate
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
    
    if analysis_type == AnalysisType.NDVI:
        if mean_value < 0.2:
            alert = Alert(
                site_id=site.id,
                alert_type=AlertType.VEGETATION_HEALTH,
                severity=AlertSeverity.CRITICAL,
                title=f"Critical: Very Low Vegetation on {site.name}",
                message=f"NDVI analysis shows critically low vegetation (value: {mean_value:.3f}). "
                        f"This indicates very sparse or severely stressed vegetation. Immediate inspection required. "
                        f"Possible causes: pest infestation, severe drought, disease outbreak.",
            )
        elif mean_value < 0.3:
            alert = Alert(
                site_id=site.id,
                alert_type=AlertType.VEGETATION_HEALTH,
                severity=AlertSeverity.HIGH,
                title=f"Warning: Low Vegetation Health on {site.name}",
                message=f"NDVI analysis indicates low vegetation health (value: {mean_value:.3f}). "
                        f"Your vegetation may be experiencing significant stress.",
            )
        elif mean_value < 0.4:
            alert = Alert(
                site_id=site.id,
                alert_type=AlertType.VEGETATION_HEALTH,
                severity=AlertSeverity.MEDIUM,
                title=f"Attention: Moderate Vegetation Stress on {site.name}",
                message=f"NDVI analysis shows moderate stress levels (value: {mean_value:.3f}). "
                        f"Consider increasing monitoring frequency.",
            )
    
    elif analysis_type == AnalysisType.MOISTURE:
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
        elif effective_analysis_type == AnalysisType.NDVI:
            analysis_data = await sentinel_service.get_ndvi(bbox)
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
    
    # Generate detailed report (use field-compatible method for now)
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
