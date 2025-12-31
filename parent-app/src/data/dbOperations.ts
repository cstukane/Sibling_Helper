import { formatDatabaseError } from '../utils/errorMessages';

type DbOperationOptions = {
  retries?: number;
  baseDelayMs?: number;
};

const DEFAULT_RETRIES = 2;
const DEFAULT_DELAY_MS = 60;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const isRetryableDbError = (error: unknown): boolean => {
  if (error instanceof DOMException) {
    const nonRetryable = new Set([
      'QuotaExceededError',
      'ConstraintError',
      'DataError',
      'NotFoundError',
      'InvalidStateError'
    ]);
    return !nonRetryable.has(error.name);
  }
  return true;
};

export async function executeDbOperation<T>(
  action: string,
  operation: () => Promise<T>,
  options: DbOperationOptions = {}
): Promise<T> {
  const retries = options.retries ?? DEFAULT_RETRIES;
  const baseDelayMs = options.baseDelayMs ?? DEFAULT_DELAY_MS;
  let attempt = 0;
  let lastError: unknown;

  while (attempt <= retries) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt >= retries || !isRetryableDbError(error)) {
        throw error;
      }
      await sleep(baseDelayMs * Math.pow(2, attempt));
      attempt += 1;
    }
  }

  throw lastError;
}

export async function safeDbOperation<T>(
  action: string,
  operation: () => Promise<T>,
  fallback: T,
  options: DbOperationOptions = {}
): Promise<T> {
  try {
    return await executeDbOperation(action, operation, options);
  } catch (error) {
    console.error(formatDatabaseError(action, error), error);
    return fallback;
  }
}
