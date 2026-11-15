import { analyzePhotoWithGemini } from '../services/gemini.js';
import { validateImageBase64 } from './build.js';

export async function handlePhotoUpload(reqBody) {
  const imageBase64 = reqBody.imageBase64 || reqBody.photoBase64 || reqBody.image;

  if (!imageBase64) {
    throw new Error('Missing base64 image data');
  }

  // QA-BREAK B12: Validate magic bytes and 8MB size limit
  validateImageBase64(imageBase64);

  const result = await analyzePhotoWithGemini(imageBase64);
  return result;
}
