import mongoose, { Document, Schema } from 'mongoose';

export interface ICatalogSyncLogDocument extends Document {
  syncType: 'products' | 'collections' | 'products_by_collection';
  status: 'success' | 'failed' | 'partial';
  recordsProcessed: number;
  recordsFailed: number;
  errorDetails?: string;
  syncedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CatalogSyncLogSchema = new Schema<ICatalogSyncLogDocument>(
  {
    syncType: {
      type: String,
      enum: ['products', 'collections', 'products_by_collection'],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['success', 'failed', 'partial'],
      required: true,
      index: true,
    },
    recordsProcessed: { type: Number, default: 0 },
    recordsFailed: { type: Number, default: 0 },
    errorDetails: String,
    syncedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

// TTL index: auto-delete log entries older than 90 days
CatalogSyncLogSchema.index({ syncedAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const CatalogSyncLog =
  mongoose.models.CatalogSyncLog ||
  mongoose.model<ICatalogSyncLogDocument>('CatalogSyncLog', CatalogSyncLogSchema);
