import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Product from '@/lib/schemas/Product';

// GET all products for admin
export async function GET() {
  try {
    await connectDB();
    const products = await Product.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json(
      products.map((p: any) => ({ ...p, _id: String(p._id) }))
    );
  } catch (error: any) {
    console.error('Admin GET products error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST create new product
export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();

    const {
      title,
      description,
      price,
      compareAtPrice,
      vendor,
      category,
      type,
      genre,
      tags,
      sku,
      weight,
      quantity,
      images,
      published,
    } = body;

    if (!title || price == null) {
      return NextResponse.json(
        { error: 'Product title and price are required.' },
        { status: 400 }
      );
    }

    const handle = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const newProduct = await Product.create({
      handle: handle || `product-${Date.now()}`,
      title,
      description: description || '',
      price: Number(price),
      compareAtPrice: compareAtPrice ? Number(compareAtPrice) : undefined,
      vendor: vendor || 'Authors Book',
      category: category || 'General',
      type: type || 'book',
      genre: genre || '',
      tags: Array.isArray(tags) ? tags : typeof tags === 'string' ? tags.split(',').map((t: string) => t.trim()) : [],
      published: published !== false,
      sku: sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      weight: Number(weight) || 0.3,
      inventory: {
        quantity: Number(quantity) || 10,
        policy: 'deny',
      },
      images: Array.isArray(images)
        ? images.map((url: string, pos: number) => ({ url, alt: title, position: pos + 1 }))
        : [],
    });

    return NextResponse.json(
      { success: true, product: { ...newProduct.toObject(), _id: String(newProduct._id) } },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Admin POST product error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
