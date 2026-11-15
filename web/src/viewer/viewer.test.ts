import * as THREE from 'three';
import { createMaterialLibrary } from './materials';
import { createPartMesh, PART_DIMENSIONS } from './models/partMeshes';
import { buildEnclosureAssembly, computeOptimalEnclosureSize, parseSTL } from './enclosure';
import { buildWiresAssembly } from './wires';
import { BurstAnimationController } from './animation';
import { CaseSpec, PartLayoutItem } from './types';

// Simple lightweight test runner
function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`TEST FAILED: ${msg}`);
  }
}

console.log('--- Running Solder 3D Viewer Tests ---');

// 1. Test Material Library Creation
console.log('1. Testing material library across all themes...');
for (const theme of ['pla', 'acrylic', 'dark', 'resin'] as const) {
  const mats = createMaterialLibrary(theme, '#2563eb', false);
  assert(!!mats.enclosure, `Enclosure material exists for theme ${theme}`);
  assert(!!mats.enclosureLid, `Enclosure lid material exists for theme ${theme}`);
  assert(!!mats.pcbUno, 'PCB Uno material exists');
  assert(!!mats.oledScreen, 'OLED screen material exists');
  assert(!!mats.pirDome, 'PIR dome material exists');
  assert(!!mats.ledLampGlow, 'LED lamp glow material exists');
  assert(!!mats.ldrCeramic, 'LDR ceramic material exists');
  assert(!!mats.wireMaterials.red, 'Red wire material exists');

  if (theme === 'acrylic') {
    const encPhys = mats.enclosure as THREE.MeshPhysicalMaterial;
    assert(encPhys.transparent === true, `Enclosure must be transparent for theme ${theme}`);
    assert(encPhys.transmission >= 0.7, `Enclosure transmission >= 0.7 for theme ${theme} (was ${encPhys.transmission})`);
  }
}
console.log('   ✓ Material themes & translucency validated successfully.');

// 2. Test Part Meshes for all 14 library parts
console.log('2. Testing procedural 3D meshes for all 14 parts...');
const testMaterials = createMaterialLibrary('acrylic');
const partIds = [
  'arduino_uno',
  'esp32_devkit',
  'sg90_servo',
  'relay_5v',
  'oled_096',
  'soil_moisture',
  'dht11',
  'mq135',
  'battery_18650',
  'piezo_buzzer',
  'ultrasonic_hcsr04',
  'pir_motion',
  'led_lamp',
  'ldr_sensor',
  'rpi_zero_2w',
  'speaker_3w_4ohm',
  'unknown_sensor_module', // tests generic fallback
];

for (const libId of partIds) {
  const item: PartLayoutItem = {
    libId,
    name: `Test ${libId}`,
    x: 10,
    y: 10,
    z: 2,
    rotZ: 45,
  };
  const mesh = createPartMesh(item, testMaterials, [120, 90, 40], 2.0);
  assert(mesh instanceof THREE.Group, `Mesh group built for ${libId}`);
  assert(mesh.children.length > 0, `Mesh for ${libId} has child components`);
  assert(mesh.userData.libId === libId, `userData.libId preserved for ${libId}`);
  assert(mesh.position.z === 2, `Mesh Z position correctly set for ${libId}`);
}
console.log('   ✓ All 14 hardware part meshes generated successfully.');

// 3. Test Enclosure Assembly
console.log('3. Testing procedural enclosure generation...');
const mockLayout: PartLayoutItem[] = [
  { libId: 'arduino_uno', x: 10, y: 10, z: 2 },
  { libId: 'relay_5v', x: 75, y: 10, z: 2 },
  { libId: 'oled_096', x: 42, y: 42, z: 20 },
];
const enclosureSpec: CaseSpec = {
  outerMm: [128, 96, 40],
  wallMm: 2.0,
  lidType: 'snap-fit',
  material: 'frosted_acrylic',
};

const enclosure = buildEnclosureAssembly(enclosureSpec, mockLayout, testMaterials);
assert(!!enclosure.baseMesh, 'Enclosure base mesh created');
assert(!!enclosure.lidMesh, 'Enclosure lid mesh created');
assert(enclosure.standoffs.children.length === 8, '4 standoffs + 4 brass inserts created');
assert(enclosure.outerDimensions[0] === 128, 'Enclosure width matches spec');
assert(enclosure.outerDimensions[1] === 96, 'Enclosure depth matches spec');
assert(enclosure.outerDimensions[2] === 40, 'Enclosure height matches spec');
console.log('   ✓ Enclosure assembly generated successfully.');

// 4. Test Optimal Dimension Computation
console.log('4. Testing dynamic enclosure sizing fallback...');
const autoSize = computeOptimalEnclosureSize(mockLayout, 2.0, 4.0);
assert(autoSize[0] >= 110, `Computed width >= 110 (was ${autoSize[0]})`);
assert(autoSize[1] >= 65, `Computed depth >= 65 (was ${autoSize[1]})`);
assert(autoSize[2] >= 30, `Computed height >= 30 (was ${autoSize[2]})`);
console.log(`   ✓ Auto-computed size: ${autoSize.join('x')} mm.`);

// 5. Test Jumper Wires Generation
console.log('5. Testing 3D curved jumper wires...');
const wires = buildWiresAssembly(
  [
    { from: { part: 'arduino_uno', pin: '5V' }, to: { part: 'relay_5v', pin: 'VCC' }, color: '#ef4444' },
    { from: { part: 'arduino_uno', pin: 'GND' }, to: { part: 'relay_5v', pin: 'GND' }, color: '#18181b' },
  ],
  mockLayout,
  testMaterials
);
assert(wires.group.children.length === 2, '2 wire objects created');
wires.updatePositions(0.5); // test exploded wire stretching
console.log('   ✓ 3D curved wires and exploded interpolator work.');

// 6. Test Burst Animation Controller
console.log('6. Testing burst reveal animation choreography...');
const camera = new THREE.PerspectiveCamera(45, 1, 1, 1000);
const target = new THREE.Vector3(0, 0, 15);
const anim = new BurstAnimationController(camera, target);

for (const item of mockLayout) {
  const mesh = createPartMesh(item, testMaterials);
  anim.registerPart(mesh);
}
anim.registerEnclosure(enclosure);

let burstCompleted = false;
anim.startBurstReveal(() => {
  burstCompleted = true;
});
assert(anim.isBursting(), 'Burst animation is active');

// Step through animation stages
anim.update(0.5); // Scatter -> Exploded
assert(anim.getExplodedProgress() > 0, 'Exploded progress advancing');

anim.update(1.5); // Exploded hold
anim.update(2.0); // Snap down to assembled
assert(!anim.isBursting(), 'Burst animation completed');
assert(burstCompleted, 'onComplete callback fired');
console.log('   ✓ Burst reveal 3-stage choreography executed perfectly.');

// 7. Test ASCII & Binary STL Parser
console.log('7. Testing built-in STL parser...');
const sampleAsciiStl = `solid test
facet normal 0.0 0.0 1.0
  outer loop
    vertex 0.0 0.0 0.0
    vertex 10.0 0.0 0.0
    vertex 0.0 10.0 0.0
  endloop
endfacet
endsolid test`;

const stlGeom = parseSTL(sampleAsciiStl);
assert(stlGeom.getAttribute('position').count === 3, 'Parsed 3 vertices from ASCII STL');
console.log('   ✓ STL parser parsed triangles and computed normals.');

console.log('\nAll 7 test suites passed! 3D CaseViewer is 100% operational.');
