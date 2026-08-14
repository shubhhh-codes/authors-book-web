import { NextRequest, NextResponse } from 'next/server';
import Order from '@/lib/schemas/Order';
import { connectDB } from '@/lib/db';

/**
 * GET /api/checkout/success?order_id=AB-XXXX-YYYY
 *
 * Shiprocket calls this return_url after the customer completes payment.
 * We look up the order and redirect to the user-facing success page.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('order_id');

    if (!orderId) {
      console.warn('[Checkout] Success redirect missing order_id param');
      return NextResponse.redirect(
        new URL('/checkout?error=missing_order_id', request.url)
      );
    }

    const order = await Order.findOne({
      $or: [{ orderNumber: orderId }, { bookingId: orderId }],
    }).lean();

    if (!order) {
      console.warn(`[Checkout] Order not found for success redirect: ${orderId}`);
      return NextResponse.redirect(
        new URL('/checkout?error=order_not_found', request.url)
      );
    }

    console.log(`[Checkout] Success redirect for order: ${orderId}`);
    return NextResponse.redirect(
      new URL(`/checkout/success?orderId=${orderId}`, request.url)
    );
  } catch (error) {
    console.error('[Checkout] Success redirect error:', error);
    return NextResponse.redirect(
      new URL('/checkout?error=processing_failed', request.url)
    );
  }
}
