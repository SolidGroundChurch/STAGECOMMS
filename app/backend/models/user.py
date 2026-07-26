"""User connection model."""
from datetime import datetime
from sqlalchemy import Column, String, DateTime
from app.backend.database.db import Base


class User(Base):
    """Database model for user connections."""
    __tablename__ = "users"

    username = Column(String(255), primary_key=True, index=True)
    connected_at = Column(DateTime, default=datetime.utcnow)
    last_seen = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "username": self.username,
            "connected_at": self.connected_at.isoformat(),
            "last_seen": self.last_seen.isoformat(),
        }
