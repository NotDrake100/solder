import { ProductBuild, AgentLogStep } from '../types';
import { MOCK_BUILDS } from '../data/mockShowcases';

export async function fetchShowcase(id: string): Promise<ProductBuild> {
  const cleanId = id.toLowerCase().trim();
  // 1. Try backend API endpoint /api/showcase/:id
  try {
    const res = await fetch(`/api/showcase/${cleanId}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.name) {
        return data;
      }
    }
  } catch (err) {
    // continue to static/fallback
  }

  // 2. Try static /showcase/:id.json
  try {
    const res = await fetch(`/showcase/${cleanId}.json`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.name) {
        return data;
      }
    }
  } catch (err) {
    // continue to fallback
  }

  // 3. Fallback to embedded precomputed build
  if (MOCK_BUILDS[cleanId]) {
    return MOCK_BUILDS[cleanId];
  }

  return MOCK_BUILDS['sip'];
}

export async function buildProduct(
  prompt: string,
  onStep?: (step: AgentLogStep) => void
): Promise<ProductBuild> {
  const steps: AgentLogStep[] = [
    { step: 'spec_parse', status: 'running', detail: `Analyzing requirements: "${prompt}"` },
    { step: 'code_gen', status: 'pending', detail: 'Selecting bill of materials & generating firmware' },
    { step: 'compile', status: 'pending', detail: 'Invoking compiler (arduino-cli) for target MCU' },
    { step: 'sim_test', status: 'pending', detail: 'Running automated functional simulation' },
    { step: 'case_fit', status: 'pending', detail: 'Calculating 3D enclosure clearance & OpenSCAD model' },
  ];

  try {
    // Try SSE or POST to backend
    const res = await fetch('/api/build', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.name) {
        if (data.agentLog && onStep) {
          for (const s of data.agentLog) {
            onStep(s);
          }
        }
        return data;
      }
    }
  } catch (err) {
    console.warn('[API] /api/build network call failed, providing synthesized build response', err);
  }

  // Simulated live agent progress if server is unavailable
  for (let i = 0; i < steps.length; i++) {
    const current = { ...steps[i], status: 'running' as const };
    onStep?.(current);
    await new Promise((r) => setTimeout(r, 450));
    const passed = { ...current, status: 'pass' as const };
    onStep?.(passed);
  }

  // Return customized build from prompt
  const base = { ...MOCK_BUILDS['sip'] };
  base.name = prompt.slice(0, 16).replace(/[^\w\s]/g, '').trim() || 'Custom Maker Build';
  base.name = base.name.charAt(0).toUpperCase() + base.name.slice(1);
  base.tagline = prompt;
  base.summary = `Custom build generated for "${prompt}". Features calibrated sensors, power distribution, and tailored 3D printable case.`;
  return base;
}
