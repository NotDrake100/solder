export interface PartItem {
  id: string;
  name: string;
  libId: string;
  qty: number;
  priceInr: number;
  why: string;
}

export interface LayoutItem {
  id?: string;
  libId: string;
  name: string;
  x: number;
  y: number;
  z: number;
  rotZ?: number;
  dims: [number, number, number]; // [w, d, h] or [w, h, d] in mm
  color?: string;
  shape?: 'box' | 'cylinder';
}

export interface CaseInfo {
  outerMm: [number, number, number];
  wallMm: number;
  lidType: 'snap' | 'screw' | string;
  clearanceMm?: number;
  scad?: string;
}

export interface WiringPin {
  part: string;
  pin: string;
}

export interface WiringConnection {
  from: WiringPin;
  to: WiringPin;
  color: string;
  signal: string;
}

export interface ArduinoCode {
  filename: string;
  ino: string;
}

export interface BuildTest {
  name: string;
  set: Record<string, any>;
  expectSerial?: string;
  expectPin?: Record<string, any>;
}

export interface ProductMarketing {
  pageHeadline: string;
  bullets: string[];
  priceInr: number;
  boxSvg?: string;
}

export interface AgentLogStep {
  step: string;
  status: 'pass' | 'fail' | 'running' | 'pending';
  detail: string;
  time?: string;
}

export interface ProductBuild {
  id?: string;
  name: string;
  tagline: string;
  summary: string;
  board: 'uno' | 'esp32' | string;
  parts: PartItem[];
  layout: LayoutItem[];
  case: CaseInfo;
  wiring: WiringConnection[];
  wiringSvg?: string;
  code: ArduinoCode;
  tests?: BuildTest[];
  product?: ProductMarketing;
  buildSteps?: string[];
  agentLog?: AgentLogStep[];
}

export interface ShowcaseCardMeta {
  id: 'sip' | 'wisp' | 'hasp' | 'eave';
  name: string;
  tagline: string;
  board: 'Arduino Uno' | 'ESP32';
  priceEstimate: string;
  partsCount: number;
  highlight: string;
}
