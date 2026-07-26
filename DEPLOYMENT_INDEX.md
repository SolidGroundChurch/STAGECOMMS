# StageComms Deployment - Quick Start Index

Complete guide to getting StageComms running on Raspberry Pi with GitHub integration.

## 📋 What You Need to Do

### Phase 1: Push to GitHub (5 minutes)
→ See: **GITHUB_PUSH_GUIDE.md**

1. Choose authentication method (GitHub CLI, PAT, or SSH)
2. Authenticate with GitHub
3. Push your repository
4. Verify at https://github.com/SolidGroundChurch/STAGECOMMS

### Phase 2: Setup Raspberry Pi (15 minutes)
→ See: **RASPBERRY_PI_COMPLETE_SETUP.md**

1. Install Docker on Raspberry Pi
2. Set static IP to 192.168.0.12
3. Clone repository from GitHub
4. Start StageComms with Docker
5. Access at `http://192.168.0.12:8000`

### Phase 3: (Optional) Web Access with Pihole + NPM (30 minutes)
→ See: **RASPBERRY_PI_COMPLETE_SETUP.md** (Phase 3)
→ Or: **NPM_PIHOLE_SETUP.md**

1. Install Pihole (DNS server + ad blocker)
2. Install Nginx Proxy Manager (reverse proxy)
3. Configure proxy to StageComms
4. Configure DNS resolution
5. Access via `http://stagecomms.local`

---

## 🚀 Quick Links

### For Your Development Machine (Windows)
- **Push to GitHub**: [GITHUB_PUSH_GUIDE.md](GITHUB_PUSH_GUIDE.md)

### For Raspberry Pi Setup
- **Complete Setup Guide**: [RASPBERRY_PI_COMPLETE_SETUP.md](RASPBERRY_PI_COMPLETE_SETUP.md) ⭐ **START HERE**
- **Raspberry Pi Details**: [RASPBERRY_PI_SETUP.md](RASPBERRY_PI_SETUP.md)
- **NPM/Pihole Details**: [NPM_PIHOLE_SETUP.md](NPM_PIHOLE_SETUP.md)

### General Documentation
- **Quick Start**: [QUICKSTART.md](QUICKSTART.md)
- **README**: [README.md](README.md)
- **Troubleshooting**: [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- **API Reference**: [API_REFERENCE.md](API_REFERENCE.md)
- **Features**: [FEATURES.md](FEATURES.md)
- **Deployment**: [DEPLOYMENT.md](DEPLOYMENT.md)

---

## 📊 Configuration Reference

### Default Ports

| Service | Port | URL |
|---------|------|-----|
| StageComms | 8000 | `http://192.168.0.12:8000` |
| Pihole (optional) | 53 (DNS) | `http://192.168.0.12/admin` |
| Pihole (optional) | 80 (HTTP) | `http://192.168.0.12/admin` |
| NPM (optional) | 80 (proxy) | `http://stagecomms.local` |
| NPM (optional) | 81 (admin) | `http://192.168.0.12:81` |
| NPM (optional) | 443 (HTTPS) | `https://stagecomms.local` |

### Fixed IP Configuration

**192.168.0.12** is configured in:
- `/etc/dhcpcd.conf` on Raspberry Pi (static IP setting)
- Docker compose uses 0.0.0.0:8000 (all interfaces)
- NPM proxies traffic to StageComms on Docker network
- Pihole DNS resolves `stagecomms.local` to 192.168.0.12

---

## ⏱️ Time Estimates

| Task | Time | Difficulty |
|------|------|------------|
| Push to GitHub | 5 min | Easy |
| Install Docker on RPi | 10 min | Easy |
| Set static IP | 5 min | Easy |
| Clone and run StageComms | 10 min | Easy |
| **Total (Basic Setup)** | **30 min** | **Easy** |
| Install Pihole | 10 min | Easy |
| Install NPM | 5 min | Easy |
| Configure DNS + Proxy | 15 min | Medium |
| **Total (With Pihole+NPM)** | **60 min** | **Medium** |

---

## ✅ Success Checklist

### GitHub Push
- [ ] Git installed on Windows
- [ ] Repository initialized locally
- [ ] All 57 files committed
- [ ] Remote configured to GitHub
- [ ] Successfully pushed to GitHub
- [ ] Verified at https://github.com/SolidGroundChurch/STAGECOMMS

### Raspberry Pi - Basic
- [ ] Docker installed on Raspberry Pi
- [ ] Static IP set to 192.168.0.12
- [ ] Repository cloned from GitHub
- [ ] Docker compose build completed
- [ ] Container running: `docker compose ps`
- [ ] Health check passes: `curl http://192.168.0.12:8000/health`
- [ ] Web UI accessible: `http://192.168.0.12:8000`
- [ ] Admin panel works: `http://192.168.0.12:8000/admin`
- [ ] Can create a test cue
- [ ] Can access from phone on same network

### Raspberry Pi - Advanced (Optional)
- [ ] Pihole running: `http://192.168.0.12/admin`
- [ ] NPM running: `http://192.168.0.12:81`
- [ ] DNS proxy configured
- [ ] Pihole DNS record added for stagecomms.local
- [ ] NPM proxy host configured
- [ ] Router DHCP DNS set to 192.168.0.12
- [ ] Can access via `http://stagecomms.local`
- [ ] SSL certificate configured (optional)
- [ ] Auto-start systemd services configured

---

## 🔧 Common Operations

### After Initial Setup

**Access StageComms**
```
http://192.168.0.12:8000
```

**Access Admin Panel**
```
http://192.168.0.12:8000/admin
```

**SSH into Raspberry Pi**
```bash
ssh pi@192.168.0.12
```

**Check Container Status**
```bash
docker compose ps
```

**View Logs**
```bash
docker compose logs -f stagecomms
```

**Stop Service**
```bash
docker compose down
```

**Update from GitHub**
```bash
cd /home/pi/STAGECOMMS
git pull
docker compose build --no-cache
docker compose up -d
```

**Restart Service**
```bash
docker compose restart stagecomms
```

---

## 📞 Troubleshooting Quick Links

### "Can't access 192.168.0.12:8000"
→ See TROUBLESHOOTING.md → Connection problems

### "Port 8000 already in use"
→ See RASPBERRY_PI_SETUP.md → Troubleshooting

### "Docker daemon not running"
→ Check if Docker is started: `docker ps`

### "Permission denied (container)"
→ Add user to docker group: `sudo usermod -aG docker pi`

### "Can't connect via stagecomms.local"
→ See NPM_PIHOLE_SETUP.md → Troubleshooting

### "Database locked error"
→ Restart container: `docker compose restart stagecomms`

---

## 📚 Documentation Structure

```
e:\StageComms\
├── GITHUB_PUSH_GUIDE.md              ← Push to GitHub
├── RASPBERRY_PI_COMPLETE_SETUP.md    ← START HERE for RPi (comprehensive)
├── RASPBERRY_PI_SETUP.md             ← RPi detailed reference
├── NPM_PIHOLE_SETUP.md               ← Web access setup
│
├── QUICKSTART.md                     ← 5-minute quick start
├── README.md                         ← Full overview
├── DEPLOYMENT.md                     ← Production deployment
├── TROUBLESHOOTING.md                ← Problem solving
├── DEVELOPMENT.md                    ← Development guide
├── API_REFERENCE.md                  ← API documentation
│
├── Dockerfile                        ← Container definition
├── docker-compose.yml                ← Production compose
├── docker-compose.dev.yml            ← Development compose
│
├── requirements.txt                  ← Python dependencies
├── requirements-dev.txt              ← Dev dependencies
├── .env.example                      ← Config template
├── .gitignore                        ← Git exclusions
└── app/                              ← Application code
    └── ...
```

---

## 🎯 Your Next Steps

### Right Now:

1. **Read GITHUB_PUSH_GUIDE.md**
   - Choose how to authenticate
   - Push repository to GitHub

2. **Read RASPBERRY_PI_COMPLETE_SETUP.md**
   - Follow all 6 phases
   - Get StageComms running

### After Basic Setup:

1. **Create Custom Cues**
   - Go to admin panel
   - Add your church's cues

2. **Upload Audio Files**
   - Go to admin panel
   - Upload MP3 files for each cue

3. **Test with Team**
   - Share URL with team
   - Test from phones/tablets

4. **(Optional) Setup Pihole + NPM**
   - Read NPM_PIHOLE_SETUP.md
   - Make it web-accessible

---

## 🔒 Security Notes

### Default Credentials (Change These!)
- **Pihole**: admin / changeme123
- **NPM**: admin@example.com / changeme

### Network Security
- StageComms assumes **trusted local network**
- No authentication by default (name only)
- For external/untrusted networks, add:
  - Firewall rules
  - VPN requirement
  - HTTP Basic Authentication (via NPM)
  - SSL/HTTPS (via NPM + Let's Encrypt)

### Backup Strategy
- Backup database regularly
- Use daily backup script (see RASPBERRY_PI_SETUP.md)
- Keep 7-day rolling backup

---

## 📈 Performance Tips

### For Raspberry Pi with Limited RAM

1. **Add swap space** (1GB)
   ```bash
   sudo fallocate -l 1G /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   ```

2. **Limit container memory**
   - Edit docker-compose.yml
   - Add memory limits: 512M

3. **Clean up old data**
   ```bash
   docker system prune -a
   docker volume prune
   ```

### Monitor Performance
```bash
docker stats              # CPU/Memory usage
htop                      # System usage
df -h                     # Disk space
free -h                   # Memory info
```

---

## 🚀 You're Ready!

Follow these steps in order:

1. ✅ Push to GitHub → GITHUB_PUSH_GUIDE.md
2. ✅ Setup RPi → RASPBERRY_PI_COMPLETE_SETUP.md (Phases 1-2)
3. ✅ (Optional) Web access → RASPBERRY_PI_COMPLETE_SETUP.md (Phase 3)
4. ✅ Persistent → RASPBERRY_PI_COMPLETE_SETUP.md (Phase 4)
5. ✅ Create cues → Use admin panel at 192.168.0.12:8000/admin
6. ✅ Use with team!

**Estimated total time: 30-60 minutes** ⏱️

---

## 📝 Notes

- **192.168.0.12** is your fixed Raspberry Pi IP
- **stagecomms.local** works if Pihole DNS is configured
- Port **8000** is StageComms (always)
- Port **80/443** are Nginx Proxy Manager (optional)
- Port **53** is Pihole DNS (optional)

---

**Questions?** Check the comprehensive documentation or the troubleshooting guides.

**Ready?** Start with [GITHUB_PUSH_GUIDE.md](GITHUB_PUSH_GUIDE.md) → then [RASPBERRY_PI_COMPLETE_SETUP.md](RASPBERRY_PI_COMPLETE_SETUP.md) 🚀
