/**
 * Catalog Service
 * Provides data access for the Shiprocket catalog sync API endpoints.
 *
 * Products without an explicit `isActive` field fall back to `published`
 * for backward compatibility with the existing product schema.
 */

import Product from '@/lib/schemas/Product';
import { Collection } from '@/lib/schemas/Collection';
import { CatalogSyncLog } from '@/lib/schemas/CatalogSyncLog';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface ProductsResult {
  data: unknown[];
  pagination: Pagination;
}

interface CollectionsResult {
  data: unknown[];
  total: number;
}

interface ProductsByCollectionResult {
  collection: unknown;
  data: unknown[];
  pagination: Pagination;
}

// ── Service Class ─────────────────────────────────────────────────────────────

class CatalogService {
  /**
   * Fetch paginated, sorted products.
   * Queries by `isActive` when present, otherwise falls back to `published`.
   */
  async getProducts(
    page: number = 1,
    limit: number = 50,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc',
    isActive: boolean = true
  ): Promise<ProductsResult> {
    const skip = (page - 1) * limit;
    const sortDirection = sortOrder === 'asc' ? 1 : -1;

    // Support both isActive (new) and published (legacy) fields
    const filter = isActive
      ? { $or: [{ isActive: true }, { isActive: { $exists: false }, published: true }] }
      : { isActive: false };

    try {
      const [data, total] = await Promise.all([
        Product.find(filter)
          .sort({ [sortBy]: sortDirection })
          .skip(skip)
          .limit(limit)
          .lean()
          .exec(),
        Product.countDocuments(filter),
      ]);

      return {
        data,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      };
    } catch (error) {
      console.error('[CatalogService] getProducts error:', error);
      throw error;
    }
  }

  /** Fetch all active collections */
  async getCollections(isActive: boolean = true): Promise<CollectionsResult> {
    try {
      const data = await Collection.find({ isActive })
        .sort({ createdAt: -1 })
        .lean()
        .exec();

      return { data, total: data.length };
    } catch (error) {
      console.error('[CatalogService] getCollections error:', error);
      throw error;
    }
  }

  /** Fetch paginated products belonging to a specific Collection by its MongoDB _id */
  async getProductsByCollection(
    collectionId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<ProductsByCollectionResult> {
    const skip = (page - 1) * limit;

    try {
      const collection = await Collection.findById(collectionId).lean().exec();
      if (!collection) {
        throw new Error(`[CatalogService] Collection not found: ${collectionId}`);
      }

      const filter = {
        collectionId,
        $or: [{ isActive: true }, { isActive: { $exists: false }, published: true }],
      };

      const [data, total] = await Promise.all([
        Product.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean()
          .exec(),
        Product.countDocuments(filter),
      ]);

      return {
        collection,
        data,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      };
    } catch (error) {
      console.error('[CatalogService] getProductsByCollection error:', error);
      throw error;
    }
  }

  /** Write an audit record for each catalog sync call (fire-and-forget) */
  async logCatalogSync(
    syncType: 'products' | 'collections' | 'products_by_collection',
    status: 'success' | 'failed' | 'partial',
    recordsProcessed: number,
    recordsFailed: number = 0,
    errorDetails?: string
  ): Promise<void> {
    try {
      await CatalogSyncLog.create({
        syncType,
        status,
        recordsProcessed,
        recordsFailed,
        errorDetails,
        syncedAt: new Date(),
      });
    } catch (err) {
      // Non-fatal — a logging failure must never break the API response
      console.error('[CatalogService] logCatalogSync error:', err);
    }
  }
}

export const catalogService = new CatalogService();
