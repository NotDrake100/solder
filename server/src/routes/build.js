import express from 'express';
import { BuildInputSchema } from '../schemas.js';
import { buildCache } from '../cache.js';
import { rateLimiter } from '../rateLimiter.js';
import { runAgentLoop } from '../agentLoop.js';

const router = express.Router();

function sendSseEvent(res, eventName, data) {
  res.write(`event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`);
  if (typeof res.flush === 'function') {
    res.flush();
  }
}

// POST /api/build
router.post('/', async (req, res) => {
  const parsedInput = BuildInputSchema.safeParse(req.body);
  if (!parsedInput.success) {
    return res.status(400).json({
      error: 'invalid_request',
      message: parsedInput.error.errors[0]?.message || 'Invalid build parameters',
      details: parsedInput.error.format(),
    });
  }

  const { prompt, ownedParts, stream } = parsedInput.data;
  const wantsSse = stream || (req.headers.accept && req.headers.accept.includes('text/event-stream'));

  // 1. Check prompt-hash cache first (instant response, zero rate limit burn)
  const cachedResult = buildCache.get(prompt);
  if (cachedResult) {
    if (wantsSse) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders?.();

      sendSseEvent(res, 'log', { step: 'cache_hit', status: 'pass', detail: 'Instant retrieval from prompt-hash cache' });
      sendSseEvent(res, 'step', { step: 'cache_hit', status: 'pass', detail: 'Instant retrieval from prompt-hash cache' });
      
      const responseData = { ...cachedResult, cached: true };
      sendSseEvent(res, 'complete', responseData);
      sendSseEvent(res, 'result', responseData);
      sendSseEvent(res, 'done', {});
      return res.end();
    }

    return res.json({ ...cachedResult, cached: true });
  }

  // 2. Check rate limit
  const clientIp = rateLimiter.getClientIp(req);
  const limitStatus = rateLimiter.check(clientIp);
  if (!limitStatus.allowed) {
    res.setHeader('Retry-After', limitStatus.retryAfterSec || 3600);
    return res.status(429).json({
      error: 'rate_limit_exceeded',
      reason: limitStatus.reason,
      message: limitStatus.message,
      retryAfter: limitStatus.retryAfterSec,
      showcaseSuggestions: ['sip', 'wisp', 'hasp', 'eave'],
    });
  }

  // Record rate limit consumption
  rateLimiter.record(clientIp);

  // 3. Execution: Streaming vs Non-streaming
  if (wantsSse) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    try {
      const buildResult = await runAgentLoop(prompt, ownedParts, (stepInfo) => {
        sendSseEvent(res, 'log', stepInfo);
        sendSseEvent(res, 'step', stepInfo);
      });

      // Save in cache
      buildCache.set(prompt, buildResult);

      sendSseEvent(res, 'complete', buildResult);
      sendSseEvent(res, 'result', buildResult);
      sendSseEvent(res, 'done', {});
      res.end();
    } catch (err) {
      console.error('[build] Error during agent loop stream:', err);
      sendSseEvent(res, 'error', { message: err.message });
      res.end();
    }
  } else {
    try {
      const buildResult = await runAgentLoop(prompt, ownedParts);
      // Save in cache
      buildCache.set(prompt, buildResult);
      return res.json(buildResult);
    } catch (err) {
      console.error('[build] Error during agent loop:', err);
      return res.status(500).json({ error: 'build_failed', message: err.message });
    }
  }
});

// GET /api/build/stream?prompt=... (Browser EventSource convenience endpoint)
router.get('/stream', async (req, res) => {
  const prompt = (req.query.prompt || '').toString();
  const parsedInput = BuildInputSchema.safeParse({ prompt, stream: true });
  if (!parsedInput.success) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.flushHeaders?.();
    sendSseEvent(res, 'error', { message: 'Valid prompt parameter is required' });
    return res.end();
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  // Cache check
  const cachedResult = buildCache.get(prompt);
  if (cachedResult) {
    sendSseEvent(res, 'log', { step: 'cache_hit', status: 'pass', detail: 'Instant retrieval from prompt-hash cache' });
    sendSseEvent(res, 'complete', { ...cachedResult, cached: true });
    sendSseEvent(res, 'done', {});
    return res.end();
  }

  // Rate limit check
  const clientIp = rateLimiter.getClientIp(req);
  const limitStatus = rateLimiter.check(clientIp);
  if (!limitStatus.allowed) {
    sendSseEvent(res, 'error', {
      error: 'rate_limit_exceeded',
      message: limitStatus.message,
      retryAfter: limitStatus.retryAfterSec,
    });
    return res.end();
  }
  rateLimiter.record(clientIp);

  try {
    const buildResult = await runAgentLoop(prompt, [], (stepInfo) => {
      sendSseEvent(res, 'log', stepInfo);
      sendSseEvent(res, 'step', stepInfo);
    });

    buildCache.set(prompt, buildResult);
    sendSseEvent(res, 'complete', buildResult);
    sendSseEvent(res, 'done', {});
    res.end();
  } catch (err) {
    sendSseEvent(res, 'error', { message: err.message });
    res.end();
  }
});

export default router;
