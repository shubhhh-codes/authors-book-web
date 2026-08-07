'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import MultiImageUploader from '@/components/MultiImageUploader';
import RichTextEditor from '@/components/RichTextEditor';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
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
    images: [] as string[],
    published: true,
    material: '',
    color: '',
    bookmarkShape: '',
    targetAudience: '',
    language: '',
    seoTitle: '',
    seoDescription: '',
  });

  // Prefetch products catalog for instant navigation after saving/deleting
  useEffect(() => {
    router.prefetch('/admin/products');
  }, [router]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${params.id}`);
        if (!res.ok) throw new Error('Product not found');
        const data = await res.json();
        const loadedImages = Array.isArray(data.images)
          ? data.images.map((img: { url?: string } | string) => (typeof img === 'string' ? img : img.url || '')).filter(Boolean)
          : [];

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
          images: loadedImages,
          published: data.published !== false,
          material: data.material || '',
          color: data.color || '',
          bookmarkShape: data.bookmarkShape || '',
          targetAudience: data.targetAudience || '',
          language: data.language || '',
          seoTitle: data.seoTitle || '',
          seoDescription: data.seoDescription || '',
        });
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Product not found');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) fetchProduct();
  }, [params.id]);

  const toggleTag = (tagToToggle: string) => {
    const currentTags = formData.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const exists = currentTags.some((t) => t.toLowerCase() === tagToToggle.toLowerCase());
    let nextTags: string[];
    if (exists) {
      nextTags = currentTags.filter((t) => t.toLowerCase() !== tagToToggle.toLowerCase());
    } else {
      nextTags = [...currentTags, tagToToggle];
    }
    setFormData({ ...formData, tags: nextTags.join(', ') });
  };

  const generateSeoFromTitle = () => {
    if (!formData.title) return;
    const cleanDesc = formData.description.replace(/<[^>]*>?/gm, '').trim();

    const isBookmark = formData.type === 'bookmark';
    const itemType = isBookmark ? 'Bookmark' : 'Book';
    const authorOrVendor = formData.vendor ? `by ${formData.vendor}` : 'from Authors Book';
    const priceText = formData.price ? `at ₹${formData.price}` : '';

    const seoTitle = `${formData.title} ${authorOrVendor} | ${isBookmark ? 'Handcrafted Bookmark' : 'Premium Edition'} | Authors Book`;
    const fallbackMeta = `Buy ${formData.title} ${authorOrVendor} ${priceText}. Premium handcrafted ${itemType.toLowerCase()} edition available now at Authors Book with fast nationwide delivery across India.`;
    const seoDescription = cleanDesc ? `${cleanDesc.slice(0, 140)}... Buy ${formData.title} ${priceText}.` : fallbackMeta;

    setFormData((prev) => ({
      ...prev,
      seoTitle,
      seoDescription,
    }));
  };

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
          inventory: { quantity: Math.max(0, Number(formData.quantity) || 0), policy: 'deny' },
          tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()) : [],
          images: formData.images,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSaveSuccess(true);
        router.push('/admin/products');
        router.refresh();
      } else {
        setError(data.error || 'Failed to update product');
        setSaving(false);
      }
    } catch {
      setError('Something went wrong. Please try again.');
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
        setDeleteSuccess(true);
        router.push('/admin/products');
        router.refresh();
      } else {
        alert('Failed to delete product');
        setDeleting(false);
      }
    } catch {
      alert('Error deleting product');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-gray-500 font-medium animate-admin-fade flex items-center justify-center gap-2">
        <svg className="w-4 h-4 btn-spinner text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12" />
        </svg>
        <span>Loading product details...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-admin-fade">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="p-1.5 rounded-lg border border-gray-300 hover:border-black text-gray-600 hover:text-black transition-all hover:-translate-x-0.5 active:scale-95"
          >
            ← Back
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Edit Product</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting || deleteSuccess}
            className={`text-xs font-semibold px-4 py-2.5 rounded-lg transition-all border shadow-2xs flex items-center gap-1.5 active:scale-95 ${
              deleteSuccess
                ? 'bg-rose-600 text-white border-rose-600 font-bold'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200'
            }`}
          >
            {deleting && (
              <svg className="w-3.5 h-3.5 btn-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12" />
              </svg>
            )}
            {deleteSuccess ? '✓ Deleted! Redirecting...' : deleting ? 'Deleting...' : 'Delete Product'}
          </button>

          <button
            type="button"
            onClick={handleUpdate}
            disabled={saving || saveSuccess}
            className={`text-xs font-semibold px-5 py-2.5 rounded-lg transition-all shadow-2xs flex items-center gap-1.5 active:scale-95 ${
              saveSuccess
                ? 'bg-emerald-600 text-white border border-emerald-600 font-bold animate-pulse-success'
                : 'bg-[#1a1a1a] text-white hover:bg-black disabled:opacity-60'
            }`}
          >
            {saving && !saveSuccess && (
              <svg className="w-3.5 h-3.5 btn-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12" />
              </svg>
            )}
            {saveSuccess ? '✓ Saved! Redirecting...' : saving ? 'Saving Changes...' : 'Save Changes'}
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
              <RichTextEditor
                value={formData.description}
                onChange={(val) => setFormData({ ...formData, description: val })}
                placeholder="Write book description, blurb, format details... Use <mark> to highlight text!"
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
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">Product Cover & Gallery Photos</h2>
            <MultiImageUploader
              images={formData.images}
              onChange={(imgs) => setFormData({ ...formData, images: imgs })}
            />
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">Search Engine Optimization (SEO)</h2>
              <button
                type="button"
                onClick={generateSeoFromTitle}
                disabled={!formData.title}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 disabled:opacity-40"
              >
                ⚡ Auto-fill SEO metadata
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">SEO Title</label>
              <input
                type="text"
                value={formData.seoTitle}
                onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black text-xs"
                placeholder="e.g. Think Like a Monk by Jay Shetty | Authors Book"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Meta Description</label>
              <textarea
                rows={3}
                value={formData.seoDescription}
                onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black text-xs"
                placeholder="Brief meta description for search engine previews..."
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
              <label className="block font-semibold text-gray-700 mb-1">Product Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 font-semibold"
              >
                <option value="book">Book 📖</option>
                <option value="bookmark">Bookmark 🔖</option>
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
              <label className="block font-semibold text-gray-700 mb-1">Genre / Category</label>
              <input
                type="text"
                value={formData.genre}
                onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300"
                placeholder="e.g. Non-Fiction, Fiction, Self-Help"
              />
            </div>

            {/* Quick Collection Tag Chips */}
            <div>
              <label className="block font-semibold text-gray-700 mb-1.5">Collection Filter Tags</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {[
                  { tag: 'bestseller', label: 'Best Seller' },
                  { tag: 'film', label: 'In Film' },
                  { tag: '3d', label: '3D Bookmark' },
                  { tag: 'iconic', label: 'Iconic Series' },
                  { tag: 'featured', label: 'Featured' },
                ].map(({ tag, label }) => {
                  const isSelected = formData.tags
                    .split(',')
                    .map((t) => t.trim().toLowerCase())
                    .includes(tag.toLowerCase());
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                        isSelected
                          ? 'bg-black text-white shadow-2xs font-semibold'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                      }`}
                    >
                      {isSelected ? `✓ ${label}` : `+ ${label}`}
                    </button>
                  );
                })}
              </div>

              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs"
                placeholder="Comma separated tags: bestseller, film, 3d..."
              />
            </div>
          </div>

          {/* Specific Attributes for Bookmark or Book */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-2xs space-y-4 text-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
              {formData.type === 'bookmark' ? 'Bookmark Attributes' : 'Book Details'}
            </h2>

            {formData.type === 'bookmark' ? (
              <>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Bookmark Shape</label>
                  <input
                    type="text"
                    value={formData.bookmarkShape}
                    onChange={(e) => setFormData({ ...formData, bookmarkShape: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300"
                    placeholder="e.g. Rectangular, Ribbon, Standard"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Material</label>
                  <input
                    type="text"
                    value={formData.material}
                    onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300"
                    placeholder="e.g. Brass Foil, Metal, Premium Card"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Language</label>
                  <input
                    type="text"
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300"
                    placeholder="e.g. English, Hindi"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Target Audience</label>
                  <input
                    type="text"
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300"
                    placeholder="e.g. Adults, Suitable for all ages"
                  />
                </div>
              </>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-2xs space-y-4 text-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">Inventory & SKU</h2>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">SKU</label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Quantity in Stock</label>
              <input
                type="number"
                min="0"
                value={formData.quantity}
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                onKeyDown={(e) => {
                  if (e.key === '-' || e.key === 'e') e.preventDefault();
                }}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setFormData({ ...formData, quantity: isNaN(val) ? '' : String(Math.max(0, val)) });
                }}
                onBlur={(e) => {
                  const val = parseInt(e.target.value);
                  if (isNaN(val) || val < 0) {
                    setFormData({ ...formData, quantity: '0' });
                  }
                }}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 font-bold"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
