import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Product from '@/lib/schemas/Product';
import type { CollectionPreview } from '@/lib/types';

// ─── Collection → MongoDB query mappings ────────────────────────────────────
// These map the Shopify collection handles from index.json to MongoDB filters.

const BOOK_COLLECTIONS = [
  { name: 'Non-Fiction',  handle: 'non-fiction',  href: '/shop?genre=non-fiction',  filter: { genre: { $regex: /non.fiction/i } } },
  { name: 'Fiction',      handle: 'fiction',       href: '/shop?genre=fiction',       filter: { genre: { $regex: /fiction/i, $not: /non.fiction/i } } },
  { name: 'Romance',      handle: 'romance',       href: '/shop?genre=romance',       filter: { genre: { $regex: /romance/i } } },
  { name: 'Poetry',       handle: 'poetry',        href: '/shop?genre=poetry',        filter: { genre: { $regex: /poetry/i } } },
  { name: 'Self-Help',    handle: 'self-help',     href: '/shop?genre=self-help',     filter: { genre: { $regex: /self.help/i } } },
];

const BOOKMARK_COLLECTIONS = [
  { name: 'Filmy',   handle: 'filmy',  href: '/shop?tag=filmy&type=bookmark',  filter: { type: { $regex: /bookmark/i }, tags: 'filmy' } },
  { name: 'Anime',   handle: 'anime',  href: '/shop?tag=anime&type=bookmark',  filter: { type: { $regex: /bookmark/i }, tags: 'anime' } },
  { name: 'Iconic',  handle: 'iconic', href: '/shop?tag=iconic&type=bookmark', filter: { type: { $regex: /bookmark/i }, tags: 'iconic' } },
];

const AUTHOR_COLLECTIONS = [
  { name: 'Ruskin Bond',    handle: 'ruskin-bond',    href: '/shop?vendor=Ruskin+Bond',    filter: { vendor: { $regex: /ruskin.bond/i } } },
  { name: 'Arundhati Roy',  handle: 'arundhati-roy',  href: '/shop?vendor=Arundhati+Roy',  filter: { vendor: { $regex: /arundhati.roy/i } } },
  { name: 'Jay Shetty',     handle: 'jay-shetty',     href: '/shop?vendor=Jay+Shetty',     filter: { vendor: { $regex: /jay.shetty/i } } },
];

async function getCollectionCount(filter: Record<string, unknown>): Promise<number> {
  try {
    return await Product.countDocuments({ published: true, ...filter });
  } catch {
    return 0;
  }
}

export async function GET() {
  try {
    await connectDB();

    // Run all queries in parallel for performance
    const [
      filmProducts,
      bookCounts,
      bookmarkCounts,
      authorCounts,
    ] = await Promise.all([
      // Featured: Appeared in Films — 4 products
      Product.find({ published: true, tags: { $in: ['film-appeared', 'film appeared'] } })
        .sort({ createdAt: -1 })
        .limit(4)
        .lean(),

      // Book collection counts
      Promise.all(BOOK_COLLECTIONS.map((c) => getCollectionCount(c.filter))),

      // Bookmark collection counts
      Promise.all(BOOKMARK_COLLECTIONS.map((c) => getCollectionCount(c.filter))),

      // Author collection counts
      Promise.all(AUTHOR_COLLECTIONS.map((c) => getCollectionCount(c.filter))),
    ]);

    // Build CollectionPreview arrays (image will be supplied when available)
    const bookCollections: CollectionPreview[] = BOOK_COLLECTIONS.map((c, i) => ({
      name: c.name,
      handle: c.handle,
      href: c.href,
      productCount: bookCounts[i],
    }));

    const bookmarkCollections: CollectionPreview[] = BOOKMARK_COLLECTIONS.map((c, i) => ({
      name: c.name,
      handle: c.handle,
      href: c.href,
      productCount: bookmarkCounts[i],
    }));

    const authorCollections: CollectionPreview[] = AUTHOR_COLLECTIONS.map((c, i) => ({
      name: c.name,
      handle: c.handle,
      href: c.href,
      productCount: authorCounts[i],
    }));

    return NextResponse.json({
      filmProducts: filmProducts.map((p: unknown) => {
        const prod = p as Record<string, unknown>;
        return {
          ...prod,
          _id: String(prod._id),
        };
      }),
      bookCollections,
      bookmarkCollections,
      authorCollections,
    });
  } catch (error) {
    console.error('[/api/homepage] error:', error);
    return NextResponse.json(
      { error: 'Failed to load homepage data' },
      { status: 500 }
    );
  }
}
