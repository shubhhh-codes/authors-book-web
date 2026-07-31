import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Order from '@/lib/schemas/Order';

export async function GET() {
  try {
    await connectDB();
    const orders = await Order.find({}).sort({ 'timestamps.created': -1 }).lean();
    return NextResponse.json(
      orders.map((o: any) => ({ ...o, _id: String(o._id) }))
    );
  } catch (error: any) {
    console.error('Admin GET orders error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
