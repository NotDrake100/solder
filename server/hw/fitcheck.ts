import { getPart, PartDefinition } from '../../parts-lib';

export interface LayoutItem {
  libId: string;
  x: number; // mm center or origin
  y: number; // mm
  z: number; // mm
  rotZ?: number; // degrees: 0, 90, 180, 270
}

export interface EnclosureDimensions {
  width: number;  // X inner mm
  length: number; // Y inner mm
  height: number; // Z inner mm
  wallThickness?: number; // mm (default 2.0)
  clearance?: number; // mm required (default 2.0)
}

export interface EnclosureSpec {
  innerDimensions?: { width: number; length: number; height: number };
  outerDimensions?: { width: number; length: number; height: number };
  outerMm?: [number, number, number]; // [width, length, height]
  wallMm?: number;
  wallThickness?: number;
  clearance?: number;
  lidType?: 'snap' | 'screw' | 'sliding';
}

export interface PartClearance {
  libId: string;
  name: string;
  position: { x: number; y: number; z: number };
  size: { width: number; length: number; height: number };
  wallClearances: {
    left: number;   // -X
    right: number;  // +X
    front: number;  // -Y
    back: number;   // +Y
    bottom: number; // -Z
    top: number;    // +Z
  };
  minWallClearance: number;
}

export interface Collision {
  partA: { libId: string; name: string };
  partB: { libId: string; name: string };
  overlapMm: { x: number; y: number; z: number };
  message: string;
}

export interface FitCheckResult {
  fits: boolean;
  minClearanceMm: number;
  requiredClearanceMm: number;
  clearances: PartClearance[];
  collisions: Collision[];
  details: string[];
  enclosureInner: { width: number; length: number; height: number };
}

interface BoundingBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}

function computeRotatedDimensions(dim: { width: number; length: number; height: number }, rotZ = 0): { width: number; length: number; height: number } {
  const normRot = Math.abs(rotZ % 180);
  if (normRot >= 45 && normRot <= 135) {
    // 90 or 270 deg rotation swaps width and length
    return {
      width: dim.length,
      length: dim.width,
      height: dim.height
    };
  }
  return { ...dim };
}

export function checkFit(
  layout: LayoutItem[],
  enclosureSpec: EnclosureSpec,
  options: { requiredClearance?: number } = {}
): FitCheckResult {
  const wallMm = enclosureSpec.wallMm ?? enclosureSpec.wallThickness ?? 2.0;
  const requiredClearance = options.requiredClearance ?? enclosureSpec.clearance ?? 1.5;

  let innerW: number;
  let innerL: number;
  let innerH: number;

  if (enclosureSpec.innerDimensions) {
    innerW = enclosureSpec.innerDimensions.width;
    innerL = enclosureSpec.innerDimensions.length;
    innerH = enclosureSpec.innerDimensions.height;
  } else if (enclosureSpec.outerMm) {
    innerW = Math.max(10, enclosureSpec.outerMm[0] - 2 * wallMm);
    innerL = Math.max(10, enclosureSpec.outerMm[1] - 2 * wallMm);
    innerH = Math.max(10, enclosureSpec.outerMm[2] - 2 * wallMm);
  } else if (enclosureSpec.outerDimensions) {
    innerW = Math.max(10, enclosureSpec.outerDimensions.width - 2 * wallMm);
    innerL = Math.max(10, enclosureSpec.outerDimensions.length - 2 * wallMm);
    innerH = Math.max(10, enclosureSpec.outerDimensions.height - 2 * wallMm);
  } else {
    // Estimate inner based on parts footprint
    innerW = 100;
    innerL = 80;
    innerH = 35;
  }

  const details: string[] = [];
  const clearances: PartClearance[] = [];
  const collisions: Collision[] = [];
  const boxes: Array<{ item: LayoutItem; part: PartDefinition; box: BoundingBox; size: { width: number; length: number; height: number } }> = [];

  let globalMinClearance = Infinity;

  // 1. Calculate bounding boxes for each part in layout
  for (const item of layout) {
    const part = getPart(item.libId) || {
      id: item.libId,
      name: item.libId,
      dimensions: { width: 30, length: 30, height: 15 }
    } as PartDefinition;

    const size = computeRotatedDimensions(part.dimensions, item.rotZ || 0);

    // Coordinate system: (0, 0, 0) is enclosure inner center or corner.
    // If x and y are positive from corner (0..innerW, 0..innerL):
    // We treat (x, y, z) as part center if x is near innerW/2, or corner if near 0.
    // Standard convention for Solder: x, y, z is the bottom-left-bottom corner of the component inside inner box.
    const minX = item.x;
    const maxX = item.x + size.width;
    const minY = item.y;
    const maxY = item.y + size.length;
    const minZ = item.z;
    const maxZ = item.z + size.height;

    const box: BoundingBox = { minX, maxX, minY, maxY, minZ, maxZ };
    boxes.push({ item, part, box, size });

    // Check clearances against inner walls
    const leftClearance = minX;
    const rightClearance = innerW - maxX;
    const frontClearance = minY;
    const backClearance = innerL - maxY;
    const bottomClearance = minZ;
    const topClearance = innerH - maxZ;

    const minPartWallClearance = Math.min(
      leftClearance, rightClearance,
      frontClearance, backClearance,
      bottomClearance, topClearance
    );

    if (minPartWallClearance < globalMinClearance) {
      globalMinClearance = minPartWallClearance;
    }

    clearances.push({
      libId: item.libId,
      name: part.name,
      position: { x: item.x, y: item.y, z: item.z },
      size,
      wallClearances: {
        left: Math.round(leftClearance * 10) / 10,
        right: Math.round(rightClearance * 10) / 10,
        front: Math.round(frontClearance * 10) / 10,
        back: Math.round(backClearance * 10) / 10,
        bottom: Math.round(bottomClearance * 10) / 10,
        top: Math.round(topClearance * 10) / 10
      },
      minWallClearance: Math.round(minPartWallClearance * 10) / 10
    });

    if (minPartWallClearance < 0) {
      details.push(`Part "${part.name}" exceeds enclosure boundary by ${Math.abs(Math.round(minPartWallClearance * 10) / 10)}mm.`);
    } else if (minPartWallClearance < requiredClearance) {
      details.push(`Part "${part.name}" has only ${Math.round(minPartWallClearance * 10) / 10}mm wall clearance (required: >=${requiredClearance}mm).`);
    }
  }

  // 2. Check collision between every pair of parts
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const b1 = boxes[i];
      const b2 = boxes[j];

      const overlapX = Math.min(b1.box.maxX, b2.box.maxX) - Math.max(b1.box.minX, b2.box.minX);
      const overlapY = Math.min(b1.box.maxY, b2.box.maxY) - Math.max(b1.box.minY, b2.box.minY);
      const overlapZ = Math.min(b1.box.maxZ, b2.box.maxZ) - Math.max(b1.box.minZ, b2.box.minZ);

      // Positive overlap in all 3 axes means collision
      if (overlapX > 0 && overlapY > 0 && overlapZ > 0) {
        const overlapMm = {
          x: Math.round(overlapX * 10) / 10,
          y: Math.round(overlapY * 10) / 10,
          z: Math.round(overlapZ * 10) / 10
        };
        collisions.push({
          partA: { libId: b1.item.libId, name: b1.part.name },
          partB: { libId: b2.item.libId, name: b2.part.name },
          overlapMm,
          message: `Collision between "${b1.part.name}" and "${b2.part.name}" (overlap ${overlapMm.x}x${overlapMm.y}x${overlapMm.z}mm)`
        });
        details.push(`Collision: "${b1.part.name}" and "${b2.part.name}" overlap by ${overlapMm.x}x${overlapMm.y}x${overlapMm.z}mm.`);
      }
    }
  }

  const fits = collisions.length === 0 && (globalMinClearance >= requiredClearance || layout.length === 0);

  if (fits) {
    details.push(`Fits verified: All parts have >=${requiredClearance}mm clearance and zero collisions.`);
  }

  return {
    fits,
    minClearanceMm: globalMinClearance === Infinity ? 0 : Math.round(globalMinClearance * 10) / 10,
    requiredClearanceMm: requiredClearance,
    clearances,
    collisions,
    details,
    enclosureInner: { width: innerW, length: innerL, height: innerH }
  };
}
