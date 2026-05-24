interface CacheEntry {
  data: unknown;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 30 * 60 * 1000;

export async function fetchApi<T>(
  url: string,
  options: RequestInit = {},
  cacheKey?: string
): Promise<T> {
  const key = cacheKey || url;

  if (cache.has(key)) {
    const entry = cache.get(key)!;
    if (Date.now() - entry.timestamp < CACHE_TTL) {
      return entry.data as T;
    }
    cache.delete(key);
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`API ${response.status}: ${response.statusText} for ${url}`);
  }

  const data = await response.json();
  cache.set(key, { data, timestamp: Date.now() });
  return data as T;
}

export function clearCache() {
  cache.clear();
}

export function getCacheSize() {
  return cache.size;
}
