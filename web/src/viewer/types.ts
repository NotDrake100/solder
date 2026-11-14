export type MaterialTheme = 'pla' | 'acrylic' | 'dark' | 'resin';

export interface CaseSpec {
  scad?: string;
  wallMm?: number;
  lidType?: 'snap' | 'screws' | 'slide' | 'hinged' | string;
  outerMm?: [number, number, number]; // [width_x, depth_y, height_z] in mm
  material?: 'matte_pla' | 'frosted_acrylic' | 'translucent_resin' | 'matte_black' | string;
  color?: string; // e.g. '#2563eb', '#f8fafc', '#18181b'
  stlUrl?: string; // Optional URL or raw data for pre-rendered STL
  stlData?: ArrayBuffer | string;
}

export interface PartLayoutItem {
  id?: string;
  libId: string; // e.g. "arduino_uno", "esp32_devkit", "sg90_servo", "relay_5v", "oled_096", etc.
  name?: string;
  x: number; // mm from center/origin
  y: number; // mm
  z: number; // mm
  rotZ?: number; // degrees or radians
  rotX?: number;
  rotY?: number;
  color?: string;
  dimensions?: {
    width: number;
    length: number;
    height: number;
  };
}

export interface WireConnection {
  from: { part: string; pin: string };
  to: { part: string; pin: string };
  color?: string; // e.g. '#ef4444', '#000000', '#3b82f6', '#eab308'
  signal?: string;
}

export interface CaseViewerProps {
  layout: PartLayoutItem[];
  caseSpec?: CaseSpec;
  wiring?: WireConnection[];
  isExploded?: boolean;
  onExplodeToggle?: (isExploded: boolean) => void;
  materialTheme?: MaterialTheme;
  enableBurstReveal?: boolean;
  burstTrigger?: number; // Incrementing this re-runs the signature burst reveal animation
  onBurstRevealComplete?: () => void;
  className?: string;
  style?: React.CSSProperties;
  showLid?: boolean;
  showWireframe?: boolean;
  showWires?: boolean;
  selectedPartId?: string | null;
  onSelectPart?: (libId: string | null) => void;
  autoRotate?: boolean;
}

export interface CaseViewerRef {
  resetCamera: () => void;
  triggerBurstReveal: () => void;
  setExploded: (exploded: boolean) => void;
  toggleLid: () => void;
  focusPart: (libId: string) => void;
}
