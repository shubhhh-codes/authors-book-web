import Link from 'next/link';

export default function Navigation() {
  return (
    <nav className="border-b border-gray-200 bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-black">
          authorsbook
        </Link>
        
        <div className="flex gap-8 items-center">
          <Link href="/shop" className="text-gray-600 hover:text-black">
            Shop
          </Link>
          <Link href="/about" className="text-gray-600 hover:text-black">
            About
          </Link>
          <Link href="/cart" className="text-gray-600 hover:text-black">
            Cart
          </Link>
        </div>
      </div>
    </nav>
  );
}
