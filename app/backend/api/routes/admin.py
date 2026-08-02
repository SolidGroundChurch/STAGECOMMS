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
import json

router = APIRouter(prefix="/admin", tags=["admin"])


class AdminStats(BaseModel):
    """Admin statistics."""
    total_cues: int
    enabled_cues: int
    total_messages: int
    categories: List[str]


class AdminSettings(BaseModel):
    """Admin settings."""
    private_messages_enabled: bool


def get_settings_file():
    """Get path to settings file."""
    return settings.DATABASE_DIR / "admin_settings.json"


def load_admin_settings():
    """Load admin settings from file."""
    settings_file = get_settings_file()
    if settings_file.exists():
        try:
            with open(settings_file, 'r') as f:
                return json.load(f)
        except Exception:
            pass
    # Default settings
    return {"private_messages_enabled": True}


def save_admin_settings(settings_data):
    """Save admin settings to file."""
    settings_file = get_settings_file()
    settings_file.parent.mkdir(parents=True, exist_ok=True)
    with open(settings_file, 'w') as f:
        json.dump(settings_data, f)


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


@router.get("/settings", response_model=AdminSettings)
async def get_admin_settings():
    """Get admin settings."""
    settings_data = load_admin_settings()
    return AdminSettings(**settings_data)


@router.post("/settings", response_model=AdminSettings)
async def update_admin_settings(settings_update: AdminSettings):
    """Update admin settings."""
    current_settings = load_admin_settings()
    current_settings.update(settings_update.dict())
    save_admin_settings(current_settings)
    return AdminSettings(**current_settings)
