import { connectDB } from '@/lib/db';
import Order from '@/lib/schemas/Order';
import { errorResponse, successResponse, getSafeErrorMessage } from '@/lib/validations';
import type { Order as OrderType } from '@/lib/types';

export async function GET(): Promise<Response> {
  try {
    await connectDB();
    const orders = await Order.find({}).sort({ 'timestamps.created': -1 }).lean();
    return successResponse(
      orders.map((o) => ({ ...o, _id: String(o._id) }))
    );
  } catch (error) {
    console.error('Admin GET orders error:', error);
    return errorResponse(getSafeErrorMessage(error), 500);
  }
}
