"""Main FastAPI application."""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, Depends, HTTPException, status
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.backend.config import settings
from app.backend.database.db import init_db, get_db
from app.backend.websocket import ConnectionManager, WebSocketHandler
from app.backend.services import UserService, MessageService, CueService
from app.backend.api.routes import health, cues, users, messages, admin

# Configure logging
settings.setup_logging()
logger = logging.getLogger(__name__)

# Create directories
settings.create_directories()

# Initialize database
init_db()

# Global WebSocket manager
manager = ConnectionManager()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    logger.info("StageComms starting up...")
    yield
    logger.info("StageComms shutting down...")
    await manager.close_all()


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Church production communication system",
    lifespan=lifespan,
)

# Mount static files (for PWA, CSS, JS, icons)
try:
    app.mount("/static", StaticFiles(directory=settings.BASE_DIR / "static"), name="static")
except Exception as e:
    logger.warning(f"Could not mount static files: {e}")

# Include routers
app.include_router(health.router)
app.include_router(cues.router)
app.include_router(users.router)
app.include_router(messages.router)
app.include_router(admin.router)


@app.get("/")
async def root():
    """Serve index.html."""
    index_path = settings.BASE_DIR / "templates" / "index.html"
    if index_path.exists():
        return FileResponse(index_path)
    return {"message": "StageComms API - Open /docs for API documentation"}


@app.get("/admin")
async def admin_panel():
    """Serve admin panel."""
    admin_path = settings.BASE_DIR / "templates" / "admin.html"
    if admin_path.exists():
        return FileResponse(admin_path)
    return {"error": "Admin panel not found"}, 404


@app.websocket("/ws/{username}")
async def websocket_endpoint(websocket: WebSocket, username: str, db: Session = Depends(get_db)):
    """
    WebSocket endpoint for real-time communication.
    
    Messages are expected to be JSON with a 'type' field.
    Supported types:
    - "ping": Keep-alive
    - "cue": Send cue broadcast
    - "custom_message": Send custom text message
    """
    # Clean up username
    username = username.strip()
    if not username or len(username) > 255:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await manager.connect(websocket, username)

    # Get or create user in database
    UserService.get_or_create_user(db, username)

    try:
        # Broadcast user connected
        connected_msg = WebSocketHandler.create_user_connected_message(username)
        await manager.broadcast(connected_msg)

        # Send current users list to all clients
        all_users = UserService.get_all_users(db)
        users_list = [u.to_dict() for u in all_users]
        users_msg = WebSocketHandler.create_users_list_message(users_list)
        await manager.broadcast(users_msg)

        # Send all cues to the connecting client
        all_cues = CueService.get_all_cues(db, enabled_only=True)
        cues_list = [c.to_dict() for c in all_cues]
        cues_msg = WebSocketHandler.create_cues_list_message(cues_list)
        await manager.send_personal(websocket, cues_msg)

        # Keep connection alive and handle incoming messages
        while True:
            data = await websocket.receive_json()

            message_type = data.get("type", "").lower()

            if message_type == "ping":
                # Keep-alive heartbeat
                UserService.update_last_seen(db, username)

            elif message_type == "cue":
                # Broadcast a cue
                cue_id = data.get("cue_id")
                if cue_id:
                    cue = CueService.get_cue_by_id(db, cue_id)
                    if cue and cue.enabled:
                        # Create and broadcast cue message
                        cue_msg = WebSocketHandler.create_cue_message(
                            cue_id=cue.id,
                            display_name=cue.display_name,
                            spoken_text=cue.get_spoken_text(),
                            audio_file=cue.audio_file or "",
                            audio_mode=cue.audio_mode.value,
                            username=username,
                        )
                        await manager.broadcast(cue_msg)

                        # Store in message history
                        MessageService.create_message(
                            db,
                            username=username,
                            message_text=cue.display_name,
                            audio_mode=cue.audio_mode.value,
                            audio_file=cue.audio_file,
                            category=cue.category,
                        )

            elif message_type == "custom_message":
                # Broadcast custom text message
                text = data.get("message_text", "").strip()
                if text and len(text) <= 500:
                    custom_msg = WebSocketHandler.create_custom_message(
                        message_text=text,
                        username=username,
                    )
                    await manager.broadcast(custom_msg)

                    # Store in message history
                    MessageService.create_message(
                        db,
                        username=username,
                        message_text=text,
                        audio_mode="tts_only",
                        category="custom",
                    )

    except Exception as e:
        logger.error(f"WebSocket error for {username}: {e}")

    finally:
        # Handle disconnection
        disconnected_user = manager.disconnect(websocket)

        if disconnected_user:
            # Broadcast user disconnected
            disconnected_msg = WebSocketHandler.create_user_disconnected_message(
                disconnected_user
            )
            await manager.broadcast(disconnected_msg)

            # Remove user from database
            UserService.remove_user(db, disconnected_user)

            # Send updated users list
            all_users = UserService.get_all_users(db)
            users_list = [u.to_dict() for u in all_users]
            users_msg = WebSocketHandler.create_users_list_message(users_list)
            await manager.broadcast(users_msg)

            logger.info(f"User {disconnected_user} disconnected")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host=settings.HOST,
        port=settings.PORT,
        log_level=settings.LOG_LEVEL.lower(),
    )
