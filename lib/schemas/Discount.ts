import mongoose from 'mongoose';

const DiscountSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  discountType: { type: String, enum: ['percentage', 'flat'], default: 'percentage' },
  value: { type: Number, required: true }, // e.g. 10 (%) or 100 (₹)
  minSubtotal: { type: Number, default: 0 },
  usageCount: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Discount || mongoose.model('Discount', DiscountSchema);
