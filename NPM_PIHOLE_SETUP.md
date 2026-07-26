# NPM (Nginx Proxy Manager) + Pihole Setup Guide

Complete guide to make StageComms web-accessible using Nginx Proxy Manager (NPM) and Pihole on Raspberry Pi.

## Architecture Overview

```
Internet/Devices
       ↓
   Pihole (DNS)
       ↓
NPM (Reverse Proxy) → port 80/443
       ↓
StageComms (port 8000)
```

- **Pihole**: DNS server + Ad blocker (port 53)
- **NPM**: Reverse proxy (ports 80, 443, 81)
- **StageComms**: Application (port 8000, internal only)

---

## Prerequisites

- StageComms already running via Docker on 192.168.0.12
- Raspberry Pi with Docker and Docker Compose
- Domain name or subdomain (e.g., stagecomms.local or stagecomms.yourdom.com)
- Port forwarding configured on router (if accessing from outside network)

---

## Step 1: Set Static IP (192.168.0.12)

On your Raspberry Pi:

```bash
# Edit dhcpcd configuration
sudo nano /etc/dhcpcd.conf

# Add these lines at the end:
interface eth0
static ip_address=192.168.0.12/24
static routers=192.168.0.1
static domain_name_servers=192.168.0.1 8.8.8.8

# Or for WiFi:
interface wlan0
static ip_address=192.168.0.12/24
static routers=192.168.0.1
static domain_name_servers=192.168.0.1 8.8.8.8
```

Save and reboot:
```bash
sudo reboot
```

Verify:
```bash
hostname -I
```

---

## Step 2: Install Pihole via Docker Compose

Create a Pihole container alongside StageComms:

**File: `/home/pi/docker-compose-pihole.yml`**

```yaml
version: '3.8'

services:
  pihole:
    container_name: pihole
    image: pihole/pihole:latest
    ports:
      - "53:53/tcp"
      - "53:53/udp"
      - "80:80"
      - "443:443"
    environment:
      TZ: 'America/Chicago'  # Change to your timezone
      WEBPASSWORD: 'changeme123'  # Change this password!
      PIHOLE_WEBUI_DEFAULT_ADMIN: 'true'
    volumes:
      - pihole_data:/etc/pihole
      - dnsmasq_data:/etc/dnsmasq.d
    restart: unless-stopped
    networks:
      - pi_network

volumes:
  pihole_data:
  dnsmasq_data:

networks:
  pi_network:
    driver: bridge
```

Start Pihole:

```bash
docker compose -f docker-compose-pihole.yml up -d

# Verify
docker compose -f docker-compose-pihole.yml ps
```

Access Pihole admin:
```
http://192.168.0.12/admin
# Default username: admin
# Default password: changeme123 (as set above)
```

---

## Step 3: Install Nginx Proxy Manager (NPM)

Create NPM container:

**File: `/home/pi/docker-compose-npm.yml`**

```yaml
version: '3.8'

services:
  npm:
    container_name: nginx-proxy-manager
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
    networks:
      - pi_network

volumes:
  npm_data:
  npm_letsencrypt:

networks:
  pi_network:
    driver: bridge
```

Start NPM:

```bash
docker compose -f docker-compose-npm.yml up -d

# Verify
docker compose -f docker-compose-npm.yml ps
```

Access NPM admin panel:
```
http://192.168.0.12:81
```

Default credentials:
- Email: `admin@example.com`
- Password: `changeme`

⚠️ **Change these immediately!**

---

## Step 4: Connect Networks (Pihole + StageComms + NPM)

Update your existing StageComms docker-compose.yml to use the same network:

**File: `/home/pi/STAGECOMMS/docker-compose.yml`**

```yaml
version: '3.8'

services:
  stagecomms:
    build: .
    container_name: stagecomms
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=sqlite:////app/database/stagecomms.db
      - HOST=0.0.0.0
      - PORT=8000
      - DEBUG=false
    volumes:
      - ./app/database:/app/database
      - ./app/uploads:/app/uploads
      - ./app/logs:/app/logs
      - ./app/static:/app/static
      - ./app/templates:/app/templates
    restart: unless-stopped
    networks:
      - pi_network

networks:
  pi_network:
    driver: bridge
    external: true  # Use the shared network
```

Recreate the network and containers:

```bash
cd /home/pi/STAGECOMMS

# Stop the old container
docker compose down

# Create the network (if using separate docker-compose files)
# Or ensure all three share the same network

# Start StageComms
docker compose up -d
```

---

## Step 5: Configure NPM to Proxy StageComms

1. Open NPM admin panel: `http://192.168.0.12:81`

2. Go to **Proxy Hosts**

3. Click **Add Proxy Host**

4. Fill in:

   **Domain Names**: 
   - `stagecomms.local` (for local network)
   - Or your domain if you have one

   **Scheme**: `http`
   
   **Forward Hostname/IP**: `stagecomms` (Docker container name)
   
   **Forward Port**: `8000`

5. Click **Save**

6. (Optional) Click the host and set up SSL with Let's Encrypt if using a real domain

---

## Step 6: Configure Pihole DNS

1. Open Pihole admin: `http://192.168.0.12/admin`

2. Go to **Settings** → **DNS**

3. Add custom DNS record:
   - Domain: `stagecomms.local`
   - IP: `192.168.0.12`

   Or use Dnsmasq directly:
   
   **File: `/etc/dnsmasq.d/stagecomms.conf`** (in Pihole container)
   
   ```
   address=/stagecomms.local/192.168.0.12
   ```

4. Save and restart Pihole

---

## Step 7: Configure Devices to Use Pihole DNS

### Method 1: Configure Router DHCP (Recommended)

1. Access your router admin panel (usually 192.168.0.1)
2. Find DHCP settings
3. Set DNS server to `192.168.0.12`
4. Save and reboot devices

All devices will now use Pihole for DNS.

### Method 2: Manual Device Configuration

Configure each device individually:

**Android:**
- Settings → Network → WiFi → Edit → Advanced
- DNS servers: `192.168.0.12`

**iPhone:**
- Settings → WiFi → Network Name → Configure DNS
- Manual → Add: `192.168.0.12`

**Windows:**
- Settings → Network → WiFi → Change adapter options
- Properties → IPv4 → Use these DNS servers: `192.168.0.12`

**Mac:**
- System Preferences → Network → WiFi → Advanced → DNS
- Add: `192.168.0.12`

---

## Step 8: Access StageComms via NPM

After configuration, you can access StageComms from any device:

### Local Network (via DNS)
```
http://stagecomms.local
http://stagecomms.local/admin
```

### Direct IP (always works)
```
http://192.168.0.12
http://192.168.0.12/admin
```

### Proxied via NPM (if configured)
```
http://192.168.0.12:80  (if not forwarded)
```

---

## Step 9: Optional - Port Forwarding for External Access

To access StageComms from outside your network:

### Router Configuration

1. Access router admin panel
2. Find Port Forwarding settings
3. Configure:
   - External Port: `80` (HTTP) or `443` (HTTPS)
   - Internal IP: `192.168.0.12`
   - Internal Port: `80` (NPM's external port)

4. For HTTPS with Let's Encrypt:
   - In NPM, edit the proxy host
   - Enable SSL Certificate → Request a new SSL certificate
   - Follow Let's Encrypt setup
   - Add your domain name

### Dynamic DNS (if you have dynamic IP)

If your ISP provides dynamic IP:

1. Get a domain (e.g., yourdomain.com)
2. Use a DDNS service (DuckDNS, Cloudflare, etc.)
3. Configure to update your IP
4. Use that domain in NPM proxy host

```bash
# Example with DuckDNS
curl "https://www.duckdns.org/update?domains=yourdomain&token=YOUR_TOKEN"
```

---

## Troubleshooting

### Can't access stagecomms.local

```bash
# Check Pihole DNS is working
nslookup stagecomms.local 192.168.0.12

# If on Pi itself
ping stagecomms

# Check container connectivity
docker network inspect pi_network
```

### NPM not reverse proxying correctly

1. Check NPM logs:
   ```bash
   docker logs nginx-proxy-manager
   ```

2. Verify StageComms is accessible:
   ```bash
   curl http://stagecomms:8000/health
   ```

3. Restart NPM:
   ```bash
   docker compose -f docker-compose-npm.yml restart npm
   ```

### Pihole not resolving DNS

1. Check Pihole logs:
   ```bash
   docker logs pihole
   ```

2. Verify DNS configuration:
   ```bash
   nslookup stagecomms.local 192.168.0.12
   ```

3. Restart Pihole:
   ```bash
   docker compose -f docker-compose-pihole.yml restart pihole
   ```

### Slow connectivity

- Check if devices are using Pihole DNS
- Pihole has ad blocking enabled which may slow things
- Disable Ad blocking in Pihole settings if needed:
  - Pihole Admin → Settings → DNS → Blocking mode: Disabled

---

## Combined Docker Compose (All Services)

**Recommended: Create a single file at `/home/pi/docker-compose-all.yml`**

```yaml
version: '3.8'

services:
  stagecomms:
    build: ./STAGECOMMS
    container_name: stagecomms
    environment:
      - DATABASE_URL=sqlite:////app/database/stagecomms.db
      - HOST=0.0.0.0
      - PORT=8000
      - DEBUG=false
    volumes:
      - ./STAGECOMMS/app/database:/app/database
      - ./STAGECOMMS/app/uploads:/app/uploads
      - ./STAGECOMMS/app/logs:/app/logs
    restart: unless-stopped
    networks:
      - pi_network
    depends_on:
      - pihole
      - npm

  pihole:
    container_name: pihole
    image: pihole/pihole:latest
    environment:
      TZ: 'America/Chicago'
      WEBPASSWORD: 'changeme123'
    volumes:
      - pihole_data:/etc/pihole
      - dnsmasq_data:/etc/dnsmasq.d
    restart: unless-stopped
    networks:
      - pi_network

  npm:
    container_name: nginx-proxy-manager
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
    networks:
      - pi_network
    depends_on:
      - pihole

volumes:
  pihole_data:
  dnsmasq_data:
  npm_data:
  npm_letsencrypt:

networks:
  pi_network:
    driver: bridge
```

Start all services:

```bash
cd /home/pi
docker compose -f docker-compose-all.yml up -d
```

---

## Security Considerations

### Change All Default Passwords

1. Pihole: Change admin password
2. NPM: Change admin email/password
3. Update docker-compose environment variables

### Firewall Rules

```bash
# Only allow necessary ports
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (if needed)
sudo ufw allow 22/tcp

# Allow DNS (Pihole)
sudo ufw allow 53

# Allow HTTP/HTTPS (NPM)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow NPM Admin (restrict to local network)
sudo ufw allow from 192.168.0.0/24 to any port 81

# Enable firewall
sudo ufw enable
```

### Backup Important Data

```bash
# Backup Pihole settings
docker run --rm -v pihole_data:/data -v /backup:/backup ubuntu \
  tar czf /backup/pihole_backup.tar.gz -C /data .

# Backup NPM settings
docker run --rm -v npm_data:/data -v /backup:/backup ubuntu \
  tar czf /backup/npm_backup.tar.gz -C /data .
```

---

## Monitoring & Maintenance

### Check service health

```bash
docker compose -f docker-compose-all.yml ps

# Check logs
docker compose -f docker-compose-all.yml logs -f

# Check resource usage
docker stats
```

### Update containers

```bash
# Pull latest images
docker compose pull

# Rebuild and restart
docker compose down
docker compose up -d
```

### Clean up old containers/images

```bash
docker system prune -a
```

---

## Quick Access URLs

After setup:

| Service | URL | Port | Login |
|---------|-----|------|-------|
| StageComms | `http://192.168.0.12:8000` | 8000 | No login |
| StageComms Admin | `http://192.168.0.12:8000/admin` | 8000 | No login |
| NPM Admin | `http://192.168.0.12:81` | 81 | admin@example.com |
| Pihole Admin | `http://192.168.0.12/admin` | 80 | admin |

---

## Next Steps

1. ✅ Configure NPM proxy host
2. ✅ Configure Pihole DNS
3. ✅ Set up port forwarding (if external access needed)
4. ✅ Configure SSL/HTTPS (optional but recommended)
5. ✅ Set up automated backups
6. ✅ Monitor service health

Your StageComms is now web-accessible! 🚀
