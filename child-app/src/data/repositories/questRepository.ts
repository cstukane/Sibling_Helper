import { db } from '../db';
import type { Quest } from '@state/questTypes';

type NewQuestInput = Omit<Quest, 'id' | 'createdAt' | 'updatedAt' | 'active'> & {
  id?: string;
  active?: boolean;
};

export const questRepository = {
  async getAll(): Promise<Quest[]> {
    try {
      return await db.quests.toArray();
    } catch (error) {
      console.error('Error getting all quests:', error);
      return [];
    }
  },

  async getById(id: string): Promise<Quest | undefined> {
    try {
      return await db.quests.get(id);
    } catch (error) {
      console.error(`Error getting quest by id ${id}:`, error);
      return undefined;
    }
  },

  async getByCategory(category: Quest['category']): Promise<Quest[]> {
    try {
      // Use a more reliable query method
      const allQuests = await this.getAll();
      return allQuests.filter(quest => quest.category === category);
    } catch (error) {
      console.error(`Error getting quests by category ${category}:`, error);
      return [];
    }
  },

  async getActive(): Promise<Quest[]> {
    try {
      // Use a more reliable query method
      const allQuests = await this.getAll();
      return allQuests.filter(quest => quest.active === true);
    } catch (error) {
      console.error('Error getting active quests:', error);
      return [];
    }
  },

  async getRecurringChores(): Promise<Quest[]> {
    try {
      // Get all active chores that have a recurrence pattern
      const allQuests = await this.getAll();
      return allQuests.filter(quest => 
        quest.active === true && 
        quest.recurrence !== null &&
        quest.recurrence !== undefined
      );
    } catch (error) {
      console.error('Error getting recurring chores:', error);
      return [];
    }
  },

  async create(quest: NewQuestInput): Promise<string> {
    try {
      const id = quest.id || `quest-${Date.now()}`;
      const now = new Date().toISOString();
      
      const questToSave: Quest = {
        id,
        title: quest.title,
        description: quest.description || null,
        category: quest.category,
        points: quest.points,
        active: quest.active !== undefined ? quest.active : true,
        recurrence: quest.recurrence || null,
        createdAt: now,
        updatedAt: now
      };

      await db.quests.add(questToSave);
      return id;
    } catch (error) {
      console.error('Error creating quest:', error);
      throw error;
    }
  },

  async update(id: string, updates: Partial<Quest>): Promise<void> {
    try {
      const now = new Date().toISOString();
      await db.quests.update(id, { ...updates, updatedAt: now });
    } catch (error) {
      console.error(`Error updating quest ${id}:`, error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await db.quests.delete(id);
    } catch (error) {
      console.error(`Error deleting quest ${id}:`, error);
      throw error;
    }
  },

  async initializeStockQuests(): Promise<void> {
    try {
      // Check if we already have quests in the database
      const existingQuests = await this.getAll();
      if (existingQuests.length > 0) {
        return;
      }

      const stockQuests = [
        { id: 'quest-1', title: 'Bring a diaper', category: 'helping' as const, points: 1 },
        { id: 'quest-2', title: 'Quiet time (10m)', category: 'quiet' as const, points: 2 },
        { id: 'quest-3', title: 'Kind words', category: 'kindness' as const, points: 1 },
        { id: 'quest-4', title: 'Help with dishes', category: 'helping' as const, points: 2 },
        { id: 'quest-5', title: 'Share toys', category: 'kindness' as const, points: 1 }
      ];

      // Check if each quest already exists before creating it
      for (const quest of stockQuests) {
        const existingQuest = await this.getById(quest.id);
        if (!existingQuest) {
          await this.create(quest);
        }
      }
    } catch (error) {
      console.error('Error initializing stock quests:', error);
    }
  }
};
