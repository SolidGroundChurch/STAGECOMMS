# Raspberry Pi Docker Setup Guide

## Prerequisites

- Raspberry Pi with Docker installed
- Docker Compose installed
- 192.168.0.12 IP configured on Raspberry Pi
- Local network connectivity

## Step 1: Clone from GitHub

```bash
# SSH into your Raspberry Pi
ssh pi@192.168.0.12

# Clone the repository
cd /home/pi
git clone https://github.com/SolidGroundChurch/STAGECOMMS.git
cd STAGECOMMS
```

## Step 2: Configure for 192.168.0.12

The application is configured to listen on `0.0.0.0:8000` by default, which makes it accessible via any IP address on the network including `192.168.0.12`. No changes needed!

However, you can optionally create a custom `.env` file to ensure consistent configuration:

```bash
# Create .env file from example
cp .env.example .env

# The following are the key settings:
# HOST=0.0.0.0  (listens on all interfaces)
# PORT=8000
# DATABASE_URL=sqlite:////app/database/stagecomms.db
```

## Step 3: Start Docker Container

```bash
# Start in production mode
docker compose up -d

# Verify it's running
docker compose ps

# Check logs
docker compose logs -f stagecomms
```

## Step 4: Access the Application

From any device on the network:

```
http://192.168.0.12:8000
```

Admin panel:
```
http://192.168.0.12:8000/admin
```

## Step 5: Verify Health

```bash
# From the Raspberry Pi or any networked device
curl http://192.168.0.12:8000/health

# Expected response:
# {"status":"ok","version":"1.0.0","app_name":"StageComms"}
```

---

## Raspberry Pi Docker Installation (if needed)

If Docker is not already installed on your Raspberry Pi:

```bash
# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add pi user to docker group
sudo usermod -aG docker pi

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Log out and log back in for group changes to take effect
exit
ssh pi@192.168.0.12
```

---

## Persistent Storage Setup

The docker-compose.yml uses named volumes for data persistence:

```bash
# Check volumes
docker volume ls

# Inspect database volume
docker volume inspect stagecomms_database

# To backup the database
docker run --rm -v stagecomms_database:/data -v /backup:/backup ubuntu \
  tar czf /backup/stagecomms-backup-$(date +%Y%m%d).tar.gz -C /data .

# To restore from backup
docker run --rm -v stagecomms_database:/data -v /backup:/backup ubuntu \
  tar xzf /backup/stagecomms-backup-YYYYMMDD.tar.gz -C /data
```

---

## Managing the Container on Raspberry Pi

### Start the service
```bash
cd /home/pi/STAGECOMMS
docker compose up -d
```

### Stop the service
```bash
docker compose down
```

### View logs
```bash
docker compose logs -f
```

### Restart the service
```bash
docker compose restart
```

### Update from GitHub
```bash
git pull origin main
docker compose down
docker compose build --no-cache
docker compose up -d
```

---

## Performance Optimization for Raspberry Pi

### Limit memory usage

Edit `docker-compose.yml` and add:

```yaml
services:
  stagecomms:
    # ... other config ...
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
```

### Enable swap (if running on older Pi with limited RAM)

```bash
# Create swap file
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## Firewall Configuration (if needed)

### UFW Firewall

```bash
# Allow port 8000
sudo ufw allow 8000/tcp

# Verify
sudo ufw status
```

### Or with iptables directly

```bash
sudo iptables -A INPUT -p tcp --dport 8000 -j ACCEPT
sudo netfilter-persistent save
```

---

## Auto-Start on Boot

Create a systemd service to auto-start the Docker container:

**File: `/etc/systemd/system/stagecomms.service`**

```ini
[Unit]
Description=StageComms Docker Container
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/pi/STAGECOMMS
ExecStart=/usr/bin/docker-compose up -d
ExecStop=/usr/bin/docker-compose down
User=pi

[Install]
WantedBy=multi-user.target
```

Enable it:

```bash
sudo systemctl daemon-reload
sudo systemctl enable stagecomms
sudo systemctl start stagecomms
```

Check status:

```bash
sudo systemctl status stagecomms
```

---

## Monitoring on Raspberry Pi

### Monitor container resources

```bash
docker stats stagecomms
```

### Monitor disk space

```bash
df -h

# Clean up old Docker images/containers
docker system prune -a
```

### Monitor network connectivity

```bash
# Check if accessible from another device
curl http://192.168.0.12:8000/health

# Monitor network traffic
sudo nethogs docker0
```

---

## Troubleshooting

### Port 8000 already in use

```bash
# Find what's using port 8000
sudo lsof -i :8000

# Or use netstat
sudo netstat -tulpn | grep 8000

# Kill the process (find PID first)
kill -9 <PID>
```

### Container won't start

```bash
# Check logs
docker compose logs stagecomms

# Check free memory
free -h

# Check disk space
df -h /
```

### Network connectivity issues

```bash
# From Pi, check if listening
netstat -tulpn | grep 8000

# From another device, test
ping 192.168.0.12
curl -v http://192.168.0.12:8000

# Check firewall
sudo ufw status
```

### Database locked error

```bash
# Restart the container
docker compose restart stagecomms

# If persistent, check file permissions
docker compose exec stagecomms ls -la /app/database/
```

---

## NPM (Nginx Proxy Manager) + Pihole Integration

See [NPM_PIHOLE_SETUP.md](NPM_PIHOLE_SETUP.md) for detailed instructions on setting up Nginx Proxy Manager and Pihole for web-based access.

---

## Backup Strategy

Create a daily backup script:

**File: `/home/pi/backup-stagecomms.sh`**

```bash
#!/bin/bash

BACKUP_DIR="/home/pi/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/stagecomms_backup_$TIMESTAMP.tar.gz"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Stop container
cd /home/pi/STAGECOMMS
docker compose pause stagecomms

# Backup database
docker run --rm -v stagecomms_database:/data -v "$BACKUP_DIR":/backup ubuntu \
  tar czf "/backup/stagecomms_$TIMESTAMP.tar.gz" -C /data .

# Resume container
docker compose unpause stagecomms

# Keep only last 7 days
find "$BACKUP_DIR" -name "stagecomms_*.tar.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE"
```

Add to crontab for daily backups:

```bash
chmod +x /home/pi/backup-stagecomms.sh

# Edit crontab
crontab -e

# Add line for 2 AM daily backup
0 2 * * * /home/pi/backup-stagecomms.sh
```

---

**Next Step**: Continue to [NPM_PIHOLE_SETUP.md](NPM_PIHOLE_SETUP.md) for web-accessible setup
