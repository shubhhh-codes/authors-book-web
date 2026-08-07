import { connectDB } from '@/lib/db';
import Product from '@/lib/schemas/Product';
import mongoose from 'mongoose';
import { errorResponse, successResponse, getSafeErrorMessage } from '@/lib/validations';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    await connectDB();

    const { id } = await params;
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const product = isObjectId
      ? await Product.findById(id).lean()
      : await Product.findOne({ handle: id }).lean();

    if (!product) {
      return errorResponse('Product not found', 404);
    }

    return successResponse(product);
  } catch (error) {
    console.error('Product detail error:', error);
    return errorResponse(getSafeErrorMessage(error), 500);
  }
}
