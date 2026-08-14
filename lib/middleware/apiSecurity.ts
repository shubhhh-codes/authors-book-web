/**
 * API Security Middleware
 * Provides API key validation, rate limiting, and HMAC verification
 * for the Shiprocket Catalog API endpoints.
 *
 * Note: The in-memory rate limit store resets on server restart.
 * For multi-instance deployments, swap it for Redis (e.g. Upstash).
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// ── In-memory rate limit store ────────────────────────────────────────────────

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Clean up expired records every 5 minutes to prevent memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (now > record.resetAt) rateLimitStore.delete(key);
    }
  }, 5 * 60 * 1000);
}

// ── API Key Validation ────────────────────────────────────────────────────────

export function createAPIKeyValidator(validKeys: string[]) {
  const keySet = new Set(validKeys.filter(Boolean)); // filter out empty strings

  return (request: NextRequest): { valid: boolean; error?: string } => {
    if (keySet.size === 0) {
      // No keys configured → open access (dev/local only)
      if (process.env.NODE_ENV === 'production') {
        console.error('[Security] SHIPROCKET_API_KEYS is not configured in production!');
        return { valid: false, error: 'API key validation misconfigured' };
      }
      console.warn('[Security] SHIPROCKET_API_KEYS not set — skipping key check (dev mode)');
      return { valid: true };
    }

    const apiKey = request.headers.get('X-API-Key');
    if (!apiKey || !keySet.has(apiKey)) {
      return { valid: false, error: 'Invalid or missing API key' };
    }

    return { valid: true };
  };
}

// ── Rate Limiting ─────────────────────────────────────────────────────────────

export function validateRateLimit(
  identifier: string,
  limit: number = 100,
  windowMs: number = 60_000
): { allowed: boolean; remaining: number; retryAfter?: number } {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record || now > record.resetAt) {
    rateLimitStore.set(identifier, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (record.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.ceil((record.resetAt - now) / 1000),
    };
  }

  record.count++;
  return { allowed: true, remaining: limit - record.count };
}

// ── Utility: API Key Generation ───────────────────────────────────────────────

/** Generate a cryptographically secure 64-char hex API key */
export function generateAPIKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

// ── HMAC Verification ─────────────────────────────────────────────────────────

export function verifyHMAC(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const computed = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return computed === signature;
}

// ── Response Helpers ──────────────────────────────────────────────────────────

export function createErrorResponse(
  message: string,
  statusCode: number = 400,
  details?: unknown
) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      // Only expose internals in dev – never in production
      ...(process.env.NODE_ENV === 'development' && details !== undefined
        ? { details: details instanceof Error ? details.message : details }
        : {}),
    },
    { status: statusCode }
  );
}

export function createSuccessResponse(data: unknown, statusCode: number = 200) {
  return NextResponse.json({ success: true, data }, { status: statusCode });
}
