import { connectDB } from '@/lib/db';
import Discount from '@/lib/schemas/Discount';
import { DiscountValidateSchema, parseRequestBody, errorResponse, successResponse, getSafeErrorMessage } from '@/lib/validations';

export async function POST(request: Request): Promise<Response> {
  try {
    await connectDB();
    const { code, subtotal } = await parseRequestBody(request, DiscountValidateSchema);

    const discount = await Discount.findOne({
      code: code.toUpperCase().trim(),
      active: true,
    }).lean();

    if (!discount) {
      return errorResponse('Invalid or expired promo code.', 404);
    }

    if (subtotal < discount.minSubtotal) {
      return errorResponse(
        `Minimum order value of ₹${discount.minSubtotal} required for code ${discount.code}.`,
        400
      );
    }

    const discountAmount = discount.discountType === 'percentage'
      ? Math.round((subtotal * discount.value) / 100)
      : discount.value;

    return successResponse({
      success: true,
      code: discount.code,
      discountType: discount.discountType,
      value: discount.value,
      discountAmount,
    });
  } catch (error) {
    console.error('Discount validation error:', error);
    return errorResponse(getSafeErrorMessage(error), 500);
  }
}
