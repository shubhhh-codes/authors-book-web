'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { useRouter } from 'next/navigation';
import type { CartItem, RazorpayResponse, RazorpayConstructor } from '@/lib/types';

declare global {
  interface Window {
    Razorpay: RazorpayConstructor;
  }
}

export default function Cart() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zip: '',
  });

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
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    const updated = cart.map((item: CartItem) =>
      item._id === productId ? { ...item, quantity: newQuantity } : item
    );
    setCart(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
  };

  const handleCheckout = async () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.street) {
      alert('Please fill all required fields');
      return;
    }

    if (cart.length === 0) {
      alert('Cart is empty');
      return;
    }

    setLoading(true);

    try {
      const checkoutItems = cart.map((item: CartItem) => ({
        productId: item._id,
        handle: item.handle || '',
        title: item.title,
        sku: item.sku || '',
        price: item.price,
        quantity: item.quantity,
      }));

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: checkoutItems,
          subtotal,
          shippingCost,
          total,
          customerName: formData.name,
          customerEmail: formData.email,
          customerPhone: formData.phone,
          shippingAddress: {
            street: formData.street,
            city: formData.city,
            state: formData.state,
            zip: formData.zip,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error || 'Checkout failed';
        console.error(`[Checkout Error ${response.status}]`, errorMessage);
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (!data.razorpayOrderId || !data.orderId) {
        console.error('[Checkout Error] Missing required response fields:', data);
        throw new Error('Invalid server response - missing order details');
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        const options = {
          key: data.razorpayKey,
          amount: data.amount,
          currency: 'INR',
          order_id: data.razorpayOrderId,
          customer_notification: 1,
          handler: async (razorpayResponse: RazorpayResponse) => {
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: data.orderId,
                razorpayOrderId: data.razorpayOrderId,
                razorpayPaymentId: razorpayResponse.razorpay_payment_id,
                razorpaySignature: razorpayResponse.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();

            if (!verifyRes.ok) {
              console.error('[Payment Verification Error]', verifyData);
              alert(`Payment verification failed: ${verifyData.error || 'Unknown error'}`);
              return;
            }

            if (verifyData.success) {
              localStorage.removeItem('cart');
              router.push(`/order-success/${data.bookingId}`);
            } else {
              console.error('[Payment Verification Failed]', verifyData);
              alert('Payment verification failed: ' + (verifyData.message || 'Unknown error'));
            }
          },
          prefill: {
            name: formData.name,
            email: formData.email,
            contact: formData.phone,
          },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      };
      document.body.appendChild(script);
    } catch (error) {
      const err = error as Error;
      console.error('[Checkout Exception]', {
        message: err.message,
        stack: err.stack,
      });

      const userMessage = err.message || 'Checkout failed. Please try again.';
      alert('Checkout error: ' + userMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navigation />
      {cart.length === 0 ? (
        <div className="max-w-7xl mx-auto px-6 py-16 text-center">
          <h1 className="text-3xl font-bold mb-4">Your Cart is Empty</h1>
          <Link href="/shop" className="text-blue-600 hover:underline">
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-6 py-12">
          <h1 className="text-4xl font-bold mb-8">Shopping Cart</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item._id} className="border border-gray-200 rounded-lg p-4 flex gap-4">
                    {item.images?.[0] && (
                      <div className="relative w-24 h-24 flex-shrink-0">
                        <Image
                          src={item.images[0].url}
                          alt={item.title}
                          fill
                          className="object-cover rounded"
                          unoptimized
                        />
                      </div>
                    )}

                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{item.title}</h3>
                      <p className="text-gray-600">₹{item.price}</p>

                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => updateQuantity(item._id, item.quantity - 1)}
                          className="px-2 py-1 border rounded hover:bg-gray-100"
                        >
                          −
                        </button>
                        <span className="px-3">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item._id, item.quantity + 1)}
                          className="px-2 py-1 border rounded hover:bg-gray-100"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-semibold">₹{item.price * item.quantity}</p>
                      <button
                        onClick={() => removeItem(item._id)}
                        className="text-red-600 text-sm hover:underline mt-2"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="border border-gray-200 rounded-lg p-6 sticky top-20">
                <div className="mb-6 pb-6 border-b">
                  <h2 className="font-bold text-lg mb-4">Order Summary</h2>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>₹{subtotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping:</span>
                      <span>{shippingCost === 0 ? 'FREE' : `₹${shippingCost}`}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg pt-2">
                      <span>Total:</span>
                      <span>₹{total}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                  <input
                    type="tel"
                    placeholder="Phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Street Address"
                    value={formData.street}
                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                  <input
                    type="text"
                    placeholder="City"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                  <input
                    type="text"
                    placeholder="State"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Zip Code"
                    value={formData.zip}
                    onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 disabled:opacity-50 font-medium"
                >
                  {loading ? 'Processing...' : 'Proceed to Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
