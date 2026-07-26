"""WebSocket connection management."""
import logging
import json
from typing import List, Dict, Any, Set
from datetime import datetime
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manage multiple WebSocket connections."""

    def __init__(self):
        """Initialize connection manager."""
        self.active_connections: Dict[str, List[WebSocket]] = {}
        self.user_connection_map: Dict[str, str] = {}  # ws_id -> username

    def _get_ws_id(self, websocket: WebSocket) -> str:
        """Generate unique ID for WebSocket."""
        return id(websocket)

    async def connect(self, websocket: WebSocket, username: str) -> None:
        """Register a new WebSocket connection."""
        await websocket.accept()
        
        ws_id = self._get_ws_id(websocket)
        self.user_connection_map[ws_id] = username
        
        if username not in self.active_connections:
            self.active_connections[username] = []
        
        self.active_connections[username].append(websocket)
        logger.info(f"User '{username}' connected. Total connections: {self.count_connections()}")

    def disconnect(self, websocket: WebSocket) -> str:
        """Unregister a WebSocket connection. Returns username."""
        ws_id = self._get_ws_id(websocket)
        username = self.user_connection_map.pop(ws_id, None)
        
        if username and username in self.active_connections:
            try:
                self.active_connections[username].remove(websocket)
                if not self.active_connections[username]:
                    del self.active_connections[username]
            except ValueError:
                pass
        
        if username:
            logger.info(f"User '{username}' disconnected. Total connections: {self.count_connections()}")
        
        return username

    async def broadcast(self, message: Dict[str, Any]) -> None:
        """Broadcast message to all connected clients."""
        disconnected = []
        
        for username, connections in self.active_connections.items():
            for connection in connections[:]:  # Copy list to avoid modification issues
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error sending to {username}: {e}")
                    disconnected.append((username, connection))
        
        # Clean up disconnected connections
        for username, connection in disconnected:
            if username in self.active_connections:
                try:
                    self.active_connections[username].remove(connection)
                    if not self.active_connections[username]:
                        del self.active_connections[username]
                except ValueError:
                    pass

    async def send_personal(self, websocket: WebSocket, message: Dict[str, Any]) -> bool:
        """Send message to specific connection."""
        try:
            await websocket.send_json(message)
            return True
        except Exception as e:
            logger.error(f"Error sending personal message: {e}")
            return False

    def get_connected_users(self) -> List[str]:
        """Get list of currently connected usernames."""
        return list(self.active_connections.keys())

    def get_user_connection_count(self, username: str) -> int:
        """Get number of connections for a user."""
        return len(self.active_connections.get(username, []))

    def count_connections(self) -> int:
        """Get total number of active connections."""
        return sum(len(conns) for conns in self.active_connections.values())

    def is_user_connected(self, username: str) -> bool:
        """Check if a user is currently connected."""
        return username in self.active_connections

    async def close_all(self) -> None:
        """Close all connections gracefully."""
        for username, connections in self.active_connections.items():
            for connection in connections:
                try:
                    await connection.close()
                except Exception as e:
                    logger.error(f"Error closing connection for {username}: {e}")
        
        self.active_connections.clear()
        self.user_connection_map.clear()
        logger.info("All WebSocket connections closed")
