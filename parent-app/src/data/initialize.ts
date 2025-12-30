import { db } from './db';
import { heroRepository } from './repositories/heroRepository';
import { questRepository } from './repositories/questRepository';
import { rewardRepository } from './repositories/rewardRepository';

export async function initializeDatabase(): Promise<void> {
  try {
    // Open the database
    await db.open();
    
    // Initialize default hero if none exists
    await heroRepository.initializeDefaultHero();
    
    // Initialize stock quests if none exist
    await questRepository.initializeStockQuests();
    
    // Initialize default rewards if none exist
    await rewardRepository.initializeDefaultRewards();
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}