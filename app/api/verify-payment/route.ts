import { connectDB } from '@/lib/db';
import Order from '@/lib/schemas/Order';
import Product from '@/lib/schemas/Product';
import crypto from 'crypto';
import { VerifyPaymentSchema, parseRequestBody, errorResponse, successResponse } from '@/lib/validations';

export async function POST(request: Request) {
  try {
    await connectDB();
    
    // ✅ 1. Validate request with Zod
    const payload = await parseRequestBody(request, VerifyPaymentSchema);
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      orderId,
    } = payload;

    // ✅ 2. Verify Razorpay signature (cryptographic verification)
    const secret = process.env.RAZORPAY_KEY_SECRET || '';
    if (!secret) {
      throw new Error('RAZORPAY_KEY_SECRET not configured');
    }

    const shasum = crypto.createHmac('sha256', secret);
    shasum.update(`${razorpayOrderId}|${razorpayPaymentId}`);
    const expectedSignature = shasum.digest('hex');

    // Use constant-time comparison to prevent timing attacks
    const signatureMatches = crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(razorpaySignature)
    );

    if (!signatureMatches) {
      return errorResponse('Payment verification failed. Invalid signature.', 401);
    }

    // ✅ 3. Check if order exists and hasn't been paid yet
    const order = await Order.findById(orderId);
    if (!order) {
      return errorResponse('Order not found', 404);
    }

    if (order.status === 'paid') {
      return successResponse({
        success: true,
        message: 'Order already paid',
        bookingId: order.bookingId,
      });
    }

    if (order.razorpayOrderId !== razorpayOrderId) {
      return errorResponse('Order ID mismatch', 400);
    }

    // ✅ 4. Deduct inventory for paid order
    for (const item of order.items) {
      await Product.findByIdAndUpdate(
        item.productId,
        {
          $inc: { 'inventory.quantity': -item.quantity },
        },
        { new: true }
      );
    }

    // ✅ 5. Update order status to paid
    order.status = 'paid';
    order.paymentId = razorpayPaymentId;
    order.timestamps.paid = new Date();
    await order.save();

    // ✅ 6. Send WhatsApp notification
    // Note: If WhatsApp credentials not configured, notification fails silently
    // This doesn't affect order confirmation - order is already saved to DB
    try {
      const { sendWhatsAppNotification } = await import('@/lib/whatsapp');
      await sendWhatsAppNotification({
        phone: order.customerPhone,
        orderId: order.bookingId,
        customerName: order.customerName,
        total: order.total,
        type: 'order_confirmation',
      });
    } catch (whatsappError) {
      console.warn('WhatsApp notification failed:', whatsappError);
      // Don't fail the payment verification if WhatsApp fails
      // Customer still has order confirmation in DB and email
    }

    return successResponse({
      success: true,
      message: 'Payment verified successfully',
      bookingId: order.bookingId,
      orderId: order._id,
    });

  } catch (error: any) {
    console.error('Verification error:', error);
    
    // Don't expose internal error details
    const message = error.message?.includes('Validation failed')
      ? error.message
      : 'Payment verification failed. Please contact support.';

    return errorResponse(message, 500);
  }
}

