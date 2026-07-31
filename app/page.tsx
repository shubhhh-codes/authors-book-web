/**
 * Homepage — Authors Book
 *
 * Liquid sections rendered (in order from templates/index.json):
 *  1. slideshow_8Npg49        → <CategoryGrid />
 *  2. collection_list_ccrQig  → <CollectionList title="BOOKS BY CATEGORY" />
 *  3. collection_list_mrq7g6  → <CollectionList title="BOOKMARKS BY CATEGORY" />
 *  4. collection_list_dHf8kB  → <CollectionList title="INDIAN AUTHORS" />
 *  5. featured_collection_RmUfLK → <FeaturedProducts title="APPEARED IN FILMS" />
 *  6. rich_text_xMFWPr        → <AboutUs />
 *  7. collapsible_content_LMGzH3 → <AccordionSection />
 *
 * Data flow:
 *  - Category grid: static (hardcoded from index.json)
 *  - Collections: fetched from MongoDB via /api/homepage
 *  - Featured products: fetched from MongoDB via /api/homepage
 *  - About / Accordion: static content from index.json
 */

export const dynamic = 'force-dynamic';
export const revalidate = 60; // ISR: revalidate every 60 seconds

import type { Metadata } from 'next';
import Navigation from '@/components/Navigation';
import CategoryGrid from '@/components/CategoryGrid';
import CollectionList from '@/components/CollectionList';
import FeaturedProducts from '@/components/FeaturedProducts';
import AboutUs from '@/components/AboutUs';
import AccordionSection from '@/components/AccordionSection';
import Footer from '@/components/Footer';
import type { Product, CollectionPreview } from '@/lib/types';
import { connectDB } from '@/lib/db';
import ProductModel from '@/lib/schemas/Product';

// ── SEO metadata (mirrors meta-tags.liquid Open Graph + JSON-LD pattern) ─────
export const metadata: Metadata = {
  title: 'Authors Book | Books & Bookmarks — Discover Your Next Read',
  description:
    '"If you don\'t like to read, you haven\'t found the right book yet." Explore curated books, Indian authors, and premium handcrafted bookmarks. Fast delivery across India.',
  openGraph: {
    title: 'Authors Book | Books & Bookmarks',
    description:
      'Curated books and premium handcrafted bookmarks for readers who love stories.',
    type: 'website',
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Authors Book | Books & Bookmarks',
    description:
      'Curated books and premium handcrafted bookmarks for readers who love stories.',
  },
};

// ─── Collection definitions (mirrors index.json collection-list blocks) ───────
const BOOK_COLLECTIONS: CollectionPreview[] = [
  { name: 'Non-Fiction', handle: 'non-fiction', href: '/shop?genre=non-fiction',
    bgColor: '#1a1a2e' },
  { name: 'Fiction',     handle: 'fiction',      href: '/shop?genre=fiction',
    bgColor: '#16213e' },
  { name: 'Romance',     handle: 'romance',       href: '/shop?genre=romance',
    bgColor: '#3d2b1f' },
  { name: 'Poetry',      handle: 'poetry',        href: '/shop?genre=poetry',
    bgColor: '#2d6a4f' },
  { name: 'Self-Help',   handle: 'self-help',     href: '/shop?genre=self-help',
    bgColor: '#533483' },
];

const BOOKMARK_COLLECTIONS: CollectionPreview[] = [
  { name: 'Filmy',  handle: 'filmy',  href: '/shop?tag=filmy&type=bookmark',  bgColor: '#0f3460' },
  { name: 'Anime',  handle: 'anime',  href: '/shop?tag=anime&type=bookmark',  bgColor: '#1b4332' },
  { name: 'Iconic', handle: 'iconic', href: '/shop?tag=iconic&type=bookmark', bgColor: '#6b4226' },
];

const AUTHOR_COLLECTIONS: CollectionPreview[] = [
  { name: 'Ruskin Bond',   handle: 'ruskin-bond',   href: '/shop?vendor=Ruskin+Bond',   bgColor: '#222222' },
  { name: 'Arundhati Roy', handle: 'arundhati-roy', href: '/shop?vendor=Arundhati+Roy', bgColor: '#111111' },
  { name: 'Jay Shetty',    handle: 'jay-shetty',    href: '/shop?vendor=Jay+Shetty',    bgColor: '#1a1a2e' },
];

// ─── Server-side data fetching ────────────────────────────────────────────────
async function getFilmProducts(): Promise<Product[]> {
  try {
    await connectDB();
    const docs = await ProductModel.find({
      published: true,
      $or: [
        { tags: { $in: ['film-appeared', 'film appeared', 'film-appear'] } },
        { tags: { $regex: /film/i } },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(4)
      .lean();

    return docs.map((d: unknown) => {
      const doc = d as Record<string, unknown>;
      return { ...doc, _id: String(doc._id) } as Product;
    });
  } catch (err) {
    console.error('[homepage] getFilmProducts error:', err);
    return [];
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function Home() {
  // Fetch film products in parallel with rendering static sections
  const filmProducts = await getFilmProducts();

  return (
    <>
      {/* Header (sticky) */}
      <Navigation />

      <main id="main-content">
        {/* Skip-to-content target for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 bg-black text-white px-4 py-2 rounded text-sm font-medium"
        >
          Skip to main content
        </a>

        {/*
         * Section 1: Book Category Grid
         * Liquid source: slideshow_8Npg49 (type: "slideshow")
         * 6 colour-coded cards in a masonry 2-col mobile / 4-col desktop grid
         */}
        <CategoryGrid />

        {/*
         * Section 2: Books by Category
         * Liquid source: collection_list_ccrQig (title: "BOOKS BY CATEGORY", columns_desktop: 4)
         */}
        <CollectionList
          title="BOOKS BY CATEGORY"
          collections={BOOK_COLLECTIONS}
          columns={4}
        />

        {/*
         * Section 3: Bookmarks by Category
         * Liquid source: collection_list_mrq7g6 (title: "BOOKMARKS BY CATEGORY", columns_desktop: 6)
         */}
        <CollectionList
          title="BOOKMARKS BY CATEGORY"
          collections={BOOKMARK_COLLECTIONS}
          columns={3}
        />

        {/*
         * Section 4: Indian Authors
         * Liquid source: collection_list_dHf8kB (title: "INDIAN AUTHORS", columns_desktop: 6)
         */}
        <CollectionList
          title="INDIAN AUTHORS"
          collections={AUTHOR_COLLECTIONS}
          columns={3}
        />

        {/*
         * Section 5: Appeared in Films (Featured Collection)
         * Liquid source: featured_collection_RmUfLK
         *   collection: "film-appeared", products_to_show: 4, columns_desktop: 4
         * Falls back gracefully to empty state if no matching products in DB.
         */}
        {filmProducts.length > 0 && (
          <FeaturedProducts
            title="APPEARED IN FILMS"
            products={filmProducts}
            viewAllHref="/shop?tag=film-appeared"
            columns={4}
          />
        )}

        {/*
         * Section 6: About Us (Rich Text)
         * Liquid source: rich_text_xMFWPr
         *   heading: "ABOUT US", full_width: true, content_alignment: "center"
         */}
        <AboutUs />

        {/*
         * Section 7: Miscellaneous Points (Collapsible Content)
         * Liquid source: collapsible_content_LMGzH3
         *   4 rows: Why We Here, Refund/Return, Privacy Policy, Contact Us
         */}
        <AccordionSection />
      </main>

      {/* Footer */}
      <Footer />
    </>
  );
}
