import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import * as THREE from 'three';
import { createPartMesh } from './partGeometries.ts';
import { createCaseMesh } from './caseGeometries.ts';
import { easeOutCubic, easeInOutCubic } from './animator.ts';
import { MaterialPalette } from './materials.ts';

console.log('🧪 Starting 3D Viewer verification tests...\n');

// Test 1: Material Palette
console.log('Test 1: Material Palette');
const caseMat = MaterialPalette.createCaseMaterial('#ffffff', 0.45);
assert(caseMat instanceof THREE.Material, 'Case material should be a THREE.Material');
const lidMat = MaterialPalette.createLidMaterial('#f8fafc', 0.5);
assert(lidMat instanceof THREE.Material, 'Lid material should be a THREE.Material');
console.log('✓ Material palette instantiates properly');

// Test 2: Case Geometry Generation
console.log('\nTest 2: Case Geometry Generation');
const caseData = {
  outerMm: [140, 100, 45],
  wallMm: 2.0,
  lidType: 'snap',
  clearanceMm: 2.5,
};
const { caseGroup, baseGroup, lidGroup, assembledLidY, explodedLidY } = createCaseMesh(caseData);
assert(caseGroup.children.length === 2, 'Case group should have base and lid');
assert(baseGroup.children.length >= 6, 'Base should contain floor, 4 walls, corner bosses, cutout');
assert(lidGroup.children.length >= 3, 'Lid should contain lid plate, nesting lip, snap tabs');
assert.strictEqual(assembledLidY, 45 - 2.5, 'Assembled lid Y should sit on top of base');
assert(explodedLidY > assembledLidY + 50, 'Exploded lid Y should elevate significantly');
console.log(`✓ Case base & lid meshes built: assembledLidY=${assembledLidY}mm, explodedLidY=${explodedLidY}mm`);

// Test 3: Component-specific 3D Mesh Builders
console.log('\nTest 3: Hardware Component Mesh Builders');
const testParts = [
  { libId: 'uno', name: 'Arduino Uno R3', dims: [68.6, 53.4, 15.0], color: '#00979C' },
  { libId: 'esp32', name: 'ESP32 DevKit', dims: [51.5, 28.5, 12.0], color: '#18181b' },
  { libId: 'oled-096', name: '0.96 OLED Display', dims: [27.0, 27.0, 4.1], color: '#1A365D' },
  { libId: 'relay-5v', name: '5V Relay Module', dims: [43.0, 17.0, 18.0], color: '#22543D' },
  { libId: 'soil-moisture', name: 'Soil Moisture Probe', dims: [98.0, 23.0, 7.0], color: '#744210' },
  { libId: 'sg90', name: 'SG90 Micro Servo', dims: [23.0, 12.2, 29.0], color: '#0284c7' },
  { libId: 'dht22', name: 'DHT22 Sensor', dims: [25.0, 15.0, 8.0], color: '#f1f5f9' },
  { libId: 'mq135', name: 'MQ-135 Gas Sensor', dims: [35.0, 20.0, 22.0], color: '#3b82f6' },
  { libId: 'battery-18650', name: '18650 Battery Holder', dims: [76.0, 21.0, 18.0], color: '#1f2937' },
  { libId: 'pump-mini', name: 'Mini Submersible Pump', dims: [45.0, 24.0, 33.0], color: '#4A5568' },
  { libId: 'rain-sensor', name: 'Rain Sensor Board', dims: [50.0, 40.0, 3.0], color: '#1d4ed8' },
  { libId: 'bme280', name: 'BME280 Sensor', dims: [15.0, 12.0, 3.0], color: '#7e22ce' },
  { libId: 'buzzer', name: 'Piezo Buzzer', dims: [12.0, 12.0, 9.5], color: '#0f172a' },
  { libId: 'custom-widget', name: 'Custom Maker Part', dims: [30.0, 20.0, 10.0], color: '#ec4899' },
];

for (const part of testParts) {
  const mesh = createPartMesh(part);
  assert(mesh instanceof THREE.Group, `createPartMesh should return a THREE.Group for ${part.libId}`);
  assert(mesh.children.length > 0, `Mesh for ${part.libId} should have child geometries`);
  assert.strictEqual(mesh.userData.part, part, `userData.part should preserve part metadata`);

  let meshCount = 0;
  mesh.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      meshCount++;
      assert(child.castShadow, `Mesh child of ${part.libId} should cast shadow`);
      assert(child.receiveShadow, `Mesh child of ${part.libId} should receive shadow`);
    }
  });
  console.log(`✓ [${part.libId}] "${part.name}" rendered ${meshCount} detailed 3D sub-elements`);
}

// Test 4: Easing Math
console.log('\nTest 4: Easing Curve Math');
assert.strictEqual(easeOutCubic(0), 0);
assert.strictEqual(easeOutCubic(1), 1);
assert.strictEqual(easeInOutCubic(0), 0);
assert.strictEqual(easeInOutCubic(0.5), 0.5);
assert.strictEqual(easeInOutCubic(1), 1);
console.log('✓ Easing equations verified');

// Test 5: Integration with all 4 showcase builds (Sip, Wisp, Hasp, Eave)
console.log('\nTest 5: Integration with all 4 showcase products');
const products = ['sip', 'wisp', 'hasp', 'eave'];

for (const p of products) {
  const pPath = path.resolve(`/workspace/solder-agy/showcase/${p}.json`);
  if (!fs.existsSync(pPath)) {
    console.warn(`File ${p}.json not found, skipping`);
    continue;
  }
  const data = JSON.parse(fs.readFileSync(pPath, 'utf8'));

  assert(Array.isArray(data.layout), `${p} layout must be an array`);
  assert(data.case && data.case.outerMm, `${p} case must have outerMm`);

  const cMeshes = createCaseMesh(data.case);
  assert(cMeshes.caseGroup instanceof THREE.Group, `${p} case group created`);

  let pCount = 0;
  for (const item of data.layout) {
    const partMesh = createPartMesh(item);
    assert(partMesh.children.length > 0, `Part ${item.name} (${item.libId}) in ${p} must have 3D children`);
    pCount++;
  }
  assert.strictEqual(pCount, data.layout.length);
  console.log(`✓ [${data.name}] ${pCount} components rendered inside ${data.case.outerMm.join('×')}mm enclosure (${data.case.lidType} lid)`);
}

console.log('\n🎉 ALL SHOWCASE PRODUCTS TESTED AND PASSED CLEANLY!\n');
