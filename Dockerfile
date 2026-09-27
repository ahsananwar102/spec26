# ==============================================================================
# SPEC'26 Event Application - Production Dockerfile
# Department of Electronic Engineering, NED University
# Multi-stage optimized build for Cloud Run, Railway, Render, Fly.io, or Docker
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build Frontend Assets
# ------------------------------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package.json bun.lock* ./
RUN npm install --ignore-scripts

# Copy source code and build config
COPY . .

# Build Vite client production bundle into dist/
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Production Minimal HTTP Server
# ------------------------------------------------------------------------------
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Install only production runtime dependencies
COPY package.json ./
RUN npm install --omit=dev --ignore-scripts && npm cache clean --force

# Copy server entrypoint and compiled frontend dist
COPY server.js ./
COPY --from=builder /app/dist ./dist

# Non-root user for security compliance
USER node

EXPOSE 3000

# Docker healthcheck probe using native Node http client
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "const http = require('http'); const req = http.request({ host: '127.0.0.1', port: process.env.PORT || 3000, path: '/api/health', method: 'GET', timeout: 3000 }, (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }); req.on('error', () => process.exit(1)); req.end();"

# Start production server
CMD ["node", "server.js"]
