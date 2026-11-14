#!/usr/bin/env bash
# ==============================================================================
# Solder Automated Production Deployment Script
# Detects public IP, configures sslip.io HTTPS, and boots Docker containers.
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "=================================================="
echo "  🚀 Solder Production Deployment"
echo "=================================================="

# 1. Verify Prerequisites
command -v docker >/dev/null 2>&1 || { echo "❌ Error: docker is not installed. Please install Docker first."; exit 1; }
if ! docker compose version >/dev/null 2>&1 && ! command -v docker-compose >/dev/null 2>&1; then
    echo "❌ Error: docker compose is not installed."
    exit 1
fi

# 2. Check for GEMINI_API_KEY (Zero Secrets in repository)
if [ -z "${GEMINI_API_KEY:-}" ]; then
    if [ -f "${REPO_ROOT}/.env" ] && grep -q "GEMINI_API_KEY" "${REPO_ROOT}/.env"; then
        echo "ℹ️  Loading GEMINI_API_KEY from .env..."
        export $(grep -v '^#' "${REPO_ROOT}/.env" | xargs)
    else
        echo "⚠️  GEMINI_API_KEY is not set in the environment."
        read -rsp "Enter your GEMINI_API_KEY (will NOT be echoed or saved to disk): " KEY_INPUT
        echo ""
        if [ -z "${KEY_INPUT}" ]; then
            echo "❌ Error: GEMINI_API_KEY is required to run Solder generative engine."
            exit 1
        fi
        export GEMINI_API_KEY="${KEY_INPUT}"
    fi
fi
echo "✓ GEMINI_API_KEY verified (length: ${#GEMINI_API_KEY} chars)"

# 3. Detect Public IP & Configure Domain
if [ -z "${DOMAIN:-}" ]; then
    echo "Detecting public IP..."
    PUB_IP=$(curl -s --connect-timeout 4 https://ifconfig.me || curl -s --connect-timeout 4 https://api.ipify.org || echo "")
    
    if [ -n "${PUB_IP}" ]; then
        # Use sslip.io for auto Let's Encrypt TLS
        DASH_IP="${PUB_IP//./-}"
        export DOMAIN="solder.${DASH_IP}.sslip.io"
        echo "✓ Auto-configured domain: https://${DOMAIN}"
    else
        export DOMAIN="localhost"
        echo "⚠️  Could not detect public IP. Falling back to DOMAIN=localhost"
    fi
else
    echo "✓ Using configured DOMAIN: https://${DOMAIN}"
fi

# 4. Build and Start Docker Containers
echo ""
echo "Building and launching containers via Docker Compose..."
cd "${REPO_ROOT}"

if docker compose version >/dev/null 2>&1; then
    COMPOSE_CMD="docker compose -f deploy/docker-compose.yml"
else
    COMPOSE_CMD="docker-compose -f deploy/docker-compose.yml"
fi

${COMPOSE_CMD} down --remove-orphans || true
${COMPOSE_CMD} up -d --build

# 5. Wait for Healthcheck
echo ""
echo "Waiting for Solder application healthcheck..."
MAX_ATTEMPTS=20
ATTEMPT=0
HEALTHY=false

while [ ${ATTEMPT} -lt ${MAX_ATTEMPTS} ]; do
    ATTEMPT=$((ATTEMPT + 1))
    if curl -fs "http://localhost:3000/api/health" >/dev/null 2>&1; then
        HEALTHY=true
        break
    fi
    sleep 2
done

if [ "${HEALTHY}" = true ]; then
    echo ""
    echo "=================================================="
    echo "  🎉 SOLDER DEPLOYED SUCCESSFULLY!"
    echo "=================================================="
    echo "  • Local HTTP:    http://localhost:3000"
    if [ "${DOMAIN}" != "localhost" ]; then
        echo "  • Public HTTPS:  https://${DOMAIN}"
    fi
    echo "  • API Health:    http://localhost:3000/api/health"
    echo "  • Showcase Sip:  http://localhost:3000/api/showcase/sip"
    echo "=================================================="
else
    echo "⚠️  Application did not become healthy in 40s. Checking logs:"
    ${COMPOSE_CMD} logs --tail=30 app
    exit 1
fi
