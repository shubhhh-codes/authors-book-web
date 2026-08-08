'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import DOMPurify from 'isomorphic-dompurify';
import Navigation from '@/components/Navigation';
import CartDrawer from '@/components/CartDrawer';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { isValidCatalogProduct } from '@/lib/catalogUtils';
import type { Product, CartItem, ProductImage } from '@/lib/types';

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50, isHovered: false });
  const [addedToast, setAddedToast] = useState(false);
  const [addedToastQty, setAddedToastQty] = useState(1);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startToastTimer = (duration = 7500) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setAddedToast(false), duration);
  };

  // Fetch active product and full catalog in parallel for fast loading
  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const [productRes, listRes] = await Promise.all([
          fetch(`/api/products/${params.id}`),
          fetch('/api/products?limit=50'),
        ]);

        if (productRes.ok) {
          const data = await productRes.json();
          if (data && !data.error) {
            setProduct(data);
            // SEO redirect: if accessed via raw MongoDB ObjectId, replace URL bar with human-readable handle
            if (data.handle && params.id !== data.handle) {
              router.replace(`/product/${data.handle}`);
            }
          }
        }

        if (listRes.ok) {
          const listData = await listRes.json();
          const items = Array.isArray(listData) ? listData : listData.products || listData.data || [];
          if (Array.isArray(items)) {
            setAllProducts(items);
          }
        }
      } catch (err) {
        console.error('Error fetching product:', err);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchProduct();
    }
  }, [params.id]);

  const handleAddToCart = () => {
    if (!product) return;
    const currentStock = product.inventory?.quantity;
    if (currentStock !== undefined && currentStock <= 0) return;

    const saved = localStorage.getItem('ab_cart') || localStorage.getItem('cart') || '[]';
    const cart: CartItem[] = JSON.parse(saved);
    const existingItem = cart.find((item: CartItem) => item._id === product._id);

    let totalQty = quantity;
    if (existingItem) {
      existingItem.quantity += quantity;
      totalQty = existingItem.quantity;
    } else {
      cart.push({ ...product, quantity });
      totalQty = quantity;
    }

    localStorage.setItem('ab_cart', JSON.stringify(cart));
    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cart-updated'));

    // Show non-disruptive feedback button state + floating toast notification
    setAddedToastQty(totalQty);
    setAddedToast(true);
    startToastTimer(7500);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y, isHovered: true });
  };

  const handleMouseLeave = () => {
    setZoomPos((prev) => ({ ...prev, isHovered: false }));
  };

  // Filter products using quality guard
  const validProducts = allProducts.filter(isValidCatalogProduct);

  const categoryProducts = validProducts.filter(
    (p) =>
      String(p._id) !== String(product?._id) &&
      p.category &&
      product?.category &&
      p.category.trim().toLowerCase() === product.category.trim().toLowerCase()
  );

  const fallbackProducts = validProducts.filter(
    (p) => String(p._id) !== String(product?._id) && !categoryProducts.some((cp) => String(cp._id) === String(p._id))
  );

  // Prioritize in-stock items first
  const sortedCategory = [...categoryProducts].sort((a, b) => ((b.inventory?.quantity ?? 1) > 0 ? 1 : 0) - ((a.inventory?.quantity ?? 1) > 0 ? 1 : 0));
  const sortedFallback = [...fallbackProducts].sort((a, b) => ((b.inventory?.quantity ?? 1) > 0 ? 1 : 0) - ((a.inventory?.quantity ?? 1) > 0 ? 1 : 0));

  const youMayLikeProducts = [...sortedCategory, ...sortedFallback].slice(0, 4);

  // Calculate estimated delivery date (3-5 business days from today)
  const today = new Date();
  const deliveryStart = new Date(today);
  deliveryStart.setDate(today.getDate() + 3);
  const deliveryEnd = new Date(today);
  deliveryEnd.setDate(today.getDate() + 5);

  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f0ea] flex flex-col font-serif">
        <Navigation showAnnouncement={false} />
        <div className="flex-1 flex items-center justify-center text-sm text-[#8c8275] tracking-widest uppercase py-24">
          Loading Library Edition...
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#f4f0ea] flex flex-col font-serif">
        <Navigation showAnnouncement={false} />
        <div className="max-w-xl mx-auto py-24 px-6 text-center space-y-4">
          <h1 className="text-2xl font-serif text-[#1a1714]">Volume Not Found</h1>
          <p className="text-xs text-[#8c8275] uppercase tracking-widest">The requested publication could not be located in our library catalog.</p>
          <Link href="/" className="inline-block border-b border-[#1a1714] text-xs font-bold uppercase tracking-[0.2em] py-1 text-[#1a1714]">
            Return to Shelf
          </Link>
        </div>
      </div>
    );
  }

  const images = product.images || [];
  const currentQuantity = product.inventory?.quantity ?? 10;
  const isOutOfStock = currentQuantity <= 0;
  const isLowStock = currentQuantity > 0 && currentQuantity <= 5;

  const nextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (images.length === 0) return;
    setSelectedImage((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (images.length === 0) return;
    setSelectedImage((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="min-h-screen bg-[#f4f0ea] text-[#1a1714] selection:bg-[#1a1714] selection:text-[#f4f0ea] flex flex-col">
      <Navigation showAnnouncement={false} />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 md:py-12 space-y-12 sm:space-y-16">
        {/* Editorial Layout: Image Cover (Left) + Editorial Detail Copy (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          {/* Left Column: Cover Display & Lens Magnifier */}
          <div className="lg:col-span-5 space-y-4">
            <div
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              onClick={() => images[selectedImage] && setIsZoomOpen(true)}
              className="relative w-full aspect-[3/4] bg-[#e9e3da] rounded-lg overflow-hidden shadow-[0_16px_40px_rgba(0,0,0,0.1)] border border-[#ded7cb] cursor-zoom-in group"
            >
              {images[selectedImage] ? (
                <>
                  <div
                    className="relative w-full h-full transition-transform duration-200 ease-out"
                    style={{
                      transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                      transform: zoomPos.isHovered ? 'scale(1.85)' : 'scale(1)',
                    }}
                  >
                    <Image
                      src={images[selectedImage].url}
                      alt={images[selectedImage].alt || product.title}
                      fill
                      className="object-cover"
                      unoptimized
                      priority
                    />
                  </div>

                  {!zoomPos.isHovered && (
                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold uppercase tracking-widest bg-black/40 pointer-events-none">
                      Click for Fullscreen Zoom 🔍
                    </div>
                  )}

                  {images.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={prevImage}
                        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-black shadow-md flex items-center justify-center text-sm font-bold transition-all hover:scale-110 active:scale-95"
                        aria-label="Previous photo"
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        onClick={nextImage}
                        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-black shadow-md flex items-center justify-center text-sm font-bold transition-all hover:scale-110 active:scale-95"
                        aria-label="Next photo"
                      >
                        ›
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center font-serif italic text-sm text-[#8c8275]">
                  No cover image available
                </div>
              )}
            </div>

            {/* Thumbnail Navigation */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pt-2 pb-1">
                {images.map((img: ProductImage, idx: number) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImage(idx)}
                    className={`relative w-16 h-20 rounded border-2 overflow-hidden flex-shrink-0 transition-all ${
                      selectedImage === idx ? 'border-[#1a1714] shadow-xs scale-105' : 'border-[#dcd5c9] opacity-70 hover:opacity-100'
                    }`}
                  >
                    <Image src={img.url} alt={img.alt || product.title} fill className="object-cover" unoptimized />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Editorial Details */}
          <div className="lg:col-span-7 space-y-6">
            {/* Edition Eyebrow & Stock Status */}
            <div className="flex items-center justify-between">
              <p className="text-[10px] sm:text-[11px] font-semibold tracking-[0.22em] text-[#8c8275] uppercase">
                {product.type?.toLowerCase() === 'bookmark' ? 'COLLECTION EDITION' : 'LIBRARY EDITION'}
              </p>

              {isLowStock && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                  ⚡ Only {currentQuantity} left
                </span>
              )}
            </div>

            {/* Large Serif Title */}
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#1a1714] leading-[1.12] tracking-tight">
              {product.title}
            </h1>

            {/* Author / Vendor Name */}
            {product.vendor && (
              <p className="font-serif italic text-lg sm:text-xl text-[#5a5248]">
                by {product.vendor}
              </p>
            )}

            {/* Product Description */}
            {product.description && (
              <div
                className="prose prose-sm font-serif text-[#3e3830] leading-relaxed tracking-wide pt-2 border-t border-[#ded7cb]"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(product.description),
                }}
              />
            )}



            {/* Specifications Grid */}
            <div className="border-t border-[#e0d9cf] pt-5 my-4 grid grid-cols-2 gap-6 text-left">
              <div>
                <dt className="text-[9px] sm:text-[10px] uppercase tracking-[0.25em] font-semibold text-[#8c8275] mb-1">
                  Format
                </dt>
                <dd className="font-serif text-xs sm:text-sm text-[#1a1714]">
                  {product.type?.toLowerCase() === 'bookmark' ? product.material || 'Metal • Gold Foil' : 'Hardcover • illustrated'}
                </dd>
              </div>

              <div>
                <dt className="text-[9px] sm:text-[10px] uppercase tracking-[0.25em] font-semibold text-[#8c8275] mb-1.5">
                  Price
                </dt>
                <dd className="font-serif flex flex-wrap items-baseline gap-2.5">
                  <span className="text-xl sm:text-2xl font-bold text-[#1a1714]">
                    ₹{product.price.toLocaleString('en-IN')}
                  </span>
                  {product.compareAtPrice && product.compareAtPrice > product.price && (
                    <span className="text-sm sm:text-base text-[#7c7365] line-through font-normal decoration-[#8c8275]/80">
                      ₹{product.compareAtPrice.toLocaleString('en-IN')}
                    </span>
                  )}
                </dd>
              </div>
            </div>

            {/* Quantity Selector & Add to Cart Action Bar */}
            <div className="border-t border-[#1a1714] pt-6 space-y-4">
              <div className="flex items-center gap-3 sm:gap-4">
                {/* Quantity Box */}
                <div className={`h-12 shrink-0 flex items-center border border-[#1a1714] rounded-lg overflow-hidden bg-white/50 text-xs font-semibold ${isOutOfStock ? 'opacity-40 pointer-events-none' : ''}`}>
                  <button
                    type="button"
                    disabled={isOutOfStock}
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="h-full px-3.5 flex items-center justify-center hover:bg-[#e0d9cf] transition-colors disabled:cursor-not-allowed cursor-pointer"
                  >
                    −
                  </button>
                  <span className="h-full px-3 flex items-center justify-center font-mono text-center min-w-[2.2rem] text-[#1a1714]">
                    {isOutOfStock ? 0 : quantity}
                  </span>
                  <button
                    type="button"
                    disabled={isOutOfStock || quantity >= currentQuantity}
                    onClick={() => setQuantity(quantity + 1)}
                    className="h-full px-3.5 flex items-center justify-center hover:bg-[#e0d9cf] transition-colors disabled:cursor-not-allowed cursor-pointer"
                  >
                    +
                  </button>
                </div>

                {/* Add to Cart CTA */}
                <button
                  type="button"
                  disabled={isOutOfStock}
                  onClick={handleAddToCart}
                  className={`h-12 flex-1 min-w-0 px-3 sm:px-6 rounded-lg text-[11px] sm:text-xs font-bold tracking-[0.1em] sm:tracking-[0.2em] uppercase transition-all duration-200 shadow-sm flex items-center justify-between group active:scale-[0.99] ${
                    isOutOfStock
                      ? 'bg-[#d0c9bd] text-[#7a7267] cursor-not-allowed shadow-none'
                      : addedToast
                      ? 'bg-emerald-700 text-white shadow-emerald-700/20 ring-2 ring-emerald-500/30'
                      : 'bg-[#1a1714] text-[#f4f0ea] hover:bg-[#2c2620]'
                  }`}
                >
                  <span className="truncate min-w-0">{isOutOfStock ? 'Sold Out' : addedToast ? '✓ Added to Cart!' : `Add to Cart — ₹${(product.price * quantity).toLocaleString('en-IN')}`}</span>
                  <span className="text-sm transition-transform duration-200 group-hover:translate-x-1 group-hover:-translate-y-0.5 shrink-0 ml-1.5" aria-hidden="true">
                    {isOutOfStock ? '✕' : addedToast ? '✓' : '↗'}
                  </span>
                </button>
              </div>

              {/* Delivery Estimates */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-4 text-[11px] text-[#8c8275] tracking-wider pt-3 border-t border-[#ded7cb]/60">
                <span className="flex items-center gap-1.5">
                  🚚 Est. Delivery: <strong className="text-[#1a1714] font-semibold">{formatDate(deliveryStart)} – {formatDate(deliveryEnd)}</strong>
                </span>
                <span className="uppercase font-semibold tracking-widest text-[#5a5248]">
                  Free Shipping Across India
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Premium Recommendations Section */}
        {youMayLikeProducts.length > 0 && (
          <section className="border-t border-[#e0d9cf] pt-12 mt-16 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8c8275] mb-1">
                  Editorial Selection
                </p>
                <h2 className="font-serif text-2xl sm:text-3xl font-normal text-[#1a1714] tracking-tight">
                  Curated for Your Library
                </h2>
              </div>
              <Link href="/shop" className="text-xs font-bold uppercase tracking-widest text-[#1a1714] hover:opacity-60 transition-opacity">
                Explore Catalog →
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {youMayLikeProducts.map((relProduct) => (
                <ProductCard key={relProduct._id} product={relProduct} />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Lightbox Cover Zoom Modal */}
      {isZoomOpen && images[selectedImage] && (
        <div
          onClick={() => setIsZoomOpen(false)}
          className="fixed inset-0 z-50 bg-[#1c1815]/92 backdrop-blur-md flex flex-col items-center justify-center p-6 cursor-zoom-out animate-fadeIn select-none"
        >
          {/* Main Zoomed Image Container */}
          <div className="relative max-w-4xl max-h-[75vh] sm:max-h-[80vh] w-full h-full flex items-center justify-center">
            <Image
              src={images[selectedImage].url}
              alt={images[selectedImage].alt || product.title}
              fill
              className="object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
              unoptimized
            />

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prevImage}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-50 w-11 h-11 rounded-full bg-white/10 hover:bg-white/30 text-white border border-white/20 flex items-center justify-center text-2xl font-bold backdrop-blur-md transition-all active:scale-95 cursor-pointer"
                  aria-label="Previous image"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={nextImage}
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-50 w-11 h-11 rounded-full bg-white/10 hover:bg-white/30 text-white border border-white/20 flex items-center justify-center text-2xl font-bold backdrop-blur-md transition-all active:scale-95 cursor-pointer"
                  aria-label="Next image"
                >
                  ›
                </button>
              </>
            )}
          </div>

          {/* Top Bar: Counter & Close */}
          <div className="absolute top-6 left-6 flex items-center gap-3">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#e0d9cf] bg-white/10 border border-white/15 px-3 py-1.5 rounded-full backdrop-blur-md">
              Photo {selectedImage + 1} of {images.length}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsZoomOpen(false)}
            className="absolute top-6 right-6 text-white text-xs uppercase font-bold tracking-[0.2em] bg-white/10 border border-white/15 px-4 py-2 rounded-full hover:bg-white/30 transition-all backdrop-blur-md cursor-pointer"
          >
            Close ✕
          </button>

          {/* Bottom Bar: Thumbnail Strip & Book Title */}
          <div className="absolute bottom-6 flex flex-col items-center gap-2 max-w-md w-full px-4">
            {images.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto p-1.5 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md">
                {images.map((img: ProductImage, idx: number) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImage(idx);
                    }}
                    className={`relative w-10 h-12 rounded overflow-hidden border transition-all ${
                      selectedImage === idx ? 'border-white scale-110 shadow-md ring-1 ring-white/50' : 'border-transparent opacity-50 hover:opacity-100'
                    }`}
                  >
                    <Image src={img.url} alt={img.alt || product.title} fill className="object-cover" unoptimized />
                  </button>
                ))}
              </div>
            )}
            <p className="font-serif italic text-xs text-[#ded7cb]/90 tracking-wide text-center">
              {product.title} {product.vendor ? `by ${product.vendor}` : ''}
            </p>
          </div>
        </div>
      )}

      {/* Structured JSON-LD Data for SEO & Rich Snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org/',
            '@type': 'Product',
            name: product.title,
            image: images.map((i) => i.url),
            description: product.seoDescription || product.description?.replace(/<[^>]*>?/gm, ''),
            sku: product.sku || product._id,
            brand: {
              '@type': 'Brand',
              name: product.vendor || 'Authors Book',
            },
            offers: {
              '@type': 'Offer',
              priceCurrency: 'INR',
              price: product.price,
              availability: 'https://schema.org/InStock',
            },
          }),
        }}
      />

      {/* Floating Non-Intrusive Added-to-Cart Toast */}
      {addedToast && (
        <div
          onClick={(e) => e.stopPropagation()}
          onMouseEnter={() => {
            if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
          }}
          onMouseLeave={() => startToastTimer(5000)}
          className="fixed bottom-6 right-6 z-50 animate-bounce-in max-w-sm w-full bg-[#1a1714] text-[#f4f0ea] rounded-xl shadow-2xl p-4 border border-white/15 flex items-center justify-between gap-3 backdrop-blur-md"
        >
          <div className="flex items-center gap-3 overflow-hidden">
            {images[0] && (
              <div className="relative w-10 h-12 rounded overflow-hidden bg-[#e9e3da] shrink-0 border border-white/10">
                <Image src={images[0].url} alt={product.title} fill className="object-cover" unoptimized />
              </div>
            )}
            <div className="overflow-hidden">
              <div className="text-xs font-bold truncate flex items-center gap-1.5 text-emerald-400">
                <span>✓</span> Added to Cart
              </div>
              <div className="text-[11px] text-[#ded7cb]/90 truncate">{product.title} (Qty: {addedToastQty})</div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
                setAddedToast(false);
                setIsCartOpen(true);
              }}
              className="px-3 py-1.5 bg-white text-black font-bold text-[10px] uppercase tracking-wider rounded-md hover:bg-[#e0d9cf] transition-all cursor-pointer"
            >
              View Cart
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
                setAddedToast(false);
              }}
              className="p-1 text-gray-400 hover:text-white text-xs transition-colors cursor-pointer"
              aria-label="Close notification"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <Footer />
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
}
