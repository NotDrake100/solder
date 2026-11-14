import arduinoUno from './arduino_uno.json';
import esp32Devkit from './esp32_devkit.json';
import sg90Servo from './sg90_servo.json';
import relay5v from './relay_5v.json';
import oled096 from './oled_096.json';
import soilMoisture from './soil_moisture.json';
import dht11 from './dht11.json';
import mq135 from './mq135.json';
import battery18650 from './battery_18650.json';
import piezoBuzzer from './piezo_buzzer.json';
import ultrasonicHcsr04 from './ultrasonic_hcsr04.json';

export interface PartPin {
  name: string;
  type: 'power' | 'ground' | 'analog' | 'digital' | 'pwm' | 'i2c' | 'spi' | 'uart';
  description: string;
  voltage: number;
}

export interface MountingHole {
  x: number;
  y: number;
  diameter: number;
}

export interface PartDimensions {
  width: number; // mm (X)
  length: number; // mm (Y)
  height: number; // mm (Z)
  mountingHoles?: MountingHole[];
  [key: string]: any;
}

export interface PartDefinition {
  id: string;
  aliases: string[];
  name: string;
  category: 'mcu' | 'sensor' | 'actuator' | 'display' | 'power' | 'misc';
  description: string;
  dimensions: PartDimensions;
  pins: PartPin[];
  priceInr: number;
  operatingVoltage: number;
  color: string;
}

export const ALL_PARTS: PartDefinition[] = [
  arduinoUno as unknown as PartDefinition,
  esp32Devkit as unknown as PartDefinition,
  sg90Servo as unknown as PartDefinition,
  relay5v as unknown as PartDefinition,
  oled096 as unknown as PartDefinition,
  soilMoisture as unknown as PartDefinition,
  dht11 as unknown as PartDefinition,
  mq135 as unknown as PartDefinition,
  battery18650 as unknown as PartDefinition,
  piezoBuzzer as unknown as PartDefinition,
  ultrasonicHcsr04 as unknown as PartDefinition
];

export const PARTS_BY_ID: Record<string, PartDefinition> = {};
for (const part of ALL_PARTS) {
  PARTS_BY_ID[part.id] = part;
  for (const alias of part.aliases || []) {
    PARTS_BY_ID[alias] = part;
    PARTS_BY_ID[alias.toLowerCase().replace(/[-_]/g, '')] = part;
  }
}

export function getPart(idOrAlias: string): PartDefinition | undefined {
  if (!idOrAlias) return undefined;
  const direct = PARTS_BY_ID[idOrAlias];
  if (direct) return direct;
  const normalized = idOrAlias.toLowerCase().replace(/[-_]/g, '');
  return PARTS_BY_ID[normalized];
}

export function getAllParts(): PartDefinition[] {
  return ALL_PARTS;
}

export function calculatePartsCost(partIds: Array<{ libId: string; qty?: number }>): number {
  return partIds.reduce((total, item) => {
    const part = getPart(item.libId);
    const qty = item.qty || 1;
    return total + (part ? part.priceInr * qty : 0);
  }, 0);
}

export default ALL_PARTS;
