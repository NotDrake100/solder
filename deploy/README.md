# Solder Production Deployment Guide

This guide covers deploying **Solder** to a public HTTPS endpoint using **Docker**, **Caddy** (with automatic Let's Encrypt TLS via `sslip.io` or custom domains), and **Google Cloud Run**.

---

## 1. Zero Secrets Policy

> [!IMPORTANT]
> **Never commit or hardcode API keys into any file or Docker image.**
> `GEMINI_API_KEY` is consumed strictly at runtime from `process.env.GEMINI_API_KEY`.
> The Docker image contains **zero secrets**.

To verify your repository is free of secrets:
```bash
git log -p | grep -E "AIza[0-9A-Za-z-_]{35}" || echo "✓ No API keys detected in git history"
```

---

## 2. Architecture Overview

```
Client Browser (Desktop / Mobile)
        │
        ▼ HTTPS (Port 443)
┌──────────────────────────────────────────────┐
│  Caddy Reverse Proxy (Auto TLS / Let's Encrypt) │
│  Domain: solder.<ip>.sslip.io                │
└──────────────────────┬───────────────────────┘
                       │ HTTP (Port 3000)
┌──────────────────────▼───────────────────────┐
│  Solder Application Container (Node 20)       │
│  ├─ Express API (Port 3000)                  │
│  ├─ Static SPA (built React from web/dist)   │
│  ├─ arduino-cli (with arduino:avr core)      │
│  └─ Gemini Flash integration (@google/genai) │
└──────────────────────────────────────────────┘
```

The multi-stage `deploy/Dockerfile`:
1. **Stage 1 (`web-builder`)**: Compiles the Vite + React + Three.js web application into optimized static assets (`web/dist`).
2. **Stage 2 (`runner`)**: Configures Debian Bookworm with **Node.js 20**, installs the official **`arduino-cli`** toolchain with the `arduino:avr:uno` core, mounts static assets, and starts the Express server.

---

## 3. Option A: 1-Click VM Deployment (Recommended)

Ideal for DigitalOcean, Hetzner, AWS EC2, or GCP Compute Engine Linux VMs.

### Step 1: Open Firewall Ports
Ensure ports `80` and `443` (and optionally `22` for SSH) are open:
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw reload
```

### Step 2: Clone and Export Key
```bash
git clone https://github.com/your-org/solder.git
cd solder

# Export your Gemini API key in your current shell session
export GEMINI_API_KEY="your-gemini-api-key"
```

### Step 3: Run Deployment Script
```bash
chmod +x deploy/deploy.sh
./deploy/deploy.sh
```

The script will:
1. Detect the server's public IP (e.g. `159.223.154.151`).
2. Configure a free SSL domain using `sslip.io` (e.g. `https://solder.159-223-154-151.sslip.io`).
3. Build the Docker container.
4. Launch Caddy with auto-provisioned Let's Encrypt HTTPS certificates.
5. Verify `/api/health` and output your live URL.

---

## 4. Option B: Docker Compose (Custom Domain)

If you have your own domain name (e.g. `solder.yourdomain.com`):

### Step 1: Configure DNS
Point an `A` record for `solder.yourdomain.com` to your server's public IP address.

### Step 2: Launch Containers
```bash
export GEMINI_API_KEY="your-gemini-api-key"
export DOMAIN="solder.yourdomain.com"

docker compose -f deploy/docker-compose.yml up -d --build
```

Caddy will automatically negotiate an SSL certificate with Let's Encrypt. Your app will be live at `https://solder.yourdomain.com`.

### Useful Commands:
```bash
# View live application logs
docker compose -f deploy/docker-compose.yml logs -f app

# View Caddy TLS access logs
docker compose -f deploy/docker-compose.yml logs -f caddy

# Restart services
docker compose -f deploy/docker-compose.yml restart

# Stop all services
docker compose -f deploy/docker-compose.yml down
```

---

## 5. Option C: Google Cloud Run Serverless Deployment

Deploy Solder as a serverless container on Google Cloud Run with automatic scaling and zero idle cost.

### Step 1: Authenticate and Set Project
```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
gcloud services enable run.googleapis.com artifactregistry.googleapis.com
```

### Step 2: Create Artifact Registry Repository
```bash
gcloud artifacts repositories create solder-repo \
    --repository-format=docker \
    --location=us-central1 \
    --description="Solder container repository"
```

### Step 3: Build and Submit Image
```bash
gcloud builds submit \
    --tag us-central1-docker.pkg.dev/YOUR_PROJECT_ID/solder-repo/solder:latest \
    -f deploy/Dockerfile .
```

### Step 4: Deploy to Cloud Run
```bash
gcloud run deploy solder \
    --image us-central1-docker.pkg.dev/YOUR_PROJECT_ID/solder-repo/solder:latest \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --port 3000 \
    --memory 1Gi \
    --cpu 1 \
    --set-env-vars GEMINI_API_KEY="your-gemini-api-key",NODE_ENV="production"
```

Cloud Run will output your live HTTPS URL:
`https://solder-<hash>-uc.a.run.app`

---

## 6. Option D: Direct VM Setup (Bare Metal / systemd)

If running directly on the host without Docker:

### 1. Install Node.js 20 & arduino-cli
```bash
# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs openscad

# arduino-cli
curl -fsSL https://raw.githubusercontent.com/arduino/arduino-cli/master/install.sh | sudo BINDIR=/usr/local/bin sh
arduino-cli config init
arduino-cli core update-index
arduino-cli core install arduino:avr
```

### 2. Build Frontend & Install Server
```bash
cd web && npm install && npm run build && cd ..
cd server && npm install && cd ..
```

### 3. systemd Service Setup
Create `/etc/systemd/system/solder.service`:
```ini
[Unit]
Description=Solder Express App
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/solder
Environment="NODE_ENV=production"
Environment="PORT=3000"
EnvironmentFile=/etc/solder.env
ExecStart=/usr/bin/node server/src/index.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Put your key in `/etc/solder.env` (permissions `600`):
```ini
GEMINI_API_KEY=your-gemini-api-key
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now solder
```

---

## 7. Verification & Health Checks

Once deployed, verify the endpoints from your terminal:

### 1. Healthcheck
```bash
curl -i https://<your-domain>/api/health
```
**Expected Response:**
```json
{
  "status": "ok",
  "uptime": 12.4,
  "timestamp": "2026-11-14T16:00:00.000Z"
}
```

### 2. Showcase Products API
```bash
curl -i https://<your-domain>/api/showcase/sip
```
**Expected Response:** 200 OK with full Sip build JSON.

### 3. Arduino Sketch Compilation API
```bash
curl -X POST https://<your-domain>/api/compile \
  -H "Content-Type: application/json" \
  -d '{"sketch":"void setup() { pinMode(7, OUTPUT); } void loop() { digitalWrite(7, HIGH); delay(1000); }"}'
```
**Expected Response:**
```json
{
  "success": true,
  "hex": ":100000000C9434000C9451000C9451000C94510024...",
  "fqbn": "arduino:avr:uno"
}
```

### 4. Browser Verification
1. Navigate to `https://<your-domain>`.
2. Select the **Sip** product card.
3. Switch to the **Case 3D** tab to verify Three.js 3D rendering and the burst reveal animation.
4. Switch to the **Simulate** view to test virtual AVR execution and the moisture slider.
