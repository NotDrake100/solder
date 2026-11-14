import * as THREE from 'three';
import { MaterialLibrary } from './materials';
import { PartLayoutItem, WireConnection } from './types';

export interface WireAssembly {
  group: THREE.Group;
  updatePositions: (explodedProgress: number) => void;
}

/**
 * Builds 3D curved jumper wires connecting modules
 */
export function buildWiresAssembly(
  wiring: WireConnection[] | undefined,
  layout: PartLayoutItem[],
  materials: MaterialLibrary,
  partsGroup?: THREE.Group
): WireAssembly {
  const group = new THREE.Group();
  group.name = 'jumper_wires';

  // Build a map of part locations from actual mesh positions
  const partMap = new Map<string, THREE.Vector3>();

  if (partsGroup) {
    for (const child of partsGroup.children) {
      if (child.userData) {
        const pos = child.position.clone();
        pos.z += 10;
        if (child.userData.partId) partMap.set(String(child.userData.partId).toLowerCase(), pos);
        if (child.userData.libId) partMap.set(String(child.userData.libId).toLowerCase(), pos);
        if (child.userData.name) partMap.set(String(child.userData.name).toLowerCase(), pos);
      }
    }
  }

  // Fallback to layout coordinates if not found in partsGroup
  for (const item of layout || []) {
    if (!item) continue;
    const x = Number(item.x) || 0;
    const y = Number(item.y) || 0;
    const z = Number(item.z) || 0;
    const key = String(item.id || item.libId || '').toLowerCase();
    if (key && !partMap.has(key)) {
      partMap.set(key, new THREE.Vector3(x, y, z + 10));
    }
    if (item.libId && !partMap.has(item.libId.toLowerCase())) {
      partMap.set(item.libId.toLowerCase(), new THREE.Vector3(x, y, z + 10));
    }
  }

  // If no explicit wiring provided, generate realistic default connections between MCU and peripherals
  const connections: WireConnection[] = wiring && wiring.length > 0 ? wiring : [];

  if (connections.length === 0 && layout && layout.length > 1) {
    // Find MCU (Uno or ESP32)
    const mcu = layout.find((p) => p && (p.libId?.includes('uno') || p.libId?.includes('esp32')));
    if (mcu) {
      const peripherals = layout.filter((p) => p && p !== mcu);
      const wireColors = ['#ef4444', '#18181b', '#eab308', '#3b82f6', '#22c55e', '#a855f7'];

      peripherals.forEach((peri, idx) => {
        connections.push({
          from: { part: mcu.id || mcu.libId, pin: 'VCC' },
          to: { part: peri.id || peri.libId, pin: 'VCC' },
          color: '#ef4444',
          signal: '5V Power',
        });
        connections.push({
          from: { part: mcu.id || mcu.libId, pin: 'GND' },
          to: { part: peri.id || peri.libId, pin: 'GND' },
          color: '#18181b',
          signal: 'Ground',
        });
        connections.push({
          from: { part: mcu.id || mcu.libId, pin: `D${idx + 2}` },
          to: { part: peri.id || peri.libId, pin: 'SIG' },
          color: wireColors[(idx + 2) % wireColors.length],
          signal: 'Signal Data',
        });
      });
    }
  }

  const wireUpdaters: Array<(progress: number) => void> = [];

  connections.forEach((conn, index) => {
    if (!conn) return;
    const fromPart = typeof conn.from === 'object' ? conn.from?.part : conn.from;
    const toPart = typeof conn.to === 'object' ? conn.to?.part : conn.to;
    const fromKey = String(fromPart || '').toLowerCase();
    const toKey = String(toPart || '').toLowerCase();
    const startPos = partMap.get(fromKey) || new THREE.Vector3(0, 0, 10);
    const endPos = partMap.get(toKey) || new THREE.Vector3(20, 20, 10);

    // Pick material
    let mat = materials.wireMaterials.blue;
    if (conn.color) {
      const hex = parseInt(conn.color.replace('#', '0x'), 16);
      mat = new THREE.MeshStandardMaterial({
        color: hex,
        roughness: 0.35,
        metalness: 0.05,
      });
    }

    // Collar geometry for DuPont pins
    const collarGeom = new THREE.BoxGeometry(2.5, 2.5, 6);
    const collar1 = new THREE.Mesh(collarGeom, materials.plasticBlack);
    const collar2 = new THREE.Mesh(collarGeom, materials.plasticBlack);

    const wireObj = new THREE.Group();
    wireObj.add(collar1);
    wireObj.add(collar2);

    let tubeMesh: THREE.Mesh | null = null;

    const buildCurve = (p1: THREE.Vector3, p2: THREE.Vector3, sagAmount: number) => {
      const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
      const dist = p1.distanceTo(p2);
      mid.z += Math.max(8, dist * 0.25) + sagAmount;

      // Slight arch offset in XY for organic wire bundle look
      const perp = new THREE.Vector3(-(p2.y - p1.y), p2.x - p1.x, 0).normalize().multiplyScalar(4 * (index % 3 - 1));
      mid.add(perp);

      const curve = new THREE.CatmullRomCurve3([
        p1.clone().add(new THREE.Vector3(0, 0, 3)),
        p1.clone().add(new THREE.Vector3(0, 0, 10)),
        mid,
        p2.clone().add(new THREE.Vector3(0, 0, 10)),
        p2.clone().add(new THREE.Vector3(0, 0, 3)),
      ]);

      return new THREE.TubeGeometry(curve, 32, 0.7, 8, false);
    };

    const initialGeom = buildCurve(startPos, endPos, 0);
    tubeMesh = new THREE.Mesh(initialGeom, mat);
    tubeMesh.castShadow = true;
    wireObj.add(tubeMesh);

    collar1.position.copy(startPos).add(new THREE.Vector3(0, 0, 3));
    collar2.position.copy(endPos).add(new THREE.Vector3(0, 0, 3));

    group.add(wireObj);

    wireUpdaters.push((progress: number) => {
      // In exploded mode, elevate wire curve gracefully
      const p1 = startPos.clone().add(new THREE.Vector3(0, 0, progress * 15));
      const p2 = endPos.clone().add(new THREE.Vector3(0, 0, progress * 15));

      if (tubeMesh) {
        tubeMesh.geometry.dispose();
        tubeMesh.geometry = buildCurve(p1, p2, progress * 10);
      }
      collar1.position.copy(p1).add(new THREE.Vector3(0, 0, 3));
      collar2.position.copy(p2).add(new THREE.Vector3(0, 0, 3));
    });
  });

  return {
    group,
    updatePositions: (explodedProgress: number) => {
      wireUpdaters.forEach((update) => update(explodedProgress));
    },
  };
}
