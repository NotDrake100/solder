import { fixWithGemini } from '../services/gemini.js';

export async function handleFixBuild(reqBody) {
  const { build, error, logs = '', attemptCount = 0 } = reqBody;

  if (!build) {
    throw new Error('Missing build object in request body');
  }
  if (!error) {
    throw new Error('Missing error message in request body');
  }

  const result = await fixWithGemini(build, error, logs, attemptCount);
  return result;
}
