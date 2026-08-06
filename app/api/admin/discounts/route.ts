import { connectDB } from '@/lib/db';
import Discount from '@/lib/schemas/Discount';
import { AdminDiscountCreateSchema, parseRequestBody, errorResponse, successResponse, getSafeErrorMessage } from '@/lib/validations';

export async function GET(): Promise<Response> {
  try {
    await connectDB();
    const discounts = await Discount.find({}).sort({ createdAt: -1 }).lean();
    return successResponse(discounts.map((d) => ({ ...d, _id: String(d._id) })));
  } catch (error) {
    console.error('Admin GET discounts error:', error);
    return errorResponse(getSafeErrorMessage(error), 500);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    await connectDB();
    const data = await parseRequestBody(request, AdminDiscountCreateSchema);

    const newDiscount = await Discount.create({
      code: data.code.toUpperCase().trim(),
      discountType: data.discountType,
      value: data.value,
      minSubtotal: data.minSubtotal,
      active: true,
    });

    return successResponse({ success: true, discount: newDiscount }, 201);
  } catch (error) {
    console.error('Admin POST discount error:', error);
    return errorResponse(getSafeErrorMessage(error), 500);
  }
}
