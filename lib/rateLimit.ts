/**
 * Rate Limiting Implementation
 * 
 * Production: Use Redis for distributed rate limiting
 * Development: In-memory store (resets on server restart)
 * 
 * Current limits:
 * - Checkout: 5 requests per IP per minute
 * - Payment verification: 10 requests per IP per minute
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting (production should use Redis)
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Check if request exceeds rate limit
 * Returns: { allowed: boolean, remaining: number }
 */
export function checkRateLimit(
  identifier: string, // Usually IP address
  limit: number = 5,
  windowMs: number = 60 * 1000 // 1 minute
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // First request or window expired
  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return { allowed: true, remaining: limit - 1 };
  }

  // Within rate limit
  if (entry.count < limit) {
    entry.count++;
    return { allowed: true, remaining: limit - entry.count };
  }

  // Exceeded rate limit
  return { allowed: false, remaining: 0 };
}

/**
 * Get client IP from request
 * Works with: localhost, Vercel, Cloudflare, proxies
 */
export function getClientIp(request: Request): string {
  // Check for proxied IP headers (Vercel, Cloudflare, etc.)
  const xForwardedFor = request.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    // x-forwarded-for can be: client, proxy1, proxy2
    return xForwardedFor.split(',')[0].trim();
  }

  // Fallback headers
  const xRealIp = request.headers.get('x-real-ip');
  if (xRealIp) return xRealIp;

  // For localhost/development
  return 'unknown';
}

/**
 * Cleanup old entries to prevent memory leaks
 * Call periodically (e.g., every hour)
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  let removed = 0;

  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
      removed++;
    }
  }

  if (removed > 0) {
    console.log(`Rate limit cleanup: removed ${removed} expired entries`);
  }
}

// Run cleanup every hour
if (typeof globalThis !== 'undefined' && !globalThis._rateLimitCleanupScheduled) {
  globalThis._rateLimitCleanupScheduled = true;
  setInterval(cleanupRateLimitStore, 60 * 60 * 1000);
}

declare global {
  var _rateLimitCleanupScheduled: boolean | undefined;
}
