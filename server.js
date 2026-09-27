import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';
const DIST_DIR = path.resolve(__dirname, 'dist');

// Ensure dist directory exists
if (!fs.existsSync(DIST_DIR)) {
  console.error('[SPEC26-SERVER] Error: dist/ directory not found. Please run "npm run build" before starting the server.');
  process.exit(1);
}

// Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// JSON body parsing for lightweight API handlers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check endpoint for Cloud Run, Kubernetes, AWS ALB, Render
app.get(['/health', '/api/health'], (req, res) => {
  res.status(200).json({
    status: 'ok',
    event: "SPEC'26 - NED University Engineering Exhibition",
    department: 'Department of Electronic Engineering',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// Serve hashed production assets with 1-year immutable cache
app.use(
  '/assets',
  express.static(path.join(DIST_DIR, 'assets'), {
    maxAge: '1y',
    immutable: true,
  })
);

// Serve other static files (favicons, robots.txt, etc.) with standard caching
app.use(
  express.static(DIST_DIR, {
    maxAge: '1h',
    index: false,
  })
);

// SPA Client-Side Fallback: Serve index.html for all non-file navigation requests
app.get('*', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.join(DIST_DIR, 'index.html'));
});

// Start Express server
const server = app.listen(PORT, HOST, () => {
  console.log('================================================================');
  console.log(` SPEC'26 Event Application Server is Running`);
  console.log(` Host: http://${HOST}:${PORT}`);
  console.log(` Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(` Static Root: ${DIST_DIR}`);
  console.log('================================================================');
});

// Graceful Shutdown handling
const handleShutdown = (signal) => {
  console.log(`\n[SPEC26-SERVER] Received ${signal}. Gracefully shutting down HTTP server...`);
  server.close(() => {
    console.log('[SPEC26-SERVER] HTTP server closed cleanly.');
    process.exit(0);
  });

  // Force shutdown after 10s timeout
  setTimeout(() => {
    console.error('[SPEC26-SERVER] Forced shutdown timed out after 10s.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
