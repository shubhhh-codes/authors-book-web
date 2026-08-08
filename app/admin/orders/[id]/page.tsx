'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import type { Order, OrderItem } from '@/lib/types';

export default function OrderDetailPage() {
  const params = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/admin/orders/${params.id}`);
        if (!res.ok) throw new Error('Order not found');
        const data = await res.json();
        setOrder(data);
      } catch (err) {
        console.error('Fetch order error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) fetchOrder();
  }, [params.id]);

  const [trackingNumber, setTrackingNumber] = useState('');
  const [fulfilling, setFulfilling] = useState(false);

  const handleUpdateStatus = async (newStatus: 'pending' | 'paid' | 'shipped' | 'delivered' | 'failed') => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/orders/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok && order) {
        setOrder({ ...order, status: newStatus });
      }
    } catch (err) {
      console.error('Update status error:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleFulfill = async (e: React.FormEvent) => {
    e.preventDefault();
    setFulfilling(true);
    try {
      const res = await fetch(`/api/admin/orders/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipmentId: trackingNumber.trim() || 'Pending Courier AWB',
          status: 'shipped',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setOrder(data.order);
      }
    } catch (err) {
      console.error('Fulfill error:', err);
    } finally {
      setFulfilling(false);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-xs text-gray-500 font-medium">Loading order details...</div>;
  }

  if (!order) {
    return (
      <div className="py-20 text-center text-gray-500 space-y-3">
        <p className="text-base font-bold text-gray-900">Order not found</p>
        <Link href="/admin/orders" className="text-xs text-blue-600 hover:underline">
          ← Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            className="p-1.5 rounded-lg border border-gray-300 hover:border-black text-gray-600 hover:text-black transition-colors"
          >
            ← Back
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              Order #{order.bookingId || order._id.slice(-6)}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Placed on {order.timestamps?.created ? new Date(order.timestamps.created).toLocaleString('en-IN') : 'Recently'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              order.status === 'paid'
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            Payment: {order.status?.toUpperCase() || 'PENDING'}
          </span>

          {order.status !== 'paid' && (
            <button
              onClick={() => handleUpdateStatus('paid')}
              disabled={updating}
              className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Mark as Paid
            </button>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Items & Summary */}
        <div className="lg:col-span-2 space-y-6">
          {/* Purchased Items */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-2xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">Items Ordered</h2>

            <div className="divide-y divide-gray-100">
              {order.items?.map((item: OrderItem, idx: number) => (
                <div key={idx} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-gray-900">{item.title}</p>
                    {item.sku && <p className="text-[11px] text-gray-400">SKU: {item.sku}</p>}
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-700">₹{item.price} × {item.quantity}</p>
                    <p className="font-bold text-gray-900">₹{item.price * item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="pt-4 border-t border-gray-100 space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>₹{order.subtotal || order.total}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>{order.shippingCost ? `₹${order.shippingCost}` : 'FREE'}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-gray-900 pt-2 border-t">
                <span>Total Paid</span>
                <span>₹{order.total}</span>
              </div>
            </div>
          </div>

          {/* Order Fulfillment Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-2xs space-y-3 text-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">Order Fulfillment</h2>

            {order.shipmentId ? (
              <div className="space-y-3">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 font-medium flex items-center justify-between gap-2">
                  <span>✓ Order fulfilled & shipped. Tracking Number: <strong>{order.shipmentId}</strong></span>
                  <button
                    type="button"
                    onClick={async () => {
                      setUpdating(true);
                      try {
                        const res = await fetch(`/api/admin/orders/${params.id}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ shipmentId: '', status: 'paid' }),
                        });
                        if (res.ok) {
                          const data = await res.json();
                          setOrder(data.order);
                        }
                      } catch (err) {
                        console.error('Clear shipment error:', err);
                      } finally {
                        setUpdating(false);
                      }
                    }}
                    className="text-xs text-red-600 hover:underline font-normal shrink-0"
                  >
                    Remove / Edit
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleFulfill} className="space-y-3">
                <p className="text-gray-600">Enter courier tracking number to fulfill this order (optional):</p>
                <input
                  type="text"
                  placeholder="e.g. AWB-987654321"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                />
                <button
                  type="submit"
                  disabled={fulfilling}
                  className="bg-black text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-800 disabled:opacity-50 text-xs cursor-pointer"
                >
                  {fulfilling ? 'Fulfilling...' : 'Mark as Fulfilled / Shipped'}
                </button>
              </form>
            )}
          </div>

          {/* Payment Reference */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-2xs space-y-2 text-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">Payment Information</h2>
            <p><span className="font-semibold text-gray-700">Gateway:</span> Razorpay Online Payment</p>
            {order.paymentId && <p><span className="font-semibold text-gray-700">Razorpay Payment ID:</span> {order.paymentId}</p>}
            {order.razorpayOrderId && <p><span className="font-semibold text-gray-700">Razorpay Order ID:</span> {order.razorpayOrderId}</p>}
          </div>
        </div>

        {/* Right Column: Customer & Shipping Details */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-2xs space-y-4 text-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">Customer Details</h2>

            <div>
              <p className="font-bold text-gray-900 text-sm">{order.customerName || 'N/A'}</p>
              <p className="text-gray-600 mt-0.5">{order.customerEmail || 'No email'}</p>
              <p className="text-gray-600">{order.customerPhone || 'No phone'}</p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-2xs space-y-3 text-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">Shipping Address</h2>

            {order.shippingAddress ? (
              <address className="not-italic text-gray-700 leading-relaxed">
                <p className="font-semibold text-gray-900">{order.customerName}</p>
                <p>{order.shippingAddress.street}</p>
                <p>{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.zip}</p>
              </address>
            ) : (
              <p className="text-gray-500">No shipping address recorded.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
