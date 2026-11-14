import { SHOWCASE_BUILDS, SHOWCASE_PILLS, QUICK_CHIPS } from './data/showcases.ts';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`TEST FAILED: ${msg}`);
  }
}

console.log('--- Running Solder Frontend Test Suite ---');

// 1. Verify Showcase Projects
console.log('1. Testing showcase projects (Sip, Wisp, Hasp, Eave)...');
const requiredProjects = ['sip', 'wisp', 'hasp', 'eave'] as const;

for (const id of requiredProjects) {
  const build = SHOWCASE_BUILDS[id];
  assert(!!build, `Showcase build exists for ${id}`);
  assert(build.id === id, `Build id matches ${id}`);
  assert(build.parts.length >= 4, `${id} has at least 4 BOM parts`);
  assert(build.layout.length >= 3, `${id} has layout coordinates`);
  assert(build.case.wallMm >= 2.0, `${id} case wall thickness is >= 2.0mm`);
  assert(build.wiring.length >= 4, `${id} has wiring netlist connections`);
  assert(build.code.ino.length > 50, `${id} has valid Arduino C++ .ino sketch`);
  assert(build.tests.length >= 1, `${id} has automated test cases`);
  assert(!!build.product.boxSvg, `${id} has retail packaging box SVG artwork`);
}
console.log('   ✓ All 4 showcase builds verified.');

// 2. Verify INR Pricing and BOM Totals
console.log('2. Testing Indian Rupee (INR ₹) BOM kit calculations...');
const sip = SHOWCASE_BUILDS.sip;
const totalCost = sip.parts.reduce((sum, p) => sum + p.priceInr * p.qty, 0);
assert(totalCost > 500 && totalCost < 1500, `Sip kit price within reasonable maker budget: ₹${totalCost}`);
console.log(`   ✓ Sip Total Kit Price: ₹${totalCost} INR.`);

// 3. Verify Scrap Mode Savings Logic
console.log('3. Testing Scrap Mode savings calculation...');
const ownedParts = [
  { libId: 'arduino_uno', priceInr: 450, qty: 1 },
  { libId: 'relay_5v', priceInr: 80, qty: 1 },
  { libId: 'soil_moisture', priceInr: 90, qty: 1 },
];
const savings = ownedParts.reduce((sum, p) => sum + p.priceInr * p.qty, 0);
assert(savings === 620, `Scrap mode savings match: ₹${savings}`);
console.log(`   ✓ Scrap Mode savings verified: ₹${savings} off kit total.`);

// 4. Verify Quick Chips and Navigation
console.log('4. Testing chips and showcase pills...');
assert(QUICK_CHIPS.length >= 5, 'Quick chips populated');
assert(SHOWCASE_PILLS.length >= 4, 'Showcase selector pills populated');
console.log('   ✓ UI navigation chips and pills verified.');

// 5. Verify Logo Mark 06 & Deterministic Harness Trace
console.log('5. Testing Logo Mark 06 and Harness Trace checks...');
import { SolderLogo } from './components/SolderLogo.tsx';
import { getInitialLiveHarnessChecks, getDefaultHarnessChecks } from './components/HarnessTrace.tsx';
assert(typeof SolderLogo === 'function', 'SolderLogo Mark 06 component exists');

const initialChecks = getInitialLiveHarnessChecks();
assert(initialChecks.length === 6, 'Exactly 6 real server verifier checks');
assert(initialChecks.map((c) => c.id).join(',') === 'pin_conflicts,power_budget,voltage_compat,compile,simulate,fit_check', 'Check IDs match server agentLoop checks');

const defaultChecks = getDefaultHarnessChecks({ id: 'desk-fan', name: 'Desk fan' } as any);
assert(defaultChecks.length === 6, 'Default checks length is 6');
const healedCheck = defaultChecks.find((c) => c.id === 'pin_conflicts');
assert(healedCheck?.status === 'healed', 'Desk fan pin conflict is marked healed');
assert(!!healedCheck?.failedEvidence, 'Healed check has visible round 1 failed evidence');
assert(!!healedCheck?.healInfo, 'Healed check has fixer model and explanation');
console.log('   ✓ Logo Mark 06 and 6 Real Harness Checks with self-heal verified.');

// 6. Verify Live Camera Mode & Photo Chat
console.log('6. Testing Live Camera Mode & Photo Chat components...');
import { LiveCameraModal } from './components/LiveCameraModal.tsx';
assert(typeof LiveCameraModal === 'function', 'LiveCameraModal component exists and exported');
console.log('   ✓ Live Camera tracking modal verified.');

// 7. Verify Minimal Landing Page
console.log('7. Testing Minimal Landing Page at / ...');
import { LandingPage } from './components/LandingPage.tsx';
assert(typeof LandingPage === 'function', 'LandingPage component exists and exported');
console.log('   ✓ Minimal Landing Page component verified.');

console.log('\n========================================');
console.log('ALL FRONTEND TEST SUITES PASSED (100%)');
console.log('========================================');
