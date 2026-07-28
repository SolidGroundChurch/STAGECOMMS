"""Message history service."""
from typing import List, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.backend.models import Message


class MessageService:
    """Business logic for message history management."""

    @staticmethod
    def create_message(
        db: Session,
        username: str,
        message_text: str,
        audio_mode: Optional[str] = None,
        audio_file: Optional[str] = None,
        category: Optional[str] = None,
    ) -> Message:
        """Create a new message in history."""
        message = Message(
            username=username,
            message_text=message_text,
            audio_mode=audio_mode,
            audio_file=audio_file,
            category=category,
        )
        db.add(message)
        db.commit()
        db.refresh(message)
        return message

    @staticmethod
    def get_recent_messages(db: Session, limit: int = 100) -> List[Message]:
        """Get recent messages, newest first."""
        return (
            db.query(Message)
            .order_by(Message.timestamp.desc())
            .limit(limit)
            .all()
        )

    @staticmethod
    def get_messages_by_username(
        db: Session, username: str, limit: int = 50
    ) -> List[Message]:
        """Get messages from a specific user."""
        return (
            db.query(Message)
            .filter(Message.username == username)
            .order_by(Message.timestamp.desc())
            .limit(limit)
            .all()
        )

    @staticmethod
    def get_messages_by_category(
        db: Session, category: str, limit: int = 50
    ) -> List[Message]:
        """Get messages from a specific category."""
        return (
            db.query(Message)
            .filter(Message.category == category)
            .order_by(Message.timestamp.desc())
            .limit(limit)
            .all()
        )

    @staticmethod
    def search_messages(db: Session, query: str, limit: int = 50) -> List[Message]:
        """Search messages by text."""
        return (
            db.query(Message)
            .filter(Message.message_text.ilike(f"%{query}%"))
            .order_by(Message.timestamp.desc())
            .limit(limit)
            .all()
        )

    @staticmethod
    def get_messages_since(
        db: Session, minutes: int = 60, limit: int = 100
    ) -> List[Message]:
        """Get messages from the last N minutes."""
        since = datetime.utcnow() - timedelta(minutes=minutes)
        return (
            db.query(Message)
            .filter(Message.timestamp >= since)
            .order_by(Message.timestamp.desc())
            .limit(limit)
            .all()
        )

    @staticmethod
    def delete_message(db: Session, message_id: int) -> bool:
        """Delete a message."""
        message = db.query(Message).filter(Message.id == message_id).first()
        if not message:
            return False
        db.delete(message)
        db.commit()
        return True

    @staticmethod
    def clear_old_messages(db: Session, days: int = 30) -> int:
        """Delete messages older than N days. Returns count deleted."""
        cutoff = datetime.utcnow() - timedelta(days=days)
        deleted = (
            db.query(Message)
            .filter(Message.timestamp < cutoff)
            .delete()
        )
        db.commit()
        return deleted

    @staticmethod
    def get_message_count(db: Session) -> int:
        """Return total number of stored messages."""
        return db.query(Message).count()
