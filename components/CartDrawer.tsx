'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/lib/types';

interface CartItem extends Product {
  quantity: number;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    const loadCart = () => {
      try {
        const saved = localStorage.getItem('ab_cart') || localStorage.getItem('cart') || '[]';
        setCart(JSON.parse(saved));
      } catch {
        setCart([]);
      }
    };

    if (isOpen) {
      loadCart();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    // Listen to custom cart update events
    window.addEventListener('cart-updated', loadCart);
    return () => window.removeEventListener('cart-updated', loadCart);
  }, [isOpen]);

  const getItemId = (item: CartItem): string => String(item.id ?? item._id ?? '');

  const updateQuantity = (id: string | number, newQty: number) => {
    if (newQty < 1) return;
    const strId = String(id);
    const targetItem = cart.find((item) => getItemId(item) === strId);
    const maxStock = targetItem?.inventory?.quantity ?? 99;
    const cappedQty = Math.min(newQty, maxStock);

    const updated = cart.map((item) => (getItemId(item) === strId ? { ...item, quantity: cappedQty } : item));
    setCart(updated);
    localStorage.setItem('ab_cart', JSON.stringify(updated));
    localStorage.setItem('cart', JSON.stringify(updated));
    window.dispatchEvent(new Event('cart-updated'));
  };

  const removeItem = (id: string | number) => {
    const strId = String(id);
    const updated = cart.filter((item) => getItemId(item) !== strId);
    setCart(updated);
    localStorage.setItem('ab_cart', JSON.stringify(updated));
    localStorage.setItem('cart', JSON.stringify(updated));
    window.dispatchEvent(new Event('cart-updated'));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const freeShippingThreshold = 500;
  const progressPct = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
              Your Cart
              <span className="text-xs bg-black text-white px-2 py-0.5 rounded-full font-semibold">
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </span>
            </h2>

            <button
              onClick={onClose}
              className="p-2 rounded-full text-gray-400 hover:text-black hover:bg-gray-100 transition-colors"
              aria-label="Close cart"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Free Shipping Progress Indicator */}
          <div className="bg-gray-50 px-6 py-3 border-b border-gray-100 text-xs">
            {subtotal >= freeShippingThreshold ? (
              <p className="font-semibold text-emerald-700 flex items-center gap-1.5">
                🎉 Congratulations! You unlocked <strong>FREE Shipping</strong>!
              </p>
            ) : (
              <p className="text-gray-600">
                Add <strong>₹{freeShippingThreshold - subtotal}</strong> more to unlock <strong>FREE Shipping</strong>
              </p>
            )}
            <div className="w-full bg-gray-200 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-black h-full transition-all duration-300 rounded-full"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Items list */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {cart.length === 0 ? (
              <div className="py-20 text-center text-gray-500 space-y-4">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto text-gray-300">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
                <p className="text-base font-semibold text-gray-900">Your cart is empty</p>
                <Link
                  href="/shop"
                  onClick={onClose}
                  className="inline-block bg-black text-white px-6 py-2.5 rounded-full text-xs font-semibold hover:bg-gray-800 transition-colors"
                >
                  Explore Books
                </Link>
              </div>
            ) : (
              cart.map((item) => {
                const itemId = getItemId(item);
                const firstImg = item.images?.[0] as any;
                const img = firstImg?.url || firstImg?.src || item.image?.src;
                return (
                  <div key={itemId} className="flex gap-4 pb-6 border-b border-gray-100 last:border-b-0">
                    <div className="relative w-20 h-24 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                      {img ? (
                        <Image src={img} alt={item.title} fill className="object-cover" unoptimized />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">Book</div>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">
                            {item.title}
                          </h3>
                          <button
                            onClick={() => removeItem(itemId)}
                            className="text-gray-400 hover:text-red-600 text-xs transition-colors p-1"
                            aria-label="Remove item"
                          >
                            ✕
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">₹{item.price}</p>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden text-xs">
                          <button
                            onClick={() => updateQuantity(itemId, item.quantity - 1)}
                            className="px-2 py-1 hover:bg-gray-100 transition-colors"
                          >
                            −
                          </button>
                          <span className="px-3 font-semibold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(itemId, item.quantity + 1)}
                            className="px-2 py-1 hover:bg-gray-100 transition-colors"
                          >
                            +
                          </button>
                        </div>

                        <span className="text-sm font-bold text-gray-900">
                          ₹{item.price * item.quantity}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Subtotal + Checkout */}
          {cart.length > 0 && (
            <div className="p-6 border-t border-gray-100 bg-white space-y-4">
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-medium text-gray-600">Subtotal</span>
                <span className="text-xl font-bold text-gray-900">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <p className="text-xs text-gray-400">Taxes & shipping calculated at checkout.</p>

              <div className="space-y-2">
                <Link
                  href="/cart"
                  onClick={onClose}
                  className="block w-full bg-black text-white text-center py-3 rounded-full text-sm font-bold hover:bg-gray-800 transition-colors"
                >
                  Proceed to Checkout
                </Link>
                <button
                  onClick={onClose}
                  className="block w-full text-center py-2 text-xs font-semibold text-gray-500 hover:text-black transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
