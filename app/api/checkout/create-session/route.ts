import { NextRequest, NextResponse } from 'next/server';
import { shiprocketService } from '@/lib/services/shiprocket';
import Order from '@/lib/schemas/Order';
import { shiprocketCheckoutSchema } from '@/lib/validations';
import { connectDB } from '@/lib/db';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Rate-limit before touching the DB (fail fast on abuse)
  const clientIp = getClientIp(request as unknown as Request);
  const { allowed } = checkRateLimit(clientIp, 5, 60 * 1_000);
  if (!allowed) {
    return NextResponse.json(
      { success: false, error: 'Too many checkout attempts. Please try again later.' },
      { status: 429 }
    );
  }

  try {
    await connectDB();

    const body = await request.json();
    const validated = shiprocketCheckoutSchema.parse(body);

    // Generate a human-readable, collision-resistant order ID
    const crypto = await import('crypto');
    const randomHex = crypto.randomBytes(4).toString('hex');
    const orderId = `AB-${Date.now().toString().slice(-8)}-${randomHex}`;

    const totalAmountRupees = validated.cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const srcPayload = {
      order_id: orderId,
      order_amount: totalAmountRupees,
      order_currency: 'INR',
      customer_name: validated.customer.name,
      customer_email: validated.customer.email,
      customer_phone: validated.customer.phone,
      customer_shipping_address: {
        country_code: validated.shippingAddress.country ?? 'IN',
        state: validated.shippingAddress.state,
        city: validated.shippingAddress.city,
        address_line_1: validated.shippingAddress.street,
        postal_code: validated.shippingAddress.postalCode,
      },
      ...(validated.billingAddress && {
        customer_billing_address: {
          country_code: validated.billingAddress.country ?? 'IN',
          state: validated.billingAddress.state,
          city: validated.billingAddress.city,
          address_line_1: validated.billingAddress.street,
          postal_code: validated.billingAddress.postalCode,
        },
      }),
      line_items: validated.cartItems.map((item) => ({
        sku: item.sku || item.id,
        title: item.title,
        quantity: item.quantity,
        amount: item.price,
      })),
      channel_id: process.env.NEXT_PUBLIC_SRC_CHANNEL_ID || '',
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://authorsbook.vercel.app'}/api/checkout/success?order_id=${orderId}`,
      notify_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://authorsbook.vercel.app'}/api/webhooks/shiprocket`,
      udf1: validated.customerId || 'guest',
    };

    const srResponse = await shiprocketService.createSession(srcPayload);

    if (!srResponse.success || !srResponse.data) {
      return NextResponse.json(
        { success: false, error: 'Failed to create Shiprocket session' },
        { status: 400 }
      );
    }

    // Persist the order before redirecting the customer
    const order = await Order.create({
      bookingId: orderId,   // keep legacy field populated for admin compatibility
      orderNumber: orderId,
      // Legacy flat fields (still present on schema)
      customerEmail: validated.customer.email,
      customerName: validated.customer.name,
      customerPhone: validated.customer.phone,
      // Nested customer object (new SRC fields)
      customer: {
        name: validated.customer.name,
        email: validated.customer.email,
        phone: validated.customer.phone,
      },
      shiprocketOrderId: orderId,
      shiprocketSessionId: srResponse.data.session_id,
      srcCheckoutUrl: srResponse.data.checkout_url,
      srcEmbeddedUrl: srResponse.data.embedded_url,
      items: validated.cartItems.map((item) => ({
        productId: item.id,
        title: item.title,
        quantity: item.quantity,
        price: item.price,
        sku: item.sku,
      })),
      subtotal: totalAmountRupees,
      totalAmount: totalAmountRupees,
      total: totalAmountRupees,
      shippingAddress: {
        street: validated.shippingAddress.street,
        city: validated.shippingAddress.city,
        state: validated.shippingAddress.state,
        // Map postalCode → zip for legacy schema compatibility
        zip: validated.shippingAddress.postalCode,
      },
      ...(validated.billingAddress && {
        billingAddress: {
          street: validated.billingAddress.street,
          city: validated.billingAddress.city,
          state: validated.billingAddress.state,
          postalCode: validated.billingAddress.postalCode,
          country: validated.billingAddress.country ?? 'IN',
        },
      }),
      paymentGateway: 'shiprocket',
      paymentStatus: 'pending',
      status: 'pending',
    });

    console.log(`[Checkout] Order created: ${order._id} (${orderId})`);

    return NextResponse.json(
      {
        success: true,
        data: {
          orderId,
          sessionId: srResponse.data.session_id,
          checkoutUrl: srResponse.data.checkout_url,
          embeddedUrl: srResponse.data.embedded_url,
          expiresAt: srResponse.data.expires_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Checkout] Session creation error:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    const message =
      error instanceof Error ? error.message : 'Failed to create checkout session';

    return NextResponse.json(
      { success: false, error: message },
      { status: error instanceof SyntaxError ? 400 : 500 }
    );
  }
}
