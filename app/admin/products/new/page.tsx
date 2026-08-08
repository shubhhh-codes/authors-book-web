'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import MultiImageUploader from '@/components/MultiImageUploader';
import RichTextEditor from '@/components/RichTextEditor';

const PRICE_PRESETS = [199, 299, 399, 499, 699, 999];
const QUANTITY_PRESETS = [5, 10, 25, 50, 100];
const LANGUAGE_PRESETS = ['English', 'Hindi', 'Bilingual', 'Urdu'];
const AUDIENCE_PRESETS = ['Adults', 'All Ages', 'Young Adults', 'Poetry Lovers'];
const MATERIAL_PRESETS = ['Brass Foil', 'Metal', 'Premium Card', 'Leatherette', 'Ribbon'];
const GENRE_PRESETS = ['Poetry', 'Literature', 'Arts & Music', 'Fiction', 'Non-Fiction', 'Self-Help'];

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '399',
    compareAtPrice: '499',
    vendor: 'Authors Book',
    category: 'Print Books',
    type: 'book',
    genre: 'Literature',
    tags: 'featured',
    sku: `AB-BOOK-${Math.floor(100000 + Math.random() * 900000)}`,
    weight: '0.3',
    quantity: '10',
    images: [] as string[],
    published: true,
    material: 'Brass Foil',
    color: 'Gold Foil',
    bookmarkShape: 'Rectangular',
    targetAudience: 'Adults',
    language: 'English',
    seoTitle: '',
    seoDescription: '',
  });

  // Prefetch products list for instantaneous navigation after creation
  useEffect(() => {
    router.prefetch('/admin/products');
  }, [router]);

  const generateSingleSku = (type: string) => {
    const prefix = type === 'bookmark' ? 'AB-BM' : 'AB-BOOK';
    const rand = Math.floor(100000 + Math.random() * 900000);
    return `${prefix}-${rand}`;
  };

  const handleTypeChange = (newType: string) => {
    setFormData((prev) => ({
      ...prev,
      type: newType,
      category: newType === 'bookmark' ? 'Bookmarks' : 'Print Books',
      sku: generateSingleSku(newType),
      material: newType === 'bookmark' ? prev.material || 'Brass Foil' : prev.material,
      color: newType === 'bookmark' ? prev.color || 'Gold Foil' : prev.color,
    }));
  };

  const applyDiscountPercent = (percent: number) => {
    const numPrice = Number(formData.price);
    if (!numPrice || isNaN(numPrice)) return;
    const compare = Math.round(numPrice / (1 - percent / 100));
    setFormData((prev) => ({ ...prev, compareAtPrice: String(compare) }));
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
    setFormData((prev) => ({ ...prev, tags: nextTags.join(', ') }));
  };

  const handleSubmit = async (e: React.FormEvent, redirectAfterSave = true) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessToast(null);

    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: Number(formData.price),
          compareAtPrice: formData.compareAtPrice ? Number(formData.compareAtPrice) : undefined,
          quantity: Number(formData.quantity),
          weight: Number(formData.weight),
          tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()) : [],
          images: formData.images,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        if (redirectAfterSave) {
          setSaveSuccess(true);
          router.push('/admin/products');
          router.refresh();
        } else {
          // Reset form for adding another product
          setFormData({
            title: '',
            description: '',
            price: '399',
            compareAtPrice: '499',
            vendor: 'Authors Book',
            category: 'Print Books',
            type: 'book',
            genre: 'Literature',
            tags: 'featured',
            sku: generateSingleSku('book'),
            weight: '0.3',
            quantity: '10',
            images: [] as string[],
            published: true,
            material: 'Brass Foil',
            color: 'Gold Foil',
            bookmarkShape: 'Rectangular',
            targetAudience: 'Adults',
            language: 'English',
            seoTitle: '',
            seoDescription: '',
          });
          setSuccessToast('✓ Product created successfully! Ready to add another.');
          setLoading(false);
        }
      } else {
        setError(data.error || 'Failed to create product');
        setLoading(false);
      }
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-admin-fade">
      {/* Top Header & Sticky Save Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-gray-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-600 hover:text-black transition-all hover:-translate-x-0.5 active:scale-95"
            title="Back to products list"
          >
            ← Back
          </Link>
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-widest">
              <span>Catalog Management</span>
              <span>•</span>
              <span>Single-SKU Mode</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Add New Product</h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            disabled={loading || saveSuccess}
            onClick={(e) => void handleSubmit(e, false)}
            className="bg-gray-100 text-gray-800 hover:bg-gray-200 text-xs font-semibold px-4 py-2.5 rounded-lg border border-gray-300 transition-all active:scale-95 disabled:opacity-50"
          >
            Save &amp; Add Another
          </button>
          <button
            type="button"
            disabled={loading || saveSuccess}
            onClick={(e) => void handleSubmit(e, true)}
            className={`text-xs font-semibold px-5 py-2.5 rounded-lg transition-all shadow-2xs flex items-center gap-1.5 active:scale-95 ${
              saveSuccess
                ? 'bg-emerald-600 text-white border border-emerald-600 font-bold animate-pulse-success'
                : 'bg-[#1a1a1a] text-white hover:bg-black disabled:opacity-60'
            }`}
          >
            {loading && !saveSuccess && (
              <svg className="w-3.5 h-3.5 btn-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12" />
              </svg>
            )}
            {saveSuccess ? '✓ Created! Redirecting...' : loading ? 'Saving Product...' : 'Save Product'}
          </button>
        </div>
      </div>

      {successToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold rounded-xl flex items-center justify-between animate-admin-fade">
          <span>{successToast}</span>
          <button onClick={() => setSuccessToast(null)} className="text-emerald-700 hover:text-emerald-950 text-sm font-bold">×</button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium rounded-xl flex items-center justify-between animate-admin-fade">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-800 text-sm font-bold">×</button>
        </div>
      )}

      {/* Main Form Grid */}
      <form onSubmit={(e) => void handleSubmit(e, true)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Basic Info, Media, Pricing, SEO */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Type & Basic Info */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-2xs space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Product Format / Type</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleTypeChange('book')}
                  className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                    formData.type === 'book'
                      ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20 text-emerald-950 font-bold'
                      : 'border-gray-200 hover:border-gray-300 bg-gray-50 text-gray-700 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">📖</span>
                    <div>
                      <div className="text-sm">Print Book</div>
                      <div className="text-[11px] text-gray-500 font-normal">Hardcover / Paperback</div>
                    </div>
                  </div>
                  {formData.type === 'book' && <span className="text-xs bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full">Selected</span>}
                </button>

                <button
                  type="button"
                  onClick={() => handleTypeChange('bookmark')}
                  className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                    formData.type === 'bookmark'
                      ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20 text-emerald-950 font-bold'
                      : 'border-gray-200 hover:border-gray-300 bg-gray-50 text-gray-700 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">🔖</span>
                    <div>
                      <div className="text-sm">Bookmark</div>
                      <div className="text-[11px] text-gray-500 font-normal">Brass, Ribbon, 3D Foil</div>
                    </div>
                  </div>
                  {formData.type === 'bookmark' && <span className="text-xs bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full">Selected</span>}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Product Title *</label>
              <input
                type="text"
                required
                placeholder={formData.type === 'bookmark' ? 'e.g. Brass Feather Bookmark (Gold Finish)' : 'e.g. Can We Be Strangers Again'}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Description (HTML / Rich Text)</label>
              <RichTextEditor
                value={formData.description}
                onChange={(val) => setFormData({ ...formData, description: val })}
                placeholder="Write book blurb, storytelling, material specs, or edition details..."
              />
            </div>
          </div>

          {/* Optimized Pricing & Discounts */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">Pricing &amp; Value Presets</h2>
              <span className="text-[11px] text-gray-400 font-mono">Currency: INR (₹)</span>
            </div>

            {/* Quick Price Buttons */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1.5">Quick Price Presets</label>
              <div className="flex flex-wrap gap-2">
                {PRICE_PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, price: String(p) }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      formData.price === String(p)
                        ? 'bg-black text-white border-black shadow-2xs'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200'
                    }`}
                  >
                    ₹{p}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Selling Price (₹) *</label>
                <input
                  type="number"
                  required
                  placeholder="399"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black text-sm font-bold"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-gray-700">Compare-at Price (₹)</label>
                  <span className="text-[10px] text-gray-400">Original MRP</span>
                </div>
                <input
                  type="number"
                  placeholder="499"
                  value={formData.compareAtPrice}
                  onChange={(e) => setFormData({ ...formData, compareAtPrice: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black text-sm text-gray-600"
                />
              </div>
            </div>

            {/* Quick Discount Calculator Buttons */}
            {formData.price && (
              <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-lg p-3 text-xs flex items-center justify-between gap-3">
                <span className="text-emerald-900 font-medium">Quick Compare-at MRP Calculator:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyDiscountPercent(15)}
                    className="px-2 py-1 rounded bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold text-[11px]"
                  >
                    +15% MRP
                  </button>
                  <button
                    type="button"
                    onClick={() => applyDiscountPercent(20)}
                    className="px-2 py-1 rounded bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold text-[11px]"
                  >
                    +20% MRP
                  </button>
                  <button
                    type="button"
                    onClick={() => applyDiscountPercent(25)}
                    className="px-2 py-1 rounded bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold text-[11px]"
                  >
                    +25% MRP
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Media */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-2xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">Product Media &amp; Cover Art</h2>
            <MultiImageUploader
              images={formData.images}
              onChange={(imgs) => setFormData((prev) => ({ ...prev, images: imgs }))}
            />
          </div>

          {/* SEO Section with Auto Generator */}
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
              <label className="block text-xs font-semibold text-gray-700 mb-1">SEO Title Tag</label>
              <input
                type="text"
                placeholder="Page title displayed on Google"
                value={formData.seoTitle}
                onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Meta Description</label>
              <textarea
                rows={3}
                placeholder="Meta description snippet for search engine previews..."
                value={formData.seoDescription}
                onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Status, Single-SKU Inventory, Presets */}
        <div className="lg:col-span-1 space-y-6">
          {/* Live Mini Preview Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs space-y-3">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Store Front Live Preview</h2>
            <div className="border border-gray-200 rounded-xl p-3 bg-gray-50 flex items-center gap-3">
              {formData.images[0] ? (
                <div className="w-14 h-20 relative rounded border border-black/10 overflow-hidden bg-white shrink-0">
                  <Image src={formData.images[0]} alt="Cover preview" fill className="object-cover" unoptimized={formData.images[0].startsWith('data:')} />
                </div>
              ) : (
                <div className="w-14 h-20 rounded border border-dashed border-gray-300 bg-white flex items-center justify-center text-[10px] text-gray-400 font-bold shrink-0">
                  NO COVER
                </div>
              )}
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-gray-900 truncate">{formData.title || 'Product Title'}</div>
                <div className="text-[11px] text-gray-500">{formData.vendor || 'Authors Book'}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-bold text-emerald-700">₹{formData.price || '0'}</span>
                  {formData.compareAtPrice && (
                    <span className="text-[10px] text-gray-400 line-through">₹{formData.compareAtPrice}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Visibility Status */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-2xs space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">Storefront Visibility</h2>
            <select
              value={formData.published ? 'active' : 'draft'}
              onChange={(e) => setFormData({ ...formData, published: e.target.value === 'active' })}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-xs font-semibold bg-gray-50"
            >
              <option value="active">🟢 Active (Published in Store)</option>
              <option value="draft">🟡 Draft (Hidden from Store)</option>
            </select>
          </div>

          {/* Single-SKU & Inventory Control */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-2xs space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">Single-SKU Inventory</h2>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">Standard Format</span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-gray-700">Stock Keeping Unit (SKU) *</label>
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, sku: generateSingleSku(prev.type) }))}
                  className="text-[11px] text-emerald-700 hover:underline font-semibold"
                >
                  ⚡ Regenerate SKU
                </button>
              </div>
              <input
                type="text"
                required
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 font-mono font-bold text-gray-900 bg-gray-50"
              />
              <p className="text-[10px] text-gray-400 mt-1">Single-SKU identifier format: AB-{formData.type.toUpperCase()}-XXXXXX</p>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1.5">Quantity in Stock</label>
              <div className="flex items-center gap-1.5 mb-2">
                {QUANTITY_PRESETS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, quantity: String(q) }))}
                    className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                      formData.quantity === String(q)
                        ? 'bg-black text-white border-black font-semibold'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
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

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Package Weight (kg)</label>
              <input
                type="number"
                step="0.05"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300"
              />
            </div>
          </div>

          {/* Organization & Quick Tag Buttons */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-2xs space-y-4 text-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">Organization &amp; Genre</h2>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Vendor / Publisher</label>
              <input
                type="text"
                value={formData.vendor}
                onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1.5">Genre / Classification</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {GENRE_PRESETS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, genre: g }))}
                    className={`px-2 py-0.5 rounded text-[11px] border transition-colors ${
                      formData.genre === g
                        ? 'bg-purple-100 text-purple-800 border-purple-300 font-bold'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={formData.genre}
                onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300"
              />
            </div>

            {/* Quick Collection Tag Chips */}
            <div>
              <label className="block font-semibold text-gray-700 mb-1.5">Collection Tags</label>
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
                      className={`px-2.5 py-1 rounded-full text-[11px] transition-all ${
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
                placeholder="bestseller, film, 3d, iconic..."
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs"
              />
            </div>
          </div>

          {/* Dynamic Attributes with Preset Buttons */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-2xs space-y-4 text-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
              {formData.type === 'bookmark' ? 'Bookmark Attributes' : 'Book Details & Language'}
            </h2>

            {formData.type === 'bookmark' ? (
              <>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1.5">Material</label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {MATERIAL_PRESETS.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, material: m }))}
                        className={`px-2 py-0.5 rounded text-[11px] border ${
                          formData.material === m ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold' : 'bg-gray-50 text-gray-600'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={formData.material}
                    onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1.5">Language</label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {LANGUAGE_PRESETS.map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, language: lang }))}
                        className={`px-2.5 py-1 rounded text-[11px] border ${
                          formData.language === lang ? 'bg-blue-100 text-blue-900 border-blue-300 font-bold' : 'bg-gray-50 text-gray-600'
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1.5">Target Audience</label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {AUDIENCE_PRESETS.map((aud) => (
                      <button
                        key={aud}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, targetAudience: aud }))}
                        className={`px-2.5 py-1 rounded text-[11px] border ${
                          formData.targetAudience === aud ? 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold' : 'bg-gray-50 text-gray-600'
                        }`}
                      >
                        {aud}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
