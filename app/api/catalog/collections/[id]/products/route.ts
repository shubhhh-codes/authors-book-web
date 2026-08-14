import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { catalogService } from '@/lib/services/catalogService';
import { collectionQuerySchema } from '@/lib/validations';
import { formatProductForShiprocket, formatCollectionForShiprocket } from '@/lib/services/catalogTransform';
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
 * GET /api/catalog/collections/[id]/products
 *
 * Returns paginated products belonging to a specific collection
 * for Shiprocket catalog sync.
 *
 * Route param:
 *   id  – MongoDB _id of the Collection document
 *
 * Headers required:
 *   X-Api-Key             – one of the keys in SHIPROCKET_API_KEYS
 *   X-Api-HMAC-SHA256     – HMAC signature (optional in dev)
 *   X-Client-ID           – used for per-client rate limiting
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

    // Format for Shiprocket
    const products = result.data.map((p: any) => formatProductForShiprocket(p));
    const collection = formatCollectionForShiprocket(result.collection as Record<string, any>);

    catalogService
      .logCatalogSync('products_by_collection', 'success', result.data.length)
      .catch(() => {});

    return createSuccessResponse({
      collection,
      products,
      pagination: result.pagination,
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

