import { db } from './db';
import { heroRepository } from './repositories/heroRepository';
import { questRepository } from './repositories/questRepository';
import { rewardRepository } from './repositories/rewardRepository';
import { formatDatabaseError } from '../utils/errorMessages';
import { recoverDatabaseIfCorrupt, saveBackupToStorage } from './dbMaintenance';

export async function initializeDatabase(): Promise<void> {
  try {
    // Open the database
    await db.open();

    const healthy = await recoverDatabaseIfCorrupt();
    if (!healthy) {
      throw new Error('Database appears corrupted. Please clear storage or restore from backup.');
    }
    
    // Initialize default hero if none exists
    await heroRepository.initializeDefaultHero();
    
    // Initialize stock quests if none exist
    await questRepository.initializeStockQuests();
    
    // Initialize default rewards if none exist
    await rewardRepository.initializeDefaultRewards();

    await saveBackupToStorage();
    
    console.log('Database initialized successfully');
  } catch (error) {
    const message = formatDatabaseError('initializing local data', error);
    console.error(message, error);
    throw new Error(message);
  }
}
