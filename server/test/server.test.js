import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { buildCache } from '../src/cache.js';
import { rateLimiter } from '../src/rateLimiter.js';

let server;
let baseUrl;

test.before(async () => {
  const app = createApp();
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test.beforeEach(() => {
  buildCache.clear();
  rateLimiter.reset();
});

test('GET /api/health returns 200 and ok status', async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.status, 'ok');
  assert.equal(typeof data.uptime, 'number');
  assert.equal(typeof data.gemini, 'object');
});

test('GET /api/showcase/sip returns valid Sip build', async () => {
  const res = await fetch(`${baseUrl}/api/showcase/sip`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.name, 'Sip');
  assert.equal(data.board, 'uno');
  assert.ok(Array.isArray(data.parts));
  assert.ok(data.parts.length > 0);
  assert.ok(Array.isArray(data.layout));
  assert.ok(data.case && Array.isArray(data.case.outerMm));
  assert.ok(Array.isArray(data.wiring));
  assert.ok(data.code && typeof data.code.ino === 'string');
});

test('GET /api/showcase/:id returns valid builds for all 4 showcase products (sip, wisp, hasp, eave)', async () => {
  for (const id of ['sip', 'wisp', 'hasp', 'eave']) {
    const res = await fetch(`${baseUrl}/api/showcase/${id}`);
    assert.equal(res.status, 200, `Showcase ${id} returned status ${res.status}`);
    const data = await res.json();
    assert.ok(data.name, `Showcase ${id} missing name`);
    assert.ok(data.board, `Showcase ${id} missing board`);
    assert.ok(Array.isArray(data.parts) && data.parts.length > 0, `Showcase ${id} missing parts`);
    assert.ok(Array.isArray(data.layout) && data.layout.length > 0, `Showcase ${id} missing layout`);
    assert.ok(data.case?.outerMm, `Showcase ${id} missing case.outerMm`);
    assert.ok(Array.isArray(data.wiring), `Showcase ${id} missing wiring`);
    assert.ok(data.code?.ino, `Showcase ${id} missing code.ino`);
  }
});

test('GET /api/showcase/invalid-id returns 404', async () => {
  const res = await fetch(`${baseUrl}/api/showcase/invalid-product`);
  assert.equal(res.status, 404);
  const data = await res.json();
  assert.equal(data.error, 'showcase_not_found');
});

test('POST /api/build rejects empty prompt with 400', async () => {
  const res = await fetch(`${baseUrl}/api/build`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: '' }),
  });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.error, 'invalid_request');
});

test('POST /api/build generates valid build and agent log', async () => {
  const res = await fetch(`${baseUrl}/api/build`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: 'Smart plant watering system with soil sensor' }),
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(data.name);
  assert.ok(data.tagline);
  assert.ok(Array.isArray(data.parts));
  assert.ok(Array.isArray(data.layout));
  assert.ok(data.case);
  assert.ok(Array.isArray(data.wiring));
  assert.ok(data.code && data.code.ino);
  assert.ok(Array.isArray(data.agentLog));
  assert.ok(data.agentLog.some((s) => s.step === 'code_gen' && s.status === 'pass'));
  assert.ok(data.agentLog.some((s) => s.step === 'compile' && s.status === 'pass'));
  assert.ok(data.agentLog.some((s) => s.step === 'case_fit' && s.status === 'pass'));
});

test('POST /api/build returns cached result on identical prompt', async () => {
  const prompt = 'Identical prompt for cache testing';
  
  // First call
  const res1 = await fetch(`${baseUrl}/api/build`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });
  assert.equal(res1.status, 200);
  const data1 = await res1.json();
  assert.ok(!data1.cached);

  // Second call
  const res2 = await fetch(`${baseUrl}/api/build`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: `  ${prompt}  ` }), // with whitespace variation
  });
  assert.equal(res2.status, 200);
  const data2 = await res2.json();
  assert.equal(data2.cached, true);
  assert.equal(data2.name, data1.name);
});

test('POST /api/build streams SSE events when stream: true', async () => {
  const res = await fetch(`${baseUrl}/api/build`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: 'Automatic plant watering system', stream: true }),
  });

  assert.equal(res.status, 200);
  assert.ok(res.headers.get('content-type')?.includes('text/event-stream'));

  const text = await res.text();
  assert.ok(text.includes('event: log') || text.includes('event: step'));
  assert.ok(text.includes('event: complete') || text.includes('event: result'));
  assert.ok(text.includes('event: done'));
});

test('Rate limiter blocks requests after limit reached with 429', async () => {
  // Rate limit is 3 per hour per IP
  for (let i = 0; i < 3; i++) {
    const res = await fetch(`${baseUrl}/api/build`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: `Unique prompt ${i} to bypass cache` }),
    });
    assert.equal(res.status, 200);
  }

  // 4th request should be blocked
  const res4 = await fetch(`${baseUrl}/api/build`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: 'Unique prompt 4 should be rate limited' }),
  });
  assert.equal(res4.status, 429);
  const data4 = await res4.json();
  assert.equal(data4.error, 'rate_limit_exceeded');
  assert.ok(data4.message.includes('Solder is busy'));
});
