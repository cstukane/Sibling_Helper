import { getEnv } from '../services/env';
import { enqueueRequest, flushQueue } from './offlineQueue';
import { getCachedValue, setCachedValue } from './responseCache';

export type ApiError = Error & {
  status?: number;
  retryable?: boolean;
  queued?: boolean;
};

type RequestOptions = {
  cacheTtlMs?: number;
  retries?: number;
  baseDelayMs?: number;
  queueIfOffline?: boolean;
};

const DEFAULT_RETRIES = 2;
const DEFAULT_DELAY_MS = 120;
let queueListenerStarted = false;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const buildUrl = (path: string) => {
  const { API_BASE_URL } = getEnv();
  const base = (API_BASE_URL || '').replace(/\/+$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
};

const createApiError = (message: string, status?: number, retryable?: boolean, queued?: boolean): ApiError => {
  const err = new Error(message) as ApiError;
  err.status = status;
  err.retryable = retryable;
  err.queued = queued;
  return err;
};

const shouldRetryStatus = (status?: number) => {
  if (!status) return false;
  return status >= 500 || status === 429;
};

export const apiRequest = async <T>(
  path: string,
  init: RequestInit = {},
  options: RequestOptions = {}
): Promise<T> => {
  const method = (init.method || 'GET').toUpperCase();
  const cacheKey = `${method}:${path}`;
  const cacheTtlMs = options.cacheTtlMs;

  if (method === 'GET' && cacheTtlMs) {
    const cached = getCachedValue<T>(cacheKey);
    if (cached !== null) {
      return cached;
    }
  }

  const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
  if (options.queueIfOffline && isOffline && method !== 'GET') {
    enqueueRequest({
      method,
      path,
      body: typeof init.body === 'string' ? init.body : JSON.stringify(init.body),
      headers: (init.headers as Record<string, string>) || undefined
    });
    throw createApiError('Offline: request queued', undefined, true, true);
  }

  const retries = options.retries ?? DEFAULT_RETRIES;
  const baseDelayMs = options.baseDelayMs ?? DEFAULT_DELAY_MS;
  let attempt = 0;
  let lastError: ApiError | null = null;

  while (attempt <= retries) {
    try {
      const res = await fetch(buildUrl(path), {
        headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
        ...init
      });

      if (!res.ok) {
        let message = `Request failed: ${res.status}`;
        try {
          const data = await res.json();
          if (data?.error) message = data.error;
        } catch {}

        const err = createApiError(message, res.status, shouldRetryStatus(res.status));
        if (err.retryable && attempt < retries) {
          lastError = err;
          await sleep(baseDelayMs * Math.pow(2, attempt));
          attempt += 1;
          continue;
        }
        throw err;
      }

      const json = (await res.json()) as T;
      if (method === 'GET' && cacheTtlMs) {
        setCachedValue(cacheKey, json, cacheTtlMs);
      }
      return json;
    } catch (error) {
      const err = error as ApiError;
      const retryable = err.retryable ?? true;
      if (!retryable || attempt >= retries) {
        if (options.queueIfOffline && typeof navigator !== 'undefined' && !navigator.onLine && method !== 'GET') {
          enqueueRequest({
            method,
            path,
            body: typeof init.body === 'string' ? init.body : JSON.stringify(init.body),
            headers: (init.headers as Record<string, string>) || undefined
          });
          throw createApiError('Offline: request queued', err.status, true, true);
        }
        throw err;
      }
      lastError = err;
      await sleep(baseDelayMs * Math.pow(2, attempt));
      attempt += 1;
    }
  }

  throw lastError || createApiError('Request failed');
};

export const startOfflineQueueProcessor = () => {
  if (queueListenerStarted) return;
  queueListenerStarted = true;
  if (typeof window === 'undefined') return;

  window.addEventListener('online', () => {
    flushQueue().catch(() => {});
  });
};
