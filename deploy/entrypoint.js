/**
 * Production unified entrypoint for Solder container.
 * Serves static frontend assets (web/dist) and routes /api/* to the Solder API server.
 * Enables single-container deployment (Cloud Run, Docker) and reverse-proxy deployment (Caddy).
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createApiServer } from '../server/server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const DIST_DIR = path.resolve(REPO_ROOT, 'web', 'dist');

const PORT = parseInt(process.env.PORT || '3000', 10);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.webp': 'image/webp',
};

// Create the backend API server handler
const apiServer = createApiServer();

function serveStatic(req, res, pathname) {
  if (!fs.existsSync(DIST_DIR)) {
    // If web/dist is not present, fall through or return basic info
    return false;
  }

  // Normalize path
  let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(DIST_DIR, safePath);

  // Check if file exists directly
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const mime = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    fs.createReadStream(filePath).pipe(res);
    return true;
  }

  // If root or directory, try index.html
  if (pathname === '/' || pathname === '') {
    const indexHtml = path.join(DIST_DIR, 'index.html');
    if (fs.existsSync(indexHtml)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      fs.createReadStream(indexHtml).pipe(res);
      return true;
    }
  }

  // SPA fallback for HTML requests (not API or asset paths)
  if (!pathname.startsWith('/api') && !path.extname(pathname)) {
    const indexHtml = path.join(DIST_DIR, 'index.html');
    if (fs.existsSync(indexHtml)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      fs.createReadStream(indexHtml).pipe(res);
      return true;
    }
  }

  return false;
}

const mainServer = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // 1. API routes: delegate to Solder API server
  if (pathname.startsWith('/api')) {
    apiServer.emit('request', req, res);
    return;
  }

  // 2. Static files from web/dist
  if (serveStatic(req, res, pathname)) {
    return;
  }

  // 3. Fallback to API server if static not found
  apiServer.emit('request', req, res);
});

mainServer.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 [Solder Production Server] Listening on http://0.0.0.0:${PORT}`);
  console.log(`   - Static SPA:   ${fs.existsSync(DIST_DIR) ? 'web/dist (Loaded ✓)' : 'Not built'}`);
  console.log(`   - API Routes:   /api/*`);
  console.log(`   - Health check: http://localhost:${PORT}/api/health`);
  console.log(`   - Key loaded:   ${Boolean(process.env.GEMINI_API_KEY)}`);
});
