import { connectDB } from '@/lib/db';
import Product from '@/lib/schemas/Product';
import { AdminProductCreateSchema, parseRequestBody, errorResponse, successResponse, getSafeErrorMessage } from '@/lib/validations';

export async function GET(): Promise<Response> {
  try {
    await connectDB();
    const products = await Product.find({}).sort({ createdAt: -1 }).lean();
    return successResponse(
      products.map((p) => ({ ...p, _id: String(p._id) }))
    );
  } catch (error) {
    console.error('Admin GET products error:', error);
    return errorResponse(getSafeErrorMessage(error), 500);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    await connectDB();
    const data = await parseRequestBody(request, AdminProductCreateSchema);

    const baseHandle =
      data.title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || `product-${Date.now()}`;

    let handle = baseHandle;
    let counter = 1;
    while (await Product.exists({ handle })) {
      handle = `${baseHandle}-${counter++}`;
    }

    const newProduct = await Product.create({
      handle,
      title: data.title,
      description: data.description,
      price: data.price,
      compareAtPrice: data.compareAtPrice,
      vendor: data.vendor,
      category: data.category,
      type: data.type,
      genre: data.genre,
      tags: data.tags,
      published: data.published,
      sku: data.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      weight: data.weight,
      inventory: {
        quantity: data.quantity,
        policy: 'deny',
      },
      images: (data.images || []).map((url: string, pos: number) => ({
        url,
        alt: data.title,
        position: pos + 1,
      })),
      seoTitle: data.seoTitle,
      seoDescription: data.seoDescription,
      bookmarkShape: data.bookmarkShape,
      color: data.color,
      material: data.material,
      targetAudience: data.targetAudience,
      language: data.language,
    });

    return successResponse(
      { success: true, product: { ...newProduct.toObject(), _id: String(newProduct._id) } },
      201
    );
  } catch (error) {
    console.error('Admin POST product error:', error);
    return errorResponse(getSafeErrorMessage(error), 500);
  }
}
