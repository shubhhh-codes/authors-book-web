import { connectDB } from '@/lib/db';
import Product from '@/lib/schemas/Product';
import { pushProductToShiprocket } from '@/lib/services/shiprocket-catalog-webhook';
import {
  AdminProductCreateSchema,
  parseRequestBody,
  errorResponse,
  successResponse,
  getSafeErrorMessage,
  createSeoSlug,
} from '@/lib/validations';

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

    // Derive SEO-friendly handle from Meta Title (seoTitle) or fallback to Title
    const baseHandle = createSeoSlug(data.seoTitle, data.title);

    let handle = baseHandle;
    let attempt = 0;
    let newProduct = null;
    const maxAttempts = 10;

    // Atomic retry loop to prevent race conditions during concurrent creation
    while (attempt < maxAttempts) {
      try {
        if (attempt > 0) {
          handle = `${baseHandle}-${attempt}`;
        } else if (await Product.exists({ handle })) {
          attempt++;
          handle = `${baseHandle}-${attempt}`;
        }

        newProduct = await Product.create({
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

        break;
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : '';
        const isDuplicateKey =
          errorMsg.includes('E11000') || errorMsg.includes('duplicate key');

        if (isDuplicateKey) {
          attempt++;
          if (attempt >= maxAttempts) {
            // High-entropy fallback to guarantee uniqueness under extreme concurrent race conditions
            handle = `${baseHandle}-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 100)}`;
            newProduct = await Product.create({
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
            break;
          }
        } else {
          throw err;
        }
      }
    }

    // Push product to Shiprocket catalog for real-time sync (non-blocking)
    pushProductToShiprocket(newProduct!.toObject()).catch(() => {});

    return successResponse(
      { success: true, product: { ...newProduct!.toObject(), _id: String(newProduct!._id) } },
      201
    );
  } catch (error) {
    console.error('Admin POST product error:', error);
    return errorResponse(getSafeErrorMessage(error), 500);
  }
}
