'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    compareAtPrice: '',
    vendor: '',
    category: '',
    type: 'book',
    genre: '',
    tags: '',
    sku: '',
    quantity: '10',
    imageUrl: '',
    published: true,
  });

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${params.id}`);
        if (!res.ok) throw new Error('Product not found');
        const data = await res.json();
        setFormData({
          title: data.title || '',
          description: data.description || '',
          price: String(data.price || ''),
          compareAtPrice: data.compareAtPrice ? String(data.compareAtPrice) : '',
          vendor: data.vendor || '',
          category: data.category || '',
          type: data.type || 'book',
          genre: data.genre || '',
          tags: Array.isArray(data.tags) ? data.tags.join(', ') : '',
          sku: data.sku || '',
          quantity: String(data.inventory?.quantity ?? 10),
          imageUrl: data.images?.[0]?.url || '',
          published: data.published !== false,
        });
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Product not found');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) fetchProduct();
  }, [params.id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/products/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: Number(formData.price),
          compareAtPrice: formData.compareAtPrice ? Number(formData.compareAtPrice) : undefined,
          inventory: { quantity: Number(formData.quantity) },
          tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()) : [],
          images: formData.imageUrl ? [formData.imageUrl] : [],
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        router.push('/admin/products');
      } else {
        setError(data.error || 'Failed to update product');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/products/${params.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        router.push('/admin/products');
      } else {
        alert('Failed to delete product');
      }
    } catch {
      alert('Error deleting product');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-xs text-gray-500 font-medium">Loading product details...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="p-1.5 rounded-lg border border-gray-300 hover:border-black text-gray-600 hover:text-black transition-colors"
          >
            ← Back
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Edit Product</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors border border-rose-200"
          >
            {deleting ? 'Deleting...' : 'Delete Product'}
          </button>

          <button
            type="button"
            onClick={handleUpdate}
            disabled={saving}
            className="bg-[#1a1a1a] text-white hover:bg-black text-xs font-semibold px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium rounded-xl">
          {error}
        </div>
      )}

      {/* Product Form Grid */}
      <form onSubmit={handleUpdate} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-2xs space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Description (HTML / Text)</label>
              <textarea
                rows={6}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black text-xs leading-relaxed"
              />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-2xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">Pricing</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Price (₹) *</label>
                <input
                  type="number"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Compare-at price (₹)</label>
                <input
                  type="number"
                  value={formData.compareAtPrice}
                  onChange={(e) => setFormData({ ...formData, compareAtPrice: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black text-sm"
                />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-2xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">Product Image</h2>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Image URL</label>
              <input
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black text-xs"
              />
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-2xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">Status</h2>

            <select
              value={formData.published ? 'active' : 'draft'}
              onChange={(e) => setFormData({ ...formData, published: e.target.value === 'active' })}
              className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-xs font-semibold"
            >
              <option value="active">Active (Visible in store)</option>
              <option value="draft">Draft (Hidden)</option>
            </select>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-2xs space-y-4 text-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">Product Organization</h2>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300"
              >
                <option value="book">Book</option>
                <option value="bookmark">Bookmark</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Vendor / Author</label>
              <input
                type="text"
                value={formData.vendor}
                onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Genre</label>
              <input
                type="text"
                value={formData.genre}
                onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Tags (comma separated)</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300"
              />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-2xs space-y-4 text-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">Inventory</h2>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">SKU</label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Quantity in Stock</label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
