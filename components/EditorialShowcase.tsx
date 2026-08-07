'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Product, CartItem } from '@/lib/types';

interface EditorialShowcaseProps {
  onOpenCart?: () => void;
}

export default function EditorialShowcase({ onOpenCart }: EditorialShowcaseProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'books' | 'bookmarks'>('all');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [addedId, setAddedId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const res = await fetch('/api/products?limit=50');
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products || []);
        }
      } catch (err) {
        console.error('Failed to fetch products for EditorialShowcase:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const counts = useMemo(() => {
    const books = products.filter(
      (p) => (p.type || '').toLowerCase() === 'book' || (p.category || '').toLowerCase() === 'book'
    ).length;
    const bookmarks = products.filter(
      (p) => (p.type || '').toLowerCase() === 'bookmark' || (p.category || '').toLowerCase() === 'bookmark'
    ).length;
    return { all: products.length, books, bookmarks };
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const typeLower = (product.type || '').toLowerCase();

      if (activeTab === 'books' && typeLower !== 'book') return false;
      if (activeTab === 'bookmarks' && typeLower !== 'bookmark') return false;

      if (activeFilter === 'bestseller') {
        const hasTag = product.tags?.some((t) => /best|seller/i.test(t));
        if (!hasTag) return false;
      }
      if (activeFilter === 'film') {
        const hasTag = product.tags?.some((t) => /film/i.test(t));
        if (!hasTag) return false;
      }
      if (activeFilter === '3d') {
        const hasTag = product.tags?.some((t) => /3d/i.test(t));
        if (!hasTag) return false;
      }
      if (activeFilter === 'iconic') {
        const hasTag = product.tags?.some((t) => /iconic/i.test(t));
        if (!hasTag) return false;
      }

      return true;
    });
  }, [products, activeTab, activeFilter]);

  const handleQuickAdd = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const saved = localStorage.getItem('ab_cart') || localStorage.getItem('cart') || '[]';
      const cart: CartItem[] = JSON.parse(saved);
      const existing = cart.find((item) => item._id === product._id);

      if (existing) {
        existing.quantity += 1;
      } else {
        cart.push({ ...product, quantity: 1 });
      }

      localStorage.setItem('ab_cart', JSON.stringify(cart));
      localStorage.setItem('cart', JSON.stringify(cart));
      window.dispatchEvent(new Event('cart-updated'));

      setAddedId(product._id);
      setTimeout(() => setAddedId(null), 1500);

      if (onOpenCart) {
        onOpenCart();
      }
    } catch (err) {
      console.error('Quick add error:', err);
    }
  };

  return (
    <section
      id="editorial-showcase"
      className="w-full py-16 sm:py-24 bg-[var(--paper)] text-[var(--ink)] font-[family-name:var(--serif)]"
      aria-labelledby="showcase-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-[9px] font-semibold uppercase tracking-widest text-[var(--ink-soft)] mb-3 font-[family-name:var(--sans)]">
            Editorial Collection
          </p>
          <h2
            id="showcase-heading"
            className="text-3xl sm:text-5xl font-normal tracking-tight text-[var(--ink)] mb-4"
          >
            Curated Books &amp; Bookmarks
          </h2>
          <div className="w-16 h-px bg-[var(--hairline)] mx-auto mb-6" aria-hidden="true" />
          <p className="text-base sm:text-lg text-[var(--ink-soft)] leading-relaxed">
            Discover handcrafted volume editions, iconic bookmarks, and literary treasures.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex p-1 bg-[var(--paper-light)] border border-[var(--hairline)] rounded-full text-xs font-[family-name:var(--sans)] shadow-2xs">
            <button
              type="button"
              onClick={() => { setActiveTab('all'); setActiveFilter('all'); }}
              style={
                activeTab === 'all'
                  ? { backgroundColor: 'var(--ink)', color: 'var(--paper-light)' }
                  : { color: 'var(--ink-soft)' }
              }
              className={`px-5 py-2.5 rounded-full font-semibold uppercase tracking-wider transition-all duration-200 ${
                activeTab === 'all' ? 'shadow-xs' : 'hover:text-[var(--ink)]'
              }`}
            >
              All Items ({counts.all})
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('books'); setActiveFilter('all'); }}
              style={
                activeTab === 'books'
                  ? { backgroundColor: 'var(--ink)', color: 'var(--paper-light)' }
                  : { color: 'var(--ink-soft)' }
              }
              className={`px-5 py-2.5 rounded-full font-semibold uppercase tracking-wider transition-all duration-200 ${
                activeTab === 'books' ? 'shadow-xs' : 'hover:text-[var(--ink)]'
              }`}
            >
              Books ({counts.books})
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('bookmarks'); setActiveFilter('all'); }}
              style={
                activeTab === 'bookmarks'
                  ? { backgroundColor: 'var(--ink)', color: 'var(--paper-light)' }
                  : { color: 'var(--ink-soft)' }
              }
              className={`px-5 py-2.5 rounded-full font-semibold uppercase tracking-wider transition-all duration-200 ${
                activeTab === 'bookmarks' ? 'shadow-xs' : 'hover:text-[var(--ink)]'
              }`}
            >
              Bookmarks ({counts.bookmarks})
            </button>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap justify-center gap-2 mb-12 text-xs font-[family-name:var(--sans)]">
          {[
            { id: 'all', label: 'All Collections' },
            { id: 'bestseller', label: 'Best Sellers' },
            { id: 'film', label: 'Appeared in Films' },
            { id: '3d', label: '3D Bookmarks' },
            { id: 'iconic', label: 'Iconic Series' },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setActiveFilter(f.id)}
              style={
                activeFilter === f.id
                  ? { backgroundColor: 'var(--ink)', borderColor: 'var(--ink)', color: 'var(--paper-light)' }
                  : { backgroundColor: 'var(--paper-light)', borderColor: 'var(--hairline)', color: 'var(--ink-soft)' }
              }
              className={`px-4 py-1.5 rounded-full border transition-colors ${
                activeFilter === f.id ? 'font-semibold' : 'hover:border-[var(--ink)]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Product Cards Grid */}
        {loading ? (
          <div className="py-24 text-center text-xs uppercase tracking-widest text-[var(--ink-soft)] font-[family-name:var(--sans)]">
            Loading literary treasures...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-16 text-center bg-[var(--paper-light)] border border-[var(--hairline)] rounded-2xl p-8 max-w-md mx-auto">
            <p className="text-base font-medium mb-2 text-[var(--ink)]">No items found</p>
            <p className="text-xs text-[var(--ink-soft)] mb-4 font-[family-name:var(--sans)]">
              Try selecting another category tab or resetting the filter.
            </p>
            <button
              type="button"
              onClick={() => { setActiveTab('all'); setActiveFilter('all'); }}
              className="text-xs font-semibold uppercase tracking-wider underline underline-offset-4 text-[var(--ink)] font-[family-name:var(--sans)]"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-8">
            {filteredProducts.map((product) => {
              const image = product.images?.[0];
              const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
              const discountPct = hasDiscount
                ? Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100)
                : 0;
              const isJustAdded = addedId === product._id;

              return (
                <div
                  key={product._id}
                  className="group relative flex flex-col bg-[var(--paper-light)] border border-[var(--hairline)] rounded-2xl overflow-hidden hover:border-[var(--ink)] transition-all duration-300 shadow-2xs hover:shadow-md"
                >
                  <Link href={`/product/${product._id}`} className="block relative aspect-[3/4] bg-[var(--paper)] overflow-hidden">
                    {image ? (
                      <Image
                        src={image.url}
                        alt={image.alt || product.title}
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

                    {/* Quick Add Overlay Button on Hover */}
                    <button
                      type="button"
                      onClick={(e) => handleQuickAdd(e, product)}
                      className="absolute bottom-3 inset-x-3 bg-[var(--ink)] text-[var(--paper)] text-[11px] font-semibold uppercase tracking-wider py-2.5 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 font-[family-name:var(--sans)] shadow-sm hover:bg-[var(--accent)]"
                    >
                      {isJustAdded ? '✓ Added to Cart' : '+ Quick Add'}
                    </button>
                  </Link>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      {product.vendor && (
                        <p className="text-[9px] font-semibold uppercase tracking-widest text-[var(--ink-soft)] font-[family-name:var(--sans)] truncate">
                          {product.vendor}
                        </p>
                      )}

                      <Link href={`/product/${product._id}`}>
                        <h3 className="text-sm sm:text-base font-normal text-[var(--ink)] line-clamp-2 leading-snug hover:text-[var(--accent)] transition-colors mt-0.5">
                          {product.title}
                        </h3>
                      </Link>
                    </div>

                    <div className="flex items-baseline justify-between pt-2 border-t border-[var(--hairline)]">
                      <div className="flex items-baseline gap-2">
                        <span className="text-base font-semibold text-[var(--ink)]">
                          ₹{product.price.toLocaleString('en-IN')}
                        </span>
                        {hasDiscount && (
                          <span className="text-xs text-[var(--ink-soft)] line-through">
                            ₹{product.compareAtPrice!.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleQuickAdd(e, product)}
                        className="text-[11px] font-semibold text-[var(--ink-soft)] hover:text-[var(--ink)] font-[family-name:var(--sans)] sm:hidden"
                        aria-label={`Add ${product.title} to cart`}
                      >
                        + Add
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* View All CTA */}
        <div className="text-center mt-16">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-[var(--ink)] text-[var(--paper)] text-xs font-semibold uppercase tracking-widest rounded-full hover:bg-[var(--ink-soft)] transition-colors font-[family-name:var(--sans)] shadow-sm"
          >
            <span>Browse Full Store Catalog</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
