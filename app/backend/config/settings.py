"""Application settings and configuration."""
import os
import logging
from pathlib import Path
from typing import Optional


class Settings:
    """Application configuration."""

    # Application info
    APP_NAME: str = "StageComms"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"

    # Server settings
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))

    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "sqlite:////app/database/stagecomms.db"
    )

    # Paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    UPLOAD_DIR: Path = Path(os.getenv("UPLOAD_DIR", "/app/uploads"))
    AUDIO_DIR: Path = UPLOAD_DIR / "audio"
    LOGS_DIR: Path = Path(os.getenv("LOGS_DIR", "/app/logs"))

    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    LOG_FILE: Path = LOGS_DIR / "stagecomms.log"

    # Audio settings
    AUDIO_TEST_FILE: str = "/app/frontend/audio/test.mp3"
    AUDIO_MAX_SIZE: int = 50 * 1024 * 1024  # 50MB
    ALLOWED_AUDIO_FORMATS: list = ["mp3", "wav", "ogg", "m4a"]

    # WebSocket settings
    WEBSOCKET_HEARTBEAT_INTERVAL: int = 30  # seconds
    WEBSOCKET_TIMEOUT: int = 60  # seconds

    # Admin settings
    ADMIN_PASSWORD: Optional[str] = os.getenv("ADMIN_PASSWORD")

    @classmethod
    def setup_logging(cls) -> None:
        """Configure application logging."""
        cls.LOGS_DIR.mkdir(parents=True, exist_ok=True)

        logging.basicConfig(
            level=getattr(logging, cls.LOG_LEVEL),
            format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            handlers=[
                logging.FileHandler(cls.LOG_FILE),
                logging.StreamHandler(),
            ],
        )

    @classmethod
    def create_directories(cls) -> None:
        """Ensure all required directories exist."""
        cls.LOGS_DIR.mkdir(parents=True, exist_ok=True)
        cls.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        cls.AUDIO_DIR.mkdir(parents=True, exist_ok=True)


settings = Settings()
