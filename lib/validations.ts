import { z } from 'zod';

// Checkout --
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

// ── Payment Verification ─────────────────────────────────────

export const VerifyPaymentSchema = z.object({
  razorpayOrderId: z.string().min(1, 'Razorpay order ID required'),
  razorpayPaymentId: z.string().min(1, 'Razorpay payment ID required'),
  razorpaySignature: z.string().min(1, 'Razorpay signature required'),
  orderId: z.string().min(1, 'Order ID required'),
});

export type VerifyPaymentRequest = z.infer<typeof VerifyPaymentSchema>;

// ── WhatsApp Notification ────────────────────────────────────

export const WhatsAppNotificationSchema = z.object({
  phone: z.string().regex(/^\+?91\d{10}$/, 'Valid Indian phone number required'),
  orderId: z.string(),
  customerName: z.string(),
  total: z.number(),
  trackingUrl: z.string().url().optional(),
  type: z.enum(['order_confirmation', 'shipping_update']),
});

export type WhatsAppNotification = z.infer<typeof WhatsAppNotificationSchema>;

// ── Contact Form ─────────────────────────────────────────────

export const ContactFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid email required'),
  phone: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

export type ContactForm = z.infer<typeof ContactFormSchema>;

// ── Discount Validation ──────────────────────────────────────

export const DiscountValidateSchema = z.object({
  code: z.string().min(1, 'Promo code is required'),
  subtotal: z.number().nonnegative('Subtotal must be non-negative'),
});

export type DiscountValidateRequest = z.infer<typeof DiscountValidateSchema>;

// ── Admin Login ──────────────────────────────────────────────

export const AdminLoginSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

export type AdminLoginRequest = z.infer<typeof AdminLoginSchema>;

// ── Admin Order Update (whitelist allowed fields) ────────────

export const AdminOrderUpdateSchema = z.object({
  status: z.enum(['pending', 'paid', 'shipped', 'delivered', 'failed']).optional(),
  trackingUrl: z.string().url().optional().or(z.literal('')),
  shiprocketOrderId: z.string().optional(),
  shipmentId: z.string().optional(),
}).strict();

export type AdminOrderUpdate = z.infer<typeof AdminOrderUpdateSchema>;

// ── Admin Product Create / Update ────────────────────────────

export const AdminProductCreateSchema = z.object({
  title: z.string().min(1, 'Product title is required'),
  description: z.string().optional().default(''),
  price: z.number({ coerce: true }).positive('Price must be positive'),
  compareAtPrice: z.number({ coerce: true }).positive().optional().nullable(),
  vendor: z.string().optional().default('Authors Book'),
  category: z.string().optional().default('General'),
  type: z.string().optional().default('book'),
  genre: z.string().optional().default(''),
  tags: z.union([
    z.array(z.string()),
    z.string().transform((s) => s.split(',').map((t) => t.trim())),
  ]).optional().default([]),
  sku: z.string().optional(),
  weight: z.number({ coerce: true }).optional().default(0.3),
  quantity: z.number({ coerce: true }).int().nonnegative().optional().default(10),
  images: z.array(z.string()).optional().default([]),
  published: z.boolean().optional().default(true),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  bookmarkShape: z.string().optional(),
  color: z.string().optional(),
  material: z.string().optional(),
  targetAudience: z.string().optional(),
  language: z.string().optional(),
});

export type AdminProductCreate = z.infer<typeof AdminProductCreateSchema>;

export const AdminProductUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.number({ coerce: true }).positive().optional(),
  compareAtPrice: z.number({ coerce: true }).positive().optional().nullable(),
  vendor: z.string().optional(),
  category: z.string().optional(),
  type: z.string().optional(),
  genre: z.string().optional(),
  tags: z.union([
    z.array(z.string()),
    z.string().transform((s) => s.split(',').map((t) => t.trim())),
  ]).optional(),
  sku: z.string().optional(),
  weight: z.number({ coerce: true }).optional(),
  inventory: z.object({
    quantity: z.number({ coerce: true }).int().nonnegative(),
    policy: z.string().optional().default('deny'),
  }).optional(),
  images: z.array(z.string()).optional(),
  published: z.boolean().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  bookmarkShape: z.string().optional(),
  color: z.string().optional(),
  material: z.string().optional(),
  targetAudience: z.string().optional(),
  language: z.string().optional(),
});

export type AdminProductUpdate = z.infer<typeof AdminProductUpdateSchema>;

// ── Admin Discount Create ────────────────────────────────────

export const AdminDiscountCreateSchema = z.object({
  code: z.string().min(1, 'Discount code is required'),
  discountType: z.enum(['percentage', 'flat']).optional().default('percentage'),
  value: z.number({ coerce: true }).positive('Discount value must be positive'),
  minSubtotal: z.number({ coerce: true }).nonnegative().optional().default(0),
});

export type AdminDiscountCreate = z.infer<typeof AdminDiscountCreateSchema>;

// ── Admin Theme Update ───────────────────────────────────────

export const AdminThemeUpdateSchema = z.object({
  announcementText: z.string().optional(),
  announcementEmail: z.string().email().optional(),
  announcementPhone: z.string().optional(),
  aboutHeading: z.string().optional(),
  aboutQuote: z.string().optional(),
  aboutText: z.string().optional(),
});

export type AdminThemeUpdate = z.infer<typeof AdminThemeUpdateSchema>;

// ── Utility Functions ────────────────────────────────────────

/**
 * Safe JSON parsing with Zod validation.
 * Returns validated object or throws with field-level details.
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

export function errorResponse(message: string, status: number = 400): Response {
  return Response.json({ error: message }, { status });
}

export function successResponse<T>(data: T, status: number = 200): Response {
  return Response.json(data, { status });
}

/** Escape special regex characters in user input to prevent ReDoS */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Extract a safe error message from an unknown catch value */
export function getSafeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes('E11000') || error.message.includes('duplicate key')) {
      return 'A product with a similar title or handle already exists.';
    }
    return error.message;
  }
  return 'An unexpected error occurred';
}
