import * as THREE from 'three';
import { CaseData } from './types';
import { MaterialPalette } from './materials';

export interface CaseMeshes {
  caseGroup: THREE.Group;
  baseGroup: THREE.Group;
  lidGroup: THREE.Group;
  assembledLidY: number;
  explodedLidY: number;
}

/**
 * Creates 3D enclosure base and lid matching b4/b6 clean white aesthetic.
 * Constructed with true hollow cavity, walls, corner bosses, and snap lips.
 */
export function createCaseMesh(caseData: CaseData): CaseMeshes {
  const caseGroup = new THREE.Group();
  caseGroup.name = 'enclosure';

  const baseGroup = new THREE.Group();
  baseGroup.name = 'enclosure_base';

  const lidGroup = new THREE.Group();
  lidGroup.name = 'enclosure_lid';

  caseGroup.add(baseGroup);
  caseGroup.add(lidGroup);

  const [w, d, h] = caseData.outerMm || [120, 80, 45];
  const wall = caseData.wallMm || 2.0;
  const lidThick = 2.5;
  const baseH = h - lidThick;

  const caseMat = MaterialPalette.createCaseMaterial(caseData.color || '#f1f5f9', 0.42);
  const lidMat = MaterialPalette.createLidMaterial(caseData.color || '#f8fafc', 0.48);

  // -----------------------------------------------------------
  // 1. BASE TRAY
  // -----------------------------------------------------------
  // Bottom floor plate
  const floorGeom = new THREE.BoxGeometry(w, wall, d);
  const floor = new THREE.Mesh(floorGeom, caseMat);
  floor.position.set(0, wall / 2, 0);
  floor.receiveShadow = true;
  baseGroup.add(floor);

  // Side Wall 1: Left (-X)
  const wallLeftGeom = new THREE.BoxGeometry(wall, baseH - wall, d);
  const wallLeft = new THREE.Mesh(wallLeftGeom, caseMat);
  wallLeft.position.set(-w / 2 + wall / 2, wall + (baseH - wall) / 2, 0);
  baseGroup.add(wallLeft);

  // Side Wall 2: Right (+X)
  const wallRightGeom = new THREE.BoxGeometry(wall, baseH - wall, d);
  const wallRight = new THREE.Mesh(wallRightGeom, caseMat);
  wallRight.position.set(w / 2 - wall / 2, wall + (baseH - wall) / 2, 0);
  baseGroup.add(wallRight);

  // Side Wall 3: Front (+Z)
  const wallFrontGeom = new THREE.BoxGeometry(w - 2 * wall, baseH - wall, wall);
  const wallFront = new THREE.Mesh(wallFrontGeom, caseMat);
  wallFront.position.set(0, wall + (baseH - wall) / 2, d / 2 - wall / 2);
  baseGroup.add(wallFront);

  // Side Wall 4: Back (-Z)
  const wallBackGeom = new THREE.BoxGeometry(w - 2 * wall, baseH - wall, wall);
  const wallBack = new THREE.Mesh(wallBackGeom, caseMat);
  wallBack.position.set(0, wall + (baseH - wall) / 2, -d / 2 + wall / 2);
  baseGroup.add(wallBack);

  // Internal Corner Standoffs / Bosses (4 corners)
  const bossRadius = 3.5;
  const bossH = baseH - wall;
  const bossGeom = new THREE.CylinderGeometry(bossRadius, bossRadius, bossH, 16);
  const bossMat = MaterialPalette.createCaseMaterial('#e2e8f0', 0.6);

  const cornerOffsets = [
    [-w / 2 + wall + bossRadius, -d / 2 + wall + bossRadius],
    [w / 2 - wall - bossRadius, -d / 2 + wall + bossRadius],
    [-w / 2 + wall + bossRadius, d / 2 - wall - bossRadius],
    [w / 2 - wall - bossRadius, d / 2 - wall - bossRadius],
  ];

  for (const [bx, bz] of cornerOffsets) {
    const boss = new THREE.Mesh(bossGeom, bossMat);
    boss.position.set(bx, wall + bossH / 2, bz);
    baseGroup.add(boss);

    // Inner screw pilot hole (dark center)
    const holeGeom = new THREE.CylinderGeometry(1.2, 1.2, 2, 12);
    const hole = new THREE.Mesh(holeGeom, MaterialPalette.HeaderSocket);
    hole.position.set(bx, baseH - 1, bz);
    baseGroup.add(hole);
  }

  // Cable / USB port cutout accent on Left Wall
  const portCutout = new THREE.Mesh(
    new THREE.BoxGeometry(wall + 0.4, 12, 14),
    MaterialPalette.CaseSolid
  );
  portCutout.position.set(-w / 2 + wall / 2, wall + 6, -d / 4);
  baseGroup.add(portCutout);

  // Subtle clean edge highlights for base
  const baseBoxHelper = new THREE.BoxGeometry(w, baseH, d);
  const baseEdges = new THREE.EdgesGeometry(baseBoxHelper);
  const baseWire = new THREE.LineSegments(baseEdges, MaterialPalette.EdgeOutline);
  baseWire.position.set(0, baseH / 2, 0);
  baseGroup.add(baseWire);

  // -----------------------------------------------------------
  // 2. LID
  // -----------------------------------------------------------
  // Top main lid plate
  const lidPlateGeom = new THREE.BoxGeometry(w, lidThick, d);
  const lidPlate = new THREE.Mesh(lidPlateGeom, lidMat);
  lidPlate.position.set(0, lidThick / 2, 0);
  lidPlate.castShadow = true;
  lidGroup.add(lidPlate);

  // Nested lip underneath that inserts into base cavity
  const lipH = 2.0;
  const lipClearance = 0.6;
  const lipGeom = new THREE.BoxGeometry(
    w - 2 * wall - lipClearance,
    lipH,
    d - 2 * wall - lipClearance
  );
  const lip = new THREE.Mesh(lipGeom, lidMat);
  lip.position.set(0, -lipH / 2, 0);
  lidGroup.add(lip);

  // Snap latch tabs on sides (if snap lid)
  if (caseData.lidType === 'snap') {
    const snapTabGeom = new THREE.BoxGeometry(10, 3, 1.2);
    const snapLeft = new THREE.Mesh(snapTabGeom, MaterialPalette.CaseSolid);
    snapLeft.position.set(0, -1, d / 2 - wall / 2);
    lidGroup.add(snapLeft);

    const snapRight = new THREE.Mesh(snapTabGeom, MaterialPalette.CaseSolid);
    snapRight.position.set(0, -1, -d / 2 + wall / 2);
    lidGroup.add(snapRight);
  }

  // Subtle clean edge highlights for lid
  const lidEdges = new THREE.EdgesGeometry(lidPlateGeom);
  const lidWire = new THREE.LineSegments(lidEdges, MaterialPalette.EdgeOutline);
  lidWire.position.set(0, lidThick / 2, 0);
  lidGroup.add(lidWire);

  // Assembled position: rests right on top of base
  const assembledLidY = baseH;
  // Exploded position: elevates gracefully into the air
  const explodedLidY = baseH + 65;

  lidGroup.position.set(0, assembledLidY, 0);

  return {
    caseGroup,
    baseGroup,
    lidGroup,
    assembledLidY,
    explodedLidY,
  };
}
