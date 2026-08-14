import { connectDB } from '@/lib/db';
import Product from '@/lib/schemas/Product';
import mongoose from 'mongoose';
import { errorResponse, successResponse, getSafeErrorMessage } from '@/lib/validations';
import { formatProductForShiprocket, toNumericId } from '@/lib/services/catalogTransform';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    await connectDB();

    const { id } = await params;
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const isNumeric = /^\d+$/.test(id);

    let product = null;
    if (isObjectId) {
      product = await Product.findById(id).lean();
    } else if (isNumeric) {
      const targetNum = parseInt(id, 10);
      product = await Product.findOne({
        $or: [{ numericId: targetNum }, { shiprocketVariantId: id }],
      }).lean();

      if (!product) {
        const all = await Product.find({}).lean();
        product = all.find((p) => toNumericId(p._id, 0) === targetNum || toNumericId(p._id, 1) === targetNum) || null;
      }
    }

    if (!product) {
      product = await Product.findOne({ handle: id }).lean();
    }

    if (!product) {
      return errorResponse('Product not found', 404);
    }

    const formatted = formatProductForShiprocket(product);
    return successResponse(formatted);
  } catch (error) {
    console.error('Product detail error:', error);
    return errorResponse(getSafeErrorMessage(error), 500);
  }
}
