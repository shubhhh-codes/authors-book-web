import mongoose from 'mongoose';
import Product from '@/lib/schemas/Product';
import { toNumericId } from '@/lib/services/catalogTransform';

const VariantMappingSchema = new mongoose.Schema(
  {
    localVariantId: { type: Number, required: true, index: true },
    localProductId: { type: Number, required: true, index: true },
    sku: { type: String, required: true, index: true },
    shiprocketVariantId: { type: String, sparse: true, index: true },
    syncedAt: { type: Date, default: Date.now },
  },
  { collection: 'variant_mappings' }
);

VariantMappingSchema.index({ localVariantId: 1, sku: 1 }, { unique: true });

export const VariantMapping =
  mongoose.models.VariantMapping ||
  mongoose.model('VariantMapping', VariantMappingSchema);

/**
 * Upsert variant mapping record into database.
 */
export async function createOrUpdateVariantMapping(
  localVariantId: number,
  localProductId: number,
  sku: string,
  shiprocketVariantId?: string
) {
  return VariantMapping.updateOne(
    { localVariantId, sku },
    {
      $set: {
        localVariantId,
        localProductId,
        sku,
        ...(shiprocketVariantId && { shiprocketVariantId }),
        syncedAt: new Date(),
      },
    },
    { upsert: true }
  );
}

/**
 * Find variant mapping using multi-strategy identification:
 * 1. Shiprocket Variant ID match
 * 2. Local numeric Variant ID match
 * 3. SKU match
 * 4. Fallback lookup in Product collection (and auto-populate mapping)
 */
export async function findVariantByAnyId(
  variant_id?: string,
  sku?: string,
  localVariantId?: number
) {
  const conditions: Array<Record<string, unknown>> = [];

  if (variant_id) {
    conditions.push({ shiprocketVariantId: String(variant_id).trim() });
    conditions.push({ sku: String(variant_id).trim() });

    const parsedNum = parseInt(String(variant_id).trim(), 10);
    if (!isNaN(parsedNum)) {
      conditions.push({ localVariantId: parsedNum });
    }
  }

  if (sku) {
    conditions.push({ sku: String(sku).trim() });
  }

  if (typeof localVariantId === 'number' && !isNaN(localVariantId)) {
    conditions.push({ localVariantId });
  }

  if (conditions.length > 0) {
    const mapping = await VariantMapping.findOne({ $or: conditions }).lean();
    if (mapping) {
      return mapping;
    }
  }

  // Fallback Strategy: Check Product collection directly
  try {
    const productConditions: Array<Record<string, unknown>> = [];

    if (variant_id) {
      productConditions.push({ shiprocketVariantId: String(variant_id).trim() });
      productConditions.push({ sku: String(variant_id).trim() });
      if (/^[0-9a-fA-F]{24}$/.test(String(variant_id).trim())) {
        productConditions.push({ _id: String(variant_id).trim() });
      }
    }

    if (sku) {
      productConditions.push({ sku: String(sku).trim() });
    }

    if (productConditions.length > 0) {
      const product = await Product.findOne({ $or: productConditions }).lean();
      if (product) {
        const prodNumId = toNumericId(product.numericId || product._id, 0);
        const varNumId = localVariantId || toNumericId(product.shiprocketVariantId || product._id, 1);
        const resolvedSku = product.sku || sku || `SKU-${varNumId}`;

        // Auto-cache this mapping for future queries
        await createOrUpdateVariantMapping(
          varNumId,
          prodNumId,
          resolvedSku,
          variant_id || (product.shiprocketVariantId ? String(product.shiprocketVariantId) : undefined)
        );

        return {
          localVariantId: varNumId,
          localProductId: prodNumId,
          sku: resolvedSku,
          shiprocketVariantId: variant_id || (product.shiprocketVariantId ? String(product.shiprocketVariantId) : undefined),
          syncedAt: new Date(),
        };
      }
    }
  } catch (err) {
    console.warn('[VariantMapping] Direct product fallback lookup error:', err);
  }

  return null;
}
