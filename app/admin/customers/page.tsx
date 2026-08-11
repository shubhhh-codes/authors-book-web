import { connectDB } from '@/lib/db';
import Order from '@/lib/schemas/Order';
import type { Order as OrderType } from '@/lib/types';

export const dynamic = 'force-dynamic';

async function getCustomersData() {
  try {
    await connectDB();
    // Optimize: Use aggregation pipeline instead of mapping all orders in memory
    // This resolves memory issues and runs much faster by shifting computation to the DB
    const customers = await Order.aggregate([
      {
        $group: {
          _id: { $ifNull: ['$customerEmail', 'unknown@example.com'] },
          name: { $first: { $ifNull: ['$customerName', 'Guest Customer'] } },
          email: { $first: { $ifNull: ['$customerEmail', 'unknown@example.com'] } },
          phone: { $first: { $ifNull: ['$customerPhone', 'N/A'] } },
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: { $ifNull: ['$total', 0] } },
          lastOrderDate: { $max: { $ifNull: ['$timestamps.created', new Date()] } },
        }
      },
      {
        $project: {
          _id: 0,
        }
      }
    ]);

    return customers as { name: string; email: string; phone: string; totalOrders: number; totalSpent: number; lastOrderDate: Date | string }[];
  } catch (err) {
    console.error('getCustomersData error:', err);
    return [];
  }
}

export default async function AdminCustomersPage() {
  const customers = await getCustomersData();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Customers</h1>
          <p className="text-xs text-gray-500 mt-1">
            Customer directory, order counts, and total lifetime spend.
          </p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-700 bg-white border border-gray-200 px-3 py-1.5 rounded-lg">
            All Customers ({customers.length})
          </span>
        </div>

        {customers.length === 0 ? (
          <div className="p-16 text-center text-gray-500 space-y-2">
            <p className="text-base font-semibold text-gray-900">No customer records found</p>
            <p className="text-xs text-gray-500">Customers who place orders on your store will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 border-b border-gray-100 text-gray-500 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Orders Placed</th>
                  <th className="py-3 px-4">Total Spent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {customers.map((c, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-gray-900">{c.name}</td>
                    <td className="py-3.5 px-4 text-gray-600">{c.email}</td>
                    <td className="py-3.5 px-4 text-gray-600">{c.phone}</td>
                    <td className="py-3.5 px-4 font-semibold text-gray-900">{c.totalOrders} order(s)</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-700">₹{c.totalSpent.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
