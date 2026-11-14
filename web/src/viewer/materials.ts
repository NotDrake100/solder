import * as THREE from 'three';
import { MaterialTheme } from './types';

// Cache for generated materials and textures
const textureCache = new Map<string, THREE.CanvasTexture>();

/**
 * Creates dynamic glowing canvas texture for OLED display
 */
export function createOledScreenTexture(title = 'SOLDER v1.0', status = 'SYS READY', metric = '24.5°C 62%'): THREE.CanvasTexture {
  const cacheKey = `${title}_${status}_${metric}`;
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Deep black OLED background
    ctx.fillStyle = '#05070a';
    ctx.fillRect(0, 0, 256, 128);

    // Subtle pixel grid / screen boundary
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2;
    ctx.strokeRect(4, 4, 248, 120);

    // Header bar (Yellow/Amber top band like SSD1306 dual color OLED)
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 16px monospace';
    ctx.fillText(`⚡ ${title}`, 12, 24);

    // Battery / signal icon
    ctx.fillStyle = '#facc15';
    ctx.fillRect(220, 12, 20, 10);
    ctx.fillRect(240, 15, 3, 4);

    // Cyan glowing main body
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 20px monospace';
    ctx.fillText(status, 12, 60);

    ctx.font = '15px monospace';
    ctx.fillStyle = '#7dd3fc';
    ctx.fillText(`> ${metric}`, 12, 85);

    // Live wave / heartbeat bar
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(12, 110);
    for (let x = 12; x < 240; x += 8) {
      const y = 110 + Math.sin((x + 10) * 0.1) * 6;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.NearestFilter;
  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * Creates dynamic silkscreen texture for IC chips
 */
export function createChipSilkscreenTexture(label: string): THREE.CanvasTexture {
  if (textureCache.has(`chip_${label}`)) {
    return textureCache.get(`chip_${label}`)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(0, 0, 128, 64);

    // Pin 1 dot
    ctx.fillStyle = '#78716c';
    ctx.beginPath();
    ctx.arc(12, 12, 4, 0, Math.PI * 2);
    ctx.fill();

    // Silkscreen text
    ctx.fillStyle = '#e7e5e4';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(label, 64, 34);

    ctx.fillStyle = '#a8a29e';
    ctx.font = '9px monospace';
    ctx.fillText('MADE IN BLR', 64, 48);
  }

  const texture = new THREE.CanvasTexture(canvas);
  textureCache.set(`chip_${label}`, texture);
  return texture;
}

export interface MaterialLibrary {
  enclosure: THREE.Material;
  enclosureLid: THREE.Material;
  enclosureWireframe: THREE.Material;
  pcbUno: THREE.MeshStandardMaterial;
  pcbEsp32: THREE.MeshStandardMaterial;
  pcbBlue: THREE.MeshStandardMaterial;
  pcbGreen: THREE.MeshStandardMaterial;
  metalGold: THREE.MeshStandardMaterial;
  metalSilver: THREE.MeshStandardMaterial;
  metalShield: THREE.MeshStandardMaterial;
  plasticBlack: THREE.MeshStandardMaterial;
  plasticWhite: THREE.MeshStandardMaterial;
  relayBlue: THREE.MeshStandardMaterial;
  relayTerminal: THREE.MeshStandardMaterial;
  servoBlueTranslucent: THREE.MeshPhysicalMaterial;
  dhtBlue: THREE.MeshStandardMaterial;
  ledRed: THREE.MeshStandardMaterial;
  ledGreen: THREE.MeshStandardMaterial;
  oledBezel: THREE.MeshStandardMaterial;
  oledScreen: THREE.MeshStandardMaterial;
  wireMaterials: Record<string, THREE.MeshStandardMaterial>;
}

export function createMaterialLibrary(
  theme: MaterialTheme = 'pla',
  customColor = '#2563eb',
  wireframe = false
): MaterialLibrary {
  // Base case material based on theme
  let enclosure: THREE.Material;
  let enclosureLid: THREE.Material;

  const hexColor = parseInt(customColor.replace('#', '0x'), 16) || 0x2563eb;

  switch (theme) {
    case 'acrylic':
      enclosure = new THREE.MeshPhysicalMaterial({
        color: 0xf1f5f9,
        transmission: 0.88,
        opacity: 0.95,
        transparent: true,
        roughness: 0.18,
        ior: 1.49,
        thickness: 2.2,
        specularIntensity: 1.0,
        wireframe,
      });
      enclosureLid = new THREE.MeshPhysicalMaterial({
        color: 0xe2e8f0,
        transmission: 0.92,
        opacity: 0.9,
        transparent: true,
        roughness: 0.12,
        ior: 1.49,
        thickness: 2.0,
        specularIntensity: 1.2,
        wireframe,
      });
      break;

    case 'dark':
      enclosure = new THREE.MeshStandardMaterial({
        color: 0x18181b,
        roughness: 0.7,
        metalness: 0.2,
        wireframe,
      });
      enclosureLid = new THREE.MeshStandardMaterial({
        color: 0x27272a,
        roughness: 0.65,
        metalness: 0.25,
        wireframe,
      });
      break;

    case 'resin':
      enclosure = new THREE.MeshPhysicalMaterial({
        color: hexColor,
        transmission: 0.78,
        opacity: 0.92,
        transparent: true,
        roughness: 0.12,
        ior: 1.54,
        thickness: 2.5,
        wireframe,
      });
      enclosureLid = new THREE.MeshPhysicalMaterial({
        color: hexColor,
        transmission: 0.82,
        opacity: 0.95,
        transparent: true,
        roughness: 0.15,
        ior: 1.54,
        thickness: 2.0,
        wireframe,
      });
      break;

    case 'pla':
    default:
      // High quality matte 3D printed PLA
      enclosure = new THREE.MeshStandardMaterial({
        color: hexColor,
        roughness: 0.82,
        metalness: 0.05,
        wireframe,
      });
      enclosureLid = new THREE.MeshStandardMaterial({
        color: hexColor,
        roughness: 0.8,
        metalness: 0.05,
        wireframe,
      });
      break;
  }

  const enclosureWireframe = new THREE.MeshBasicMaterial({
    color: 0x00f0ff,
    wireframe: true,
    transparent: true,
    opacity: 0.35,
  });

  // Electronics materials
  const pcbUno = new THREE.MeshStandardMaterial({
    color: 0x00828a, // Arduino signature teal
    roughness: 0.45,
    metalness: 0.15,
  });

  const pcbEsp32 = new THREE.MeshStandardMaterial({
    color: 0x1e1e24, // ESP32 matte black PCB
    roughness: 0.5,
    metalness: 0.1,
  });

  const pcbBlue = new THREE.MeshStandardMaterial({
    color: 0x1d4ed8,
    roughness: 0.4,
    metalness: 0.1,
  });

  const pcbGreen = new THREE.MeshStandardMaterial({
    color: 0x15803d,
    roughness: 0.45,
    metalness: 0.1,
  });

  const metalGold = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    roughness: 0.25,
    metalness: 0.92,
  });

  const metalSilver = new THREE.MeshStandardMaterial({
    color: 0xd1d5db,
    roughness: 0.28,
    metalness: 0.88,
  });

  const metalShield = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.32,
    metalness: 0.95,
  });

  const plasticBlack = new THREE.MeshStandardMaterial({
    color: 0x1f2937,
    roughness: 0.72,
    metalness: 0.08,
  });

  const plasticWhite = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.65,
    metalness: 0.05,
  });

  const relayBlue = new THREE.MeshStandardMaterial({
    color: 0x2563eb,
    roughness: 0.35,
    metalness: 0.1,
  });

  const relayTerminal = new THREE.MeshStandardMaterial({
    color: 0x16a34a,
    roughness: 0.5,
    metalness: 0.15,
  });

  const servoBlueTranslucent = new THREE.MeshPhysicalMaterial({
    color: 0x2563eb,
    transmission: 0.45,
    opacity: 0.88,
    transparent: true,
    roughness: 0.25,
    ior: 1.45,
    thickness: 1.5,
  });

  const dhtBlue = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    roughness: 0.6,
    metalness: 0.05,
  });

  const ledRed = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xdc2626,
    emissiveIntensity: 0.6,
    roughness: 0.2,
  });

  const ledGreen = new THREE.MeshStandardMaterial({
    color: 0x22c55e,
    emissive: 0x16a34a,
    emissiveIntensity: 0.6,
    roughness: 0.2,
  });

  const oledBezel = new THREE.MeshStandardMaterial({
    color: 0x09090b,
    roughness: 0.3,
    metalness: 0.4,
  });

  const oledTexture = createOledScreenTexture();
  const oledScreen = new THREE.MeshStandardMaterial({
    map: oledTexture,
    emissive: 0x38bdf8,
    emissiveMap: oledTexture,
    emissiveIntensity: 0.85,
    roughness: 0.1,
    metalness: 0.1,
  });

  // Wire insulation materials
  const wireColors: Record<string, number> = {
    red: 0xef4444,
    black: 0x18181b,
    yellow: 0xeab308,
    blue: 0x3b82f6,
    green: 0x22c55e,
    purple: 0xa855f7,
    orange: 0xf97316,
    white: 0xf8fafc,
  };

  const wireMaterials: Record<string, THREE.MeshStandardMaterial> = {};
  for (const [key, val] of Object.entries(wireColors)) {
    wireMaterials[key] = new THREE.MeshStandardMaterial({
      color: val,
      roughness: 0.4,
      metalness: 0.05,
    });
  }

  return {
    enclosure,
    enclosureLid,
    enclosureWireframe,
    pcbUno,
    pcbEsp32,
    pcbBlue,
    pcbGreen,
    metalGold,
    metalSilver,
    metalShield,
    plasticBlack,
    plasticWhite,
    relayBlue,
    relayTerminal,
    servoBlueTranslucent,
    dhtBlue,
    ledRed,
    ledGreen,
    oledBezel,
    oledScreen,
    wireMaterials,
  };
}
