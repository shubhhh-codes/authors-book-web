import { connectDB } from '@/lib/db';
import Product from '@/lib/schemas/Product';
import { errorResponse, successResponse, escapeRegex, getSafeErrorMessage } from '@/lib/validations';
import { formatProductForShiprocket } from '@/lib/services/catalogTransform';

/**
 * GET /api/products/collection/[handle]
 *
 * Returns all published products belonging to a specific collection.
 *
 * Route param:
 *   handle  – the collection slug (e.g. "non-fiction", "romance", "ruskin-bond")
 *
 * Query params:
 *   by      – how to match: "genre" | "tag" | "vendor" | "type"  (default: auto-detect)
 *   page    – page number (default: 1)
 *   limit   – items per page, max 100 (default: 20)
 *   sort    – "newest" | "price_asc" | "price_desc" (default: "newest")
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ handle: string }> }
): Promise<Response> {
  try {
    await connectDB();

    const { handle } = await params;
    const { searchParams } = new URL(request.url);

    const by = searchParams.get('by') || 'auto';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const sort = searchParams.get('sort') || 'newest';
    const skip = (page - 1) * limit;

    // Convert URL slug back to a usable search term
    const term = handle.replace(/-/g, ' ');
    const safeRegex = new RegExp(escapeRegex(term), 'i');

    // Build MongoDB filter based on 'by' param or auto-detect
    let filter: Record<string, unknown> = { published: true };

    if (by === 'genre' || by === 'auto') {
      filter = { ...filter, genre: safeRegex };
    } else if (by === 'tag') {
      filter = { ...filter, tags: { $elemMatch: { $regex: safeRegex } } };
    } else if (by === 'vendor') {
      filter = { ...filter, vendor: safeRegex };
    } else if (by === 'type') {
      filter = { ...filter, type: safeRegex };
    }

    const sortOption: Record<string, 1 | -1> =
      sort === 'price_asc'  ? { price: 1 } :
      sort === 'price_desc' ? { price: -1 } :
      { createdAt: -1 };

    const [products, total] = await Promise.all([
      Product.find(filter).skip(skip).limit(limit).sort(sortOption).lean(),
      Product.countDocuments(filter),
    ]);

    const formatProduct = (p: any) => {
      const formatted = formatProductForShiprocket(p);
      return {
        ...p,
        _id: String(p._id),
        id: formatted.id,
        body_html: formatted.body_html,
        product_type: formatted.product_type,
        status: formatted.status,
        variants: formatted.variants,
        image: formatted.image,
      };
    };

    if (total === 0 && by === 'auto') {
      // Fallback: try tag match
      const tagFilter = {
        published: true,
        tags: { $elemMatch: { $regex: safeRegex } },
      };
      const tagProducts = await Product.find(tagFilter)
        .skip(skip)
        .limit(limit)
        .sort(sortOption)
        .lean();
      const tagTotal = await Product.countDocuments(tagFilter);

      return successResponse({
        collection: handle,
        matchedBy: 'tag',
        products: tagProducts.map(formatProduct),
        pagination: { total: tagTotal, page, limit, pages: Math.ceil(tagTotal / limit) },
      });
    }

    return successResponse({
      collection: handle,
      matchedBy: by,
      products: products.map(formatProduct),
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('[/api/products/collection] error:', error);
    return errorResponse(getSafeErrorMessage(error), 500);
  }
}
