import { connectDB } from '@/lib/db';
import Order from '@/lib/schemas/Order';
import { errorResponse, successResponse, getSafeErrorMessage } from '@/lib/validations';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    await connectDB();
    const { id } = await params;

    // Search by bookingId (e.g. AB-84888697-...) or MongoDB _id
    const order = await Order.findOne({
      $or: [{ bookingId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    }).lean();

    if (!order) {
      return errorResponse('Order not found', 404);
    }

    return successResponse({
      ...order,
      _id: String(order._id),
    });
  } catch (error) {
    console.error('Order fetch error:', error);
    return errorResponse(getSafeErrorMessage(error), 500);
  }
}
