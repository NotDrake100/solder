import express from 'express';
import { getGeminiApiKey, GEMINI_MODEL } from '../config.js';
import { buildCache } from '../cache.js';

const router = express.Router();

router.get('/', (req, res) => {
  const hasKey = Boolean(getGeminiApiKey());
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    gemini: {
      configured: hasKey,
      model: GEMINI_MODEL,
    },
    cache: {
      entries: buildCache.size(),
    },
    version: '1.0.0',
  });
});

export default router;
