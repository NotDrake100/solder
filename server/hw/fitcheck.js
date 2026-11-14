import partsLib, { getPart } from '../../parts-lib/index.js';

function computeRotatedDimensions(dim, rotZ = 0) {
  const normRot = Math.abs((rotZ || 0) % 180);
  if (normRot >= 45 && normRot <= 135) {
    return {
      width: dim.length,
      length: dim.width,
      height: dim.height
    };
  }
  return { ...dim };
}

export function checkFit(layout, enclosureSpec = {}, options = {}) {
  const wallMm = enclosureSpec.wallMm ?? enclosureSpec.wallThickness ?? 2.0;
  const requiredClearance = options.requiredClearance ?? enclosureSpec.clearance ?? 1.5;

  let innerW;
  let innerL;
  let innerH;

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
    innerW = 100;
    innerL = 80;
    innerH = 35;
  }

  const details = [];
  const clearances = [];
  const collisions = [];
  const boxes = [];

  let globalMinClearance = Infinity;

  for (const item of (layout || [])) {
    const part = getPart(item.libId) || {
      id: item.libId,
      name: item.libId,
      dimensions: { width: 30, length: 30, height: 15 }
    };

    const size = computeRotatedDimensions(part.dimensions, item.rotZ || 0);

    const minX = item.x;
    const maxX = item.x + size.width;
    const minY = item.y;
    const maxY = item.y + size.length;
    const minZ = item.z;
    const maxZ = item.z + size.height;

    const box = { minX, maxX, minY, maxY, minZ, maxZ };
    boxes.push({ item, part, box, size });

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

  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const b1 = boxes[i];
      const b2 = boxes[j];

      const overlapX = Math.min(b1.box.maxX, b2.box.maxX) - Math.max(b1.box.minX, b2.box.minX);
      const overlapY = Math.min(b1.box.maxY, b2.box.maxY) - Math.max(b1.box.minY, b2.box.minY);
      const overlapZ = Math.min(b1.box.maxZ, b2.box.maxZ) - Math.max(b1.box.minZ, b2.box.minZ);

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

  const fits = collisions.length === 0 && (globalMinClearance >= requiredClearance || (layout || []).length === 0);

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

export default {
  checkFit
};
