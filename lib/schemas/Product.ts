import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
  handle: String,
  title: String,
  description: String,
  vendor: String,
  category: String,
  type: String,
  tags: [String],
  published: Boolean,
  sku: String,
  weight: Number,
  price: Number,
  compareAtPrice: Number,
  inventory: {
    quantity: Number,
    policy: String,
  },
  images: [
    {
      url: String,
      alt: String,
      position: Number,
    },
  ],
  seoTitle: String,
  seoDescription: String,
  bookmarkShape: String,
  color: String,
  material: String,
  targetAudience: String,
  genre: String,
  language: String,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);
