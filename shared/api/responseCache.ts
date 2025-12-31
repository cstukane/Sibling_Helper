type CachedValue<T> = {
  value: T;
  expiresAt: number;
};

const CACHE_PREFIX = 'api_cache_v1:';

export const getCachedValue = <T>(key: string): T | null => {
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedValue<T>;
    if (parsed.expiresAt <= Date.now()) {
      localStorage.removeItem(`${CACHE_PREFIX}${key}`);
      return null;
    }
    return parsed.value;
  } catch {
    return null;
  }
};

export const setCachedValue = <T>(key: string, value: T, ttlMs: number) => {
  const payload: CachedValue<T> = {
    value,
    expiresAt: Date.now() + ttlMs
  };
  localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(payload));
};
