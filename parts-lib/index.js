import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const partsList = [
  'arduino_uno',
  'esp32_devkit',
  'sg90_servo',
  'relay_5v',
  'oled_096',
  'soil_moisture',
  'dht11',
  'mq135',
  'battery_18650',
  'piezo_buzzer',
  'ultrasonic_hcsr04'
];

export const ALL_PARTS = [];
export const PARTS_BY_ID = {};

for (const name of partsList) {
  try {
    const partPath = path.join(__dirname, `${name}.json`);
    const part = JSON.parse(fs.readFileSync(partPath, 'utf8'));
    ALL_PARTS.push(part);
    PARTS_BY_ID[part.id] = part;
    if (part.aliases) {
      for (const alias of part.aliases) {
        PARTS_BY_ID[alias] = part;
        PARTS_BY_ID[alias.toLowerCase().replace(/[-_]/g, '')] = part;
      }
    }
  } catch (err) {
    console.error(`Error loading part ${name}:`, err);
  }
}

export function getPart(idOrAlias) {
  if (!idOrAlias) return undefined;
  const direct = PARTS_BY_ID[idOrAlias];
  if (direct) return direct;
  const normalized = idOrAlias.toLowerCase().replace(/[-_]/g, '');
  return PARTS_BY_ID[normalized];
}

export function getAllParts() {
  return ALL_PARTS;
}

export function calculatePartsCost(partIds) {
  return (partIds || []).reduce((total, item) => {
    const part = getPart(item.libId || item.id);
    const qty = item.qty || 1;
    return total + (part ? part.priceInr * qty : 0);
  }, 0);
}

export default ALL_PARTS;
