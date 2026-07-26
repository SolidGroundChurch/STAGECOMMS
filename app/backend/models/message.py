"""Message history model."""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime
from app.backend.database.db import Base


class Message(Base):
    """Database model for message history."""
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(255), index=True, nullable=False)
    message_text = Column(Text, nullable=False)
    audio_mode = Column(String(50), nullable=True)
    audio_file = Column(String(255), nullable=True)
    category = Column(String(50), index=True, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "id": self.id,
            "username": self.username,
            "message_text": self.message_text,
            "audio_mode": self.audio_mode,
            "audio_file": self.audio_file,
            "category": self.category,
            "timestamp": self.timestamp.isoformat(),
        }
