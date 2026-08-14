/**
 * High-Performance Sliding Window Rate Limiter
 *
 * Provides IP-based sliding window rate limiting for public, checkout, and catalog APIs.
 * Supports in-memory sliding log with automated garbage collection.
 */

interface RateLimitRecord {
  timestamps: number[];
}

const ipStore = new Map<string, RateLimitRecord>();

// Cleanup stale entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of ipStore.entries()) {
      record.timestamps = record.timestamps.filter((t) => now - t < 120000);
      if (record.timestamps.length === 0) {
        ipStore.delete(key);
      }
    }
  }, 300000);
}

export interface RateLimitResult {
  success: boolean;
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number; // seconds until reset
  resetTime: number; // timestamp in ms
}

/**
 * Extract client IP from a standard Request object.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  return (forwarded ? forwarded.split(',')[0].trim() : (realIp || '127.0.0.1')).trim();
}

/**
 * Limit incoming requests per client IP or custom identifier key.
 *
 * @param keyOrRequest - Next.js Request or custom string key (e.g. `checkout:${ip}`)
 * @param limit - Maximum requests allowed per window (default: 100)
 * @param windowMs - Window duration in milliseconds (default: 60,000ms = 1 min)
 */
export function checkRateLimit(
  keyOrRequest: Request | string,
  limit: number = 100,
  windowMs: number = 60000
): RateLimitResult {
  const key = typeof keyOrRequest === 'string' ? keyOrRequest : getClientIp(keyOrRequest);

  const now = Date.now();
  const windowStart = now - windowMs;

  let record = ipStore.get(key);
  if (!record) {
    record = { timestamps: [] };
    ipStore.set(key, record);
  }

  // Filter timestamps within current window
  record.timestamps = record.timestamps.filter((t) => t > windowStart);

  if (record.timestamps.length >= limit) {
    const oldest = record.timestamps[0];
    const resetSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    return {
      success: false,
      allowed: false,
      limit,
      remaining: 0,
      reset: resetSeconds,
      resetTime: oldest + windowMs,
    };
  }

  record.timestamps.push(now);
  const remaining = Math.max(0, limit - record.timestamps.length);
  const resetSeconds = Math.ceil(windowMs / 1000);

  return {
    success: true,
    allowed: true,
    limit,
    remaining,
    reset: resetSeconds,
    resetTime: now + windowMs,
  };
}
