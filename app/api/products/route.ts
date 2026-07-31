import { connectDB } from '@/lib/db';
import Product from '@/lib/schemas/Product';

export async function GET(request: Request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const skip = (page - 1) * limit;
    
    const products = await Product.find({ published: true })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    const total = await Product.countDocuments({ published: true });
    
    return Response.json({
      products,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Products API error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

