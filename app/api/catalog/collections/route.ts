import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { catalogService } from '@/lib/services/catalogService';
import { formatCollectionForShiprocket } from '@/lib/services/catalogTransform';
import {
  createAPIKeyValidator,
  validateRateLimit,
  verifyHMAC,
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
 *   X-Api-Key             – one of the keys in SHIPROCKET_API_KEYS
 *   X-Api-HMAC-SHA256     – HMAC signature (optional in dev)
 *   X-Client-ID           – used for per-client rate limiting
 */
export async function GET(request: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const keyCheck = validateAPIKey(request);
  if (!keyCheck.valid) {
    return createErrorResponse(keyCheck.error!, 401);
  }

  // ── HMAC verification (when secret is configured) ─────────────────────────
  const hmacHeader = request.headers.get('X-Api-HMAC-SHA256');
  const secretKey = process.env.SRC_SECRET_KEY;
  if (hmacHeader && secretKey) {
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    if (!verifyHMAC(queryString, hmacHeader, secretKey)) {
      return createErrorResponse('Invalid HMAC signature', 401);
    }
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

    // Format for Shiprocket
    const collections = result.data.map((c: any) => formatCollectionForShiprocket(c));

    catalogService.logCatalogSync('collections', 'success', result.data.length).catch(() => {});

    return createSuccessResponse({
      collections,
      total: result.total,
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

