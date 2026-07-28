"""Admin endpoints for cue management."""
from pathlib import Path
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.backend.database.db import get_db
from app.backend.services import CueService, MessageService
from app.backend.config import settings
from pydantic import BaseModel
import os

router = APIRouter(prefix="/admin", tags=["admin"])


class AdminStats(BaseModel):
    """Admin statistics."""
    total_cues: int
    enabled_cues: int
    total_messages: int
    categories: List[str]


@router.get("/stats", response_model=AdminStats)
async def get_stats(db: Session = Depends(get_db)):
    """Get admin statistics."""
    cues = CueService.get_all_cues(db, enabled_only=False)
    categories = CueService.get_categories(db)
    total_messages = MessageService.get_message_count(db)
    return {
        "total_cues": len(cues),
        "enabled_cues": len([c for c in cues if c.enabled]),
        "total_messages": total_messages,
        "categories": categories,
    }


@router.post("/backup")
async def create_backup():
    """Create database backup."""
    try:
        import shutil
        from datetime import datetime

        db_file = settings.DATABASE_DIR / "stagecomms.db"
        if db_file.exists():
            backup_dir = settings.DATABASE_DIR / "backups"
            backup_dir.mkdir(parents=True, exist_ok=True)

            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            backup_file = backup_dir / f"stagecomms_backup_{timestamp}.db"

            shutil.copy2(db_file, backup_file)
            return {
                "status": "backed up",
                "backup_file": str(backup_file),
            }
        else:
            raise HTTPException(status_code=404, detail="Database not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backup failed: {str(e)}")


@router.get("/check")
async def admin_health_check():
    """Admin health check."""
    return {
        "status": "ok",
        "admin_interface": "available",
    }
