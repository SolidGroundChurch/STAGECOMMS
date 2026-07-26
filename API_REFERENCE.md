# API Reference

Complete REST API documentation for StageComms.

## Base URL

```
http://localhost:8000/api
```

## Authentication

No authentication required. System assumes trusted local network.

## Response Format

All responses are JSON.

### Success Response
```json
{
    "status": "ok",
    "data": {}
}
```

### Error Response
```json
{
    "status": "error",
    "error": "Error message",
    "detail": "Additional details"
}
```

---

## Endpoints

### Health Checks

#### GET /health
Basic health check.

**Response:**
```json
{
    "status": "ok",
    "version": "1.0.0",
    "app_name": "StageComms"
}
```

#### GET /health/db
Database connectivity check.

**Response:**
```json
{
    "status": "ok",
    "database": "connected",
    "version": "1.0.0"
}
```

---

## Cues API

### GET /api/cues
List all cues.

**Query Parameters:**
- `enabled_only` (boolean, default: true) - Only return enabled cues
- `category` (string, optional) - Filter by category

**Response:**
```json
[
    {
        "id": 1,
        "display_name": "GO",
        "spoken_text": "Go",
        "audio_file": "cue_1.mp3",
        "audio_mode": "automatic",
        "button_colour": "#10B981",
        "icon": "go",
        "category": "general",
        "sort_order": 0,
        "enabled": true,
        "created_at": "2024-01-01T12:00:00",
        "updated_at": "2024-01-01T12:00:00"
    }
]
```

### GET /api/cues/{cue_id}
Get a specific cue.

**Response:** Single cue object (see above)

### POST /api/cues
Create a new cue.

**Request Body:**
```json
{
    "display_name": "New Cue",
    "spoken_text": "New Cue Text",
    "audio_file": null,
    "audio_mode": "automatic",
    "button_colour": "#3B82F6",
    "icon": "bell",
    "category": "general",
    "sort_order": 100,
    "enabled": true
}
```

**Response:** Created cue object

### PUT /api/cues/{cue_id}
Update an existing cue.

**Request Body:** (partial update, only include fields to change)
```json
{
    "display_name": "Updated Name",
    "button_colour": "#FF0000"
}
```

**Response:** Updated cue object

### DELETE /api/cues/{cue_id}
Delete a cue.

**Response:**
```json
{
    "status": "deleted"
}
```

### POST /api/cues/{cue_id}/audio
Upload audio file for a cue.

**Request:**
- Content-Type: multipart/form-data
- Parameter: `file` (audio file)

**Response:**
```json
{
    "status": "uploaded",
    "filename": "cue_1.mp3"
}
```

### DELETE /api/cues/{cue_id}/audio
Delete audio file for a cue.

**Response:**
```json
{
    "status": "deleted"
}
```

### GET /api/cues/categories
Get all unique cue categories.

**Response:**
```json
{
    "categories": ["general", "stage", "audio", "lighting", "cameras"]
}
```

### POST /api/cues/order
Reorder cues.

**Request Body:**
```json
{
    "cue_ids": [1, 3, 2, 5, 4]
}
```

**Response:**
```json
{
    "status": "reordered"
}
```

---

## Users API

### GET /api/users
List all connected users.

**Response:**
```json
[
    {
        "username": "Camera 1",
        "connected_at": "2024-01-01T12:00:00",
        "last_seen": "2024-01-01T12:05:30"
    }
]
```

### GET /api/users/{username}
Get specific user.

**Response:** Single user object (see above)

### GET /api/users/status/count
Get count of connected users.

**Response:**
```json
{
    "connected_users": 5
}
```

---

## Messages API

### GET /api/messages
Get recent messages (message history).

**Query Parameters:**
- `limit` (integer, default: 100, max: 1000) - Number of messages to return

**Response:**
```json
[
    {
        "id": 42,
        "username": "Camera 1",
        "message_text": "Next Speaker",
        "audio_mode": "automatic",
        "audio_file": "cue_1.mp3",
        "category": "stage",
        "timestamp": "2024-01-01T12:05:30"
    }
]
```

Messages returned in chronological order (oldest first).

### GET /api/messages/user/{username}
Get messages from specific user.

**Query Parameters:**
- `limit` (integer, default: 50, max: 500)

**Response:** Array of message objects

### GET /api/messages/category/{category}
Get messages from specific category.

**Query Parameters:**
- `limit` (integer, default: 50, max: 500)

**Response:** Array of message objects

### GET /api/messages/search
Search messages by text.

**Query Parameters:**
- `q` (string, required) - Search query
- `limit` (integer, default: 50, max: 500)

**Response:** Array of matching message objects

### DELETE /api/messages/{message_id}
Delete a specific message.

**Response:**
```json
{
    "status": "deleted"
}
```

---

## Admin API

### GET /api/admin/stats
Get system statistics.

**Response:**
```json
{
    "total_cues": 15,
    "enabled_cues": 14,
    "categories": ["general", "stage", "audio", "lighting"]
}
```

### POST /api/admin/backup
Create database backup.

**Response:**
```json
{
    "status": "backed up",
    "backup_file": "/app/database/backups/stagecomms_backup_20240101_120530.db"
}
```

### GET /api/admin/check
Admin health check.

**Response:**
```json
{
    "status": "ok",
    "admin_interface": "available"
}
```

---

## WebSocket API

### Connection

```
ws://localhost:8000/ws/{username}
```

Replace `{username}` with the user's display name (URL-encoded).

### Message Types

#### Ping (Keep-Alive)
```json
{
    "type": "ping"
}
```

Response: None (heartbeat)

#### Send Cue
```json
{
    "type": "cue",
    "cue_id": 1
}
```

Server broadcasts:
```json
{
    "type": "cue",
    "cue_id": 1,
    "display_name": "GO",
    "spoken_text": "Go",
    "audio_file": "cue_1.mp3",
    "audio_mode": "automatic",
    "username": "Camera 1",
    "timestamp": "2024-01-01T12:05:30"
}
```

#### Send Custom Message
```json
{
    "type": "custom_message",
    "message_text": "Everyone standby"
}
```

Server broadcasts:
```json
{
    "type": "custom_message",
    "message_text": "Everyone standby",
    "username": "Camera 1",
    "audio_mode": "tts_only",
    "timestamp": "2024-01-01T12:05:30"
}
```

#### User Connected
Server broadcasts when user connects:
```json
{
    "type": "user_connected",
    "username": "Sound",
    "timestamp": "2024-01-01T12:06:00"
}
```

#### User Disconnected
Server broadcasts when user disconnects:
```json
{
    "type": "user_disconnected",
    "username": "Sound",
    "timestamp": "2024-01-01T12:06:30"
}
```

#### Users List
Server sends after connection and updates:
```json
{
    "type": "users_list",
    "users": [
        {
            "username": "Camera 1",
            "connected_at": "2024-01-01T12:00:00",
            "last_seen": "2024-01-01T12:06:00"
        }
    ],
    "timestamp": "2024-01-01T12:06:00"
}
```

#### Cues List
Server sends on connection:
```json
{
    "type": "cues_list",
    "cues": [
        {
            "id": 1,
            "display_name": "GO",
            "spoken_text": "Go",
            "audio_file": "cue_1.mp3",
            "audio_mode": "automatic",
            "button_colour": "#10B981",
            "icon": "go",
            "category": "general",
            "sort_order": 0,
            "enabled": true
        }
    ],
    "timestamp": "2024-01-01T12:00:00"
}
```

#### Error
Server sends on error:
```json
{
    "type": "error",
    "error": "Invalid cue ID",
    "timestamp": "2024-01-01T12:05:30"
}
```

---

## Error Codes

| Status | Description |
|--------|-------------|
| 200 | Success |
| 400 | Bad request (invalid data) |
| 404 | Not found (resource doesn't exist) |
| 500 | Server error |
| 503 | Service unavailable |
| 1000 | WebSocket normal closure |
| 1008 | WebSocket policy violation (invalid username) |
| 1011 | WebSocket server error |

---

## Rate Limiting

No rate limiting is currently implemented. Future versions may add rate limiting for API endpoints.

## CORS

CORS is enabled for all origins on local network. Not suitable for public deployment.

## Pagination

Message endpoints support `limit` parameter for pagination:
- Default: 50-100
- Maximum: 500-1000
- Returns results in reverse chronological order (newest first)

Implement client-side pagination by fetching with different offsets.

## Data Types

- **string**: UTF-8 text (max 255 chars unless noted)
- **integer**: Whole numbers
- **boolean**: true or false
- **timestamp**: ISO 8601 format (2024-01-01T12:00:00)
- **color**: Hex color code (#RRGGBB)

---

## Examples

### cURL Examples

#### Create a cue
```bash
curl -X POST http://localhost:8000/api/cues \
  -H "Content-Type: application/json" \
  -d '{
    "display_name": "Prayer",
    "spoken_text": "Prayer time",
    "category": "stage",
    "button_colour": "#8B5CF6",
    "icon": "prayer"
  }'
```

#### Upload audio
```bash
curl -X POST http://localhost:8000/api/cues/1/audio \
  -F "file=@audio.mp3"
```

#### Get messages
```bash
curl "http://localhost:8000/api/messages?limit=50"
```

#### Get connected users
```bash
curl http://localhost:8000/api/users
```

#### WebSocket connect (using wscat)
```bash
npm install -g wscat
wscat -c "ws://localhost:8000/ws/testuser"

# Send message
{"type":"ping"}

# Send cue
{"type":"cue","cue_id":1}
```

### JavaScript Examples

#### Fetch cues
```javascript
const cues = await fetch('http://localhost:8000/api/cues')
    .then(r => r.json());
```

#### Create cue
```javascript
await fetch('http://localhost:8000/api/cues', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        display_name: 'GO',
        category: 'general'
    })
});
```

#### WebSocket send cue
```javascript
const ws = new WebSocket('ws://localhost:8000/ws/username');
ws.send(JSON.stringify({
    type: 'cue',
    cue_id: 1
}));
```

---

## OpenAPI/Swagger

Interactive API documentation available at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- OpenAPI JSON: http://localhost:8000/openapi.json

---

## Changelog

### v1.0.0
- Initial release
- Full REST API
- WebSocket support
- Admin panel
- PWA offline capability

---

For additional help, see README.md or TROUBLESHOOTING.md
