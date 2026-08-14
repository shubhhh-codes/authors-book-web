/**
 * Shiprocket Catalog Webhook Service
 *
 * Pushes product and collection updates to Shiprocket Checkout
 * for real-time catalog sync with automated retries, idempotency, and timeouts.
 *
 * Reference: Shiprocket Checkout Integration Guide – Section 2
 *
 * Product webhook:  POST https://checkout-api.shiprocket.com/wh/v1/custom/product
 * Collection webhook: POST https://checkout-api.shiprocket.com/wh/v1/custom/collection
 */

import crypto from 'crypto';
import { formatProductForShiprocket, formatCollectionForShiprocket } from './catalogTransform';
import { logCatalogEvent } from '@/lib/logger';
import { invalidateCatalogCache } from './catalogCache';
import { createOrUpdateVariantMapping } from './variantMapping';

const WEBHOOK_BASE = 'https://checkout-api.shiprocket.com/wh/v1/custom';
const MAX_ATTEMPTS = 3;
const REQUEST_TIMEOUT_MS = 10000; // 10s timeout per attempt

export interface PushResult {
  success: boolean;
  error?: string;
}

/**
 * Compute HMAC-SHA256 in Base64 for Shiprocket webhook authentication.
 */
function computeHMAC(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('base64');
}

/**
 * Helper to delay execution for exponential backoff.
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Push a product create/update to Shiprocket's catalog webhook with automated retries.
 *
 * @param product - The MongoDB product document
 * @returns { success: boolean; error?: string }
 */
export async function pushProductToShiprocket(
  product: Record<string, any>
): Promise<PushResult> {
  const apiKey = process.env.NEXT_PUBLIC_SRC_API_KEY;
  const secretKey = process.env.SRC_SECRET_KEY;

  if (!apiKey || !secretKey) {
    const errorMsg = 'Missing SRC_API_KEY or SRC_SECRET_KEY — skipping product webhook push';
    console.warn(`[CatalogWebhook] ${errorMsg}`);
    return { success: false, error: errorMsg };
  }

  // Clear catalog cache so fresh data is served
  invalidateCatalogCache('catalog:products');

  const formattedProduct = formatProductForShiprocket(product);
  const payload = JSON.stringify(formattedProduct);
  const hmac = computeHMAC(payload, secretKey);

  const updatedAtTimestamp = product.updatedAt
    ? Math.floor(new Date(product.updatedAt).getTime() / 1000)
    : Math.floor(Date.now() / 1000);
  const idempotencyKey = `product-${product._id || product.id || formattedProduct.id}-${updatedAtTimestamp}`;

  let lastError = '';

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(`${WEBHOOK_BASE}/product`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': apiKey,
          'X-Api-HMAC-SHA256': hmac,
          'Idempotency-Key': idempotencyKey,
        },
        body: payload,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        // Store variant mappings for order webhook matching
        try {
          for (const variant of formattedProduct.variants) {
            await createOrUpdateVariantMapping(
              variant.id,
              formattedProduct.id,
              variant.sku,
              product.shiprocketVariantId ? String(product.shiprocketVariantId) : undefined
            );
          }
          logCatalogEvent({
            type: 'variant_mapping_stored',
            productId: formattedProduct.id,
            variantCount: formattedProduct.variants.length,
          });
        } catch (mappingError) {
          logCatalogEvent({
            type: 'variant_mapping_failed',
            productId: formattedProduct.id,
            error: mappingError instanceof Error ? mappingError.message : 'Unknown error',
          });
        }

        logCatalogEvent({
          type: 'sync_success',
          productId: formattedProduct.id,
          attempt,
          metadata: { title: formattedProduct.title, idempotencyKey },
        });
        return { success: true };
      }

      const responseText = await response.text();
      lastError = `HTTP ${response.status}: ${responseText}`;

      logCatalogEvent({
        type: 'sync_retry',
        productId: formattedProduct.id,
        attempt,
        error: lastError,
      });
    } catch (err: any) {
      clearTimeout(timeoutId);
      lastError = err.name === 'AbortError' ? 'Request timed out after 10s' : (err.message || String(err));

      logCatalogEvent({
        type: 'sync_retry',
        productId: formattedProduct.id,
        attempt,
        error: lastError,
      });
    }

    // Exponential backoff: 1s -> 3s -> 9s
    if (attempt < MAX_ATTEMPTS) {
      const backoffMs = 1000 * Math.pow(3, attempt - 1);
      await delay(backoffMs);
    }
  }

  logCatalogEvent({
    type: 'sync_failed',
    productId: formattedProduct.id,
    attempt: MAX_ATTEMPTS,
    error: lastError,
  });

  return { success: false, error: lastError };
}

/**
 * Push a collection create/update to Shiprocket's catalog webhook with automated retries.
 *
 * @param collection - The MongoDB collection document
 * @returns { success: boolean; error?: string }
 */
export async function pushCollectionToShiprocket(
  collection: Record<string, any>
): Promise<PushResult> {
  const apiKey = process.env.NEXT_PUBLIC_SRC_API_KEY;
  const secretKey = process.env.SRC_SECRET_KEY;

  if (!apiKey || !secretKey) {
    const errorMsg = 'Missing SRC_API_KEY or SRC_SECRET_KEY — skipping collection webhook push';
    console.warn(`[CatalogWebhook] ${errorMsg}`);
    return { success: false, error: errorMsg };
  }

  invalidateCatalogCache('catalog:collections');

  const formattedCollection = formatCollectionForShiprocket(collection);
  const payload = JSON.stringify(formattedCollection);
  const hmac = computeHMAC(payload, secretKey);

  const updatedAtTimestamp = collection.updatedAt
    ? Math.floor(new Date(collection.updatedAt).getTime() / 1000)
    : Math.floor(Date.now() / 1000);
  const idempotencyKey = `collection-${collection._id || collection.id || formattedCollection.id}-${updatedAtTimestamp}`;

  let lastError = '';

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(`${WEBHOOK_BASE}/collection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': apiKey,
          'X-Api-HMAC-SHA256': hmac,
          'Idempotency-Key': idempotencyKey,
        },
        body: payload,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        logCatalogEvent({
          type: 'sync_success',
          productId: formattedCollection.id,
          attempt,
          metadata: { title: formattedCollection.title, idempotencyKey },
        });
        return { success: true };
      }

      const responseText = await response.text();
      lastError = `HTTP ${response.status}: ${responseText}`;

      logCatalogEvent({
        type: 'sync_retry',
        productId: formattedCollection.id,
        attempt,
        error: lastError,
      });
    } catch (err: any) {
      clearTimeout(timeoutId);
      lastError = err.name === 'AbortError' ? 'Request timed out after 10s' : (err.message || String(err));

      logCatalogEvent({
        type: 'sync_retry',
        productId: formattedCollection.id,
        attempt,
        error: lastError,
      });
    }

    if (attempt < MAX_ATTEMPTS) {
      const backoffMs = 1000 * Math.pow(3, attempt - 1);
      await delay(backoffMs);
    }
  }

  logCatalogEvent({
    type: 'sync_failed',
    productId: formattedCollection.id,
    attempt: MAX_ATTEMPTS,
    error: lastError,
  });

  return { success: false, error: lastError };
}
