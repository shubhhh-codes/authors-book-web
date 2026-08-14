import { connectDB } from '@/lib/db';
import Product from '@/lib/schemas/Product';
import { errorResponse, successResponse, getSafeErrorMessage } from '@/lib/validations';
import { toNumericId } from '@/lib/services/catalogTransform';
import { checkRateLimit } from '@/lib/rateLimit';
import { getCachedCatalogData } from '@/lib/services/catalogCache';

/**
 * GET /api/collections
 *
 * Returns all available collections derived from the product catalogue.
 * Collections are grouped by type: books (genre), bookmarks (tags), and authors (vendor).
 *
 * Query params:
 *   type  – filter to a specific group: "books" | "bookmarks" | "authors"
 */
export async function GET(request: Request): Promise<Response> {
  try {
    const rateLimit = await checkRateLimit(request, 120, 60000);
    if (!rateLimit.success) {
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
          },
        }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const typeFilter = searchParams.get('type') || '';

    const cacheKey = `catalog:collections:${typeFilter}`;

    const cachedCollections = await getCachedCatalogData(cacheKey, 3600, async () => {
      const [genres, bookmarkTags, vendors] = await Promise.all([
        Product.distinct('genre', { published: true, genre: { $nin: [null, ''] } }),
        Product.distinct('tags', {
          published: true,
          type: { $regex: /bookmark/i },
          tags: { $nin: [null, ''] },
        }),
        Product.distinct('vendor', { published: true, vendor: { $nin: [null, ''] } }),
      ]);

      const bookCollections = genres.map((genre: string) => {
        const handle = genre.toLowerCase().replace(/\s+/g, '-');
        const numericId = toNumericId(handle, 0);
        return {
          id: numericId,
          handle,
          name: genre,
          title: genre,
          body_html: `<p>Curated books in ${genre}</p>`,
          image: { src: '' },
          type: 'books',
          href: `/shop?genre=${encodeURIComponent(genre)}`,
          apiUrl: `/api/products/collection/${encodeURIComponent(handle)}?by=genre`,
        };
      });

      const bookmarkCollections = [...new Set<string>(bookmarkTags.flat())].map((tag: string) => {
        const handle = tag.toLowerCase().replace(/\s+/g, '-');
        const name = tag.charAt(0).toUpperCase() + tag.slice(1);
        const numericId = toNumericId(handle, 0);
        return {
          id: numericId,
          handle,
          name,
          title: name,
          body_html: `<p>Bookmarks tagged ${name}</p>`,
          image: { src: '' },
          type: 'bookmarks',
          href: `/shop?tag=${encodeURIComponent(tag)}&type=bookmark`,
          apiUrl: `/api/products/collection/${encodeURIComponent(handle)}?by=tag`,
        };
      });

      const authorCollections = vendors.map((vendor: string) => {
        const handle = vendor.toLowerCase().replace(/\s+/g, '-');
        const numericId = toNumericId(handle, 0);
        return {
          id: numericId,
          handle,
          name: vendor,
          title: vendor,
          body_html: `<p>Works by ${vendor}</p>`,
          image: { src: '' },
          type: 'authors',
          href: `/shop?vendor=${encodeURIComponent(vendor)}`,
          apiUrl: `/api/products/collection/${encodeURIComponent(handle)}?by=vendor`,
        };
      });

      let collections: unknown[] = [
        ...bookCollections,
        ...bookmarkCollections,
        ...authorCollections,
      ];

      if (typeFilter === 'books') collections = bookCollections;
      else if (typeFilter === 'bookmarks') collections = bookmarkCollections;
      else if (typeFilter === 'authors') collections = authorCollections;

      return {
        collections,
        meta: {
          total: collections.length,
          books: bookCollections.length,
          bookmarks: bookmarkCollections.length,
          authors: authorCollections.length,
        },
      };
    });

    return successResponse(cachedCollections);
  } catch (error) {
    console.error('[/api/collections] error:', error);
    return errorResponse(getSafeErrorMessage(error), 500);
  }
}
