# StageComms on Raspberry Pi - Complete Setup

This is the single document you need to follow to get StageComms running on your Raspberry Pi.

## What You're Building

- **StageComms**: Church production communication app on 192.168.0.12:8000
- **Pihole**: DNS server + Ad blocker (optional but recommended)
- **Nginx Proxy Manager**: Web reverse proxy (optional but recommended)

---

## Phase 1: Prerequisites (15 minutes)

### 1.1 Raspberry Pi Preparation

```bash
# SSH into your Raspberry Pi
ssh pi@192.168.0.12

# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y git curl wget htop net-tools
```

### 1.2 Install Docker

```bash
# Download and install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group (no sudo needed)
sudo usermod -aG docker pi

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

### 1.3 Set Static IP to 192.168.0.12

**For Ethernet:**

```bash
sudo nano /etc/dhcpcd.conf
```

Add at the end:
```
interface eth0
static ip_address=192.168.0.12/24
static routers=192.168.0.1
static domain_name_servers=192.168.0.1 8.8.8.8
```

**For WiFi:**

```bash
sudo nano /etc/dhcpcd.conf
```

Add at the end:
```
interface wlan0
static ip_address=192.168.0.12/24
static routers=192.168.0.1
static domain_name_servers=192.168.0.1 8.8.8.8
```

Save and restart:
```bash
sudo reboot
```

Verify:
```bash
hostname -I
# Should show: 192.168.0.12 ...
```

---

## Phase 2: Clone and Setup StageComms (10 minutes)

### 2.1 Clone from GitHub

```bash
cd /home/pi
git clone https://github.com/SolidGroundChurch/STAGECOMMS.git
cd STAGECOMMS
```

### 2.2 Create Environment File

```bash
cp .env.example .env
```

Edit if needed (defaults work fine):
```bash
nano .env
```

Key settings (leave defaults):
- `HOST=0.0.0.0` - Listen on all interfaces
- `PORT=8000` - Application port
- `DATABASE_URL=sqlite:////app/database/stagecomms.db` - Database location

### 2.3 Build and Start

```bash
# Build the Docker image (first time only, takes 2-3 minutes)
docker compose build

# Start the service
docker compose up -d

# Verify it's running
docker compose ps
```

### 2.4 Test Access

From any device on the network:

```bash
# Test from Raspberry Pi
curl http://localhost:8000/health

# Test from another device (replace with your Pi's IP)
curl http://192.168.0.12:8000/health

# Should return:
# {"status":"ok","version":"1.0.0","app_name":"StageComms"}
```

### 2.5 Access the Application

Open browser and go to:
```
http://192.168.0.12:8000
```

✅ **StageComms is now running!**

---

## Phase 3: (Optional) Setup Pihole + NPM for Web Access (30 minutes)

Skip this phase if you just want basic local access.

### 3.1 Create Pihole Docker Container

```bash
# Create pihole directory
mkdir -p /home/pi/docker-services

# Create docker-compose file for Pihole
cat > /home/pi/docker-services/docker-compose-pihole.yml << 'EOF'
version: '3.8'

services:
  pihole:
    container_name: pihole
    image: pihole/pihole:latest
    ports:
      - "53:53/tcp"
      - "53:53/udp"
    environment:
      TZ: 'America/Chicago'
      WEBPASSWORD: 'changeme123'
    volumes:
      - pihole_data:/etc/pihole
      - dnsmasq_data:/etc/dnsmasq.d
    restart: unless-stopped

volumes:
  pihole_data:
  dnsmasq_data:
EOF

# Start Pihole
cd /home/pi/docker-services
docker compose -f docker-compose-pihole.yml up -d

# Check it's running
docker compose -f docker-compose-pihole.yml ps
```

Access Pihole admin panel:
```
http://192.168.0.12/admin
Username: admin
Password: changeme123
```

### 3.2 Create Nginx Proxy Manager (NPM) Container

```bash
# Create NPM docker-compose file
cat > /home/pi/docker-services/docker-compose-npm.yml << 'EOF'
version: '3.8'

services:
  npm:
    container_name: npm
    image: 'jc21/nginx-proxy-manager:latest'
    restart: unless-stopped
    ports:
      - '80:80'
      - '443:443'
      - '81:81'
    environment:
      DB_SQLITE_FILE: "/data/database.sqlite"
    volumes:
      - npm_data:/data
      - npm_letsencrypt:/etc/letsencrypt

volumes:
  npm_data:
  npm_letsencrypt:
EOF

# Start NPM
docker compose -f docker-compose-npm.yml up -d

# Check it's running
docker compose -f docker-compose-npm.yml ps
```

Access NPM admin panel (port 81):
```
http://192.168.0.12:81
Email: admin@example.com
Password: changeme
```

⚠️ **Change this password immediately!**

### 3.3 Configure NPM to Proxy StageComms

1. Open NPM admin: `http://192.168.0.12:81`
2. Go to **Proxy Hosts** → **Add Proxy Host**
3. Fill in:
   - **Domain Names**: `stagecomms.local`
   - **Scheme**: `http`
   - **Forward Hostname/IP**: `stagecomms` (or `172.17.0.2` - Docker container IP)
   - **Forward Port**: `8000`
4. Click **Save**

### 3.4 Configure Pihole DNS

1. Open Pihole admin: `http://192.168.0.12/admin`
2. Go to **Local DNS Records** (under DNS settings)
3. Add custom record:
   - **Domain**: `stagecomms.local`
   - **IP**: `192.168.0.12`
4. Save

### 3.5 Set Router DNS to Pihole

1. Access router admin (usually `192.168.0.1`)
2. Find DHCP settings
3. Set DNS to `192.168.0.12`
4. Save and reboot router

### 3.6 Access via DNS Name

Now you can access from any device:
```
http://stagecomms.local
http://stagecomms.local/admin
```

---

## Phase 4: Make It Persistent (Auto-Start on Reboot)

### 4.1 Auto-Start StageComms

Create systemd service:

```bash
sudo nano /etc/systemd/system/stagecomms.service
```

Add:
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

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable stagecomms
sudo systemctl start stagecomms
```

Verify:
```bash
sudo systemctl status stagecomms
```

### 4.2 Auto-Start Pihole (if installed)

```bash
sudo nano /etc/systemd/system/pihole-docker.service
```

Add:
```ini
[Unit]
Description=Pihole Docker Container
After=docker.service stagecomms.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/pi/docker-services
ExecStart=/usr/bin/docker-compose -f docker-compose-pihole.yml up -d
ExecStop=/usr/bin/docker-compose -f docker-compose-pihole.yml down
User=pi

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable pihole-docker
sudo systemctl start pihole-docker
```

### 4.3 Auto-Start NPM (if installed)

```bash
sudo nano /etc/systemd/system/npm-docker.service
```

Add:
```ini
[Unit]
Description=Nginx Proxy Manager Docker Container
After=docker.service pihole-docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/pi/docker-services
ExecStart=/usr/bin/docker-compose -f docker-compose-npm.yml up -d
ExecStop=/usr/bin/docker-compose -f docker-compose-npm.yml down
User=pi

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable npm-docker
sudo systemctl start npm-docker
```

---

## Phase 5: Daily Operations

### Starting Services

```bash
# Start only StageComms
cd /home/pi/STAGECOMMS
docker compose up -d

# Or if using systemd
sudo systemctl start stagecomms
```

### Stopping Services

```bash
# Stop StageComms
cd /home/pi/STAGECOMMS
docker compose down

# Or with systemd
sudo systemctl stop stagecomms
```

### Viewing Logs

```bash
# StageComms logs
docker compose logs -f stagecomms

# Last 50 lines
docker compose logs --tail=50 stagecomms

# Pihole logs (if running)
docker compose -f /home/pi/docker-services/docker-compose-pihole.yml logs -f

# NPM logs (if running)
docker compose -f /home/pi/docker-services/docker-compose-npm.yml logs -f
```

### Checking Service Status

```bash
# All containers
docker ps

# Resources
docker stats

# Network info
docker network ls
docker network inspect bridge
```

### Updating StageComms

```bash
cd /home/pi/STAGECOMMS

# Pull latest from GitHub
git pull origin main

# Rebuild image
docker compose build --no-cache

# Restart
docker compose down
docker compose up -d
```

---

## Phase 6: Troubleshooting

### StageComms won't start

```bash
# Check logs
docker compose logs stagecomms

# Common issues:
# 1. Port 8000 already in use
netstat -tulpn | grep 8000

# 2. Database locked
docker compose restart stagecomms

# 3. Out of memory
free -h
df -h

# Try restarting
docker compose down
sleep 5
docker compose up -d
```

### Can't access 192.168.0.12:8000

```bash
# From Raspberry Pi
curl http://localhost:8000

# From another device
ping 192.168.0.12
curl -v http://192.168.0.12:8000

# Check if container is running
docker compose ps
docker logs stagecomms
```

### Pihole DNS not working

```bash
# Test DNS
nslookup stagecomms.local 192.168.0.12

# Check Pihole status
docker compose -f /home/pi/docker-services/docker-compose-pihole.yml logs

# Restart Pihole
docker compose -f /home/pi/docker-services/docker-compose-pihole.yml restart
```

### Port 80/443 already in use (for NPM)

```bash
# Find what's using the ports
netstat -tulpn | grep :80
netstat -tulpn | grep :443

# If Pihole is using port 80:
# Edit Pihole docker-compose to use different ports:
# Change "80:80" to "8080:80"
# Then access at http://192.168.0.12:8080
```

---

## Access URLs Summary

| Service | URL | Status |
|---------|-----|--------|
| **StageComms** | `http://192.168.0.12:8000` | ✅ Direct |
| **StageComms Admin** | `http://192.168.0.12:8000/admin` | ✅ Direct |
| **StageComms Health** | `http://192.168.0.12:8000/health` | ✅ Direct |
| **Pihole Admin** | `http://192.168.0.12/admin` | 📍 Optional |
| **NPM Admin** | `http://192.168.0.12:81` | 📍 Optional |
| **StageComms via DNS** | `http://stagecomms.local` | 📍 Optional |

---

## Performance Tips for Raspberry Pi

### If running slowly:

1. **Enable Swap** (for older Pi models):
   ```bash
   sudo fallocate -l 1G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   ```

2. **Limit Container Memory**:
   Edit `docker-compose.yml`:
   ```yaml
   services:
     stagecomms:
       deploy:
         resources:
           limits:
             memory: 512M
   ```

3. **Monitor Resources**:
   ```bash
   docker stats
   htop
   ```

4. **Clean Up Old Containers**:
   ```bash
   docker system prune -a
   docker volume prune
   ```

---

## Backup Strategy

### Daily Backup Script

```bash
#!/bin/bash
# Save as /home/pi/backup-stagecomms.sh

BACKUP_DIR="/home/pi/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

# Backup database
cd /home/pi/STAGECOMMS
docker compose exec -T stagecomms tar czf - /app/database > "$BACKUP_DIR/stagecomms_$TIMESTAMP.tar.gz"

# Keep only last 7 days
find "$BACKUP_DIR" -name "stagecomms_*.tar.gz" -mtime +7 -delete

echo "Backup created: $BACKUP_DIR/stagecomms_$TIMESTAMP.tar.gz"
```

Make executable and add to cron:

```bash
chmod +x /home/pi/backup-stagecomms.sh

# Edit crontab
crontab -e

# Add line for 2 AM daily
0 2 * * * /home/pi/backup-stagecomms.sh
```

---

## Firewall Setup (Optional but Recommended)

```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow 22/tcp

# Allow StageComms
sudo ufw allow 8000/tcp

# Allow Pihole DNS
sudo ufw allow 53

# Allow Pihole Web UI
sudo ufw allow 80/tcp

# Allow NPM
sudo ufw allow 443/tcp

# Allow NPM Admin (local only)
sudo ufw allow from 192.168.0.0/24 to any port 81

# Check status
sudo ufw status
```

---

## Testing Checklist

After setup, verify everything works:

- [ ] Docker and Docker Compose installed
- [ ] Static IP set to 192.168.0.12
- [ ] StageComms running: `curl http://192.168.0.12:8000/health`
- [ ] Access web UI: `http://192.168.0.12:8000`
- [ ] Access admin: `http://192.168.0.12:8000/admin`
- [ ] Create a test cue in admin
- [ ] Test from phone on same network
- [ ] Test audio playback
- [ ] (Optional) Pihole running: `http://192.168.0.12/admin`
- [ ] (Optional) NPM running: `http://192.168.0.12:81`
- [ ] Services auto-start after reboot

---

## Next: Add Custom Cues

1. Open `http://192.168.0.12:8000/admin`
2. Click "Create New Cue"
3. Enter cue details (name, color, icon)
4. Upload audio file (MP3) if desired
5. Save
6. Test by opening main app and clicking the new cue button

---

## Support & Documentation

For detailed information, see:

- **QUICKSTART.md** - Fast setup guide
- **README.md** - Complete overview
- **TROUBLESHOOTING.md** - Problem solving
- **API_REFERENCE.md** - API documentation
- **RASPBERRY_PI_SETUP.md** - Detailed RPi guide
- **NPM_PIHOLE_SETUP.md** - NPM/Pihole details

---

## Summary

✅ **You now have:**
- StageComms running on Raspberry Pi at 192.168.0.12:8000
- Persistent storage for cues and messages
- Auto-start on reboot (optional)
- (Optional) Pihole for DNS + ad blocking
- (Optional) Nginx Proxy Manager for web access
- Complete documentation

**Ready to use!** Open `http://192.168.0.12:8000` from any device. 🚀

---

**Questions?** Check the troubleshooting section or review the comprehensive documentation files included in the project.
