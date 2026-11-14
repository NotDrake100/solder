import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Root repo directory
export const ROOT_DIR = path.resolve(__dirname, '../../');
export const SERVER_DIR = path.resolve(__dirname, '../');
export const SHOWCASE_DIR = path.resolve(ROOT_DIR, 'showcase');
export const PARTS_LIB_DIR = path.resolve(ROOT_DIR, 'parts-lib');
export const WEB_DIST_DIR = path.resolve(ROOT_DIR, 'web/dist');

export const PORT = parseInt(process.env.PORT || '3001', 10);

// Only read key directly from environment variable process.env.GEMINI_API_KEY
export const getGeminiApiKey = () => {
  return process.env.GEMINI_API_KEY || '';
};

export const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
export const GEMINI_FIX_MODEL = process.env.GEMINI_FIX_MODEL || 'gemini-3.5-flash-lite';
