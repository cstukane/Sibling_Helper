import { getEnv } from '../services/env';

type QueueEntry = {
  id: string;
  method: string;
  path: string;
  body?: string;
  headers?: Record<string, string>;
  createdAt: string;
  attempts: number;
};

const QUEUE_KEY = 'api_offline_queue_v1';
const MAX_ATTEMPTS = 3;

const readQueue = (): QueueEntry[] => {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as QueueEntry[]) : [];
  } catch {
    return [];
  }
};

const writeQueue = (items: QueueEntry[]) => {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
};

const buildUrl = (path: string) => {
  const { API_BASE_URL } = getEnv();
  const base = (API_BASE_URL || '').replace(/\/+$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
};

export const enqueueRequest = (entry: Omit<QueueEntry, 'id' | 'createdAt' | 'attempts'>) => {
  const item: QueueEntry = {
    id: `queue_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    attempts: 0,
    ...entry
  };
  const queue = readQueue();
  writeQueue([item, ...queue]);
  return item.id;
};

export const flushQueue = async (): Promise<{ processed: number; failed: number }> => {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { processed: 0, failed: 0 };
  }

  const queue = readQueue();
  if (queue.length === 0) return { processed: 0, failed: 0 };

  const remaining: QueueEntry[] = [];
  let processed = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      const res = await fetch(buildUrl(item.path), {
        method: item.method,
        headers: { 'Content-Type': 'application/json', ...item.headers },
        body: item.body
      });

      if (!res.ok && (res.status >= 500 || res.status === 429)) {
        throw new Error(`Retryable status ${res.status}`);
      }

      if (!res.ok) {
        failed += 1;
        continue;
      }

      processed += 1;
    } catch {
      const attempts = item.attempts + 1;
      if (attempts < MAX_ATTEMPTS) {
        remaining.push({ ...item, attempts });
      } else {
        failed += 1;
      }
    }
  }

  writeQueue(remaining);
  return { processed, failed };
};
