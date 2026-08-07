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

