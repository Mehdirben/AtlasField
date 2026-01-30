"""
Chat router - AI-powered assistant using Gemini for agriculture and forestry
"""
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import User, Site, ChatHistory, Analysis, SiteType, Alert
from app.schemas import ChatRequest, ChatResponse, ChatHistoryResponse
from app.auth import get_current_user
from app.services.gemini_service import GeminiService


router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Send a message to the AI assistant"""
    global_context = []
    
    # Get site context if provided
    if request.site_id:
        result = await db.execute(
            select(Site)
            .where(Site.id == request.site_id, Site.user_id == current_user.id)
        )
        site = result.scalar_one_or_none()
        
        if site:
            # Get latest analyses for context
            result = await db.execute(
                select(Analysis)
                .where(Analysis.site_id == site.id)
                .order_by(Analysis.created_at.desc())
                .limit(20)  # Increased limit
            )
            analyses = result.scalars().all()
            
            # Get latest alerts for context
            result = await db.execute(
                select(Alert)
                .where(Alert.site_id == site.id)
                .order_by(Alert.created_at.desc())
                .limit(10)
            )
            alerts = result.scalars().all()
            
            site_context = {
                "site_id": site.id,
                "site_name": site.name,
                "description": site.description,
                "site_type": site.site_type.value,
                "area_hectares": site.area_hectares,
                # Field-specific
                "crop_type": site.crop_type if site.site_type == SiteType.FIELD else None,
                "planting_date": site.planting_date.isoformat() if site.planting_date else None,
                # Forest-specific
                "forest_type": site.forest_type if site.site_type == SiteType.FOREST else None,
                "tree_species": site.tree_species if site.site_type == SiteType.FOREST else None,
                "protected_status": site.protected_status if site.site_type == SiteType.FOREST else None,
                "baseline_carbon": site.baseline_carbon_t_ha if site.site_type == SiteType.FOREST else None,
                "baseline_canopy": site.baseline_canopy_cover if site.site_type == SiteType.FOREST else None,
                "analyses": [
                    {
                        "type": a.analysis_type.value,
                        "mean_value": a.mean_value,
                        "min_value": a.min_value,
                        "max_value": a.max_value,
                        "interpretation": a.interpretation,
                        "date": a.created_at.isoformat(),
                        "forest_data": a.data.get("forest_data") if a.data else None
                    }
                    for a in analyses
                ],
                "alerts": [
                    {
                        "type": a.alert_type.value if a.alert_type else "general",
                        "severity": a.severity.value,
                        "title": a.title,
                        "message": a.message,
                        "date": a.created_at.isoformat()
                    }
                    for a in alerts
                ]
            }
    else:
        # Get global context (all user sites)
        result = await db.execute(
            select(Site)
            .where(Site.user_id == current_user.id)
            .order_by(Site.name)
        )
        all_sites = result.scalars().all()
        
        for s in all_sites:
            # For each site, get its latest analysis if it exists
            result = await db.execute(
                select(Analysis)
                .where(Analysis.site_id == s.id)
                .order_by(Analysis.created_at.desc())
                .limit(1)
            )
            latest_analysis = result.scalar_one_or_none()
            
            global_context.append({
                "id": s.id,
                "name": s.name,
                "type": s.site_type.value,
                "crop_or_forest": s.crop_type if s.site_type == SiteType.FIELD else s.forest_type,
                "latest_analysis": {
                    "type": latest_analysis.analysis_type.value,
                    "mean_value": latest_analysis.mean_value,
                    "date": latest_analysis.created_at.isoformat()
                } if latest_analysis else None
            })
    
    # Get or create chat history
    result = await db.execute(
        select(ChatHistory)
        .where(
            ChatHistory.user_id == current_user.id,
            ChatHistory.site_id == request.site_id
        )
        .order_by(ChatHistory.updated_at.desc())
    )
    chat_history = result.scalar_one_or_none()
    
    if not chat_history:
        chat_history = ChatHistory(
            user_id=current_user.id,
            site_id=request.site_id,
            messages=[]
        )
        db.add(chat_history)
    
    # Get AI response
    gemini = GeminiService()
    
    try:
        response = await gemini.chat(
            message=request.message,
            field_context=site_context,
            global_context=global_context,
            history=chat_history.messages[-10:]
        )
    except Exception as e:
        # Fallback response if API fails
        response = f"Sorry, I cannot respond at the moment. Error: {str(e)}"
    
    # Update chat history
    now = datetime.utcnow().isoformat()
    chat_history.messages = chat_history.messages + [
        {"role": "user", "content": request.message, "timestamp": now},
        {"role": "assistant", "content": response, "timestamp": now}
    ]
    
    await db.commit()
    
    return ChatResponse(response=response, site_context=site_context)


@router.get("/history", response_model=List[ChatHistoryResponse])
async def get_chat_history(
    site_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get chat history for current user"""
    query = select(ChatHistory).where(ChatHistory.user_id == current_user.id)
    
    if site_id is not None:
        query = query.where(ChatHistory.site_id == site_id)
    
    query = query.order_by(ChatHistory.updated_at.desc())
    
    result = await db.execute(query)
    histories = result.scalars().all()
    
    return histories


@router.delete("/history/{history_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_chat_history(
    history_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a chat history"""
    result = await db.execute(
        select(ChatHistory)
        .where(ChatHistory.id == history_id, ChatHistory.user_id == current_user.id)
    )
    history = result.scalar_one_or_none()
    
    if not history:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat history not found"
        )
    
    await db.delete(history)
    await db.commit()
