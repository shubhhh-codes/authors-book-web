/**
 * High-Performance Catalog Caching Layer
 *
 * Provides in-memory caching with TTL and tag-based invalidation
 * for catalog endpoints to ensure <50ms response times.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const memoryCache = new Map<string, CacheEntry<any>>();

/**
 * Retrieve cached data or compute and store it.
 */
export async function getCachedCatalogData<T>(
  key: string,
  ttlSeconds: number = 3600,
  fetcher: () => Promise<T>
): Promise<T> {
  const now = Date.now();
  const existing = memoryCache.get(key);

  if (existing && existing.expiresAt > now) {
    return existing.data as T;
  }

  const freshData = await fetcher();
  memoryCache.set(key, {
    data: freshData,
    expiresAt: now + ttlSeconds * 1000,
  });

  return freshData;
}

/**
 * Invalidate cached catalog entries.
 * Call this when products or collections are created/updated/deleted.
 */
export function invalidateCatalogCache(prefix: string = 'catalog:'): void {
  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key);
    }
  }
}
