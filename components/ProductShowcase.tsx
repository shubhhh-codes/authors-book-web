'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@/lib/types';

interface ProductShowcaseProps {
  initialProducts?: Product[];
}

export default function ProductShowcase({ initialProducts = [] }: ProductShowcaseProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(initialProducts.length === 0);
  const [activeTab, setActiveTab] = useState<'all' | 'books' | 'bookmarks'>('all');
  const [activeFilter, setActiveFilter] = useState<string>('all');

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const res = await fetch('/api/products?limit=24');
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products || []);
        }
      } catch (err) {
        console.error('Failed to fetch showcase products:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  // Filter products by tab (type) and filter chip (tag/genre)
  const filteredProducts = products.filter((product) => {
    // Type tab filter
    if (activeTab === 'books' && product.type !== 'book' && product.type !== 'Book') return false;
    if (activeTab === 'bookmarks' && product.type !== 'bookmark' && product.type !== 'Bookmark') return false;

    // Sub-filter chips
    if (activeFilter === 'bestseller') {
      return product.tags?.some((t) => t.toLowerCase().includes('best') || t.toLowerCase().includes('seller'));
    }
    if (activeFilter === 'film') {
      return product.tags?.some((t) => t.toLowerCase().includes('film'));
    }
    if (activeFilter === '3d') {
      return product.tags?.some((t) => t.toLowerCase().includes('3d'));
    }
    if (activeFilter === 'iconic') {
      return product.tags?.some((t) => t.toLowerCase().includes('iconic'));
    }

    return true;
  });

  return (
    <section
      id="product-showcase"
      className="w-full py-16 sm:py-24 bg-[var(--paper)] text-[var(--ink)] font-[family-name:var(--serif)]"
      aria-labelledby="showcase-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-[9px] font-semibold uppercase tracking-widest text-[var(--ink-soft)] mb-3 font-[family-name:var(--sans)]">
            Explore Collection
          </p>
          <h2
            id="showcase-heading"
            className="text-3xl sm:text-5xl font-normal tracking-tight text-[var(--ink)] mb-4"
          >
            Books &amp; Bookmarks
          </h2>
          <div className="w-16 h-px bg-[var(--hairline)] mx-auto mb-6" aria-hidden="true" />
          <p className="text-base sm:text-lg text-[var(--ink-soft)] leading-relaxed">
            Handcrafted editions, iconic bookmarks, and curated literary treasures.
          </p>
        </div>

        {/* Category Switcher Tabs */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex p-1 bg-[var(--paper-light)] border border-[var(--hairline)] rounded-full text-xs font-[family-name:var(--sans)]">
            <button
              type="button"
              onClick={() => { setActiveTab('all'); setActiveFilter('all'); }}
              className={`px-5 py-2.5 rounded-full font-semibold uppercase tracking-wider transition-all duration-200 ${
                activeTab === 'all'
                  ? 'bg-[var(--ink)] text-[var(--paper)] shadow-sm'
                  : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
              }`}
            >
              All Items ({products.length})
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('books'); setActiveFilter('all'); }}
              className={`px-5 py-2.5 rounded-full font-semibold uppercase tracking-wider transition-all duration-200 ${
                activeTab === 'books'
                  ? 'bg-[var(--ink)] text-[var(--paper)] shadow-sm'
                  : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
              }`}
            >
              Books
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('bookmarks'); setActiveFilter('all'); }}
              className={`px-5 py-2.5 rounded-full font-semibold uppercase tracking-wider transition-all duration-200 ${
                activeTab === 'bookmarks'
                  ? 'bg-[var(--ink)] text-[var(--paper)] shadow-sm'
                  : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
              }`}
            >
              Bookmarks
            </button>
          </div>
        </div>

        {/* Sub-filter Tags */}
        <div className="flex flex-wrap justify-center gap-2 mb-12 text-xs font-[family-name:var(--sans)]">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-1.5 rounded-full border transition-colors ${
              activeFilter === 'all'
                ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)] font-semibold'
                : 'border-[var(--hairline)] bg-[var(--paper-light)] text-[var(--ink-soft)] hover:border-[var(--ink)]'
            }`}
          >
            All Collections
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('bestseller')}
            className={`px-4 py-1.5 rounded-full border transition-colors ${
              activeFilter === 'bestseller'
                ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)] font-semibold'
                : 'border-[var(--hairline)] bg-[var(--paper-light)] text-[var(--ink-soft)] hover:border-[var(--ink)]'
            }`}
          >
            Best Sellers
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('film')}
            className={`px-4 py-1.5 rounded-full border transition-colors ${
              activeFilter === 'film'
                ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)] font-semibold'
                : 'border-[var(--hairline)] bg-[var(--paper-light)] text-[var(--ink-soft)] hover:border-[var(--ink)]'
            }`}
          >
            Appeared in Films
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('3d')}
            className={`px-4 py-1.5 rounded-full border transition-colors ${
              activeFilter === '3d'
                ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)] font-semibold'
                : 'border-[var(--hairline)] bg-[var(--paper-light)] text-[var(--ink-soft)] hover:border-[var(--ink)]'
            }`}
          >
            3D Bookmarks
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('iconic')}
            className={`px-4 py-1.5 rounded-full border transition-colors ${
              activeFilter === 'iconic'
                ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)] font-semibold'
                : 'border-[var(--hairline)] bg-[var(--paper-light)] text-[var(--ink-soft)] hover:border-[var(--ink)]'
            }`}
          >
            Iconic Series
          </button>
        </div>

        {/* Product Cards Grid */}
        {loading ? (
          <div className="py-20 text-center text-sm text-[var(--ink-soft)] font-[family-name:var(--sans)]">
            Loading literary treasures...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-16 text-center bg-[var(--paper-light)] border border-[var(--hairline)] rounded-2xl p-8 max-w-md mx-auto">
            <p className="text-base font-medium mb-2 text-[var(--ink)]">No items found</p>
            <p className="text-xs text-[var(--ink-soft)] mb-4 font-[family-name:var(--sans)]">
              Try selecting a different category or clearing filters.
            </p>
            <button
              type="button"
              onClick={() => { setActiveTab('all'); setActiveFilter('all'); }}
              className="text-xs font-semibold underline underline-offset-4 text-[var(--ink)] font-[family-name:var(--sans)]"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-8">
            {filteredProducts.map((product) => {
              const prodId = String(product.id ?? product._id ?? '');
              const firstImg = product.images?.[0] as any;
              const imageUrl = firstImg?.url || firstImg?.src || product.image?.src;
              const imageAlt = firstImg?.alt || product.title;
              const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
              const discountPct = hasDiscount
                ? Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100)
                : 0;

              return (
                <Link
                  key={prodId}
                  href={`/product/${product.handle || prodId}`}
                  className="group block bg-[var(--paper-light)] border border-[var(--hairline)] rounded-2xl overflow-hidden hover:border-[var(--ink)] transition-all duration-300 shadow-2xs hover:shadow-md"
                  aria-label={`${product.title} – ₹${product.price}`}
                >
                  {/* Image Container */}
                  <div className="relative aspect-[3/4] bg-[var(--paper)] overflow-hidden">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={imageAlt || product.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                        <span className="text-4xl font-black text-[var(--ink)] opacity-15 uppercase mb-1">
                          {product.title.charAt(0)}
                        </span>
                        <span className="text-[10px] text-[var(--ink-soft)] uppercase tracking-wider font-[family-name:var(--sans)]">
                          {product.type || 'Book'}
                        </span>
                      </div>
                    )}

                    {hasDiscount && (
                      <span className="absolute top-3 left-3 bg-[var(--ink)] text-[var(--paper)] text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full font-[family-name:var(--sans)] shadow-xs">
                        -{discountPct}%
                      </span>
                    )}
                  </div>

                  {/* Info Container */}
                  <div className="p-4 space-y-2">
                    {product.vendor && (
                      <p className="text-[9px] font-semibold uppercase tracking-widest text-[var(--ink-soft)] font-[family-name:var(--sans)] truncate">
                        {product.vendor}
                      </p>
                    )}

                    <h3 className="text-sm sm:text-base font-normal text-[var(--ink)] line-clamp-2 leading-snug group-hover:text-[var(--accent)] transition-colors">
                      {product.title}
                    </h3>

                    <div className="flex items-baseline gap-2 pt-1 border-t border-[var(--hairline)]">
                      <span className="text-base font-semibold text-[var(--ink)]">
                        ₹{product.price.toLocaleString('en-IN')}
                      </span>
                      {hasDiscount && (
                        <span className="text-xs text-[var(--ink-soft)] line-through">
                          ₹{product.compareAtPrice!.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* View All Shop CTA */}
        <div className="text-center mt-16">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-[var(--ink)] text-[var(--paper)] text-xs font-semibold uppercase tracking-widest rounded-full hover:bg-[var(--ink-soft)] transition-colors font-[family-name:var(--sans)] shadow-sm"
          >
            <span>Explore Entire Catalog</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
