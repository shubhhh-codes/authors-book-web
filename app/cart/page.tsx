'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import type { CartItem } from '@/lib/types';

interface HeadlessCheckoutInstance {
  addToCart: (event: unknown, token: string, options?: { fallbackUrl: string }) => void;
}

declare global {
  interface Window {
    HeadlessCheckout?: HeadlessCheckoutInstance;
  }
}

export default function Cart() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch {
        setCart([]);
      }
    }
  }, []);

  const subtotal = cart.reduce((sum: number, item: CartItem) => sum + item.price * item.quantity, 0);
  const shippingCost = subtotal > 500 ? 0 : 100;
  const total = subtotal + shippingCost;

  const removeItem = (productId: string) => {
    const updated = cart.filter((item: CartItem) => item._id !== productId);
    setCart(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    const updated = cart.map((item: CartItem) =>
      item._id === productId ? { ...item, quantity: newQuantity } : item
    );
    setCart(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
  };

  const handleCheckout = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (cart.length === 0) {
      alert('Cart is empty');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/checkout/initiate-fastrr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map((item) => ({
            id: item._id,
            quantity: item.quantity,
            sku: item.sku || '',
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to initiate Fastrr session');
      }

      const data = await response.json();

      if (!data.token) {
        throw new Error('Access token not returned from server');
      }

      if (window.HeadlessCheckout) {
        window.HeadlessCheckout.addToCart(e.nativeEvent, data.token, {
          fallbackUrl: '/cart',
        });
      } else {
        console.warn('[Fastrr] HeadlessCheckout SDK not loaded.');
        alert('Fastrr Checkout is loading, please try again in a moment.');
      }
    } catch (error) {
      console.error('[Checkout error]', error);
      alert(error instanceof Error ? error.message : 'Checkout initialization failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navigation />
      {cart.length === 0 ? (
        <div className="max-w-7xl mx-auto px-6 py-16 text-center font-serif">
          <h1 className="text-3xl font-normal mb-4 text-[#1a1714]">Your Cart is Empty</h1>
          <p className="text-sm text-[#8c8275] mb-8 font-sans">You have no items in your library bag.</p>
          <Link href="/shop" className="inline-block bg-[#1a1714] text-white px-8 py-3 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-[#2c2622] transition-colors font-sans">
            Explore Books
          </Link>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-6 py-12">
          <h1 className="text-4xl font-serif font-normal mb-10 text-[#1a1714] text-center">Your Library Bag</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-6">
              {cart.map((item) => (
                <div key={item._id} className="border border-[#ded7cb] rounded-lg p-5 flex gap-5 bg-white shadow-xs">
                  {item.images?.[0] && (
                    <div className="relative w-24 h-32 flex-shrink-0 border border-[#e0d9cf] rounded overflow-hidden">
                      <Image
                        src={item.images[0].url}
                        alt={item.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  )}

                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-serif text-xl text-[#1a1714] font-normal leading-snug">{item.title}</h3>
                      {item.vendor && <p className="text-xs text-[#8c8275] mt-1">by {item.vendor}</p>}
                      <p className="text-base text-gray-900 font-medium mt-3">₹{item.price.toLocaleString('en-IN')}</p>
                    </div>

                    <div className="flex items-center gap-3 mt-4">
                      <div className="flex items-center border border-[#dcd5c9] rounded bg-[#faf9f6]">
                        <button
                          onClick={() => updateQuantity(item._id, item.quantity - 1)}
                          className="px-3 py-1 text-lg font-light hover:bg-[#ded7cb] transition-colors"
                        >
                          −
                        </button>
                        <span className="px-3 text-sm font-semibold text-[#1a1714]">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item._id, item.quantity + 1)}
                          className="px-3 py-1 text-lg font-light hover:bg-[#ded7cb] transition-colors"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item._id)}
                        className="text-xs text-red-700 hover:text-red-900 hover:underline ml-2"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-serif text-lg font-normal text-[#1a1714]">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="lg:col-span-1">
              <div className="border border-[#ded7cb] rounded-lg p-6 bg-[#faf9f6] sticky top-24 shadow-xs">
                <h2 className="font-serif text-2xl text-[#1a1714] font-normal mb-6 pb-4 border-b border-[#ded7cb]">Order Summary</h2>
                
                <div className="space-y-3 text-sm text-gray-700 mb-6">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-medium text-gray-900">₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping:</span>
                    <span className="font-medium text-gray-900">{shippingCost === 0 ? 'FREE' : `₹${shippingCost}`}</span>
                  </div>
                  <div className="flex justify-between font-serif text-xl pt-4 border-t border-[#ded7cb] text-[#1a1714] font-normal">
                    <span>Total:</span>
                    <span>₹{total.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="w-full bg-[#1a1714] text-white py-3.5 rounded-full hover:bg-[#2c2622] disabled:opacity-50 font-bold text-xs uppercase tracking-wider transition-colors shadow-sm"
                >
                  {loading ? 'Initiating Checkout...' : 'Proceed to Checkout'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
