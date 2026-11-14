import fs from 'fs/promises';
import path from 'path';
import { PARTS_LIB_DIR } from './config.js';

let partsIndexCache = null;

export async function getPartsLibrary() {
  if (partsIndexCache) return partsIndexCache;

  const indexPath = path.join(PARTS_LIB_DIR, 'index.json');
  try {
    const raw = await fs.readFile(indexPath, 'utf-8');
    partsIndexCache = JSON.parse(raw);
    return partsIndexCache;
  } catch (err) {
    console.warn(`[partsService] Could not load parts-lib/index.json:`, err.message);
    return { parts: [] };
  }
}

export async function getPartsPromptSummary() {
  const lib = await getPartsLibrary();
  if (!lib.parts || lib.parts.length === 0) {
    return 'Available standard parts: uno (Arduino Uno R3), esp32 (ESP32 DevKit), soil-moisture (Soil Probe), relay-5v (5V 1-Channel Relay), pump-mini (5V Submersible Pump), oled-096 (SSD1306 OLED), dht22, mq135, buzzer, led-5mm, sg90 (Servo).';
  }

  const lines = lib.parts.map(
    (p) => `- ${p.id} ("${p.name}"): [${p.dims.join('x')} mm], ₹${p.priceInr || 100}, pins: ${(p.pins || []).slice(0, 6).join(',')}`
  );
  return lines.join('\n');
}
