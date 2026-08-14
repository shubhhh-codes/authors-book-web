export interface ProductImage {
  url: string;
  alt: string;
  position: number;
}

export interface Product {
  _id: string;
  handle: string;
  title: string;
  description?: string;
  vendor?: string;
  category?: string;
  type?: string;
  tags?: string[];
  published?: boolean;
  sku?: string;
  weight?: number;
  price: number;
  compareAtPrice?: number;
  inventory?: {
    quantity: number;
    policy: string;
  };
  images: ProductImage[];
  seoTitle?: string;
  seoDescription?: string;
  bookmarkShape?: string;
  color?: string;
  material?: string;
  targetAudience?: string;
  genre?: string;
  language?: string;
  createdAt?: string;
}

export interface OrderItem {
  productId: string;
  handle: string;
  title: string;
  sku?: string;
  price: number;
  quantity: number;
}

export interface Order {
  _id: string;
  bookingId: string;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'failed';
  paymentId?: string;
  razorpayOrderId?: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  shiprocketOrderId?: string;
  shipmentId?: string;
  trackingUrl?: string;
  timestamps: {
    created: string;
    paid?: string;
    shipped?: string;
    delivered?: string;
  };
}

export interface Discount {
  _id: string;
  code: string;
  discountType: 'percentage' | 'flat';
  value: number;
  minSubtotal: number;
  usageCount: number;
  active: boolean;
  createdAt: string;
}

export interface ThemeSetting {
  _id?: string;
  announcementText: string;
  announcementEmail: string;
  announcementPhone: string;
  aboutHeading: string;
  aboutQuote: string;
  aboutText: string;
  updatedAt?: string;
}

export interface CollectionPreview {
  name: string;
  handle: string;
  href: string;
  image?: string;
  productCount?: number;
  bgColor?: string;
}

export interface CategoryCard {
  heading: string;
  textColor: string;
  buttonLabel: string;
  buttonBgColor: string;
  buttonTextColor: string;
  link: string;
  bgColor: string;
  borderColor: string;
}

export interface AccordionRow {
  heading: string;
  content: string;
}

export interface CartItem extends Product {
  quantity: number;
}

/** Razorpay checkout handler response */
export interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

/** Razorpay SDK on window */
export interface RazorpayInstance {
  open: () => void;
}

export interface RazorpayConstructor {
  new (options: Record<string, unknown>): RazorpayInstance;
}

// ── Shiprocket Checkout (SRC) ────────────────────────────────

export interface SRCSessionResponse {
  success: boolean;
  data?: {
    session_id: string;
    order_id: string;
    checkout_url: string;
    embedded_url: string;
    expires_at: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface SRCWebhookEvent {
  event: 'order.created' | 'order.confirmed' | 'order.failed' | 'order.cancelled';
  data: {
    order_id: string;
    session_id: string;
    order_amount: number;
    payment_status: 'completed' | 'failed' | 'pending';
    transaction_id?: string;
    timestamp: string;
  };
}

export interface CheckoutSessionRequest {
  customerId?: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country?: string;
  };
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country?: string;
  };
  cartItems: Array<{
    id: string;
    title: string;
    quantity: number;
    price: number;
    sku?: string;
  }>;
}

export interface ShelfBook {
  _id?: string;
  id: string;
  title: string;
  shortTitle: string;
  author: string;
  description: string;
  quote: string;
  quoteBy: string;
  format: string;
  availability: string;
  url: string;
  cover: string;
  accent: string;
  ink: string;
  motif: string;
  height: number;
  thickness: number;
  coverImage?: string;
  linkLabel?: string;
  living?: boolean;
  productId?: string | null;
  order?: number;
  published?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ── Shiprocket Catalog API Types ─────────────────────────────

export interface IProduct {
  _id: string;
  title: string;
  description: string;
  price: number;
  sku?: string;
  stock?: number;
  category?: string;
  collectionId?: string;
  images: Array<{ url: string; alt: string; position?: number }>;
  dimensions?: {
    length: number;
    width: number;
    height: number;
    weight: number;
  };
  isActive: boolean;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICollection {
  _id: string;
  name: string;
  slug: string;
  description: string;
  image?: string;
  isActive: boolean;
  productCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CatalogSyncLog {
  _id: string;
  syncType: 'products' | 'collections' | 'products_by_collection';
  status: 'success' | 'failed' | 'partial';
  recordsProcessed: number;
  recordsFailed: number;
  errorDetails?: string;
  syncedAt: Date;
}
