import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/lib/types';

export default function ProductCard({ product }: { product: Product }) {
  const image = product.images?.[0];
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
            className="object-cover transition-transform duration-500 group-hover:scale-105"
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
        {hasDiscount && (
          <span className="absolute top-2 left-2 bg-black text-white text-xs font-bold px-2 py-1 rounded-full">
            -{discountPct}%
          </span>
        )}
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
          className="mt-4 w-full bg-black text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          type="button"
          aria-label={`View details for ${product.title}`}
        >
          View Details
        </button>
      </div>
    </Link>
  );
}
