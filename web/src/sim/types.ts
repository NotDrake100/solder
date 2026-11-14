export interface VirtualSensors {
  soilMoisture: number; // 0 - 100 % (mapped to ADC A0, 0-1023)
  temperature: number; // -10 to 60 °C (DHT11)
  humidity: number; // 0 - 100 % (DHT11)
  gasLevel: number; // 0 - 1000 ppm (MQ-135, mapped to A1/A2)
  distanceCm: number; // 2 - 200 cm (HC-SR04)
  buttonPressed: boolean; // D2 or D7 digital input
  lightLevel: number; // 0 - 100 %
}

export interface VirtualActuators {
  relay: boolean; // Relay state (true = energised / ON)
  relayPin: number; // Pin driving the relay (typically 8, 4, or 7)
  led13: boolean; // Digital pin 13 built-in LED
  buzzerTone: number; // Hz (0 = silent)
  buzzerPin: number; // Pin driving buzzer (e.g. 9 or 11)
  servoAngle: number; // 0 - 180 degrees
  servoPin: number; // Pin driving servo (e.g. 9 or 10)
  oledLines: string[]; // Virtual OLED 128x64 text buffer
  pinStates: Record<number, number>; // Raw digital pin states (0 or 1)
  analogStates: Record<string, number>; // Raw analog readings (0-1023)
}

export interface TestCase {
  name: string;
  set: Partial<VirtualSensors> | Record<string, number | boolean>;
  expectPin?: Record<number, number>;
  expectRelay?: boolean;
  expectSerial?: string;
  expectLed?: boolean;
}

export interface TestResult {
  name: string;
  passed: boolean;
  actual?: string;
  expected?: string;
  details: string;
}

export interface PartItem {
  id?: string;
  libId: string;
  name?: string;
  qty?: number;
}

export interface ArduinoSimulatorProps {
  hex?: string; // Compiled Intel HEX binary
  inoCode?: string; // Arduino C++ source code
  board?: 'uno' | 'esp32';
  tests?: TestCase[];
  parts?: PartItem[];
  className?: string;
  onActuatorChange?: (actuators: VirtualActuators) => void;
  onSerialOutput?: (text: string) => void;
}
