import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { promisify } from 'util';
import { getPart } from '../../parts-lib';
import { LayoutItem } from './fitcheck';

const execAsync = promisify(exec);

export interface EnclosureSpec {
  innerDimensions?: { width: number; length: number; height: number };
  outerDimensions?: { width: number; length: number; height: number };
  outerMm?: [number, number, number];
  wallThickness?: number; // default 2.0 mm
  wallMm?: number;
  clearance?: number; // default 2.0 mm
  lidType?: 'snap' | 'screw' | 'sliding';
  cornerRadius?: number; // default 3.0 mm
  mountingPosts?: Array<{ x: number; y: number; height: number; outerDiam?: number; innerDiam?: number }>;
  cutouts?: Array<{
    type: 'usb' | 'barrel' | 'vent' | 'cable' | 'rect' | 'circle';
    x: number;
    y: number;
    z: number;
    width?: number;
    height?: number;
    depth?: number;
    diameter?: number;
    face?: 'left' | 'right' | 'front' | 'back' | 'top' | 'bottom';
  }>;
}

export function generateOpenScad(spec: EnclosureSpec, layout: LayoutItem[] = []): string {
  const wall = spec.wallMm ?? spec.wallThickness ?? 2.0;
  const clearance = spec.clearance ?? 2.0;
  const radius = spec.cornerRadius ?? 3.0;
  const lidType = spec.lidType ?? 'screw';

  let innerW: number;
  let innerL: number;
  let innerH: number;

  if (spec.innerDimensions) {
    innerW = spec.innerDimensions.width;
    innerL = spec.innerDimensions.length;
    innerH = spec.innerDimensions.height;
  } else if (spec.outerMm) {
    innerW = spec.outerMm[0] - 2 * wall;
    innerL = spec.outerMm[1] - 2 * wall;
    innerH = spec.outerMm[2] - 2 * wall;
  } else if (spec.outerDimensions) {
    innerW = spec.outerDimensions.width - 2 * wall;
    innerL = spec.outerDimensions.length - 2 * wall;
    innerH = spec.outerDimensions.height - 2 * wall;
  } else {
    // Calculate required inner dimensions from layout
    let maxX = 50;
    let maxY = 50;
    let maxZ = 25;
    for (const item of layout) {
      const part = getPart(item.libId);
      const w = part?.dimensions.width || 30;
      const l = part?.dimensions.length || 30;
      const h = part?.dimensions.height || 15;
      if (item.x + w > maxX) maxX = item.x + w;
      if (item.y + l > maxY) maxY = item.y + l;
      if (item.z + h > maxZ) maxZ = item.z + h;
    }
    innerW = Math.ceil(maxX + clearance);
    innerL = Math.ceil(maxY + clearance);
    innerH = Math.ceil(maxZ + clearance);
  }

  const outerW = innerW + 2 * wall;
  const outerL = innerL + 2 * wall;
  const outerH = innerH + 2 * wall;
  const lidThickness = wall;

  // Standoff posts based on layout items (e.g. Arduino Uno mounting holes)
  const standoffs: string[] = [];
  layout.forEach((item, idx) => {
    const part = getPart(item.libId);
    if (part?.dimensions.mountingHoles) {
      part.dimensions.mountingHoles.forEach((hole, hIdx) => {
        const posX = wall + item.x + hole.x;
        const posY = wall + item.y + hole.y;
        standoffs.push(`  // Standoff for ${part.name} (hole ${hIdx + 1})
  translate([${posX.toFixed(1)}, ${posY.toFixed(1)}, ${wall.toFixed(1)}]) {
    difference() {
      cylinder(r=3.0, h=4.0, $fn=24);
      translate([0, 0, -0.1]) cylinder(r=${(hole.diameter / 2).toFixed(1)}, h=4.2, $fn=24);
    }
  }`);
      });
    }
  });

  return `// Solder Enclosure OpenSCAD Model
// Wall thickness: ${wall.toFixed(1)}mm | Clearance: ${clearance.toFixed(1)}mm
// Outer dimensions: [${outerW.toFixed(1)}, ${outerL.toFixed(1)}, ${outerH.toFixed(1)}] mm
// Inner dimensions: [${innerW.toFixed(1)}, ${innerL.toFixed(1)}, ${innerH.toFixed(1)}] mm

$fn = 32;

wall = ${wall.toFixed(1)};
clearance = ${clearance.toFixed(1)};
outer_w = ${outerW.toFixed(1)};
outer_l = ${outerL.toFixed(1)};
outer_h = ${outerH.toFixed(1)};
inner_w = ${innerW.toFixed(1)};
inner_l = ${innerL.toFixed(1)};
inner_h = ${innerH.toFixed(1)};
radius = ${radius.toFixed(1)};
lid_t = ${lidThickness.toFixed(1)};

// Rounded box module
module rounded_box(w, l, h, r) {
  hull() {
    translate([r, r, 0]) cylinder(r=r, h=h);
    translate([w - r, r, 0]) cylinder(r=r, h=h);
    translate([r, l - r, 0]) cylinder(r=r, h=h);
    translate([w - r, l - r, 0]) cylinder(r=r, h=h);
  }
}

// Main enclosure base body
module enclosure_base() {
  difference() {
    // Outer shell
    rounded_box(outer_w, outer_l, outer_h - lid_t, radius);
    
    // Inner cavity
    translate([wall, wall, wall]) {
      rounded_box(inner_w, inner_l, outer_h, radius > 1 ? radius - 1 : 0.5);
    }
    
    // Port cutouts
    // Left side USB-B / Type-C cutout
    translate([-1, wall + 8, wall + 2]) {
      cube([wall + 2, 12, 11]);
    }
    // DC Barrel jack cutout
    translate([-1, wall + 38, wall + 2]) {
      rotate([0, 90, 0]) cylinder(r=4.5, h=wall + 2);
    }
    // Ventilation / cable pass-through slots
    translate([outer_w - wall - 1, wall + 10, wall + 5]) {
      cube([wall + 2, 20, 6]);
    }
    // Corner screw holes
    translate([wall + 2, wall + 2, -1]) cylinder(r=1.5, h=wall + 2);
    translate([outer_w - wall - 2, wall + 2, -1]) cylinder(r=1.5, h=wall + 2);
    translate([wall + 2, outer_l - wall - 2, -1]) cylinder(r=1.5, h=wall + 2);
    translate([outer_w - wall - 2, outer_l - wall - 2, -1]) cylinder(r=1.5, h=wall + 2);
  }

  // Component Mounting Standoffs
${standoffs.length > 0 ? standoffs.join('\n') : `  // Default corner screw pillars
  for (pos = [[wall+2, wall+2], [outer_w-wall-2, wall+2], [wall+2, outer_l-wall-2], [outer_w-wall-2, outer_l-wall-2]]) {
    translate([pos[0], pos[1], wall]) {
      difference() {
        cylinder(r=3.2, h=inner_h - 2, $fn=24);
        cylinder(r=1.4, h=inner_h, $fn=24);
      }
    }
  }`}
}

// Matching Enclosure Lid
module enclosure_lid() {
  union() {
    // Top plate
    rounded_box(outer_w, outer_l, lid_t, radius);
    
    // Inner lip for secure ${lidType} fit
    translate([wall + 0.3, wall + 0.3, lid_t]) {
      difference() {
        rounded_box(inner_w - 0.6, inner_l - 0.6, 2.0, radius > 1 ? radius - 1 : 0.5);
        translate([wall, wall, -0.1]) {
          rounded_box(inner_w - 2*wall - 0.6, inner_l - 2*wall - 0.6, 2.2, radius > 1 ? radius - 1 : 0.5);
        }
      }
    }
  }
}

// Render mode: set exploded=true for presentation
exploded = false;

if (exploded) {
  enclosure_base();
  translate([0, 0, outer_h + 20]) enclosure_lid();
} else {
  enclosure_base();
  // translate([0, 0, outer_h - lid_t]) enclosure_lid();
}
`;
}

// Fast pure-JS procedural STL generator (ASCII STL) for instant fallback
export function generateProceduralStl(w: number, l: number, h: number, wall: number = 2.0): string {
  // Generates an open-box enclosure in standard ASCII STL
  // Outer dimensions: w, l, h. Inner cavity: (w-2*wall), (l-2*wall), (h-wall)
  const iw = Math.max(1, w - 2 * wall);
  const il = Math.max(1, l - 2 * wall);
  const ih = Math.max(1, h - wall);

  const facets: Array<{ normal: [number, number, number]; v: [[number, number, number], [number, number, number], [number, number, number]] }> = [];

  function addQuad(
    p1: [number, number, number],
    p2: [number, number, number],
    p3: [number, number, number],
    p4: [number, number, number],
    normal: [number, number, number]
  ) {
    facets.push({ normal, v: [p1, p2, p3] });
    facets.push({ normal, v: [p1, p3, p4] });
  }

  // Outer Box bottom (Z = 0)
  addQuad([0, 0, 0], [w, 0, 0], [w, l, 0], [0, l, 0], [0, 0, -1]);

  // Outer Box Left (-X: x=0)
  addQuad([0, 0, 0], [0, l, 0], [0, l, h], [0, 0, h], [-1, 0, 0]);

  // Outer Box Right (+X: x=w)
  addQuad([w, 0, 0], [w, 0, h], [w, l, h], [w, l, 0], [1, 0, 0]);

  // Outer Box Front (-Y: y=0)
  addQuad([0, 0, 0], [0, 0, h], [w, 0, h], [w, 0, 0], [0, -1, 0]);

  // Outer Box Back (+Y: y=l)
  addQuad([0, l, 0], [w, l, 0], [w, l, h], [0, l, h], [0, 1, 0]);

  // Inner cavity bottom (Z = wall)
  addQuad([wall, wall, wall], [wall, wall + il, wall], [wall + iw, wall + il, wall], [wall + iw, wall, wall], [0, 0, 1]);

  // Inner Left wall (x = wall)
  addQuad([wall, wall, wall], [wall, wall, h], [wall, wall + il, h], [wall, wall + il, wall], [1, 0, 0]);

  // Inner Right wall (x = wall + iw)
  addQuad([wall + iw, wall, wall], [wall + iw, wall + il, wall], [wall + iw, wall + il, h], [wall + iw, wall, h], [-1, 0, 0]);

  // Inner Front wall (y = wall)
  addQuad([wall, wall, wall], [wall + iw, wall, wall], [wall + iw, wall, h], [wall, wall, h], [0, 1, 0]);

  // Inner Back wall (y = wall + il)
  addQuad([wall, wall + il, wall], [wall, wall + il, h], [wall + iw, wall + il, h], [wall + iw, wall + il, wall], [0, -1, 0]);

  // Top lip rim (4 strips between outer rim and inner rim at Z = h)
  // Left rim
  addQuad([0, 0, h], [0, l, h], [wall, l, h], [wall, 0, h], [0, 0, 1]);
  // Right rim
  addQuad([w - wall, 0, h], [w - wall, l, h], [w, l, h], [w, 0, h], [0, 0, 1]);
  // Front rim
  addQuad([wall, 0, h], [wall, wall, h], [w - wall, wall, h], [w - wall, 0, h], [0, 0, 1]);
  // Back rim
  addQuad([wall, l - wall, h], [wall, l, h], [w - wall, l, h], [w - wall, l - wall, h], [0, 0, 1]);

  let stl = `solid SolderEnclosure\n`;
  for (const f of facets) {
    stl += `  facet normal ${f.normal[0]} ${f.normal[1]} ${f.normal[2]}\n`;
    stl += `    outer loop\n`;
    for (const v of f.v) {
      stl += `      vertex ${v[0].toFixed(3)} ${v[1].toFixed(3)} ${v[2].toFixed(3)}\n`;
    }
    stl += `    endloop\n`;
    stl += `  endfacet\n`;
  }
  stl += `endsolid SolderEnclosure\n`;

  return stl;
}

export async function compileScadToStl(
  scadCode: string,
  outputPath?: string
): Promise<{ success: boolean; stlPath?: string; stlString?: string; stlBuffer?: Buffer; stdout: string; error?: string }> {
  // Check if openscad binary is available
  let openscadAvailable = false;
  try {
    await execAsync('which openscad');
    openscadAvailable = true;
  } catch {
    openscadAvailable = false;
  }

  const tmpDir = os.tmpdir();
  const id = `solder_case_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const scadFile = path.join(tmpDir, `${id}.scad`);
  const targetStl = outputPath || path.join(tmpDir, `${id}.stl`);

  fs.writeFileSync(scadFile, scadCode, 'utf8');

  if (openscadAvailable) {
    try {
      const { stdout } = await execAsync(`openscad -o "${targetStl}" "${scadFile}"`);
      const buffer = fs.readFileSync(targetStl);
      return {
        success: true,
        stlPath: targetStl,
        stlBuffer: buffer,
        stlString: buffer.toString('utf8'),
        stdout: stdout || 'OpenSCAD compilation successful'
      };
    } catch (err: any) {
      console.warn('OpenSCAD execution failed, using procedural fallback:', err.message);
    }
  }

  // Fallback: extract dimensions from scadCode or use defaults
  const outerWMatch = scadCode.match(/outer_w\s*=\s*([0-9.]+)/);
  const outerLMatch = scadCode.match(/outer_l\s*=\s*([0-9.]+)/);
  const outerHMatch = scadCode.match(/outer_h\s*=\s*([0-9.]+)/);
  const wallMatch = scadCode.match(/wall\s*=\s*([0-9.]+)/);

  const w = outerWMatch ? parseFloat(outerWMatch[1]) : 85;
  const l = outerLMatch ? parseFloat(outerLMatch[1]) : 75;
  const h = outerHMatch ? parseFloat(outerHMatch[1]) : 30;
  const wall = wallMatch ? parseFloat(wallMatch[1]) : 2.0;

  const stlString = generateProceduralStl(w, l, h, wall);
  fs.writeFileSync(targetStl, stlString, 'utf8');
  const buffer = Buffer.from(stlString, 'utf8');

  return {
    success: true,
    stlPath: targetStl,
    stlString,
    stlBuffer: buffer,
    stdout: `Generated procedural STL model (${w}x${l}x${h}mm, wall ${wall}mm)`
  };
}
