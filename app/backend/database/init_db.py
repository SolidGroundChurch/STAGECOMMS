"""Database initialization and seed data."""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.backend.database.db import init_db, SessionLocal
from app.backend.services import CueService


def seed_default_cues():
    """Populate database with default cues."""
    db = SessionLocal()

    try:
        # Check if cues already exist
        existing = db.query(CueService.get_all_cues(db))
        if existing:
            print("Database already has cues, skipping seed data")
            return

        # Default cues
        default_cues = [
            {
                "display_name": "GO",
                "spoken_text": "Go",
                "category": "general",
                "button_colour": "#10B981",
                "icon": "go",
                "sort_order": 0,
            },
            {
                "display_name": "Standby",
                "spoken_text": "Standby",
                "category": "general",
                "button_colour": "#F59E0B",
                "icon": "wait",
                "sort_order": 1,
            },
            {
                "display_name": "Next Speaker",
                "spoken_text": "Next Speaker",
                "category": "stage",
                "button_colour": "#3B82F6",
                "icon": "speaker",
                "sort_order": 2,
            },
            {
                "display_name": "Prayer",
                "spoken_text": "Prayer",
                "category": "stage",
                "button_colour": "#8B5CF6",
                "icon": "prayer",
                "sort_order": 3,
            },
            {
                "display_name": "Offering",
                "spoken_text": "Offering",
                "category": "stage",
                "button_colour": "#EC4899",
                "icon": "offering",
                "sort_order": 4,
            },
            {
                "display_name": "Announcements",
                "spoken_text": "Announcements",
                "category": "general",
                "button_colour": "#F97316",
                "icon": "announcement",
                "sort_order": 5,
            },
            {
                "display_name": "Start Music",
                "spoken_text": "Start Music",
                "category": "audio",
                "button_colour": "#06B6D4",
                "icon": "music",
                "sort_order": 6,
            },
            {
                "display_name": "Stop Music",
                "spoken_text": "Stop Music",
                "category": "audio",
                "button_colour": "#EF4444",
                "icon": "stop",
                "sort_order": 7,
            },
            {
                "display_name": "Lights Up",
                "spoken_text": "Lights Up",
                "category": "lighting",
                "button_colour": "#FBBF24",
                "icon": "light",
                "sort_order": 8,
            },
            {
                "display_name": "Lights Down",
                "spoken_text": "Lights Down",
                "category": "lighting",
                "button_colour": "#6B7280",
                "icon": "light",
                "sort_order": 9,
            },
            {
                "display_name": "Camera 1",
                "spoken_text": "Camera One",
                "category": "cameras",
                "button_colour": "#14B8A6",
                "icon": "camera",
                "sort_order": 10,
            },
            {
                "display_name": "Camera 2",
                "spoken_text": "Camera Two",
                "category": "cameras",
                "button_colour": "#14B8A6",
                "icon": "camera",
                "sort_order": 11,
            },
            {
                "display_name": "Wide Shot",
                "spoken_text": "Wide Shot",
                "category": "cameras",
                "button_colour": "#06B6D4",
                "icon": "camera",
                "sort_order": 12,
            },
            {
                "display_name": "Emergency Stop",
                "spoken_text": "Emergency Stop",
                "category": "emergency",
                "button_colour": "#EF4444",
                "icon": "stop",
                "sort_order": 100,
            },
        ]

        for cue_data in default_cues:
            CueService.create_cue(db, **cue_data)
            print(f"Created cue: {cue_data['display_name']}")

        print(f"Successfully seeded {len(default_cues)} default cues")

    finally:
        db.close()


if __name__ == "__main__":
    print("Initializing StageComms database...")
    init_db()
    print("Database tables created")
    seed_default_cues()
    print("Database initialization complete!")
