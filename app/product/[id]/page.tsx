'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import CartDrawer from '@/components/CartDrawer';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
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

  // Fetch active product and full catalog for volume navigation and related products
  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/products/${params.id}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data && !data.error) {
          setProduct(data);
        }

        const listRes = await fetch('/api/products');
        if (listRes.ok) {
          const listData = await listRes.json();
          if (Array.isArray(listData)) {
            setAllProducts(listData);
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

    const saved = localStorage.getItem('ab_cart') || localStorage.getItem('cart') || '[]';
    const cart: CartItem[] = JSON.parse(saved);
    const existingItem = cart.find((item: CartItem) => item._id === product._id);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.push({ ...product, quantity });
    }

    localStorage.setItem('ab_cart', JSON.stringify(cart));
    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cart-updated'));
    setIsCartOpen(true);
  };

  // Related products from same category/genre
  const relatedProducts = allProducts
    .filter((p) => String(p._id) !== String(product?._id))
    .slice(0, 4);

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
  const isLowStock = currentQuantity > 0 && currentQuantity <= 5;

  return (
    <div className="min-h-screen bg-[#f4f0ea] text-[#1a1714] selection:bg-[#1a1714] selection:text-[#f4f0ea] flex flex-col">
      <Navigation showAnnouncement={false} />

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8 md:py-12 space-y-16">
        {/* Editorial Layout: Image Cover (Left) + Editorial Detail Copy (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          {/* Left Column: Cover Display & Lightbox Zoom */}
          <div className="lg:col-span-5 space-y-4">
            <div
              onClick={() => images[selectedImage] && setIsZoomOpen(true)}
              className="relative w-full aspect-[3/4] bg-[#e9e3da] rounded-lg overflow-hidden shadow-[0_16px_40px_rgba(0,0,0,0.1)] border border-[#ded7cb] cursor-zoom-in group"
            >
              {images[selectedImage] ? (
                <>
                  <Image
                    src={images[selectedImage].url}
                    alt={images[selectedImage].alt || product.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    unoptimized
                    priority
                  />
                  <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold uppercase tracking-widest bg-black/40">
                    Click to Zoom Cover 🔍
                  </div>
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
                {product.vendor}
              </p>
            )}

            {/* Description Paragraph */}
            {product.description && (
              <div className="font-serif text-sm sm:text-base text-[#2c2620] leading-relaxed pt-1">
                <div dangerouslySetInnerHTML={{ __html: product.description }} />
              </div>
            )}

            {/* Editorial Pull Quote / Testimonial Block */}
            {!product.description?.includes('blockquote') && (
              <div className="border-l-2 border-[#1a1714] pl-4 py-1 my-6 space-y-1">
                <p className="font-serif italic text-base sm:text-lg text-[#1a1714] leading-snug">
                  “{product.seoDescription || `${product.title} by ${product.vendor || 'Authors book & bookmarks'}. Order your copy.`}”
                </p>
                <p className="text-[10px] font-bold tracking-[0.2em] text-[#8c8275] uppercase">
                  {product.genre ? `${product.genre} REVIEW` : 'EDITORIAL CHOICE'}
                </p>
              </div>
            )}

            {/* Specifications Grid */}
            <div className="border-t border-[#e0d9cf] pt-5 my-6 grid grid-cols-2 sm:grid-cols-3 gap-6 text-left">
              <div>
                <dt className="text-[9px] sm:text-[10px] uppercase tracking-[0.25em] font-semibold text-[#8c8275] mb-1">
                  Format
                </dt>
                <dd className="font-serif text-xs sm:text-sm text-[#1a1714]">
                  {product.type?.toLowerCase() === 'bookmark' ? product.material || 'Metal • Gold Foil' : 'Hardcover • illustrated'}
                </dd>
              </div>

              <div>
                <dt className="text-[9px] sm:text-[10px] uppercase tracking-[0.25em] font-semibold text-[#8c8275] mb-1">
                  Availability
                </dt>
                <dd className="font-serif text-xs sm:text-sm text-[#1a1714]">
                  {currentQuantity > 0 ? `${currentQuantity} in stock` : 'Available now'}
                </dd>
              </div>

              <div>
                <dt className="text-[9px] sm:text-[10px] uppercase tracking-[0.25em] font-semibold text-[#8c8275] mb-1">
                  Price
                </dt>
                <dd className="font-serif text-xs sm:text-sm font-bold text-[#1a1714]">
                  ₹{product.price.toLocaleString('en-IN')}
                  {product.compareAtPrice && product.compareAtPrice > product.price && (
                    <span className="text-xs text-[#9a9184] line-through font-normal ml-2">
                      ₹{product.compareAtPrice.toLocaleString('en-IN')}
                    </span>
                  )}
                </dd>
              </div>
            </div>

            {/* Quantity Selector & Add to Cart Action Bar */}
            <div className="border-t border-[#1a1714] pt-6 space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                {/* Quantity Box */}
                <div className="flex items-center border border-[#1a1714] rounded-lg overflow-hidden bg-white/50 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3.5 py-2.5 hover:bg-[#e0d9cf] transition-colors"
                  >
                    −
                  </button>
                  <span className="px-4 py-2.5 font-mono text-center min-w-[2.5rem] text-[#1a1714]">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3.5 py-2.5 hover:bg-[#e0d9cf] transition-colors"
                  >
                    +
                  </button>
                </div>

                {/* Add to Cart CTA */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="flex-1 bg-[#1a1714] text-[#f4f0ea] hover:bg-[#2c2620] px-6 py-3 rounded-lg text-xs font-bold tracking-[0.2em] uppercase transition-all duration-200 shadow-sm flex items-center justify-between group active:scale-[0.99]"
                >
                  <span>Add to Cart — ₹{(product.price * quantity).toLocaleString('en-IN')}</span>
                  <span className="text-sm transition-transform duration-200 group-hover:translate-x-1 group-hover:-translate-y-0.5" aria-hidden="true">
                    ↗
                  </span>
                </button>
              </div>

              {/* Delivery Estimates */}
              <div className="flex items-center justify-between text-[10px] text-[#8c8275] uppercase tracking-widest pt-2 border-t border-[#e0d9cf]/60">
                <span>🚚 Est. Delivery: {formatDate(deliveryStart)} – {formatDate(deliveryEnd)}</span>
                <span>Free Shipping Across India</span>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products Carousel / Grid */}
        {relatedProducts.length > 0 && (
          <section className="border-t border-[#e0d9cf] pt-12 mt-16 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-2xl text-[#1a1714]">More Volumes from Authors Book</h2>
              <Link href="/shop" className="text-xs font-bold uppercase tracking-widest text-[#1a1714] hover:opacity-60 transition-opacity">
                View Full Catalog →
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.map((relProduct) => (
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
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-6 cursor-zoom-out animate-fadeIn"
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full">
            <Image
              src={images[selectedImage].url}
              alt={images[selectedImage].alt || product.title}
              fill
              className="object-contain"
              unoptimized
            />
          </div>
          <button
            type="button"
            onClick={() => setIsZoomOpen(false)}
            className="absolute top-6 right-6 text-white text-xs uppercase font-bold tracking-widest bg-white/20 px-4 py-2 rounded-full hover:bg-white/40 transition-colors"
          >
            Close ✕
          </button>
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

      <Footer />
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
}
