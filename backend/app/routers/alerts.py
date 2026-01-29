"""
Alerts router - Field alerts and notifications
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.database import get_db
from app.models import User, Field, Alert
from app.schemas import AlertResponse
from app.auth import get_current_user


router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.get("", response_model=List[AlertResponse])
async def list_alerts(
    unread_only: bool = False,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all alerts for current user's fields"""
    # Get user's field IDs
    result = await db.execute(
        select(Field.id).where(Field.user_id == current_user.id)
    )
    field_ids = [r[0] for r in result.fetchall()]
    
    if not field_ids:
        return []
    
    # Build query
    query = select(Alert).where(Alert.field_id.in_(field_ids))
    
    if unread_only:
        query = query.where(Alert.is_read == False)
    
    query = query.order_by(Alert.created_at.desc())
    
    result = await db.execute(query)
    alerts = result.scalars().all()
    
    return alerts


@router.put("/{alert_id}/read", response_model=AlertResponse)
async def mark_alert_read(
    alert_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Mark an alert as read"""
    # Get alert and verify ownership
    result = await db.execute(
        select(Alert)
        .join(Field)
        .where(Alert.id == alert_id, Field.user_id == current_user.id)
    )
    alert = result.scalar_one_or_none()
    
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )
    
    alert.is_read = True
    await db.commit()
    await db.refresh(alert)
    
    return alert


@router.put("/read-all", status_code=status.HTTP_204_NO_CONTENT)
async def mark_all_alerts_read(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Mark all alerts as read"""
    # Get user's field IDs
    result = await db.execute(
        select(Field.id).where(Field.user_id == current_user.id)
    )
    field_ids = [r[0] for r in result.fetchall()]
    
    if not field_ids:
        return
    
    # Update all alerts
    await db.execute(
        update(Alert)
        .where(Alert.field_id.in_(field_ids), Alert.is_read == False)
        .values(is_read=True)
    )
    await db.commit()
