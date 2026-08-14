import { NextRequest, NextResponse } from 'next/server';
import { shiprocketService } from '@/lib/services/shiprocket';
import { connectDB } from '@/lib/db';
import { z } from 'zod';

const initiateCheckoutSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      quantity: z.number().min(1),
      sku: z.string().optional(),
    })
  ).min(1, 'Cart is empty'),
});

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const validated = initiateCheckoutSchema.parse(body);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://authorsbook.store';
    const redirectUrl = `${appUrl}/checkout/success`; // Fallback success page destination

    // Format cart items for Shiprocket Checkout token API
    const cartItems = validated.items.map((item) => ({
      variant_id: item.sku || item.id, // Shiprocket maps to sku or product/variant ID
      quantity: item.quantity,
    }));

    // Generate Fastrr access token
    const result = await shiprocketService.generateAccessToken(cartItems, redirectUrl);

    return NextResponse.json({
      success: true,
      token: result.token,
    }, { status: 200 });
  } catch (error) {
    console.error('[Initiate Fastrr] Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to initiate checkout';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
