import { connectDB } from '@/lib/db';
import Order from '@/lib/schemas/Order';
import Product from '@/lib/schemas/Product';
import crypto from 'crypto';
import { VerifyPaymentSchema, parseRequestBody, errorResponse, successResponse, getSafeErrorMessage } from '@/lib/validations';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(request: Request): Promise<Response> {
  try {
    const clientIp = getClientIp(request);
    const { allowed } = checkRateLimit(`verify:${clientIp}`, 10, 60 * 1000);

    if (!allowed) {
      return errorResponse('Too many verification attempts. Please try again later.', 429);
    }

    await connectDB();

    const payload = await parseRequestBody(request, VerifyPaymentSchema);
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      orderId,
    } = payload;

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      throw new Error('RAZORPAY_KEY_SECRET not configured');
    }

    const shasum = crypto.createHmac('sha256', secret);
    shasum.update(`${razorpayOrderId}|${razorpayPaymentId}`);
    const expectedSignature = shasum.digest('hex');

    const signatureMatches = crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(razorpaySignature)
    );

    if (!signatureMatches) {
      return errorResponse('Payment verification failed. Invalid signature.', 401);
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return errorResponse('Order not found', 404);
    }

    // Idempotent: return success if already paid
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

    if (order.items && order.items.length > 0) {
      const bulkOps = order.items.map((item: any) => ({
        updateOne: {
          filter: { _id: item.productId },
          update: { $inc: { 'inventory.quantity': -item.quantity } }
        }
      }));

      await Product.bulkWrite(bulkOps);
    }

    order.status = 'paid';
    order.paymentId = razorpayPaymentId;
    order.timestamps.paid = new Date();
    await order.save();

    // WhatsApp notification — fire-and-forget, never blocks payment confirmation
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
      console.warn('WhatsApp notification failed (non-blocking):', whatsappError);
    }

    return successResponse({
      success: true,
      message: 'Payment verified successfully',
      bookingId: order.bookingId,
      orderId: order._id,
    });

  } catch (error) {
    console.error('Verification error:', error);
    return errorResponse(getSafeErrorMessage(error), 500);
  }
}
