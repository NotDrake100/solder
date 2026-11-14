import { ProductBuild, ShowcaseCardMeta } from '../types';

export const SHOWCASE_CARDS: ShowcaseCardMeta[] = [
  {
    id: 'sip',
    name: 'Sip',
    tagline: 'Automatic plant watering with real-time soil sensing',
    board: 'Arduino Uno',
    priceEstimate: '₹1,250',
    partsCount: 6,
    highlight: 'Soil moisture probe + mini pump + OLED telemetry',
  },
  {
    id: 'wisp',
    name: 'Wisp',
    tagline: 'Desktop indoor air quality & comfort monitor',
    board: 'ESP32',
    priceEstimate: '₹1,190',
    partsCount: 6,
    highlight: 'MQ-135 gas + DHT22 temp/humidity + hazard buzzer',
  },
  {
    id: 'hasp',
    name: 'Hasp',
    tagline: 'Biometric fingerprint smart latch & bolt lock',
    board: 'Arduino Uno',
    priceEstimate: '₹1,485',
    partsCount: 5,
    highlight: 'AS608 optical scanner + SG90 servo bolt + dual LED',
  },
  {
    id: 'eave',
    name: 'Eave',
    tagline: 'Solar-ready compact smart weather station',
    board: 'ESP32',
    priceEstimate: '₹1,260',
    partsCount: 5,
    highlight: 'BME280 barometric + rain sensor + solar battery',
  },
];

export const MOCK_BUILDS: Record<string, ProductBuild> = {
  sip: {
    id: 'sip',
    name: 'Sip',
    tagline: 'Automatic plant watering system with OLED status display',
    summary:
      'Sip continuously reads capacitive soil moisture and activates a quiet 5V submersible water pump via relay when soil hydration drops below 35%. Features live status feedback on an OLED display.',
    board: 'uno',
    parts: [
      {
        id: 'part-1',
        name: 'Arduino Uno R3',
        libId: 'uno',
        qty: 1,
        priceInr: 450,
        why: 'Central microcontroller running the control loop and sensor ADC sampling.',
      },
      {
        id: 'part-2',
        name: 'Capacitive Soil Moisture Sensor v1.2',
        libId: 'soil_moisture',
        qty: 1,
        priceInr: 120,
        why: 'Corrosion-resistant analog probe to detect soil moisture depth.',
      },
      {
        id: 'part-3',
        name: '5V Single-Channel Relay Module',
        libId: 'relay_5v',
        qty: 1,
        priceInr: 90,
        why: 'Isolates and switches 5V DC power to the water pump safely.',
      },
      {
        id: 'part-4',
        name: 'Mini Submersible 5V Water Pump',
        libId: 'water_pump_mini',
        qty: 1,
        priceInr: 180,
        why: 'Delivers 1.2–1.6 L/min flow through 7mm tubing into plant pot.',
      },
      {
        id: 'part-5',
        name: '0.96" I2C OLED Display (SSD1306)',
        libId: 'oled_096_i2c',
        qty: 1,
        priceInr: 260,
        why: 'Displays moisture %, pump state, and watering countdown.',
      },
      {
        id: 'part-6',
        name: '5V 2A DC Power Supply & Barrel Jack',
        libId: 'psu_5v_2a',
        qty: 1,
        priceInr: 150,
        why: 'Provides steady, surge-free power for Uno and pump motor inductive load.',
      },
    ],
    layout: [
      {
        id: 'part-1',
        libId: 'uno',
        name: 'Arduino Uno R3',
        x: -15,
        y: 0,
        z: 8,
        rotZ: 0,
        dims: [68.6, 53.4, 15],
        color: '#00979C',
      },
      {
        id: 'part-2',
        libId: 'soil_moisture',
        name: 'Soil Moisture Probe',
        x: 35,
        y: -18,
        z: 5,
        rotZ: 0,
        dims: [20, 60, 5],
        color: '#475569',
      },
      {
        id: 'part-3',
        libId: 'relay_5v',
        name: '5V Relay Module',
        x: 35,
        y: 22,
        z: 10,
        rotZ: 90,
        dims: [34, 26, 18],
        color: '#1d4ed8',
      },
      {
        id: 'part-5',
        libId: 'oled_096_i2c',
        name: '0.96" OLED Screen',
        x: -10,
        y: 0,
        z: 28,
        rotZ: 0,
        dims: [27, 27, 4],
        color: '#09090b',
      },
    ],
    case: {
      outerMm: [125, 85, 42],
      wallMm: 2.0,
      lidType: 'snap',
      clearanceMm: 2.0,
      scad: `// Solder Generated Case for Sip (Automatic Plant Waterer)
$fn = 60;
outer_x = 125;
outer_y = 85;
outer_z = 42;
wall = 2.0;
corner_r = 4.0;

module rounded_box(x, y, z, r) {
  hull() {
    for (dx = [-x/2 + r, x/2 - r])
      for (dy = [-y/2 + r, y/2 - r])
        translate([dx, dy, 0])
          cylinder(r=r, h=z);
  }
}

// Bottom enclosure shell
difference() {
  rounded_box(outer_x, outer_y, outer_z - 6, corner_r);
  translate([0, 0, wall])
    rounded_box(outer_x - 2*wall, outer_y - 2*wall, outer_z, corner_r - wall);
  // USB cutout
  translate([-outer_x/2, -10, 8])
    cube([wall * 3, 12, 10], center=true);
  // Tubing / probe grommet cutout
  translate([outer_x/2, 15, 12])
    rotate([0, 90, 0])
      cylinder(r=5, h=wall * 3, center=true);
}
`,
    },
    wiring: [
      { from: { part: 'Soil Moisture', pin: 'VCC' }, to: { part: 'Arduino Uno', pin: '5V' }, color: '#ef4444', signal: '5V Power' },
      { from: { part: 'Soil Moisture', pin: 'GND' }, to: { part: 'Arduino Uno', pin: 'GND' }, color: '#18181b', signal: 'Ground' },
      { from: { part: 'Soil Moisture', pin: 'AOUT' }, to: { part: 'Arduino Uno', pin: 'A0' }, color: '#f59e0b', signal: 'Moisture Analog' },
      { from: { part: 'Relay Module', pin: 'VCC' }, to: { part: 'Arduino Uno', pin: '5V' }, color: '#ef4444', signal: '5V Logic' },
      { from: { part: 'Relay Module', pin: 'GND' }, to: { part: 'Arduino Uno', pin: 'GND' }, color: '#18181b', signal: 'Ground' },
      { from: { part: 'Relay Module', pin: 'IN' }, to: { part: 'Arduino Uno', pin: 'D8' }, color: '#10b981', signal: 'Pump Relay Trigger' },
      { from: { part: 'OLED Display', pin: 'VCC' }, to: { part: 'Arduino Uno', pin: '3.3V' }, color: '#ef4444', signal: '3.3V Logic' },
      { from: { part: 'OLED Display', pin: 'GND' }, to: { part: 'Arduino Uno', pin: 'GND' }, color: '#18181b', signal: 'Ground' },
      { from: { part: 'OLED Display', pin: 'SCL' }, to: { part: 'Arduino Uno', pin: 'A5' }, color: '#3b82f6', signal: 'I2C Clock' },
      { from: { part: 'OLED Display', pin: 'SDA' }, to: { part: 'Arduino Uno', pin: 'A4' }, color: '#8b5cf6', signal: 'I2C Data' },
      { from: { part: 'Water Pump', pin: 'POS' }, to: { part: 'Relay Module', pin: 'NO' }, color: '#ef4444', signal: 'Switched 5V' },
      { from: { part: 'Water Pump', pin: 'NEG' }, to: { part: 'Power Jack', pin: 'GND' }, color: '#18181b', signal: 'Ground' },
    ],
    code: {
      filename: 'sip_waterer.ino',
      ino: `/*
 * Solder Build: Sip — Automatic Plant Waterer
 * Target: Arduino Uno R3 (ATmega328P)
 * Libraries: Wire, Adafruit_GFX, Adafruit_SSD1306
 */

#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

const int PIN_SOIL = A0;
const int PIN_RELAY = 8;

const int DRY_THRESHOLD = 35; // Water when hydration drops below 35%
const unsigned long PUMP_DURATION_MS = 2500;
const unsigned long CHECK_INTERVAL_MS = 4000;

void setup() {
  Serial.begin(9600);
  pinMode(PIN_RELAY, OUTPUT);
  digitalWrite(PIN_RELAY, LOW); // Relay OFF initially

  if(!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println(F("OLED init failed"));
  } else {
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(16, 24);
    display.println(F("SIP READY"));
    display.display();
    delay(800);
  }
  Serial.println(F("SIP_INITIALIZED"));
}

int readSoilMoisturePercent() {
  int raw = analogRead(PIN_SOIL);
  // Invert and map: 1023 (bone dry air) to 350 (submerged water)
  int pct = map(raw, 780, 380, 0, 100);
  return constrain(pct, 0, 100);
}

void loop() {
  int moisture = readSoilMoisturePercent();
  Serial.print(F("SOIL_MOISTURE:"));
  Serial.println(moisture);

  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0, 4);
  display.print(F("SIP PLANT WATERER"));
  
  display.setTextSize(2);
  display.setCursor(0, 22);
  display.print(moisture);
  display.print(F("%"));

  display.setTextSize(1);
  display.setCursor(0, 46);

  if (moisture < DRY_THRESHOLD) {
    display.print(F("STATUS: WATERING..."));
    display.display();
    Serial.println(F("PUMP_ON"));
    digitalWrite(PIN_RELAY, HIGH);
    delay(PUMP_DURATION_MS);
    digitalWrite(PIN_RELAY, LOW);
    Serial.println(F("PUMP_OFF"));
  } else {
    display.print(F("STATUS: OPTIMAL"));
    display.display();
  }

  delay(CHECK_INTERVAL_MS);
}
`,
    },
    tests: [
      {
        name: 'Dry soil triggers pump',
        set: { moisture: 25 },
        expectSerial: 'PUMP_ON',
      },
      {
        name: 'Moist soil keeps pump idle',
        set: { moisture: 60 },
        expectSerial: 'SOIL_MOISTURE:60',
      },
    ],
    product: {
      pageHeadline: 'Keep your beloved houseplants thriving effortlessly.',
      bullets: [
        'Corrosion-resistant capacitive moisture sensing with real-time feedback',
        'Automatic metering prevents over-watering and root rot',
        'Crisp 0.96" OLED display shows moisture metrics at a glance',
        'Snap-fit 3D printable enclosure tailored with precision millimeter tolerances',
      ],
      priceInr: 1250,
      boxSvg: `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" rx="16" fill="#09090b"/>
        <circle cx="200" cy="110" r="45" fill="#10b981" fill-opacity="0.15"/>
        <path d="M200 80 C185 105 185 130 200 140 C215 130 215 105 200 80 Z" fill="#10b981"/>
        <text x="200" y="190" text-anchor="middle" font-family="Inter, sans-serif" font-weight="700" font-size="28" fill="#ffffff">SIP</text>
        <text x="200" y="215" text-anchor="middle" font-family="Inter, sans-serif" font-weight="400" font-size="13" fill="#a1a1aa">Smart Plant Waterer • Maker Edition</text>
        <rect x="130" y="245" width="140" height="26" rx="6" fill="#27272a"/>
        <text x="200" y="262" text-anchor="middle" font-family="monospace" font-size="11" fill="#10b981">₹1,250 • COMPLETE KIT</text>
      </svg>`,
    },
    buildSteps: [
      'Print the snap-fit enclosure shell (125 × 85 × 42 mm) using PLA with 20% infill.',
      'Mount the Arduino Uno R3 onto the corner standoffs and secure with M3 screws.',
      'Install the 5V relay module and wire VCC/GND to Uno 5V rails, IN pin to Uno D8.',
      'Connect the I2C OLED display lines: SCL to A5, SDA to A4, VCC to 3.3V, GND to Ground.',
      'Route the soil probe cable through the side grommet and connect signal to Uno A0.',
      'Connect the submersible pump to the relay NO contacts and route the 7mm silicone tube into your planter.',
    ],
    agentLog: [
      { step: 'code_gen', status: 'pass', detail: 'Generated sketch.ino for Arduino Uno with SSD1306 OLED & moisture ADC' },
      { step: 'compile', status: 'pass', detail: 'arduino-cli compile --fqbn arduino:avr:uno successful (binary 7,412 bytes, 0 warnings)' },
      { step: 'sim_test', status: 'pass', detail: 'avr8js test "Dry soil triggers pump" asserted serial PUMP_ON within 120ms' },
      { step: 'case_fit', status: 'pass', detail: 'Case fit clearance verified: min clearance 2.0mm around Uno and Relay' },
    ],
  },

  wisp: {
    id: 'wisp',
    name: 'Wisp',
    tagline: 'Desktop indoor air quality & comfort monitor',
    summary:
      'Wisp monitors indoor CO2, VOCs, ambient temperature and humidity with an ESP32 and MQ-135 sensor. Displays air safety indexes and alarms if air becomes stale.',
    board: 'esp32',
    parts: [
      { id: 'p1', name: 'ESP32 DevKit V1', libId: 'esp32', qty: 1, priceInr: 380, why: 'Dual-core processor with onboard WiFi/BLE telemetry.' },
      { id: 'p2', name: 'DHT22 Temperature & Humidity Sensor', libId: 'dht22', qty: 1, priceInr: 240, why: 'High-accuracy digital hygrometer & temperature probe.' },
      { id: 'p3', name: 'MQ-135 Air Quality Sensor', libId: 'mq135', qty: 1, priceInr: 180, why: 'Sensitive to CO2, smoke, ammonia, benzene, and indoor pollutants.' },
      { id: 'p4', name: 'Active Piezo Buzzer 5V', libId: 'buzzer', qty: 1, priceInr: 40, why: 'Emits gentle warning beeps if air quality enters hazard zone.' },
      { id: 'p5', name: '0.96" I2C OLED Screen', libId: 'oled_096_i2c', qty: 1, priceInr: 260, why: 'Shows live AQI index, temperature, and humidity graphs.' },
      { id: 'p6', name: 'Micro-USB High Current Cable', libId: 'cable_usb', qty: 1, priceInr: 90, why: 'Powers ESP32 and heater coil on the gas sensor.' },
    ],
    layout: [
      { id: 'p1', libId: 'esp32', name: 'ESP32 DevKit V1', x: -10, y: 0, z: 8, dims: [51, 28, 12], color: '#10b981' },
      { id: 'p2', libId: 'dht22', name: 'DHT22 Sensor', x: 30, y: -15, z: 10, dims: [25, 15, 8], color: '#f8fafc' },
      { id: 'p3', libId: 'mq135', name: 'MQ-135 Sensor', x: 30, y: 15, z: 12, dims: [35, 20, 16], color: '#f59e0b', shape: 'cylinder' },
      { id: 'p5', libId: 'oled_096_i2c', name: '0.96" OLED', x: -10, y: 0, z: 25, dims: [27, 27, 4], color: '#09090b' },
    ],
    case: {
      outerMm: [110, 75, 38],
      wallMm: 2.0,
      lidType: 'snap',
      clearanceMm: 2.2,
      scad: '// Case for Wisp Air Quality Monitor\nouter_x = 110; outer_y = 75; outer_z = 38;',
    },
    wiring: [
      { from: { part: 'ESP32', pin: '3V3' }, to: { part: 'DHT22', pin: 'VCC' }, color: '#ef4444', signal: '3.3V Power' },
      { from: { part: 'ESP32', pin: 'GND' }, to: { part: 'DHT22', pin: 'GND' }, color: '#18181b', signal: 'Ground' },
      { from: { part: 'ESP32', pin: 'D4' }, to: { part: 'DHT22', pin: 'DATA' }, color: '#3b82f6', signal: 'DHT Data' },
      { from: { part: 'ESP32', pin: 'VIN' }, to: { part: 'MQ-135', pin: 'VCC' }, color: '#ef4444', signal: '5V Heater' },
      { from: { part: 'ESP32', pin: 'GND' }, to: { part: 'MQ-135', pin: 'GND' }, color: '#18181b', signal: 'Ground' },
      { from: { part: 'ESP32', pin: 'D34' }, to: { part: 'MQ-135', pin: 'AOUT' }, color: '#f59e0b', signal: 'Air Quality ADC' },
      { from: { part: 'ESP32', pin: 'D22' }, to: { part: 'OLED', pin: 'SCL' }, color: '#06b6d4', signal: 'I2C SCL' },
      { from: { part: 'ESP32', pin: 'D21' }, to: { part: 'OLED', pin: 'SDA' }, color: '#8b5cf6', signal: 'I2C SDA' },
    ],
    code: {
      filename: 'wisp_air.ino',
      ino: `// Wisp Air Quality Monitor
#include <Wire.h>
#include <Adafruit_SSD1306.h>
#include "DHT.h"

#define DHTPIN 4
#define DHTTYPE DHT22
#define MQPIN 34
#define BUZZERPIN 19

DHT dht(DHTPIN, DHTTYPE);
Adafruit_SSD1306 display(128, 64, &Wire, -1);

void setup() {
  Serial.begin(115200);
  dht.begin();
  pinMode(BUZZERPIN, OUTPUT);
  display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  display.clearDisplay();
  Serial.println("WISP_READY");
}

void loop() {
  float temp = dht.readTemperature();
  float hum = dht.readHumidity();
  int aqi = analogRead(MQPIN);
  Serial.printf("TEMP:%.1f,HUM:%.1f,AQI:%d\\n", temp, hum, aqi);
  delay(2000);
}`,
    },
    tests: [{ name: 'Hazard AQI triggers alert', set: { aqi: 750 }, expectSerial: 'ALERT_HIGH_AQI' }],
    product: {
      pageHeadline: 'Breathe cleaner. Track desk air quality in real time.',
      bullets: ['Live CO2 and VOC gas tracking', 'Lab-accurate DHT22 temperature & humidity', 'Discreet warning tone when ventilation is needed'],
      priceInr: 1190,
    },
    buildSteps: ['3D print ventilated top shell', 'Seat MQ-135 sensor under grill vents', 'Wire I2C display and calibrate sensor baseline'],
    agentLog: [
      { step: 'code_gen', status: 'pass', detail: 'ESP32 firmware generated with DHT22 & MQ-135 calibration curves' },
      { step: 'compile', status: 'pass', detail: 'ESP32 target compiled cleanly' },
      { step: 'sim_test', status: 'pass', detail: 'Gas threshold trigger validated' },
      { step: 'case_fit', status: 'pass', detail: 'Ventilation louvers clearance approved' },
    ],
  },

  hasp: {
    id: 'hasp',
    name: 'Hasp',
    tagline: 'Biometric fingerprint smart latch & bolt lock',
    summary:
      'Hasp secures desk drawers, lockers, and doors using an AS608 optical fingerprint scanner and a high-torque SG90 micro-servo latch bolt.',
    board: 'uno',
    parts: [
      { id: 'p1', name: 'Arduino Uno R3', libId: 'uno', qty: 1, priceInr: 450, why: 'Reliable AVR microcontroller for secure servo PWM and UART biometrics.' },
      { id: 'p2', name: 'AS608 Optical Fingerprint Sensor', libId: 'as608', qty: 1, priceInr: 850, why: 'Stores up to 120 fingerprints with fast sub-second matching.' },
      { id: 'p3', name: 'SG90 Micro Servo 9g', libId: 'sg90', qty: 1, priceInr: 130, why: 'Drives the mechanical slide bolt 0° to 90° for physical latching.' },
      { id: 'p4', name: 'Piezo Buzzer & Dual LEDs', libId: 'led_buzzer', qty: 1, priceInr: 55, why: 'Chirp confirmation and green/red access feedback.' },
    ],
    layout: [
      { id: 'p1', libId: 'uno', name: 'Arduino Uno', x: -15, y: 0, z: 8, dims: [68.6, 53.4, 15], color: '#00979C' },
      { id: 'p2', libId: 'as608', name: 'AS608 Fingerprint', x: 30, y: -15, z: 12, dims: [20, 20, 18], color: '#38bdf8', shape: 'cylinder' },
      { id: 'p3', libId: 'sg90', name: 'SG90 Servo', x: 30, y: 18, z: 12, dims: [23, 12, 29], color: '#0284c7' },
    ],
    case: {
      outerMm: [120, 80, 45],
      wallMm: 2.2,
      lidType: 'screw',
      clearanceMm: 2.0,
      scad: '// Case for Hasp Biometric Lock\nouter_x = 120; outer_y = 80; outer_z = 45;',
    },
    wiring: [
      { from: { part: 'AS608', pin: 'VCC' }, to: { part: 'Uno', pin: '5V' }, color: '#ef4444', signal: '5V' },
      { from: { part: 'AS608', pin: 'GND' }, to: { part: 'Uno', pin: 'GND' }, color: '#18181b', signal: 'Ground' },
      { from: { part: 'AS608', pin: 'TX' }, to: { part: 'Uno', pin: 'D2' }, color: '#10b981', signal: 'SoftwareSerial RX' },
      { from: { part: 'AS608', pin: 'RX' }, to: { part: 'Uno', pin: 'D3' }, color: '#f59e0b', signal: 'SoftwareSerial TX' },
      { from: { part: 'SG90 Servo', pin: 'SIG' }, to: { part: 'Uno', pin: 'D9' }, color: '#f97316', signal: 'PWM Angle' },
    ],
    code: {
      filename: 'hasp_lock.ino',
      ino: `// Hasp Biometric Fingerprint Lock
#include <Servo.h>
#include <SoftwareSerial.h>

SoftwareSerial mySerial(2, 3);
Servo lockServo;

const int LOCKED_ANGLE = 0;
const int UNLOCKED_ANGLE = 90;

void setup() {
  Serial.begin(9600);
  mySerial.begin(57600);
  lockServo.attach(9);
  lockServo.write(LOCKED_ANGLE);
  Serial.println("HASP_LOCKED");
}

void loop() {
  // Biometric polling loop
  delay(100);
}`,
    },
    tests: [{ name: 'Authorized print unlocks servo', set: { fingerprintId: 1 }, expectSerial: 'UNLOCKED' }],
    product: {
      pageHeadline: 'Keyless security for drawers, lockers, and toolboxes.',
      bullets: ['Sub-second optical finger recognition', 'Smooth 90° mechanical latch bolt', 'Stores up to 120 fingerprints in non-volatile flash'],
      priceInr: 1485,
    },
    buildSteps: ['Fasten the SG90 servo into the slide rail mortise', 'Align the 3D printed deadbolt arm', 'Wire AS608 optical sensor into lid aperture'],
    agentLog: [
      { step: 'code_gen', status: 'pass', detail: 'Arduino code with Servo & SoftwareSerial generated' },
      { step: 'compile', status: 'pass', detail: 'arduino-cli compile --fqbn arduino:avr:uno successful' },
      { step: 'sim_test', status: 'pass', detail: 'Lock/unlock angles simulated' },
      { step: 'case_fit', status: 'pass', detail: 'Servo torque arm clearance checked' },
    ],
  },

  eave: {
    id: 'eave',
    name: 'Eave',
    tagline: 'Solar-ready compact smart weather station',
    summary:
      'Eave sits under the roof eaves or windowsill, gathering barometric pressure, rain detection, and ambient metrics powered by a 18650 cell.',
    board: 'esp32',
    parts: [
      { id: 'p1', name: 'ESP32 DevKit V1', libId: 'esp32', qty: 1, priceInr: 380, why: 'Deep-sleep low power micro with WiFi MQTT weather broadcasting.' },
      { id: 'p2', name: 'BME280 Sensor Module', libId: 'bme280', qty: 1, priceInr: 350, why: 'Precision barometric altitude, pressure, and temperature.' },
      { id: 'p3', name: 'Raindrop Sensor Plate', libId: 'rain_sensor', qty: 1, priceInr: 110, why: 'Detects precipitation droplets immediately via nickel grid.' },
      { id: 'p4', name: '0.96" OLED Display', libId: 'oled_096_i2c', qty: 1, priceInr: 260, why: 'Weather forecast icons and pressure trends.' },
      { id: 'p5', name: '18650 Battery & TP4056 Charger', libId: 'battery_18650', qty: 1, priceInr: 160, why: 'Solar rechargeable power system.' },
    ],
    layout: [
      { id: 'p1', libId: 'esp32', name: 'ESP32 DevKit V1', x: -12, y: 0, z: 8, dims: [51, 28, 12], color: '#10b981' },
      { id: 'p2', libId: 'bme280', name: 'BME280 Sensor', x: 28, y: -15, z: 6, dims: [15, 12, 4], color: '#3b82f6' },
      { id: 'p3', libId: 'rain_sensor', name: 'Rain Sensor Plate', x: 28, y: 15, z: 10, dims: [50, 40, 3], color: '#64748b' },
      { id: 'p4', libId: 'oled_096_i2c', name: '0.96" OLED', x: -12, y: 0, z: 26, dims: [27, 27, 4], color: '#09090b' },
    ],
    case: {
      outerMm: [115, 80, 40],
      wallMm: 2.0,
      lidType: 'snap',
      clearanceMm: 2.0,
      scad: '// Case for Eave Weather Station\nouter_x = 115; outer_y = 80; outer_z = 40;',
    },
    wiring: [
      { from: { part: 'ESP32', pin: '3V3' }, to: { part: 'BME280', pin: 'VCC' }, color: '#ef4444', signal: '3.3V' },
      { from: { part: 'ESP32', pin: 'GND' }, to: { part: 'BME280', pin: 'GND' }, color: '#18181b', signal: 'Ground' },
      { from: { part: 'ESP32', pin: 'D22' }, to: { part: 'BME280', pin: 'SCL' }, color: '#06b6d4', signal: 'I2C SCL' },
      { from: { part: 'ESP32', pin: 'D21' }, to: { part: 'BME280', pin: 'SDA' }, color: '#8b5cf6', signal: 'I2C SDA' },
    ],
    code: {
      filename: 'eave_weather.ino',
      ino: `// Eave Compact Weather Station
#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BME280.h>

Adafruit_BME280 bme;

void setup() {
  Serial.begin(115200);
  if (!bme.begin(0x76)) {
    Serial.println("BME280_FAIL");
  } else {
    Serial.println("EAVE_ONLINE");
  }
}

void loop() {
  float pressure = bme.readPressure() / 100.0F;
  Serial.printf("PRESSURE_HPA:%.1f\\n", pressure);
  delay(5000);
}`,
    },
    tests: [{ name: 'Pressure reading online', set: { pressure: 1013 }, expectSerial: 'PRESSURE_HPA:1013.0' }],
    product: {
      pageHeadline: 'Hyper-local weather forecasting from your windowsill.',
      bullets: ['Micro-barometric storm detection', 'Fast raindrop trigger', 'Low power deep-sleep with solar top-up'],
      priceInr: 1260,
    },
    buildSteps: ['Install sloped rainwater runoff plate on case lid', 'Connect BME280 to shielded air intake cavity', 'Seal enclosure seams with silicone gasket'],
    agentLog: [
      { step: 'code_gen', status: 'pass', detail: 'ESP32 weather station sketch created' },
      { step: 'compile', status: 'pass', detail: 'Clean compile with Adafruit_BME280' },
      { step: 'sim_test', status: 'pass', detail: 'Rain sensor ADC simulation verified' },
      { step: 'case_fit', status: 'pass', detail: 'Waterproof barrier baffle verified' },
    ],
  },
};
