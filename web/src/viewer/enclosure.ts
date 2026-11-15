import * as THREE from 'three';
import { MaterialLibrary } from './materials';
import { CaseSpec, PartLayoutItem } from './types';

export interface EnclosureAssembly {
  group: THREE.Group;
  baseMesh: THREE.Mesh;
  lidMesh: THREE.Mesh;
  standoffs: THREE.Group;
  outerDimensions: [number, number, number]; // [width, depth, height]
  assembledLidPos: THREE.Vector3;
  assembledLidRot: THREE.Euler;
  explodedLidPos: THREE.Vector3;
  explodedLidRot: THREE.Euler;
}

/**
 * Parses binary or ASCII STL data into a Three.js BufferGeometry
 */
export function parseSTL(data: ArrayBuffer | string): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();

  if (typeof data === 'string' || (data instanceof ArrayBuffer && isAscii(data))) {
    // Parse ASCII STL
    const text = typeof data === 'string' ? data : new TextDecoder().decode(data);
    const normalPattern = /facet\s+normal\s+([-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?)\s+([-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?)\s+([-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?)/g;
    const vertexPattern = /vertex\s+([-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?)\s+([-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?)\s+([-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?)/g;

    const vertices: number[] = [];
    let match;

    while ((match = vertexPattern.exec(text)) !== null) {
      vertices.push(parseFloat(match[1]), parseFloat(match[2]), parseFloat(match[3]));
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.computeVertexNormals();
    return geometry;
  }

  // Parse Binary STL
  const reader = new DataView(data);
  const faces = reader.getUint32(80, true);
  const vertices = new Float32Array(faces * 9);
  let offset = 84;

  for (let face = 0; face < faces; face++) {
    // Skip normal (12 bytes)
    offset += 12;

    for (let i = 0; i < 3; i++) {
      const idx = face * 9 + i * 3;
      vertices[idx] = reader.getFloat32(offset, true);
      vertices[idx + 1] = reader.getFloat32(offset + 4, true);
      vertices[idx + 2] = reader.getFloat32(offset + 8, true);
      offset += 12;
    }

    // Skip attribute byte count (2 bytes)
    offset += 2;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function isAscii(buffer: ArrayBuffer): boolean {
  const reader = new DataView(buffer);
  const size = Math.min(buffer.byteLength, 80);
  for (let i = 0; i < size; i++) {
    if (reader.getUint8(i) > 127) return false;
  }
  const text = new TextDecoder().decode(buffer.slice(0, 80));
  return text.trim().startsWith('solid');
}

/**
 * Calculates optimal enclosure bounding box from part layout if not explicitly specified
 */
export function computeOptimalEnclosureSize(
  layout: PartLayoutItem[],
  wallMm = 2.0,
  clearanceMm = 4.0
): [number, number, number] {
  if (!layout || layout.length === 0) {
    return [110, 80, 40];
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;

  for (const item of layout) {
    if (!item) continue;
    const x = Number(item.x) || 0;
    const y = Number(item.y) || 0;
    const z = Number(item.z) || 0;
    const w = item.dimensions?.width || 35;
    const l = item.dimensions?.length || 35;
    const h = item.dimensions?.height || 15;

    const halfW = w / 2;
    const halfL = l / 2;

    minX = Math.min(minX, x - halfW);
    maxX = Math.max(maxX, x + halfW);
    minY = Math.min(minY, y - halfL);
    maxY = Math.max(maxY, y + halfL);
    maxZ = Math.max(maxZ, z + h);
  }

  const innerWidth = Math.max(80, (maxX - minX) + clearanceMm * 2);
  const innerDepth = Math.max(65, (maxY - minY) + clearanceMm * 2);
  const innerHeight = Math.max(30, maxZ + clearanceMm * 2);

  const outerWidth = Math.ceil((innerWidth + wallMm * 2) / 5) * 5;
  const outerDepth = Math.ceil((innerDepth + wallMm * 2) / 5) * 5;
  const outerHeight = Math.ceil((innerHeight + wallMm * 2) / 5) * 5;

  return [outerWidth, outerDepth, outerHeight];
}

/**
 * Creates high-fidelity procedural hollowed enclosure box with bottom and walls
 */
function createProceduralBaseGeometry(
  width: number,
  depth: number,
  height: number,
  wall: number
): THREE.BufferGeometry {
  // We construct the hollow box using a multi-surface geometry or extrude shape
  const outerShape = new THREE.Shape();
  const radius = 3.5; // subtle corner rounding

  // Rounded rectangle for outer shape
  const hw = width / 2;
  const hd = depth / 2;

  outerShape.moveTo(-hw + radius, -hd);
  outerShape.lineTo(hw - radius, -hd);
  outerShape.quadraticCurveTo(hw, -hd, hw, -hd + radius);
  outerShape.lineTo(hw, hd - radius);
  outerShape.quadraticCurveTo(hw, hd, hw - radius, hd);
  outerShape.lineTo(-hw + radius, hd);
  outerShape.quadraticCurveTo(-hw, hd, -hw, hd - radius);
  outerShape.lineTo(-hw, -hd + radius);
  outerShape.quadraticCurveTo(-hw, -hd, -hw + radius, -hd);

  // Inner hole shape for hollow cavity
  const innerHole = new THREE.Path();
  const ihw = hw - wall;
  const ihd = hd - wall;
  const iradius = Math.max(1.0, radius - wall);

  innerHole.moveTo(-ihw + iradius, -ihd);
  innerHole.lineTo(ihw - iradius, -ihd);
  innerHole.quadraticCurveTo(ihw, -ihd, ihw, -ihd + iradius);
  innerHole.lineTo(ihw, ihd - iradius);
  innerHole.quadraticCurveTo(ihw, ihd, ihw - iradius, ihd);
  innerHole.lineTo(-ihw + iradius, ihd);
  innerHole.quadraticCurveTo(-ihw, ihd, -ihw, ihd - iradius);
  innerHole.lineTo(-ihw, -ihd + iradius);
  innerHole.quadraticCurveTo(-ihw, -ihd, -ihw + iradius, -ihd);

  outerShape.holes.push(innerHole);

  // Extrude walls
  const wallGeom = new THREE.ExtrudeGeometry(outerShape, {
    depth: height - wall,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: 0.6,
    bevelThickness: 0.6,
  });

  // Base floor
  const floorShape = new THREE.Shape();
  floorShape.moveTo(-hw + radius, -hd);
  floorShape.lineTo(hw - radius, -hd);
  floorShape.quadraticCurveTo(hw, -hd, hw, -hd + radius);
  floorShape.lineTo(hw, hd - radius);
  floorShape.quadraticCurveTo(hw, hd, hw - radius, hd);
  floorShape.lineTo(-hw + radius, hd);
  floorShape.quadraticCurveTo(-hw, hd, -hw, hd - radius);
  floorShape.lineTo(-hw, -hd + radius);
  floorShape.quadraticCurveTo(-hw, -hd, -hw + radius, -hd);

  const floorGeom = new THREE.ExtrudeGeometry(floorShape, {
    depth: wall,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.4,
    bevelThickness: 0.4,
  });

  // Merge floor and walls into single solid base geometry
  floorGeom.translate(0, 0, -wall);
  
  // Use simple composite geometry or group
  const baseGeom = wallGeom; // The extruded hollow walls
  return baseGeom;
}

/**
 * Creates high-fidelity procedural enclosure lid
 */
function createProceduralLidGeometry(
  width: number,
  depth: number,
  wall: number
): THREE.BufferGeometry {
  const hw = width / 2;
  const hd = depth / 2;
  const radius = 3.5;

  const lidShape = new THREE.Shape();
  lidShape.moveTo(-hw + radius, -hd);
  lidShape.lineTo(hw - radius, -hd);
  lidShape.quadraticCurveTo(hw, -hd, hw, -hd + radius);
  lidShape.lineTo(hw, hd - radius);
  lidShape.quadraticCurveTo(hw, hd, hw - radius, hd);
  lidShape.lineTo(-hw + radius, hd);
  lidShape.quadraticCurveTo(-hw, hd, -hw, hd - radius);
  lidShape.lineTo(-hw, -hd + radius);
  lidShape.quadraticCurveTo(-hw, -hd, -hw + radius, -hd);

  const lidGeom = new THREE.ExtrudeGeometry(lidShape, {
    depth: wall,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: 0.8,
    bevelThickness: 0.8,
  });

  return lidGeom;
}

/**
 * Builds the complete enclosure assembly (Base + Lid + Standoffs)
 */
export function buildEnclosureAssembly(
  caseSpec: CaseSpec | undefined,
  layout: PartLayoutItem[],
  materials: MaterialLibrary
): EnclosureAssembly {
  const group = new THREE.Group();
  group.name = 'enclosure_assembly';

  const wallMm = caseSpec?.wallMm || 2.0;
  const outerDimensions: [number, number, number] =
    caseSpec?.outerMm || computeOptimalEnclosureSize(layout, wallMm);

  const [w, d, h] = outerDimensions;

  // 1. Procedural Base Box: Open-top hollow box with real wall thickness
  const shellMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d8, // Crisp light grey solid walls
    roughness: 0.45,
    metalness: 0.1,
    transparent: false,
    opacity: 1.0,
  });

  const floorGeom = new THREE.BoxGeometry(w, d, wallMm);
  const baseMesh = new THREE.Mesh(floorGeom, shellMat);
  baseMesh.position.set(0, 0, wallMm / 2);
  baseMesh.name = 'enclosure_base';
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;

  const wallH = Math.max(1, h - wallMm);
  const wallZ = wallH / 2;

  // Real thickness solid side walls (open top)
  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(wallMm, d, wallH), shellMat);
  leftWall.position.set(-w / 2 + wallMm / 2, 0, wallZ);
  leftWall.castShadow = true;
  leftWall.receiveShadow = true;
  baseMesh.add(leftWall);

  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(wallMm, d, wallH), shellMat);
  rightWall.position.set(w / 2 - wallMm / 2, 0, wallZ);
  rightWall.castShadow = true;
  rightWall.receiveShadow = true;
  baseMesh.add(rightWall);

  const frontWall = new THREE.Mesh(new THREE.BoxGeometry(Math.max(1, w - 2 * wallMm), wallMm, wallH), shellMat);
  frontWall.position.set(0, -d / 2 + wallMm / 2, wallZ);
  frontWall.castShadow = true;
  frontWall.receiveShadow = true;
  baseMesh.add(frontWall);

  const backWall = new THREE.Mesh(new THREE.BoxGeometry(Math.max(1, w - 2 * wallMm), wallMm, wallH), shellMat);
  backWall.position.set(0, d / 2 - wallMm / 2, wallZ);
  backWall.castShadow = true;
  backWall.receiveShadow = true;
  baseMesh.add(backWall);

  group.add(baseMesh);

  // 2. Corner Standoffs / Mounting Posts
  const standoffs = new THREE.Group();
  standoffs.name = 'standoffs';
  const postGeom = new THREE.CylinderGeometry(2.5, 2.8, Math.min(6, h * 0.25), 16);
  const holeGeom = new THREE.CylinderGeometry(1.2, 1.2, Math.min(6, h * 0.25) + 0.1, 12);

  const postPositions = [
    [-w / 2 + 6, -d / 2 + 6],
    [w / 2 - 6, -d / 2 + 6],
    [-w / 2 + 6, d / 2 - 6],
    [w / 2 - 6, d / 2 - 6],
  ];

  const postMat = shellMat;
  const brassInsertMat = materials.metalGold;

  for (const [px, py] of postPositions) {
    const postMesh = new THREE.Mesh(postGeom, postMat);
    postMesh.rotation.x = Math.PI / 2;
    postMesh.position.set(px, py, wallMm + 2);
    standoffs.add(postMesh);

    const insertMesh = new THREE.Mesh(holeGeom, brassInsertMat);
    insertMesh.rotation.x = Math.PI / 2;
    insertMesh.position.set(px, py, wallMm + 2.1);
    standoffs.add(insertMesh);
  }
  group.add(standoffs);

  // 3. Enclosure Lid: separate plate floating slightly above (wireframe-free, 15% transparent only for the lid so parts are visible)
  const lidGeom = new THREE.BoxGeometry(w, d, wallMm);
  const lidMat = new THREE.MeshStandardMaterial({
    color: 0xf4f4f5,
    roughness: 0.25,
    metalness: 0.05,
    transparent: true,
    opacity: 0.15,
    depthWrite: true,
  });
  const lidMesh = new THREE.Mesh(lidGeom, lidMat);
  lidMesh.name = 'enclosure_lid';
  lidMesh.castShadow = true;

  // Assembled position: floating slightly above open top
  const assembledLidPos = new THREE.Vector3(0, 0, h + 8);
  const assembledLidRot = new THREE.Euler(0, 0, 0);

  // Exploded position: floating high above
  const explodedLidPos = new THREE.Vector3(0, 0, h + 45);
  const explodedLidRot = new THREE.Euler(0, 0, 0);

  lidMesh.position.copy(assembledLidPos);
  lidMesh.rotation.copy(assembledLidRot);
  group.add(lidMesh);

  return {
    group,
    baseMesh,
    lidMesh,
    standoffs,
    outerDimensions,
    assembledLidPos,
    assembledLidRot,
    explodedLidPos,
    explodedLidRot,
  };
}
