# Database Schema

All models live in `lib/schemas/`. Connection managed by `lib/db.ts`.

---

## Order

**File:** [`lib/schemas/Order.ts`](../lib/schemas/Order.ts)  
**Collection:** `orders`

```ts
{
  bookingId: String,        // "AB-45678901" — human-readable reference
  customerEmail: String,
  customerName: String,
  customerPhone: String,
  items: [{
    productId: ObjectId,    // ref to products collection
    handle: String,         // Shopify-style handle, e.g. "the-alchemist"
    title: String,
    sku: String,
    price: Number,          // unit price in ₹
    quantity: Number,
  }],
  subtotal: Number,         // in ₹
  shippingCost: Number,     // default: 0
  tax: Number,              // default: 0
  total: Number,            // in ₹ (subtotal + shippingCost + tax)
  status: String,           // enum: 'pending' | 'paid' | 'shipped' | 'delivered' | 'failed'
  paymentId: String,        // Razorpay payment ID (set after verification)
  razorpayOrderId: String,  // Razorpay order ID (set at checkout)
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    zip: String,
  },
  shiprocketOrderId: String, // set if Shiprocket fulfilment integrated
  shipmentId: String,
  trackingUrl: String,
  timestamps: {
    created: Date,           // auto, Date.now
    paid: Date,              // set by verify-payment route
    shipped: Date,
    delivered: Date,
  },
}
```

**Key query patterns:**
```ts
// All orders, newest first
await Order.find({}).sort({ 'timestamps.created': -1 });

// Single order by bookingId
await Order.findOne({ bookingId: 'AB-45678901' });

// Mark as paid
await Order.findByIdAndUpdate(id, {
  status: 'paid',
  paymentId: razorpayPaymentId,
  'timestamps.paid': new Date(),
}, { new: true });
```

---

## Product

**File:** [`lib/schemas/Product.ts`](../lib/schemas/Product.ts)  
**Collection:** `products`

```ts
{
  handle: String,           // URL slug, e.g. "the-alchemist-by-paulo-coelho"
  title: String,
  description: String,
  vendor: String,           // Author name
  category: String,
  type: String,             // "Books" or "Bookmarks"
  tags: [String],
  published: Boolean,       // false = hidden from storefront
  sku: String,
  weight: Number,
  price: Number,            // in ₹
  compareAtPrice: Number,   // original price (for sale badge)
  inventory: {
    quantity: Number,
    policy: String,         // "deny" | "continue"
  },
  images: [{
    url: String,
    alt: String,
    position: Number,       // 1-indexed, position 1 = primary image
  }],
  seoTitle: String,
  seoDescription: String,
  // Bookmark-specific fields:
  bookmarkShape: String,
  color: String,
  material: String,
  // Book-specific fields:
  targetAudience: String,
  genre: String,            // e.g. "Fiction", "Self-Help", "Mystery"
  language: String,
  createdAt: Date,
}
```

**Key query patterns:**
```ts
// Storefront: published only, paginated
await Product.find({ published: true })
  .skip((page - 1) * limit)
  .limit(limit)
  .sort({ createdAt: -1 });

// Filter by type
await Product.find({ published: true, type: { $regex: /^Books/i } });

// Full-text search across fields
await Product.find({
  published: true,
  $or: [
    { title: /searchTerm/i },
    { vendor: /searchTerm/i },
    { genre: /searchTerm/i },
  ]
});
```

---

## Discount

**File:** [`lib/schemas/Discount.ts`](../lib/schemas/Discount.ts)  
**Collection:** `discounts`

```ts
{
  code: String,             // uppercase, unique e.g. "SAVE10"
  discountType: String,     // "percentage" | "flat"
  value: Number,            // 10 means 10% OR ₹10 depending on type
  minSubtotal: Number,      // minimum cart value to apply (default: 0)
  usageCount: Number,       // incremented on each use
  active: Boolean,          // false = deactivated
  createdAt: Date,
}
```

**Applying a discount:**
```ts
const discount = await Discount.findOne({ code: code.toUpperCase(), active: true });
if (!discount) throw new Error('Invalid code');
if (cart.subtotal < discount.minSubtotal) throw new Error('Minimum order not met');

const saving = discount.discountType === 'percentage'
  ? (cart.subtotal * discount.value) / 100
  : discount.value;
```

---

## ThemeSetting

**File:** [`lib/schemas/ThemeSetting.ts`](../lib/schemas/ThemeSetting.ts)  
**Collection:** `themesettings`

Singleton document — only one record is ever used (fetched with `findOne()`).

```ts
{
  announcementText: String,  // ribbon at top of storefront
  announcementEmail: String,
  announcementPhone: String,
  aboutHeading: String,
  aboutQuote: String,
  aboutText: String,
  updatedAt: Date,
}
```

**Read/update pattern:**
```ts
// Read
const theme = await ThemeSetting.findOne({});

// Update (upsert)
await ThemeSetting.findOneAndUpdate({}, { ...fields, updatedAt: new Date() }, { upsert: true });
```
