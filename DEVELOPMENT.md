# Development Guide

## Setting Up Development Environment

### Prerequisites
- Python 3.13+
- Node.js 18+ (optional, for build tools)
- Git
- SQLite3
- Docker (optional)

### Quick Setup (Local Development)

```bash
# Clone repository
git clone <repo> StageComms
cd StageComms

# Create Python virtual environment
python3 -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Install dev dependencies
pip install -r requirements-dev.txt

# Initialize database
python -m app.backend.database.init_db

# Start development server
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Access at: http://localhost:8000

### Development with Docker

```bash
# Build development image
docker compose -f docker-compose.dev.yml up -d

# View logs
docker compose -f docker-compose.dev.yml logs -f

# Access shell
docker compose -f docker-compose.dev.yml exec stagecomms bash
```

---

## Project Structure Explained

```
app/
├── main.py                 # FastAPI app and WebSocket endpoint
├── backend/
│   ├── api/
│   │   └── routes/
│   │       ├── cues.py    # Cue CRUD endpoints
│   │       ├── users.py   # User status endpoints
│   │       ├── messages.py# Message history endpoints
│   │       ├── admin.py   # Admin endpoints
│   │       └── health.py  # Health check endpoints
│   ├── websocket/
│   │   ├── manager.py     # WebSocket connection management
│   │   └── handlers.py    # Message creation/formatting
│   ├── models/
│   │   ├── cue.py         # Cue ORM model
│   │   ├── message.py     # Message ORM model
│   │   └── user.py        # User ORM model
│   ├── services/
│   │   ├── cue_service.py     # Cue business logic
│   │   ├── message_service.py # Message business logic
│   │   └── user_service.py    # User business logic
│   ├── database/
│   │   ├── db.py          # Database connection and init
│   │   └── init_db.py     # Seed data
│   └── config/
│       └── settings.py    # Configuration and env vars
└── static/
    ├── css/
    │   └── main.css       # Tailwind-inspired styling
    ├── js/
    │   └── app.js         # Main frontend app
    ├── manifest.json      # PWA manifest
    └── sw.js              # Service worker
```

---

## Adding a New Feature

### Example: Adding a New API Endpoint

1. **Create service method** (`app/backend/services/example_service.py`):
```python
class ExampleService:
    @staticmethod
    def get_data(db: Session):
        return db.query(Example).all()
```

2. **Create route** (`app/backend/api/routes/example.py`):
```python
from fastapi import APIRouter, Depends
from app.backend.database.db import get_db
from app.backend.services import ExampleService

router = APIRouter(prefix="/example", tags=["example"])

@router.get("")
async def get_examples(db: Session = Depends(get_db)):
    return ExampleService.get_data(db)
```

3. **Register route** in `app/main.py`:
```python
from app.backend.api.routes import example
app.include_router(example.router)
```

4. **Test endpoint**:
```bash
curl http://localhost:8000/api/example
```

---

## Database Schema

### Cues Table
```sql
CREATE TABLE cues (
    id INTEGER PRIMARY KEY,
    display_name VARCHAR(255) NOT NULL,
    spoken_text TEXT,
    audio_file VARCHAR(255),
    audio_mode ENUM,  -- 'automatic', 'mp3_only', 'tts_only', 'silent'
    button_colour VARCHAR(7),  -- Hex color
    icon VARCHAR(50),
    category VARCHAR(50),
    sort_order INTEGER,
    enabled BOOLEAN,
    created_at DATETIME,
    updated_at DATETIME
);
```

### Messages Table
```sql
CREATE TABLE messages (
    id INTEGER PRIMARY KEY,
    username VARCHAR(255),
    message_text TEXT NOT NULL,
    audio_mode VARCHAR(50),
    audio_file VARCHAR(255),
    category VARCHAR(50),
    timestamp DATETIME
);
```

### Users Table
```sql
CREATE TABLE users (
    username VARCHAR(255) PRIMARY KEY,
    connected_at DATETIME,
    last_seen DATETIME
);
```

---

## Frontend Development

### Vanilla JavaScript Organization

The frontend is organized by functionality:

```
app.js
├── CONFIG & CONSTANTS
├── STATE MANAGEMENT
├── DOM ELEMENTS
├── INITIALIZATION
├── EVENT LISTENERS
├── AUTHENTICATION
├── WEBSOCKET COMMUNICATION
├── CUE HANDLING
├── AUDIO SYSTEM
├── CUSTOM MESSAGES
├── USERS MANAGEMENT
├── MESSAGE HISTORY
├── MODAL MANAGEMENT
└── UTILITIES
```

### Adding a New Button

1. **Add to HTML** (`app/templates/index.html`):
```html
<button id="my-button" class="btn btn-primary">
    My Action
</button>
```

2. **Add listener** in `app/static/js/app.js`:
```javascript
document.getElementById('my-button').addEventListener('click', myFunction);

function myFunction() {
    // Your code here
}
```

3. **Style in CSS** (`app/static/css/main.css`):
```css
#my-button {
    /* Custom styles */
}
```

---

## Testing

### Unit Tests

```bash
# Run all tests
pytest

# Run specific test file
pytest tests/test_cue_service.py

# Run with coverage
pytest --cov=app tests/
```

### Integration Tests

```bash
# Test WebSocket
pytest -k websocket -v

# Test API endpoints
pytest -k api -v
```

### Manual Testing

```bash
# Health check
curl http://localhost:8000/health

# Create cue via API
curl -X POST http://localhost:8000/api/cues \
  -H "Content-Type: application/json" \
  -d '{"display_name":"Test","category":"general"}'

# Connect to WebSocket
wscat -c ws://localhost:8000/ws/testuser
```

---

## Code Style

### Python
- Follow PEP 8
- Use type hints everywhere
- Meaningful variable names
- Docstrings for functions

```python
def calculate_average(numbers: List[int]) -> float:
    """Calculate average of list of numbers.
    
    Args:
        numbers: List of integers
        
    Returns:
        Average as float
    """
    return sum(numbers) / len(numbers)
```

### JavaScript
- Use camelCase for variables and functions
- Use const by default, let if needed
- Comments for complex logic
- Modern ES6+ syntax

```javascript
// Good
const handleClick = (event) => {
    const element = event.target;
    // Process element
};

// Avoid
var x = 1;
function handleClick(e) { ... }
```

### CSS
- Use kebab-case for class names
- Group related properties
- Use CSS variables for colors
- Mobile-first approach

```css
/* Good */
.cue-button {
    background: var(--primary-color);
    padding: 1rem;
    border-radius: var(--border-radius);
}

/* Avoid */
.CueButton {
    background: #3B82F6;
    padding: 16px;
    border-radius: 12px;
}
```

---

## Performance Optimization

### Backend
1. **Database Indexing**: Add indexes to frequently queried columns
2. **Caching**: Use Redis for session data
3. **Connection Pooling**: Adjust pool size in `db.py`
4. **Async Operations**: Use async/await for I/O operations

### Frontend
1. **Lazy Loading**: Load cues on demand
2. **Image Optimization**: Use SVG for icons
3. **Code Splitting**: Separate critical and non-critical code
4. **Service Worker Caching**: Aggressive caching of static assets

### Database
1. **Indexes**: Create on frequently searched columns
   ```sql
   CREATE INDEX idx_messages_timestamp ON messages(timestamp);
   ```
2. **Vacuum**: Regularly compact database
3. **Archiving**: Move old messages to archive table

---

## Debugging

### Browser DevTools

**Console (F12)**:
- JavaScript errors
- Console.log() output
- API responses

**Network Tab**:
- WebSocket connections
- API call timing
- Response payloads

**Application Tab**:
- LocalStorage inspection
- Service Worker status
- Cache contents

### Server Logs

```bash
# Docker
docker compose logs -f stagecomms

# Local Python
# Logs to stdout + /app/logs/stagecomms.log
```

### Database Inspection

```bash
# SQLite CLI
sqlite3 /app/database/stagecomms.db

# Common queries
.tables                    # List all tables
SELECT * FROM cues;       # View all cues
SELECT COUNT(*) FROM messages;  # Count messages
PRAGMA table_info(cues);   # Show table schema
```

---

## Deployment Checklist

Before deploying to production:

- [ ] Update version in `app/backend/config/settings.py`
- [ ] Run all tests: `pytest`
- [ ] Check code coverage: `pytest --cov`
- [ ] Security audit: `bandit -r app/`
- [ ] Database migration tested
- [ ] Environment variables documented
- [ ] Logs configured
- [ ] Backup system tested
- [ ] Health checks working
- [ ] Load tested with expected user count
- [ ] Offline mode tested
- [ ] Mobile responsiveness verified
- [ ] Audio playback tested
- [ ] WebSocket reliability tested

---

## Common Development Tasks

### Add a new database table

1. Create model in `app/backend/models/`:
```python
class Example(Base):
    __tablename__ = "examples"
    id = Column(Integer, primary_key=True)
    name = Column(String(255))
```

2. Import in `app/backend/models/__init__.py`
3. Reinitialize database: `python -m app.backend.database.init_db`

### Add a new cue category

1. No migration needed (category is just a string)
2. Update default cues in `init_db.py` if needed
3. Categories auto-populate from existing cues

### Change audio file location

Update in `app/backend/config/settings.py`:
```python
AUDIO_DIR: Path = UPLOAD_DIR / "audio"  # Change path here
```

### Adjust WebSocket timeout

In `app/backend/config/settings.py`:
```python
WEBSOCKET_TIMEOUT: int = 60  # seconds
```

---

## Contributing

### Pull Request Process

1. Fork repository
2. Create feature branch: `git checkout -b feature/my-feature`
3. Make changes and test: `pytest`
4. Commit with clear message: `git commit -m "Add my feature"`
5. Push to branch: `git push origin feature/my-feature`
6. Create Pull Request with description

### Commit Message Format

```
[TYPE] Brief description

Optional detailed explanation of why and what changed.

Fixes #123
```

Types: feature, fix, docs, style, refactor, test, chore

---

## Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy ORM](https://docs.sqlalchemy.org/en/20/orm/)
- [WebSocket Protocol](https://tools.ietf.org/html/rfc6455)
- [MDN Web Docs](https://developer.mozilla.org/)
- [Python Best Practices](https://pep8.org/)

---

## Troubleshooting Development

### "Module not found" errors

```bash
# Ensure PYTHONPATH is correct
export PYTHONPATH="${PYTHONPATH}:$(pwd)"

# Or install in development mode
pip install -e .
```

### "Database locked" error

```bash
# Only one instance should be running
ps aux | grep uvicorn
# Kill existing process if needed
```

### "Port 8000 already in use"

```bash
# Use different port
python -m uvicorn app.main:app --port 8001
```

### WebSocket connection fails in development

- Check browser console (F12)
- Ensure server is running
- Try refreshing page
- Check firewall/antivirus

---

Need help? Check the main README.md or create an issue on GitHub.
