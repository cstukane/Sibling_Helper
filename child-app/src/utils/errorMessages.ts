export function formatDatabaseError(action: string, error: unknown): string {
  if (error instanceof DOMException && error.name === 'QuotaExceededError') {
    return `Database storage is full while ${action}. Clear storage and try again.`;
  }

  const detail = error instanceof Error && error.message ? ` ${error.message}` : '';
  return `Database error while ${action}.${detail}`;
}

export function formatNetworkError(action: string, error: unknown): string {
  const detail = error instanceof Error && error.message ? ` ${error.message}` : '';
  return `Network error while ${action}.${detail}`;
}
