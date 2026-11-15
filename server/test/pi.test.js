import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  checkPinConflicts,
  checkPowerBudget,
  checkCompile,
  checkSimulate,
  verifyBuild
} from '../services/verifier.js';
import { generateOfflineBuild } from '../services/offlineGenerator.js';
import { runAgentLoop } from '../services/agentLoop.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test('PI-SPEC: All 9 new Pi parts exist with valid schemas and electrical data', () => {
  const partsLibDir = path.resolve(__dirname, '../../parts-lib');
  const requiredParts = [
    'rpi_zero_2w',
    'rpi_5',
    'inmp441_mic',
    'max98357a_amp',
    'speaker_3w_4ohm',
    'tactile_button',
    'lipo_2000mah',
    'powerboost_1000c',
    'rpi_camera_v3'
  ];

  const indexData = JSON.parse(fs.readFileSync(path.join(partsLibDir, 'parts.json'), 'utf8'));
  const indexedIds = Array.isArray(indexData) ? indexData.map((p) => p.id) : (indexData.parts || []).map((p) => p.id);

  for (const partId of requiredParts) {
    assert.ok(indexedIds.includes(partId), `parts.json must index ${partId}`);
    const filePath = path.join(partsLibDir, `${partId}.json`);
    assert.ok(fs.existsSync(filePath), `File ${partId}.json must exist`);
    const part = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    assert.equal(part.id, partId);
    assert.ok(part.name, `${partId} must have name`);
    assert.ok(part.dimensions?.width > 0 || part.dimensions?.x > 0, `${partId} must have positive dimensions`);
    const price = part.priceInr || part.price;
    assert.ok(typeof price === 'number' && price > 0, `${partId} must have positive price in INR`);
    assert.ok(Array.isArray(part.pins), `${partId} must have pins array`);
  }
});

test('PI-SPEC: I2S shared clock wiring rule allows shared GPIO18 (BCLK) and GPIO19 (LRCLK)', () => {
  const piBuild = {
    board: 'rpi_zero_2w',
    parts: [
      { id: 'rpi_zero_2w', libId: 'rpi_zero_2w' },
      { id: 'inmp441_mic', libId: 'inmp441_mic' },
      { id: 'max98357a_amp', libId: 'max98357a_amp' }
    ],
    wiring: [
      // Shared BCLK on GPIO18 (pin 12)
      { from: { part: 'rpi_zero_2w', pin: 'GPIO18' }, to: { part: 'inmp441_mic', pin: 'SCK' } },
      { from: { part: 'rpi_zero_2w', pin: 'GPIO18' }, to: { part: 'max98357a_amp', pin: 'BCLK' } },
      // Shared LRCLK on GPIO19 (pin 35)
      { from: { part: 'rpi_zero_2w', pin: 'GPIO19' }, to: { part: 'inmp441_mic', pin: 'WS' } },
      { from: { part: 'rpi_zero_2w', pin: 'GPIO19' }, to: { part: 'max98357a_amp', pin: 'LRC' } },
      // Unique data lines
      { from: { part: 'rpi_zero_2w', pin: 'GPIO20' }, to: { part: 'inmp441_mic', pin: 'SD' } },
      { from: { part: 'rpi_zero_2w', pin: 'GPIO21' }, to: { part: 'max98357a_amp', pin: 'DIN' } }
    ]
  };

  const result = checkPinConflicts(piBuild);
  assert.equal(result.pass, true, 'Shared I2S clocks must not trigger duplicate pin assignment error');
});

test('PI-SPEC: checkSimulate returns skipped: true for Raspberry Pi builds', () => {
  const piBuild = {
    board: 'rpi_zero_2w',
    parts: [{ id: 'rpi_zero_2w', libId: 'rpi_zero_2w' }],
    code: { ino: 'print("hello")' }
  };

  const result = checkSimulate(piBuild);
  assert.equal(result.pass, true);
  assert.equal(result.skipped, true);
  assert.match(result.evidence, /Simulate: skipped/);
  assert.match(result.evidence, /AVR/);
});

test('PI-SPEC: checkPowerBudget fails on Pi 5 + PowerBoost 1000C, passes on Pi Zero 2 W', () => {
  const failingPi5Build = {
    board: 'rpi_5',
    parts: [
      { id: 'rpi_5', libId: 'rpi_5' },
      { id: 'powerboost_1000c', libId: 'powerboost_1000c' },
      { id: 'lipo_2000mah', libId: 'lipo_2000mah' },
      { id: 'max98357a_amp', libId: 'max98357a_amp' },
      { id: 'speaker_3w_4ohm', libId: 'speaker_3w_4ohm' }
    ]
  };

  const failResult = checkPowerBudget(failingPi5Build);
  assert.equal(failResult.pass, false, 'Pi 5 on 1000mA PowerBoost must exceed power budget');
  assert.match(failResult.evidence, /Power budget exceeded/);
  assert.match(failResult.evidence, /Raspberry Pi 5/);

  // Self-healed variant with Pi Zero 2 W
  const healedPiZeroBuild = {
    ...failingPi5Build,
    board: 'rpi_zero_2w',
    parts: failingPi5Build.parts.map((p) =>
      p.id === 'rpi_5' ? { id: 'rpi_zero_2w', libId: 'rpi_zero_2w' } : p
    )
  };

  const passResult = checkPowerBudget(healedPiZeroBuild);
  assert.equal(passResult.pass, true, 'Pi Zero 2 W on 1000mA PowerBoost must pass power budget');
});

test('PI-SPEC: checkCompile validates Python main.py syntax', async () => {
  const validPythonBuild = {
    board: 'rpi_zero_2w',
    code: { ino: 'import sys\nprint("Running on Raspberry Pi Zero 2 W")\n' }
  };
  const passResult = await checkCompile(validPythonBuild);
  assert.equal(passResult.pass, true);
  assert.match(passResult.evidence, /Python/);

  const brokenPythonBuild = {
    board: 'rpi_zero_2w',
    code: { ino: 'def broken_func(\n  print "missing colon and python 2 print"' }
  };
  const failResult = await checkCompile(brokenPythonBuild);
  assert.equal(failResult.pass, false);
  assert.match(failResult.evidence, /SyntaxError/);
});

test('PI-SPEC: Offline generator creates complete AI Pocket Assistant build', async () => {
  const build = generateOfflineBuild('An AI pocket assistant I can talk to, on a Raspberry Pi');
  assert.ok(build);
  assert.equal(build.board, 'rpi_zero_2w');

  const partIds = build.parts.map((p) => p.libId);
  assert.ok(partIds.includes('rpi_zero_2w'));
  assert.ok(partIds.includes('inmp441_mic'));
  assert.ok(partIds.includes('max98357a_amp'));
  assert.ok(partIds.includes('speaker_3w_4ohm'));
  assert.ok(partIds.includes('tactile_button'));
  assert.ok(partIds.includes('powerboost_1000c'));
  assert.ok(partIds.includes('lipo_2000mah'));

  // Firmware check
  assert.ok(build.code?.ino?.includes('whisper'));
  assert.ok(build.code?.onDevicePy?.includes('llama.cpp') || build.code?.onDevicePy?.includes('whisper'));
  assert.ok(build.code?.cloudPy?.includes('.env'));
  assert.ok(build.code?.setupSh?.includes('snd-soc-i2s') || build.code?.setupSh?.includes('pip') || build.code?.setupSh?.includes('config.txt'));

  // Run full verifier on generated build
  const verification = await verifyBuild(build);
  assert.equal(verification.passed, true);
  const simCheck = verification.checks.find((c) => c.id === 'simulate');
  assert.equal(simCheck?.skipped, true);
});

test('PI-SPEC: runAgentLoop performs real self-healing swap from Pi 5 to Pi Zero 2 W on power budget fail', async () => {
  const failingPi5Build = {
    id: 'ai_assistant_pi5',
    name: 'AI Pocket Assistant',
    board: 'rpi_5',
    parts: [
      { id: 'part-mcu', libId: 'rpi_5', name: 'Raspberry Pi 5' },
      { id: 'part-pwr', libId: 'powerboost_1000c', name: 'Adafruit PowerBoost 1000C' },
      { id: 'part-bat', libId: 'lipo_2000mah', name: 'Lithium Ion Polymer Battery 3.7V 2000mAh' },
      { id: 'part-amp', libId: 'max98357a_amp', name: 'I2S 3W D-Class Amplifier' },
      { id: 'part-spk', libId: 'speaker_3w_4ohm', name: 'Mini Speaker 4 Ohm 3W' }
    ],
    wiring: [
      { from: { part: 'rpi_5', pin: 'GPIO18' }, to: { part: 'max98357a_amp', pin: 'BCLK' } },
      { from: { part: 'rpi_5', pin: 'GPIO19' }, to: { part: 'max98357a_amp', pin: 'LRC' } },
      { from: { part: 'rpi_5', pin: 'GPIO21' }, to: { part: 'max98357a_amp', pin: 'DIN' } }
    ],
    code: { ino: 'print("AI Assistant starting...")\n' }
  };

  const emitted = [];
  const finalBuild = await runAgentLoop(failingPi5Build, (ev) => emitted.push(ev));

  assert.equal(finalBuild.board, 'rpi_zero_2w', 'Board should be healed to Pi Zero 2 W');
  const fixStart = emitted.find((e) => e.step === 'fixer_start' && e.checkId === 'power_budget');
  assert.ok(fixStart, 'Fixer should start for power_budget failure');

  const fixResolved = emitted.find((e) => (e.step === 'fixer_done' || e.step === 'fixer_resolved') && e.checkId === 'power_budget');
  assert.ok(fixResolved, 'Fixer should resolve power_budget');
  assert.match(fixResolved.changelog, /Swapped Raspberry Pi 5 to Pi Zero 2 W/);

  const doneEvent = emitted.find((e) => e.step === 'done');
  assert.ok(doneEvent, 'Loop should finish with done event');
  assert.equal(doneEvent.harness?.selfHealCount, 1, 'Self-heal count should be 1');
});

