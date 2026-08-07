import type { Product } from '@/lib/types';

/**
 * Validates whether a product is suitable for public storefront display
 * and recommendation feeds. Filters out unpublished items, imageless products,
 * and developer test entries (e.g. asasd, test, asdf).
 */
export const isValidCatalogProduct = (p: Product): boolean => {
  if (!p || !p.title) return false;
  if (p.published === false) return false;

  // Must have at least 1 valid image with a non-empty URL
  const hasValidImage =
    Array.isArray(p.images) &&
    p.images.some(
      (img) => img && typeof img.url === 'string' && img.url.trim().length > 0
    );
  if (!hasValidImage) return false;

  // Filter out developer test strings & gibberish placeholders
  const cleanTitle = p.title.trim().toLowerCase();
  const isTestTitle =
    /^(asdf|asasd|asdsadasd|qwerty|test|aaaa|bbbb|1234|xyz)$/i.test(
      cleanTitle
    ) || cleanTitle.length < 3;
  if (isTestTitle) return false;

  return true;
};
