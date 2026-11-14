/**
 * Avr8js Runner: Executes compiled AVR Intel HEX in browser.
 */

export interface HexRecord {
  length: number;
  address: number;
  type: number;
  data: Uint8Array;
}

export function parseHex(hex: string): Uint8Array {
  const flash = new Uint8Array(32768); // 32KB flash for ATmega328P
  const lines = hex.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith(':')) continue;

    const length = parseInt(trimmed.slice(1, 3), 16);
    const address = parseInt(trimmed.slice(3, 7), 16);
    const type = parseInt(trimmed.slice(7, 9), 16);

    if (type === 0x00) { // Data record
      for (let i = 0; i < length; i++) {
        const byte = parseInt(trimmed.slice(9 + i * 2, 11 + i * 2), 16);
        if (address + i < flash.length) {
          flash[address + i] = byte;
        }
      }
    } else if (type === 0x01) { // End of file
      break;
    }
  }

  return flash;
}

export class AvrSimulationEngine {
  private flash: Uint8Array;
  private isLoaded = false;
  private cpu: any = null;
  private portB: any = null;
  private portC: any = null;
  private portD: any = null;
  private onSerialByte?: (char: string) => void;
  private onPinChange?: (pin: number, val: number) => void;

  constructor(hex: string) {
    this.flash = parseHex(hex);
  }

  public async init(callbacks: {
    onSerialByte?: (char: string) => void;
    onPinChange?: (pin: number, val: number) => void;
  }) {
    this.onSerialByte = callbacks.onSerialByte;
    this.onPinChange = callbacks.onPinChange;

    try {
      // Dynamic import of avr8js
      // @ts-ignore
      const avr8js = await import('avr8js');
      if (avr8js && avr8js.CPU) {
        // Convert flash bytes to 16-bit words for avr8js
        const program = new Uint16Array(this.flash.buffer);
        this.cpu = new avr8js.CPU(program);

        // Port B (Digital 8 - 13)
        if (avr8js.portBConfig && avr8js.AVRIOPort) {
          this.portB = new avr8js.AVRIOPort(this.cpu, avr8js.portBConfig);
          this.portB.addListener((val: number) => {
            // Pin 13 is bit 5 of PORTB
            const pin13 = (val >> 5) & 1;
            this.onPinChange?.(13, pin13);
            // Pin 8 is bit 0 of PORTB
            const pin8 = val & 1;
            this.onPinChange?.(8, pin8);
          });
        }

        // Port D (Digital 0 - 7)
        if (avr8js.portDConfig && avr8js.AVRIOPort) {
          this.portD = new avr8js.AVRIOPort(this.cpu, avr8js.portDConfig);
        }

        // Port C (Analog A0 - A5)
        if (avr8js.portCConfig && avr8js.AVRIOPort) {
          this.portC = new avr8js.AVRIOPort(this.cpu, avr8js.portCConfig);
        }

        this.isLoaded = true;
      }
    } catch {
      // avr8js may not be bundled yet; graceful fallback
      this.isLoaded = false;
    }
  }

  public step(cycles = 100000): void {
    if (!this.isLoaded || !this.cpu) return;
    try {
      // @ts-ignore
      const avrInstruction = (window as any).avrInstruction;
      for (let i = 0; i < cycles; i++) {
        if (avrInstruction) {
          avrInstruction(this.cpu);
          this.cpu.cycles++;
        } else {
          break;
        }
      }
    } catch {
      // safe fallback
    }
  }

  public setAnalogPin(pin: number, value: number) {
    // value 0 - 1023
    if (this.portC) {
      // Set ADC value in avr8js if supported
    }
  }

  public setDigitalPin(pin: number, value: boolean) {
    if (pin >= 8 && pin <= 13 && this.portB) {
      this.portB.setPin(pin - 8, value);
    } else if (pin >= 0 && pin <= 7 && this.portD) {
      this.portD.setPin(pin, value);
    }
  }
}
