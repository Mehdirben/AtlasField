"""
Chat router - AI-powered agricultural assistant using Gemini
"""
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import User, Field, ChatHistory, Analysis
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
    field_context = None
    
    # Get field context if provided
    if request.field_id:
        result = await db.execute(
            select(Field)
            .where(Field.id == request.field_id, Field.user_id == current_user.id)
        )
        field = result.scalar_one_or_none()
        
        if field:
            # Get latest analyses for context
            result = await db.execute(
                select(Analysis)
                .where(Analysis.field_id == field.id)
                .order_by(Analysis.created_at.desc())
                .limit(5)
            )
            analyses = result.scalars().all()
            
            field_context = {
                "field_name": field.name,
                "crop_type": field.crop_type,
                "area_hectares": field.area_hectares,
                "planting_date": field.planting_date.isoformat() if field.planting_date else None,
                "analyses": [
                    {
                        "type": a.analysis_type.value,
                        "mean_value": a.mean_value,
                        "interpretation": a.interpretation,
                        "date": a.created_at.isoformat()
                    }
                    for a in analyses
                ]
            }
    
    # Get or create chat history
    result = await db.execute(
        select(ChatHistory)
        .where(
            ChatHistory.user_id == current_user.id,
            ChatHistory.field_id == request.field_id
        )
        .order_by(ChatHistory.updated_at.desc())
    )
    chat_history = result.scalar_one_or_none()
    
    if not chat_history:
        chat_history = ChatHistory(
            user_id=current_user.id,
            field_id=request.field_id,
            messages=[]
        )
        db.add(chat_history)
    
    # Get AI response
    gemini = GeminiService()
    
    try:
        response = await gemini.chat(
            message=request.message,
            field_context=field_context,
            history=chat_history.messages[-10:]  # Last 10 messages
        )
    except Exception as e:
        # Fallback response if API fails
        response = f"Je suis désolé, je ne peux pas répondre pour le moment. Erreur: {str(e)}"
    
    # Update chat history
    now = datetime.utcnow().isoformat()
    chat_history.messages = chat_history.messages + [
        {"role": "user", "content": request.message, "timestamp": now},
        {"role": "assistant", "content": response, "timestamp": now}
    ]
    
    await db.commit()
    
    return ChatResponse(response=response, field_context=field_context)


@router.get("/history", response_model=List[ChatHistoryResponse])
async def get_chat_history(
    field_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get chat history for current user"""
    query = select(ChatHistory).where(ChatHistory.user_id == current_user.id)
    
    if field_id is not None:
        query = query.where(ChatHistory.field_id == field_id)
    
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
