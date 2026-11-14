export interface PartLayoutItem {
  id?: string;
  libId: string;
  name: string;
  x: number; // mm (center x relative to enclosure center)
  y: number; // mm (center y relative to enclosure center)
  z: number; // mm (bottom or center z offset from base)
  rotZ?: number; // degrees
  rotX?: number; // degrees
  rotY?: number; // degrees
  dims: [number, number, number]; // [width (x), depth (y), height (z)] in mm
  color?: string; // hex color for mesh body or accent
  shape?: 'box' | 'cylinder'; // shape hint
  description?: string;
}

export interface CaseData {
  outerMm: [number, number, number]; // [width, depth, height] in mm
  wallMm: number; // wall thickness, e.g. 2.0 mm
  lidType: 'snap' | 'screw' | 'slide' | string;
  clearanceMm?: number;
  scad?: string;
  color?: string;
}

export interface ViewerProps {
  layout: PartLayoutItem[];
  caseData?: CaseData;
  isExploded?: boolean;
  onToggleExploded?: () => void;
  burstKey?: number | string;
  className?: string;
  autoRotate?: boolean;
  showCase?: boolean;
  showGrid?: boolean;
  onPartSelect?: (part: PartLayoutItem | null) => void;
  selectedPartId?: string | null;
}
