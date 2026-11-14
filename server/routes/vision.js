import { detectPartsWithGeminiVision } from '../services/gemini.js';

// Rate limiting state for live camera vision
// Max 1 in-flight per IP, max 40 calls per session / hour
const inFlightMap = new Map();
const sessionCallCount = new Map();

export async function handleVisionDetect(reqBody, clientIp = '127.0.0.1') {
  const imageBase64 = reqBody.imageBase64 || reqBody.image || reqBody.photoBase64;

  if (!imageBase64) {
    throw new Error('Missing base64 image frame data');
  }

  // 1. In-flight concurrency guard: max 1 per client
  if (inFlightMap.get(clientIp)) {
    const err = new Error('Vision request already in-flight for this client');
    err.statusCode = 429;
    throw err;
  }

  // 2. Session quota guard: max 40 per session
  const currentCount = sessionCallCount.get(clientIp) || 0;
  if (currentCount >= 40) {
    const err = new Error('Vision rate limit reached for this session (max 40 calls)');
    err.statusCode = 429;
    throw err;
  }

  inFlightMap.set(clientIp, true);
  sessionCallCount.set(clientIp, currentCount + 1);

  try {
    const detections = await detectPartsWithGeminiVision(imageBase64);
    return {
      detections,
      sessionRemaining: 40 - (currentCount + 1),
    };
  } finally {
    inFlightMap.delete(clientIp);
  }
}
