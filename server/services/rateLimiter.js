/**
 * In-memory sliding window rate limiter
 * - 3 live builds per IP / hour
 * - Global daily cap of 15 live builds (aligned with Gemini free tier 20 RPD)
 */

const ipRequests = new Map(); // ip -> Array<timestamp>
let dailyCount = 0;
let dailyResetTime = Date.now() + 24 * 60 * 60 * 1000;

const MAX_PER_IP_PER_HOUR = 3;
const ONE_HOUR_MS = 60 * 60 * 1000;
const GLOBAL_DAILY_CAP = 15;

export function checkRateLimit(ip = '127.0.0.1') {
  const now = Date.now();

  // Reset daily cap if window passed
  if (now > dailyResetTime) {
    dailyCount = 0;
    dailyResetTime = now + 24 * 60 * 60 * 1000;
  }

  // Check global cap
  if (dailyCount >= GLOBAL_DAILY_CAP) {
    return {
      allowed: false,
      reason: 'global_cap_reached',
      message: 'Solder has reached its global daily live generation cap. Instant showcase builds (Sip, Wisp, Hasp, Eave) remain fully accessible without API limits!',
      remaining: 0,
      resetAt: new Date(dailyResetTime).toISOString()
    };
  }

  // Get timestamps for this IP
  let timestamps = ipRequests.get(ip) || [];
  timestamps = timestamps.filter(t => now - t < ONE_HOUR_MS);
  ipRequests.set(ip, timestamps);

  if (timestamps.length >= MAX_PER_IP_PER_HOUR) {
    const oldest = timestamps[0];
    const resetAt = new Date(oldest + ONE_HOUR_MS).toISOString();
    return {
      allowed: false,
      reason: 'ip_hourly_limit',
      message: 'Rate limit: You have used your 3 live builds for this hour. Try one of our instant showcase builds while your quota resets.',
      remaining: 0,
      resetAt
    };
  }

  const remaining = MAX_PER_IP_PER_HOUR - timestamps.length;
  return {
    allowed: true,
    remaining,
    resetAt: new Date(now + ONE_HOUR_MS).toISOString()
  };
}

export function recordLiveBuild(ip = '127.0.0.1') {
  const now = Date.now();
  let timestamps = ipRequests.get(ip) || [];
  timestamps = timestamps.filter(t => now - t < ONE_HOUR_MS);
  timestamps.push(now);
  ipRequests.set(ip, timestamps);
  dailyCount++;
}

export function getRateLimitStatus(ip = '127.0.0.1') {
  const check = checkRateLimit(ip);
  return {
    ipLimitPerHour: MAX_PER_IP_PER_HOUR,
    ipRemainingThisHour: check.allowed ? check.remaining : 0,
    globalDailyCap: GLOBAL_DAILY_CAP,
    globalBuildsToday: dailyCount,
    globalCapRemaining: Math.max(0, GLOBAL_DAILY_CAP - dailyCount)
  };
}
