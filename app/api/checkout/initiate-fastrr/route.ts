import { NextRequest, NextResponse } from 'next/server';
import { shiprocketService } from '@/lib/services/shiprocket';
import { connectDB } from '@/lib/db';
import Product from '@/lib/schemas/Product';
import { toNumericId } from '@/lib/services/catalogTransform';
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

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://authorsbook.vercel.app';
    const redirectUrl = `${appUrl}/checkout/success`; // Fallback success page destination

    // Look up products to get their shiprocketVariantId
    const productIds = validated.items.map((item) => item.id);
    const products = await Product.find({ _id: { $in: productIds } })
      .select('_id sku shiprocketVariantId')
      .lean();

    const productMap = new Map<string, any>();
    for (const p of products) {
      productMap.set(String(p._id), p);
    }

    // Format cart items for Shiprocket Checkout token API
    // Must match the numeric variant ID synced to Shiprocket
    const cartItems = validated.items.map((item) => {
      const dbProduct = productMap.get(item.id);
      const variantNumericId = toNumericId(
        dbProduct?.shiprocketVariantId || dbProduct?._id || item.id,
        1
      );
      const sku = dbProduct?.sku || item.sku || `SKU-${variantNumericId}`;

      return {
        variant_id: String(variantNumericId),
        sku,
        quantity: item.quantity,
      };
    });

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

