import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Order from '@/lib/schemas/Order';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    // Search by bookingId (e.g. AB-84888697) or MongoDB _id
    let order = await Order.findOne({
      $or: [{ bookingId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    }).lean();

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...order,
      _id: String(order._id),
    });
  } catch (error: any) {
    console.error('Order fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
