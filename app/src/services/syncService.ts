export type SyncConfig = {
  baseUrl?: string;
  enabled?: boolean;
};

class SyncService {
  private syncQueue: Array<{ operation: string; data: any }> = [];
  private isOnline = navigator.onLine;

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

    // In a real implementation, this would sync data with the server
    console.log('Syncing with server...', config);
    
    // Process any queued operations
    await this.processQueue();
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

    // In a real implementation, this would send the queued operations to the server
    console.log('Processing sync queue...', this.syncQueue);
    
    // Clear the queue after processing
    this.syncQueue = [];
  }
}

export const syncService = new SyncService();