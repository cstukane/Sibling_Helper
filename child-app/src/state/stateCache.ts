type CacheEntry<T> = {
  updatedAt: number;
  value: T;
};

const CACHE_PREFIX = 'sibling-helper:child';

export const cacheKeys = {
  hero: 'hero',
  quests: 'quests',
  rewards: 'rewards',
  redemptions: (heroId: string) => `redemptions:${heroId}`,
  board: (heroId: string, date: string) => `board:${heroId}:${date}`
};

export const cacheTtlMs = {
  hero: 5 * 60 * 1000,
  quests: 5 * 60 * 1000,
  rewards: 10 * 60 * 1000,
  redemptions: 2 * 60 * 1000,
  board: 2 * 60 * 1000
};

const buildKey = (key: string) => `${CACHE_PREFIX}:${key}`;

const canUseStorage = () => {
  try {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  } catch {
    return false;
  }
};

export const loadCachedState = <T,>(key: string, maxAgeMs: number): T | null => {
  if (!canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem(buildKey(key));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry<T>;
    if (!parsed || typeof parsed.updatedAt !== 'number') return null;
    if (Date.now() - parsed.updatedAt > maxAgeMs) return null;
    return parsed.value;
  } catch {
    return null;
  }
};

export const saveCachedState = <T,>(key: string, value: T): void => {
  if (!canUseStorage()) return;
  try {
    const payload: CacheEntry<T> = { updatedAt: Date.now(), value };
    window.localStorage.setItem(buildKey(key), JSON.stringify(payload));
  } catch {
    // Ignore write failures (storage full, disabled, etc.).
  }
};

export const clearCachedState = (key: string): void => {
  if (!canUseStorage()) return;
  try {
    window.localStorage.removeItem(buildKey(key));
  } catch {
    // Ignore remove failures.
  }
};
