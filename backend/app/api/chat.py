"""
chat.py — Persistent AI Chat API Router
========================================
Handles chat conversation reload, message submission, response generation via
real user dashboard metrics, and message deletion/clear logs. Persistent in DB.
"""
import logging
from typing import Optional, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.history import ChatConversation, ChatMessage
from app.core.user_paths import UserPaths
from app.services import chat_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["AI Chat"])


class ChatMessageSchema(BaseModel):
    role: str  # "user" or "assistant"
    message: str
    timestamp: datetime

    class Config:
        from_attributes = True


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    success: bool
    reply: str
    suggested_questions: list[str] = []


def _get_or_create_conversation(user_id: int, db: Session) -> ChatConversation:
    conv = db.query(ChatConversation).filter(ChatConversation.user_id == user_id).first()
    if not conv:
        conv = ChatConversation(user_id=user_id)
        db.add(conv)
        db.commit()
        db.refresh(conv)
    return conv


@router.get(
    "/messages",
    response_model=list[ChatMessageSchema],
    summary="Get user conversation history"
)
async def get_chat_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        conv = _get_or_create_conversation(current_user.id, db)
        return conv.messages
    except Exception as exc:
        logger.error("Failed to load chat history: %s", exc)
        raise HTTPException(status_code=500, detail="Could not retrieve chat history.")


@router.post(
    "",
    response_model=ChatResponse,
    status_code=status.HTTP_200_OK,
    summary="Submit message and get AI consultant response"
)
async def send_chat_message(
    req: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        paths = UserPaths(current_user.id)
        conv = _get_or_create_conversation(current_user.id, db)

        # 1. Add user message
        user_msg = ChatMessage(
            conversation_id=conv.id,
            role="user",
            message=req.message
        )
        db.add(user_msg)
        db.commit()

        # Load history for context (up to last 20 messages)
        history_list = []
        for msg in conv.messages:
            history_list.append({"role": msg.role, "content": msg.message})

        # 2. Generate response using real data & context
        result = chat_service.generate_chat_response(req.message, history_list, paths)
        reply = result.get("reply", "I apologize, I could not formulate a response at this time.")
        suggested = result.get("suggested_questions", [])

        # 3. Add assistant message
        assistant_msg = ChatMessage(
            conversation_id=conv.id,
            role="assistant",
            message=reply
        )
        db.add(assistant_msg)
        db.commit()

        # 4. Cap conversation history at 20 messages
        db.refresh(conv)
        if len(conv.messages) > 20:
            excess = len(conv.messages) - 20
            # Order is ASC, so delete the first `excess` messages
            for i in range(excess):
                db.delete(conv.messages[i])
            db.commit()

        return {
            "success": True,
            "reply": reply,
            "suggested_questions": suggested
        }

    except Exception as exc:
        db.rollback()
        logger.error("Chat endpoint error: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chat execution failed: {str(exc)}"
        )


@router.delete(
    "/messages",
    status_code=status.HTTP_200_OK,
    summary="Clear conversation messages"
)
async def clear_chat_messages(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        conv = db.query(ChatConversation).filter(ChatConversation.user_id == current_user.id).first()
        if conv:
            db.delete(conv)  # Cascade will delete all messages
            db.commit()
        return {"success": True, "message": "Conversation cleared successfully"}
    except Exception as exc:
        db.rollback()
        logger.error("Failed to clear conversation: %s", exc)
        raise HTTPException(status_code=500, detail="Could not clear conversation.")
