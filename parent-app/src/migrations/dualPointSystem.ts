// Migration script to update existing heroes to support dual-point system
// This script should be run once when upgrading to the new version

import { db } from '@data/db';

export async function migrateToDualPointSystem(): Promise<void> {
  try {
    console.log('Starting migration to dual-point system...');
    
    // Get all existing heroes
    const heroes = await db.heroes.toArray();
    
    // Update each hero to have both progressionPoints and rewardPoints
    for (const hero of heroes) {
      // If the hero doesn't have the new fields, initialize them
      if (hero.progressionPoints === undefined || hero.rewardPoints === undefined) {
        const legacyPoints = (hero as { points?: number }).points ?? 0;
        // Set both progression and reward points to the current points value
        // This preserves existing point balances while enabling the new system
        await db.heroes.update(hero.id, {
          progressionPoints: legacyPoints,
          rewardPoints: legacyPoints
        });
        
        console.log(`Updated hero ${hero.id} with dual-point system`);
      }
    }
    
    console.log('Migration to dual-point system completed successfully!');
  } catch (error) {
    console.error('Error migrating to dual-point system:', error);
    throw error;
  }
}

// Run the migration
migrateToDualPointSystem()
  .then(() => {
    console.log('Migration completed');
  })
  .catch((error) => {
    console.error('Migration failed:', error);
  });
