import Link from 'next/link';
import Image from 'next/image';
import { connectDB } from '@/lib/db';
import Product from '@/lib/schemas/Product';
import type { Product as ProductType } from '@/lib/types';

export const dynamic = 'force-dynamic';

async function getAdminProducts(): Promise<ProductType[]> {
  try {
    await connectDB();
    const docs = await Product.find({}).sort({ createdAt: -1 }).lean<ProductType[]>();
    return docs.map((d) => ({ ...d, _id: String(d._id) }));
  } catch (err) {
    console.error('getAdminProducts error:', err);
    return [];
  }
}

export default async function AdminProductsPage() {
  const products = await getAdminProducts();

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Products</h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage your inventory, pricing, categories, and tags.
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className="bg-[#1a1a1a] text-white hover:bg-black text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-xs"
        >
          <span>+ Add product</span>
        </Link>
      </div>

      {/* Table Container */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-2xs overflow-hidden">
        {/* Table Filters Top Bar */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-4 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-700 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-2xs">
              All Products ({products.length})
            </span>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="p-16 text-center text-gray-500 space-y-3">
            <p className="text-base font-semibold text-gray-900">No products found in store</p>
            <p className="text-xs text-gray-500">Get started by creating your first product.</p>
            <Link
              href="/admin/products/new"
              className="inline-block bg-black text-white px-5 py-2 rounded-lg text-xs font-semibold hover:bg-gray-800 transition-colors"
            >
              Add Product
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 border-b border-gray-100 text-gray-500 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-12">Image</th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Inventory</th>
                  <th className="py-3 px-4">Type / Genre</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {products.map((product) => {
                  const img = product.images?.[0]?.url;
                  const qty = product.inventory?.quantity ?? 10;
                  return (
                    <tr key={product._id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="relative w-10 h-12 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                          {img ? (
                            <Image src={img} alt={product.title} fill className="object-cover" unoptimized />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">No img</div>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <Link href={`/admin/products/${product._id}`} className="font-bold text-gray-900 hover:text-blue-600">
                          {product.title}
                        </Link>
                        {product.vendor && (
                          <p className="text-[11px] text-gray-500">{product.vendor}</p>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            product.published !== false
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {product.published !== false ? 'Active' : 'Draft'}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`font-semibold ${qty > 0 ? 'text-gray-700' : 'text-rose-600'}`}>
                          {qty > 0 ? `${qty} in stock` : 'Out of stock'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-gray-600">
                        <span className="capitalize">{product.type || 'Book'}</span>
                        {product.genre && <span className="text-gray-400"> • {product.genre}</span>}
                      </td>

                      <td className="py-3 px-4 font-bold text-gray-900">
                        ₹{product.price}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/admin/products/${product._id}`}
                          className="text-xs font-semibold text-blue-600 hover:underline"
                        >
                          Edit →
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
