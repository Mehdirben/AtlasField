"""
Analysis router - Satellite data analysis endpoints
"""
from typing import List
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import User, Field, Analysis, AnalysisType, Alert, AlertSeverity
from app.schemas import AnalysisRequest, AnalysisResponse, YieldPrediction, BiomassEstimate
from app.auth import get_current_user
from app.services.sentinel_hub import SentinelHubService
from app.services.analysis import AnalysisService


router = APIRouter(prefix="/analysis", tags=["Analysis"])


async def create_alert_from_analysis(
    db: AsyncSession,
    field: Field,
    analysis_type: AnalysisType,
    mean_value: float,
    interpretation: str
):
    """Create an alert if the analysis results indicate problems"""
    alert = None
    
    if analysis_type == AnalysisType.NDVI:
        if mean_value < 0.2:
            alert = Alert(
                field_id=field.id,
                severity=AlertSeverity.CRITICAL,
                title=f"Critical: Very Low Vegetation on {field.name}",
                message=f"NDVI analysis shows critically low vegetation (value: {mean_value:.3f}). "
                        f"This indicates very sparse or severely stressed crops. Immediate inspection required. "
                        f"Possible causes: pest infestation, severe drought, disease outbreak, or crop failure.",
            )
        elif mean_value < 0.3:
            alert = Alert(
                field_id=field.id,
                severity=AlertSeverity.HIGH,
                title=f"Warning: Low Vegetation Health on {field.name}",
                message=f"NDVI analysis indicates low vegetation health (value: {mean_value:.3f}). "
                        f"Your crops may be experiencing significant stress. "
                        f"Recommended actions: Check irrigation system, inspect for pests/disease, verify soil nutrients.",
            )
        elif mean_value < 0.4:
            alert = Alert(
                field_id=field.id,
                severity=AlertSeverity.MEDIUM,
                title=f"Attention: Moderate Vegetation Stress on {field.name}",
                message=f"NDVI analysis shows moderate stress levels (value: {mean_value:.3f}). "
                        f"Consider increasing monitoring frequency and reviewing irrigation schedules.",
            )
    
    elif analysis_type == AnalysisType.MOISTURE:
        if mean_value < 0.1:
            alert = Alert(
                field_id=field.id,
                severity=AlertSeverity.CRITICAL,
                title=f"Critical: Severe Drought on {field.name}",
                message=f"Moisture analysis indicates severe drought conditions (value: {mean_value:.3f}). "
                        f"Urgent irrigation required to prevent crop loss.",
            )
        elif mean_value < 0.2:
            alert = Alert(
                field_id=field.id,
                severity=AlertSeverity.HIGH,
                title=f"Warning: Low Soil Moisture on {field.name}",
                message=f"Moisture analysis shows low soil moisture (value: {mean_value:.3f}). "
                        f"Plan irrigation within the next 24-48 hours.",
            )
    
    if alert:
        db.add(alert)
        await db.commit()
        return alert
    
    return None


@router.post("/{field_id}", response_model=AnalysisResponse)
async def run_analysis(
    field_id: int,
    request: AnalysisRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Run satellite analysis on a field"""
    # Get field
    result = await db.execute(
        select(Field)
        .where(Field.id == field_id, Field.user_id == current_user.id)
    )
    field = result.scalar_one_or_none()
    
    if not field:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Field not found"
        )
    
    # Extract bounding box from geometry
    coords = field.geometry.get("coordinates", [[]])[0]
    if not coords:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid field geometry"
        )
    
    # Calculate bbox
    lons = [c[0] for c in coords]
    lats = [c[1] for c in coords]
    bbox = (min(lons), min(lats), max(lons), max(lats))
    
    # Run analysis based on type
    sentinel_service = SentinelHubService()
    
    try:
        if request.analysis_type == AnalysisType.COMPLETE:
            # For complete analysis, combine multiple data sources
            ndvi_data = await sentinel_service.get_ndvi(bbox)
            analysis_data = ndvi_data  # Use NDVI as the primary base
            # The complete report generation will handle all aspects
        elif request.analysis_type == AnalysisType.NDVI:
            analysis_data = await sentinel_service.get_ndvi(bbox)
        elif request.analysis_type == AnalysisType.RVI:
            analysis_data = await sentinel_service.get_rvi(bbox)
        elif request.analysis_type == AnalysisType.FUSION:
            analysis_data = await sentinel_service.get_fused_analysis(bbox)
        else:
            # Default to NDVI
            analysis_data = await sentinel_service.get_ndvi(bbox)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Satellite data service unavailable: {str(e)}. Please check Sentinel Hub credentials are configured."
        )
    
    # Generate detailed report
    detailed_report = AnalysisService.generate_detailed_report(
        analysis_type=request.analysis_type,
        mean_value=analysis_data.get("mean"),
        min_value=analysis_data.get("min"),
        max_value=analysis_data.get("max"),
        cloud_coverage=analysis_data.get("cloud_coverage"),
        crop_type=field.crop_type,
        area_hectares=field.area_hectares,
        field_name=field.name
    )
    
    # Merge detailed report into raw_data
    raw_data = analysis_data.get("raw_data", {})
    raw_data["detailed_report"] = detailed_report
    
    # Create analysis record
    new_analysis = Analysis(
        field_id=field.id,
        analysis_type=request.analysis_type,
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
        field=field,
        analysis_type=request.analysis_type,
        mean_value=analysis_data.get("mean", 0.5),
        interpretation=analysis_data.get("interpretation", "")
    )
    
    return new_analysis


@router.get("/{field_id}/history", response_model=List[AnalysisResponse])
async def get_analysis_history(
    field_id: int,
    analysis_type: AnalysisType = None,
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get analysis history for a field"""
    # Verify field ownership
    result = await db.execute(
        select(Field)
        .where(Field.id == field_id, Field.user_id == current_user.id)
    )
    field = result.scalar_one_or_none()
    
    if not field:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Field not found"
        )
    
    # Build query
    query = select(Analysis).where(Analysis.field_id == field_id)
    
    if analysis_type:
        query = query.where(Analysis.analysis_type == analysis_type)
    
    query = query.order_by(Analysis.created_at.desc()).limit(limit)
    
    result = await db.execute(query)
    analyses = result.scalars().all()
    
    return analyses


@router.get("/{field_id}/yield", response_model=YieldPrediction)
async def predict_yield(
    field_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get yield prediction for a field"""
    # Get field
    result = await db.execute(
        select(Field)
        .where(Field.id == field_id, Field.user_id == current_user.id)
    )
    field = result.scalar_one_or_none()
    
    if not field:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Field not found"
        )
    
    # Get historical NDVI values
    result = await db.execute(
        select(Analysis)
        .where(Analysis.field_id == field_id, Analysis.analysis_type == AnalysisType.NDVI)
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
        crop_type=field.crop_type or "wheat",
        area_ha=field.area_hectares or 1.0
    )
    
    return YieldPrediction(**prediction)


@router.get("/{field_id}/biomass", response_model=BiomassEstimate)
async def estimate_biomass(
    field_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get biomass estimate for a field"""
    # Get field
    result = await db.execute(
        select(Field)
        .where(Field.id == field_id, Field.user_id == current_user.id)
    )
    field = result.scalar_one_or_none()
    
    if not field:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Field not found"
        )
    
    # Get latest analyses
    result = await db.execute(
        select(Analysis)
        .where(Analysis.field_id == field_id)
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
