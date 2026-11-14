import { analyzePhotoWithGemini } from '../services/gemini.js';

export async function handlePhotoUpload(reqBody) {
  const imageBase64 = reqBody.imageBase64 || reqBody.photoBase64 || reqBody.image;

  if (!imageBase64) {
    throw new Error('Missing base64 image data');
  }

  const result = await analyzePhotoWithGemini(imageBase64);
  return result;
}
