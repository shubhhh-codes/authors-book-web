'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/lib/types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(query)}&limit=6`);
        const data = await res.json();
        setResults(data.products || []);
      } catch (err) {
        console.error('Search error:', err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-start justify-center pt-16 sm:pt-24 px-4">
      {/* Backdrop click to close */}
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden z-10 border border-gray-100">
        {/* Search Header */}
        <div className="flex items-center px-6 py-4 border-b border-gray-100 gap-3">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-gray-400 flex-shrink-0"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search books, authors, bookmarks..."
            className="w-full text-base sm:text-lg focus:outline-none placeholder-gray-400 bg-transparent"
          />

          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-black hover:bg-gray-100 transition-colors"
            aria-label="Close search"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Results / Suggestions Area */}
        <div className="max-h-[60vh] overflow-y-auto p-4">
          {loading ? (
            <div className="py-8 text-center text-sm text-gray-500">Searching...</div>
          ) : query.trim() === '' ? (
            <div className="py-6 px-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Popular Searches</p>
              <div className="flex flex-wrap gap-2">
                {['Fiction', 'Bookmarks', 'Ruskin Bond', '3D Bookmarks', 'Best Seller'].map((term) => (
                  <button
                    key={term}
                    onClick={() => setQuery(term)}
                    className="text-xs bg-gray-100 hover:bg-black hover:text-white px-3 py-1.5 rounded-full transition-colors font-medium text-gray-700"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-sm">
              No results found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2">Products</p>
              {results.map((product) => {
                const img = product.images?.[0]?.url;
                return (
                  <Link
                    key={product._id}
                    href={`/product/${product.handle || product._id}`}
                    onClick={onClose}
                    className="flex items-center gap-4 p-2 rounded-xl hover:bg-gray-50 transition-colors group"
                  >
                    <div className="relative w-12 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {img ? (
                        <Image src={img} alt={product.title} fill className="object-cover" unoptimized />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">Book</div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-gray-900 truncate group-hover:text-black">
                        {product.title}
                      </h4>
                      {product.vendor && <p className="text-xs text-gray-500">{product.vendor}</p>}
                      <p className="text-xs font-bold text-gray-900 mt-1">₹{product.price}</p>
                    </div>
                  </Link>
                );
              })}

              <div className="pt-2 text-center">
                <Link
                  href={`/shop?search=${encodeURIComponent(query)}`}
                  onClick={onClose}
                  className="inline-block text-xs font-semibold text-black hover:underline py-2"
                >
                  View all results for &ldquo;{query}&rdquo; →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
