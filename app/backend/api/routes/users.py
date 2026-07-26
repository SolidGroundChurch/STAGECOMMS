"""User endpoints."""
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.backend.database.db import get_db
from app.backend.services import UserService
from pydantic import BaseModel

router = APIRouter(prefix="/users", tags=["users"])


class UserResponse(BaseModel):
    """User response model."""
    username: str
    connected_at: str
    last_seen: str

    class Config:
        from_attributes = True


@router.get("", response_model=List[UserResponse])
async def get_users(db: Session = Depends(get_db)):
    """Get all connected users."""
    users = UserService.get_all_users(db)
    return users


@router.get("/{username}", response_model=UserResponse)
async def get_user(username: str, db: Session = Depends(get_db)):
    """Get a specific user."""
    user = UserService.get_user(db, username)
    if not user:
        return {"error": "User not found"}, 404
    return user


@router.get("/status/count")
async def get_user_count(db: Session = Depends(get_db)):
    """Get count of connected users."""
    count = UserService.count_active_users(db)
    return {"connected_users": count}
