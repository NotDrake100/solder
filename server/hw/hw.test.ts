import { getPart, getAllParts } from '../../parts-lib/index.ts';
import { checkFit } from './fitcheck.ts';
import { generateOpenScad, compileScadToStl } from './scad.ts';
import { compileSketch } from './compile.ts';

async function runTests() {
  console.log('--- Testing parts-lib ---');
  const allParts = getAllParts();
  console.log(`Loaded ${allParts.length} parts from parts-lib.`);
  if (allParts.length !== 11) {
    throw new Error(`Expected 11 parts, found ${allParts.length}`);
  }

  const uno = getPart('arduino-uno');
  if (!uno || uno.dimensions.width !== 53.4) {
    throw new Error('Arduino Uno lookup failed');
  }
  console.log(`✓ Arduino Uno lookup: ${uno.name}, ${uno.dimensions.width}x${uno.dimensions.length}mm, ₹${uno.priceInr}`);

  console.log('\n--- Testing fitcheck ---');
  // Sip layout: Uno at (5, 5, 2), Relay at (62, 5, 2)
  const layout = [
    { libId: 'arduino_uno', x: 5, y: 5, z: 2 },
    { libId: 'relay_5v', x: 62, y: 5, z: 2 }
  ];
  const enclosure = {
    outerMm: [90, 85, 30] as [number, number, number],
    wallMm: 2.0,
    clearance: 2.0
  };

  const fitResult = checkFit(layout, enclosure);
  console.log(`Fit check result: fits=${fitResult.fits}, minClearance=${fitResult.minClearanceMm}mm, collisions=${fitResult.collisions.length}`);
  if (fitResult.collisions.length > 0) {
    throw new Error('Unexpected collision in valid layout');
  }
  console.log('✓ Fit check passed with clean clearance');

  // Test collision detection
  const collidingLayout = [
    { libId: 'arduino_uno', x: 5, y: 5, z: 2 },
    { libId: 'relay_5v', x: 10, y: 10, z: 2 } // overlapping with Uno
  ];
  const collisionResult = checkFit(collidingLayout, enclosure);
  if (collisionResult.fits || collisionResult.collisions.length === 0) {
    throw new Error('Collision detection failed on overlapping parts');
  }
  console.log(`✓ Collision detection caught overlapping parts as expected: ${collisionResult.collisions[0].message}`);

  console.log('\n--- Testing scad ---');
  const scadCode = generateOpenScad(enclosure, layout);
  if (!scadCode.includes('enclosure_base') || !scadCode.includes('enclosure_lid')) {
    throw new Error('SCAD code generation missing core modules');
  }
  console.log(`✓ OpenSCAD script generated (${scadCode.length} characters)`);

  const stlResult = await compileScadToStl(scadCode);
  if (!stlResult.success || !stlResult.stlString || !stlResult.stlString.includes('endsolid')) {
    throw new Error('STL generation failed or produced invalid STL');
  }
  console.log(`✓ STL compiled/generated successfully: ${stlResult.stdout}`);

  console.log('\n--- Testing compile ---');
  const validSketch = `
    const int soilPin = A0;
    const int relayPin = 8;
    void setup() {
      Serial.begin(9600);
      pinMode(relayPin, OUTPUT);
    }
    void loop() {
      int val = analogRead(soilPin);
      if (val < 400) {
        digitalWrite(relayPin, HIGH);
        Serial.println("Pump ON");
      } else {
        digitalWrite(relayPin, LOW);
        Serial.println("Pump OFF");
      }
      delay(1000);
    }
  `;
  const compileGood = await compileSketch({ ino: validSketch, board: 'uno' });
  if (!compileGood.success || !compileGood.hex || !compileGood.hex.startsWith(':')) {
    throw new Error(`Valid sketch compilation failed: ${JSON.stringify(compileGood.errors)}`);
  }
  console.log(`✓ Valid sketch compiled with Intel HEX output (${compileGood.hex.split('\n').length} hex lines)`);

  // Test compiler error catching
  const brokenSketch = `
    void setup() {
      pinMode(13, OUTPUT) // missing semicolon
    }
    // missing loop
  `;
  const compileBad = await compileSketch({ ino: brokenSketch, board: 'uno' });
  if (compileBad.success || compileBad.errors.length === 0) {
    throw new Error('Broken sketch should have failed compilation');
  }
  console.log(`✓ Broken sketch caught syntax errors cleanly: ${compileBad.errors.join('; ')}`);

  console.log('\n=======================================');
  console.log('ALL SERVER/HW TESTS PASSED SUCCESSFULLY');
  console.log('=======================================');
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
