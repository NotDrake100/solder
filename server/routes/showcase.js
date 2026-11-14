import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SHOWCASE_DIR = path.resolve(__dirname, '../../showcase');

const SHOWCASE_IDS = ['sip', 'wisp', 'hasp', 'eave', 'fan'];

export function getShowcaseList() {
  return SHOWCASE_IDS.map(id => {
    try {
      const p = path.join(SHOWCASE_DIR, `${id}.json`);
      if (fs.existsSync(p)) {
        const item = JSON.parse(fs.readFileSync(p, 'utf8'));
        return {
          id: item.id,
          name: item.name,
          tagline: item.tagline,
          summary: item.summary,
          board: item.board,
          priceInr: item.product?.priceInr || 1290,
          partsCount: item.parts?.length || 5
        };
      }
    } catch (e) {
      // ignore
    }
    return { id, name: id.toUpperCase() };
  });
}

export function getShowcaseById(id) {
  const cleanId = (id || '').trim().toLowerCase();
  const filePath = path.join(SHOWCASE_DIR, `${cleanId}.json`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    console.error(`Error reading showcase file for ${cleanId}:`, e);
    return null;
  }
}
