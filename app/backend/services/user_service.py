"""User connection service."""
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from app.backend.models import User


class UserService:
    """Business logic for user management."""

    @staticmethod
    def get_or_create_user(db: Session, username: str) -> User:
        """Get existing user or create new one."""
        user = db.query(User).filter(User.username == username).first()
        if not user:
            user = User(username=username)
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            # Update last_seen
            user.last_seen = datetime.utcnow()
            db.commit()
            db.refresh(user)
        return user

    @staticmethod
    def get_all_users(db: Session) -> List[User]:
        """Get all connected users."""
        return db.query(User).order_by(User.connected_at.desc()).all()

    @staticmethod
    def get_user(db: Session, username: str) -> Optional[User]:
        """Get a specific user."""
        return db.query(User).filter(User.username == username).first()

    @staticmethod
    def remove_user(db: Session, username: str) -> bool:
        """Remove a user."""
        user = db.query(User).filter(User.username == username).first()
        if not user:
            return False
        db.delete(user)
        db.commit()
        return True

    @staticmethod
    def get_active_users(db: Session) -> List[User]:
        """Get all users currently connected."""
        return db.query(User).all()

    @staticmethod
    def count_active_users(db: Session) -> int:
        """Count active users."""
        return db.query(User).count()

    @staticmethod
    def update_last_seen(db: Session, username: str) -> Optional[User]:
        """Update user's last_seen timestamp."""
        user = db.query(User).filter(User.username == username).first()
        if user:
            user.last_seen = datetime.utcnow()
            db.commit()
            db.refresh(user)
        return user
