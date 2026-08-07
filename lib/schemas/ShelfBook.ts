import mongoose from 'mongoose';

const ShelfBookSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    shortTitle: { type: String, required: true },
    author: { type: String, required: true },
    description: { type: String, default: '' },
    quote: { type: String, default: '' },
    quoteBy: { type: String, default: '' },
    format: { type: String, default: 'Hardcover' },
    availability: { type: String, default: 'Available now' },
    url: { type: String, default: '#' },
    cover: { type: String, default: '#2b6192' },
    accent: { type: String, default: '#ffffff' },
    ink: { type: String, default: '#ffffff' },
    motif: {
      type: String,
      default: 'orbit',
      enum: [
        'lattice',
        'corrosion',
        'efficiency',
        'network',
        'boom',
        'organization',
        'schematic',
        'flight',
        'circuit',
        'orbit',
        'branches',
        'wave',
        'runner',
        'gather',
        'maze',
        'fracture',
        'continuum',
        'windows',
        'steps',
      ],
    },
    height: { type: Number, default: 2.1 },
    thickness: { type: Number, default: 0.22 },
    coverImage: { type: String, default: '' },
    linkLabel: { type: String, default: '' },
    living: { type: Boolean, default: false },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
    order: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ShelfBookSchema.index({ published: 1, order: 1, height: -1 });

export default mongoose.models.ShelfBook || mongoose.model('ShelfBook', ShelfBookSchema);
