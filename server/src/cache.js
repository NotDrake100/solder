import crypto from 'crypto';

class PromptCache {
  constructor(maxEntries = 500) {
    this.cache = new Map();
    this.maxEntries = maxEntries;
  }

  normalizePrompt(prompt) {
    if (!prompt) return '';
    return prompt.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  hashPrompt(prompt) {
    const normalized = this.normalizePrompt(prompt);
    return crypto.createHash('sha256').update(normalized).digest('hex');
  }

  get(prompt) {
    const hash = this.hashPrompt(prompt);
    const entry = this.cache.get(hash);
    if (!entry) return null;
    entry.lastAccessed = Date.now();
    return entry.data;
  }

  set(prompt, data) {
    const hash = this.hashPrompt(prompt);
    if (this.cache.size >= this.maxEntries) {
      // LRU eviction: delete oldest accessed entry
      let oldestKey = null;
      let oldestTime = Infinity;
      for (const [key, value] of this.cache.entries()) {
        if (value.lastAccessed < oldestTime) {
          oldestTime = value.lastAccessed;
          oldestKey = key;
        }
      }
      if (oldestKey) this.cache.delete(oldestKey);
    }
    this.cache.set(hash, {
      data,
      created: Date.now(),
      lastAccessed: Date.now(),
      prompt: this.normalizePrompt(prompt),
    });
  }

  has(prompt) {
    const hash = this.hashPrompt(prompt);
    return this.cache.has(hash);
  }

  size() {
    return this.cache.size;
  }

  clear() {
    this.cache.clear();
  }
}

export const buildCache = new PromptCache();
