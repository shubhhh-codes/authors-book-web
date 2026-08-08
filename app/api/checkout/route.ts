import { connectDB } from '@/lib/db';
import Order from '@/lib/schemas/Order';
import Product from '@/lib/schemas/Product';
import Razorpay from 'razorpay';
import mongoose from 'mongoose';
import { CheckoutRequestSchema, parseRequestBody, errorResponse, successResponse, getSafeErrorMessage } from '@/lib/validations';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

export async function POST(request: Request): Promise<Response> {
  let orderId: string | null = null;

  try {
    // Rate limit BEFORE DB to fail fast on DOS attempts
    const clientIp = getClientIp(request);
    const { allowed } = checkRateLimit(clientIp, 5, 60 * 1000);

    if (!allowed) {
      return errorResponse(
        'Too many checkout attempts. Please try again later.',
        429
      );
    }

    await connectDB();

    const payload = await parseRequestBody(request, CheckoutRequestSchema);
    const {
      items,
      subtotal,
      shippingCost,
      total,
      customerEmail,
      customerName,
      customerPhone,
      shippingAddress,
    } = payload;

    const productIds = items.map(item => {
      if (!mongoose.Types.ObjectId.isValid(item.productId)) {
        throw new Error(`Invalid product ID format: ${item.productId}`);
      }
      return new mongoose.Types.ObjectId(item.productId);
    });

    const dbProducts = await Product.find({ _id: { $in: productIds } }).lean();

    if (dbProducts.length !== items.length) {
      return errorResponse('Some products in cart no longer exist', 400);
    }

    const dbProductMap = new Map();
    for (const p of dbProducts) {
      dbProductMap.set(p._id.toString(), p);
    }

    for (const item of items) {
      const dbProduct = dbProductMap.get(item.productId);

      if (!dbProduct) {
        return errorResponse(`Product ${item.title} not found`, 400);
      }

      // ±₹1 tolerance for floating-point rounding
      if (Math.abs(dbProduct.price - item.price) > 1) {
        return errorResponse(
          `Price changed for ${item.title}. Please refresh and try again.`,
          400
        );
      }

      if (dbProduct.inventory?.quantity !== undefined) {
        if (dbProduct.inventory.quantity < item.quantity) {
          return errorResponse(
            `Only ${dbProduct.inventory.quantity} of ${item.title} available`,
            400
          );
        }
      }
    }

    // timestamp + random bytes prevent collision unlike timestamp alone
    const crypto = await import('crypto');
    const randomBytes = crypto.randomBytes(4).toString('hex');
    const bookingId = `AB-${Date.now().toString().slice(-8)}-${randomBytes}`;

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
    });

    await order.save();
    orderId = order._id.toString();

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(total * 100),
      currency: 'INR',
      receipt: bookingId,
      notes: {
        orderId: orderId,
        customerEmail,
        bookingId,
      },
    });

    order.razorpayOrderId = razorpayOrder.id;
    await order.save();

    return successResponse({
      success: true,
      orderId: order._id,
      bookingId,
      razorpayOrderId: razorpayOrder.id,
      razorpayKey: process.env.RAZORPAY_KEY_ID,
      amount: razorpayOrder.amount,
      currency: 'INR',
    });

  } catch (error) {
    console.error('Checkout error:', error);

    if (orderId) {
      try {
        await Order.findByIdAndDelete(orderId);
      } catch (cleanupError) {
        console.error('Orphaned order cleanup failed:', cleanupError);
      }
    }

    return errorResponse(getSafeErrorMessage(error), 500);
  }
}
