'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Product as ProductType } from '@/lib/types';

interface AdminProductsClientProps {
  initialProducts: ProductType[];
}

export default function AdminProductsClient({ initialProducts }: AdminProductsClientProps) {
  const [productsState, setProductsState] = useState<ProductType[]>(initialProducts);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'book' | 'bookmark'>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'draft'>('all');

  // Bulk Action State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [stockInput, setStockInput] = useState<string>('');
  const [showStockModal, setShowStockModal] = useState(false);

  const selectAllCheckboxRef = useRef<HTMLInputElement>(null);

  // Sync state if server re-renders
  useEffect(() => {
    setProductsState(initialProducts);
  }, [initialProducts]);

  const filteredProducts = useMemo(() => {
    return productsState.filter((product) => {
      // Search term filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchesTitle = product.title?.toLowerCase().includes(query);
        const matchesVendor = product.vendor?.toLowerCase().includes(query);
        const matchesSku = product.sku?.toLowerCase().includes(query);
        const matchesGenre = product.genre?.toLowerCase().includes(query);
        const matchesTags = product.tags?.some((t) => t.toLowerCase().includes(query));
        if (!matchesTitle && !matchesVendor && !matchesSku && !matchesGenre && !matchesTags) {
          return false;
        }
      }

      // Type filter
      if (selectedType !== 'all') {
        const typeLower = (product.type || 'book').toLowerCase();
        if (typeLower !== selectedType) return false;
      }

      // Tag filter
      if (selectedTag !== 'all') {
        const hasTag = product.tags?.some((t) => t.toLowerCase() === selectedTag.toLowerCase());
        if (!hasTag) return false;
      }

      // Status filter
      if (selectedStatus !== 'all') {
        const isActive = product.published !== false;
        if (selectedStatus === 'active' && !isActive) return false;
        if (selectedStatus === 'draft' && isActive) return false;
      }

      return true;
    });
  }, [productsState, searchTerm, selectedType, selectedTag, selectedStatus]);

  const counts = useMemo(() => {
    const total = productsState.length;
    const books = productsState.filter((p) => (p.type || 'book').toLowerCase() === 'book').length;
    const bookmarks = productsState.filter((p) => (p.type || '').toLowerCase() === 'bookmark').length;
    const active = productsState.filter((p) => p.published !== false).length;
    const draft = total - active;
    return { total, books, bookmarks, active, draft };
  }, [productsState]);

  // Checkbox Selection Logic
  const allFilteredIds = useMemo(() => filteredProducts.map((p) => String(p._id)), [filteredProducts]);
  const isAllSelected = allFilteredIds.length > 0 && allFilteredIds.every((id) => selectedIds.includes(id));
  const isSomeSelected = selectedIds.length > 0 && !isAllSelected;

  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      selectAllCheckboxRef.current.indeterminate = isSomeSelected;
    }
  }, [isSomeSelected]);

  const handleSelectAllToggle = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allFilteredIds);
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  // Bulk Actions Executor
  const handleBulkAction = async (action: string, payload?: Record<string, unknown>) => {
    if (selectedIds.length === 0) return;

    if (action === 'delete') {
      const confirmDelete = window.confirm(
        `Are you sure you want to delete ${selectedIds.length} selected product(s)? This action cannot be undone.`
      );
      if (!confirmDelete) return;
    }

    setIsProcessingBulk(true);
    try {
      const res = await fetch('/api/admin/products/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          productIds: selectedIds,
          payload,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setProductsState((prev) => {
          if (action === 'delete') {
            return prev.filter((p) => !selectedIds.includes(String(p._id)));
          }
          return prev.map((p) => {
            if (!selectedIds.includes(String(p._id))) return p;

            if (action === 'publish') return { ...p, published: true };
            if (action === 'unpublish') return { ...p, published: false };

            if (action === 'add_tag' && payload?.tag) {
              const tagStr = String(payload.tag);
              const current = p.tags || [];
              const hasIt = current.some((t) => t.toLowerCase() === tagStr.toLowerCase());
              return { ...p, tags: hasIt ? current : [...current, tagStr] };
            }

            if (action === 'remove_tag' && payload?.tag) {
              const tagStr = String(payload.tag);
              return { ...p, tags: (p.tags || []).filter((t) => t.toLowerCase() !== tagStr.toLowerCase()) };
            }

            if (action === 'update_stock' && payload?.quantity !== undefined) {
              const currentInv = p.inventory || { quantity: 10, policy: 'deny' };
              return { ...p, inventory: { ...currentInv, quantity: Number(payload.quantity), policy: currentInv.policy || 'deny' } };
            }

            return p;
          });
        });

        setSelectedIds([]);
        setShowStockModal(false);
      } else {
        alert(data.error || 'Bulk action failed');
      }
    } catch (err) {
      console.error('Bulk action error:', err);
      alert('Failed to execute bulk action. Please try again.');
    } finally {
      setIsProcessingBulk(false);
      setShowTagMenu(false);
    }
  };

  return (
    <div className="space-y-6 animate-admin-fade">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Products Catalog</h1>
          <p className="text-xs text-gray-500 mt-1">
            Categorize and manage your books, bookmarks, pricing, inventory, and tags.
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className="bg-[#1a1a1a] text-white hover:bg-black text-xs font-semibold px-4 py-2.5 rounded-lg transition-all active:scale-95 inline-flex items-center justify-center gap-1.5 shadow-2xs hover:shadow-md"
        >
          <span>+ Add Product</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search by title, author, SKU, or tag..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            />
            <svg
              className="w-4 h-4 text-gray-400 absolute left-3 top-2.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Type Filter Buttons */}
          <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-lg text-xs font-medium">
            <button
              type="button"
              onClick={() => setSelectedType('all')}
              className={`px-3 py-1 rounded-md transition-all ${
                selectedType === 'all' ? 'bg-white shadow-2xs text-black font-semibold' : 'text-gray-600 hover:text-black'
              }`}
            >
              All ({counts.total})
            </button>
            <button
              type="button"
              onClick={() => setSelectedType('book')}
              className={`px-3 py-1 rounded-md transition-all ${
                selectedType === 'book' ? 'bg-white shadow-2xs text-black font-semibold' : 'text-gray-600 hover:text-black'
              }`}
            >
              Books ({counts.books})
            </button>
            <button
              type="button"
              onClick={() => setSelectedType('bookmark')}
              className={`px-3 py-1 rounded-md transition-all ${
                selectedType === 'bookmark' ? 'bg-white shadow-2xs text-black font-semibold' : 'text-gray-600 hover:text-black'
              }`}
            >
              Bookmarks ({counts.bookmarks})
            </button>
          </div>
        </div>

        {/* Secondary Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100 text-xs">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mr-1">Tags & Status:</span>

          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="px-2.5 py-1 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 font-medium text-xs focus:outline-none focus:ring-1 focus:ring-black"
          >
            <option value="all">All Collection Tags</option>
            <option value="bestseller">Best Sellers</option>
            <option value="film">Appeared in Films</option>
            <option value="3d">3D Bookmarks</option>
            <option value="iconic">Iconic Series</option>
            <option value="featured">Featured</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as 'all' | 'active' | 'draft')}
            className="px-2.5 py-1 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 font-medium text-xs focus:outline-none focus:ring-1 focus:ring-black"
          >
            <option value="all">All Status ({counts.total})</option>
            <option value="active">Active ({counts.active})</option>
            <option value="draft">Draft ({counts.draft})</option>
          </select>

          {(searchTerm || selectedType !== 'all' || selectedTag !== 'all' || selectedStatus !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedType('all');
                setSelectedTag('all');
                setSelectedStatus('all');
              }}
              className="text-xs text-rose-600 hover:underline font-medium ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Floating Animated Bulk Action Bar */}
      <div
        className={`bg-[#1a1a1a] text-white p-3 rounded-xl shadow-lg border border-gray-800 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          selectedIds.length > 0 ? 'opacity-100 translate-y-0 visible' : 'opacity-0 -translate-y-4 pointer-events-none hidden'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 font-semibold">
            <span className="bg-white/10 px-2.5 py-1 rounded-md text-emerald-400 font-mono">
              {selectedIds.length} selected
            </span>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="text-gray-400 hover:text-white underline text-[11px] transition-colors"
            >
              Deselect All
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleBulkAction('publish')}
              disabled={isProcessingBulk}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all active:scale-95 disabled:opacity-50"
            >
              Publish Active
            </button>

            <button
              type="button"
              onClick={() => handleBulkAction('unpublish')}
              disabled={isProcessingBulk}
              className="px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-semibold transition-all active:scale-95 disabled:opacity-50"
            >
              Set to Draft
            </button>

            {/* Tag Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowTagMenu(!showTagMenu)}
                disabled={isProcessingBulk}
                className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-semibold transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1"
              >
                <span>🏷️ Tags</span>
                <span className="text-[10px]">▼</span>
              </button>

              {showTagMenu && (
                <div className="absolute right-0 bottom-full mb-2 w-48 bg-white text-gray-900 border border-gray-200 rounded-xl shadow-xl p-2 z-30 space-y-1 font-sans text-xs">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 py-1">Add Tag</p>
                  {['bestseller', 'film', '3d', 'iconic', 'featured'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleBulkAction('add_tag', { tag })}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-gray-100 font-medium capitalize"
                    >
                      + {tag}
                    </button>
                  ))}
                  <div className="border-t border-gray-100 my-1" />
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 py-1">Remove Tag</p>
                  {['bestseller', 'film', '3d', 'iconic', 'featured'].map((tag) => (
                    <button
                      key={`rem-${tag}`}
                      type="button"
                      onClick={() => handleBulkAction('remove_tag', { tag })}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-rose-50 text-rose-600 font-medium capitalize"
                    >
                      - {tag}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Stock Modal Trigger */}
            <button
              type="button"
              onClick={() => setShowStockModal(true)}
              disabled={isProcessingBulk}
              className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-semibold transition-all active:scale-95 disabled:opacity-50"
            >
              📦 Update Stock
            </button>

            {/* Delete Button */}
            <button
              type="button"
              onClick={() => handleBulkAction('delete')}
              disabled={isProcessingBulk}
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold transition-all active:scale-95 disabled:opacity-50"
            >
              {isProcessingBulk ? 'Processing...' : `Delete Selected (${selectedIds.length})`}
            </button>
          </div>
        </div>
      </div>

      {/* Stock Update Modal */}
      {showStockModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-gray-100">
            <h3 className="text-base font-bold text-gray-900">Bulk Update Stock Quantity</h3>
            <p className="text-xs text-gray-500">
              Set new inventory quantity for all {selectedIds.length} selected products:
            </p>

            <input
              type="number"
              min="0"
              placeholder="e.g. 25"
              value={stockInput}
              onChange={(e) => setStockInput(e.target.value)}
              className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black font-semibold"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowStockModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleBulkAction('update_stock', { quantity: Number(stockInput) })}
                disabled={!stockInput}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-black text-white hover:bg-gray-800 disabled:opacity-50"
              >
                Save Stock Quantity
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-2xs overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="p-16 text-center text-gray-500 space-y-3">
            <p className="text-base font-semibold text-gray-900">No matching products</p>
            <p className="text-xs text-gray-500">Try adjusting your search terms or active filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 border-b border-gray-100 text-gray-500 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-10">
                    <input
                      ref={selectAllCheckboxRef}
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleSelectAllToggle}
                      className="rounded border-gray-300 text-black focus:ring-black cursor-pointer w-4 h-4"
                      aria-label="Select all products"
                    />
                  </th>
                  <th className="py-3 px-4 w-12">Image</th>
                  <th className="py-3 px-4">Product / Vendor</th>
                  <th className="py-3 px-4">Type & Genre</th>
                  <th className="py-3 px-4">Collection Tags</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Inventory</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {filteredProducts.map((product) => {
                  const idStr = String(product._id);
                  const isChecked = selectedIds.includes(idStr);
                  const img = product.images?.[0]?.url;
                  const qty = product.inventory?.quantity ?? 10;
                  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;

                  return (
                    <tr
                      key={idStr}
                      className={`transition-all admin-row-hover ${
                        isChecked ? 'bg-amber-50/70 hover:bg-amber-50' : 'hover:bg-gray-50/80'
                      }`}
                    >
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleSelectRow(idStr)}
                          className="rounded border-gray-300 text-black focus:ring-black cursor-pointer w-4 h-4"
                          aria-label={`Select ${product.title}`}
                        />
                      </td>

                      <td className="py-3 px-4">
                        <div className="relative w-10 h-12 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                          {img ? (
                            <Image src={img} alt={product.title} fill className="object-cover" unoptimized />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">
                              No img
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 max-w-xs">
                        <Link href={`/admin/products/${product._id}`} className="font-bold text-gray-900 hover:text-blue-600 line-clamp-1">
                          {product.title}
                        </Link>
                        {product.vendor && <p className="text-[11px] text-gray-500 truncate">{product.vendor}</p>}
                        {product.sku && <p className="text-[10px] text-gray-400 font-mono">SKU: {product.sku}</p>}
                      </td>

                      <td className="py-3 px-4 text-gray-600">
                        <span className="capitalize font-semibold text-gray-800">{product.type || 'Book'}</span>
                        {product.genre && <p className="text-[11px] text-gray-500">{product.genre}</p>}
                      </td>

                      <td className="py-3 px-4 max-w-xs">
                        {product.tags && product.tags.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {product.tags.map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-[10px] font-medium border border-gray-200"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-400 italic">None</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            product.published !== false
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-gray-100 text-gray-600 border border-gray-200'
                          }`}
                        >
                          {product.published !== false ? 'Active' : 'Draft'}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`font-semibold ${qty > 0 ? 'text-gray-700' : 'text-rose-600'}`}>
                          {qty > 0 ? `${qty} in stock` : 'Out of stock'}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-gray-900">₹{product.price.toLocaleString('en-IN')}</span>
                        {hasDiscount && (
                          <p className="text-[10px] text-gray-400 line-through">
                            ₹{product.compareAtPrice!.toLocaleString('en-IN')}
                          </p>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/admin/products/${product._id}`}
                          className="text-xs font-semibold text-blue-600 hover:underline"
                        >
                          Edit →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
