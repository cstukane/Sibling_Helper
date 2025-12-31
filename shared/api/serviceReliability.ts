type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const CACHE_PREFIX = 'api_client_cache_v1:';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const withRetry = async <T>(
  action: string,
  operation: () => Promise<T>,
  retries = 2,
  baseDelayMs = 100
): Promise<T> => {
  let attempt = 0;
  let lastError: unknown;

  while (attempt <= retries) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt >= retries) {
        throw error instanceof Error ? error : new Error(`${action} failed`);
      }
      await sleep(baseDelayMs * Math.pow(2, attempt));
      attempt += 1;
    }
  }

  throw lastError instanceof Error ? lastError : new Error(`${action} failed`);
};

export const getCached = <T>(key: string): T | null => {
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry<T>;
    if (parsed.expiresAt <= Date.now()) {
      localStorage.removeItem(`${CACHE_PREFIX}${key}`);
      return null;
    }
    return parsed.value;
  } catch {
    return null;
  }
};

export const setCached = <T>(key: string, value: T, ttlMs: number) => {
  const entry: CacheEntry<T> = { value, expiresAt: Date.now() + ttlMs };
  localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(entry));
};

export const cachedCall = async <T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> => {
  const cached = getCached<T>(key);
  if (cached !== null) return cached;
  const value = await loader();
  setCached(key, value, ttlMs);
  return value;
};
