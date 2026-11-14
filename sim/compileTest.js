import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import compileMiddleware, { compileSketch, isArduinoCliAvailable, handleCompileRequest, SIP_PRECOMPILED_HEX } from './compileRoute.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let server;
let baseUrl;

test.before(async () => {
  server = http.createServer(async (req, res) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', async () => {
      let parsed = {};
      try {
        if (body.trim()) parsed = JSON.parse(body);
      } catch {
        // ignore
      }
      req.body = parsed;
      await compileMiddleware(req, res);
    });
  });

  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test('isArduinoCliAvailable() returns a boolean', () => {
  const available = isArduinoCliAvailable();
  assert.equal(typeof available, 'boolean');
});

test('compileSketch() compiles valid Sip sketch into valid Intel HEX', async () => {
  const sipCode = fs.readFileSync(path.join(__dirname, 'sipSketch.ino'), 'utf-8');
  const result = await compileSketch(sipCode, { fqbn: 'arduino:avr:uno' });

  assert.equal(result.success, true);
  assert.equal(typeof result.hex, 'string');
  assert.ok(result.hex.startsWith(':'));
  assert.ok(result.hex.includes(':00000001FF'));
  assert.equal(result.fqbn, 'arduino:avr:uno');
});

test('compileSketch() rejects empty sketch with error', async () => {
  await assert.rejects(
    async () => {
      await compileSketch('');
    },
    (err) => {
      assert.ok(err.message.includes('No sketch code provided'));
      return true;
    }
  );
});

test('compileSketch() rejects syntax error with diagnostic details', async () => {
  await assert.rejects(
    async () => {
      await compileSketch('void setup() { syntax_error_test; } void loop() {}');
    },
    (err) => {
      assert.ok(err.message.includes('syntax_error_test') || err.stderr?.includes('syntax_error_test'));
      return true;
    }
  );
});

test('POST /api/compile accepts { sketch: ... } and returns 200 with hex', async () => {
  const sketch = `
void setup() {
  Serial.begin(9600);
}
void loop() {
  delay(100);
}
`;
  const res = await fetch(`${baseUrl}/api/compile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sketch }),
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(typeof data.hex === 'string');
  assert.ok(data.hex.startsWith(':'));
  assert.equal(data.fqbn, 'arduino:avr:uno');
});

test('POST /api/compile accepts { ino: ... } parameter alias', async () => {
  const ino = `
void setup() {
  pinMode(7, OUTPUT);
}
void loop() {
  digitalWrite(7, HIGH);
}
`;
  const res = await fetch(`${baseUrl}/api/compile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ino }),
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(data.hex);
});

test('POST /api/compile rejects missing body with 400', async () => {
  const res = await fetch(`${baseUrl}/api/compile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });

  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.success, false);
  assert.equal(data.error, 'invalid_request');
});

test('POST /api/compile rejects syntax errors with 400 and error details', async () => {
  const res = await fetch(`${baseUrl}/api/compile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sketch: 'void setup() { unclosed brace;' }),
  });

  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.success, false);
  assert.equal(data.error, 'compilation_failed');
  assert.ok(data.details);
});

test('GET /health returns module status', async () => {
  const res = await fetch(`${baseUrl}/health`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.status, 'ok');
  assert.equal(data.module, 'sim/compileRoute');
});
