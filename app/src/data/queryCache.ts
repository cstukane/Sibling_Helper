const isTestEnv = typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'test';
const DEFAULT_TTL_MS = isTestEnv ? 0 : 30000;

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

class QueryCache {
  private cache = new Map<string, CacheEntry<unknown>>();

  constructor(private ttlMs: number = DEFAULT_TTL_MS) {}

  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= Date.now()) {
      this.cache.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs: number = this.ttlMs): void {
    if (ttlMs <= 0) return;
    this.cache.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  async getOrSet<T>(key: string, fetcher: () => Promise<T>, ttlMs: number = this.ttlMs): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== undefined) return cached;
    const value = await fetcher();
    this.set(key, value, ttlMs);
    return value;
  }

  invalidate(prefix?: string): void {
    if (!prefix) {
      this.cache.clear();
      return;
    }
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }
}

const queryCache = new QueryCache();

const buildCacheKey = (scope: string, action: string, params?: unknown): string => {
  if (params === undefined) return `${scope}:${action}`;
  return `${scope}:${action}:${JSON.stringify(params)}`;
};

export { buildCacheKey, queryCache };
