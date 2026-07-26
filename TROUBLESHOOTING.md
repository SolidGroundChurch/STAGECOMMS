# Troubleshooting Guide

## Common Issues & Solutions

### Connection Problems

#### "Cannot connect to server"

**Check 1: Server is Running**
```bash
# Docker
docker compose ps

# Manual Python
ps aux | grep uvicorn
```

**Check 2: Port is Accessible**
```bash
# From server machine
curl http://localhost:8000

# From client machine (replace 192.168.1.100 with your server IP)
curl http://192.168.1.100:8000
```

**Check 3: Firewall**
```bash
# Windows
netsh advfirewall firewall show rule name="StageComms"

# Linux
sudo ufw status
sudo firewall-cmd --list-all
```

**Check 4: Network**
- Are all devices on same Wi-Fi?
- Try `ping <SERVER_IP>` from phone/client
- Check if Wi-Fi has guest network (separate from main network)

---

#### "Cannot see server on local network"

**Solution:**
1. Get server's IP address:
   ```bash
   Windows: ipconfig
   macOS: ifconfig
   Linux: hostname -I
   ```
   Look for 192.168.x.x or 10.0.x.x

2. On client device, use that IP:
   ```
   http://192.168.1.100:8000
   ```

3. If you see "connection refused":
   - Firewall is blocking port 8000
   - Server isn't running
   - Port is already in use

---

### WebSocket Connection Issues

#### "WebSocket connection failed"

Check browser console (F12 → Console tab):

**If you see "WebSocket is closed before the connection is established":**
1. Server crashed or restarted
2. Network connection lost
3. Port unreachable

**Solution:**
```bash
# Check server logs
docker compose logs -f stagecomms

# Restart server
docker compose restart stagecomms

# Wait 10 seconds and refresh browser
```

#### "Cannot send message"

- Check connection status (should show "Connected" in app)
- Verify username is not blank
- Try test audio button first
- Refresh page and reconnect

---

### Audio Problems

#### "No sound when cue arrives"

**Check 1: Browser Permissions**
- Chrome: Check microphone icon in address bar
- Firefox: Allow in preferences
- Safari: System Preferences → Security & Privacy

**Check 2: Device Volume**
1. Check device volume (not muted)
2. Check browser volume settings
3. Use "Test Audio" button in app

**Check 3: Audio Settings in App**
1. Settings → "Enable Sounds" is checked
2. Notification Volume is not at 0

**Check 4: Audio Mode**
- If "MP3 Only" and no file uploaded → Silent
- Fallback to TTS if MP3 fails

---

#### "Test Audio fails"

1. **Check browser permissions**:
   - Chrome: Menu → Settings → Privacy → Microphone
   - Firefox: Preferences → Privacy
   - Safari: System Settings → Privacy & Security

2. **Try Text-to-Speech**:
   ```javascript
   // In browser console
   const utterance = new SpeechSynthesisUtterance("test");
   speechSynthesis.speak(utterance);
   ```

3. **Check volume**:
   - Device volume should be on
   - App volume slider at >0%

4. **Try different browser**:
   - Chrome, Firefox, Safari, Edge
   - Text-to-Speech varies by browser

---

#### "MP3 doesn't play but TTS works"

1. **Check audio file format**:
   - Supported: MP3, WAV, OGG, M4A
   - Verify file is not corrupted
   - Try uploading a different file

2. **Check audio mode**:
   - Should be "Automatic" (tries MP3, then TTS)
   - If "MP3 Only" with no valid file → Silent

3. **Check file size**:
   - Max 50MB
   - Typical: <5MB for short clips

4. **Test with browser**:
   - Open audio file directly: `http://localhost:8000/uploads/audio/cue_1.mp3`
   - Should play without download prompt

---

### Database Issues

#### "Database is locked"

**Cause**: Multiple instances accessing same database

**Solution**:
```bash
# Stop all containers
docker compose down

# Wait 5 seconds
sleep 5

# Start again
docker compose up -d
```

#### "Database corruption error"

**Solution**:
```bash
# Check database integrity
docker compose exec stagecomms sqlite3 /app/database/stagecomms.db "PRAGMA integrity_check;"

# Backup current database
docker compose exec stagecomms cp /app/database/stagecomms.db /app/database/stagecomms.db.bak

# Restore from backup or reinit
docker compose exec stagecomms rm /app/database/stagecomms.db
docker compose restart stagecomms
```

#### "Cannot create/edit cues"

1. **Check database is running**:
   ```bash
   docker compose exec stagecomms sqlite3 /app/database/stagecomms.db ".tables"
   ```

2. **Check permissions**:
   ```bash
   docker compose exec stagecomms ls -l /app/database/
   ```

3. **Reinitialize database**:
   ```bash
   docker compose down -v  # Remove volumes
   docker compose up -d
   ```

---

### Admin Panel Issues

#### "Admin panel won't load"

1. **Check URL**: Should be `http://localhost:8000/admin`
2. **Check server logs**: `docker compose logs stagecomms`
3. **Try admin health check**: `curl http://localhost:8000/api/admin/check`
4. **Clear browser cache**: Ctrl+Shift+Delete

#### "Cannot upload audio"

1. **Check file size**: Must be <50MB
2. **Check format**: MP3, WAV, OGG, M4A
3. **Check storage**: `/app/uploads/audio/` must be writable
   ```bash
   docker compose exec stagecomms ls -l /app/uploads/audio/
   ```
4. **Check permissions**: Docker volume may have permission issue
   ```bash
   docker compose exec stagecomms chmod 755 /app/uploads/audio/
   ```

---

### Performance Issues

#### "App is slow or laggy"

**Check CPU/Memory**:
```bash
docker compose stats stagecomms
```

**Solutions**:
1. Restart container: `docker compose restart stagecomms`
2. Reduce max connections: Check `docker-compose.yml`
3. Clear old messages: Admin panel → System → Maintenance
4. Check network bandwidth

#### "Cues delayed (>500ms latency)"

1. **Check network**:
   ```bash
   ping <SERVER_IP>
   # Should show <50ms on local network
   ```

2. **Check WiFi signal**:
   - Move closer to router
   - Check for interference (microwaves, cordless phones)
   - Try 5GHz band instead of 2.4GHz

3. **Check server load**:
   ```bash
   docker compose exec stagecomms top
   ```

4. **Monitor WebSocket**:
   - Browser F12 → Network → WS
   - Check message round-trip time

---

### User Management Issues

#### "Users not appearing in list"

1. **Check they are connected**:
   - They should see "Connected" status
   - Check their browser's connection status

2. **Refresh user list**:
   - Admin panel: "Refresh Stats"
   - Main app: Navigate away and back

3. **Check WebSocket**:
   - Users should see their name in banner
   - Connection dot should be green

#### "User disconnects frequently"

1. **Check Wi-Fi connection**:
   - Move closer to router
   - Try ethernet if available
   - Check for Wi-Fi auto-disconnect settings

2. **Check server load**:
   ```bash
   docker compose stats stagecomms
   ```

3. **Increase timeout**:
   - Edit `app/backend/config/settings.py`
   - Change `WEBSOCKET_TIMEOUT`

---

### Offline Issues

#### "App doesn't work offline"

1. **Check service worker**:
   - Browser → DevTools → Application → Service Workers
   - Should show "active and running"

2. **Wait for cache**:
   - Service worker needs 1-2 page loads to cache
   - Load main app page twice before going offline

3. **Check offline status**:
   - Settings should be stored in LocalStorage
   - Cues should display (but not sync)

4. **Clear cache**:
   - DevTools → Application → Storage → Clear Site Data
   - Close and reopen app

---

### Database/File Issues

#### "SQLite database file corrupted"

```bash
# Check integrity
docker compose exec stagecomms sqlite3 /app/database/stagecomms.db "PRAGMA integrity_check;"

# If not OK, restore from backup
docker compose exec stagecomms sqlite3 /app/database/stagecomms.db ".restore /app/database/backups/latest.db"
```

#### "Running out of disk space"

```bash
# Check disk usage
docker system df

# Clean up
docker system prune -a
docker volume prune

# Remove old backups
docker compose exec stagecomms rm /app/database/backups/*.db
```

#### "Permission denied errors"

```bash
# Fix file permissions
docker compose exec stagecomms chmod -R 755 /app

# Or restart with fresh permissions
docker compose down
docker volume prune
docker compose up -d
```

---

### Browser-Specific Issues

#### **Chrome/Chromium**
- Location: `chrome://settings/privacy` for audio permissions
- Cache issue: Ctrl+Shift+Delete → Clear browsing data
- DevTools: F12 → Application tab

#### **Firefox**
- About: Type `about:preferences` → Privacy
- Cache: about:preferences → Privacy → Clear all
- DevTools: F12 → Storage tab

#### **Safari (iOS/macOS)**
- Settings → Websites → Camera/Microphone permissions
- Settings → Privacy → Microphone access
- Quit and reopen app completely

#### **Edge**
- Similar to Chrome
- Check edge://settings/privacy

---

### Docker Issues

#### "Port 8000 already in use"

```bash
# Find what's using it
lsof -i :8000  # macOS/Linux
netstat -ano | findstr :8000  # Windows

# Kill the process or change port in docker-compose.yml
ports:
  - "8001:8000"  # Use different port
```

#### "Docker daemon not running"

**macOS/Windows**: Open Docker Desktop application

**Linux**:
```bash
sudo systemctl start docker
```

#### "Permission denied - Docker"

```bash
# Add current user to docker group (Linux)
sudo usermod -aG docker $USER
newgrp docker

# Or use sudo
sudo docker compose up -d
```

---

### Logging & Debugging

#### "Enable detailed logs"

1. **Set log level**:
   ```bash
   # In .env
   LOG_LEVEL=DEBUG
   ```

2. **View logs**:
   ```bash
   docker compose logs -f --tail=100 stagecomms
   ```

3. **Save logs to file**:
   ```bash
   docker compose logs > logs.txt
   ```

#### "Browser console debugging"

Press F12 in browser:
- **Console**: JavaScript errors
- **Network**: WebSocket and API calls
- **Application**: LocalStorage, Service Worker
- **Performance**: Timing and lag analysis

#### "API testing"

```bash
# Get all cues
curl http://localhost:8000/api/cues

# Get connected users
curl http://localhost:8000/api/users

# Get health
curl http://localhost:8000/health
```

---

## Getting Help

### Information to Include

1. **Browser & OS**: Chrome on Windows 11
2. **Server type**: Docker / Python local / Cloud server
3. **Error message**: Full text from console or logs
4. **Steps to reproduce**: Exactly how to trigger the issue
5. **Logs**: Output from `docker compose logs`
6. **Screenshots**: Visual representation of issue

### Support Channels

1. Check existing GitHub issues
2. Review this troubleshooting guide
3. Check logs: `docker compose logs stagecomms`
4. Test with direct connection: `curl http://localhost:8000`
5. Create new GitHub issue with full details

---

## Quick Reference

| Issue | Command |
|-------|---------|
| Server won't start | `docker compose logs stagecomms` |
| Port in use | `lsof -i :8000` |
| Restart server | `docker compose restart` |
| Clear database | `docker compose down -v` |
| View logs | `docker compose logs -f` |
| Check health | `curl http://localhost:8000/health` |
| Check disk | `docker system df` |
| Backup DB | `docker cp stagecomms:/app/database `` |
| Update app | `git pull && docker compose up --build -d` |

---

Still stuck? Run diagnostic script:

```bash
#!/bin/bash
echo "=== STAGECOMMS DIAGNOSTICS ==="
echo "Docker status:"
docker compose ps

echo -e "\nServer health:"
curl -s http://localhost:8000/health | jq .

echo -e "\nUser count:"
curl -s http://localhost:8000/api/users/status/count | jq .

echo -e "\nDatabase check:"
docker compose exec stagecomms sqlite3 /app/database/stagecomms.db "SELECT COUNT(*) FROM cues;" 2>&1

echo -e "\nDisk usage:"
docker system df
```

Save as `diagnostics.sh` and run: `bash diagnostics.sh`
