"""WebSocket message handlers."""
import logging
import json
from typing import Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session
from app.backend.services import CueService, MessageService, UserService
from app.backend.models.cue import AudioMode

logger = logging.getLogger(__name__)


class WebSocketHandler:
    """Handle incoming WebSocket messages."""

    @staticmethod
    def create_cue_message(
        cue_id: int,
        display_name: str,
        spoken_text: str,
        audio_file: str,
        audio_mode: str,
        username: str,
    ) -> Dict[str, Any]:
        """Create a cue broadcast message."""
        return {
            "type": "cue",
            "cue_id": cue_id,
            "display_name": display_name,
            "spoken_text": spoken_text,
            "audio_file": audio_file,
            "audio_mode": audio_mode,
            "username": username,
            "timestamp": datetime.utcnow().isoformat(),
        }

    @staticmethod
    def create_custom_message(
        message_text: str,
        username: str,
        audio_mode: str = AudioMode.TTS_ONLY.value,
        tts_text: str = None,
    ) -> Dict[str, Any]:
        """Create a custom message broadcast."""
        message = {
            "type": "custom_message",
            "message_text": message_text,
            "username": username,
            "audio_mode": audio_mode,
            "timestamp": datetime.utcnow().isoformat(),
        }
        if tts_text:
            message["tts_text"] = tts_text
        return message

    @staticmethod
    def create_user_connected_message(username: str) -> Dict[str, Any]:
        """Create a user connection event."""
        return {
            "type": "user_connected",
            "username": username,
            "timestamp": datetime.utcnow().isoformat(),
        }

    @staticmethod
    def create_user_disconnected_message(username: str) -> Dict[str, Any]:
        """Create a user disconnection event."""
        return {
            "type": "user_disconnected",
            "username": username,
            "timestamp": datetime.utcnow().isoformat(),
        }

    @staticmethod
    def create_users_list_message(users: list) -> Dict[str, Any]:
        """Create a users list update message."""
        return {
            "type": "users_list",
            "users": users,
            "timestamp": datetime.utcnow().isoformat(),
        }

    @staticmethod
    def create_cues_list_message(cues: list) -> Dict[str, Any]:
        """Create a cues list message."""
        return {
            "type": "cues_list",
            "cues": cues,
            "timestamp": datetime.utcnow().isoformat(),
        }

    @staticmethod
    def create_error_message(error: str) -> Dict[str, Any]:
        """Create an error message."""
        return {
            "type": "error",
            "error": error,
            "timestamp": datetime.utcnow().isoformat(),
        }

    @staticmethod
    def create_success_message(message: str) -> Dict[str, Any]:
        """Create a success message."""
        return {
            "type": "success",
            "message": message,
            "timestamp": datetime.utcnow().isoformat(),
        }
