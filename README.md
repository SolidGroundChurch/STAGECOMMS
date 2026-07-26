# StageComms

**Church Production Control System** – A production-ready, low-latency communication platform for live church services.

StageComms replaces unreliable radio and phone communication with instant, reliable cue delivery to all connected devices on a local network. Built for professional church production teams, it prioritizes reliability, speed, and simplicity.

---

## Features

### Core Functionality
- 🚀 **Ultra-Low Latency**: Cues deliver in <150ms on local Wi-Fi
- 📱 **Mobile-First**: Optimized for phones; works on tablets and desktops
- 🔌 **No Internet Required**: Runs entirely on local network
- 🔋 **Offline-Ready**: Progressive Web App (PWA) for offline capability
- 🎯 **Zero Training**: Intuitive interface for volunteers
- 🔊 **Hybrid Audio**: MP3 playback + browser Text-to-Speech fallback

### Broadcasting
- Cue buttons with custom colours and icons
- Full-screen cue display on all devices
- Real-time banner updates
- Custom text message broadcasting
- Connected user list with real-time status

### Administration
- Web-based admin panel for cue management
- Create, edit, delete, and reorder cues
- Upload custom audio files
- Configure button colors, icons, and categories
- Message history with filtering and search
- System health monitoring

### Accessibility
- Dark theme with high contrast
- Large, touch-friendly buttons (48px minimum)
- Professional appearance
- Responsive design for portrait and landscape
- Support for vibration API

---

## Quick Start

### Prerequisites
- Docker & Docker Compose
- OR Python 3.13+ with pip

### Option 1: Docker (Recommended)

```bash
# Clone or download the project
cd StageComms

# Start the application
docker compose up -d

# Access the application
# Main app: http://localhost:8000
# Admin panel: http://localhost:8000/admin
# API docs: http://localhost:8000/docs
```

### Option 2: Local Python

```bash
# Install dependencies
pip install -r requirements.txt

# Initialize database
python -m app.backend.database.init_db

# Start the server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Access at http://localhost:8000
```

---

## Usage

### For Operators

1. **Enter your name** on the login screen (e.g., "Camera 1", "Sound")
2. **Connection status** appears in the banner
3. **Press cue buttons** to broadcast to all connected devices
4. **Custom messages** via the floating message button
5. **View history** and connected users via floating menu buttons

### For Administrators

1. **Access admin panel** at `/admin`
2. **Create cues** with custom names, colors, and audio
3. **Upload audio files** for MP3 playback
4. **View real-time stats**: connected users, message count, etc.
5. **Backup database** with one click

---

## Architecture

```
stagecomms/
├── app/
│   ├── backend/
│   │   ├── api/
│   │   │   └── routes/
│   │   │       ├── cues.py
│   │   │       ├── users.py
│   │   │       ├── messages.py
│   │   │       ├── admin.py
│   │   │       └── health.py
│   │   ├── websocket/
│   │   │   ├── manager.py
│   │   │   └── handlers.py
│   │   ├── models/
│   │   │   ├── cue.py
│   │   │   ├── message.py
│   │   │   └── user.py
│   │   ├── services/
│   │   │   ├── cue_service.py
│   │   │   ├── message_service.py
│   │   │   └── user_service.py
│   │   ├── database/
│   │   │   ├── db.py
│   │   │   └── init_db.py
│   │   └── config/
│   │       └── settings.py
│   ├── static/
│   │   ├── css/
│   │   │   └── main.css
│   │   ├── js/
│   │   │   └── app.js
│   │   ├── manifest.json
│   │   ├── sw.js (Service Worker)
│   │   └── audio/
│   │       └── (audio files)
│   ├── templates/
│   │   ├── index.html
│   │   └── admin.html
│   ├── database/
│   ├── uploads/
│   └── main.py
├── Dockerfile
├── docker-compose.yml
└── requirements.txt
```

### Technology Stack

**Backend:**
- FastAPI (async Python web framework)
- WebSockets (real-time communication)
- SQLAlchemy (ORM)
- SQLite (lightweight database)

**Frontend:**
- HTML5 & CSS3
- Vanilla JavaScript (no frameworks)
- Progressive Web App (PWA)
- Service Worker (offline support)

**Infrastructure:**
- Docker & Docker Compose
- Uvicorn (ASGI server)

---

## Configuration

### Environment Variables

Create a `.env` file:

```env
# Server
HOST=0.0.0.0
PORT=8000
DEBUG=false

# Database
DATABASE_URL=sqlite:////app/database/stagecomms.db

# Paths
UPLOAD_DIR=/app/uploads
LOGS_DIR=/app/logs

# Logging
LOG_LEVEL=INFO

# Admin
ADMIN_PASSWORD=optional_password
```

### Settings (Client-Side)

Users can configure in the app settings:
- Enable/disable sounds
- Enable/disable vibration
- Full-screen cue display
- Notification volume

All settings are stored in browser LocalStorage.

---

## API Documentation

### REST Endpoints

#### Health
- `GET /health` – Basic health check
- `GET /health/db` – Database connectivity check

#### Cues
- `GET /api/cues` – List all cues
- `GET /api/cues/{cue_id}` – Get specific cue
- `POST /api/cues` – Create new cue
- `PUT /api/cues/{cue_id}` – Update cue
- `DELETE /api/cues/{cue_id}` – Delete cue
- `POST /api/cues/{cue_id}/audio` – Upload audio file
- `DELETE /api/cues/{cue_id}/audio` – Delete audio file
- `GET /api/cues/categories` – Get all categories

#### Users
- `GET /api/users` – List connected users
- `GET /api/users/{username}` – Get specific user
- `GET /api/users/status/count` – Get user count

#### Messages
- `GET /api/messages` – Get recent messages
- `GET /api/messages/user/{username}` – Get user's messages
- `GET /api/messages/category/{category}` – Get category messages
- `GET /api/messages/search?q=text` – Search messages
- `DELETE /api/messages/{message_id}` – Delete message

#### Admin
- `GET /api/admin/stats` – Get system statistics
- `POST /api/admin/backup` – Create database backup

### WebSocket

**Connect:**
```
ws://localhost:8000/ws/{username}
```

**Message Types:**

```json
{
  "type": "ping"
}
```

```json
{
  "type": "cue",
  "cue_id": 1
}
```

```json
{
  "type": "custom_message",
  "message_text": "Hello everyone"
}
```

---

## Audio System

### MP3 Playback
- Upload audio files via admin panel
- Configure per-cue audio mode
- <150ms latency on local network
- Automatically preloaded on app startup

### Text-to-Speech (TTS)
- Browser Speech Synthesis API
- Fallback when MP3 unavailable
- Configurable audio mode per cue
- Automatic speaker name suppression

### Audio Priority
1. MP3 file (if exists and enabled)
2. Browser TTS (fallback)
3. Silent (visual only)

### Audio Modes
- **Automatic**: Try MP3 first, fall back to TTS
- **MP3 Only**: Use audio file or silent
- **TTS Only**: Always use text-to-speech
- **Silent**: Visual notification only

---

## Cue Configuration

### Fields
| Field | Description | Example |
|-------|-------------|---------|
| Display Name | Button text | "Next Speaker" |
| Spoken Text | Text to be spoken (optional) | "Next Speaker" |
| Audio File | MP3 file name | "cue_1.mp3" |
| Audio Mode | How to play audio | "automatic" |
| Button Colour | Hex color | "#3B82F6" |
| Icon | Emoji/name | "speaker" |
| Category | For organization | "stage" |
| Sort Order | Display order | 0 |
| Enabled | Active/inactive | true |

### Default Cues (Included)

| Cue | Category | Color |
|-----|----------|-------|
| GO | general | Green |
| Standby | general | Amber |
| Next Speaker | stage | Blue |
| Prayer | stage | Purple |
| Offering | stage | Pink |
| Announcements | general | Orange |
| Start Music | audio | Cyan |
| Stop Music | audio | Red |
| Lights Up | lighting | Yellow |
| Lights Down | lighting | Gray |
| Camera 1 | cameras | Teal |
| Camera 2 | cameras | Teal |
| Wide Shot | cameras | Cyan |
| Emergency Stop | emergency | Red |

---

## Offline Capability

StageComms works offline as a Progressive Web App (PWA):

1. **Service Worker**: Caches app shell, JS, CSS
2. **Local Storage**: Persists username and settings
3. **Audio Caching**: Preloads all cue audio files
4. **Graceful Degradation**: Disables WebSocket when offline

### Install as App

**Android:**
1. Open StageComms in Chrome
2. Menu → "Install app"
3. Appears on home screen

**iPhone:**
1. Open StageComms in Safari
2. Share → "Add to Home Screen"
3. Appears on home screen

---

## Troubleshooting

### Connection Issues
- **Check local network**: Ensure all devices on same Wi-Fi
- **Firewall**: Allow port 8000
- **Reconnection**: Auto-reconnects after 3 seconds

### Audio Problems
- **Test Audio button**: Verify browser permissions
- **Volume**: Check device volume + app volume setting
- **Format**: Support MP3, WAV, OGG, M4A
- **Size limit**: Max 50MB per file

### Database Issues
- **SQLite locked**: Only one instance should run
- **Permissions**: Ensure write access to `/app/database`
- **Backup**: Use admin panel to create backup

---

## Security Considerations

### Current Design
- No authentication (assumes trusted local network)
- No encryption (local network only)
- No rate limiting on WebSocket

### For Public Networks
- Add authentication layer
- Use HTTPS/WSS with self-signed certs
- Add IP whitelist
- Implement rate limiting

### Best Practices
1. Run on private, secured network only
2. Use strong WiFi password
3. Disable guest network during service
4. Monitor connected users
5. Regular database backups

---

## Performance Targets

| Metric | Target | Typical |
|--------|--------|---------|
| Connection time | <500ms | ~100ms |
| Cue latency | <150ms | ~50-100ms |
| UI responsiveness | <200ms | <100ms |
| Full-screen display | <300ms | ~100ms |
| Audio playback start | <200ms | <100ms |

---

## Development

### Project Structure
- Modular backend with clean separation of concerns
- Service layer for business logic
- Database abstraction with SQLAlchemy
- Type hints throughout
- Structured logging

### Running Tests
```bash
# Install dev dependencies
pip install pytest pytest-asyncio httpx

# Run tests
pytest
```

### Code Quality
- Uses FastAPI best practices
- Follows PEP 8 naming conventions
- SQLAlchemy ORM patterns
- Proper error handling

---

## Deployment

### Docker Deployment
```bash
docker compose up -d
```

**Persistent Volumes:**
- `/app/database` – SQLite database
- `/app/uploads` – Audio files
- `/app/logs` – Application logs
- `/app/static` – Web assets

### Kubernetes (Advanced)
See `k8s/` directory for example deployments.

### Health Check
```bash
curl http://localhost:8000/health
```

---

## Future Enhancements

### Planned Features
- User permissions and roles
- Multiple production rooms
- OBS integration
- Bitfocus Companion integration
- ProPresenter integration
- Scheduled cues
- Custom branding
- Analytics dashboard
- MQTT support
- Piper TTS engine (local alternative to browser TTS)

### Extensibility
The codebase is designed for future features:
- Database migrations ready
- API versioning possible
- Plugin architecture possible
- External service integrations

---

## Support & Contribution

### Reporting Issues
1. Check existing issues
2. Describe reproduction steps
3. Include logs if available
4. Note environment (Docker/Python/OS)

### Contributing
1. Fork the repository
2. Create feature branch
3. Follow code style
4. Test thoroughly
5. Submit pull request

---

## License

MIT License - See LICENSE file

---

## Credits

Built for church production teams. Designed with reliability, simplicity, and professionalism as core principles.

---

## FAQ

### Q: Can I use this over the internet?
**A:** Not recommended. It's designed for local networks. For remote use, deploy with VPN or add authentication.

### Q: What happens if the server crashes?
**A:** Clients will show "Disconnected" and auto-reconnect. No cues are lost (stored in database).

### Q: How many users can connect?
**A:** Tested with 50+ simultaneous connections. Performance depends on network hardware.

### Q: Can I customize the cues?
**A:** Fully customizable via admin panel. Create unlimited cues with custom colors, icons, and audio.

### Q: Does it work offline?
**A:** Yes, as a PWA. Cues received before going offline are cached. New cues require connection.

### Q: How is data stored?
**A:** SQLite database in `/app/database`. Back up the file for complete system backup.

### Q: Can multiple churches use one server?
**A:** With modifications. Consider multiple containers or database separation.

---

## Getting Help

- **Admin Panel**: http://localhost:8000/admin
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health
- **Logs**: See `/app/logs/stagecomms.log`

---

**StageComms** – Reliable communication for live church production. 🎬
