# ==============================================================================
# Solder Production Dockerfile
# Multi-stage build: Frontend Vite builder + Node.js 20 & arduino-cli runtime
# Zero Secrets Policy: GEMINI_API_KEY is injected at container runtime via env.
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build Frontend Assets (Vite + React + Tailwind)
# ------------------------------------------------------------------------------
FROM node:20-bookworm-slim AS web-builder
WORKDIR /app/web

# Install frontend dependencies
COPY web/package*.json ./
RUN npm ci --prefer-offline || npm install

# Copy frontend source and build production bundle
COPY web/ ./
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Runtime Container (Node 20 + arduino-cli with AVR core)
# ------------------------------------------------------------------------------
FROM node:20-bookworm-slim AS runner

LABEL maintainer="Solder Swarm Team"
LABEL description="Solder - Idea to hardware build engine with 3D viewer & AVR simulation"

ENV NODE_ENV=production
ENV PORT=3000
ENV ARDUINO_CLI_ENABLE_UPDATES=false

WORKDIR /app

# Install system dependencies: curl, ca-certificates, and openscad
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    tar \
    openscad \
    git \
  && rm -rf /var/lib/apt/lists/*

# Install official arduino-cli
RUN curl -fsSL https://raw.githubusercontent.com/arduino/arduino-cli/master/install.sh | BINDIR=/usr/local/bin sh \
  && arduino-cli version

# Initialize arduino-cli and install the Arduino AVR core (Uno / Nano / Mega)
RUN arduino-cli config init \
  && arduino-cli core update-index \
  && arduino-cli core install arduino:avr \
  && arduino-cli core list

# Create non-root application user and grant access to arduino cache
RUN chown -R node:node /root/.arduino15 || true \
  && mkdir -p /home/node/.arduino15 \
  && cp -r /root/.arduino15/* /home/node/.arduino15/ 2>/dev/null || true \
  && chown -R node:node /home/node

# Install backend dependencies
COPY server/package*.json ./server/
RUN cd server && (npm ci --omit=dev || npm install --omit=dev)

# Copy application code
COPY server/ ./server/
COPY showcase/ ./showcase/
COPY parts-lib/ ./parts-lib/
COPY sim/ ./sim/

# Copy built frontend assets into web/dist where Express serves static files
COPY --from=web-builder /app/web/dist ./web/dist

# Ensure proper permissions for node user
RUN chown -R node:node /app

# Run as non-root user for container security
USER node

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

EXPOSE 3000

# Start Express server
CMD ["node", "server/src/index.js"]
