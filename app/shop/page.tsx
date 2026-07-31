'use client';

import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import ProductCard from '@/components/ProductCard';

export default function Shop() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);


  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const res = await fetch(`/api/products?page=${page}&limit=12`);
      const data = await res.json();
      setProducts(data.products);
      setTotal(data.pagination.total);
      setLoading(false);
    };
    
    fetchProducts();
  }, [page]);

  return (
    <>
      <Navigation />
      <div className="max-w-7xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-12">All Products</h1>
        
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
            
            {/* Pagination */}
            <div className="flex gap-4 justify-center">
              {Array.from({ length: Math.ceil(total / 12) }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setPage(i + 1)}
                  className={`px-4 py-2 rounded ${
                    page === i + 1
                      ? 'bg-black text-white'
                      : 'border border-gray-300 hover:border-black'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
