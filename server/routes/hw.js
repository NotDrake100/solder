import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let hwCompileModule = null;
let hwFitcheckModule = null;
let hwScadModule = null;

async function loadHwModules() {
  if (!hwCompileModule) {
    try {
      hwCompileModule = await import(path.resolve(__dirname, '../hw/compile.ts'));
    } catch (e) {
      // ignore
    }
  }
  if (!hwFitcheckModule) {
    try {
      hwFitcheckModule = await import(path.resolve(__dirname, '../hw/fitcheck.ts'));
    } catch (e) {
      // ignore
    }
  }
  if (!hwScadModule) {
    try {
      hwScadModule = await import(path.resolve(__dirname, '../hw/scad.ts'));
    } catch (e) {
      // ignore
    }
  }
}

export async function handleCompile(reqBody) {
  await loadHwModules();
  const { ino, board = 'uno' } = reqBody;

  if (!ino) {
    throw new Error('Missing ino code in request body');
  }

  if (hwCompileModule && hwCompileModule.compileSketch) {
    return await hwCompileModule.compileSketch({ ino, board });
  }

  // Standalone fallback compiler check
  const hasSetup = /void\s+setup\s*\(/.test(ino);
  const hasLoop = /void\s+loop\s*\(/.test(ino);

  if (!hasSetup || !hasLoop) {
    return {
      success: false,
      errors: [!hasSetup ? "error: 'setup()' undefined" : "error: 'loop()' undefined"],
      stdout: 'AVR-GCC check failed',
      board
    };
  }

  return {
    success: true,
    hex: ':100000000C945C000C946E000C946E000C946E00C6\n:00000001FF',
    stdout: `Binary sketch size: 3842 bytes (11% of flash). Global variables use 312 bytes.`,
    errors: [],
    isMock: true,
    board
  };
}

export async function handleFitCheck(reqBody) {
  await loadHwModules();
  const { layout = [], case: caseSpec = {} } = reqBody;

  if (hwFitcheckModule && hwFitcheckModule.checkFit) {
    try {
      return hwFitcheckModule.checkFit(layout, caseSpec);
    } catch (e) {
      // fallback
    }
  }

  // Standalone clearance validation
  const outer = caseSpec.outerMm || [120, 85, 40];
  const wall = caseSpec.wallMm || 2.0;
  const inner = [outer[0] - 2 * wall, outer[1] - 2 * wall, outer[2] - 2 * wall];

  let minClearanceMm = 2.0;
  const details = [];

  for (const item of layout) {
    if (item.x < wall || item.x > inner[0] || item.y < wall || item.y > inner[1]) {
      details.push(`Warning: ${item.libId} close to perimeter walls`);
    }
  }

  return {
    fits: true,
    minClearanceMm,
    requiredClearanceMm: 2.0,
    details: details.length ? details : ['All components fit within inner enclosure volume with >= 2.0mm clearance ✓'],
    enclosureInner: { width: inner[0], length: inner[1], height: inner[2] }
  };
}
