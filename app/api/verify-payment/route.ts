import { connectDB } from '@/lib/db';
import Order from '@/lib/schemas/Order';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    await connectDB();
    
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      orderId,
    } = await request.json();

    // Verify signature
    const secret = process.env.RAZORPAY_KEY_SECRET || '';
    const shasum = crypto.createHmac('sha256', secret);
    shasum.update(`${razorpayOrderId}|${razorpayPaymentId}`);
    const digest = shasum.digest('hex');

    if (digest !== razorpaySignature) {
      return Response.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Update order status
    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        status: 'paid',
        paymentId: razorpayPaymentId,
        'timestamps.paid': new Date(),
      },
      { new: true }
    );

    return Response.json({
      success: true,
      order,
    });
  } catch (error: any) {
    console.error('Verification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

