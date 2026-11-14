import assert from 'node:assert';
import { parseIntelHex } from './intelHex.ts';
import { AVRRunner } from './avrRunner.ts';

console.log('=== Running Simulator & AVR Runner Unit Tests ===');

// 1. Test Intel HEX Parser
const sampleHex = `
:100000000C9434000C9451000C9451000C94510023
:100010000C9451000C9451000C9451000C945100F8
:00000001FF
`;

const parsed = parseIntelHex(sampleHex);
assert.strictEqual(parsed.bytesTotal, 32, 'Should parse 32 bytes from sample hex');
assert.strictEqual(parsed.data[0], 0x0c, 'First byte should match 0x0c');
console.log('✓ Intel HEX parser test passed (32 bytes parsed)');

// 2. Test AVRRunner
const runner = new AVRRunner(sampleHex);
let lastSerial = '';
runner.onSerial((msg) => {
  lastSerial += msg;
});

// Test dry soil (<30%)
runner.setSoilMoisture(20);
runner.step();

assert.strictEqual(runner.state.pumpActive, true, 'Pump should be active when soil < 30%');
assert.strictEqual(runner.state.pins.d7, false, 'Relay pin D7 should be LOW (active low)');
assert.ok(lastSerial.includes('PUMP:ON'), 'Serial log should include PUMP:ON');
console.log('✓ Dry soil test (<30%) passed: Pump ON, D7 LOW, serial PUMP:ON emitted');

// Test wet soil (>=30%)
runner.setSoilMoisture(65);
runner.step();

assert.strictEqual(runner.state.pumpActive, false, 'Pump should be idle when soil >= 30%');
assert.strictEqual(runner.state.pins.d7, true, 'Relay pin D7 should be HIGH (pump off)');
assert.ok(lastSerial.includes('PUMP:OFF'), 'Serial log should include PUMP:OFF');
console.log('✓ Hydrated soil test (>=30%) passed: Pump OFF, D7 HIGH, serial PUMP:OFF emitted');

// Test Boundary 30%
runner.setSoilMoisture(29);
runner.step();
assert.strictEqual(runner.state.pumpActive, true, '29% should activate pump');

runner.setSoilMoisture(30);
runner.step();
assert.strictEqual(runner.state.pumpActive, false, '30% should deactivate pump');
console.log('✓ Boundary test (29% vs 30%) passed');

console.log('\n=== ALL SIMULATOR TESTS PASSED (100%) ===');
