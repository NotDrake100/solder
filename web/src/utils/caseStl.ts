/**
 * Case STL Generator for Solder Builds
 * Emits standard ASCII STL of an open-top hollow box enclosure
 * with wall thickness, floor, and a separate lid plate placed beside it.
 */

export interface CaseStlOptions {
  outerMm?: [number, number, number];
  wallMm?: number;
  case?: {
    outerMm?: [number, number, number];
    wallMm?: number;
  };
}

function computeNormal(
  v1: [number, number, number],
  v2: [number, number, number],
  v3: [number, number, number]
): [number, number, number] {
  const ax = v2[0] - v1[0];
  const ay = v2[1] - v1[1];
  const az = v2[2] - v1[2];
  const bx = v3[0] - v1[0];
  const by = v3[1] - v1[1];
  const bz = v3[2] - v1[2];

  const nx = ay * bz - az * by;
  const ny = az * bx - ax * bz;
  const nz = ax * by - ay * bx;

  const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
  if (len < 1e-6) return [0, 0, 1];
  return [nx / len, ny / len, nz / len];
}

/**
 * Generates a valid ASCII STL of an open-top hollow box + separate lid plate beside it.
 */
export function generateCaseStl(
  specOrOuter?: [number, number, number] | CaseStlOptions | any,
  wallParam?: number
): string {
  let outerMm: [number, number, number] = [82, 64, 28];
  let wallMm = 2.0;

  if (Array.isArray(specOrOuter)) {
    outerMm = [specOrOuter[0] || 82, specOrOuter[1] || 64, specOrOuter[2] || 28];
    if (typeof wallParam === 'number') wallMm = wallParam;
  } else if (specOrOuter && typeof specOrOuter === 'object') {
    if (specOrOuter.outerMm && Array.isArray(specOrOuter.outerMm)) {
      outerMm = [specOrOuter.outerMm[0] || 82, specOrOuter.outerMm[1] || 64, specOrOuter.outerMm[2] || 28];
      wallMm = specOrOuter.wallMm || wallParam || 2.0;
    } else if (specOrOuter.case?.outerMm && Array.isArray(specOrOuter.case.outerMm)) {
      outerMm = [specOrOuter.case.outerMm[0] || 82, specOrOuter.case.outerMm[1] || 64, specOrOuter.case.outerMm[2] || 28];
      wallMm = specOrOuter.case.wallMm || wallParam || 2.0;
    }
  }

  const [w, l, h] = outerMm;
  const wall = Math.max(1.0, wallMm);

  const facets: Array<{
    normal: [number, number, number];
    v: [[number, number, number], [number, number, number], [number, number, number]];
  }> = [];

  function addQuad(
    p1: [number, number, number],
    p2: [number, number, number],
    p3: [number, number, number],
    p4: [number, number, number]
  ) {
    const n1 = computeNormal(p1, p2, p3);
    facets.push({ normal: n1, v: [p1, p2, p3] });
    const n2 = computeNormal(p1, p3, p4);
    facets.push({ normal: n2, v: [p1, p3, p4] });
  }

  // 1. Box Outer Bottom (Z = 0, facing down, normal [0, 0, -1])
  addQuad([0, l, 0], [w, l, 0], [w, 0, 0], [0, 0, 0]);

  // 2. Box Outer Left Wall (X = 0, facing left, normal [-1, 0, 0])
  addQuad([0, l, 0], [0, 0, 0], [0, 0, h], [0, l, h]);

  // 3. Box Outer Right Wall (X = w, facing right, normal [1, 0, 0])
  addQuad([w, 0, 0], [w, l, 0], [w, l, h], [w, 0, h]);

  // 4. Box Outer Front Wall (Y = 0, facing front, normal [0, -1, 0])
  addQuad([w, 0, 0], [0, 0, 0], [0, 0, h], [w, 0, h]);

  // 5. Box Outer Back Wall (Y = l, facing back, normal [0, 1, 0])
  addQuad([0, l, 0], [0, l, h], [w, l, h], [w, l, 0]);

  // 6. Box Inner Floor (Z = wall, facing up into cavity, normal [0, 0, 1])
  addQuad([wall, wall, wall], [w - wall, wall, wall], [w - wall, l - wall, wall], [wall, l - wall, wall]);

  // 7. Box Inner Left Wall (X = wall, facing right into cavity, normal [1, 0, 0])
  addQuad([wall, wall, wall], [wall, l - wall, wall], [wall, l - wall, h], [wall, wall, h]);

  // 8. Box Inner Right Wall (X = w - wall, facing left into cavity, normal [-1, 0, 0])
  addQuad([w - wall, l - wall, wall], [w - wall, wall, wall], [w - wall, wall, h], [w - wall, l - wall, h]);

  // 9. Box Inner Front Wall (Y = wall, facing back into cavity, normal [0, 1, 0])
  addQuad([w - wall, wall, wall], [wall, wall, wall], [wall, wall, h], [w - wall, wall, h]);

  // 10. Box Inner Back Wall (Y = l - wall, facing front into cavity, normal [0, -1, 0])
  addQuad([wall, l - wall, wall], [w - wall, l - wall, wall], [w - wall, l - wall, h], [wall, l - wall, h]);

  // 11. Top Rim Faces (at Z = h, facing up, normal [0, 0, 1])
  // Front rim
  addQuad([0, 0, h], [w, 0, h], [w, wall, h], [0, wall, h]);
  // Back rim
  addQuad([0, l - wall, h], [w, l - wall, h], [w, l, h], [0, l, h]);
  // Left rim
  addQuad([0, wall, h], [wall, wall, h], [wall, l - wall, h], [0, l - wall, h]);
  // Right rim
  addQuad([w - wall, wall, h], [w, wall, h], [w, l - wall, h], [w - wall, l - wall, h]);

  // 12. Separate Lid Plate placed beside the box (offset along X by w + 10)
  const lidX = w + 10;
  // Lid bottom (Z = 0, facing down)
  addQuad([lidX, l, 0], [lidX + w, l, 0], [lidX + w, 0, 0], [lidX, 0, 0]);
  // Lid top (Z = wall, facing up)
  addQuad([lidX, 0, wall], [lidX + w, 0, wall], [lidX + w, l, wall], [lidX, l, wall]);
  // Lid front (Y = 0, facing front)
  addQuad([lidX + w, 0, 0], [lidX, 0, 0], [lidX, 0, wall], [lidX + w, 0, wall]);
  // Lid back (Y = l, facing back)
  addQuad([lidX, l, 0], [lidX, l, wall], [lidX + w, l, wall], [lidX + w, l, 0]);
  // Lid left (X = lidX, facing left)
  addQuad([lidX, l, 0], [lidX, 0, 0], [lidX, 0, wall], [lidX, l, wall]);
  // Lid right (X = lidX + w, facing right)
  addQuad([lidX + w, 0, 0], [lidX + w, l, 0], [lidX + w, l, wall], [lidX + w, 0, wall]);

  let stl = 'solid solder_enclosure\n';
  for (const f of facets) {
    const n = f.normal;
    stl += `  facet normal ${n[0].toFixed(6)} ${n[1].toFixed(6)} ${n[2].toFixed(6)}\n`;
    stl += '    outer loop\n';
    for (const v of f.v) {
      stl += `      vertex ${v[0].toFixed(3)} ${v[1].toFixed(3)} ${v[2].toFixed(3)}\n`;
    }
    stl += '    endloop\n';
    stl += '  endfacet\n';
  }
  stl += 'endsolid solder_enclosure\n';

  return stl;
}

/**
 * Counts total facet triangles in an ASCII STL string.
 */
export function countStlFacets(stl: string): number {
  const matches = stl.match(/endfacet/g);
  return matches ? matches.length : 0;
}

/**
 * Computes bounding box [width, length, height] of the main hollow box enclosure in the STL.
 */
export function getCaseBoundingBox(stl: string): [number, number, number] {
  const vertexRegex = /vertex\s+([-+]?[0-9]*\.?[0-9]+)\s+([-+]?[0-9]*\.?[0-9]+)\s+([-+]?[0-9]*\.?[0-9]+)/g;
  const vertices: [number, number, number][] = [];
  let match;
  while ((match = vertexRegex.exec(stl)) !== null) {
    vertices.push([parseFloat(match[1]), parseFloat(match[2]), parseFloat(match[3])]);
  }
  if (vertices.length === 0) return [0, 0, 0];

  const maxZ = Math.max(...vertices.map((v) => v[2]));
  const topVertices = vertices.filter((v) => v[2] >= maxZ - 0.01);
  const minX = Math.min(...topVertices.map((v) => v[0]));
  const maxX = Math.max(...topVertices.map((v) => v[0]));
  const minY = Math.min(...topVertices.map((v) => v[1]));
  const maxY = Math.max(...topVertices.map((v) => v[1]));

  return [
    Math.round(maxX - minX),
    Math.round(maxY - minY),
    Math.round(maxZ),
  ];
}

export const getBoundingBox = getCaseBoundingBox;
