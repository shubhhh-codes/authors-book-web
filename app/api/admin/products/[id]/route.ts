import { connectDB } from '@/lib/db';
import Product from '@/lib/schemas/Product';
import { AdminProductUpdateSchema, parseRequestBody, errorResponse, successResponse, getSafeErrorMessage } from '@/lib/validations';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    await connectDB();
    const { id } = await params;
    const data = await parseRequestBody(request, AdminProductUpdateSchema);

    // Transform images array if provided as URL strings
    const updateData: Record<string, unknown> = { ...data };
    if (data.images && Array.isArray(data.images)) {
      updateData.images = data.images.map((url: string, pos: number) => ({
        url,
        alt: data.title || 'Product',
        position: pos + 1,
      }));
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedProduct) {
      return errorResponse('Product not found', 404);
    }

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

    return successResponse({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Admin DELETE product error:', error);
    return errorResponse(getSafeErrorMessage(error), 500);
  }
}
