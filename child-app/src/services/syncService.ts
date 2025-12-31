export type SyncConfig = {
  baseUrl?: string;
  enabled?: boolean;
};

export type SyncError = {
  message: string;
  action: string;
  retryable: boolean;
};

class SyncService {
  private syncQueue: Array<{ operation: string; data: any }> = [];
  private isOnline = navigator.onLine;
  private lastError: SyncError | null = null;
  private listeners = new Set<(error: SyncError | null) => void>();

  constructor() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  async syncNow(config: SyncConfig = {}): Promise<void> {
    if (!config.enabled || !config.baseUrl) {
      return;
    }

    if (!this.isOnline) {
      this.setError({ message: 'Sync deferred while offline.', action: 'sync', retryable: true });
      return;
    }

    try {
      // In a real implementation, this would sync data with the server
      console.log('Syncing with server...', config);
      this.setError(null);

      // Process any queued operations
      await this.processQueue();
    } catch (error) {
      this.setError({
        message: `Network error while syncing.${error instanceof Error && error.message ? ` ${error.message}` : ''}`,
        action: 'sync',
        retryable: true
      });
    }
  }

  // Queue an operation for sync when online
  queueOperation(operation: string, data: any): void {
    this.syncQueue.push({ operation, data });
    
    // If we're online, process immediately
    if (this.isOnline) {
      this.processQueue();
    }
  }

  // Process the sync queue
  private async processQueue(): Promise<void> {
    if (this.syncQueue.length === 0) {
      return;
    }

    if (!this.isOnline) {
      this.setError({ message: 'Sync queue paused while offline.', action: 'queue', retryable: true });
      return;
    }

    try {
      // In a real implementation, this would send the queued operations to the server
      console.log('Processing sync queue...', this.syncQueue);

      // Clear the queue after processing
      this.syncQueue = [];
      this.setError(null);
    } catch (error) {
      this.setError({
        message: `Network error while syncing queued changes.${error instanceof Error && error.message ? ` ${error.message}` : ''}`,
        action: 'queue',
        retryable: true
      });
    }
  }

  getLastError(): SyncError | null {
    return this.lastError;
  }

  subscribe(listener: (error: SyncError | null) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private setError(error: SyncError | null): void {
    this.lastError = error;
    this.listeners.forEach((listener) => listener(error));
  }
}

export const syncService = new SyncService();
