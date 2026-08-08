'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import type { Order, OrderItem } from '@/lib/types';

export default function OrderSuccessPage() {
  const params = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setOrder(data);
        }
      } catch (err) {
        console.error('Order success fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) fetchOrder();
  }, [params.id]);

  const bookingIdOrId = order?.bookingId || (typeof params.id === 'string' ? params.id : '');

  return (
    <>
      <Navigation />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {loading ? (
          <div className="py-20 text-center text-sm text-gray-500 font-medium">
            Loading order details...
          </div>
        ) : (
          <div className="space-y-8">
            {/* Header Banner */}
            <div className="text-center bg-white border border-gray-200 rounded-3xl p-8 sm:p-12 shadow-sm space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
                ✓
              </div>

              <div>
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full">
                  Order Confirmed
                </span>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 mt-3">
                  Thank you for your order!
                </h1>
                <p className="text-sm text-gray-600 mt-2">
                  Order Reference: <strong className="text-gray-900">{bookingIdOrId}</strong>
                </p>
              </div>

              <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                We have received your order and are preparing your literary treasures for dispatch. A confirmation email will been sent to{' '}
                <strong className="text-gray-800">{order?.customerEmail || 'your email'}</strong>.
              </p>

              <div className="pt-2">
                <Link
                  href="/shop"
                  className="inline-block bg-black text-white px-8 py-3 rounded-full text-xs font-semibold hover:bg-gray-800 transition-colors"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>

            {/* Order Details Breakdown */}
            {order && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Items List */}
                <div className="md:col-span-2 bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                    Order Summary
                  </h2>

                  <div className="divide-y divide-gray-100">
                    {order.items?.map((item: OrderItem, idx: number) => (
                      <div key={idx} className="py-3 flex items-center gap-4 text-xs">
                        <div className="relative w-12 h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">Book</div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">{item.title}</h3>
                          <p className="text-gray-500">Qty: {item.quantity}</p>
                        </div>

                        <span className="font-bold text-gray-900">
                          ₹{item.price * item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-gray-100 space-y-1.5 text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>₹{order.subtotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span>{order.shippingCost === 0 ? 'FREE' : `₹${order.shippingCost}`}</span>
                    </div>
                    <div className="flex justify-between font-bold text-sm text-gray-900 pt-2 border-t">
                      <span>Total Paid</span>
                      <span>₹{order.total}</span>
                    </div>
                  </div>
                </div>

                {/* Shipping & Delivery Estimate */}
                <div className="md:col-span-1 space-y-6">
                  <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-3 text-xs">
                    <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                      Delivery Address
                    </h2>
                    {order.shippingAddress && (
                      <address className="not-italic text-gray-600 leading-relaxed">
                        <p className="font-semibold text-gray-900">{order.customerName}</p>
                        <p>{order.shippingAddress.street}</p>
                        <p>{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.zip}</p>
                        <p className="mt-1 text-gray-500">📞 {order.customerPhone}</p>
                      </address>
                    )}
                  </div>

                  <div className="bg-emerald-950 text-white rounded-3xl p-6 shadow-sm space-y-2 text-xs">
                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Estimated Delivery</p>
                    <p className="text-sm font-bold">3 – 5 Business Days</p>
                    <p className="text-gray-300 text-[11px] leading-relaxed">
                      Shipped via express courier across India. You will receive SMS tracking updates.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
