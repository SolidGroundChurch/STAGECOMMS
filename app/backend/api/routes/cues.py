"""Cue management endpoints."""
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from app.backend.database.db import get_db
from app.backend.services import CueService
from app.backend.models.cue import AudioMode
from app.backend.config import settings
import shutil
from pathlib import Path
from pydantic import BaseModel

router = APIRouter(prefix="/cues", tags=["cues"])


class CueResponse(BaseModel):
    """Cue response model."""
    id: int
    display_name: str
    spoken_text: Optional[str]
    audio_file: Optional[str]
    audio_mode: str
    button_colour: str
    icon: str
    category: str
    sort_order: int
    enabled: bool
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class CreateCueRequest(BaseModel):
    """Request model for creating a cue."""
    display_name: str
    spoken_text: Optional[str] = None
    audio_file: Optional[str] = None
    audio_mode: str = AudioMode.AUTOMATIC.value
    button_colour: str = "#3B82F6"
    icon: str = "bell"
    category: str = "general"
    sort_order: int = 0
    enabled: bool = True


class UpdateCueRequest(BaseModel):
    """Request model for updating a cue."""
    display_name: Optional[str] = None
    spoken_text: Optional[str] = None
    audio_file: Optional[str] = None
    audio_mode: Optional[str] = None
    button_colour: Optional[str] = None
    icon: Optional[str] = None
    category: Optional[str] = None
    sort_order: Optional[int] = None
    enabled: Optional[bool] = None


@router.get("", response_model=List[CueResponse])
async def get_cues(
    enabled_only: bool = Query(True),
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Get all cues."""
    if category:
        cues = CueService.get_cues_by_category(db, category, enabled_only)
    else:
        cues = CueService.get_all_cues(db, enabled_only)
    return cues


@router.get("/categories")
async def get_categories(db: Session = Depends(get_db)):
    """Get all cue categories."""
    categories = CueService.get_categories(db)
    return {"categories": categories}


@router.get("/{cue_id}", response_model=CueResponse)
async def get_cue(cue_id: int, db: Session = Depends(get_db)):
    """Get a specific cue."""
    cue = CueService.get_cue_by_id(db, cue_id)
    if not cue:
        raise HTTPException(status_code=404, detail="Cue not found")
    return cue


@router.post("", response_model=CueResponse)
async def create_cue(
    request: CreateCueRequest,
    db: Session = Depends(get_db),
):
    """Create a new cue."""
    cue = CueService.create_cue(
        db,
        display_name=request.display_name,
        spoken_text=request.spoken_text,
        audio_file=request.audio_file,
        audio_mode=request.audio_mode,
        button_colour=request.button_colour,
        icon=request.icon,
        category=request.category,
        sort_order=request.sort_order,
        enabled=request.enabled,
    )
    return cue


@router.put("/{cue_id}", response_model=CueResponse)
async def update_cue(
    cue_id: int,
    request: UpdateCueRequest,
    db: Session = Depends(get_db),
):
    """Update an existing cue."""
    cue = CueService.update_cue(
        db,
        cue_id,
        **request.model_dump(exclude_unset=True),
    )
    if not cue:
        raise HTTPException(status_code=404, detail="Cue not found")
    return cue


@router.delete("/{cue_id}")
async def delete_cue(cue_id: int, db: Session = Depends(get_db)):
    """Delete a cue."""
    success = CueService.delete_cue(db, cue_id)
    if not success:
        raise HTTPException(status_code=404, detail="Cue not found")
    return {"status": "deleted"}


@router.post("/order")
async def reorder_cues(
    request: dict,
    db: Session = Depends(get_db),
):
    """Reorder cues by providing list of cue IDs in desired order."""
    cue_order = request.get("cue_ids", [])
    success = CueService.reorder_cues(db, cue_order)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to reorder cues")
    return {"status": "reordered"}


@router.post("/{cue_id}/audio")
async def upload_cue_audio(
    cue_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """Upload audio file for a cue."""
    cue = CueService.get_cue_by_id(db, cue_id)
    if not cue:
        raise HTTPException(status_code=404, detail="Cue not found")

    # Validate file type
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename")

    ext = Path(file.filename).suffix.lower().lstrip(".")
    if ext not in settings.ALLOWED_AUDIO_FORMATS:
        raise HTTPException(
            status_code=400,
            detail=f"File type not allowed. Allowed: {settings.ALLOWED_AUDIO_FORMATS}",
        )

    # Save file
    settings.AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"cue_{cue_id}.{ext}"
    filepath = settings.AUDIO_DIR / filename

    try:
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Update cue with audio file
        CueService.update_cue(db, cue_id, audio_file=filename)

        return {"status": "uploaded", "filename": filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.delete("/{cue_id}/audio")
async def delete_cue_audio(
    cue_id: int,
    db: Session = Depends(get_db),
):
    """Delete audio file for a cue."""
    cue = CueService.get_cue_by_id(db, cue_id)
    if not cue:
        raise HTTPException(status_code=404, detail="Cue not found")

    if cue.audio_file:
        filepath = settings.AUDIO_DIR / cue.audio_file
        if filepath.exists():
            filepath.unlink()

    CueService.update_cue(db, cue_id, audio_file=None)
    return {"status": "deleted"}
