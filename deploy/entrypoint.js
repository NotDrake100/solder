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
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.wasm': 'application/wasm',
};

// Create the backend API server handler
const apiServer = createApiServer();

function sendFile(req, res, filePath, contentType) {
  const stat = fs.statSync(filePath);
  const totalSize = stat.size;
  const rangeHeader = req.headers?.range;

  if (rangeHeader && typeof rangeHeader === 'string' && rangeHeader.startsWith('bytes=')) {
    const parts = rangeHeader.replace(/bytes=/, '').split('-');
    const start = parts[0] ? parseInt(parts[0], 10) : 0;
    const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;

    if (Number.isNaN(start) || Number.isNaN(end) || start >= totalSize || end >= totalSize || start > end) {
      res.writeHead(416, {
        'Content-Range': `bytes */${totalSize}`,
        'Accept-Ranges': 'bytes',
      });
      res.end();
      return;
    }

    const chunkSize = end - start + 1;
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${totalSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': contentType,
    });
    if (req.method === 'HEAD') {
      res.end();
      return;
    }
    fs.createReadStream(filePath, { start, end }).pipe(res);
    return;
  }

  res.writeHead(200, {
    'Content-Type': contentType,
    'Content-Length': totalSize,
    'Accept-Ranges': 'bytes',
  });
  if (req.method === 'HEAD') {
    res.end();
    return;
  }
  fs.createReadStream(filePath).pipe(res);
}

function serveStatic(req, res, pathname) {
  if (!fs.existsSync(DIST_DIR)) {
    return false;
  }

  let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(DIST_DIR, safePath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const mime = MIME_TYPES[ext] || 'application/octet-stream';
    sendFile(req, res, filePath, mime);
    return true;
  }

  if (pathname === '/' || pathname === '' || (!pathname.startsWith('/api') && !path.extname(pathname))) {
    const indexHtml = path.join(DIST_DIR, 'index.html');
    if (fs.existsSync(indexHtml)) {
      sendFile(req, res, indexHtml, 'text/html; charset=utf-8');
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
