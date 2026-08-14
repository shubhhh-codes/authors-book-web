import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
  bookingId: { type: String, unique: true, sparse: true },
  customerEmail: String,
  customerName: String,
  customerPhone: String,
  items: [
    {
      productId: mongoose.Schema.Types.ObjectId,
      handle: String,
      title: String,
      sku: String,
      price: Number,
      quantity: Number,
    },
  ],
  subtotal: Number,
  shippingCost: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  total: Number,
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'paid', 'shipped', 'delivered', 'failed', 'cancelled'],
    default: 'pending',
  },
  paymentId: String,
  razorpayOrderId: String,
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    zip: String,
  },
  shiprocketOrderId: { type: String, index: true, sparse: true },
  shiprocketSessionId: { type: String, sparse: true },
  shipmentId: String,
  trackingUrl: String,
  // ── Shiprocket Checkout (SRC) fields ─────────────────────────
  orderNumber: { type: String, index: true, sparse: true },
  customer: {
    name: String,
    email: String,
    phone: String,
  },
  billingAddress: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: { type: String, default: 'IN' },
  },
  srcCheckoutUrl: String,
  srcEmbeddedUrl: String,
  paymentGateway: { type: String, enum: ['razorpay', 'shiprocket', 'upi'], default: 'razorpay' },
  paymentStatus: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  paidAt: Date,
  transactionId: String,
  totalAmount: Number,
  trackingNumber: String,
  shiprocketTrackingId: String,
  timestamps: {
    created: { type: Date, default: Date.now },
    paid: Date,
    shipped: Date,
    delivered: Date,
  },
});

OrderSchema.index({ customerEmail: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ 'timestamps.created': -1 });

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);
