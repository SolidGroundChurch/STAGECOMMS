"""Message history endpoints."""
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.backend.database.db import get_db
from app.backend.services import MessageService
from pydantic import BaseModel

router = APIRouter(prefix="/messages", tags=["messages"])


class MessageResponse(BaseModel):
    """Message response model."""
    id: int
    username: str
    message_text: str
    audio_mode: Optional[str]
    audio_file: Optional[str]
    category: Optional[str]
    timestamp: str

    class Config:
        from_attributes = True


@router.get("", response_model=List[MessageResponse])
async def get_messages(
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    """Get recent messages."""
    messages = MessageService.get_recent_messages(db, limit)
    return messages[::-1]  # Reverse to get oldest first


@router.get("/user/{username}", response_model=List[MessageResponse])
async def get_user_messages(
    username: str,
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """Get messages from specific user."""
    messages = MessageService.get_messages_by_username(db, username, limit)
    return messages[::-1]


@router.get("/category/{category}", response_model=List[MessageResponse])
async def get_category_messages(
    category: str,
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """Get messages from specific category."""
    messages = MessageService.get_messages_by_category(db, category, limit)
    return messages[::-1]


@router.get("/search/", response_model=List[MessageResponse])
async def search_messages(
    q: str = Query(..., min_length=1),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """Search messages by text."""
    messages = MessageService.search_messages(db, q, limit)
    return messages[::-1]


@router.delete("/{message_id}")
async def delete_message(message_id: int, db: Session = Depends(get_db)):
    """Delete a specific message."""
    success = MessageService.delete_message(db, message_id)
    if not success:
        return {"error": "Message not found"}, 404
    return {"status": "deleted"}
