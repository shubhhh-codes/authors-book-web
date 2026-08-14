import { connectDB } from '@/lib/db';
import Product from '@/lib/schemas/Product';
import { errorResponse, successResponse, escapeRegex, getSafeErrorMessage } from '@/lib/validations';
import { formatProductForShiprocket, validateVariantIdConsistency } from '@/lib/services/catalogTransform';
import { checkRateLimit } from '@/lib/rateLimit';
import { getCachedCatalogData } from '@/lib/services/catalogCache';
import { logCatalogEvent } from '@/lib/logger';

export async function GET(request: Request): Promise<Response> {
  try {
    // 1. Rate Limiting: 120 requests/minute per client IP
    const rateLimit = await checkRateLimit(request, 120, 60000);
    if (!rateLimit.success) {
      logCatalogEvent({
        type: 'rate_limited',
        error: 'Rate limit exceeded on /api/products',
      });
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Rate limit exceeded. Please try again shortly.',
          retryAfter: rateLimit.reset,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(rateLimit.reset),
            'X-RateLimit-Limit': String(rateLimit.limit),
            'X-RateLimit-Remaining': String(rateLimit.remaining),
          },
        }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '12'), 100);
    const skip = (page - 1) * limit;

    const type = searchParams.get('type');
    const genre = searchParams.get('genre');
    const tag = searchParams.get('tag');
    const vendor = searchParams.get('vendor');
    const search = searchParams.get('search');

    const cacheKey = `catalog:products:${page}:${limit}:${type || ''}:${genre || ''}:${tag || ''}:${vendor || ''}:${search || ''}`;

    const cachedResult = await getCachedCatalogData(cacheKey, 1800, async () => {
      const query: Record<string, unknown> = { published: true };

      if (type) {
        query.type = { $regex: new RegExp(`^${escapeRegex(type)}`, 'i') };
      }

      if (genre) {
        const genrePattern = escapeRegex(genre).replace(/-/g, '[-\\s]?');
        query.genre = { $regex: new RegExp(genrePattern, 'i') };
      }

      if (vendor) {
        const vendorClean = vendor.replace(/\+/g, ' ');
        query.vendor = { $regex: new RegExp(escapeRegex(vendorClean), 'i') };
      }

      if (tag) {
        const tagPattern = escapeRegex(tag).replace(/-/g, '[-\\s]?');
        const tagRegex = new RegExp(tagPattern, 'i');
        query.$or = [
          { tags: { $elemMatch: { $regex: tagRegex } } },
          { tags: tagRegex },
          { genre: tagRegex },
          { category: tagRegex },
        ];
      }

      if (search) {
        const searchRegex = new RegExp(escapeRegex(search), 'i');
        const searchOr = [
          { title: searchRegex },
          { description: searchRegex },
          { vendor: searchRegex },
          { genre: searchRegex },
          { tags: searchRegex },
        ];

        if (query.$or) {
          query.$and = [{ $or: query.$or }, { $or: searchOr }];
          delete query.$or;
        } else {
          query.$or = searchOr;
        }
      }

      const products = await Product.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean();

      const total = await Product.countDocuments(query);

      // Format products with pure numeric IDs for Shiprocket and store compatibility
      const formattedProducts = products.map((p: any) => formatProductForShiprocket(p));

      return {
        products: formattedProducts,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      };
    });

    return successResponse(cachedResult);
  } catch (error) {
    console.error('Products API error:', error);
    return errorResponse(getSafeErrorMessage(error), 500);
  }
}
