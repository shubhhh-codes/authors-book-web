'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import ProductCard from '@/components/ProductCard';
import { isValidCatalogProduct } from '@/lib/catalogUtils';
import type { Product } from '@/lib/types';

function ShopContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const type = searchParams.get('type') || '';
  const genre = searchParams.get('genre') || '';
  const tag = searchParams.get('tag') || '';
  const vendor = searchParams.get('vendor') || '';
  const search = searchParams.get('search') || '';

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [type, genre, tag, vendor, search]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);

      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '12');

      if (type) params.set('type', type);
      if (genre) params.set('genre', genre);
      if (tag) params.set('tag', tag);
      if (vendor) params.set('vendor', vendor);
      if (search) params.set('search', search);

      try {
        const res = await fetch(`/api/products?${params.toString()}`);
        const data = await res.json();
        const rawItems: Product[] = data.products || [];
        const validItems = rawItems.filter(isValidCatalogProduct);
        setProducts(validItems);
        setTotal(data.pagination?.total || validItems.length);
      } catch (err) {
        console.error('Error fetching filtered products:', err);
        setProducts([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [page, type, genre, tag, vendor, search]);

  // Compute title dynamically based on active filter params
  const getTitle = () => {
    if (tag === '3d') return '3D Bookmarks';
    if (tag === 'best-seller') return 'Best Selling Books';
    if (tag === 'film-appeared') return 'Appeared in Films';
    if (tag === 'filmy') return 'Filmy Bookmarks';
    if (tag === 'anime') return 'Anime Bookmarks';
    if (tag === 'iconic') return 'Iconic Bookmarks';
    if (tag) return `${tag.charAt(0).toUpperCase() + tag.slice(1)} Collection`;
    if (genre) return `${genre.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} Books`;
    if (vendor) return `Books by ${vendor}`;
    if (type === 'bookmark') return 'Bookmarks';
    if (type === 'book') return 'All Books';
    if (search) return `Search results for "${search}"`;
    return 'All Products';
  };

  const hasActiveFilters = Boolean(type || genre || tag || vendor || search);

  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      {/* Header section with title and active filters */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mb-8 pb-4 border-b border-gray-200 gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
            {getTitle()}
          </h1>
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 mt-3 text-sm text-gray-600">
              <span>Active filters:</span>
              {type && <span className="bg-gray-100 px-3 py-1 rounded-full text-xs font-semibold">Type: {type}</span>}
              {genre && <span className="bg-gray-100 px-3 py-1 rounded-full text-xs font-semibold">Genre: {genre}</span>}
              {tag && <span className="bg-gray-100 px-3 py-1 rounded-full text-xs font-semibold">Tag: {tag}</span>}
              {vendor && <span className="bg-gray-100 px-3 py-1 rounded-full text-xs font-semibold">Author: {vendor}</span>}
              {search && <span className="bg-gray-100 px-3 py-1 rounded-full text-xs font-semibold">Search: {search}</span>}
            </div>
          )}
        </div>

        {hasActiveFilters && (
          <Link
            href="/shop"
            className="text-sm font-medium text-black hover:underline self-start sm:self-auto"
          >
            Clear all filters ×
          </Link>
        )}
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500 font-medium">Loading products...</div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-2xl">
          <h2 className="text-xl font-semibold mb-2">No products found</h2>
          <p className="text-gray-500 mb-6">Try clearing filters or searching for something else.</p>
          <Link
            href="/shop"
            className="inline-block bg-black text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            View All Products
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>

          {/* Pagination */}
          {total > 12 && (
            <div className="flex gap-2 justify-center flex-wrap pt-4">
              {Array.from({ length: Math.ceil(total / 12) }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setPage(i + 1)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    page === i + 1
                      ? 'bg-black text-white'
                      : 'border border-gray-300 hover:border-black text-gray-700'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function Shop() {
  return (
    <>
      <Navigation />
      <Suspense fallback={<div className="text-center py-20 text-gray-500">Loading shop...</div>}>
        <ShopContent />
      </Suspense>
    </>
  );
}
