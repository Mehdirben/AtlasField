"""
Fields router - CRUD operations for agricultural fields
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import User, Field, Analysis, Alert, AnalysisType
from app.schemas import FieldCreate, FieldUpdate, FieldResponse, FieldWithAnalysis
from app.auth import get_current_user


router = APIRouter(prefix="/fields", tags=["Fields"])


def calculate_area_from_geojson(geometry: dict) -> float:
    """
    Calculate approximate area in hectares from GeoJSON polygon
    Uses a simple calculation - for production, use proper geodesic calculation
    """
    if geometry.get("type") != "Polygon":
        return 0.0
    
    coords = geometry.get("coordinates", [[]])
    if not coords or not coords[0]:
        return 0.0
    
    # Simple shoelace formula for approximate area
    # This is simplified - production should use turf.js or shapely
    ring = coords[0]
    n = len(ring)
    if n < 3:
        return 0.0
    
    area = 0.0
    for i in range(n):
        j = (i + 1) % n
        area += ring[i][0] * ring[j][1]
        area -= ring[j][0] * ring[i][1]
    
    area = abs(area) / 2.0
    
    # Convert from degrees² to hectares (very rough approximation)
    # At equator: 1 degree ≈ 111km, so 1 degree² ≈ 12321 km² = 1232100 ha
    # This factor varies with latitude, but works for rough estimates
    hectares = area * 1232100
    
    return round(hectares, 2)


@router.get("", response_model=List[FieldWithAnalysis])
async def list_fields(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all fields for current user with latest analysis"""
    result = await db.execute(
        select(Field)
        .where(Field.user_id == current_user.id)
        .options(selectinload(Field.analyses), selectinload(Field.alerts))
        .order_by(Field.created_at.desc())
    )
    fields = result.scalars().all()
    
    response = []
    for field in fields:
        # Get latest NDVI or COMPLETE analysis
        latest_ndvi = None
        latest_date = None
        
        if field.analyses:
            # Look for NDVI or COMPLETE analyses
            relevant_analyses = [
                a for a in field.analyses 
                if a.analysis_type in (AnalysisType.NDVI, AnalysisType.COMPLETE)
            ]
            if relevant_analyses:
                latest = max(relevant_analyses, key=lambda x: x.created_at)
                latest_ndvi = latest.mean_value
                latest_date = latest.created_at
        
        # Count unread alerts
        alert_count = len([a for a in field.alerts if not a.is_read])
        
        response.append(FieldWithAnalysis(
            id=field.id,
            name=field.name,
            description=field.description,
            geometry=field.geometry,
            area_hectares=field.area_hectares,
            crop_type=field.crop_type,
            planting_date=field.planting_date,
            created_at=field.created_at,
            updated_at=field.updated_at,
            latest_ndvi=latest_ndvi,
            latest_analysis_date=latest_date,
            alert_count=alert_count
        ))
    
    return response


@router.post("", response_model=FieldResponse, status_code=status.HTTP_201_CREATED)
async def create_field(
    field_data: FieldCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new field"""
    # Validate GeoJSON geometry
    if field_data.geometry.get("type") != "Polygon":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Geometry must be a GeoJSON Polygon"
        )
    
    # Calculate area
    area_hectares = calculate_area_from_geojson(field_data.geometry)
    
    new_field = Field(
        user_id=current_user.id,
        name=field_data.name,
        description=field_data.description,
        geometry=field_data.geometry,
        area_hectares=area_hectares,
        crop_type=field_data.crop_type,
        planting_date=field_data.planting_date,
    )
    
    db.add(new_field)
    await db.commit()
    await db.refresh(new_field)
    
    return new_field


@router.get("/{field_id}", response_model=FieldResponse)
async def get_field(
    field_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific field"""
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
    
    return field


@router.put("/{field_id}", response_model=FieldResponse)
async def update_field(
    field_id: int,
    field_data: FieldUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a field"""
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
    
    # Update fields
    if field_data.name is not None:
        field.name = field_data.name
    if field_data.description is not None:
        field.description = field_data.description
    if field_data.crop_type is not None:
        field.crop_type = field_data.crop_type
    if field_data.planting_date is not None:
        field.planting_date = field_data.planting_date
    
    await db.commit()
    await db.refresh(field)
    
    return field


@router.delete("/{field_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_field(
    field_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a field"""
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
    
    await db.delete(field)
    await db.commit()
