import type { SolderBuild } from '../types';

// Import raw JSON showcases
import sipRaw from '../../../showcase/sip.json';
import wispRaw from '../../../showcase/wisp.json';
import haspRaw from '../../../showcase/hasp.json';
import eaveRaw from '../../../showcase/eave.json';

export const SHOWCASE_BUILDS: Record<string, SolderBuild> = {
  sip: sipRaw as unknown as SolderBuild,
  wisp: wispRaw as unknown as SolderBuild,
  hasp: haspRaw as unknown as SolderBuild,
  eave: eaveRaw as unknown as SolderBuild,
};

export const SHOWCASE_PILLS = [
  { id: 'sip', name: 'Sip', desc: 'Plant Waterer', board: 'Uno', tag: 'Soil & Pump' },
  { id: 'wisp', name: 'Wisp', desc: 'Air Monitor', board: 'ESP32', tag: 'MQ-135 & OLED' },
  { id: 'hasp', name: 'Hasp', desc: 'Smart Lock', board: 'Uno', tag: 'Servo & Distance' },
  { id: 'eave', name: 'Eave', desc: 'Weather Station', board: 'ESP32', tag: 'Temp, Rain, Air' },
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
