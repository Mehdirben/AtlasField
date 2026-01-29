"""
Chat router - AI-powered assistant using Gemini for agriculture and forestry
"""
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import User, Site, ChatHistory, Analysis, SiteType
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
    site_context = None
    
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
                .limit(5)
            )
            analyses = result.scalars().all()
            
            site_context = {
                "site_name": site.name,
                "site_type": site.site_type.value,
                "area_hectares": site.area_hectares,
                # Field-specific
                "crop_type": site.crop_type if site.site_type == SiteType.FIELD else None,
                "planting_date": site.planting_date.isoformat() if site.planting_date else None,
                # Forest-specific
                "forest_type": site.forest_type if site.site_type == SiteType.FOREST else None,
                "tree_species": site.tree_species if site.site_type == SiteType.FOREST else None,
                "protected_status": site.protected_status if site.site_type == SiteType.FOREST else None,
                "analyses": [
                    {
                        "type": a.analysis_type.value,
                        "mean_value": a.mean_value,
                        "interpretation": a.interpretation,
                        "date": a.created_at.isoformat(),
                        # Include forest data if available
                        "forest_data": a.data.get("forest_data") if a.data else None
                    }
                    for a in analyses
                ]
            }
    
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
            field_context=site_context,  # Keep param name for compatibility
            history=chat_history.messages[-10:]  # Last 10 messages
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
