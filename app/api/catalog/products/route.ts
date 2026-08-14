import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { catalogService } from '@/lib/services/catalogService';
import { catalogQuerySchema } from '@/lib/validations';
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
 * GET /api/catalog/products
 *
 * Shiprocket-facing products endpoint secured by API key.
 *
 * Headers required:
 *   X-API-Key    – one of the keys in SHIPROCKET_API_KEYS
 *   X-Client-ID  – used for per-client rate limiting
 *
 * Query params:
 *   page, limit, sortBy (createdAt|price|stock), sortOrder (asc|desc), isActive
 */
export async function GET(request: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const keyCheck = validateAPIKey(request);
  if (!keyCheck.valid) {
    return createErrorResponse(keyCheck.error!, 401);
  }

  // ── Rate limit ────────────────────────────────────────────────────────────
  const clientId = request.headers.get('X-Client-ID') || 'anonymous';
  const rateLimit = validateRateLimit(`catalog-products:${clientId}`, 1000, 60_000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, error: 'Rate limit exceeded', retryAfter: rateLimit.retryAfter },
      { status: 429 }
    );
  }

  try {
    await connectDB();

    // ── Validate query params ────────────────────────────────────────────────
    const { searchParams } = new URL(request.url);
    const validated = catalogQuerySchema.parse({
      page: searchParams.get('page') ?? '1',
      limit: searchParams.get('limit') ?? '50',
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? 'desc',
      isActive: searchParams.get('isActive') ?? undefined,
    });

    // ── Fetch ────────────────────────────────────────────────────────────────
    const result = await catalogService.getProducts(
      validated.page,
      validated.limit,
      validated.sortBy ?? 'createdAt',
      validated.sortOrder,
      validated.isActive ?? true
    );

    // Async audit log — don't await so it doesn't slow the response
    catalogService.logCatalogSync('products', 'success', result.data.length).catch(() => {});

    return createSuccessResponse({
      ...result,
      timestamp: new Date().toISOString(),
      endpoint: '/api/catalog/products',
    });
  } catch (error) {
    console.error('[Catalog Products] Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch products';
    catalogService.logCatalogSync('products', 'failed', 0, 1, message).catch(() => {});
    return createErrorResponse(message, 500, error);
  }
}

export async function OPTIONS() {
  return NextResponse.json(
    { methods: ['GET'], rateLimit: '1000 req/min per client' },
    { status: 200 }
  );
}
