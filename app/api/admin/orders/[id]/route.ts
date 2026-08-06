import { connectDB } from '@/lib/db';
import Order from '@/lib/schemas/Order';
import { AdminOrderUpdateSchema, parseRequestBody, errorResponse, successResponse, getSafeErrorMessage } from '@/lib/validations';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    await connectDB();
    const { id } = await params;
    const order = await Order.findById(id).lean();
    if (!order) {
      return errorResponse('Order not found', 404);
    }
    return successResponse({ ...order, _id: String(order._id) });
  } catch (error) {
    console.error('Admin GET order error:', error);
    return errorResponse(getSafeErrorMessage(error), 500);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    await connectDB();
    const { id } = await params;

    // Whitelist allowed fields to prevent arbitrary field overwrites
    const updateData = await parseRequestBody(request, AdminOrderUpdateSchema);

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    if (!updatedOrder) {
      return errorResponse('Order not found', 404);
    }

    return successResponse({ success: true, order: updatedOrder });
  } catch (error) {
    console.error('Admin PUT order error:', error);
    return errorResponse(getSafeErrorMessage(error), 500);
  }
}
