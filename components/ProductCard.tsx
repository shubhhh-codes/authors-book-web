import Image from 'next/image';
import Link from 'next/link';

interface Product {
  _id: string;
  handle: string;
  title: string;
  price: number;
  compareAtPrice?: number;
  images: Array<{ url: string; alt: string }>;
}

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/product/${product._id}`}>
      <div className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
        <div className="relative h-64 bg-gray-100">
          {product.images[0] ? (
            <Image
              src={product.images[0].url}
              alt={product.images[0].alt || product.title}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              No Image
            </div>
          )}
        </div>
        
        <div className="p-4">
          <h3 className="font-semibold text-sm text-gray-900 line-clamp-2">
            {product.title}
          </h3>
          
          <div className="mt-3 flex items-center gap-2">
            <span className="text-lg font-bold text-gray-900">
              ₹{product.price}
            </span>
            {product.compareAtPrice && (
              <span className="text-sm text-gray-500 line-through">
                ₹{product.compareAtPrice}
              </span>
            )}
          </div>
          
          <button className="mt-4 w-full bg-black text-white py-2 rounded text-sm hover:bg-gray-800 transition-colors">
            View Details
          </button>
        </div>
      </div>
    </Link>
  );
}
