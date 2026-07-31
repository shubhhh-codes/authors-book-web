import { connectDB } from '@/lib/db';
import Product from '@/lib/schemas/Product';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> | any }) {
  try {
    await connectDB();
    
    const { id } = await params;
    const product = await Product.findById(id);
    
    if (!product) {
      return Response.json({ error: 'Product not found' }, { status: 404 });
    }
    
    return Response.json(product);
  } catch (error: any) {
    console.error('Product detail error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

