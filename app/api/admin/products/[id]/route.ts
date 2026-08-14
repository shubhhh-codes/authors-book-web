import { connectDB } from '@/lib/db';
import Product from '@/lib/schemas/Product';
import { deleteLocalImages } from '@/lib/fileUtils';
import { AdminProductUpdateSchema, parseRequestBody, errorResponse, successResponse, getSafeErrorMessage } from '@/lib/validations';
import { pushProductToShiprocket } from '@/lib/services/shiprocket-catalog-webhook';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    await connectDB();
    const { id } = await params;
    const data = await parseRequestBody(request, AdminProductUpdateSchema);

    // If replacing image, find existing product to cleanup old image
    const existingProduct = await Product.findById(id);

    // Transform images array if provided as URL strings
    const updateData: Record<string, unknown> = { ...data };
    if (data.images && Array.isArray(data.images)) {
      updateData.images = data.images.map((url: string, pos: number) => ({
        url,
        alt: data.title || 'Product',
        position: pos + 1,
      }));

      // Cleanup old local images if URL changed
      if (existingProduct?.images) {
        const oldUrls = existingProduct.images.map((img: { url?: string }) => img.url).filter(Boolean);
        const newUrls = data.images;
        const removedUrls = oldUrls.filter((oldUrl: string) => !newUrls.includes(oldUrl));
        if (removedUrls.length > 0) {
          await deleteLocalImages(removedUrls);
        }
      }
    }

    if (updateData.language === '') {
      delete updateData.language;
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedProduct) {
      return errorResponse('Product not found', 404);
    }

    // Push update to Shiprocket catalog webhook (non-blocking)
    pushProductToShiprocket(updatedProduct.toObject()).catch(() => {});

    return successResponse({ success: true, product: updatedProduct });
  } catch (error) {
    console.error('Admin PUT product error:', error);
    return errorResponse(getSafeErrorMessage(error), 500);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    await connectDB();
    const { id } = await params;
    const deleted = await Product.findByIdAndDelete(id);

    if (!deleted) {
      return errorResponse('Product not found', 404);
    }

    // Delete local image files from public/uploads
    if (deleted.images && deleted.images.length > 0) {
      await deleteLocalImages(deleted.images);
    }

    return successResponse({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Admin DELETE product error:', error);
    return errorResponse(getSafeErrorMessage(error), 500);
  }
}
