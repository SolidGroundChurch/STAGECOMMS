"""Cue model for broadcast messages."""
from datetime import datetime
from enum import Enum
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Enum as SQLEnum
from app.backend.database.db import Base


class AudioMode(str, Enum):
    """Audio playback modes."""
    AUTOMATIC = "automatic"
    MP3_ONLY = "mp3_only"
    TTS_ONLY = "tts_only"
    SILENT = "silent"


class Cue(Base):
    """Database model for cues."""
    __tablename__ = "cues"

    id = Column(Integer, primary_key=True, index=True)
    display_name = Column(String(255), index=True, nullable=False)
    spoken_text = Column(Text, nullable=True)
    audio_file = Column(String(255), nullable=True)
    audio_mode = Column(SQLEnum(AudioMode), default=AudioMode.AUTOMATIC)
    button_colour = Column(String(7), default="#3B82F6")  # Hex color
    icon = Column(String(50), default="bell")
    category = Column(String(50), default="general", index=True)
    sort_order = Column(Integer, default=0)
    enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def get_spoken_text(self) -> str:
        """Get the text to be spoken. Falls back to display_name if spoken_text is blank."""
        return self.spoken_text if self.spoken_text else self.display_name

    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "id": self.id,
            "display_name": self.display_name,
            "spoken_text": self.spoken_text,
            "audio_file": self.audio_file,
            "audio_mode": self.audio_mode.value,
            "button_colour": self.button_colour,
            "icon": self.icon,
            "category": self.category,
            "sort_order": self.sort_order,
            "enabled": self.enabled,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
