import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@/lib/types';

interface FeaturedProductsProps {
  title?: string;
  products: Product[];
  viewAllHref?: string;
  /** Desktop columns, default 4 (mirrors products_to_show=4, columns_desktop=4) */
  columns?: number;
}

function ProductCard({ product }: { product: Product }) {
  const prodId = String(product.id ?? product._id ?? '');
  const firstImg = product.images?.[0] as any;
  const imageUrl = firstImg?.url || firstImg?.src || product.image?.src;
  const imageAlt = firstImg?.alt || product.title;
  const hasDiscount =
    product.compareAtPrice && product.compareAtPrice > product.price;
  const discountPct = hasDiscount
    ? Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100)
    : 0;

  return (
    <Link
      href={`/product/${product.handle || prodId}`}
      className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black rounded-xl"
      aria-label={`${product.title} – ₹${product.price}`}
    >
      <div className="relative aspect-[3/4] bg-gray-100 rounded-xl overflow-hidden mb-3">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={imageAlt || product.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg width="60" height="80" viewBox="0 0 60 80" fill="none" aria-hidden="true">
              <rect x="4" y="4" width="52" height="72" rx="4" fill="#e5e7eb" />
              <rect x="10" y="14" width="32" height="4" rx="2" fill="#9ca3af" />
              <rect x="10" y="22" width="24" height="3" rx="1.5" fill="#d1d5db" />
            </svg>
          </div>
        )}

        {hasDiscount && (
          <span className="absolute top-2 left-2 bg-black text-white text-xs font-bold px-2 py-1 rounded-full">
            -{discountPct}%
          </span>
        )}
      </div>

      <div className="space-y-1 px-0.5">
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug group-hover:text-black">
          {product.title}
        </h3>
        {product.vendor && (
          <p className="text-xs text-gray-500">{product.vendor}</p>
        )}
        <div className="flex items-center gap-2 pt-1">
          <span className="text-base font-bold text-gray-900">
            ₹{product.price.toLocaleString('en-IN')}
          </span>
          {hasDiscount && (
            <span className="text-sm text-gray-400 line-through">
              ₹{product.compareAtPrice!.toLocaleString('en-IN')}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function FeaturedProducts({
  title = 'APPEARED IN FILMS',
  products,
  viewAllHref = '/shop?tag=film-appeared',
  columns = 4,
}: FeaturedProductsProps) {
  if (!products.length) return null;

  // Build Tailwind col classes — must be explicit for Tailwind v4 JIT
  const colClass =
    columns === 4
      ? 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4'
      : columns === 3
      ? 'grid-cols-2 lg:grid-cols-3'
      : columns === 5
      ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'
      : 'grid-cols-2 lg:grid-cols-4';

  return (
    <section
      className="py-9 px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto"
      aria-labelledby="featured-products-heading"
    >
      <div className="flex items-baseline justify-between mb-8">
        <h2
          id="featured-products-heading"
          className="text-xl sm:text-2xl font-bold tracking-tight uppercase text-gray-900"
        >
          {title}
        </h2>
        <Link
          href={viewAllHref}
          className="text-sm font-medium text-gray-600 hover:text-black transition-colors underline underline-offset-4 decoration-gray-300 hover:decoration-black"
          aria-label={`View all products – ${title}`}
        >
          View all
        </Link>
      </div>

      {/* Product grid */}
      <ul
        className={`grid ${colClass} gap-4 sm:gap-6 list-none`}
        role="list"
        aria-label={`${title} products`}
      >
        {products.map((product) => (
          <li key={String(product.id ?? product._id)}>
            <ProductCard product={product} />
          </li>
        ))}
      </ul>
    </section>
  );
}
