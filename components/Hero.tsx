/**
 * Hero.tsx — Legacy stub, superseded by CategoryGrid on the homepage.
 * Kept for compatibility if imported elsewhere.
 */
import Link from 'next/link';

export default function Hero() {
  return (
    <section className="bg-gradient-to-b from-gray-50 to-white py-20">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
          authorsbook
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Hand-designed bookmarks &amp; literary treasures.
          Discover curated books and premium bookmarks for readers who love stories.
        </p>
        <Link
          href="/shop"
          className="inline-block bg-black text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors font-medium"
        >
          Start Shopping
        </Link>
      </div>
    </section>
  );
}
