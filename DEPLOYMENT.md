# Deployment Guide

## Quick Start with Docker (Recommended)

### Prerequisites
- Docker Desktop installed ([download](https://www.docker.com/products/docker-desktop))
- Basic knowledge of terminal/command line

### Step 1: Start the Container

```bash
cd StageComms
docker compose up -d
```

### Step 2: Access the Application

- **Main App**: http://localhost:8000
- **Admin Panel**: http://localhost:8000/admin
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

### Step 3: Configure Your Network

1. Find your computer's IP address:
   - **Windows**: `ipconfig` (look for IPv4 Address, typically 192.168.x.x)
   - **Mac/Linux**: `ifconfig` (look for inet address)

2. On mobile devices, connect to the same Wi-Fi network

3. Open `http://<YOUR_IP>:8000` on your phone

### Step 4: Create Your First Cue

1. Go to http://localhost:8000/admin
2. Click "Create New Cue"
3. Enter cue name (e.g., "Start Music")
4. Choose a color and icon
5. Click "Create Cue"
6. Test in main app

---

## Production Deployment

### On a Server/NAS

#### Using Docker Compose

```bash
# Clone repository
git clone <repo-url> /opt/stagecomms
cd /opt/stagecomms

# Create .env file
cp .env.example .env
nano .env  # Edit configuration

# Start services
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down
```

#### Using systemd (for auto-restart)

Create `/etc/systemd/system/stagecomms.service`:

```ini
[Unit]
Description=StageComms Service
After=network.target docker.service
Requires=docker.service

[Service]
Type=simple
WorkingDirectory=/opt/stagecomms
ExecStart=/usr/bin/docker compose up
ExecStop=/usr/bin/docker compose down
Restart=unless-stopped
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl daemon-reload
sudo systemctl enable stagecomms
sudo systemctl start stagecomms
sudo systemctl status stagecomms
```

### Firewall Configuration

Allow port 8000:

**Windows Firewall:**
```powershell
netsh advfirewall firewall add rule name="StageComms" dir=in action=allow protocol=tcp localport=8000
```

**Linux (UFW):**
```bash
sudo ufw allow 8000/tcp
```

**Linux (firewalld):**
```bash
sudo firewall-cmd --permanent --add-port=8000/tcp
sudo firewall-cmd --reload
```

---

## Local Network Setup

### Option A: Direct IP Address (Recommended)

1. Get server IP: `ifconfig` or `ipconfig`
2. On phones: Open `http://SERVER_IP:8000`

### Option B: mDNS (Avahi/Bonjour)

1. Install avahi: `sudo apt-get install avahi-daemon`
2. Access: `http://stagecomms.local:8000`

### Option C: Static IP

Configure your router to assign a static IP to the server for consistency.

---

## Backup and Restore

### Automatic Backup

Use the admin panel: `/admin` → "Create Backup"

Backups are stored in `/app/database/backups/`

### Manual Backup

```bash
# Backup database
docker cp stagecomms:/app/database/stagecomms.db ./backup-stagecomms.db

# Backup uploads
docker cp stagecomms:/app/uploads ./backup-uploads

# Backup everything
docker compose exec stagecomms tar czf - /app > backup-full.tar.gz
```

### Restore

```bash
# Restore database
docker cp ./backup-stagecomms.db stagecomms:/app/database/stagecomms.db

# Restart container
docker compose restart stagecomms
```

---

## Scaling & Performance

### Hardware Requirements

| Users | CPU | RAM | Network |
|-------|-----|-----|---------|
| 1-10 | 1 core | 256MB | 10Mbps |
| 10-50 | 2 cores | 512MB | 100Mbps |
| 50+ | 4 cores | 1GB+ | 1Gbps |

### Optimization

1. **Database**: SQLite is fine for <100 users. Use PostgreSQL for >100 users.

2. **Caching**: Nginx can cache static assets

3. **Load Testing**:
   ```bash
   # Using Apache Bench
   ab -n 1000 -c 50 http://localhost:8000/
   ```

---

## Monitoring

### Health Check

```bash
curl -i http://localhost:8000/health
```

Response:
```json
{
  "status": "ok",
  "version": "1.0.0",
  "app_name": "StageComms"
}
```

### Logs

View live logs:
```bash
docker compose logs -f stagecomms
```

Access logs from container:
```bash
docker exec stagecomms tail -f /app/logs/stagecomms.log
```

### Database Health

```bash
curl http://localhost:8000/health/db
```

---

## Updates & Maintenance

### Update Application

```bash
cd /opt/stagecomms

# Pull latest version
git pull origin main

# Rebuild image
docker compose up --build -d

# View migration status
docker compose logs stagecomms
```

### Clear Cache

```bash
# Remove old images
docker image prune -a

# Remove old volumes
docker volume prune
```

### Database Maintenance

```bash
# Compact database (SQLite)
docker compose exec stagecomms sqlite3 /app/database/stagecomms.db "VACUUM;"

# Check integrity
docker compose exec stagecomms sqlite3 /app/database/stagecomms.db "PRAGMA integrity_check;"
```

---

## Security Considerations

### For Local Network Only

StageComms assumes a trusted local network. For public/remote access:

1. **Add Authentication**:
   - Implement login system
   - Use JWT tokens
   - Add ADMIN_PASSWORD env var

2. **Use HTTPS**:
   ```bash
   # Generate self-signed cert
   openssl req -x509 -newkey rsa:4096 -nodes -out cert.pem -keyout key.pem -days 365
   ```

3. **Network Isolation**:
   - Use VPN for remote access
   - Restrict IP addresses
   - Use firewall rules

### Environment Variables Security

Never commit `.env` file to version control. Use `.env.example` template instead.

```bash
# Never do this:
git add .env

# Do this instead:
git add .env.example
echo ".env" >> .gitignore
```

---

## Troubleshooting Deployment

### Port Already In Use

```bash
# Find what's using port 8000
lsof -i :8000  # macOS/Linux
netstat -ano | findstr :8000  # Windows

# Change port in docker-compose.yml
ports:
  - "8001:8000"
```

### Cannot Connect from Phone

1. **Check IP Address**: `ipconfig` or `ifconfig`
2. **Same Network**: Verify phone is on same Wi-Fi
3. **Firewall**: Allow port 8000
4. **IP Format**: Use `http://` not `https://` for local IP

### Database Errors

```bash
# Check database file exists
docker compose exec stagecomms ls -lh /app/database/

# Recreate database
docker compose exec stagecomms rm /app/database/stagecomms.db
docker compose restart stagecomms
```

### WebSocket Connection Fails

1. Check browser console (F12)
2. Ensure WebSocket protocol (ws://, not http://)
3. Verify firewall allows port 8000
4. Try different browser

---

## Performance Tuning

### Uvicorn Workers

For multiple CPU cores, increase workers in docker-compose.yml:

```bash
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

### Database Connection Pool

In `app/backend/database/db.py`:

```python
engine = create_engine(
    DATABASE_URL,
    pool_size=20,
    max_overflow=40,
)
```

### Static File Caching

In nginx (if using reverse proxy):

```nginx
location /static/ {
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

---

## Disaster Recovery

### Complete System Backup

```bash
# Full backup script
#!/bin/bash
BACKUP_DIR="/backups/stagecomms-$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR

docker compose exec stagecomms tar czf - /app > $BACKUP_DIR/app.tar.gz
docker compose exec stagecomms mysql dump -u root stagecomms > $BACKUP_DIR/database.sql

echo "Backup complete: $BACKUP_DIR"
```

### Restore from Backup

```bash
# Restore database
cat $BACKUP_DIR/database.sql | docker compose exec -T stagecomms mysql -u root

# Restore files
docker compose exec -T stagecomms tar xzf - -C / < $BACKUP_DIR/app.tar.gz
```

---

## Reference

- [Docker Documentation](https://docs.docker.com/)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
- [SQLite Administration](https://www.sqlite.org/admin.html)
- [Uvicorn Settings](https://www.uvicorn.org/settings/)

---

Need help? See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) or check logs with `docker compose logs`.
