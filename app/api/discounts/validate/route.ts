import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Discount from '@/lib/schemas/Discount';

export async function POST(request: Request) {
  try {
    await connectDB();
    const { code, subtotal } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'Promo code is required.' }, { status: 400 });
    }

    const discount = await Discount.findOne({
      code: String(code).toUpperCase().trim(),
      active: true,
    });

    if (!discount) {
      return NextResponse.json({ error: 'Invalid or expired promo code.' }, { status: 404 });
    }

    if (subtotal < discount.minSubtotal) {
      return NextResponse.json(
        { error: `Minimum order value of ₹${discount.minSubtotal} required for code ${discount.code}.` },
        { status: 400 }
      );
    }

    let discountAmount = 0;
    if (discount.discountType === 'percentage') {
      discountAmount = Math.round((subtotal * discount.value) / 100);
    } else {
      discountAmount = discount.value;
    }

    return NextResponse.json({
      success: true,
      code: discount.code,
      discountType: discount.discountType,
      value: discount.value,
      discountAmount,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
