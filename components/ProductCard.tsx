import { memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/lib/types';

// ⚡ Bolt: Wrapped in React.memo to prevent unnecessary re-renders in large lists
// This avoids re-rendering unaffected cards when cart state or parent filters update.
const ProductCard = memo(function ProductCard({ product }: { product: Product }) {
  const image = product.images?.[0];
  const isSoldOut =
    product.inventory?.quantity !== undefined && product.inventory.quantity <= 0;
  const hasDiscount =
    product.compareAtPrice && product.compareAtPrice > product.price;
  const discountPct = hasDiscount
    ? Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100)
    : 0;

  return (
    <Link
      href={`/product/${product.handle || product._id}`}
      className="group block border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
      aria-label={`${product.title} – ₹${product.price}`}
    >
      {/* Image */}
      <div className="relative h-64 bg-gray-100 overflow-hidden">
        {image ? (
          <Image
            src={image.url}
            alt={image.alt || product.title}
            fill
            className={`object-cover transition-transform duration-500 ${isSoldOut ? 'opacity-60 grayscale-[30%]' : 'group-hover:scale-105'}`}
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg width="60" height="80" viewBox="0 0 60 80" fill="none" aria-hidden="true">
              <rect x="4" y="4" width="52" height="72" rx="4" fill="#e5e7eb" />
              <rect x="10" y="14" width="32" height="4" rx="2" fill="#9ca3af" />
              <rect x="10" y="22" width="24" height="3" rx="1.5" fill="#d1d5db" />
            </svg>
          </div>
        )}
        {isSoldOut ? (
          <span className="absolute top-2 left-2 bg-gray-900/90 text-white text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
            Sold Out
          </span>
        ) : hasDiscount ? (
          <span className="absolute top-2 left-2 bg-black text-white text-xs font-bold px-2 py-1 rounded-full">
            -{discountPct}%
          </span>
        ) : null}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-sm text-gray-900 line-clamp-2">
          {product.title}
        </h3>

        <div className="mt-3 flex items-center gap-2">
          <span className="text-lg font-bold text-gray-900">
            ₹{product.price.toLocaleString('en-IN')}
          </span>
          {hasDiscount && (
            <span className="text-sm text-gray-500 line-through">
              ₹{product.compareAtPrice!.toLocaleString('en-IN')}
            </span>
          )}
        </div>

        <button
          className={`mt-4 w-full py-2 rounded-lg text-sm font-medium transition-colors ${
            isSoldOut
              ? 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              : 'bg-black text-white hover:bg-gray-800'
          }`}
          type="button"
          aria-label={`View details for ${product.title}`}
        >
          {isSoldOut ? 'Out of Stock' : 'View Details'}
        </button>
      </div>
    </Link>
  );
});

export default ProductCard;
