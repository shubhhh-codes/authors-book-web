import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { catalogService } from '@/lib/services/catalogService';
import { collectionQuerySchema } from '@/lib/validations';
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
 * GET /api/catalog/collections/[id]/products
 *
 * Returns paginated products belonging to a specific collection.
 *
 * Route param:
 *   id  – MongoDB _id of the Collection document
 *
 * Headers required:
 *   X-API-Key    – one of the keys in SHIPROCKET_API_KEYS
 *   X-Client-ID  – used for per-client rate limiting
 *
 * Query params:
 *   page, limit
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const keyCheck = validateAPIKey(request);
  if (!keyCheck.valid) {
    return createErrorResponse(keyCheck.error!, 401);
  }

  // ── Rate limit ────────────────────────────────────────────────────────────
  const clientId = request.headers.get('X-Client-ID') || 'anonymous';
  const rateLimit = validateRateLimit(`catalog-col-products:${clientId}`, 1000, 60_000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, error: 'Rate limit exceeded', retryAfter: rateLimit.retryAfter },
      { status: 429 }
    );
  }

  try {
    await connectDB();

    const { id: collectionId } = await params;
    const { searchParams } = new URL(request.url);

    // ── Validate ─────────────────────────────────────────────────────────────
    const validated = collectionQuerySchema.parse({
      collectionId,
      page: searchParams.get('page') ?? '1',
      limit: searchParams.get('limit') ?? '50',
    });

    // ── Fetch ────────────────────────────────────────────────────────────────
    const result = await catalogService.getProductsByCollection(
      validated.collectionId,
      validated.page,
      validated.limit
    );

    catalogService
      .logCatalogSync('products_by_collection', 'success', result.data.length)
      .catch(() => {});

    return createSuccessResponse({
      ...result,
      timestamp: new Date().toISOString(),
      endpoint: `/api/catalog/collections/${collectionId}/products`,
    });
  } catch (error) {
    console.error('[Catalog Products by Collection] Error:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to fetch products by collection';

    // Return 404 when the collection doesn't exist
    const statusCode = message.includes('not found') ? 404 : 500;

    catalogService
      .logCatalogSync('products_by_collection', 'failed', 0, 1, message)
      .catch(() => {});

    return createErrorResponse(message, statusCode, error);
  }
}

export async function OPTIONS() {
  return NextResponse.json(
    { methods: ['GET'], rateLimit: '1000 req/min per client' },
    { status: 200 }
  );
}
