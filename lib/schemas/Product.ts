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

// Add indexes for better query performance
ProductSchema.index({ published: 1, createdAt: -1 });
ProductSchema.index({ vendor: 1 });
ProductSchema.index({ genre: 1 });
ProductSchema.index({ type: 1 });
ProductSchema.index({ tags: 1 });
ProductSchema.index({ handle: 1 }, { unique: true, sparse: true });
ProductSchema.index({ title: 'text', description: 'text' }, { language_override: 'none' }); // Full-text search index

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);
