import mongoose, { Document, Schema } from 'mongoose';

export interface ICollectionDocument extends Document {
  name: string;
  slug: string;
  description: string;
  image?: string;
  productCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CollectionSchema = new Schema<ICollectionDocument>(
  {
    name: { type: String, required: true, index: true },
    slug: { type: String, unique: true, required: true, lowercase: true, trim: true },
    description: { type: String, default: '' },
    image: String,
    productCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export const Collection =
  mongoose.models.Collection ||
  mongoose.model<ICollectionDocument>('Collection', CollectionSchema);
