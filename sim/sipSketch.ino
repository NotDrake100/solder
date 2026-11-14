/*
 * Solder: Sip Firmware — Autonomous Plant Waterer
 * Target: Arduino Uno (ATmega328P)
 * Pins:
 *   A0: Capacitive Soil Moisture Analog Sensor (0-1023)
 *   D7: 5V Relay Module (Active LOW: LOW = Pump ON, HIGH = Pump OFF)
 */

const int PIN_SOIL = A0;
const int PIN_RELAY = 7;

// Calibration constants
// Most capacitive and analog probes output higher ADC readings when dry and lower when wet.
const int DRY_ADC = 750;   // High ADC = dry soil (0% moisture)
const int WET_ADC = 300;   // Low ADC = saturated soil (100% moisture)
const int MOISTURE_THRESHOLD_PCT = 30; // Water pump activates below 30%

void setup() {
  Serial.begin(9600);
  pinMode(PIN_RELAY, OUTPUT);
  // Default to relay OFF (active LOW logic: HIGH = de-energized)
  digitalWrite(PIN_RELAY, HIGH);
  Serial.println("SYSTEM_READY");
}

void loop() {
  int rawValue = analogRead(PIN_SOIL);

  // Map raw ADC to moisture percentage: 0% (dry) to 100% (wet)
  int moisturePct = map(constrain(rawValue, WET_ADC, DRY_ADC), DRY_ADC, WET_ADC, 0, 100);

  Serial.print("SOIL:");
  Serial.print(moisturePct);
  Serial.println("%");

  if (moisturePct < MOISTURE_THRESHOLD_PCT) {
    // Soil is dry (< 30%): Energize relay to activate water pump
    digitalWrite(PIN_RELAY, LOW); // Active LOW: Relay ON -> Pump ON
    Serial.println("PUMP_ON");
    Serial.println("PUMP:ON");
  } else {
    // Soil moisture is adequate (>= 30%): De-energize relay
    digitalWrite(PIN_RELAY, HIGH); // Relay OFF -> Pump STANDBY
    Serial.println("PUMP_STANDBY");
    Serial.println("PUMP:OFF");
  }

  delay(1000);
}
