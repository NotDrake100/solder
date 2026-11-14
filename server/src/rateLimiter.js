const ONE_HOUR_MS = 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const MAX_BUILDS_PER_HOUR = 3;
const MAX_BUILDS_PER_DAY = 15;
const GLOBAL_DAILY_CAP = 50; // generous safety global cap

class RateLimiter {
  constructor() {
    this.ipHistory = new Map(); // ip -> Array<timestamp>
    this.globalHistory = []; // Array<timestamp>
  }

  getClientIp(req) {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    return req.socket.remoteAddress || req.ip || '127.0.0.1';
  }

  cleanTimestamps(timestamps, windowMs) {
    const now = Date.now();
    return timestamps.filter((t) => now - t < windowMs);
  }

  check(ip) {
    const now = Date.now();
    let history = this.ipHistory.get(ip) || [];
    history = this.cleanTimestamps(history, ONE_DAY_MS);
    this.ipHistory.set(ip, history);

    this.globalHistory = this.cleanTimestamps(this.globalHistory, ONE_DAY_MS);

    // Global cap check
    if (this.globalHistory.length >= GLOBAL_DAILY_CAP) {
      return {
        allowed: false,
        reason: 'global_daily_cap',
        message: 'Solder is busy — try a showcase build (Sip, Wisp, Hasp, Eave) while demo capacity resets.',
        retryAfterSec: Math.ceil((ONE_DAY_MS - (now - this.globalHistory[0])) / 1000),
      };
    }

    // IP hourly check
    const hourlyHistory = history.filter((t) => now - t < ONE_HOUR_MS);
    if (hourlyHistory.length >= MAX_BUILDS_PER_HOUR) {
      const oldestHour = hourlyHistory[0];
      const retryAfterSec = Math.ceil((ONE_HOUR_MS - (now - oldestHour)) / 1000);
      return {
        allowed: false,
        reason: 'hourly_ip_limit',
        message: 'Hourly build limit reached (3 builds/hour). Solder is busy — try exploring Sip, Wisp, Hasp, or Eave while cooldown completes.',
        retryAfterSec,
      };
    }

    // IP daily check
    if (history.length >= MAX_BUILDS_PER_DAY) {
      const oldestDay = history[0];
      const retryAfterSec = Math.ceil((ONE_DAY_MS - (now - oldestDay)) / 1000);
      return {
        allowed: false,
        reason: 'daily_ip_limit',
        message: 'Daily build limit reached (15 builds/day). Please try a showcase build (Sip, Wisp, Hasp, Eave).',
        retryAfterSec,
      };
    }

    return { allowed: true };
  }

  record(ip) {
    const now = Date.now();
    const history = this.ipHistory.get(ip) || [];
    history.push(now);
    this.ipHistory.set(ip, history);
    this.globalHistory.push(now);
  }

  middleware() {
    return (req, res, next) => {
      const ip = this.getClientIp(req);
      const status = this.check(ip);
      if (!status.allowed) {
        res.setHeader('Retry-After', status.retryAfterSec || 3600);
        return res.status(429).json({
          error: 'rate_limit_exceeded',
          reason: status.reason,
          message: status.message,
          retryAfter: status.retryAfterSec,
          showcaseSuggestions: ['sip', 'wisp', 'hasp', 'eave'],
        });
      }
      // Pass along record callback so we only record on actual non-cached generation
      req.recordRateLimit = () => this.record(ip);
      next();
    };
  }

  reset() {
    this.ipHistory.clear();
    this.globalHistory = [];
  }
}

export const rateLimiter = new RateLimiter();
