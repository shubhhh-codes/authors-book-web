import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { catalogService } from '@/lib/services/catalogService';
import {
  createAPIKeyValidator,
  validateRateLimit,
  createErrorResponse,
  createSuccessResponse,
} from '@/lib/middleware/apiSecurity';

const validateAPIKey = createAPIKeyValidator(
  (process.env.SHIPROCKET_API_KEYS || '').split(',')
);

/**
 * GET /api/catalog/collections
 *
 * Returns all active collections for Shiprocket catalog sync.
 *
 * Headers required:
 *   X-API-Key    – one of the keys in SHIPROCKET_API_KEYS
 *   X-Client-ID  – used for per-client rate limiting
 */
export async function GET(request: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const keyCheck = validateAPIKey(request);
  if (!keyCheck.valid) {
    return createErrorResponse(keyCheck.error!, 401);
  }

  // ── Rate limit ────────────────────────────────────────────────────────────
  const clientId = request.headers.get('X-Client-ID') || 'anonymous';
  const rateLimit = validateRateLimit(`catalog-collections:${clientId}`, 1000, 60_000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, error: 'Rate limit exceeded', retryAfter: rateLimit.retryAfter },
      { status: 429 }
    );
  }

  try {
    await connectDB();

    const result = await catalogService.getCollections(true);

    catalogService.logCatalogSync('collections', 'success', result.data.length).catch(() => {});

    return createSuccessResponse({
      ...result,
      timestamp: new Date().toISOString(),
      endpoint: '/api/catalog/collections',
    });
  } catch (error) {
    console.error('[Catalog Collections] Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch collections';
    catalogService.logCatalogSync('collections', 'failed', 0, 1, message).catch(() => {});
    return createErrorResponse(message, 500, error);
  }
}

export async function OPTIONS() {
  return NextResponse.json(
    { methods: ['GET'], rateLimit: '1000 req/min per client' },
    { status: 200 }
  );
}
