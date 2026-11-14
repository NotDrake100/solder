import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, '../web/dist');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.wasm': 'application/wasm'
};

function tryServeStatic(req, res, pathname) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return false;
  if (pathname.startsWith('/api')) return false;

  const normalized = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(DIST_DIR, normalized);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    setCorsHeaders(res);
    res.writeHead(200, { 'Content-Type': contentType });
    if (req.method === 'HEAD') {
      res.end();
      return true;
    }
    fs.createReadStream(filePath).pipe(res);
    return true;
  }

  // SPA fallback
  const indexPath = path.join(DIST_DIR, 'index.html');
  if (fs.existsSync(indexPath)) {
    setCorsHeaders(res);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    if (req.method === 'HEAD') {
      res.end();
      return true;
    }
    fs.createReadStream(indexPath).pipe(res);
    return true;
  }

  return false;
}
import { getShowcaseList, getShowcaseById } from './routes/showcase.js';
import { handleCreateBuild, getBuildById, handleStreamBuild } from './routes/build.js';
import { handleFixBuild } from './routes/fix.js';
import { handlePhotoUpload } from './routes/photo.js';
import { handleCompile, handleFitCheck } from './routes/hw.js';
import { getRateLimitStatus } from './services/rateLimiter.js';

const PORT = parseInt(process.env.PORT || '3001', 10);

// Helper to set standard CORS headers
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
}

// Helper to parse JSON body
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 25 * 1024 * 1024) { // 25MB max
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('Invalid JSON: ' + err.message));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, data) {
  setCorsHeaders(res);
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function sendError(res, statusCode, message, details = null) {
  sendJson(res, statusCode, { error: true, message, details });
}

export function createServer() {
  return http.createServer(async (req, res) => {
    setCorsHeaders(res);

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const parsedUrl = new URL(req.url, 'http://localhost');
    const pathname = parsedUrl.pathname.replace(/\/+$/, '') || '/';
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || '127.0.0.1';

    try {
      // 1. GET /api/health
      if (req.method === 'GET' && pathname === '/api/health') {
        const rateStatus = getRateLimitStatus(clientIp);
        sendJson(res, 200, {
          status: 'ok',
          service: 'solder-backend',
          timestamp: Date.now(),
          hasApiKey: Boolean(process.env.GEMINI_API_KEY),
          models: [
            'gemini-3.8-flash',
            'gemini-3.5-flash-lite',
            'gemini-4-hydrogen'
          ],
          rateLimit: rateStatus
        });
        return;
      }

      // 2. GET /api/showcase
      if (req.method === 'GET' && pathname === '/api/showcase') {
        const list = getShowcaseList();
        sendJson(res, 200, { showcase: list });
        return;
      }

      // 3. GET /api/showcase/:id
      const showcaseMatch = pathname.match(/^\/api\/showcase\/([a-zA-Z0-9_-]+)$/);
      if (req.method === 'GET' && showcaseMatch) {
        const id = showcaseMatch[1];
        const data = getShowcaseById(id);
        if (!data) {
          sendError(res, 404, `Showcase build not found: ${id}`);
          return;
        }
        sendJson(res, 200, data);
        return;
      }

      // 4. POST /api/build
      if (req.method === 'POST' && pathname === '/api/build') {
        const body = await parseBody(req);
        const result = await handleCreateBuild({
          prompt: body.prompt,
          photoBase64: body.photoBase64 || body.image,
          chips: body.chips,
          ip: clientIp
        });
        sendJson(res, 200, result);
        return;
      }

      // 5. GET /api/build/:id/stream (SSE)
      const streamMatch = pathname.match(/^\/api\/build\/([a-zA-Z0-9_-]+)\/stream$/);
      if (req.method === 'GET' && streamMatch) {
        const id = streamMatch[1];
        await handleStreamBuild(id, req, res);
        return;
      }
      if (req.method === 'GET' && pathname === '/api/build/stream') {
        const id = parsedUrl.searchParams.get('id') || 'sip';
        await handleStreamBuild(id, req, res);
        return;
      }

      // 6. GET /api/build/:id
      const getBuildMatch = pathname.match(/^\/api\/build\/([a-zA-Z0-9_-]+)$/);
      if (req.method === 'GET' && getBuildMatch) {
        const id = getBuildMatch[1];
        const build = getBuildById(id);
        if (!build) {
          sendError(res, 404, `Build not found: ${id}`);
          return;
        }
        sendJson(res, 200, build);
        return;
      }

      // 7. POST /api/fix
      if (req.method === 'POST' && pathname === '/api/fix') {
        const body = await parseBody(req);
        const fixResult = await handleFixBuild(body);
        sendJson(res, 200, fixResult);
        return;
      }

      // 8. POST /api/photo (Scrap mode)
      if (req.method === 'POST' && pathname === '/api/photo') {
        const body = await parseBody(req);
        const photoResult = await handlePhotoUpload(body);
        sendJson(res, 200, photoResult);
        return;
      }

      // 9. POST /api/compile
      if (req.method === 'POST' && pathname === '/api/compile') {
        const body = await parseBody(req);
        const compileResult = await handleCompile(body);
        sendJson(res, 200, compileResult);
        return;
      }

      // 10. POST /api/fitcheck
      if (req.method === 'POST' && pathname === '/api/fitcheck') {
        const body = await parseBody(req);
        const fitResult = await handleFitCheck(body);
        sendJson(res, 200, fitResult);
        return;
      }

      // Serve static frontend from web/dist with SPA fallback for deploy
      if (!pathname.startsWith('/api') && tryServeStatic(req, res, pathname)) {
        return;
      }

      // Root welcome API fallback if web/dist not built
      if (req.method === 'GET' && pathname === '/') {
        sendJson(res, 200, {
          name: 'Solder API Server',
          tagline: 'Type an idea. Get a build.',
          version: '1.0.0',
          endpoints: [
            'GET  /api/health',
            'GET  /api/showcase',
            'GET  /api/showcase/:id',
            'POST /api/build',
            'GET  /api/build/:id',
            'GET  /api/build/:id/stream',
            'POST /api/fix',
            'POST /api/photo',
            'POST /api/compile',
            'POST /api/fitcheck'
          ]
        });
        return;
      }

      // 404
      sendError(res, 404, `Cannot ${req.method} ${pathname}`);
    } catch (err) {
      console.error(`[Server Error] ${req.method} ${pathname}:`, err);
      sendError(res, 500, err.message);
    }
  });
}

// Start standalone server only if run directly
const isMain = process.argv[1] && (
  process.argv[1].endsWith('server.js') ||
  process.argv[1].endsWith('index.js')
);

let defaultServer = null;
if (isMain) {
  defaultServer = createServer();
  defaultServer.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 [Solder Server] Listening on http://0.0.0.0:${PORT}`);
    console.log(`   - Gemini 3.8 Flash (Structured Builds)`);
    console.log(`   - Gemini 3.5 Flash-Lite (Self-Healing Fix)`);
    console.log(`   - Gemini 4 Hydrogen (Escalated Debugging)`);
    console.log(`   - Gemini Vision (Scrap Mode Drawer Scanner)`);
    console.log(`   - Key loaded: ${Boolean(process.env.GEMINI_API_KEY)}`);
  });
}

export default defaultServer;
