"""Health check endpoints."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.backend.database.db import get_db
from app.backend.config import settings

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check():
    """Basic health check."""
    return {
        "status": "ok",
        "version": settings.APP_VERSION,
        "app_name": settings.APP_NAME,
    }


@router.get("/health/db")
async def health_check_db(db: Session = Depends(get_db)):
    """Health check including database connectivity."""
    try:
        # Simple query to verify database works
        db.execute("SELECT 1")
        return {
            "status": "ok",
            "database": "connected",
            "version": settings.APP_VERSION,
        }
    except Exception as e:
        return {
            "status": "error",
            "database": "disconnected",
            "error": str(e),
        }, 503
