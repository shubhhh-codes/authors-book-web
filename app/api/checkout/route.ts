import { connectDB } from '@/lib/db';
import Order from '@/lib/schemas/Order';
import Product from '@/lib/schemas/Product';
import Razorpay from 'razorpay';
import { CheckoutRequestSchema, parseRequestBody, errorResponse, successResponse } from '@/lib/validations';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

export async function POST(request: Request) {
  let orderId: string | null = null;

  try {
    // ✅ 0. Rate limiting (5 requests per IP per minute)
    const clientIp = getClientIp(request);
    const { allowed, remaining } = checkRateLimit(clientIp, 5, 60 * 1000);

    if (!allowed) {
      return errorResponse(
        'Too many checkout attempts. Please try again later.',
        429
      );
    }

    await connectDB();
    
    // ✅ 1. Validate request body with Zod
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

    // ✅ 2. Verify items exist in database and prices match
    const productIds = items.map(item => {
      try {
        // Convert string productId to MongoDB ObjectId
        return new (require('mongoose')).Types.ObjectId(item.productId);
      } catch (e) {
        throw new Error(`Invalid product ID format: ${item.productId}`);
      }
    });
    const dbProducts = await Product.find({ _id: { $in: productIds } });

    if (dbProducts.length !== items.length) {
      return errorResponse('Some products in cart no longer exist', 400);
    }

    // ✅ 3. Verify prices haven't changed and check inventory
    for (const item of items) {
      const dbProduct = dbProducts.find(p => p._id.toString() === item.productId);
      
      if (!dbProduct) {
        return errorResponse(`Product ${item.title} not found`, 400);
      }

      // Check if price matches (within ₹1 tolerance for rounding)
      if (Math.abs(dbProduct.price - item.price) > 1) {
        return errorResponse(
          `Price changed for ${item.title}. Please refresh and try again.`,
          400
        );
      }

      // ✅ 4. Check inventory
      if (dbProduct.inventory?.quantity !== undefined) {
        if (dbProduct.inventory.quantity < item.quantity) {
          return errorResponse(
            `Only ${dbProduct.inventory.quantity} of ${item.title} available`,
            400
          );
        }
      }
    }

    // ✅ 5. Generate unique booking ID (using crypto for better uniqueness)
    const crypto = await import('crypto');
    const randomBytes = crypto.randomBytes(4).toString('hex');
    const bookingId = `AB-${Date.now().toString().slice(-8)}-${randomBytes}`;

    // ✅ 6. Create order in database FIRST (before Razorpay)
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

    // ✅ 7. Create Razorpay order with link to our order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(total * 100),
      currency: 'INR',
      receipt: bookingId, // Use our booking ID as receipt for tracking
      notes: {
        orderId: orderId,
        customerEmail,
        bookingId,
      },
    });

    // ✅ 8. Update order with Razorpay order ID
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

  } catch (error: any) {
    console.error('Checkout error:', error);
    
    // Clean up orphaned order if something fails after creation
    if (orderId) {
      try {
        await Order.findByIdAndDelete(orderId);
      } catch (cleanupError) {
        console.error('Cleanup failed:', cleanupError);
      }
    }

    // Return safe error message (no sensitive data)
    const message = error.message?.includes('Validation failed')
      ? error.message
      : 'Failed to create order. Please try again.';

    return errorResponse(message, 500);
  }
}

