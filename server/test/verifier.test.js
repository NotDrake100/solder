import test from 'node:test';
import assert from 'node:assert/strict';
import {
  checkPinConflicts,
  checkPowerBudget,
  checkVoltageCompat,
  checkCompile,
  checkSimulate,
  checkFitCheck,
  verifyBuild,
  findArduinoCli,
} from '../services/verifier.js';

const PASSING_BUILD = {
  id: 'sip',
  name: 'Sip',
  board: 'uno',
  product: { priceInr: 890 },
  parts: [
    { id: 'arduino_uno', libId: 'arduino_uno', name: 'Arduino Uno R3', qty: 1, priceInr: 450 },
    { id: 'soil_moisture', libId: 'soil_moisture', name: 'Soil Moisture Sensor', qty: 1, priceInr: 90 },
    { id: 'relay_5v', libId: 'relay_5v', name: '5V Relay Module', qty: 1, priceInr: 80 },
    { id: 'oled_096', libId: 'oled_096', name: '0.96 inch I2C OLED', qty: 1, priceInr: 220 },
  ],
  wiring: [
    { from: { part: 'arduino_uno', pin: '5V' }, to: { part: 'soil_moisture', pin: 'VCC' } },
    { from: { part: 'arduino_uno', pin: 'GND' }, to: { part: 'soil_moisture', pin: 'GND' } },
    { from: { part: 'arduino_uno', pin: 'A0' }, to: { part: 'soil_moisture', pin: 'AOUT' } },
    { from: { part: 'arduino_uno', pin: 'D7' }, to: { part: 'relay_5v', pin: 'IN' } },
    { from: { part: 'arduino_uno', pin: 'A4' }, to: { part: 'oled_096', pin: 'SDA' } },
    { from: { part: 'arduino_uno', pin: 'A5' }, to: { part: 'oled_096', pin: 'SCL' } },
  ],
  code: {
    filename: 'sip.ino',
    ino: `
void setup() {
  Serial.begin(9600);
  pinMode(7, OUTPUT);
  digitalWrite(7, HIGH); // relay off
}
void loop() {
  int val = analogRead(A0);
  if (val > 600) {
    digitalWrite(7, LOW); // turn on pump
  } else {
    digitalWrite(7, HIGH);
  }
  delay(500);
}
    `.trim(),
  },
  tests: [
    { name: 'Relay trigger on dry soil', sensorInput: { soilMoisture: 20 }, expectedOutputPin: 'D7', expectedState: 'LOW' }
  ],
  case: {
    outerMm: [120, 80, 40],
    wallMm: 2.2,
  },
  layout: [
    { libId: 'arduino_uno', x: 0, y: 0, z: 5 },
    { libId: 'relay_5v', x: 25, y: 15, z: 5 },
    { libId: 'oled_096', x: -25, y: 15, z: 15 },
  ],
};

test('Verifier: checkPinConflicts detects unique wiring vs duplicate collisions', () => {
  // 1. Passing fixture
  const passResult = checkPinConflicts(PASSING_BUILD);
  assert.equal(passResult.pass, true, 'Unique pin mapping must pass');
  assert.equal(passResult.id, 'pin_conflicts');

  // 2. Failing fixture: Duplicate pin collision on D7
  const conflictBuild = {
    ...PASSING_BUILD,
    wiring: [
      ...PASSING_BUILD.wiring,
      { from: { part: 'arduino_uno', pin: 'D7' }, to: { part: 'piezo_buzzer', pin: 'SIG' } }
    ]
  };
  const failResult = checkPinConflicts(conflictBuild);
  assert.equal(failResult.pass, false, 'Duplicate pin D7 assignment must fail');
  assert.match(failResult.evidence, /Duplicate pin assignment/);
});

test('Verifier: checkPowerBudget verifies current draw within limits', () => {
  // 1. Passing fixture
  const passResult = checkPowerBudget(PASSING_BUILD);
  assert.equal(passResult.pass, true, 'Standard BOM draw must be within 500mA limit');
  assert.equal(passResult.id, 'power_budget');

  // 2. Failing fixture: Multiple heavy inductive servos exceeding budget
  const heavyBuild = {
    ...PASSING_BUILD,
    parts: [
      { id: 'arduino_uno', libId: 'arduino_uno', qty: 1 },
      { id: 'sg90_servo', libId: 'sg90_servo', qty: 4 }, // 4 * 250mA = 1000mA
      { id: 'mq135', libId: 'mq135', qty: 2 } // 2 * 160mA = 320mA
    ]
  };
  const failResult = checkPowerBudget(heavyBuild);
  assert.equal(failResult.pass, false, 'Heavy draw exceeding 500mA must fail');
  assert.match(failResult.evidence, /exceeds 500mA USB limit/);
});

test('Verifier: checkVoltageCompat validates logic levels between MCU and ICs', () => {
  // 1. Passing fixture (Uno with 5V components)
  const passResult = checkVoltageCompat(PASSING_BUILD);
  assert.equal(passResult.pass, true, 'Compatible logic levels must pass');
  assert.equal(passResult.id, 'voltage_compat');

  // 2. Failing fixture (3.3V-only sensor connected to 5V Uno directly)
  const mismatchBuild = {
    ...PASSING_BUILD,
    parts: [
      ...PASSING_BUILD.parts,
      { id: 'bme280', libId: 'bme280', name: 'BME280 3.3V Sensor' }
    ]
  };
  // Note: PART_VOLTAGES maps pir_motion to 3.3V logic
  const pirMismatchBuild = {
    ...PASSING_BUILD,
    parts: [
      { id: 'arduino_uno', libId: 'arduino_uno', qty: 1 },
      { id: 'pir_motion', libId: 'pir_motion', name: 'PIR Sensor', qty: 1 }
    ]
  };
  const failResult = checkVoltageCompat(pirMismatchBuild);
  assert.equal(failResult.pass, false, '3.3V logic fed with 5V signals must fail');
  assert.match(failResult.evidence, /requires 3.3V logic/);
});

test('Verifier: checkCompile validates Arduino C++ syntax and errors', async () => {
  // 1. Passing fixture
  const passResult = await checkCompile(PASSING_BUILD);
  assert.equal(passResult.pass, true, 'Valid sketch must compile');
  assert.equal(passResult.id, 'compile');

  // 2. Failing fixture: missing semicolon
  const syntaxErrorBuild = {
    ...PASSING_BUILD,
    code: {
      filename: 'broken.ino',
      ino: `
void setup() {
  pinMode(7, OUTPUT)
}
void loop() {
}
      `.trim()
    }
  };
  const failResult = await checkCompile(syntaxErrorBuild);
  assert.equal(failResult.pass, false, 'Missing semicolon must fail compilation');
  assert.match(failResult.evidence, /expected ';'/);
});

test('Verifier: checkSimulate validates sensor assertion transitions or honest skip', async () => {
  // 1. Passing fixture (with precompiled hex or real compiled hex)
  const passResult = await checkSimulate(PASSING_BUILD);
  assert.equal(passResult.pass, true, 'Valid test assertion or skipped without hex');
  assert.equal(passResult.id, 'simulate');

  // 2. Failing fixture: Inverted relay logic bug
  const bugBuild = {
    ...PASSING_BUILD,
    _compiledHex: ':100000000C9434000C9451000C9451000C945100CA',
    code: {
      filename: 'invert.ino',
      ino: `
// invert_relay_bug
void setup() {
  digitalWrite(7, HIGH);
}
void loop() {}
      `.trim()
    }
  };
  const failResult = await checkSimulate(bugBuild);
  assert.equal(failResult.pass, false, 'Inverted logic bug must fail simulation assertion');
  assert.match(failResult.evidence, /Assertion failure/);
});

test('Verifier: checkSimulate for Pi builds reports honest skipped', async () => {
  const piBuild = {
    id: 'pocket-ai',
    name: 'AI pocket assistant',
    board: 'rpi_zero_2w',
    code: { filename: 'main.py', py: 'print("hello world")' }
  };
  const result = await checkSimulate(piBuild);
  assert.equal(result.pass, true);
  assert.equal(result.skipped, true);
  assert.match(result.evidence, /Simulate: skipped/);
});

test('Verifier: checkFitCheck validates wall thickness and 3D bounding clearances', () => {
  // 1. Passing fixture
  const passResult = checkFitCheck(PASSING_BUILD);
  assert.equal(passResult.pass, true, 'Proper clearance must pass');
  assert.equal(passResult.id, 'fit_check');

  // 2. Failing fixture: Wall thickness below 2.0mm
  const thinWallBuild = {
    ...PASSING_BUILD,
    case: { outerMm: [120, 80, 40], wallMm: 1.2 }
  };
  const failResult = checkFitCheck(thinWallBuild);
  assert.equal(failResult.pass, false, 'Thin wall below 2.0mm must fail');
  assert.match(failResult.evidence, /Wall thickness 1.2mm is below structural minimum/);
});

test('Verifier: verifyBuild runs all 6 checks end-to-end', async () => {
  const result = await verifyBuild(PASSING_BUILD);
  assert.equal(result.passed, true);
  assert.equal(result.totalChecks, 6);
  assert.equal(result.passedChecks, 6);
  assert.equal(result.firstFailingCheck, null);
  assert.match(result.summary, /6\/6 checks passed/);
});

test('Verifier: real arduino-cli compilation test when available (QA-R6 #5)', async (t) => {
  const cli = findArduinoCli();
  if (!cli) {
    t.skip('arduino-cli not available in this test environment');
    return;
  }
  const brokenBuild = {
    board: 'uno',
    code: {
      ino: 'void setup() { int x = 5 }\nvoid loop() {}',
    },
  };
  const result = await checkCompile(brokenBuild);
  assert.equal(result.pass, false);
  assert.match(result.evidence, /expected.*';'/);
  assert.equal(result.label, 'Firmware Compilation (arduino:avr:uno)');
});
