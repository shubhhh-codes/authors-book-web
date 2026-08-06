import { connectDB } from '@/lib/db';
import Product from '@/lib/schemas/Product';
import type { Product as ProductType } from '@/lib/types';
import AdminProductsClient from './AdminProductsClient';

export const dynamic = 'force-dynamic';

async function getAdminProducts(): Promise<ProductType[]> {
  try {
    await connectDB();
    const docs = await Product.find({}).sort({ createdAt: -1 }).lean<ProductType[]>();
    return JSON.parse(JSON.stringify(docs));
  } catch (err) {
    console.error('getAdminProducts error:', err);
    return [];
  }
}

export default async function AdminProductsPage() {
  const products = await getAdminProducts();
  return <AdminProductsClient initialProducts={products} />;
}
