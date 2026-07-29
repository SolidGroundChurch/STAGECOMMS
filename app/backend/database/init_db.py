"""Database initialization and seed data."""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.backend.database.db import init_db, SessionLocal
from app.backend.services import CueService


def seed_default_cues(force: bool = False):
    """Populate database with default cues.
    
    Args:
        force: If True, re-seed even if cues already exist
    """
    db = SessionLocal()

    try:
        # Check if cues already exist
        existing = CueService.get_all_cues(db, enabled_only=False)
        if existing and not force:
            print(f"Database already has {len(existing)} cues, skipping seed data")
            return
        
        if force:
            print(f"Force re-seed: clearing {len(existing)} existing cues...")
            # Delete all existing cues
            for cue in existing:
                db.delete(cue)
            db.commit()
        
        print("No cues found in database, seeding default cues...")

        # Default cues from spreadsheet
        default_cues = [
            {
                "display_name": "Camera 1 Live",
                "spoken_text": "Camera 1 Live",
                "category": "Camera Director",
                "button_colour": "#14B8A6",
                "icon": "camera",
                "sort_order": 0,
            },
            {
                "display_name": "Camera 2 Live",
                "spoken_text": "Camera 2 Live",
                "category": "Camera Director",
                "button_colour": "#14B8A6",
                "icon": "camera",
                "sort_order": 1,
            },
            {
                "display_name": "Camera 3 Live",
                "spoken_text": "Camera 3 Live",
                "category": "Camera Director",
                "button_colour": "#14B8A6",
                "icon": "camera",
                "sort_order": 2,
            },
            {
                "display_name": "Camera 1 Focus",
                "spoken_text": "Camera 1 Check Your Focus",
                "category": "Camera Director",
                "button_colour": "#06B6D4",
                "icon": "camera",
                "sort_order": 3,
            },
            {
                "display_name": "Camera 2 Focus",
                "spoken_text": "Camera 2 Check Your Focus",
                "category": "Camera Director",
                "button_colour": "#06B6D4",
                "icon": "camera",
                "sort_order": 4,
            },
            {
                "display_name": "Camera 3 Focus",
                "spoken_text": "Camera 3 Check your focus",
                "category": "Camera Director",
                "button_colour": "#06B6D4",
                "icon": "camera",
                "sort_order": 5,
            },
            {
                "display_name": "Camera 1 Close",
                "spoken_text": "Camera 1 Frame for a closeup shot",
                "category": "Camera Director",
                "button_colour": "#F59E0B",
                "icon": "camera",
                "sort_order": 6,
            },
            {
                "display_name": "Camera 2 Close",
                "spoken_text": "Camera 2 Frame for a closeup shot",
                "category": "Camera Director",
                "button_colour": "#F59E0B",
                "icon": "camera",
                "sort_order": 7,
            },
            {
                "display_name": "Camera 1 Full",
                "spoken_text": "Camera 1 Frame for a full shot, Head to toe",
                "category": "Camera Director",
                "button_colour": "#FBBF24",
                "icon": "camera",
                "sort_order": 8,
            },
            {
                "display_name": "Camera 2 Full",
                "spoken_text": "Camera 2 Frame for a full shot, head to toe",
                "category": "Camera Director",
                "button_colour": "#FBBF24",
                "icon": "camera",
                "sort_order": 9,
            },
            {
                "display_name": "Camera 1 Center",
                "spoken_text": "Camera 1 Keep the subject in the center of your frame",
                "category": "Camera Director",
                "button_colour": "#3B82F6",
                "icon": "camera",
                "sort_order": 10,
            },
            {
                "display_name": "Camera 2 Center",
                "spoken_text": "Camera 2 Keep the subject in the center of your frame",
                "category": "Camera Director",
                "button_colour": "#3B82F6",
                "icon": "camera",
                "sort_order": 11,
            },
            {
                "display_name": "Camera 1 - Headroom",
                "spoken_text": "Camera 1 Check your headroom",
                "category": "Camera Director",
                "button_colour": "#8B5CF6",
                "icon": "camera",
                "sort_order": 12,
            },
            {
                "display_name": "Camera 2 - Headroom",
                "spoken_text": "camera 2 Check your headroom",
                "category": "Camera Director",
                "button_colour": "#8B5CF6",
                "icon": "camera",
                "sort_order": 13,
            },
            {
                "display_name": "Camera 3 - Headroom",
                "spoken_text": "Camera 2 Check your headroom",
                "category": "Camera Director",
                "button_colour": "#8B5CF6",
                "icon": "camera",
                "sort_order": 14,
            },
            {
                "display_name": "Camera 1 - Footroom",
                "spoken_text": "Camera 1 Check your footroom",
                "category": "Camera Director",
                "button_colour": "#8B5CF6",
                "icon": "camera",
                "sort_order": 15,
            },
            {
                "display_name": "Camera 2 - Footroom",
                "spoken_text": "Camera 2 Check your footroom",
                "category": "Camera Director",
                "button_colour": "#8B5CF6",
                "icon": "camera",
                "sort_order": 16,
            },
            {
                "display_name": "Host 1 Going on",
                "spoken_text": "Host 1 mic is on",
                "category": "Stage manager",
                "button_colour": "#A855F7",
                "icon": "speaker",
                "sort_order": 17,
            },
            {
                "display_name": "Host 2 Going on",
                "spoken_text": "Host 2 mic is on",
                "category": "Stage manager",
                "button_colour": "#A855F7",
                "icon": "speaker",
                "sort_order": 18,
            },
        ]

        for cue_data in default_cues:
            CueService.create_cue(db, **cue_data)
            print(f"Created cue: {cue_data['display_name']}")

        print(f"Successfully seeded {len(default_cues)} default cues")

    finally:
        db.close()


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Initialize StageComms database")
    parser.add_argument("--force", action="store_true", help="Force re-seed of default cues")
    args = parser.parse_args()
    
    print("Initializing StageComms database...")
    init_db()
    print("Database tables created")
    seed_default_cues(force=args.force)
    print("Database initialization complete!")
