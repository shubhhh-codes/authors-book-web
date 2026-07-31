import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Discount from '@/lib/schemas/Discount';

export async function GET() {
  try {
    await connectDB();
    const discounts = await Discount.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json(discounts.map((d: any) => ({ ...d, _id: String(d._id) })));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const { code, discountType, value, minSubtotal } = body;

    if (!code || value == null) {
      return NextResponse.json({ error: 'Code and discount value are required.' }, { status: 400 });
    }

    const newDiscount = await Discount.create({
      code: String(code).toUpperCase().trim(),
      discountType: discountType || 'percentage',
      value: Number(value),
      minSubtotal: Number(minSubtotal) || 0,
      active: true,
    });

    return NextResponse.json({ success: true, discount: newDiscount }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
