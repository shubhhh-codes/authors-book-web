import Link from 'next/link';
import { connectDB } from '@/lib/db';
import Order from '@/lib/schemas/Order';
import type { Order as OrderType } from '@/lib/types';

export const dynamic = 'force-dynamic';

async function getAdminOrders(): Promise<OrderType[]> {
  try {
    await connectDB();
    const docs = await Order.find({}).sort({ 'timestamps.created': -1 }).lean<OrderType[]>();
    return docs.map((d) => ({ ...d, _id: String(d._id) }));
  } catch (err) {
    console.error('getAdminOrders error:', err);
    return [];
  }
}

export default async function AdminOrdersPage() {
  const orders = await getAdminOrders();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Orders</h1>
          <p className="text-xs text-gray-500 mt-1">
            Track customer purchases, payment verification, and order fulfillment.
          </p>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-700 bg-white border border-gray-200 px-3 py-1.5 rounded-lg">
            All Orders ({orders.length})
          </span>
        </div>

        {orders.length === 0 ? (
          <div className="p-16 text-center text-gray-500 space-y-2">
            <p className="text-base font-semibold text-gray-900">No orders yet</p>
            <p className="text-xs text-gray-500">When customers purchase items from your store, their orders will show up here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 border-b border-gray-100 text-gray-500 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Order</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Payment Status</th>
                  <th className="py-3 px-4">Fulfillment</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {orders.map((order) => {
                  const dateStr = order.timestamps?.created
                    ? new Date(order.timestamps.created).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'Today';

                  return (
                    <tr key={order._id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold">
                        <Link href={`/admin/orders/${order._id}`} className="text-blue-600 hover:underline">
                          #{order.bookingId || order._id.slice(-6)}
                        </Link>
                      </td>

                      <td className="py-3.5 px-4 text-gray-600">{dateStr}</td>

                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-gray-900">{order.customerName || 'Customer'}</p>
                        <p className="text-[11px] text-gray-500">{order.customerEmail || ''}</p>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            order.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : order.status === 'failed'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {order.status ? order.status.toUpperCase() : 'PENDING'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            order.shipmentId
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {order.shipmentId ? 'Fulfilled' : 'Unfulfilled'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-gray-900">
                        ₹{order.total}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/admin/orders/${order._id}`}
                          className="text-xs font-semibold text-blue-600 hover:underline"
                        >
                          View Order →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
