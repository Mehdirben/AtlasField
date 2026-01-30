"""
Alerts router - Site alerts and notifications
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.database import get_db
from app.models import User, Site, Alert
from app.schemas import AlertResponse
from app.auth import get_current_user


router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.get("", response_model=List[AlertResponse])
async def list_alerts(
    unread_only: bool = False,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all alerts for current user's sites"""
    # Get user's site IDs
    result = await db.execute(
        select(Site.id).where(Site.user_id == current_user.id)
    )
    site_ids = [r[0] for r in result.fetchall()]
    
    if not site_ids:
        return []
    
    # Build query with join to get site info
    query = (
        select(Alert, Site.name, Site.site_type)
        .join(Site)
        .where(Alert.site_id.in_(site_ids))
    )
    
    if unread_only:
        query = query.where(Alert.is_read == False)
    
    query = query.order_by(Alert.created_at.desc())
    
    result = await db.execute(query)
    rows = result.all()
    
    alerts_enriched = []
    for row in rows:
        alert, site_name, site_type = row
        alert.site_name = site_name
        alert.site_type = site_type
        alerts_enriched.append(alert)
    
    return alerts_enriched


@router.put("/{alert_id}/read", response_model=AlertResponse)
async def mark_alert_read(
    alert_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Mark an alert as read"""
    # Get alert and verify ownership, join with Site to get info
    result = await db.execute(
        select(Alert, Site.name, Site.site_type)
        .join(Site)
        .where(Alert.id == alert_id, Site.user_id == current_user.id)
    )
    row = result.one_or_none()
    
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )
    
    alert, site_name, site_type = row
    alert.is_read = True
    alert.site_name = site_name
    alert.site_type = site_type
    await db.commit()
    await db.refresh(alert)
    
    return alert


@router.put("/read-all", status_code=status.HTTP_204_NO_CONTENT)
async def mark_all_alerts_read(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Mark all alerts as read"""
    # Get user's site IDs
    result = await db.execute(
        select(Site.id).where(Site.user_id == current_user.id)
    )
    site_ids = [r[0] for r in result.fetchall()]
    
    if not site_ids:
        return
    
    # Update all alerts
    await db.execute(
        update(Alert)
        .where(Alert.site_id.in_(site_ids), Alert.is_read == False)
        .values(is_read=True)
    )
    await db.commit()
