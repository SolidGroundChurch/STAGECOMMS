"""Cue management service."""
from typing import List, Optional
from sqlalchemy.orm import Session
from app.backend.models import Cue
from app.backend.models.cue import AudioMode


class CueService:
    """Business logic for cue management."""

    @staticmethod
    def get_all_cues(db: Session, enabled_only: bool = True) -> List[Cue]:
        """Get all cues, optionally filtered to enabled only."""
        query = db.query(Cue)
        if enabled_only:
            query = query.filter(Cue.enabled == True)
        return query.order_by(Cue.sort_order, Cue.id).all()

    @staticmethod
    def get_cue_by_id(db: Session, cue_id: int) -> Optional[Cue]:
        """Get a specific cue by ID."""
        return db.query(Cue).filter(Cue.id == cue_id).first()

    @staticmethod
    def create_cue(
        db: Session,
        display_name: str,
        spoken_text: Optional[str] = None,
        audio_file: Optional[str] = None,
        audio_mode: str = AudioMode.AUTOMATIC.value,
        button_colour: str = "#3B82F6",
        icon: str = "bell",
        category: str = "general",
        sort_order: int = 0,
        enabled: bool = True,
    ) -> Cue:
        """Create a new cue."""
        cue = Cue(
            display_name=display_name,
            spoken_text=spoken_text,
            audio_file=audio_file,
            audio_mode=AudioMode(audio_mode),
            button_colour=button_colour,
            icon=icon,
            category=category,
            sort_order=sort_order,
            enabled=enabled,
        )
        db.add(cue)
        db.commit()
        db.refresh(cue)
        return cue

    @staticmethod
    def update_cue(db: Session, cue_id: int, **kwargs) -> Optional[Cue]:
        """Update an existing cue."""
        cue = db.query(Cue).filter(Cue.id == cue_id).first()
        if not cue:
            return None

        # Handle audio_mode enum conversion
        if "audio_mode" in kwargs and isinstance(kwargs["audio_mode"], str):
            kwargs["audio_mode"] = AudioMode(kwargs["audio_mode"])

        for key, value in kwargs.items():
            if hasattr(cue, key):
                setattr(cue, key, value)

        db.commit()
        db.refresh(cue)
        return cue

    @staticmethod
    def delete_cue(db: Session, cue_id: int) -> bool:
        """Delete a cue."""
        cue = db.query(Cue).filter(Cue.id == cue_id).first()
        if not cue:
            return False
        db.delete(cue)
        db.commit()
        return True

    @staticmethod
    def reorder_cues(db: Session, cue_order: List[int]) -> bool:
        """Reorder cues by updating their sort_order field."""
        try:
            for index, cue_id in enumerate(cue_order):
                cue = db.query(Cue).filter(Cue.id == cue_id).first()
                if cue:
                    cue.sort_order = index
            db.commit()
            return True
        except Exception:
            db.rollback()
            return False

    @staticmethod
    def get_cues_by_category(
        db: Session, category: str, enabled_only: bool = True
    ) -> List[Cue]:
        """Get cues filtered by category."""
        query = db.query(Cue).filter(Cue.category == category)
        if enabled_only:
            query = query.filter(Cue.enabled == True)
        return query.order_by(Cue.sort_order, Cue.id).all()

    @staticmethod
    def get_categories(db: Session) -> List[str]:
        """Get all unique categories."""
        categories = db.query(Cue.category).distinct().all()
        return [cat[0] for cat in categories if cat[0]]
