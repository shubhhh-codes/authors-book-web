/**
 * Shiprocket Catalog Format Utilities
 *
 * Converts MongoDB product/collection documents into the exact JSON format
 * required by Shiprocket (Fastrr) Checkout for catalog sync and webhooks.
 *
 * Reference: Shiprocket Checkout Integration Guide – Section 1 & 2
 * Webhook & Catalog API payload specification:
 *   - "id": integer/number (e.g. 632910392)
 *   - "title": string
 *   - "body_html": HTML string (e.g. "<p>...</p>")
 *   - "vendor": string
 *   - "product_type": string
 *   - "updated_at": ISO timestamp (e.g. "2023-11-07T09:50:12-05:00")
 *   - "status": "active" | "draft"
 *   - "variants": [ { "id": number, "title": string, "price": "199.00", "quantity": number, "sku": string, "updated_at": string, "image": { "src": string }, "weight": number } ]
 *   - "image": { "src": string }
 */

export interface ShiprocketProduct {
  id: number;
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  updated_at: string;
  status: 'active' | 'draft';
  variants: ShiprocketVariant[];
  image: { src: string };
  images?: Array<{ src: string; position: number }>;
  tags?: string | string[];
  [key: string]: unknown;
}

export interface ShiprocketVariant {
  id: number;
  title: string;
  price: string;
  quantity: number;
  sku: string;
  updated_at: string;
  image: { src: string };
  weight: number;
}

export interface ShiprocketCollection {
  id: number;
  title: string;
  body_html: string;
  updated_at: string;
  image: { src: string };
}

/**
 * Convert any string (like a 24-character MongoDB ObjectId hex string)
 * to a deterministic, stable positive 32-bit integer (e.g. 632910392).
 * Ensures IDs contain only numbers without hexadecimal characters (a-f).
 */
export function toNumericId(id: unknown, salt: number = 0): number {
  if (typeof id === 'number' && !isNaN(id) && id > 0) {
    return Math.floor(id);
  }
  if (!id) {
    return 100000000 + salt;
  }

  const str = String(id).trim();

  // If already a purely numeric string
  if (/^\d+$/.test(str) && str.length <= 12) {
    const parsed = parseInt(str, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }

  // If 24-char hex MongoDB ObjectId
  if (/^[0-9a-fA-F]{24}$/.test(str)) {
    // Extract 8-hex character slice for high entropy
    const subHex = salt === 0 ? str.slice(-8) : (str.slice(0, 4) + str.slice(-4));
    const num = parseInt(subHex, 16);
    // Modulo to fit within safe 32-bit positive integer (up to 2,147,483,647)
    return Math.abs((num + salt) % 2147483647) || (100000001 + salt);
  }

  // General string hashing algorithm (djb2)
  let hash = 5381 + salt;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash % 2147483647) || (100000000 + salt);
}

/**
 * Format a MongoDB product document into the exact structure
 * required by Shiprocket (Fastrr) catalog sync and webhooks.
 */
export function formatProductForShiprocket(product: Record<string, any>): ShiprocketProduct {
  const productId = toNumericId(product.numericId || product._id, 0);
  const variantId = toNumericId(product.shiprocketVariantId || product._id, 1);

  const now = product.updatedAt || product.createdAt || new Date().toISOString();
  const updatedAt = typeof now === 'string' ? now : new Date(now).toISOString();

  // First image URL
  const firstImageSrc =
    (product.images && product.images[0]?.url) ||
    (product.images && product.images[0]?.src) ||
    product.coverImage ||
    '';

  // Build images array
  const images = (product.images || []).map((img: any, idx: number) => ({
    url: img.url || img.src || '',
    src: img.url || img.src || '',
    alt: img.alt || product.title || '',
    position: img.position ?? idx + 1,
  }));

  // Format price as "199.00"
  const priceNum = typeof product.price === 'number' ? product.price : parseFloat(product.price || '0');
  const formattedPrice = isNaN(priceNum) ? '0.00' : priceNum.toFixed(2);

  // Format body_html
  const rawDescription = (product.description || '').trim();
  const bodyHtml = rawDescription
    ? (rawDescription.startsWith('<') ? rawDescription : `<p>${rawDescription}</p>`)
    : '';

  // Format weight
  const weight =
    typeof product.weight === 'number'
      ? product.weight
      : (product.dimensions?.weight ?? 0.3);

  // Build single variant per product
  const variant: ShiprocketVariant = {
    id: variantId,
    title: product.title || 'Default',
    price: formattedPrice,
    quantity: product.inventory?.quantity ?? 10,
    sku: product.sku || `SKU-${variantId}`,
    updated_at: updatedAt,
    image: {
      src: firstImageSrc,
    },
    weight,
  };

  const tagsArray = Array.isArray(product.tags) ? product.tags : (typeof product.tags === 'string' ? product.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : []);

  return {
    id: productId,
    title: product.title || '',
    body_html: bodyHtml,
    description: product.description || bodyHtml,
    vendor: product.vendor || 'Authors Book',
    product_type: product.type || product.category || 'Books',
    type: product.type || product.category || 'Books',
    genre: product.genre || '',
    category: product.category || 'Media > Books',
    updated_at: updatedAt,
    status: product.published !== false && product.isActive !== false ? 'active' : 'draft',
    handle: product.handle || '',
    sku: product.sku || variant.sku,
    price: priceNum,
    compareAtPrice: product.compareAtPrice,
    inventory: product.inventory || { quantity: 10, policy: 'deny' },
    tags: tagsArray,
    variants: [variant],
    image: {
      src: firstImageSrc,
    },
    images,
    seoTitle: product.seoTitle || '',
    seoDescription: product.seoDescription || '',
    bookmarkShape: product.bookmarkShape || '',
    color: product.color || '',
    material: product.material || '',
    targetAudience: product.targetAudience || '',
    language: product.language || '',
  };
}

/**
 * Format a MongoDB collection document into the exact structure
 * required by Shiprocket (Fastrr) catalog sync and webhooks.
 */
export function formatCollectionForShiprocket(collection: Record<string, any>): ShiprocketCollection {
  const collectionId = toNumericId(collection.numericId || collection._id, 0);
  const now = collection.updatedAt || collection.createdAt || new Date().toISOString();
  const updatedAt = typeof now === 'string' ? now : new Date(now).toISOString();

  const rawDescription = (collection.description || '').trim();
  const bodyHtml = rawDescription
    ? (rawDescription.startsWith('<') ? rawDescription : `<p>${rawDescription}</p>`)
    : '';

  const imageSrc = collection.image || collection.coverImage || '';

  return {
    id: collectionId,
    updated_at: updatedAt,
    title: collection.name || collection.title || '',
    body_html: bodyHtml,
    image: {
      src: imageSrc,
    },
  };
}

/**
 * Audit and validate that a product's variant IDs are consistent, pure numeric, and positive.
 */
export function validateVariantIdConsistency(product: any): boolean {
  if (!product) return false;
  const variants = product.variants;
  if (!Array.isArray(variants) || variants.length === 0) {
    const numId = toNumericId(product.shiprocketVariantId || product._id, 1);
    return typeof numId === 'number' && !isNaN(numId) && numId > 0;
  }
  return variants.every((v: any) => {
    const numId = typeof v.id === 'number' ? v.id : toNumericId(v.id || v._id, 1);
    return typeof numId === 'number' && !isNaN(numId) && numId > 0;
  });
}

