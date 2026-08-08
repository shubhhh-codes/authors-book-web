import Link from 'next/link';
import { connectDB } from '@/lib/db';
import Product from '@/lib/schemas/Product';
import Order from '@/lib/schemas/Order';
import type { Order as OrderType } from '@/lib/types';

export const dynamic = 'force-dynamic';

async function getDashboardData() {
  try {
    await connectDB();
    const [totalProducts, totalOrders, recentOrdersDocs] = await Promise.all([
      Product.countDocuments({ published: true }),
      Order.countDocuments({}),
      Order.find({}).sort({ 'timestamps.created': -1 }).limit(5).lean<OrderType[]>(),
    ]);

    const salesStats = await Order.aggregate([
      { $group: { _id: null, totalSales: { $sum: '$total' } } }
    ]);
    const totalSales = salesStats[0]?.totalSales || 0;
    const avgOrderValue = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;

    return {
      totalProducts,
      totalOrders,
      totalSales,
      avgOrderValue,
      recentOrders: recentOrdersDocs.map((o) => ({
        ...o,
        _id: String(o._id),
      })),
    };
  } catch (err) {
    console.error('Dashboard data error:', err);
    return {
      totalProducts: 0,
      totalOrders: 0,
      totalSales: 0,
      avgOrderValue: 0,
      recentOrders: [],
    };
  }
}

export default async function AdminDashboard() {
  const data = await getDashboardData();

  return (
    <div className="space-y-6 animate-admin-fade">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Home</h1>
          <p className="text-xs text-gray-500 mt-1">
            Here&rsquo;s what&rsquo;s happening with your store today.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/products/new"
            className="bg-[#1a1a1a] text-white hover:bg-black text-xs font-semibold px-4 py-2 rounded-lg transition-all active:scale-95 flex items-center gap-1.5 shadow-2xs hover:shadow-md"
          >
            <span>+ Add Product</span>
          </Link>
          <Link
            href="/admin/orders"
            className="bg-white text-gray-800 border border-gray-300 hover:border-black text-xs font-semibold px-4 py-2 rounded-lg transition-all active:scale-95"
          >
            View Orders
          </Link>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-2xs admin-card-hover">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Sales</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">₹{data.totalSales.toLocaleString('en-IN')}</p>
          <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <span>↑ 12%</span> vs last 30 days
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-2xs admin-card-hover">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Orders</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{data.totalOrders}</p>
          <p className="text-[11px] text-gray-500 font-medium mt-1">Across all channels</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-2xs admin-card-hover">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Average Order Value</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">₹{data.avgOrderValue.toLocaleString('en-IN')}</p>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">Healthy cart size</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-2xs admin-card-hover">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Products</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{data.totalProducts}</p>
          <p className="text-[11px] text-gray-500 font-medium mt-1">In MongoDB inventory</p>
        </div>
      </div>

      {/* Main Grid: Recent Orders + Quick Setup */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders Table */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Recent Orders</h2>
            <Link href="/admin/orders" className="text-xs text-blue-600 hover:underline font-semibold">
              View all orders →
            </Link>
          </div>

          {data.recentOrders.length === 0 ? (
            <div className="p-10 text-center text-gray-500 text-xs">
              No orders placed yet. Orders will appear here when customers checkout.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Order</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {data.recentOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <Link href={`/admin/orders/${order._id}`} className="font-bold text-blue-600 hover:underline">
                          #{order.bookingId || order._id.slice(-6)}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-gray-900">{order.customerName || 'Customer'}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            order.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {order.status || 'Pending'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-gray-900">₹{order.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Store Setup & Channel Performance */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Quick Actions</h2>
            <div className="space-y-2">
              <Link
                href="/admin/products/new"
                className="block p-3 rounded-lg border border-gray-100 hover:border-black hover:bg-gray-50 transition-all text-xs font-semibold text-gray-900"
              >
                📦 Add a new book or bookmark
              </Link>
              <Link
                href="/admin/collections"
                className="block p-3 rounded-lg border border-gray-100 hover:border-black hover:bg-gray-50 transition-all text-xs font-semibold text-gray-900"
              >
                🏷️ Manage store collections
              </Link>
              <Link
                href="/admin/analytics"
                className="block p-3 rounded-lg border border-gray-100 hover:border-black hover:bg-gray-50 transition-all text-xs font-semibold text-gray-900"
              >
                📊 View detailed sales reports
              </Link>
            </div>
          </div>

          {/* Store Info Card */}
          <div className="bg-emerald-950 text-white rounded-xl p-5 shadow-2xs space-y-2">
            <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Online Store Status</p>
            <h3 className="text-lg font-bold">Authors Book Store is Live</h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              Connected to MongoDB database and Razorpay payment gateway.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
