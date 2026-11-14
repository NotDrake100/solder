import * as THREE from 'three';

/**
 * Aesthetic studio materials for Solder 3D Case Viewer.
 * Designed around the b4/b6 clean white aesthetic:
 * Soft frosted enclosures, crisp PCB accents, metallic pins, and emissive screen details.
 */

// Shared reusable materials cache
export class MaterialPalette {
  // Enclosure: Translucent frosted case
  static createCaseMaterial(color: string = '#f1f5f9', opacity: number = 0.42): THREE.Material {
    return new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(color),
      roughness: 0.2,
      metalness: 0.05,
      transmission: 0.6,
      transparent: true,
      opacity: opacity,
      depthWrite: false,
      side: THREE.DoubleSide,
      clearcoat: 0.3,
      clearcoatRoughness: 0.1,
    });
  }

  // Enclosure: Frosted Lid
  static createLidMaterial(color: string = '#f8fafc', opacity: number = 0.48): THREE.Material {
    return new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(color),
      roughness: 0.25,
      metalness: 0.05,
      transmission: 0.55,
      transparent: true,
      opacity: opacity,
      depthWrite: false,
      side: THREE.DoubleSide,
      clearcoat: 0.4,
      clearcoatRoughness: 0.15,
    });
  }

  // Enclosure solid / snap clips accent
  static get CaseSolid(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.3,
      metalness: 0.08,
    });
  }

  // Subtle clean edge line material
  static get EdgeOutline(): THREE.LineBasicMaterial {
    return new THREE.LineBasicMaterial({
      color: 0x94a3b8,
      transparent: true,
      opacity: 0.35,
      linewidth: 1,
    });
  }

  // PCB Board Materials
  static get PcbUnoTeal(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0x00878a,
      roughness: 0.4,
      metalness: 0.1,
    });
  }

  static get PcbDark(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.5,
      metalness: 0.15,
    });
  }

  static get PcbBlue(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0x1d4ed8,
      roughness: 0.4,
      metalness: 0.1,
    });
  }

  static get PcbGreen(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0x15803d,
      roughness: 0.4,
      metalness: 0.1,
    });
  }

  // IC Chip matte package
  static get IcPackage(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0x09090b,
      roughness: 0.75,
      metalness: 0.2,
    });
  }

  // Header socket plastic (black)
  static get HeaderSocket(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.6,
      metalness: 0.1,
    });
  }

  // Metallic pins / USB shell / can
  static get MetalSilver(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0xd1d5db,
      metalness: 0.88,
      roughness: 0.18,
    });
  }

  // Brass / Gold pins
  static get MetalGold(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0xeab308,
      metalness: 0.82,
      roughness: 0.25,
    });
  }

  // OLED Display dark glass
  static get DisplayGlass(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0x030712,
      roughness: 0.1,
      metalness: 0.3,
    });
  }

  // OLED Active Display emissive screen
  static createOledScreenMaterial(): THREE.MeshStandardMaterial {
    // Canvas texture for screen graphics
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#050b14';
      ctx.fillRect(0, 0, 256, 128);

      // Cyan header text
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 18px monospace';
      ctx.fillText('SOLDER // LIVE', 14, 26);

      // Dividing line
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(14, 34);
      ctx.lineTo(242, 34);
      ctx.stroke();

      // Telemetry telemetry readout
      ctx.fillStyle = '#7dd3fc';
      ctx.font = '14px monospace';
      ctx.fillText('SYS: OK   MOIST: 64%', 14, 60);
      ctx.fillText('VALVE: AUTO [IDLE]', 14, 82);

      // Mini wave graph
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(14, 110);
      for (let x = 14; x < 242; x += 10) {
        const y = 110 - Math.sin((x - 14) * 0.1) * 8 - (x % 20 === 0 ? 4 : 0);
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;

    return new THREE.MeshStandardMaterial({
      map: texture,
      emissive: new THREE.Color(0x38bdf8),
      emissiveIntensity: 0.5,
      roughness: 0.2,
      metalness: 0.1,
    });
  }

  // Relay Box Blue
  static get RelayBox(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0x2563eb,
      roughness: 0.35,
      metalness: 0.05,
    });
  }

  // Terminal Block Green
  static get TerminalBlock(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0x16a34a,
      roughness: 0.5,
      metalness: 0.1,
    });
  }

  // Servo Translucent Blue Body
  static get ServoBody(): THREE.MeshPhysicalMaterial {
    return new THREE.MeshPhysicalMaterial({
      color: 0x0284c7,
      roughness: 0.3,
      metalness: 0.1,
      transmission: 0.45,
      transparent: true,
      opacity: 0.85,
    });
  }

  // Servo White Horn
  static get PlasticWhite(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.35,
      metalness: 0.05,
    });
  }

  // Sensor Casing White / Gray (DHT22)
  static get SensorGrille(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.4,
      metalness: 0.05,
    });
  }

  // Pump / Motor Cylinder (Black / Metallic)
  static get MotorBody(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0x27272a,
      roughness: 0.4,
      metalness: 0.4,
    });
  }

  // Highlight outline for selected or hovered part
  static get HighlightSelected(): THREE.MeshBasicMaterial {
    return new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.9,
    });
  }

  static get HighlightHover(): THREE.MeshBasicMaterial {
    return new THREE.MeshBasicMaterial({
      color: 0x60a5fa,
      wireframe: true,
      transparent: true,
      opacity: 0.5,
    });
  }
}
