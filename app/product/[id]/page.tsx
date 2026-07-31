'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Navigation from '@/components/Navigation';
import { useParams } from 'next/navigation';

export default function ProductPage() {
  const params = useParams();
  const [product, setProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      const res = await fetch(`/api/products/${params.id}`);
      const data = await res.json();
      setProduct(data);
    };
    
    fetchProduct();
  }, [params.id]);

  const handleAddToCart = () => {
    if (!product) return;
    
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItem = cart.find((item: any) => item._id === product._id);
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.push({ ...product, quantity });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    alert('✅ Added to cart!');
  };


  if (!product) {
    return (
      <>
        <Navigation />
        <div className="text-center py-12">Loading...</div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Images */}
          <div>
            <div className="relative h-96 bg-gray-100 rounded-lg overflow-hidden mb-4">
              {product.images[selectedImage] ? (
                <Image
                  src={product.images[selectedImage].url}
                  alt={product.images[selectedImage].alt || product.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No Image
                </div>
              )}
            </div>
            
            {/* Image thumbnails */}
            {product.images.length > 1 && (
              <div className="flex gap-2">
                {product.images.map((img: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative w-20 h-20 rounded border-2 overflow-hidden ${
                      selectedImage === idx ? 'border-black' : 'border-gray-300'
                    }`}
                  >

                    <Image
                      src={img.url}
                      alt={img.alt}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Details */}
          <div>
            <h1 className="text-4xl font-bold mb-4">{product.title}</h1>
            
            <div className="flex items-center gap-4 mb-6">
              <span className="text-3xl font-bold text-gray-900">
                ₹{product.price}
              </span>
              {product.compareAtPrice && (
                <span className="text-lg text-gray-500 line-through">
                  ₹{product.compareAtPrice}
                </span>
              )}
            </div>
            
            {/* Description */}
            {product.description && (
              <div
                className="prose prose-sm mb-8"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            )}
            
            {/* Quantity + Add to Cart */}
            <div className="flex gap-4 mb-8">
              <div className="flex items-center border border-gray-300 rounded">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2 hover:bg-gray-100"
                >
                  −
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 text-center border-x border-gray-300 py-2"
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 py-2 hover:bg-gray-100"
                >
                  +
                </button>
              </div>
              
              <button
                onClick={handleAddToCart}
                className="flex-1 bg-black text-white py-3 rounded-lg hover:bg-gray-800 font-medium"
              >
                Add to Cart
              </button>
            </div>
            
            {/* Meta info */}
            {(product.sku || product.material || product.color) && (
              <div className="border-t pt-6 space-y-2 text-sm">
                {product.sku && (
                  <p><span className="font-semibold">SKU:</span> {product.sku}</p>
                )}
                {product.material && (
                  <p><span className="font-semibold">Material:</span> {product.material}</p>
                )}
                {product.color && (
                  <p><span className="font-semibold">Color:</span> {product.color}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
