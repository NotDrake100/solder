import test from 'node:test';
import assert from 'node:assert/strict';
import { generateOfflineBuild } from '../services/offlineGenerator.js';
import { createServer } from '../server.js';

let server;
let baseUrl;

test.before(async () => {
  server = createServer();
  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

test.after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('offlineGenerator: motion-activated night light matches PIR sensor and LED lamp', () => {
  const build = generateOfflineBuild('motion-activated night light with PIR sensor and LED lamp');
  assert.ok(build);
  const libIds = build.parts.map((p) => p.libId);
  assert.ok(libIds.includes('pir_motion'), 'Should include pir_motion');
  assert.ok(libIds.includes('led_lamp'), 'Should include led_lamp');

  // Verify Arduino firmware logic
  assert.ok(build.code?.ino.includes('digitalRead'));
  assert.ok(build.code?.ino.includes('digitalWrite'));
  assert.ok(build.code?.ino.includes('LAMP:ON'));

  // Verify layout
  const layoutIds = build.layout.map((l) => l.libId);
  assert.ok(layoutIds.includes('pir_motion'));
  assert.ok(layoutIds.includes('led_lamp'));

  // Verify wiring
  const wiringParts = build.wiring.map((w) => w.to.part);
  assert.ok(wiringParts.includes('pir_motion'));
  assert.ok(wiringParts.includes('led_lamp'));
});

test('offlineGenerator: ultrasonic distance radar with SG90 servo and OLED display', () => {
  const build = generateOfflineBuild('smart ultrasonic distance radar with SG90 servo and OLED display');
  assert.ok(build);
  const libIds = build.parts.map((p) => p.libId);
  assert.ok(libIds.includes('ultrasonic_hcsr04'), 'Should include ultrasonic_hcsr04');
  assert.ok(libIds.includes('sg90_servo'), 'Should include sg90_servo');
  assert.ok(libIds.includes('oled_096'), 'Should include oled_096');

  // Verify code logic
  assert.ok(build.code?.ino.includes('pulseIn') || build.code?.ino.includes('distanceCm'));
  assert.ok(build.code?.ino.includes('SERVO:SWEEP_ACTIVE') || build.code?.ino.includes('analogWrite'));

  // Verify layout
  const layoutIds = build.layout.map((l) => l.libId);
  assert.ok(layoutIds.includes('ultrasonic_hcsr04'));
  assert.ok(layoutIds.includes('sg90_servo'));
  assert.ok(layoutIds.includes('oled_096'));
});

test('offlineGenerator: air quality and greenhouse temperature alarm with buzzer', () => {
  const build = generateOfflineBuild('air quality and greenhouse temperature alarm with buzzer');
  assert.ok(build);
  const libIds = build.parts.map((p) => p.libId);
  assert.ok(libIds.includes('mq135'), 'Should include mq135');
  assert.ok(libIds.includes('dht11'), 'Should include dht11');
  assert.ok(libIds.includes('piezo_buzzer'), 'Should include piezo_buzzer');

  // Verify wiring & code
  assert.ok(build.code?.ino.includes('AIR_QUALITY_RAW') || build.code?.ino.includes('gasPpm'));
  assert.ok(build.code?.ino.includes('DHT11'));
});

test('offlineGenerator: automatic plant waterer with soil probe and relay', () => {
  const build = generateOfflineBuild('automatic plant waterer with soil probe');
  assert.ok(build);
  const libIds = build.parts.map((p) => p.libId);
  assert.ok(libIds.includes('soil_moisture'), 'Should include soil_moisture');
  assert.ok(libIds.some((id) => id.includes('relay')), 'Should include relay module');

  // Verify code logic
  assert.ok(build.code?.ino.includes('PUMP_ON') || build.code?.ino.includes('PUMP:ON'));
});

test('POST /api/build generates novel keyword build end-to-end', async () => {
  const prompt = 'motion activated porch light with LDR darkness sensor and piezo siren ' + Math.random().toString(36).slice(2);
  const res = await fetch(`${baseUrl}/api/build`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(data.buildId);
  assert.ok(data.data);

  const parts = data.data.parts.map((p) => p.libId);
  assert.ok(parts.includes('pir_motion'), 'Should include pir_motion in API build response');
  assert.ok(parts.includes('ldr_sensor'), 'Should include ldr_sensor in API build response');
  assert.ok(parts.includes('piezo_buzzer'), 'Should include piezo_buzzer in API build response');
});
