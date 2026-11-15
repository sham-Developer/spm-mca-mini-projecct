/**
 * Lightweight Client-Side In-Memory Cache with TTL & Realtime Invalidation
 */

const clientCache = new Map();

export const getClientCache = (key) => {
  const item = clientCache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiry) {
    clientCache.delete(key);
    return null;
  }
  return item.data;
};

export const setClientCache = (key, data, ttlMs = 120000) => {
  clientCache.set(key, {
    data,
    expiry: Date.now() + ttlMs
  });
};

export const invalidateClientCache = (...prefixes) => {
  if (prefixes.length === 0) {
    clientCache.clear();
    return;
  }
  for (const key of clientCache.keys()) {
    for (const prefix of prefixes) {
      if (key.startsWith(prefix)) {
        clientCache.delete(key);
        break;
      }
    }
  }
};

/**
 * Cached fetch wrapper
 */
export const cachedFetch = async (url, options = {}, ttlMs = 120000) => {
  const isGet = !options.method || options.method.toUpperCase() === 'GET';
  if (isGet) {
    const cached = getClientCache(url);
    if (cached) {
      return { data: cached, fromCache: true };
    }
  }

  const res = await fetch(url, options);
  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }
  const data = await res.json();

  if (isGet) {
    setClientCache(url, data, ttlMs);
  }

  return { data, fromCache: false };
};

