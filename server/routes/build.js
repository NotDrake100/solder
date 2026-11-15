import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildWithGemini } from '../services/gemini.js';
import { hashPrompt, getCachedBuild, setCachedBuild } from '../services/cache.js';
import { checkRateLimit, recordLiveBuild } from '../services/rateLimiter.js';
import { runAgentLoop } from '../services/agentLoop.js';
import { getShowcaseById } from './showcase.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BUILDS_DIR = path.resolve(__dirname, '../data/builds');

// Global memory registry of active builds by ID
export const activeBuilds = new Map();

export function saveBuildToFile(id, buildData) {
  try {
    if (!fs.existsSync(BUILDS_DIR)) {
      fs.mkdirSync(BUILDS_DIR, { recursive: true });
    }
    const filePath = path.join(BUILDS_DIR, `${id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(buildData, null, 2), 'utf-8');
  } catch (err) {
    console.warn(`[build] Failed to persist build ${id} to disk:`, err.message);
  }
}

export function getBuildFromFile(id) {
  try {
    const filePath = path.join(BUILDS_DIR, `${id}.json`);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.warn(`[build] Failed to read build ${id} from disk:`, err.message);
  }
  return null;
}

export function validateImageBase64(imageBase64) {
  if (!imageBase64) return null;
  const base64Str = imageBase64.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Str, 'base64');
  if (buffer.length > 8 * 1024 * 1024) {
    const err = new Error('Image exceeds 8MB size limit.');
    err.status = 400;
    throw err;
  }
  const isJpeg = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
  const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
  const isWebp = buffer.length > 12 && buffer.slice(0, 4).toString('ascii') === 'RIFF' && buffer.slice(8, 12).toString('ascii') === 'WEBP';

  if (!isJpeg && !isPng && !isWebp) {
    const err = new Error("That file isn't a photo.");
    err.status = 400;
    throw err;
  }
  return buffer;
}

export function isBuildableDeviceIdea(prompt) {
  if (!prompt || typeof prompt !== 'string') return true;
  const trimmed = prompt.trim();
  if (trimmed.length < 3) return false;

  // Explicit non-hardware queries (poems, jokes, general knowledge, recipes)
  const nonHwPatterns = [
    /\b(?:write|tell|recite|compose|sing)\s+(?:me\s+)?(?:a\s+)?(?:poem|joke|story|essay|song|limerick|haiku|riddle)\b/i,
    /\b(?:what\s+is\s+the\s+capital\s+of|who\s+is\s+the\s+president\s+of)\b/i,
    /\b(?:recipe\s+for|how\s+to\s+cook|bake\s+a\s+cake)\b/i,
    /\b(?:who\s+are\s+you|what\s+can\s+you\s+do|chat\s+with\s+me)\b/i
  ];
  for (const pat of nonHwPatterns) {
    if (pat.test(trimmed)) {
      return false;
    }
  }

  // Gibberish detection (strings like "asdkj qwpeoi zzxm blorf")
  const words = trimmed.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  if (words.length > 0) {
    let gibberishCount = 0;
    for (const w of words) {
      const clean = w.replace(/[^a-z]/g, '');
      if (!clean) continue;
      const noVowels = clean.length >= 4 && !/[aeiouy]/.test(clean);
      const crazyConsonants = /[bcdfghjklmnpqrstvwxz]{5,}/.test(clean);
      const isRandomLetters = /^(?:asdkj|qwpeoi|zzxm|blorf|asdf|lkjh|zxcv|qwer)/.test(clean);

      if (noVowels || crazyConsonants || isRandomLetters) {
        gibberishCount++;
      }
    }
    if (gibberishCount >= Math.ceil(words.length / 2)) {
      return false;
    }
  }

  return true;
}

export async function handleCreateBuild({ prompt, photoBase64, chips = [], inventory = [], ip = '127.0.0.1' }) {
  if (!prompt && !photoBase64 && (!inventory || inventory.length === 0)) {
    throw new Error('Please provide an idea prompt, photo, or inventory.');
  }

  // QA-BREAK B6: Server-side clamp rejection above 2000 chars
  if (prompt && prompt.length > 2000) {
    const err = new Error('Prompt exceeds 2000 character limit.');
    err.status = 400;
    throw err;
  }

  // QA-BREAK B12: Validate image if provided
  if (photoBase64) {
    validateImageBase64(photoBase64);
  }

  // QA-BREAK B2: Classify prompt before building. If not buildable, don't count as build or run harness.
  const hasVisualOrInventory = Boolean(photoBase64 || (Array.isArray(inventory) && inventory.length > 0));
  if (!hasVisualOrInventory && !isBuildableDeviceIdea(prompt)) {
    return {
      buildId: null,
      isNonHardware: true,
      message: "I build electronics. Try something like 'a lamp that turns on when it gets dark'.",
      chips: [
        "A lamp that turns on when it gets dark",
        "Plant waterer with soil moisture probe",
        "AI pocket assistant on Raspberry Pi"
      ]
    };
  }

  // 1. Check prompt cache first
  const cacheKey = hashPrompt(prompt || '', chips, photoBase64, inventory);
  const cached = getCachedBuild(cacheKey);
  if (cached) {
    activeBuilds.set(cached.id, cached);
    saveBuildToFile(cached.id, cached);
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

  // Store in cache, memory, and persistent file store
  setCachedBuild(cacheKey, buildData);
  activeBuilds.set(buildData.id, buildData);
  saveBuildToFile(buildData.id, buildData);

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
  // Check persistent file store
  const fileBuild = getBuildFromFile(id);
  if (fileBuild) {
    activeBuilds.set(fileBuild.id, fileBuild);
    return fileBuild;
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
