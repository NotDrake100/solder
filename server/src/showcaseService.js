import fs from 'fs/promises';
import path from 'path';
import { SHOWCASE_DIR } from './config.js';
import { BuildResultSchema } from './schemas.js';

const showcaseCache = new Map();

export const KNOWN_SHOWCASE_IDS = ['sip', 'wisp', 'hasp', 'eave'];

export async function getShowcase(id) {
  const normalizedId = (id || '').toLowerCase().trim();
  if (!normalizedId) return null;

  if (showcaseCache.has(normalizedId)) {
    return showcaseCache.get(normalizedId);
  }

  const filePath = path.join(SHOWCASE_DIR, `${normalizedId}.json`);

  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(raw);
    
    // Validate with zod
    const parsed = BuildResultSchema.safeParse(data);
    if (!parsed.success) {
      console.warn(`[showcase] Warning: showcase/${normalizedId}.json schema mismatch:`, parsed.error.issues);
      // Return raw parsed JSON even if minor validation issues
      showcaseCache.set(normalizedId, data);
      return data;
    }

    showcaseCache.set(normalizedId, parsed.data);
    return parsed.data;
  } catch (err) {
    if (err.code === 'ENOENT') {
      return null;
    }
    console.error(`[showcase] Error reading showcase/${normalizedId}.json:`, err);
    throw err;
  }
}

export async function listShowcases() {
  const results = {};
  for (const id of KNOWN_SHOWCASE_IDS) {
    const data = await getShowcase(id);
    if (data) {
      results[id] = {
        name: data.name,
        tagline: data.tagline,
        board: data.board,
        priceInr: data.product?.priceInr || data.parts?.reduce((sum, p) => sum + (p.priceInr || 0), 0) || 0,
      };
    }
  }
  return results;
}
