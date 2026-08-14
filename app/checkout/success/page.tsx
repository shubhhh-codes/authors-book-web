import React from 'react';
import Link from 'next/link';
import Order from '@/lib/schemas/Order';
import { connectDB } from '@/lib/db';

// Never statically pre-render – this page reads live DB data per request
export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ orderId?: string }>;
}

export const metadata = {
  title: 'Order Confirmed | Authors Book',
  description: 'Your Authors Book order has been confirmed.',
};

export default async function CheckoutSuccessPage({ searchParams }: PageProps) {
  await connectDB();

  const params = await searchParams;
  const orderId = params.orderId;

  if (!orderId) {
    return (
      <main className="max-w-2xl mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-2">Missing Order ID</h1>
        <p className="text-gray-600 mb-6">No order ID was provided.</p>
        <Link href="/" className="text-blue-600 hover:underline">
          Return to Home
        </Link>
      </main>
    );
  }

  const order = await Order.findOne({
    $or: [{ orderNumber: orderId }, { bookingId: orderId }],
  }).lean();

  if (!order) {
    return (
      <main className="max-w-2xl mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-2">Order Not Found</h1>
        <p className="text-gray-600 mb-6">
          We couldn&apos;t locate order <code className="font-mono">{orderId}</code>.
        </p>
        <Link href="/" className="text-blue-600 hover:underline">
          Return to Home
        </Link>
      </main>
    );
  }

  // Support both nested customer (SRC) and legacy flat fields (Razorpay)
  const customerEmail: string =
    (order as any).customer?.email || (order as any).customerEmail || '';
  const displayOrderId: string =
    (order as any).orderNumber || (order as any).bookingId || orderId;
  const displayTotal: number =
    (order as any).totalAmount ?? (order as any).total ?? 0;

  return (
    <main className="max-w-2xl mx-auto p-6">
      <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
        <div className="text-5xl mb-4" aria-hidden="true">✓</div>
        <h1 className="text-3xl font-bold text-green-700 mb-3">Order Confirmed!</h1>
        <p className="text-gray-700 mb-8">
          Thank you for shopping with Authors Book. Your order is confirmed and
          will be processed shortly.
        </p>

        <div className="bg-white rounded-lg p-6 mb-8 text-left border border-gray-200 shadow-sm">
          <h2 className="font-semibold text-base mb-4 text-gray-900">Order Details</h2>
          <dl className="space-y-3 text-sm text-gray-700">
            <div className="flex justify-between">
              <dt>Order ID</dt>
              <dd className="font-mono font-semibold">{displayOrderId}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Amount</dt>
              <dd className="font-semibold">₹{Number(displayTotal).toFixed(2)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Status</dt>
              <dd className="capitalize font-medium text-green-600">
                {(order as any).status}
              </dd>
            </div>
            {customerEmail && (
              <div className="flex justify-between">
                <dt>Email</dt>
                <dd>{customerEmail}</dd>
              </div>
            )}
          </dl>
        </div>

        {customerEmail && (
          <p className="text-gray-600 text-sm mb-8">
            A confirmation has been sent to{' '}
            <strong>{customerEmail}</strong>. You&apos;ll receive tracking
            information via WhatsApp once your order ships.
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-md font-medium hover:bg-blue-700 transition-colors"
          >
            Continue Shopping
          </Link>
          <Link
            href={`/track/${displayOrderId}`}
            className="inline-block bg-gray-700 text-white px-6 py-2.5 rounded-md font-medium hover:bg-gray-800 transition-colors"
          >
            Track Order
          </Link>
        </div>
      </div>
    </main>
  );
}
