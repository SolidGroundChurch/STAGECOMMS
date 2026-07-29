# Quick Start Guide

Get StageComms running in 5 minutes.

## Option 1: Docker (Fastest)

### Step 1: Start the server
```bash
docker compose up -d
```

### Step 2: Open in browser
```
http://localhost:8000
```

### Step 3: Enter your name and press Enter

That's it! You're running StageComms.

### Step 4 (Optional): Create cues

Go to `/admin` to create your first cues:
```
http://localhost:8000/admin
```

---

## Option 2: Local Python

### Step 1: Install dependencies
```bash
pip install -r requirements.txt
```

### Step 2: Initialize database
```bash
python -m app.backend.database.init_db
```

### Step 3: Start server
```bash
python -m uvicorn app.main:app --reload
```

### Step 4: Open browser
```
http://localhost:8000
```

---

## Next Steps

### Use on Phone

1. Find your computer's IP address:
   - Windows: `ipconfig` (look for IPv4 Address like 192.168.1.100)
   - Mac: `ifconfig` (look for inet)
   - Linux: `hostname -I`

2. On your phone's browser:
   ```
   http://192.168.1.100:8000
   ```
   (Replace with your actual IP)

3. Enter your name (e.g., "Camera 1")

4. Press Enter and start sending cues!

### Create Default Cues

Database comes with 33 pre-configured cues, including production calls, camera director cues, and stage manager host cues.

### Test Audio

1. Click the speaker icon (🔊) in the top banner
2. Should hear "Audio test successful"
3. If not, check device volume and browser permissions

### Send a Cue

1. Main app shows grid of cue buttons
2. Press any button
3. Message appears at top
4. Full-screen notification on connected devices
5. Audio plays automatically

### Custom Message

1. Click the message button (floating button)
2. Type a message (max 500 characters)
3. Press Send
4. Everyone sees and hears it

### View History

1. Click the history button (📋)
2. See all messages sent
3. Filter by user or search by text

### Admin Panel

Visit `/admin` to:
- Create new cues
- Upload audio files
- Edit cue settings
- View connected users
- Create database backups

---

## Commands

### Check if running
```bash
curl http://localhost:8000/health
```

### View logs
```bash
docker compose logs -f
# or
tail -f /app/logs/stagecomms.log
```

### Stop server
```bash
docker compose down
# or
Ctrl+C (if running locally)
```

### Restart server
```bash
docker compose restart
```

### Clear database
```bash
docker compose down -v
docker compose up -d
```

---

## Troubleshooting

### "Cannot connect on phone"
- Both devices on same Wi-Fi? ✓
- Using correct IP address? (Not localhost) ✓
- Firewall allows port 8000? ✓

Try: `ping <SERVER_IP>` from phone

### "No sound"
- Device volume turned on? ✓
- App volume slider not at 0? (Settings) ✓
- Try Test Audio button ✓
- Check browser permissions ✓

### "Cannot access /admin"
- URL should be `http://localhost:8000/admin`
- Try `http://<YOUR_IP>:8000/admin`
- Server running? (Check `docker compose ps`)

### "Port 8000 already in use"
```bash
docker compose down
sleep 5
docker compose up -d
```

Or use different port:
- Edit `docker-compose.yml`
- Change `8000:8000` to `8001:8000`

---

## Features at a Glance

| Feature | Status |
|---------|--------|
| Real-time cue broadcasting | ✓ |
| Mobile-first design | ✓ |
| Offline support (PWA) | ✓ |
| MP3 + Text-to-Speech audio | ✓ |
| Message history | ✓ |
| Admin panel | ✓ |
| Custom cues | ✓ |
| Connected users | ✓ |
| Full-screen cue display | ✓ |
| Local network only | ✓ |
| No passwords needed | ✓ |

---

## Full Documentation

- **README.md** – Complete overview
- **DEPLOYMENT.md** – Server setup & scaling
- **TROUBLESHOOTING.md** – Common issues
- **DEVELOPMENT.md** – Contributing & development
- **API_REFERENCE.md** – REST API docs

---

## Get Help

1. **Check logs**: `docker compose logs -f stagecomms`
2. **Browser console**: Press F12 in app
3. **Health check**: `curl http://localhost:8000/health`
4. **Try /admin**: `http://localhost:8000/admin`
5. **See TROUBLESHOOTING.md** for detailed help

---

## Default Setup

- **Server Address**: http://localhost:8000
- **Admin Panel**: http://localhost:8000/admin
- **Database**: SQLite (auto-created)
- **Default Cues**: 14 pre-configured
- **Sample Audio**: Not included (add via admin panel)

---

## Production Deployment

Not ready for production yet? See [DEPLOYMENT.md](DEPLOYMENT.md) for:
- Server deployment
- Scaling to many users
- Backups and monitoring
- Security considerations

---

**Ready to go!** Your church production team can now communicate reliably in real-time. 🚀
