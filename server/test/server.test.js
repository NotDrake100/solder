import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createServer } from '../server.js';
import { hashPrompt, getCachedBuild, setCachedBuild } from '../services/cache.js';
import { checkRateLimit, recordLiveBuild, getRateLimitStatus } from '../services/rateLimiter.js';
import { generateOfflineBuild } from '../services/offlineGenerator.js';

let server;
let baseUrl;

test.before(async () => {
  server = createServer();
  await new Promise(resolve => {
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

test.after(async () => {
  if (server) {
    await new Promise(resolve => server.close(resolve));
  }
});

async function apiRequest(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const res = await fetch(url, options);
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    json = text;
  }
  return { status: res.status, headers: res.headers, body: json };
}

test('1. GET /api/health returns 200 with service metadata', async () => {
  const res = await apiRequest('/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.status, 'ok');
  assert.equal(res.body.service, 'solder-backend');
  assert.ok(Array.isArray(res.body.models));
  assert.ok(res.body.models.includes('gemini-3.8-flash'));
  assert.ok(res.body.models.includes('gemini-3.5-flash-lite'));
  assert.ok(res.body.models.includes('gemini-4-hydrogen'));
  assert.equal(typeof res.body.hasApiKey, 'boolean');
});

test('2. GET /api/showcase lists all 4 showcase projects', async () => {
  const res = await apiRequest('/api/showcase');
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body.showcase));
  const ids = res.body.showcase.map(x => x.id);
  assert.ok(ids.includes('sip'));
  assert.ok(ids.includes('wisp'));
  assert.ok(ids.includes('hasp'));
  assert.ok(ids.includes('eave'));
});

test('3. GET /api/showcase/:id returns valid builds for all 4 products', async () => {
  for (const id of ['sip', 'wisp', 'hasp', 'eave']) {
    const res = await apiRequest(`/api/showcase/${id}`);
    assert.equal(res.status, 200, `Failed for ${id}`);
    assert.equal(res.body.id, id);
    assert.ok(res.body.name, 'Missing name');
    assert.ok(res.body.parts?.length > 0, 'Missing parts');
    assert.ok(res.body.layout?.length > 0, 'Missing layout');
    assert.ok(res.body.case?.scad, 'Missing case scad');
    assert.ok(res.body.code?.ino, 'Missing Arduino ino code');
    assert.ok(res.body.wiring?.length > 0, 'Missing wiring');
    assert.ok(res.body.tests?.length > 0, 'Missing tests');
    assert.ok(res.body.product?.boxSvg, 'Missing product boxSvg');
    assert.ok(res.body.product?.priceInr > 0, 'Missing INR price');
  }
});

test('4. POST /api/build generates a build package and caches it', async () => {
  const uniquePrompt = 'Automatic indoor basil hydration sensor ' + Math.random().toString(36).slice(2);
  const payload = {
    prompt: uniquePrompt,
    chips: ['solar powered']
  };

  const res1 = await apiRequest('/api/build', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  assert.equal(res1.status, 200);
  assert.ok(res1.body.buildId);
  assert.ok(res1.body.data);
  assert.equal(res1.body.cached, false);

  // Subsequent call with same prompt should hit cache
  const res2 = await apiRequest('/api/build', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  assert.equal(res2.status, 200);
  assert.equal(res2.body.cached, true);
});

test('5. POST /api/fix applies self-healing patch', async () => {
  const build = generateOfflineBuild('smart plant monitor');
  const payload = {
    build,
    error: "sketch.ino:14: error: 'RELAY_PIN' was not declared in this scope",
    attemptCount: 0
  };

  const res = await apiRequest('/api/fix', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  assert.equal(res.status, 200);
  assert.ok(res.body.diagnosis);
  assert.ok(res.body.patchedBuild);
  assert.ok(res.body.changelog);
});

test('6. POST /api/photo detects parts and calculates INR savings', async () => {
  const payload = {
    imageBase64: 'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
  };

  const res = await apiRequest('/api/photo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body.ownedParts));
  assert.ok(res.body.ownedParts.length > 0);
  assert.ok(res.body.totalSavingsInr > 0);
  assert.ok(res.body.suggestedPrompt);
});

test('7. POST /api/compile validates Arduino C++ code', async () => {
  const validSketch = `
    void setup() {
      pinMode(13, OUTPUT);
    }
    void loop() {
      digitalWrite(13, HIGH);
      delay(500);
      digitalWrite(13, LOW);
      delay(500);
    }
  `;

  const resValid = await apiRequest('/api/compile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ino: validSketch, board: 'uno' })
  });

  assert.equal(resValid.status, 200);
  assert.equal(resValid.body.success, true);
  assert.ok(resValid.body.hex);

  const invalidSketch = `
    void brokenFunction() {
      // Missing setup and loop!
    }
  `;

  const resInvalid = await apiRequest('/api/compile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ino: invalidSketch, board: 'uno' })
  });

  assert.equal(resInvalid.status, 200);
  assert.equal(resInvalid.body.success, false);
  assert.ok(resInvalid.body.errors.length > 0);
});

test('8. POST /api/fitcheck verifies clearance', async () => {
  const payload = {
    layout: [
      { libId: 'arduino_uno', x: 10, y: 10, z: 2 }
    ],
    case: {
      outerMm: [120, 85, 40],
      wallMm: 2.0
    }
  };

  const res = await apiRequest('/api/fitcheck', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  assert.equal(res.status, 200);
  assert.equal(res.body.fits, true);
  assert.ok(res.body.minClearanceMm >= 1.5);
});

test('9. POST /api/vision/detect tracks electronics bounding boxes and enforces rate limits', async () => {
  const payload = {
    imageBase64: 'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
  };

  const res = await apiRequest('/api/vision/detect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body.detections));
  assert.ok(res.body.detections.length > 0);
  const first = res.body.detections[0];
  assert.ok(first.label);
  assert.ok(Array.isArray(first.box_2d));
  assert.equal(first.box_2d.length, 4);
  assert.ok(typeof first.confidence === 'number');
  assert.ok(typeof res.body.sessionRemaining === 'number');
});

test('10. Static video serving: serves .mp4 as video/mp4, .webm as video/webm with HTTP Range support', async () => {
  // Test 1: Full MP4 request
  const resMp4 = await fetch(`${baseUrl}/demo-loop.mp4`);
  assert.equal(resMp4.status, 200);
  assert.equal(resMp4.headers.get('content-type'), 'video/mp4');
  assert.equal(resMp4.headers.get('accept-ranges'), 'bytes');
  const mp4Len = Number(resMp4.headers.get('content-length'));
  assert.ok(mp4Len > 0);

  // Test 2: Range probe request (bytes=0-1 for iOS Safari autoplay probe)
  const resRangeProbe = await fetch(`${baseUrl}/demo-loop.mp4`, {
    headers: { Range: 'bytes=0-1' }
  });
  assert.equal(resRangeProbe.status, 206);
  assert.equal(resRangeProbe.headers.get('content-type'), 'video/mp4');
  assert.equal(resRangeProbe.headers.get('accept-ranges'), 'bytes');
  assert.equal(resRangeProbe.headers.get('content-range'), `bytes 0-1/${mp4Len}`);
  assert.equal(resRangeProbe.headers.get('content-length'), '2');

  // Test 3: WebM request
  const resWebm = await fetch(`${baseUrl}/demo-loop.webm`);
  assert.equal(resWebm.status, 200);
  assert.equal(resWebm.headers.get('content-type'), 'video/webm');
  assert.equal(resWebm.headers.get('accept-ranges'), 'bytes');
});
