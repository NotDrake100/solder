import * as THREE from 'three';
import { PartLayoutItem } from './types';
import { MaterialPalette } from './materials';

/**
 * Generates rich, aesthetic 3D meshes for hardware components.
 * Matches realistic maker component forms (Uno, ESP32, OLED, Relay, SG90, Sensors).
 */

export function createPartMesh(part: PartLayoutItem): THREE.Group {
  const group = new THREE.Group();
  group.name = `part_${part.libId}_${part.id || Math.random().toString(36).slice(2, 7)}`;
  group.userData = { part };

  const [w, d, h] = part.dims || [30, 20, 10];
  const libId = (part.libId || '').toLowerCase();

  if (libId.includes('uno') || libId.includes('arduino')) {
    buildUnoMesh(group, w, d, h, part.color);
  } else if (libId.includes('esp32') || libId.includes('nodemcu')) {
    buildEsp32Mesh(group, w, d, h, part.color);
  } else if (libId.includes('oled') || libId.includes('ssd1306') || libId.includes('display')) {
    buildOledMesh(group, w, d, h, part.color);
  } else if (libId.includes('relay')) {
    buildRelayMesh(group, w, d, h, part.color);
  } else if (libId.includes('soil') || libId.includes('probe')) {
    buildSoilProbeMesh(group, w, d, h, part.color);
  } else if (libId.includes('servo') || libId.includes('sg90')) {
    buildServoMesh(group, w, d, h, part.color);
  } else if (libId.includes('dht') || libId.includes('temp') || libId.includes('humidity')) {
    buildDhtMesh(group, w, d, h, part.color);
  } else if (libId.includes('mq') || libId.includes('gas') || libId.includes('air')) {
    buildGasSensorMesh(group, w, d, h, part.color);
  } else if (libId.includes('18650') || libId.includes('battery')) {
    buildBatteryHolderMesh(group, w, d, h, part.color);
  } else if (libId.includes('pump')) {
    buildPumpMesh(group, w, d, h, part.color);
  } else if (libId.includes('rain')) {
    buildRainSensorMesh(group, w, d, h, part.color);
  } else if (libId.includes('bme') || libId.includes('pressure')) {
    buildBmeSensorMesh(group, w, d, h, part.color);
  } else if (libId.includes('buzzer')) {
    buildBuzzerMesh(group, w, d, h, part.color);
  } else {
    buildGenericPartMesh(group, w, d, h, part.color, part.shape);
  }

  // Add subtle shadow casting/receiving to all meshes in group
  group.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return group;
}

// -------------------------------------------------------------
// Component-specific mesh builders
// -------------------------------------------------------------

function buildUnoMesh(group: THREE.Group, w: number, d: number, _h: number, customColor?: string) {
  // PCB board
  const pcbThick = 1.6;
  const pcbMat = customColor
    ? new THREE.MeshStandardMaterial({ color: customColor, roughness: 0.4 })
    : MaterialPalette.PcbUnoTeal;
  const pcbGeom = new THREE.BoxGeometry(w, pcbThick, d);
  const pcb = new THREE.Mesh(pcbGeom, pcbMat);
  pcb.position.set(0, pcbThick / 2, 0);
  group.add(pcb);

  // USB Type-B Port
  const usbGeom = new THREE.BoxGeometry(12, 11, 12);
  const usb = new THREE.Mesh(usbGeom, MaterialPalette.MetalSilver);
  usb.position.set(-w / 2 + 7, pcbThick + 5.5, -d / 2 + 10);
  group.add(usb);

  // Barrel Power Jack
  const jackGeom = new THREE.CylinderGeometry(4.5, 4.5, 13, 16);
  const jack = new THREE.Mesh(jackGeom, MaterialPalette.HeaderSocket);
  jack.rotation.z = Math.PI / 2;
  jack.position.set(-w / 2 + 7, pcbThick + 4.5, d / 2 - 12);
  group.add(jack);

  // ATmega328P DIP-28 Chip
  const chipGeom = new THREE.BoxGeometry(34, 3, 7.5);
  const chip = new THREE.Mesh(chipGeom, MaterialPalette.IcPackage);
  chip.position.set(10, pcbThick + 1.5, 4);
  group.add(chip);

  // Header socket rows (Digital headers top, Analog/Power headers bottom)
  const topHeaderGeom = new THREE.BoxGeometry(42, 8.5, 2.54);
  const topHeader = new THREE.Mesh(topHeaderGeom, MaterialPalette.HeaderSocket);
  topHeader.position.set(8, pcbThick + 4.25, -d / 2 + 2.5);
  group.add(topHeader);

  const botHeaderGeom = new THREE.BoxGeometry(38, 8.5, 2.54);
  const botHeader = new THREE.Mesh(botHeaderGeom, MaterialPalette.HeaderSocket);
  botHeader.position.set(10, pcbThick + 4.25, d / 2 - 2.5);
  group.add(botHeader);

  // Reset button
  const btnGeom = new THREE.BoxGeometry(4, 3.5, 4);
  const btnMat = new THREE.MeshStandardMaterial({ color: 0xdc2626 });
  const btn = new THREE.Mesh(btnGeom, btnMat);
  btn.position.set(-w / 2 + 7, pcbThick + 1.75, -d / 2 + 25);
  group.add(btn);
}

function buildEsp32Mesh(group: THREE.Group, w: number, d: number, _h: number, customColor?: string) {
  const pcbThick = 1.6;
  const pcbMat = customColor
    ? new THREE.MeshStandardMaterial({ color: customColor, roughness: 0.5 })
    : MaterialPalette.PcbDark;
  const pcb = new THREE.Mesh(new THREE.BoxGeometry(w, pcbThick, d), pcbMat);
  pcb.position.set(0, pcbThick / 2, 0);
  group.add(pcb);

  // Metal RF Shield Can
  const shield = new THREE.Mesh(
    new THREE.BoxGeometry(18, 3, 16),
    MaterialPalette.MetalSilver
  );
  shield.position.set(w / 4 - 3, pcbThick + 1.5, 0);
  group.add(shield);

  // Micro-USB / Type-C port
  const port = new THREE.Mesh(
    new THREE.BoxGeometry(7, 3, 6),
    MaterialPalette.MetalSilver
  );
  port.position.set(-w / 2 + 3.5, pcbThick + 1.5, 0);
  group.add(port);

  // Dual Header Pin Rows
  const pinRowGeom = new THREE.BoxGeometry(w - 6, 8.5, 2.5);
  const topPins = new THREE.Mesh(pinRowGeom, MaterialPalette.HeaderSocket);
  topPins.position.set(0, pcbThick + 4.25, -d / 2 + 2);
  group.add(topPins);

  const botPins = new THREE.Mesh(pinRowGeom, MaterialPalette.HeaderSocket);
  botPins.position.set(0, pcbThick + 4.25, d / 2 - 2);
  group.add(botPins);
}

function buildOledMesh(group: THREE.Group, w: number, d: number, _h: number, customColor?: string) {
  const pcbThick = 1.6;
  const pcbMat = customColor
    ? new THREE.MeshStandardMaterial({ color: customColor, roughness: 0.4 })
    : MaterialPalette.PcbBlue;
  const pcb = new THREE.Mesh(new THREE.BoxGeometry(w, pcbThick, d), pcbMat);
  pcb.position.set(0, pcbThick / 2, 0);
  group.add(pcb);

  // Glass Frame
  const glassW = Math.min(w - 2, 25);
  const glassD = Math.min(d - 6, 17);
  const glass = new THREE.Mesh(
    new THREE.BoxGeometry(glassW, 1.4, glassD),
    MaterialPalette.DisplayGlass
  );
  glass.position.set(0, pcbThick + 0.7, 2);
  group.add(glass);

  // Active Screen Face (with live animated canvas texture)
  const screenGeom = new THREE.PlaneGeometry(glassW - 2, glassD - 2);
  const screen = new THREE.Mesh(screenGeom, MaterialPalette.createOledScreenMaterial());
  screen.rotation.x = -Math.PI / 2;
  screen.position.set(0, pcbThick + 1.41, 2);
  group.add(screen);

  // 4-pin header on top
  const header = new THREE.Mesh(
    new THREE.BoxGeometry(10, 8.5, 2.5),
    MaterialPalette.HeaderSocket
  );
  header.position.set(0, pcbThick + 4.25, -d / 2 + 2);
  group.add(header);
}

function buildRelayMesh(group: THREE.Group, w: number, d: number, _h: number, customColor?: string) {
  const pcbThick = 1.6;
  const pcbMat = MaterialPalette.PcbDark;
  const pcb = new THREE.Mesh(new THREE.BoxGeometry(w, pcbThick, d), pcbMat);
  pcb.position.set(0, pcbThick / 2, 0);
  group.add(pcb);

  // Blue Songle Relay Box
  const relayMat = customColor
    ? new THREE.MeshStandardMaterial({ color: customColor, roughness: 0.35 })
    : MaterialPalette.RelayBox;
  const relayBox = new THREE.Mesh(new THREE.BoxGeometry(19, 15, 15), relayMat);
  relayBox.position.set(-w / 2 + 13, pcbThick + 7.5, 0);
  group.add(relayBox);

  // Green Terminal Block (3 screws)
  const term = new THREE.Mesh(new THREE.BoxGeometry(14, 10, d - 4), MaterialPalette.TerminalBlock);
  term.position.set(w / 2 - 8, pcbThick + 5, 0);
  group.add(term);

  // Terminal Screws
  for (let i = -1; i <= 1; i++) {
    const screw = new THREE.Mesh(
      new THREE.CylinderGeometry(1.4, 1.4, 1.2, 12),
      MaterialPalette.MetalSilver
    );
    screw.position.set(w / 2 - 8, pcbThick + 10.2, i * 4);
    group.add(screw);
  }
}

function buildSoilProbeMesh(group: THREE.Group, w: number, d: number, _h: number, _customColor?: string) {
  const headW = 20;
  const headD = 18;
  const pcbThick = 1.6;

  // Sensor Control Head
  const head = new THREE.Mesh(
    new THREE.BoxGeometry(headW, pcbThick, headD),
    MaterialPalette.PcbBlue
  );
  head.position.set(0, pcbThick / 2, -d / 2 + headD / 2);
  group.add(head);

  // Potentiometer
  const pot = new THREE.Mesh(
    new THREE.BoxGeometry(6, 4, 6),
    new THREE.MeshStandardMaterial({ color: 0x3b82f6 })
  );
  pot.position.set(0, pcbThick + 2, -d / 2 + headD / 2);
  group.add(pot);

  // Two Gold Probe Prongs
  const prongLength = Math.max(d - headD - 4, 30);
  const prongGeom = new THREE.BoxGeometry(4, pcbThick, prongLength);
  const prong1 = new THREE.Mesh(prongGeom, MaterialPalette.MetalGold);
  prong1.position.set(-headW / 4, pcbThick / 2, prongLength / 2 - headD / 4);
  group.add(prong1);

  const prong2 = new THREE.Mesh(prongGeom, MaterialPalette.MetalGold);
  prong2.position.set(headW / 4, pcbThick / 2, prongLength / 2 - headD / 4);
  group.add(prong2);
}

function buildServoMesh(group: THREE.Group, w: number, d: number, h: number, _customColor?: string) {
  // Main translucent blue body
  const bodyH = Math.min(h, 23);
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, bodyH, d), MaterialPalette.ServoBody);
  body.position.set(0, bodyH / 2, 0);
  group.add(body);

  // Mounting tabs
  const tab = new THREE.Mesh(new THREE.BoxGeometry(w + 10, 2, d), MaterialPalette.ServoBody);
  tab.position.set(0, bodyH * 0.7, 0);
  group.add(tab);

  // Output Gear Tower
  const gearTower = new THREE.Mesh(
    new THREE.CylinderGeometry(5, 5, 5, 16),
    MaterialPalette.PlasticWhite
  );
  gearTower.position.set(-w / 4, bodyH + 2.5, 0);
  group.add(gearTower);

  // White Servo Horn (cross arm)
  const hornArm = new THREE.Mesh(
    new THREE.BoxGeometry(22, 1.8, 4),
    MaterialPalette.PlasticWhite
  );
  hornArm.position.set(-w / 4, bodyH + 5.5, 0);
  group.add(hornArm);
}

function buildDhtMesh(group: THREE.Group, w: number, d: number, h: number, customColor?: string) {
  const isDht11 = customColor?.toLowerCase().includes('009') || customColor?.toLowerCase().includes('blue');
  const casingMat = isDht11
    ? new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 })
    : MaterialPalette.SensorGrille;

  const casing = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), casingMat);
  casing.position.set(0, h / 2, 0);
  group.add(casing);

  // Vent grill horizontal cuts
  const slotCount = 4;
  for (let i = 0; i < slotCount; i++) {
    const slot = new THREE.Mesh(
      new THREE.BoxGeometry(w * 0.7, 1.2, d + 0.2),
      MaterialPalette.HeaderSocket
    );
    slot.position.set(0, (h / (slotCount + 1)) * (i + 1), 0);
    group.add(slot);
  }
}

function buildGasSensorMesh(group: THREE.Group, w: number, d: number, _h: number, _customColor?: string) {
  const pcbThick = 1.6;
  const pcb = new THREE.Mesh(new THREE.BoxGeometry(w, pcbThick, d), MaterialPalette.PcbBlue);
  pcb.position.set(0, pcbThick / 2, 0);
  group.add(pcb);

  // Round wire mesh cylinder sensor head
  const meshHead = new THREE.Mesh(
    new THREE.CylinderGeometry(8.5, 8.5, 12, 24),
    MaterialPalette.MetalSilver
  );
  meshHead.position.set(0, pcbThick + 6, 0);
  group.add(meshHead);
}

function buildBatteryHolderMesh(group: THREE.Group, w: number, d: number, h: number, _customColor?: string) {
  // Cradle
  const cradle = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), MaterialPalette.HeaderSocket);
  cradle.position.set(0, h / 2, 0);
  group.add(cradle);

  // 18650 Battery Cell (Cylinder nestled inside)
  const cellGeom = new THREE.CylinderGeometry(8.5, 8.5, w - 8, 24);
  const cellMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.3 });
  const cell = new THREE.Mesh(cellGeom, cellMat);
  cell.rotation.z = Math.PI / 2;
  cell.position.set(0, h / 2 + 1, 0);
  group.add(cell);

  // Spring contact
  const spring = new THREE.Mesh(
    new THREE.CylinderGeometry(4, 4, 3, 12),
    MaterialPalette.MetalSilver
  );
  spring.rotation.z = Math.PI / 2;
  spring.position.set(-w / 2 + 2, h / 2 + 1, 0);
  group.add(spring);
}

function buildPumpMesh(group: THREE.Group, w: number, d: number, h: number, _customColor?: string) {
  // Pump motor cylinder
  const motor = new THREE.Mesh(new THREE.CylinderGeometry(d / 2, d / 2, w - 10, 20), MaterialPalette.MotorBody);
  motor.rotation.z = Math.PI / 2;
  motor.position.set(-3, d / 2, 0);
  group.add(motor);

  // Impeller cap
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(d / 2 + 1, d / 2 + 1, 8, 20), MaterialPalette.PlasticWhite);
  cap.rotation.z = Math.PI / 2;
  cap.position.set(w / 2 - 5, d / 2, 0);
  group.add(cap);

  // Outlet Nozzle tube
  const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 3.5, 10, 16), MaterialPalette.PlasticWhite);
  nozzle.position.set(w / 2 - 5, d + 4, 0);
  group.add(nozzle);
}

function buildRainSensorMesh(group: THREE.Group, w: number, d: number, _h: number, _customColor?: string) {
  const pcbThick = 1.6;
  const pcb = new THREE.Mesh(new THREE.BoxGeometry(w, pcbThick, d), MaterialPalette.PcbBlue);
  pcb.position.set(0, pcbThick / 2, 0);
  group.add(pcb);

  // Serpentine silver traces pattern
  const traceGeom = new THREE.BoxGeometry(w - 6, 0.4, d - 6);
  const trace = new THREE.Mesh(traceGeom, MaterialPalette.MetalSilver);
  trace.position.set(0, pcbThick + 0.2, 0);
  group.add(trace);
}

function buildBmeSensorMesh(group: THREE.Group, w: number, d: number, _h: number, _customColor?: string) {
  const pcbThick = 1.6;
  const pcbMat = new THREE.MeshStandardMaterial({ color: 0x7e22ce, roughness: 0.4 });
  const pcb = new THREE.Mesh(new THREE.BoxGeometry(w, pcbThick, d), pcbMat);
  pcb.position.set(0, pcbThick / 2, 0);
  group.add(pcb);

  // Metal square sensor lid
  const metalLid = new THREE.Mesh(new THREE.BoxGeometry(4, 1.5, 4), MaterialPalette.MetalSilver);
  metalLid.position.set(0, pcbThick + 0.75, 0);
  group.add(metalLid);
}

function buildBuzzerMesh(group: THREE.Group, w: number, _d: number, h: number, _customColor?: string) {
  const radius = Math.min(w, h) / 2;
  const buzzer = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, h, 24),
    MaterialPalette.HeaderSocket
  );
  buzzer.position.set(0, h / 2, 0);
  group.add(buzzer);

  // Center sound hole
  const hole = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.25, radius * 0.25, 0.5, 16),
    new THREE.MeshBasicMaterial({ color: 0x000000 })
  );
  hole.position.set(0, h + 0.26, 0);
  group.add(hole);
}

function buildGenericPartMesh(
  group: THREE.Group,
  w: number,
  d: number,
  h: number,
  customColor?: string,
  shape?: 'box' | 'cylinder'
) {
  const color = customColor || '#3b82f6';
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    roughness: 0.35,
    metalness: 0.15,
  });

  if (shape === 'cylinder') {
    const radius = Math.min(w, d) / 2;
    const cyl = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, h, 24), mat);
    cyl.position.set(0, h / 2, 0);
    group.add(cyl);
  } else {
    // Chamfered / Clean Box
    const box = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    box.position.set(0, h / 2, 0);
    group.add(box);

    // Accent header socket strip on top
    const strip = new THREE.Mesh(
      new THREE.BoxGeometry(w * 0.6, 2, 3),
      MaterialPalette.HeaderSocket
    );
    strip.position.set(0, h + 1, 0);
    group.add(strip);
  }
}
