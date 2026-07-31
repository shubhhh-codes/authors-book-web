import { connectDB } from '@/lib/db';
import Order from '@/lib/schemas/Order';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

export async function POST(request: Request) {
  try {
    await connectDB();
    
    const {
      items,
      subtotal,
      shippingCost,
      total,
      customerEmail,
      customerName,
      customerPhone,
      shippingAddress,
    } = await request.json();

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(total * 100),
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    });

    // Create order in DB with pending status
    const bookingId = `AB-${Date.now().toString().slice(-8)}`;
    
    const order = new Order({
      bookingId,
      customerEmail,
      customerName,
      customerPhone,
      items,
      subtotal,
      shippingCost,
      total,
      shippingAddress,
      status: 'pending',
      razorpayOrderId: razorpayOrder.id,
    });

    await order.save();

    return Response.json({
      orderId: order._id,
      bookingId,
      razorpayOrderId: razorpayOrder.id,
      razorpayKey: process.env.RAZORPAY_KEY_ID,
      amount: razorpayOrder.amount,
    });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

