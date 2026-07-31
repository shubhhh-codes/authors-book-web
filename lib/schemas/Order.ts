import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
  bookingId: { type: String, unique: true },
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
    enum: ['pending', 'paid', 'shipped', 'delivered', 'failed'],
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
  shiprocketOrderId: String,
  shipmentId: String,
  trackingUrl: String,
  timestamps: {
    created: { type: Date, default: Date.now },
    paid: Date,
    shipped: Date,
    delivered: Date,
  },
});

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);
