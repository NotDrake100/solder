import { buildWithGemini } from '../services/gemini.js';
import { hashPrompt, getCachedBuild, setCachedBuild } from '../services/cache.js';
import { checkRateLimit, recordLiveBuild } from '../services/rateLimiter.js';
import { runAgentLoop } from '../services/agentLoop.js';
import { getShowcaseById } from './showcase.js';

// Global memory registry of active builds by ID
export const activeBuilds = new Map();

export async function handleCreateBuild({ prompt, photoBase64, chips = [], inventory = [], ip = '127.0.0.1' }) {
  if (!prompt && !photoBase64 && (!inventory || inventory.length === 0)) {
    throw new Error('Please provide an idea prompt, photo, or inventory.');
  }

  // 1. Check prompt cache first
  const cacheKey = hashPrompt(prompt || '', chips, photoBase64, inventory);
  const cached = getCachedBuild(cacheKey);
  if (cached) {
    activeBuilds.set(cached.id, cached);
    return {
      buildId: cached.id,
      data: cached,
      cached: true,
      message: 'Retrieved from cache (zero API calls consumed).'
    };
  }

  // 2. Check rate limits (QA-BREAK B1: never serve fake fallback build on 429)
  const rateLimit = checkRateLimit(ip);
  if (!rateLimit.allowed) {
    const resetMinutes = Math.max(1, Math.round((new Date(rateLimit.resetAt).getTime() - Date.now()) / 60000));
    const err = new Error(rateLimit.message || `You've hit the hourly build limit. Try again in ${resetMinutes} min.`);
    err.status = 429;
    err.retryAfter = resetMinutes * 60;
    err.resetMinutes = resetMinutes;
    throw err;
  }

  // 3. Generate with Gemini 3.8 Flash (or smart generator if offline/no key)
  const buildData = await buildWithGemini(prompt, photoBase64, chips, inventory);

  // Tag parts as owned if present in user inventory
  if (Array.isArray(inventory) && inventory.length > 0 && Array.isArray(buildData.parts)) {
    const invLower = inventory.map(i => (typeof i === 'string' ? i : i.name || i.label || '').toLowerCase());
    buildData.parts = buildData.parts.map(p => {
      const match = invLower.some(inv => inv.includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(inv) || inv.includes(p.libId.toLowerCase()));
      return match ? { ...p, owned: true } : p;
    });
  }
  recordLiveBuild(ip);

  // Store in cache and memory
  setCachedBuild(cacheKey, buildData);
  activeBuilds.set(buildData.id, buildData);

  return {
    buildId: buildData.id,
    data: buildData,
    cached: false,
    rateLimit
  };
}

export function getBuildById(id) {
  if (!id) return null;
  // Check active builds
  if (activeBuilds.has(id)) {
    return activeBuilds.get(id);
  }
  // Check showcase
  const sc = getShowcaseById(id);
  if (sc) {
    activeBuilds.set(sc.id, sc);
    return sc;
  }
  return null;
}

export async function handleStreamBuild(id, req, res) {
  let buildData = getBuildById(id);

  if (!buildData) {
    // If id matches a known showcase or fallback
    buildData = getShowcaseById('sip');
  }

  // Write SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  const sendEvent = (eventData) => {
    res.write(`data: ${JSON.stringify(eventData)}\n\n`);
  };

  try {
    await runAgentLoop(buildData, sendEvent);
  } catch (err) {
    sendEvent({
      step: 'error',
      status: 'error',
      detail: err.message,
      timestamp: Date.now()
    });
  } finally {
    res.write(`event: done\ndata: {}\n\n`);
    res.end();
  }
}
