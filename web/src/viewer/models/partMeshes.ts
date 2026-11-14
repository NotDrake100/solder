import * as THREE from 'three';
import { MaterialLibrary, createChipSilkscreenTexture } from '../materials';
import { PartLayoutItem } from '../types';

export const PART_DIMENSIONS: Record<string, { width: number; length: number; height: number }> = {
  arduino_uno: { width: 68.6, length: 53.4, height: 15.0 },
  uno: { width: 68.6, length: 53.4, height: 15.0 },
  esp32_devkit: { width: 51.5, length: 28.5, height: 12.0 },
  esp32: { width: 51.5, length: 28.5, height: 12.0 },
  sg90_servo: { width: 22.8, length: 12.0, height: 31.0 },
  sg90: { width: 22.8, length: 12.0, height: 31.0 },
  relay_5v: { width: 43.0, length: 17.0, height: 19.0 },
  relay_1ch: { width: 43.0, length: 17.0, height: 19.0 },
  oled_096: { width: 27.0, length: 27.0, height: 4.1 },
  oled: { width: 27.0, length: 27.0, height: 4.1 },
  soil_moisture: { width: 60.0, length: 20.0, height: 8.0 },
  soil_sensor: { width: 60.0, length: 20.0, height: 8.0 },
  dht11: { width: 15.5, length: 12.0, height: 5.5 },
  mq135: { width: 35.0, length: 20.0, height: 21.0 },
  battery_18650: { width: 75.0, length: 21.0, height: 18.0 },
  piezo_buzzer: { width: 12.0, length: 12.0, height: 9.5 },
  buzzer: { width: 12.0, length: 12.0, height: 9.5 },
  ultrasonic_hcsr04: { width: 45.0, length: 20.0, height: 15.0 },
  hcsr04: { width: 45.0, length: 20.0, height: 15.0 },
  pir_motion: { width: 24.0, length: 32.0, height: 18.0 },
  pir: { width: 24.0, length: 32.0, height: 18.0 },
  motion_sensor: { width: 24.0, length: 32.0, height: 18.0 },
  led_lamp: { width: 15.0, length: 25.0, height: 12.0 },
  lamp: { width: 15.0, length: 25.0, height: 12.0 },
  led_module: { width: 15.0, length: 25.0, height: 12.0 },
  ldr_sensor: { width: 14.0, length: 32.0, height: 8.5 },
  ldr: { width: 14.0, length: 32.0, height: 8.5 },
  light_sensor: { width: 14.0, length: 32.0, height: 8.5 },
};

export function getPartDimensions(libId: string): { width: number; length: number; height: number } {
  const normalized = (libId || '').toLowerCase().trim();
  for (const [key, dims] of Object.entries(PART_DIMENSIONS)) {
    if (normalized.includes(key)) return dims;
  }
  return { width: 35.0, length: 35.0, height: 12.0 };
}

/**
 * Builds a detailed procedural 3D model for Arduino Uno R3
 */
export function buildArduinoUnoMesh(materials: MaterialLibrary): THREE.Group {
  const group = new THREE.Group();
  group.name = 'arduino_uno';

  // 1. PCB (68.6 x 53.4 x 1.6 mm)
  const pcbGeom = new THREE.BoxGeometry(68.6, 53.4, 1.6);
  const pcb = new THREE.Mesh(pcbGeom, materials.pcbUno);
  pcb.position.set(0, 0, 0.8);
  pcb.castShadow = true;
  pcb.receiveShadow = true;
  group.add(pcb);

  // 2. USB Type-B Port (Silver box: 16 x 12 x 11 mm)
  const usbGeom = new THREE.BoxGeometry(16, 12, 11);
  const usb = new THREE.Mesh(usbGeom, materials.metalSilver);
  usb.position.set(-27, 16, 1.6 + 5.5);
  usb.castShadow = true;
  group.add(usb);

  // USB inner hole
  const usbHoleGeom = new THREE.BoxGeometry(1, 8, 7);
  const usbHole = new THREE.Mesh(usbHoleGeom, materials.plasticBlack);
  usbHole.position.set(-35, 16, 1.6 + 5.5);
  group.add(usbHole);

  // 3. DC Barrel Jack (Black block + metal barrel: 14 x 9 x 11 mm)
  const dcGeom = new THREE.BoxGeometry(14, 9, 11);
  const dc = new THREE.Mesh(dcGeom, materials.plasticBlack);
  dc.position.set(-27, -17, 1.6 + 5.5);
  dc.castShadow = true;
  group.add(dc);

  // 4. ATmega328P DIP-28 Chip (35 x 8 x 4 mm)
  const chipGeom = new THREE.BoxGeometry(35, 8, 3.5);
  const chipTex = createChipSilkscreenTexture('ATmega328P');
  const chipMat = new THREE.MeshStandardMaterial({
    map: chipTex,
    roughness: 0.7,
    metalness: 0.1,
  });
  const chip = new THREE.Mesh(chipGeom, chipMat);
  chip.position.set(10, -5, 1.6 + 1.75);
  chip.castShadow = true;
  group.add(chip);

  // 5. Crystal Oscillator (Silver cylinder: 11 x 4 x 3 mm)
  const crystalGeom = new THREE.CylinderGeometry(2, 2, 10, 16);
  const crystal = new THREE.Mesh(crystalGeom, materials.metalSilver);
  crystal.rotation.z = Math.PI / 2;
  crystal.position.set(-12, 5, 1.6 + 1.5);
  group.add(crystal);

  // 6. Female Pin Headers (Black plastic blocks)
  // Digital header top: 10 + 8 pins (approx 48 x 2.5 x 8.5 mm)
  const digHeaderGeom = new THREE.BoxGeometry(46, 2.8, 8.5);
  const digHeader = new THREE.Mesh(digHeaderGeom, materials.plasticBlack);
  digHeader.position.set(7, 24, 1.6 + 4.25);
  digHeader.castShadow = true;
  group.add(digHeader);

  // Analog/Power header bottom: (approx 44 x 2.8 x 8.5 mm)
  const pwrHeaderGeom = new THREE.BoxGeometry(44, 2.8, 8.5);
  const pwrHeader = new THREE.Mesh(pwrHeaderGeom, materials.plasticBlack);
  pwrHeader.position.set(8, -24, 1.6 + 4.25);
  pwrHeader.castShadow = true;
  group.add(pwrHeader);

  // Gold pin hole dots on headers
  const pinDotGeom = new THREE.BoxGeometry(1.2, 1.2, 0.4);
  for (let i = -8; i <= 8; i++) {
    const pinTop = new THREE.Mesh(pinDotGeom, materials.metalGold);
    pinTop.position.set(7 + i * 2.54, 24, 1.6 + 8.6);
    group.add(pinTop);

    const pinBot = new THREE.Mesh(pinDotGeom, materials.metalGold);
    pinBot.position.set(8 + i * 2.54, -24, 1.6 + 8.6);
    group.add(pinBot);
  }

  // 7. Reset Tactile Button (Red & metal: 6 x 6 x 4 mm)
  const btnBaseGeom = new THREE.BoxGeometry(6, 6, 2.5);
  const btnBase = new THREE.Mesh(btnBaseGeom, materials.metalSilver);
  btnBase.position.set(-27, 3, 1.6 + 1.25);
  group.add(btnBase);

  const btnPuckGeom = new THREE.CylinderGeometry(1.5, 1.5, 2, 16);
  const btnPuck = new THREE.Mesh(btnPuckGeom, materials.ledRed);
  btnPuck.rotation.x = Math.PI / 2;
  btnPuck.position.set(-27, 3, 1.6 + 3.0);
  group.add(btnPuck);

  // 8. Status LEDs (Green ON, Orange L)
  const ledOnGeom = new THREE.BoxGeometry(1.6, 1.6, 1.2);
  const ledOn = new THREE.Mesh(ledOnGeom, materials.ledGreen);
  ledOn.position.set(16, 14, 1.6 + 0.6);
  group.add(ledOn);

  return group;
}

/**
 * Builds a detailed procedural 3D model for ESP32 DevKit V1
 */
export function buildEsp32Mesh(materials: MaterialLibrary): THREE.Group {
  const group = new THREE.Group();
  group.name = 'esp32_devkit';

  // 1. PCB (51.5 x 28.5 x 1.6 mm)
  const pcbGeom = new THREE.BoxGeometry(51.5, 28.5, 1.6);
  const pcb = new THREE.Mesh(pcbGeom, materials.pcbEsp32);
  pcb.position.set(0, 0, 0.8);
  pcb.castShadow = true;
  pcb.receiveShadow = true;
  group.add(pcb);

  // 2. Metal Shielding Can (ESP-WROOM-32: 18 x 18 x 3 mm)
  const shieldGeom = new THREE.BoxGeometry(18, 18, 3);
  const shield = new THREE.Mesh(shieldGeom, materials.metalShield);
  shield.position.set(-4, 0, 1.6 + 1.5);
  shield.castShadow = true;
  group.add(shield);

  // 3. PCB Inverted-F Antenna Area (Gold traces on black: 12 x 18 x 1.6 mm)
  const antGeom = new THREE.BoxGeometry(10, 18, 1.7);
  const ant = new THREE.Mesh(antGeom, materials.metalGold);
  ant.position.set(-19, 0, 0.85);
  group.add(ant);

  // 4. Micro-USB Port (8 x 6 x 3 mm)
  const usbGeom = new THREE.BoxGeometry(8, 6, 3);
  const usb = new THREE.Mesh(usbGeom, materials.metalSilver);
  usb.position.set(22.5, 0, 1.6 + 1.5);
  usb.castShadow = true;
  group.add(usb);

  // 5. Dual Pin Headers (15 pins on top and bottom edges)
  const headerGeom = new THREE.BoxGeometry(40, 2.5, 8.5);
  const topHeader = new THREE.Mesh(headerGeom, materials.plasticBlack);
  topHeader.position.set(2, 12, 1.6 + 4.25);
  group.add(topHeader);

  const botHeader = new THREE.Mesh(headerGeom, materials.plasticBlack);
  botHeader.position.set(2, -12, 1.6 + 4.25);
  group.add(botHeader);

  // Gold pin tips
  const pinDotGeom = new THREE.BoxGeometry(1, 1, 0.5);
  for (let i = -7; i <= 7; i++) {
    const p1 = new THREE.Mesh(pinDotGeom, materials.metalGold);
    p1.position.set(2 + i * 2.54, 12, 1.6 + 8.6);
    group.add(p1);

    const p2 = new THREE.Mesh(pinDotGeom, materials.metalGold);
    p2.position.set(2 + i * 2.54, -12, 1.6 + 8.6);
    group.add(p2);
  }

  // 6. EN & BOOT Tactile Buttons
  const btnGeom = new THREE.BoxGeometry(3.5, 3.5, 2);
  const enBtn = new THREE.Mesh(btnGeom, materials.metalSilver);
  enBtn.position.set(16, 8, 1.6 + 1);
  group.add(enBtn);

  const bootBtn = new THREE.Mesh(btnGeom, materials.metalSilver);
  bootBtn.position.set(16, -8, 1.6 + 1);
  group.add(bootBtn);

  // 7. Status LEDs
  const redLed = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1), materials.ledRed);
  redLed.position.set(8, 6, 1.6 + 0.5);
  group.add(redLed);

  const blueLed = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1), materials.relayBlue);
  blueLed.position.set(8, -6, 1.6 + 0.5);
  group.add(blueLed);

  return group;
}

/**
 * Builds SG90 Micro Servo (22.2 x 11.8 x 31 mm)
 */
export function buildSg90ServoMesh(materials: MaterialLibrary): THREE.Group {
  const group = new THREE.Group();
  group.name = 'sg90_servo';

  // 1. Translucent blue servo body (22.8 x 12 x 22.7 mm)
  const bodyGeom = new THREE.BoxGeometry(22.8, 12, 22.7);
  const body = new THREE.Mesh(bodyGeom, materials.servoBlueTranslucent);
  body.position.set(0, 0, 11.35);
  body.castShadow = true;
  group.add(body);

  // 2. Mounting flange tabs (32.5 x 12 x 2.5 mm)
  const tabGeom = new THREE.BoxGeometry(32.5, 12, 2.5);
  const tab = new THREE.Mesh(tabGeom, materials.servoBlueTranslucent);
  tab.position.set(0, 0, 16);
  group.add(tab);

  // Mounting holes in tabs
  const holeGeom = new THREE.CylinderGeometry(1, 1, 3, 12);
  const h1 = new THREE.Mesh(holeGeom, materials.plasticBlack);
  h1.position.set(-13.5, 0, 16);
  group.add(h1);
  const h2 = new THREE.Mesh(holeGeom, materials.plasticBlack);
  h2.position.set(13.5, 0, 16);
  group.add(h2);

  // 3. Top gear turret (Cylinder d=11.5, h=4)
  const turretGeom = new THREE.CylinderGeometry(5.75, 5.75, 4, 24);
  const turret = new THREE.Mesh(turretGeom, materials.servoBlueTranslucent);
  turret.position.set(-5.5, 0, 24.7);
  group.add(turret);

  // 4. Brass spline shaft
  const shaftGeom = new THREE.CylinderGeometry(2.4, 2.4, 3.5, 16);
  const shaft = new THREE.Mesh(shaftGeom, materials.metalGold);
  shaft.position.set(-5.5, 0, 27.5);
  group.add(shaft);

  // 5. White nylon servo horn / arm
  const hornGeom = new THREE.BoxGeometry(26, 6, 2);
  const horn = new THREE.Mesh(hornGeom, materials.plasticWhite);
  horn.position.set(2, 0, 29);
  horn.rotation.z = Math.PI / 6;
  horn.castShadow = true;
  group.add(horn);

  // Horn center screw
  const screwGeom = new THREE.CylinderGeometry(1.2, 1.2, 1, 12);
  const screw = new THREE.Mesh(screwGeom, materials.metalSilver);
  screw.position.set(-5.5, 0, 30.2);
  group.add(screw);

  return group;
}

/**
 * Builds 5V Relay Module (43 x 17 x 19 mm)
 */
export function buildRelayMesh(materials: MaterialLibrary): THREE.Group {
  const group = new THREE.Group();
  group.name = 'relay_5v';

  // 1. Blue PCB base (43 x 17 x 1.6 mm)
  const pcbGeom = new THREE.BoxGeometry(43, 17, 1.6);
  const pcb = new THREE.Mesh(pcbGeom, materials.pcbBlue);
  pcb.position.set(0, 0, 0.8);
  pcb.castShadow = true;
  group.add(pcb);

  // 2. Songle Blue Relay Cube (19 x 15 x 15.5 mm)
  const relayGeom = new THREE.BoxGeometry(19, 15, 15.5);
  const relay = new THREE.Mesh(relayGeom, materials.relayBlue);
  relay.position.set(-2, 0, 1.6 + 7.75);
  relay.castShadow = true;
  group.add(relay);

  // 3. Green Screw Terminal Block (3-terminal: 11 x 15 x 10 mm)
  const termGeom = new THREE.BoxGeometry(11, 15, 10);
  const term = new THREE.Mesh(termGeom, materials.relayTerminal);
  term.position.set(-15, 0, 1.6 + 5);
  term.castShadow = true;
  group.add(term);

  // Metal screw heads on terminals
  const screwGeom = new THREE.CylinderGeometry(1.5, 1.5, 0.8, 12);
  for (let i = -1; i <= 1; i++) {
    const s = new THREE.Mesh(screwGeom, materials.metalSilver);
    s.position.set(-15, i * 4.5, 1.6 + 10.4);
    group.add(s);
  }

  // 4. 3-pin input header (VCC, GND, IN)
  const headerGeom = new THREE.BoxGeometry(2.5, 8, 8.5);
  const header = new THREE.Mesh(headerGeom, materials.plasticBlack);
  header.position.set(18, 0, 1.6 + 4.25);
  group.add(header);

  // Gold pins
  const pinGeom = new THREE.BoxGeometry(0.8, 0.8, 3);
  for (let i = -1; i <= 1; i++) {
    const pin = new THREE.Mesh(pinGeom, materials.metalGold);
    pin.position.set(18, i * 2.54, 1.6 + 9);
    group.add(pin);
  }

  // 5. Status LEDs (Power & Relay)
  const pwrLed = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 0.8), materials.ledRed);
  pwrLed.position.set(11, 4, 1.6 + 0.4);
  group.add(pwrLed);

  const actLed = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 0.8), materials.ledGreen);
  actLed.position.set(11, -4, 1.6 + 0.4);
  group.add(actLed);

  return group;
}

/**
 * Builds 0.96 inch I2C OLED Display Module (27 x 27 x 4.1 mm)
 */
export function buildOledMesh(materials: MaterialLibrary): THREE.Group {
  const group = new THREE.Group();
  group.name = 'oled_096';

  // 1. Blue PCB base (27 x 27 x 1.6 mm)
  const pcbGeom = new THREE.BoxGeometry(27, 27, 1.6);
  const pcb = new THREE.Mesh(pcbGeom, materials.pcbBlue);
  pcb.position.set(0, 0, 0.8);
  pcb.castShadow = true;
  group.add(pcb);

  // 2. Glass OLED Screen substrate (25 x 18 x 1.2 mm)
  const screenGeom = new THREE.BoxGeometry(25, 18, 1.2);
  const screen = new THREE.Mesh(screenGeom, materials.oledScreen);
  screen.position.set(0, -2, 1.6 + 0.6);
  screen.castShadow = true;
  group.add(screen);

  // Screen bezel border
  const bezelGeom = new THREE.BoxGeometry(26, 19, 0.6);
  const bezel = new THREE.Mesh(bezelGeom, materials.oledBezel);
  bezel.position.set(0, -2, 1.6 + 0.3);
  group.add(bezel);

  // 3. 4-pin angled header at top edge (GND, VCC, SCL, SDA)
  const headerGeom = new THREE.BoxGeometry(10.5, 2.5, 5);
  const header = new THREE.Mesh(headerGeom, materials.plasticBlack);
  header.position.set(0, 11, 1.6 + 2.5);
  group.add(header);

  // Gold header pins
  const pinGeom = new THREE.BoxGeometry(0.8, 0.8, 4);
  for (let i = -1.5; i <= 1.5; i += 1) {
    const pin = new THREE.Mesh(pinGeom, materials.metalGold);
    pin.position.set(i * 2.54, 11, 1.6 + 5.5);
    group.add(pin);
  }

  return group;
}

/**
 * Builds Soil Moisture Sensor Probe (60 x 20 x 8 mm)
 */
export function buildSoilMoistureMesh(materials: MaterialLibrary): THREE.Group {
  const group = new THREE.Group();
  group.name = 'soil_moisture';

  // 1. Top sensor electronics PCB (20 x 20 x 1.6 mm)
  const topPcbGeom = new THREE.BoxGeometry(20, 20, 1.6);
  const topPcb = new THREE.Mesh(topPcbGeom, materials.pcbGreen);
  topPcb.position.set(0, 20, 0.8);
  topPcb.castShadow = true;
  group.add(topPcb);

  // 2. Dual gold probe prongs (6 x 40 x 1.6 mm each with gap)
  const prongGeom = new THREE.BoxGeometry(5.5, 40, 1.6);
  const prongLeft = new THREE.Mesh(prongGeom, materials.metalGold);
  prongLeft.position.set(-5, -10, 0.8);
  prongLeft.castShadow = true;
  group.add(prongLeft);

  const prongRight = new THREE.Mesh(prongGeom, materials.metalGold);
  prongRight.position.set(5, -10, 0.8);
  prongRight.castShadow = true;
  group.add(prongRight);

  // 3. 3-pin connection header
  const headerGeom = new THREE.BoxGeometry(8, 2.5, 7);
  const header = new THREE.Mesh(headerGeom, materials.plasticBlack);
  header.position.set(0, 27, 1.6 + 3.5);
  group.add(header);

  return group;
}

/**
 * Builds DHT11 Temperature & Humidity Sensor (15.5 x 12 x 5.5 mm)
 */
export function buildDht11Mesh(materials: MaterialLibrary): THREE.Group {
  const group = new THREE.Group();
  group.name = 'dht11';

  // 1. Blue slotted housing
  const bodyGeom = new THREE.BoxGeometry(12, 15.5, 5.5);
  const body = new THREE.Mesh(bodyGeom, materials.dhtBlue);
  body.position.set(0, 0, 2.75);
  body.castShadow = true;
  group.add(body);

  // 2. Grill ventilation slots (inset darker lines)
  const grillGeom = new THREE.BoxGeometry(8, 1, 0.5);
  for (let i = -2; i <= 2; i++) {
    const slot = new THREE.Mesh(grillGeom, materials.plasticBlack);
    slot.position.set(0, i * 2.5, 5.6);
    group.add(slot);
  }

  // 3. 3-pin connection header leads
  const pinGeom = new THREE.CylinderGeometry(0.4, 0.4, 6, 12);
  for (let i = -1; i <= 1; i++) {
    const pin = new THREE.Mesh(pinGeom, materials.metalSilver);
    pin.position.set(i * 2.54, -10, 2.75);
    pin.rotation.x = Math.PI / 2;
    group.add(pin);
  }

  return group;
}

/**
 * Builds MQ-135 Gas / Air Quality Sensor (35 x 20 x 21 mm)
 */
export function buildMq135Mesh(materials: MaterialLibrary): THREE.Group {
  const group = new THREE.Group();
  group.name = 'mq135';

  // 1. Blue PCB base (35 x 20 x 1.6 mm)
  const pcbGeom = new THREE.BoxGeometry(35, 20, 1.6);
  const pcb = new THREE.Mesh(pcbGeom, materials.pcbBlue);
  pcb.position.set(0, 0, 0.8);
  pcb.castShadow = true;
  group.add(pcb);

  // 2. Silver mesh cylindrical sensor dome (d=16 mm, h=14 mm)
  const domeGeom = new THREE.CylinderGeometry(8, 8, 14, 24);
  const domeMat = new THREE.MeshStandardMaterial({
    color: 0xcfd8dc,
    metalness: 0.9,
    roughness: 0.35,
    wireframe: false,
  });
  const dome = new THREE.Mesh(domeGeom, domeMat);
  dome.rotation.x = Math.PI / 2;
  dome.position.set(-6, 0, 1.6 + 7);
  dome.castShadow = true;
  group.add(dome);

  // Inner heating element glow (neutral slate/zinc)
  const glowGeom = new THREE.CylinderGeometry(3, 3, 10, 16);
  const glowMat = new THREE.MeshStandardMaterial({
    color: 0x71717a,
    emissive: 0x52525b,
    emissiveIntensity: 0.2,
  });
  const glow = new THREE.Mesh(glowGeom, glowMat);
  glow.rotation.x = Math.PI / 2;
  glow.position.set(-6, 0, 1.6 + 7);
  group.add(glow);

  // 3. 4-pin header at edge
  const headerGeom = new THREE.BoxGeometry(2.5, 10.5, 8.5);
  const header = new THREE.Mesh(headerGeom, materials.plasticBlack);
  header.position.set(15, 0, 1.6 + 4.25);
  group.add(header);

  return group;
}

/**
 * Builds 18650 Battery Holder & Cell (75 x 21 x 18 mm)
 */
export function buildBattery18650Mesh(materials: MaterialLibrary): THREE.Group {
  const group = new THREE.Group();
  group.name = 'battery_18650';

  // 1. Black cradle housing (75 x 21 x 10 mm)
  const cradleGeom = new THREE.BoxGeometry(75, 21, 10);
  const cradle = new THREE.Mesh(cradleGeom, materials.plasticBlack);
  cradle.position.set(0, 0, 5);
  cradle.castShadow = true;
  group.add(cradle);

  // 2. 18650 Cylindrical Battery Cell (d=18mm, length=65mm) - Neutral grey #3a3a3a
  const cellGeom = new THREE.CylinderGeometry(9, 9, 65, 32);
  const wrapMat = new THREE.MeshStandardMaterial({
    color: 0x3a3a3a, // Neutral grey battery wrap
    roughness: 0.3,
    metalness: 0.1,
  });
  const cell = new THREE.Mesh(cellGeom, wrapMat);
  cell.rotation.z = Math.PI / 2;
  cell.position.set(0, 0, 10);
  cell.castShadow = true;
  group.add(cell);

  // Positive terminal cap (Silver d=6, h=2)
  const capGeom = new THREE.CylinderGeometry(3, 3, 2, 20);
  const cap = new THREE.Mesh(capGeom, materials.metalSilver);
  cap.rotation.z = Math.PI / 2;
  cap.position.set(33.5, 0, 10);
  group.add(cap);

  // Negative terminal contact spring
  const springGeom = new THREE.CylinderGeometry(5, 5, 3, 16);
  const spring = new THREE.Mesh(springGeom, materials.metalSilver);
  spring.rotation.z = Math.PI / 2;
  spring.position.set(-34, 0, 10);
  group.add(spring);

  return group;
}

/**
 * Builds Piezo Buzzer (12 x 12 x 9.5 mm)
 */
export function buildPiezoBuzzerMesh(materials: MaterialLibrary): THREE.Group {
  const group = new THREE.Group();
  group.name = 'piezo_buzzer';

  // 1. Black plastic cylindrical buzzer housing
  const bodyGeom = new THREE.CylinderGeometry(6, 6, 9.5, 32);
  const body = new THREE.Mesh(bodyGeom, materials.plasticBlack);
  body.position.set(0, 0, 4.75);
  body.castShadow = true;
  group.add(body);

  // 2. Sound hole at center of top
  const holeGeom = new THREE.CylinderGeometry(1.5, 1.5, 1, 16);
  const hole = new THREE.Mesh(holeGeom, materials.metalSilver);
  hole.position.set(0, 0, 9.6);
  group.add(hole);

  return group;
}

/**
 * Builds HC-SR04 Ultrasonic Sensor (45 x 20 x 15 mm)
 */
export function buildUltrasonicMesh(materials: MaterialLibrary): THREE.Group {
  const group = new THREE.Group();
  group.name = 'ultrasonic_hcsr04';

  // 1. Blue PCB base (45 x 20 x 1.6 mm)
  const pcbGeom = new THREE.BoxGeometry(45, 20, 1.6);
  const pcb = new THREE.Mesh(pcbGeom, materials.pcbBlue);
  pcb.position.set(0, 0, 0.8);
  pcb.castShadow = true;
  group.add(pcb);

  // 2. Two silver cylindrical acoustic transducers (T and R: d=16mm, h=12mm)
  const cylGeom = new THREE.CylinderGeometry(8, 8, 12, 24);
  const transMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.9,
    roughness: 0.25,
  });

  const cyl1 = new THREE.Mesh(cylGeom, transMat);
  cyl1.rotation.x = Math.PI / 2;
  cyl1.position.set(-13, 0, 1.6 + 6);
  cyl1.castShadow = true;
  group.add(cyl1);

  const cyl2 = new THREE.Mesh(cylGeom, transMat);
  cyl2.rotation.x = Math.PI / 2;
  cyl2.position.set(13, 0, 1.6 + 6);
  cyl2.castShadow = true;
  group.add(cyl2);

  // Mesh grilles inside cylinders
  const meshGeom = new THREE.CylinderGeometry(7, 7, 0.6, 24);
  const m1 = new THREE.Mesh(meshGeom, materials.plasticBlack);
  m1.rotation.x = Math.PI / 2;
  m1.position.set(-13, 0, 1.6 + 12.1);
  group.add(m1);

  const m2 = new THREE.Mesh(meshGeom, materials.plasticBlack);
  m2.rotation.x = Math.PI / 2;
  m2.position.set(13, 0, 1.6 + 12.1);
  group.add(m2);

  // 3. Crystal oscillator in center
  const crystalGeom = new THREE.CylinderGeometry(1.5, 1.5, 8, 16);
  const crystal = new THREE.Mesh(crystalGeom, materials.metalSilver);
  crystal.position.set(0, 0, 1.6 + 2);
  group.add(crystal);

  // 4. 4-pin connection header at bottom edge
  const headerGeom = new THREE.BoxGeometry(10.5, 2.5, 7);
  const header = new THREE.Mesh(headerGeom, materials.plasticBlack);
  header.position.set(0, -8, 1.6 + 3.5);
  group.add(header);

  return group;
}

/**
 * Builds a high-fidelity 3D model for HC-SR501 PIR Motion Sensor
 * Features: Green PCB base, white faceted Fresnel dome lens, dual adjustment potentiometers, 3-pin header.
 */
export function buildPirMotionSensorMesh(materials: MaterialLibrary): THREE.Group {
  const group = new THREE.Group();
  group.name = 'pir_motion_sensor';

  // 1. PCB (32 x 24 x 1.6 mm)
  const pcbGeom = new THREE.BoxGeometry(32, 24, 1.6);
  const pcb = new THREE.Mesh(pcbGeom, materials.pcbGreen);
  pcb.position.set(0, 0, 0.8);
  pcb.castShadow = true;
  pcb.receiveShadow = true;
  group.add(pcb);

  // 2. Pyroelectric sensor metal can underneath dome (dia 9.2mm, height 4mm)
  const canGeom = new THREE.CylinderGeometry(4.6, 4.6, 4.0, 20);
  const can = new THREE.Mesh(canGeom, materials.metalShield);
  can.rotation.x = Math.PI / 2;
  can.position.set(0, 0, 1.6 + 2.0);
  group.add(can);

  // 3. Faceted Fresnel Lens Dome (white translucent dome, 22mm dia x 10mm height)
  const domeGeom = new THREE.SphereGeometry(11, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2);
  const dome = new THREE.Mesh(domeGeom, materials.pirDome);
  dome.rotation.x = Math.PI / 2;
  dome.position.set(0, 0, 1.6 + 1.0);
  dome.castShadow = true;
  group.add(dome);

  // Stepped ring base of the Fresnel lens
  const ringGeom = new THREE.CylinderGeometry(11.4, 11.4, 2.5, 24);
  const ring = new THREE.Mesh(ringGeom, materials.plasticWhite);
  ring.rotation.x = Math.PI / 2;
  ring.position.set(0, 0, 1.6 + 1.25);
  group.add(ring);

  // 4. Dual Adjustment Potentiometers (Sensitivity & Delay) - Orange/Yellow trimpots
  for (let i = -1; i <= 1; i += 2) {
    const potBodyGeom = new THREE.BoxGeometry(4.8, 4.8, 4.0);
    const pot = new THREE.Mesh(potBodyGeom, materials.potOrange);
    pot.position.set(i * 10, -8, 1.6 + 2.0);
    pot.castShadow = true;
    group.add(pot);

    // Cross adjustment dial
    const dialGeom = new THREE.CylinderGeometry(1.5, 1.5, 0.6, 12);
    const dial = new THREE.Mesh(dialGeom, materials.plasticWhite);
    dial.rotation.x = Math.PI / 2;
    dial.position.set(i * 10, -8, 1.6 + 4.1);
    group.add(dial);
  }

  // 5. 3-pin connection header (VCC, OUT, GND)
  const headerGeom = new THREE.BoxGeometry(7.62, 2.54, 8.5);
  const header = new THREE.Mesh(headerGeom, materials.plasticBlack);
  header.position.set(0, 9.5, 1.6 + 4.25);
  header.castShadow = true;
  group.add(header);

  // 3 gold contact pins
  for (let i = -1; i <= 1; i++) {
    const pinGeom = new THREE.BoxGeometry(0.64, 0.64, 11);
    const pin = new THREE.Mesh(pinGeom, materials.metalGold);
    pin.position.set(i * 2.54, 9.5, 1.6 + 5.5);
    group.add(pin);
  }

  return group;
}

/**
 * Builds a high-fidelity 3D model for High-Power LED Lamp Module
 * Features: Dark breakout PCB, aluminum star heat sink, glowing warm emissive dome, 3-pin control header.
 */
export function buildLedLampModuleMesh(materials: MaterialLibrary): THREE.Group {
  const group = new THREE.Group();
  group.name = 'led_lamp_module';

  // 1. Base PCB (25 x 18 x 1.6 mm)
  const pcbGeom = new THREE.BoxGeometry(25, 18, 1.6);
  const pcb = new THREE.Mesh(pcbGeom, materials.pcbEsp32);
  pcb.position.set(0, 0, 0.8);
  pcb.castShadow = true;
  pcb.receiveShadow = true;
  group.add(pcb);

  // 2. Aluminum Star Heat Sink Plate
  const sinkGeom = new THREE.CylinderGeometry(7.2, 7.6, 1.4, 8);
  const sink = new THREE.Mesh(sinkGeom, materials.metalSilver);
  sink.rotation.x = Math.PI / 2;
  sink.position.set(-2, 0, 1.6 + 0.7);
  sink.castShadow = true;
  group.add(sink);

  // 3. Glowing LED Diffuser Dome (emissive warm amber/white glow)
  const ledDomeGeom = new THREE.SphereGeometry(5.2, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  const ledDome = new THREE.Mesh(ledDomeGeom, materials.ledLampGlow);
  ledDome.rotation.x = Math.PI / 2;
  ledDome.position.set(-2, 0, 1.6 + 1.4);
  ledDome.castShadow = true;
  group.add(ledDome);

  // Inner bright emissive point source element
  const coreGeom = new THREE.CylinderGeometry(1.6, 1.6, 0.8, 12);
  const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const core = new THREE.Mesh(coreGeom, coreMat);
  core.rotation.x = Math.PI / 2;
  core.position.set(-2, 0, 1.6 + 2.0);
  group.add(core);

  // 4. Current Limiting Resistor / S8050 NPN Transistor
  const transistorGeom = new THREE.BoxGeometry(4.2, 3.2, 2.5);
  const transistor = new THREE.Mesh(transistorGeom, materials.plasticBlack);
  transistor.position.set(7, 3, 1.6 + 1.25);
  group.add(transistor);

  // 5. 3-pin connection header (SIG, VCC, GND)
  const headerGeom = new THREE.BoxGeometry(2.54, 7.62, 8.5);
  const header = new THREE.Mesh(headerGeom, materials.plasticBlack);
  header.position.set(9.5, -2, 1.6 + 4.25);
  header.castShadow = true;
  group.add(header);

  for (let i = -1; i <= 1; i++) {
    const pinGeom = new THREE.BoxGeometry(0.64, 0.64, 11);
    const pin = new THREE.Mesh(pinGeom, materials.metalSilver);
    pin.position.set(9.5, -2 + i * 2.54, 1.6 + 5.5);
    group.add(pin);
  }

  return group;
}

/**
 * Builds a high-fidelity 3D model for LDR Light Sensor Module
 * Features: Dark blue PCB, CdS photoresistor cell with serpentine track, LM393 comparator chip, blue sensitivity trimpot, 4-pin header.
 */
export function buildLdrLightSensorMesh(materials: MaterialLibrary): THREE.Group {
  const group = new THREE.Group();
  group.name = 'ldr_light_sensor';

  // 1. Base PCB (32 x 14 x 1.6 mm)
  const pcbGeom = new THREE.BoxGeometry(32, 14, 1.6);
  const pcb = new THREE.Mesh(pcbGeom, materials.pcbBlue);
  pcb.position.set(0, 0, 0.8);
  pcb.castShadow = true;
  pcb.receiveShadow = true;
  group.add(pcb);

  // 2. LDR Sensor Head (CdS Photoresistor cell on front tip)
  // Two metal lead wires extending from PCB
  for (let i = -1; i <= 1; i += 2) {
    const wireGeom = new THREE.CylinderGeometry(0.4, 0.4, 5.0, 8);
    const wire = new THREE.Mesh(wireGeom, materials.metalSilver);
    wire.rotation.z = Math.PI / 2;
    wire.position.set(-14.5, i * 2.0, 1.6 + 2.5);
    group.add(wire);
  }

  // Ceramic photoresistor disc
  const discGeom = new THREE.CylinderGeometry(2.6, 2.6, 1.8, 16);
  const disc = new THREE.Mesh(discGeom, materials.ldrCeramic);
  disc.rotation.z = Math.PI / 2;
  disc.position.set(-17.5, 0, 1.6 + 2.5);
  disc.castShadow = true;
  group.add(disc);

  // Serpentine track accent face
  const trackFaceGeom = new THREE.CylinderGeometry(2.4, 2.4, 0.2, 16);
  const trackFace = new THREE.Mesh(trackFaceGeom, materials.ldrTrack);
  trackFace.rotation.z = Math.PI / 2;
  trackFace.position.set(-18.5, 0, 1.6 + 2.5);
  group.add(trackFace);

  // 3. LM393 Dual Comparator IC Chip
  const chipGeom = new THREE.BoxGeometry(6.5, 5.0, 2.0);
  const chip = new THREE.Mesh(chipGeom, materials.plasticBlack);
  chip.position.set(-4, 0, 1.6 + 1.0);
  chip.castShadow = true;
  group.add(chip);

  // 4. Blue Precision Potentiometer with brass screw (Sensitivity adjuster)
  const potGeom = new THREE.BoxGeometry(6.5, 6.5, 4.5);
  const potMat = materials.pcbBlue;
  const pot = new THREE.Mesh(potGeom, potMat);
  pot.position.set(4, 0, 1.6 + 2.25);
  pot.castShadow = true;
  group.add(pot);

  // Brass adjuster screw on top
  const screwGeom = new THREE.CylinderGeometry(1.2, 1.2, 0.8, 12);
  const screw = new THREE.Mesh(screwGeom, materials.metalGold);
  screw.position.set(4, 0, 1.6 + 4.6);
  group.add(screw);

  // 5. Dual SMD Status LEDs (Power green, DO trigger red)
  const pwrLed = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.0, 0.8), materials.ledGreen);
  pwrLed.position.set(-1, -4, 1.6 + 0.4);
  group.add(pwrLed);

  const outLed = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.0, 0.8), materials.ledRed);
  outLed.position.set(-1, 4, 1.6 + 0.4);
  group.add(outLed);

  // 6. 4-pin male connection header (VCC, GND, DO, AO) at back edge
  const headerGeom = new THREE.BoxGeometry(2.54, 10.16, 8.5);
  const header = new THREE.Mesh(headerGeom, materials.plasticBlack);
  header.position.set(13.5, 0, 1.6 + 4.25);
  header.castShadow = true;
  group.add(header);

  for (let i = 0; i < 4; i++) {
    const pinGeom = new THREE.BoxGeometry(0.64, 0.64, 11);
    const pin = new THREE.Mesh(pinGeom, materials.metalGold);
    pin.position.set(13.5, -3.81 + i * 2.54, 1.6 + 5.5);
    group.add(pin);
  }

  return group;
}

/**
 * Builds generic fallback module with clean aesthetic for any unrecognized part
 */
export function buildGenericModuleMesh(
  item: PartLayoutItem,
  materials: MaterialLibrary
): THREE.Group {
  const group = new THREE.Group();
  group.name = item.libId || 'generic_module';

  const w = item.dimensions?.width || 30;
  const l = item.dimensions?.length || 30;
  const h = item.dimensions?.height || 10;

  // PCB base
  const pcbGeom = new THREE.BoxGeometry(w, l, 1.6);
  const pcb = new THREE.Mesh(pcbGeom, materials.pcbBlue);
  pcb.position.set(0, 0, 0.8);
  pcb.castShadow = true;
  group.add(pcb);

  // Main IC chip
  const chipGeom = new THREE.BoxGeometry(Math.min(w * 0.6, 16), Math.min(l * 0.6, 16), Math.min(h * 0.4, 3));
  const chip = new THREE.Mesh(chipGeom, materials.plasticBlack);
  chip.position.set(0, 0, 1.6 + Math.min(h * 0.4, 3) / 2);
  chip.castShadow = true;
  group.add(chip);

  // Pin header
  const headerGeom = new THREE.BoxGeometry(Math.min(w * 0.8, 20), 2.5, Math.min(h * 0.6, 8));
  const header = new THREE.Mesh(headerGeom, materials.plasticBlack);
  header.position.set(0, -l / 2 + 2.5, 1.6 + Math.min(h * 0.6, 8) / 2);
  group.add(header);

  // Status LED
  const led = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 1), materials.ledGreen);
  led.position.set(w / 3, l / 3, 1.6 + 0.5);
  group.add(led);

  return group;
}

/**
 * Factory dispatch function to build the appropriate 3D mesh based on libId
 */
export function createPartMesh(
  item: PartLayoutItem,
  materials: MaterialLibrary,
  enclosureDims?: [number, number, number],
  wallMm = 2.0
): THREE.Group {
  if (!item) {
    return new THREE.Group();
  }
  const libId = (item.libId || '').toLowerCase().trim();

  let meshGroup: THREE.Group;

  if (libId.includes('uno') || libId.includes('arduino')) {
    meshGroup = buildArduinoUnoMesh(materials);
  } else if (libId.includes('esp32') || libId.includes('nodemcu')) {
    meshGroup = buildEsp32Mesh(materials);
  } else if (libId.includes('sg90') || libId.includes('servo')) {
    meshGroup = buildSg90ServoMesh(materials);
  } else if (libId.includes('relay')) {
    meshGroup = buildRelayMesh(materials);
  } else if (libId.includes('oled') || libId.includes('display') || libId.includes('screen')) {
    meshGroup = buildOledMesh(materials);
  } else if (libId.includes('soil') || libId.includes('moisture')) {
    meshGroup = buildSoilMoistureMesh(materials);
  } else if (libId.includes('dht11') || libId.includes('temp') || libId.includes('humidity')) {
    meshGroup = buildDht11Mesh(materials);
  } else if (libId.includes('mq135') || libId.includes('gas') || libId.includes('air')) {
    meshGroup = buildMq135Mesh(materials);
  } else if (libId.includes('18650') || libId.includes('battery')) {
    meshGroup = buildBattery18650Mesh(materials);
  } else if (libId.includes('buzzer') || libId.includes('piezo')) {
    meshGroup = buildPiezoBuzzerMesh(materials);
  } else if (libId.includes('ultrasonic') || libId.includes('hcsr04') || libId.includes('distance')) {
    meshGroup = buildUltrasonicMesh(materials);
  } else if (libId.includes('pir') || libId.includes('motion')) {
    meshGroup = buildPirMotionSensorMesh(materials);
  } else if (libId.includes('lamp') || libId.includes('led_lamp') || libId.includes('bulb') || libId.includes('led_module')) {
    meshGroup = buildLedLampModuleMesh(materials);
  } else if (libId.includes('ldr') || libId.includes('light_sensor') || libId.includes('photoresistor')) {
    meshGroup = buildLdrLightSensorMesh(materials);
  } else {
    meshGroup = buildGenericModuleMesh(item, materials);
  }

  // Calculate position in scene coordinates
  const dims = getPartDimensions(item.libId);
  let posX = Number(item.x) || 0;
  let posY = Number(item.y) || 0;
  let posZ = item.z !== undefined ? Number(item.z) : wallMm;

  if (enclosureDims && Array.isArray(enclosureDims) && enclosureDims.length >= 2) {
    const [w, d] = enclosureDims;
    // If coordinates are inside the [0, w] and [0, d] box (corner-based layout)
    if (posX >= 0 && posY >= 0) {
      posX = -w / 2 + wallMm + posX + (dims.width || 30) / 2;
      posY = -d / 2 + wallMm + posY + (dims.length || 30) / 2;
    }
  }

  meshGroup.position.set(posX, posY, posZ);

  // Rotation handling (degrees to radians)
  if (item.rotZ) {
    meshGroup.rotation.z = (item.rotZ * Math.PI) / 180;
  }
  if (item.rotX) {
    meshGroup.rotation.x = (item.rotX * Math.PI) / 180;
  }
  if (item.rotY) {
    meshGroup.rotation.y = (item.rotY * Math.PI) / 180;
  }

  // Store metadata on userData for raycasting and inspection
  meshGroup.userData = {
    partId: item.id || item.libId,
    libId: item.libId,
    name: item.name || item.libId,
    dimensions: dims,
    assembledPos: meshGroup.position.clone(),
    assembledRot: meshGroup.rotation.clone(),
  };

  return meshGroup;
}
