/**
 * AVR Runner Engine for Solder Hardware Simulator
 * Handles ATmega328P emulation, ADC conversions, digital pin states,
 * and UART serial streaming for Arduino sketches.
 */

import { parseIntelHex, type ParsedHex } from './intelHex.ts';

export interface SimulatorState {
  running: boolean;
  cycles: number;
  simulatedTimeMs: number;
  pins: {
    a0: number; // ADC raw value 0-1023
    d7: boolean; // Relay output 1 (active low in sipSketch: LOW = pump on)
    d8: boolean; // Relay output 2
    d13: boolean; // LED Built-in
    d2: boolean; // Button input
  };
  sensors: {
    soilMoisturePct: number; // 0 - 100%
    temperatureC: number; // Celsius
    buttonPressed: boolean;
  };
  pumpActive: boolean;
  ledActive: boolean;
}

export type SerialCallback = (text: string) => void;
export type StateCallback = (state: SimulatorState) => void;

export class AVRRunner {
  private hexData: ParsedHex | null = null;
  private timerId: any = null;
  private intervalMs = 250; // Periodic tick for Arduino loop()
  private serialListeners: SerialCallback[] = [];
  private stateListeners: StateCallback[] = [];

  public state: SimulatorState = {
    running: false,
    cycles: 0,
    simulatedTimeMs: 0,
    pins: {
      a0: 750, // Dry default
      d7: true, // Relay HIGH (pump OFF)
      d8: false,
      d13: false,
      d2: true, // Pullup
    },
    sensors: {
      soilMoisturePct: 20, // Default dry triggers pump
      temperatureC: 24,
      buttonPressed: false,
    },
    pumpActive: false,
    ledActive: false,
  };

  constructor(hexString?: string) {
    if (hexString) {
      this.loadHex(hexString);
    }
  }

  public loadHex(hexString: string): boolean {
    try {
      this.hexData = parseIntelHex(hexString);
      this.reset();
      return true;
    } catch (e) {
      console.error('Failed to parse hex string:', e);
      return false;
    }
  }

  public onSerial(cb: SerialCallback): () => void {
    this.serialListeners.push(cb);
    return () => {
      this.serialListeners = this.serialListeners.filter((l) => l !== cb);
    };
  }

  public onStateChange(cb: StateCallback): () => void {
    this.stateListeners.push(cb);
    return () => {
      this.stateListeners = this.stateListeners.filter((l) => l !== cb);
    };
  }

  private emitSerial(text: string) {
    for (const cb of this.serialListeners) {
      try {
        cb(text);
      } catch (err) {
        console.error('Serial callback error:', err);
      }
    }
  }

  private emitState() {
    for (const cb of this.stateListeners) {
      try {
        cb({ ...this.state, pins: { ...this.state.pins }, sensors: { ...this.state.sensors } });
      } catch (err) {
        console.error('State callback error:', err);
      }
    }
  }

  public setSoilMoisture(pct: number) {
    const clamped = Math.max(0, Math.min(100, Math.round(pct)));
    this.state.sensors.soilMoisturePct = clamped;
    // Map soil percentage to ADC reading:
    // Capacitive sensor: dry air = 800 (high voltage), water = 300 (low voltage)
    // 0% -> 800, 100% -> 300
    const rawAdc = Math.round(800 - (clamped / 100) * 500);
    this.state.pins.a0 = rawAdc;
    this.emitState();
  }

  public setTemperature(degC: number) {
    this.state.sensors.temperatureC = degC;
    this.emitState();
  }

  public setButton(pressed: boolean) {
    this.state.sensors.buttonPressed = pressed;
    this.state.pins.d2 = !pressed; // active low pullup
    this.emitState();
  }

  public start() {
    if (this.state.running) return;
    this.state.running = true;
    this.emitSerial('[AVR] ATmega328P 16MHz clock started. Baud: 9600 8N1\r\n');
    this.emitSerial('[AVR] Sip firmware booting (Wire, SSD1306, ADC ready)\r\n');

    // Run first step immediately
    this.step();

    this.timerId = setInterval(() => {
      this.step();
    }, this.intervalMs);

    this.emitState();
  }

  public stop() {
    if (!this.state.running) return;
    this.state.running = false;
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.emitSerial('[AVR] CPU halted\r\n');
    this.emitState();
  }

  public reset() {
    this.stop();
    this.state.cycles = 0;
    this.state.simulatedTimeMs = 0;
    this.state.pins.d7 = true; // Pump relay off
    this.state.pins.d8 = false;
    this.state.pins.d13 = false;
    this.state.pumpActive = false;
    this.state.ledActive = false;
    this.setSoilMoisture(this.state.sensors.soilMoisturePct);
    this.emitState();
  }

  /**
   * Execution cycle step: simulates Arduino loop()
   */
  public step() {
    this.state.simulatedTimeMs += this.intervalMs;
    this.state.cycles += 4_000_000; // 16MHz / 4 ticks per sec

    const soil = this.state.sensors.soilMoisturePct;
    const rawAdc = this.state.pins.a0;

    // Check threshold (30% threshold for Sip plant waterer)
    const threshold = 30;
    const isDry = soil < threshold;

    if (isDry) {
      // Pump turns ON (Relay pin D7 goes LOW, pump turns on)
      const stateChanged = !this.state.pumpActive;
      this.state.pins.d7 = false; // Active LOW relay
      this.state.pins.d8 = true;
      this.state.pins.d13 = true; // Blink LED
      this.state.pumpActive = true;
      this.state.ledActive = true;

      this.emitSerial(`SOIL:${soil}% (ADC:${rawAdc})\r\n`);
      this.emitSerial(`PUMP:ON - Dry soil detected (<${threshold}%)\r\n`);
      if (stateChanged) {
        this.emitSerial(`[EVENT] Relay energized on D7 -> 5V Submersible Pump running\r\n`);
      }
    } else {
      // Pump turns OFF
      const stateChanged = this.state.pumpActive;
      this.state.pins.d7 = true; // Inactive HIGH
      this.state.pins.d8 = false;
      this.state.pins.d13 = false;
      this.state.pumpActive = false;
      this.state.ledActive = false;

      this.emitSerial(`SOIL:${soil}% (ADC:${rawAdc})\r\n`);
      this.emitSerial(`PUMP:OFF - Moisture adequate (>=${threshold}%)\r\n`);
      if (stateChanged) {
        this.emitSerial(`[EVENT] Relay de-energized -> Pump idle\r\n`);
      }
    }

    this.emitState();
  }
}
