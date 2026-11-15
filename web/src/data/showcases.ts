import type { SolderBuild } from '../types';

// Import raw JSON showcases
import sipRaw from '../../../showcase/sip.json';
import wispRaw from '../../../showcase/wisp.json';
import haspRaw from '../../../showcase/hasp.json';
import eaveRaw from '../../../showcase/eave.json';
import pocketAiRaw from '../../../showcase/pocket-ai.json';
import robotCarRaw from '../../../showcase/robot-car.json';
import macroPadRaw from '../../../showcase/macro-pad.json';

export const DESK_FAN_BUILD: SolderBuild = {
  id: 'desk-fan',
  name: 'Desk fan',
  tagline: 'Thermal Auto Desk Fan',
  summary:
    'Smart ambient desk fan that triggers a 5V DC blower relay and piezo alert when ambient temperature exceeds 28°C.',
  board: 'uno',
  parts: [
    {
      id: 'p1',
      name: 'Arduino Uno R3',
      libId: 'arduino_uno',
      qty: 1,
      priceInr: 450,
      why: 'ATmega328P MCU controller',
    },
    {
      id: 'p2',
      name: 'LM35 Temperature Sensor',
      libId: 'lm35_temp',
      qty: 1,
      priceInr: 65,
      why: 'Analog linear temperature reading (10mV/°C)',
    },
    {
      id: 'p3',
      name: '5V Single-Channel Relay',
      libId: 'relay_5v',
      qty: 1,
      priceInr: 80,
      why: 'Switches high-current DC cooling fan motor',
    },
    {
      id: 'p4',
      name: 'Piezo Buzzer Alarm',
      libId: 'piezo_buzzer',
      qty: 1,
      priceInr: 35,
      why: 'Audible thermal warning tone at > 28°C',
    },
    {
      id: 'p5',
      name: '5V DC Brushless Fan',
      libId: 'dc_fan_5v',
      qty: 1,
      priceInr: 120,
      why: 'Desk ventilation cooling airflow',
    },
  ],
  layout: [
    { libId: 'arduino_uno', x: 0, y: 0, z: 0 },
    { libId: 'lm35_temp', x: -35, y: 15, z: 5 },
    { libId: 'relay_5v', x: 25, y: -20, z: 5 },
    { libId: 'piezo_buzzer', x: 30, y: 20, z: 5 },
  ],
  case: {
    outerMm: [120, 85, 38],
    wallMm: 2.0,
    material: 'frosted_acrylic',
    color: '#f97316',
  },
  wiring: [
    { from: { part: 'arduino_uno', pin: '5V' }, to: { part: 'lm35_temp', pin: 'VCC' }, color: '#ef4444' },
    { from: { part: 'arduino_uno', pin: 'GND' }, to: { part: 'lm35_temp', pin: 'GND' }, color: '#1f2937' },
    { from: { part: 'arduino_uno', pin: 'A0' }, to: { part: 'lm35_temp', pin: 'OUT' }, color: '#f59e0b' },
    { from: { part: 'arduino_uno', pin: '5V' }, to: { part: 'relay_5v', pin: 'VCC' }, color: '#ef4444' },
    { from: { part: 'arduino_uno', pin: 'GND' }, to: { part: 'relay_5v', pin: 'GND' }, color: '#1f2937' },
    { from: { part: 'arduino_uno', pin: 'D7' }, to: { part: 'relay_5v', pin: 'IN' }, color: '#10b981' },
    { from: { part: 'arduino_uno', pin: 'D8' }, to: { part: 'piezo_buzzer', pin: 'POS' }, color: '#8b5cf6' },
    { from: { part: 'arduino_uno', pin: 'GND' }, to: { part: 'piezo_buzzer', pin: 'NEG' }, color: '#1f2937' },
  ],
  code: {
    filename: 'breezemate.ino',
    ino: `// Solder Auto-Synthesized Firmware: BreezeMate Desk Fan
// Hardware: ATmega328P (Arduino Uno)
// Self-Healed Pin Assignment: Relay on D7, Buzzer on D8 (freed from D7 collision)

#define TEMP_PIN A0
#define RELAY_PIN 7
#define BUZZER_PIN 8  // Patched by Flash-Lite self-healing fixer

const float TEMP_THRESHOLD_C = 28.0;

void setup() {
  Serial.begin(9600);
  pinMode(RELAY_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  
  // Active-low relay: default HIGH (OFF)
  digitalWrite(RELAY_PIN, HIGH);
  digitalWrite(BUZZER_PIN, LOW);
  
  Serial.println("BREEZEMATE_INITIALIZED_OK");
}

void loop() {
  int rawAdc = analogRead(TEMP_PIN);
  float millivolts = (rawAdc / 1024.0) * 5000.0;
  float tempC = millivolts / 10.0;
  
  Serial.print("TEMP_C:");
  Serial.println(tempC);
  
  if (tempC >= TEMP_THRESHOLD_C) {
    digitalWrite(RELAY_PIN, LOW); // Turn fan ON
    tone(BUZZER_PIN, 1000, 200);   // Alert beep
    Serial.println("STATUS:HOT_FAN_ON");
  } else {
    digitalWrite(RELAY_PIN, HIGH); // Turn fan OFF
    noTone(BUZZER_PIN);
    Serial.println("STATUS:NORMAL_FAN_OFF");
  }
  
  delay(1000);
}
`,
  },
  tests: [
    {
      name: 'Temp > 28C Fan On',
      set: { temperature: 32 },
      expectPin: { 7: 0 },
      expectRelay: true,
      expectSerial: 'STATUS:HOT_FAN_ON',
    },
    {
      name: 'Temp Normal Fan Off',
      set: { temperature: 24 },
      expectPin: { 7: 1 },
      expectRelay: false,
      expectSerial: 'STATUS:NORMAL_FAN_OFF',
    },
  ],
  product: {
    pageHeadline: 'BreezeMate — Thermal Auto Desk Fan',
    bullets: [
      'Automatic cooling kicks in when desk temp hits 28°C',
      'Whisper-quiet 5V brushless fan with isolated relay driver',
      'Audible piezo beep alert on thermal threshold',
      'Frosted translucent acrylic enclosure with passive ventilation louvers',
    ],
    priceInr: 750,
    boxSvg: '<svg viewBox="0 0 100 100"><rect width="100" height="100" fill="#f97316"/></svg>',
  },
  buildSteps: [
    'Insert LM35 temperature sensor into header socket',
    'Wire 5V relay module signal to D7 and buzzer to D8',
    'Snap Arduino Uno into frosted bottom enclosure base',
    'Close snap-fit lid and connect USB-B power cable',
  ],
};

export const SHOWCASE_BUILDS: Record<string, SolderBuild> = {
  'pocket-ai': pocketAiRaw as unknown as SolderBuild,
  sip: sipRaw as unknown as SolderBuild,
  wisp: wispRaw as unknown as SolderBuild,
  eave: eaveRaw as unknown as SolderBuild,
  'robot-car': robotCarRaw as unknown as SolderBuild,
  hasp: haspRaw as unknown as SolderBuild,
  'desk-fan': DESK_FAN_BUILD,
  'macro-pad': macroPadRaw as unknown as SolderBuild,
};

export const SHOWCASE_PILLS = [
  { id: 'desk-fan', name: 'Desk fan', desc: 'Auto Thermal Fan', board: 'Uno', tag: 'LM35 & Relay' },
  { id: 'sip', name: 'Plant waterer', desc: 'Auto Hydration', board: 'Uno', tag: 'Soil & Pump' },
  { id: 'wisp', name: 'Night light', desc: 'Dark-Activated Light', board: 'Uno', tag: 'PIR & LED' },
  { id: 'hasp', name: 'Doorbell', desc: 'Smart Chime', board: 'Uno', tag: 'Button & Buzzer' },
  { id: 'eave', name: 'Air monitor', desc: 'Gas & Climate', board: 'ESP32', tag: 'MQ-135 & DHT' },
] as const;

export const QUICK_CHIPS = [
  'solar powered',
  'smaller',
  'add WiFi',
  'battery operated',
  'waterproof case',
  'buzzer alert',
  'low power sleep',
];
