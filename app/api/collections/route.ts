import { connectDB } from '@/lib/db';
import Product from '@/lib/schemas/Product';
import { errorResponse, successResponse, escapeRegex, getSafeErrorMessage } from '@/lib/validations';

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
    await connectDB();

    const { searchParams } = new URL(request.url);
    const typeFilter = searchParams.get('type'); // optional: "books" | "bookmarks" | "authors"

    // ── Derive collections dynamically from DB ────────────────────────────────

    const [genres, bookmarkTags, vendors] = await Promise.all([
      // Distinct genres → book collections
      Product.distinct('genre', { published: true, genre: { $nin: [null, ''] } }),

      // Distinct tags on bookmark-type products → bookmark collections
      Product.distinct('tags', {
        published: true,
        type: { $regex: /bookmark/i },
        tags: { $nin: [null, ''] },
      }),

      // Distinct vendors → author collections
      Product.distinct('vendor', { published: true, vendor: { $nin: [null, ''] } }),
    ]);

    const bookCollections = genres.map((genre: string) => ({
      handle: genre.toLowerCase().replace(/\s+/g, '-'),
      name: genre,
      type: 'books',
      href: `/shop?genre=${encodeURIComponent(genre)}`,
      apiUrl: `/api/products/collection/${encodeURIComponent(genre.toLowerCase().replace(/\s+/g, '-'))}?by=genre`,
    }));

    const bookmarkCollections = [...new Set<string>(bookmarkTags.flat())].map((tag: string) => ({
      handle: tag.toLowerCase().replace(/\s+/g, '-'),
      name: tag.charAt(0).toUpperCase() + tag.slice(1),
      type: 'bookmarks',
      href: `/shop?tag=${encodeURIComponent(tag)}&type=bookmark`,
      apiUrl: `/api/products/collection/${encodeURIComponent(tag.toLowerCase().replace(/\s+/g, '-'))}?by=tag`,
    }));

    const authorCollections = vendors.map((vendor: string) => ({
      handle: vendor.toLowerCase().replace(/\s+/g, '-'),
      name: vendor,
      type: 'authors',
      href: `/shop?vendor=${encodeURIComponent(vendor)}`,
      apiUrl: `/api/products/collection/${encodeURIComponent(vendor.toLowerCase().replace(/\s+/g, '-'))}?by=vendor`,
    }));

    // Apply optional type filter
    let collections: unknown[] = [
      ...bookCollections,
      ...bookmarkCollections,
      ...authorCollections,
    ];

    if (typeFilter === 'books') collections = bookCollections;
    else if (typeFilter === 'bookmarks') collections = bookmarkCollections;
    else if (typeFilter === 'authors') collections = authorCollections;

    return successResponse({
      collections,
      meta: {
        total: collections.length,
        books: bookCollections.length,
        bookmarks: bookmarkCollections.length,
        authors: authorCollections.length,
      },
    });
  } catch (error) {
    console.error('[/api/collections] error:', error);
    return errorResponse(getSafeErrorMessage(error), 500);
  }
}
