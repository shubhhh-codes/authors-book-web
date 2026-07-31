export const dynamic = 'force-dynamic';

import Hero from '@/components/Hero';
import Navigation from '@/components/Navigation';
import ProductCard from '@/components/ProductCard';
import { connectDB } from '@/lib/db';
import Product from '@/lib/schemas/Product';


export default async function Home() {
  await connectDB();
  
  const products = await Product.find({ published: true })
    .limit(6)
    .sort({ createdAt: -1 });

  return (
    <>
      <Navigation />
      <main>
        <Hero />
        
        <section className="max-w-7xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold mb-12">Featured Products</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <ProductCard key={product._id.toString()} product={product} />
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
