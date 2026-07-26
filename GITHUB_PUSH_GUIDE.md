# GitHub Push Instructions

## Current Status

Your StageComms repository has been initialized locally with all files committed. You now need to push to GitHub.

## Option 1: Using GitHub CLI (Easiest)

```bash
# Install GitHub CLI
winget install --id GitHub.cli

# Authenticate with GitHub
gh auth login

# Follow the prompts:
# - Select: GitHub.com
# - Select: HTTPS
# - Select: Yes to authenticate Git with your GitHub credentials
# - Paste the device code when prompted
# - A browser window will open for authentication

# Then push from your repository
cd e:\StageComms
& "C:\Program Files\Git\bin\git.exe" push -u origin main
```

## Option 2: Using Personal Access Token (PAT)

If GitHub CLI doesn't work, use a Personal Access Token:

### Step 1: Create GitHub Personal Access Token

1. Go to: https://github.com/settings/tokens
2. Click **Generate new token** → **Generate new token (classic)**
3. Give it a name: "StageComms Push"
4. Select scopes:
   - ✅ `repo` (full control of private repositories)
   - ✅ `workflow` (update GitHub Actions workflows)
5. Click **Generate token**
6. **Copy the token** (you won't see it again!)

### Step 2: Push Using Token

```bash
# In PowerShell, use the token as password
$env:PATH += ";C:\Program Files\Git\bin"
cd e:\StageComms

# Set up credential helper to store the token
& "C:\Program Files\Git\bin\git.exe" config --global credential.helper wincred

# Try pushing
& "C:\Program Files\Git\bin\git.exe" push -u origin main

# When prompted for password, paste your Personal Access Token
```

## Option 3: SSH Keys (Most Secure)

### Step 1: Generate SSH Key

```bash
# In PowerShell
ssh-keygen -t ed25519 -C "media.solidground@gmail.com"

# When prompted:
# - File location: Press Enter for default (c:\Users\<username>\.ssh\id_ed25519)
# - Passphrase: Press Enter (no passphrase for automation)
```

### Step 2: Add SSH Key to GitHub

1. Copy public key:
   ```powershell
   Get-Content $env:USERPROFILE\.ssh\id_ed25519.pub | Set-Clipboard
   ```

2. Go to: https://github.com/settings/keys
3. Click **New SSH key**
4. Paste the key content
5. Click **Add SSH key**

### Step 3: Update Remote URL and Push

```bash
$env:PATH += ";C:\Program Files\Git\bin"
cd e:\StageComms

# Change remote to SSH
& "C:\Program Files\Git\bin\git.exe" remote set-url origin git@github.com:SolidGroundChurch/STAGECOMMS.git

# Verify remote
& "C:\Program Files\Git\bin\git.exe" remote -v

# Push to GitHub
& "C:\Program Files\Git\bin\git.exe" push -u origin main
```

---

## Verify Push Succeeded

After pushing, verify on GitHub:

```
https://github.com/SolidGroundChurch/STAGECOMMS
```

You should see:
- ✅ All files in the repository
- ✅ 57 files uploaded
- ✅ Initial commit message displayed

---

## If Push Fails

### Error: "Repository not found"

```bash
# Verify repository exists at:
https://github.com/SolidGroundChurch/STAGECOMMS

# If it doesn't exist, create it on GitHub.com:
# 1. Go to https://github.com/new
# 2. Repository name: STAGECOMMS
# 3. Description: "Church Production Communication System"
# 4. Make it Public (for team access)
# 5. Don't initialize with README (you have files)
# 6. Create repository
```

### Error: "Authentication failed"

```bash
# Check your credentials are correct:
# - Username: SolidGroundChurch
# - Email: media.solidground@gmail.com

# Or use Personal Access Token instead of password
# See "Option 2" above
```

### Error: "Permission denied"

If using SSH and getting permission denied:

```bash
# Test SSH connection
ssh -T git@github.com

# Should show: "Hi SolidGroundChurch! You've successfully authenticated"

# If not, check:
# 1. SSH key added to GitHub: https://github.com/settings/keys
# 2. SSH agent running: ssh-add -L
```

---

## After Successful Push

### Clone on Raspberry Pi

```bash
# SSH into your Pi
ssh pi@192.168.0.12

# Clone the repository
git clone https://github.com/SolidGroundChurch/STAGECOMMS.git
cd STAGECOMMS

# Build and run
docker compose build
docker compose up -d
```

### Pull Updates Anytime

```bash
cd /home/pi/STAGECOMMS
git pull origin main
docker compose build --no-cache
docker compose down
docker compose up -d
```

---

## Push Command Summary

**Using GitHub CLI (Easiest):**
```bash
$env:PATH += ";C:\Program Files\Git\bin"
cd e:\StageComms
gh auth login
gh repo create --source=. --remote=origin --push
```

**Using PAT (If CLI doesn't work):**
```bash
$env:PATH += ";C:\Program Files\Git\bin"
cd e:\StageComms
& "C:\Program Files\Git\bin\git.exe" config --global credential.helper wincred
& "C:\Program Files\Git\bin\git.exe" push -u origin main
# Paste Personal Access Token when prompted
```

**Using SSH (Most Secure):**
```bash
$env:PATH += ";C:\Program Files\Git\bin"
cd e:\StageComms
& "C:\Program Files\Git\bin\git.exe" remote set-url origin git@github.com:SolidGroundChurch/STAGECOMMS.git
& "C:\Program Files\Git\bin\git.exe" push -u origin main
```

---

## Continuing to Use Git

After successful push, you can:

```bash
# Check status
& "C:\Program Files\Git\bin\git.exe" status

# Make changes and commit
& "C:\Program Files\Git\bin\git.exe" add .
& "C:\Program Files\Git\bin\git.exe" commit -m "Your commit message"
& "C:\Program Files\Git\bin\git.exe" push

# Pull changes from GitHub
& "C:\Program Files\Git\bin\git.exe" pull

# View history
& "C:\Program Files\Git\bin\git.exe" log --oneline
```

---

## Recommended: Create .gitconfig Alias

Make git commands easier by creating an alias:

```powershell
# Add to your PowerShell profile
$PROFILE

# Add these lines:
function git { & "C:\Program Files\Git\bin\git.exe" @args }
```

Then you can just use:
```bash
cd e:\StageComms
git status
git add .
git commit -m "message"
git push
git pull
```

---

**Next Step:** Choose one option above and push your repository to GitHub! 🚀

Once pushed, you can deploy to Raspberry Pi following the RASPBERRY_PI_COMPLETE_SETUP.md guide.
