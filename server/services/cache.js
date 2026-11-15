import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.resolve(__dirname, '../../server/cache_store');

// Ensure cache store directory exists
try {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
} catch (e) {
  // in-memory fallback if fs not writable
}

// In-memory LRU-like cache
const memoryCache = new Map();
const MAX_MEM_ITEMS = 100;

export function hashPrompt(prompt, chips = [], photoBase64 = '', inventory = []) {
  const normalized = (prompt || '').trim().toLowerCase();
  const sortedChips = [...(chips || [])].map((c) => c.trim().toLowerCase()).sort();
  const sortedInv = [...(inventory || [])]
    .map((i) => (typeof i === 'string' ? i : i.name || i.id || '').trim().toLowerCase())
    .sort();

  let photoHash = '';
  if (photoBase64) {
    photoHash = crypto.createHash('sha256').update(photoBase64).digest('hex').substring(0, 16);
  }

  const raw = `${normalized}::${sortedChips.join('|')}::${sortedInv.join('|')}::photo:${photoHash}`;
  return crypto.createHash('sha256').update(raw).digest('hex');
}

export function getCachedBuild(hash) {
  // Check memory
  if (memoryCache.has(hash)) {
    return memoryCache.get(hash);
  }

  // Check file cache
  try {
    const filePath = path.join(CACHE_DIR, `${hash}.json`);
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      memoryCache.set(hash, data);
      return data;
    }
  } catch (e) {
    // ignore read error
  }

  return null;
}

export function setCachedBuild(hash, buildData) {
  if (!hash || !buildData) return;

  if (memoryCache.size >= MAX_MEM_ITEMS) {
    const firstKey = memoryCache.keys().next().value;
    memoryCache.delete(firstKey);
  }
  memoryCache.set(hash, buildData);

  try {
    const filePath = path.join(CACHE_DIR, `${hash}.json`);
    fs.writeFileSync(filePath, JSON.stringify(buildData, null, 2), 'utf8');
  } catch (e) {
    // ignore write error
  }
}
