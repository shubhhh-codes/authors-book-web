import { z } from 'zod';

/**
 * Validation schemas for API routes using Zod
 * Ensures type-safe and validated input/output
 */

// ─────────────────────────────────────────────────────────────
// CHECKOUT VALIDATION
// ─────────────────────────────────────────────────────────────

export const CheckoutItemSchema = z.object({
  productId: z.string().min(1, 'Product ID required'),
  handle: z.string(),
  title: z.string(),
  sku: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  quantity: z.number().int().positive('Quantity must be at least 1'),
});

export const ShippingAddressSchema = z.object({
  street: z.string().min(5, 'Street address required'),
  city: z.string().min(2, 'City required'),
  state: z.string().min(2, 'State required'),
  zip: z.string().regex(/^\d{6}$/, 'Valid 6-digit PIN code required'),
});

export const CheckoutRequestSchema = z.object({
  items: z.array(CheckoutItemSchema).min(1, 'Cart is empty'),
  subtotal: z.number().positive('Subtotal must be positive'),
  shippingCost: z.number().nonnegative('Shipping cost cannot be negative'),
  total: z.number().positive('Total must be positive'),
  customerEmail: z.string().email('Valid email required'),
  customerName: z.string().min(2, 'Name must be at least 2 characters'),
  customerPhone: z.string().regex(/^\d{10}$/, 'Valid 10-digit phone number required'),
  shippingAddress: ShippingAddressSchema,
});

export type CheckoutRequest = z.infer<typeof CheckoutRequestSchema>;

// ─────────────────────────────────────────────────────────────
// PAYMENT VERIFICATION
// ─────────────────────────────────────────────────────────────

export const VerifyPaymentSchema = z.object({
  razorpayOrderId: z.string().min(1, 'Razorpay order ID required'),
  razorpayPaymentId: z.string().min(1, 'Razorpay payment ID required'),
  razorpaySignature: z.string().min(1, 'Razorpay signature required'),
  orderId: z.string().min(1, 'Order ID required'),
});

export type VerifyPaymentRequest = z.infer<typeof VerifyPaymentSchema>;

// ─────────────────────────────────────────────────────────────
// WHATSAPP NOTIFICATION
// ─────────────────────────────────────────────────────────────

export const WhatsAppNotificationSchema = z.object({
  phone: z.string().regex(/^\+?91\d{10}$/, 'Valid Indian phone number required'),
  orderId: z.string(),
  customerName: z.string(),
  total: z.number(),
  trackingUrl: z.string().url().optional(),
  type: z.enum(['order_confirmation', 'shipping_update']),
});

export type WhatsAppNotification = z.infer<typeof WhatsAppNotificationSchema>;

// ─────────────────────────────────────────────────────────────
// UTILITY FUNCTIONS
// ─────────────────────────────────────────────────────────────

/**
 * Safe JSON parsing with Zod validation
 * Returns validated object or throws error with details
 */
export async function parseRequestBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<T> {
  try {
    const body = await request.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      throw new Error(`Validation failed: ${messages}`);
    }
    throw error;
  }
}

/**
 * Generate safe response with error details
 */
export function errorResponse(message: string, status: number = 400) {
  return Response.json({ error: message }, { status });
}

export function successResponse<T>(data: T, status: number = 200) {
  return Response.json(data, { status });
}
