"""
Sites router - CRUD operations for agricultural fields and forests
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import User, Site, Analysis, Alert, AnalysisType, SiteType
from app.schemas import SiteCreate, SiteUpdate, SiteResponse, SiteWithAnalysis
from app.auth import get_current_user


router = APIRouter(prefix="/sites", tags=["Sites"])


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


@router.get("", response_model=List[SiteWithAnalysis])
async def list_sites(
    site_type: Optional[SiteType] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all sites for current user with latest analysis. Optionally filter by site_type."""
    query = select(Site).where(Site.user_id == current_user.id)
    
    if site_type:
        query = query.where(Site.site_type == site_type)
    
    result = await db.execute(
        query
        .options(selectinload(Site.analyses), selectinload(Site.alerts))
        .order_by(Site.created_at.desc())
    )
    sites = result.scalars().all()
    
    response = []
    for site in sites:
        # Get latest NDVI, COMPLETE, or FOREST analysis
        latest_ndvi = None
        latest_date = None
        latest_nbr = None
        fire_risk_level = None
        
        if site.analyses:
            # Look for relevant analyses based on site type
            if site.site_type == SiteType.FOREST:
                # For forests, prioritize FOREST analysis
                forest_analyses = [a for a in site.analyses if a.analysis_type == AnalysisType.FOREST]
                if forest_analyses:
                    latest = max(forest_analyses, key=lambda x: x.created_at)
                    latest_ndvi = latest.mean_value
                    latest_date = latest.created_at
                    # Extract forest-specific data
                    if latest.data:
                        latest_nbr = latest.data.get("nbr")
                        fire_risk_level = latest.data.get("fire_risk_level")
            
            # Fall back to NDVI or COMPLETE analyses
            if latest_ndvi is None:
                relevant_analyses = [
                    a for a in site.analyses 
                    if a.analysis_type in (AnalysisType.NDVI, AnalysisType.COMPLETE)
                ]
                if relevant_analyses:
                    latest = max(relevant_analyses, key=lambda x: x.created_at)
                    latest_ndvi = latest.mean_value
                    latest_date = latest.created_at
        
        # Count unread alerts
        alert_count = len([a for a in site.alerts if not a.is_read])
        
        response.append(SiteWithAnalysis(
            id=site.id,
            name=site.name,
            description=site.description,
            geometry=site.geometry,
            area_hectares=site.area_hectares,
            site_type=site.site_type,
            crop_type=site.crop_type,
            planting_date=site.planting_date,
            forest_type=site.forest_type,
            tree_species=site.tree_species,
            protected_status=site.protected_status,
            created_at=site.created_at,
            updated_at=site.updated_at,
            latest_ndvi=latest_ndvi,
            latest_analysis_date=latest_date,
            alert_count=alert_count,
            latest_nbr=latest_nbr,
            fire_risk_level=fire_risk_level
        ))
    
    return response


@router.post("", response_model=SiteResponse, status_code=status.HTTP_201_CREATED)
async def create_site(
    site_data: SiteCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new site (field or forest)"""
    # Validate GeoJSON geometry
    if site_data.geometry.get("type") != "Polygon":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Geometry must be a GeoJSON Polygon"
        )
    
    # Calculate area
    area_hectares = calculate_area_from_geojson(site_data.geometry)
    
    new_site = Site(
        user_id=current_user.id,
        name=site_data.name,
        description=site_data.description,
        geometry=site_data.geometry,
        area_hectares=area_hectares,
        site_type=site_data.site_type,
        # Field-specific
        crop_type=site_data.crop_type if site_data.site_type == SiteType.FIELD else None,
        planting_date=site_data.planting_date if site_data.site_type == SiteType.FIELD else None,
        # Forest-specific
        forest_type=site_data.forest_type if site_data.site_type == SiteType.FOREST else None,
        tree_species=site_data.tree_species if site_data.site_type == SiteType.FOREST else None,
        protected_status=site_data.protected_status if site_data.site_type == SiteType.FOREST else None,
    )
    
    db.add(new_site)
    await db.commit()
    await db.refresh(new_site)
    
    return new_site


@router.get("/{site_id}", response_model=SiteResponse)
async def get_site(
    site_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific site"""
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
    
    return site


@router.put("/{site_id}", response_model=SiteResponse)
async def update_site(
    site_id: int,
    site_data: SiteUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a site"""
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
    
    # Update common fields
    if site_data.name is not None:
        site.name = site_data.name
    if site_data.description is not None:
        site.description = site_data.description
    
    # Update field-specific fields
    if site.site_type == SiteType.FIELD:
        if site_data.crop_type is not None:
            site.crop_type = site_data.crop_type
        if site_data.planting_date is not None:
            site.planting_date = site_data.planting_date
    
    # Update forest-specific fields
    if site.site_type == SiteType.FOREST:
        if site_data.forest_type is not None:
            site.forest_type = site_data.forest_type
        if site_data.tree_species is not None:
            site.tree_species = site_data.tree_species
        if site_data.protected_status is not None:
            site.protected_status = site_data.protected_status
    
    await db.commit()
    await db.refresh(site)
    
    return site


@router.delete("/{site_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_site(
    site_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a site"""
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
    
    await db.delete(site)
    await db.commit()
