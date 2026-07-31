import Link from 'next/link';

export default function AdminCollectionsPage() {
  const collections = [
    { name: 'All Books', handle: 'all-books', type: 'Automated', items: '24 products', href: '/shop?type=book' },
    { name: 'Best Seller', handle: 'best-seller', type: 'Manual', items: '8 products', href: '/shop?tag=best-seller' },
    { name: '3D Bookmarks', handle: '3d-bookmarks', type: 'Manual', items: '12 products', href: '/shop?tag=3d&type=bookmark' },
    { name: 'Adapted in Films', handle: 'film-appeared', type: 'Automated', items: '6 products', href: '/shop?tag=film-appeared' },
    { name: 'Bookmarks', handle: 'bookmarks', type: 'Automated', items: '18 products', href: '/shop?type=bookmark' },
    { name: 'Indian Authors', handle: 'indian-authors', type: 'Manual', items: '10 products', href: '/shop' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Collections</h1>
          <p className="text-xs text-gray-500 mt-1">
            Group products into categories to help customers discover your store.
          </p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-700 bg-white border border-gray-200 px-3 py-1.5 rounded-lg">
            All Collections ({collections.length})
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 border-b border-gray-100 text-gray-500 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Products</th>
                <th className="py-3 px-4 text-right">View in Store</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {collections.map((col) => (
                <tr key={col.handle} className="hover:bg-gray-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-gray-900">{col.name}</td>
                  <td className="py-3.5 px-4 text-gray-600">
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-gray-100 font-semibold">
                      {col.type}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-gray-600">{col.items}</td>
                  <td className="py-3.5 px-4 text-right">
                    <Link href={col.href} target="_blank" className="text-xs font-semibold text-blue-600 hover:underline">
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
