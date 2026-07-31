import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Product from '@/lib/schemas/Product';

// PUT update product by ID
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();

    if (body.tags && typeof body.tags === 'string') {
      body.tags = body.tags.split(',').map((t: string) => t.trim());
    }

    if (body.images && Array.isArray(body.images)) {
      body.images = body.images.map((url: string, pos: number) => ({
        url,
        alt: body.title || 'Product',
        position: pos + 1,
      }));
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, body, { new: true });

    if (!updatedProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, product: updatedProduct });
  } catch (error: any) {
    console.error('Admin PUT product error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE product by ID
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const deleted = await Product.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Product deleted successfully' });
  } catch (error: any) {
    console.error('Admin DELETE product error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
