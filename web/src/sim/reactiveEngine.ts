import { VirtualSensors, VirtualActuators, TestCase, TestResult } from './types';

export interface SketchAnalysis {
  relayPin: number;
  relayActiveHigh: boolean;
  soilThreshold: number; // e.g. 400 (ADC) or 40 (%)
  dhtPin: number;
  buzzerPin: number;
  servoPin: number;
  oledEnabled: boolean;
  baudRate: number;
}

export function analyzeSketch(inoCode: string): SketchAnalysis {
  const code = inoCode || '';

  // Extract relay pin: pinMode(8, OUTPUT) or int relayPin = 8;
  let relayPin = 8;
  const relayMatch = code.match(/relay(?:Pin)?\s*=\s*([0-9]+)/i) || code.match(/pinMode\s*\(\s*([0-9]+)\s*,\s*OUTPUT\s*\)/);
  if (relayMatch) {
    relayPin = parseInt(relayMatch[1], 10);
  }

  // Check if relay is active low or active high
  // Usually: if (val < 400) digitalWrite(relay, HIGH) or LOW
  let relayActiveHigh = true;
  if (/digitalWrite\s*\(\s*(?:relayPin|8|[0-9]+)\s*,\s*LOW\s*\)\s*;\s*\/\/\s*turn on/i.test(code)) {
    relayActiveHigh = false;
  }

  // Extract soil threshold
  let soilThreshold = 40; // 40% (or ~410 ADC)
  const threshMatch = code.match(/(?:analogRead|val|sensorValue|moisture)\s*(?:<|>|<=|>=)\s*([0-9]+)/);
  if (threshMatch) {
    const rawVal = parseInt(threshMatch[1], 10);
    // If rawVal > 100, it's 0-1023 ADC reading; convert to percentage
    soilThreshold = rawVal > 100 ? Math.round((rawVal / 1023) * 100) : rawVal;
  }

  // Extract buzzer pin
  let buzzerPin = 9;
  const buzzerMatch = code.match(/buzzer(?:Pin)?\s*=\s*([0-9]+)/i);
  if (buzzerMatch) {
    buzzerPin = parseInt(buzzerMatch[1], 10);
  }

  // Extract servo pin
  let servoPin = 9;
  const servoMatch = code.match(/servo(?:Pin|\.attach\s*\(\s*([0-9]+)\s*\))/i);
  if (servoMatch && servoMatch[1]) {
    servoPin = parseInt(servoMatch[1], 10);
  }

  // Extract DHT pin
  let dhtPin = 2;
  const dhtMatch = code.match(/DHTPIN\s*([0-9]+)/) || code.match(/dht\s*\(\s*([0-9]+)/);
  if (dhtMatch) {
    dhtPin = parseInt(dhtMatch[1], 10);
  }

  const oledEnabled = /Adafruit_SSD1306|display\.begin/i.test(code);

  return {
    relayPin,
    relayActiveHigh,
    soilThreshold,
    dhtPin,
    buzzerPin,
    servoPin,
    oledEnabled,
    baudRate: 9600
  };
}

export function evaluateHardwareState(
  sensors: VirtualSensors,
  inoCode: string,
  prevActuators?: Partial<VirtualActuators>
): { actuators: VirtualActuators; logMessage?: string } {
  const analysis = analyzeSketch(inoCode);

  // Relay logic: default dry soil (< threshold) triggers relay/pump
  let relayState = false;
  let logMessage: string | undefined;

  // Check code logic direction
  const isLessThan = /analogRead\s*\([^)]*\)\s*<\s*[0-9]+/i.test(inoCode) || /moisture\s*<\s*[0-9]+/i.test(inoCode);

  if (isLessThan) {
    // If moisture < threshold -> Pump ON
    relayState = sensors.soilMoisture < analysis.soilThreshold;
  } else {
    // If moisture > threshold
    relayState = sensors.soilMoisture > analysis.soilThreshold;
  }

  // Gas / Air quality alarm
  let buzzerTone = 0;
  if (sensors.gasLevel > 350) {
    buzzerTone = 2400; // 2.4kHz warning tone
  }

  // Distance sensor servo logic (e.g. Hasp smart lock or obstacle avoidance)
  let servoAngle = 0;
  if (/servo/i.test(inoCode)) {
    if (sensors.distanceCm < 30 || sensors.buttonPressed) {
      servoAngle = 90; // Unlocked / open
    } else {
      servoAngle = 0;
    }
  }

  // Built-in LED on pin 13 blinks or follows relay
  const led13 = relayState || buzzerTone > 0 || sensors.buttonPressed;

  // OLED lines
  const oledLines: string[] = [];
  if (analysis.oledEnabled || inoCode.includes('display')) {
    oledLines.push(`Soil: ${sensors.soilMoisture}%  ${relayState ? '[PUMP]' : '[IDLE]'}`);
    oledLines.push(`Temp: ${sensors.temperature}°C  Hum: ${sensors.humidity}%`);
    if (sensors.gasLevel > 50) {
      oledLines.push(`Air: ${sensors.gasLevel}ppm ${sensors.gasLevel > 350 ? '!ALERT!' : 'GOOD'}`);
    } else {
      oledLines.push(`Dist: ${sensors.distanceCm}cm`);
    }
  }

  const pinStates: Record<number, number> = {
    13: led13 ? 1 : 0,
    [analysis.relayPin]: relayState ? 1 : 0,
    [analysis.buzzerPin]: buzzerTone > 0 ? 1 : 0
  };

  const analogStates: Record<string, number> = {
    A0: Math.round((sensors.soilMoisture / 100) * 1023),
    A1: Math.round((sensors.gasLevel / 1000) * 1023),
    A2: Math.round(((sensors.temperature + 10) / 70) * 1023)
  };

  // Generate serial output string on state transition
  const prevRelay = prevActuators?.relay;
  if (prevRelay !== undefined && prevRelay !== relayState) {
    if (relayState) {
      logMessage = `[${new Date().toLocaleTimeString()}] Soil: ${sensors.soilMoisture}% (ADC: ${analogStates.A0}) -> Threshold ${analysis.soilThreshold}% -> Pump Relay [ACTIVE]`;
    } else {
      logMessage = `[${new Date().toLocaleTimeString()}] Soil: ${sensors.soilMoisture}% (ADC: ${analogStates.A0}) -> Moisture sufficient -> Pump Relay [STANDBY]`;
    }
  }

  const actuators: VirtualActuators = {
    relay: relayState,
    relayPin: analysis.relayPin,
    led13,
    buzzerTone,
    buzzerPin: analysis.buzzerPin,
    servoAngle,
    servoPin: analysis.servoPin,
    oledLines,
    pinStates,
    analogStates
  };

  return { actuators, logMessage };
}

export function runSimulatorTests(
  tests: TestCase[],
  inoCode: string,
  baseSensors: VirtualSensors
): TestResult[] {
  const results: TestResult[] = [];

  for (const test of tests) {
    const testSensors: VirtualSensors = {
      ...baseSensors,
      ...test.set
    };

    const { actuators } = evaluateHardwareState(testSensors, inoCode);
    let passed = true;
    const failureReasons: string[] = [];

    if (test.expectRelay !== undefined) {
      if (actuators.relay !== test.expectRelay) {
        passed = false;
        failureReasons.push(`Expected relay=${test.expectRelay}, got ${actuators.relay}`);
      }
    }

    if (test.expectLed !== undefined) {
      if (actuators.led13 !== test.expectLed) {
        passed = false;
        failureReasons.push(`Expected LED=${test.expectLed}, got ${actuators.led13}`);
      }
    }

    if (test.expectPin) {
      for (const [pinStr, expectedVal] of Object.entries(test.expectPin)) {
        const pin = parseInt(pinStr, 10);
        const actualVal = actuators.pinStates[pin] ?? 0;
        if (actualVal !== expectedVal) {
          passed = false;
          failureReasons.push(`Expected Pin ${pin}=${expectedVal}, got ${actualVal}`);
        }
      }
    }

    results.push({
      name: test.name,
      passed,
      actual: passed ? 'Matching expected state' : failureReasons.join(', '),
      expected: JSON.stringify(test.expectPin || { relay: test.expectRelay }),
      details: passed ? 'Assertion passed ✓' : `Failed: ${failureReasons.join(', ')}`
    });
  }

  return results;
}
