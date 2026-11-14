import express from 'express';
import { getShowcase, listShowcases, KNOWN_SHOWCASE_IDS } from '../showcaseService.js';

const router = express.Router();

// GET /api/showcase - list available showcases
router.get('/', async (req, res) => {
  try {
    const list = await listShowcases();
    res.json({
      showcases: list,
      available: KNOWN_SHOWCASE_IDS,
    });
  } catch (err) {
    res.status(500).json({ error: 'failed_to_list_showcases', message: err.message });
  }
});

// GET /api/showcase/:id - get specific showcase build (sip, wisp, hasp, eave)
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const build = await getShowcase(id);
    if (!build) {
      return res.status(404).json({
        error: 'showcase_not_found',
        message: `Showcase '${id}' not found. Available showcase products: ${KNOWN_SHOWCASE_IDS.join(', ')}`,
        available: KNOWN_SHOWCASE_IDS,
      });
    }

    res.json(build);
  } catch (err) {
    res.status(500).json({ error: 'failed_to_load_showcase', message: err.message });
  }
});

export default router;
