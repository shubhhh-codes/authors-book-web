'use client';

import { useState, useEffect, useMemo, useRef, useCallback, useLayoutEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { isValidCatalogProduct } from '@/lib/catalogUtils';
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
  const [addedToastData, setAddedToastData] = useState<{ product: Product; quantity: number } | null>(null);

  const tabNavRef = useRef<HTMLDivElement>(null);
  const tabButtonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const [pillRect, setPillRect] = useState<{ left: number; width: number; isInitialized: boolean }>({
    left: 0,
    width: 0,
    isInitialized: false,
  });

  const updatePill = useCallback(() => {
    const activeBtn = tabButtonRefs.current[activeTab];
    const navContainer = tabNavRef.current;
    if (activeBtn && navContainer) {
      const navBounds = navContainer.getBoundingClientRect();
      const btnBounds = activeBtn.getBoundingClientRect();
      setPillRect({
        left: btnBounds.left - navBounds.left,
        width: btnBounds.width,
        isInitialized: true,
      });
    }
  }, [activeTab]);

  useLayoutEffect(() => {
    updatePill();
  }, [updatePill, products]);

  useEffect(() => {
    window.addEventListener('resize', updatePill);
    return () => window.removeEventListener('resize', updatePill);
  }, [updatePill]);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const res = await fetch('/api/products?limit=50');
        if (res.ok) {
          const data = await res.json();
          const rawItems: Product[] = data.products || [];
          setProducts(rawItems.filter(isValidCatalogProduct));
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
    let books = 0;
    let bookmarks = 0;
    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      const type = (p.type || '').toLowerCase();
      const cat = (p.category || '').toLowerCase();
      if (type === 'book' || cat === 'book') books++;
      if (type === 'bookmark' || cat === 'bookmark') bookmarks++;
    }
    return { all: products.length, books, bookmarks };
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const typeLower = (product.type || '').toLowerCase();

      if (activeTab === 'books' && typeLower !== 'book') return false;
      if (activeTab === 'bookmarks' && typeLower !== 'bookmark') return false;

      if (activeFilter === 'bestseller') {
        const hasTag = product.tags?.some((t) => {
          const lower = t.toLowerCase();
          return lower.includes('best') || lower.includes('seller');
        });
        if (!hasTag) return false;
      } else if (activeFilter === 'film') {
        const hasTag = product.tags?.some((t) => t.toLowerCase().includes('film'));
        if (!hasTag) return false;
      } else if (activeFilter === '3d') {
        const hasTag = product.tags?.some((t) => t.toLowerCase().includes('3d'));
        if (!hasTag) return false;
      } else if (activeFilter === 'iconic') {
        const hasTag = product.tags?.some((t) => t.toLowerCase().includes('iconic'));
        if (!hasTag) return false;
      }

      return true;
    });
  }, [products, activeTab, activeFilter]);

  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startToastTimer = (duration = 7500) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setAddedToastData(null), duration);
  };

  const handleQuickAdd = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();

    // Prevent adding out of stock products
    if (product.inventory?.quantity !== undefined && product.inventory.quantity <= 0) {
      return;
    }

    try {
      const saved = localStorage.getItem('ab_cart') || localStorage.getItem('cart') || '[]';
      const cart: CartItem[] = JSON.parse(saved);
      const prodKey = String(product.id ?? product._id ?? '');
      const existing = cart.find((item) => String(item.id ?? item._id ?? '') === prodKey);
      let totalQty = 1;

      if (existing) {
        // Enforce inventory max limit
        const maxStock = product.inventory?.quantity ?? 99;
        if (existing.quantity >= maxStock) return;
        existing.quantity += 1;
        totalQty = existing.quantity;
      } else {
        cart.push({ ...product, quantity: 1 });
        totalQty = 1;
      }

      localStorage.setItem('ab_cart', JSON.stringify(cart));
      localStorage.setItem('cart', JSON.stringify(cart));
      window.dispatchEvent(new Event('cart-updated'));

      setAddedId(prodKey);
      setAddedToastData({ product, quantity: totalQty });
      setTimeout(() => setAddedId(null), 2500);
      startToastTimer(7500);
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

        {/* Category Tabs with Ultra-Smooth Concentric Spring Sliding Pill */}
        <div className="flex justify-center mb-8">
          <div
            ref={tabNavRef}
            className="relative inline-flex items-center p-1 bg-[var(--paper-light)] border border-[var(--hairline)] rounded-full text-xs font-[family-name:var(--sans)] shadow-2xs overflow-hidden"
          >
            {/* GPU-Accelerated Concentric Spring Sliding Pill */}
            <div
              aria-hidden="true"
              className={`absolute top-1 bottom-1 left-0 rounded-full bg-[var(--ink)] shadow-sm pointer-events-none ${
                pillRect.isInitialized
                  ? 'transition-all duration-400 ease-[cubic-bezier(0.34,1.45,0.64,1)]'
                  : 'opacity-0'
              }`}
              style={{
                transform: `translate3d(${pillRect.left}px, 0, 0)`,
                width: `${pillRect.width}px`,
              }}
            />

            {(['all', 'books', 'bookmarks'] as const).map((tabKey) => {
              const label =
                tabKey === 'all'
                  ? `All Items (${counts.all})`
                  : tabKey === 'books'
                  ? `Books (${counts.books})`
                  : `Bookmarks (${counts.bookmarks})`;
              const isTabActive = activeTab === tabKey;

              return (
                <button
                  key={tabKey}
                  ref={(el) => { tabButtonRefs.current[tabKey] = el; }}
                  type="button"
                  onClick={() => {
                    setActiveTab(tabKey);
                    setActiveFilter('all');
                  }}
                  className={`relative z-10 px-5 sm:px-6 py-2.5 rounded-full font-semibold uppercase tracking-wider text-center transition-colors duration-300 active:scale-95 cursor-pointer select-none ${
                    isTabActive
                      ? 'text-[var(--paper-light)]'
                      : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter Chips with Fluid Elastic Hover & Press Physics */}
        <div className="flex flex-wrap justify-center gap-3 mb-12 text-xs font-[family-name:var(--sans)]">
          {[
            { id: 'all', label: 'All Collections' },
            { id: 'bestseller', label: 'Best Sellers' },
            { id: 'film', label: 'Appeared in Films' },
            { id: '3d', label: '3D Bookmarks' },
            { id: 'iconic', label: 'Iconic Series' },
          ].map((f) => {
            const isActive = activeFilter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveFilter(f.id)}
                className={`relative px-4.5 py-2 rounded-full border text-xs font-medium tracking-wide transition-all duration-350 ease-[cubic-bezier(0.34,1.4,0.64,1)] active:scale-90 cursor-pointer select-none ${
                  isActive
                    ? 'bg-[var(--ink)] border-[var(--ink)] text-[var(--paper-light)] shadow-[0_4px_14px_rgba(0,0,0,0.18)] font-semibold -translate-y-1 scale-105'
                    : 'bg-[var(--paper-light)] border-[var(--hairline)] text-[var(--ink-soft)] hover:border-[var(--ink)] hover:text-[var(--ink)] hover:-translate-y-0.5 hover:shadow-xs'
                }`}
              >
                {f.label}
              </button>
            );
          })}
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
              const prodId = String(product.id ?? product._id ?? '');
              const firstImg = product.images?.[0] as any;
              const imageUrl = firstImg?.url || firstImg?.src || product.image?.src || '';
              const imageAlt = firstImg?.alt || product.title;
              const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
              const discountPct = hasDiscount
                ? Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100)
                : 0;
              const isJustAdded = addedId === prodId;
              const isSoldOut =
                product.inventory?.quantity !== undefined && product.inventory.quantity <= 0;

              return (
                <div
                  key={prodId}
                  className="group relative flex flex-col bg-[var(--paper-light)] border border-[var(--hairline)] rounded-2xl overflow-hidden hover:border-[var(--ink)] transition-all duration-300 shadow-2xs hover:shadow-md"
                >
                  <Link href={`/product/${product.handle || prodId}`} className="block relative aspect-[3/4] bg-[var(--paper)] overflow-hidden">
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

                    {isSoldOut ? (
                      <span className="absolute top-3 left-3 bg-gray-900/90 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full font-[family-name:var(--sans)] shadow-xs">
                        Sold Out
                      </span>
                    ) : hasDiscount ? (
                      <span className="absolute top-3 left-3 bg-[var(--ink)] text-[var(--paper)] text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full font-[family-name:var(--sans)] shadow-xs">
                        -{discountPct}%
                      </span>
                    ) : null}

                    {/* Quick Add Overlay Button on Hover */}
                    <button
                      type="button"
                      disabled={isSoldOut}
                      onClick={(e) => handleQuickAdd(e, product)}
                      className={`absolute bottom-3 inset-x-3 text-[11px] font-semibold uppercase tracking-wider py-2.5 rounded-xl transition-all duration-200 transform font-[family-name:var(--sans)] shadow-sm ${
                        isSoldOut
                          ? 'bg-gray-300 text-gray-600 opacity-90 cursor-not-allowed translate-y-0'
                          : 'bg-[var(--ink)] text-[var(--paper)] opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 hover:bg-[var(--accent)]'
                      }`}
                    >
                      {isSoldOut ? 'Out of Stock' : isJustAdded ? '✓ Added to Cart' : '+ Quick Add'}
                    </button>
                  </Link>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      {product.vendor && (
                        <p className="text-[9px] font-semibold uppercase tracking-widest text-[var(--ink-soft)] font-[family-name:var(--sans)] truncate">
                          {product.vendor}
                        </p>
                      )}

                      <Link href={`/product/${product.handle || product._id}`}>
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

                      {!isSoldOut && (
                        <button
                          type="button"
                          onClick={(e) => handleQuickAdd(e, product)}
                          className="text-[11px] font-semibold text-[var(--ink-soft)] hover:text-[var(--ink)] font-[family-name:var(--sans)] sm:hidden"
                          aria-label={`Add ${product.title} to cart`}
                        >
                          + Add
                        </button>
                      )}
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
            className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-[var(--ink)] text-[var(--paper-light)] text-xs font-semibold uppercase tracking-widest rounded-full hover:bg-[var(--ink-soft)] hover:-translate-y-0.5 hover:shadow-md active:scale-95 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] font-[family-name:var(--sans)] shadow-sm"
          >
            <span>Browse Full Store Catalog</span>
            <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </Link>
        </div>
      </div>

      {/* Floating Toast Notification on Quick Add */}
      {addedToastData && (
        <div
          onClick={(e) => e.stopPropagation()}
          onMouseEnter={() => {
            if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
          }}
          onMouseLeave={() => startToastTimer(5000)}
          className="fixed bottom-4 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 z-50 bg-[#1a1714] text-[#f4f0ea] px-3.5 sm:px-4 py-3 sm:py-3.5 rounded-2xl shadow-2xl border border-white/10 flex items-center justify-between gap-3 sm:gap-4 sm:max-w-sm w-auto sm:w-full animate-in fade-in slide-in-from-bottom-5 duration-300"
        >
          <div className="flex items-center gap-3 min-w-0">
            {addedToastData.product.images?.[0] && (
              <div className="relative w-10 h-12 rounded-lg overflow-hidden bg-[#e9e3da] shrink-0 border border-white/10">
                <Image
                  src={addedToastData.product.images[0].url}
                  alt={addedToastData.product.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}
            <div className="overflow-hidden">
              <div className="text-xs font-bold truncate flex items-center gap-1.5 text-emerald-400">
                <span>✓</span> Added to Cart
              </div>
              <div className="text-[11px] text-[#ded7cb]/90 truncate">
                {addedToastData.product.title} (Qty: {addedToastData.quantity})
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
                setAddedToastData(null);
                if (onOpenCart) onOpenCart();
              }}
              className="px-3.5 py-2 bg-white text-black font-bold text-[10px] uppercase tracking-wider rounded-lg hover:bg-gray-100 transition-all cursor-pointer shadow-xs"
            >
              VIEW CART
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
                setAddedToastData(null);
              }}
              className="p-1 text-gray-400 hover:text-white text-xs transition-colors cursor-pointer"
              aria-label="Close notification"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
