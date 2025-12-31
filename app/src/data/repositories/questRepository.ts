import { db } from '../db';
import { executeDbOperation, safeDbOperation } from '../dbOperations';
import { queueBackup } from '../dbMaintenance';
import { formatDatabaseError } from '../../utils/errorMessages';
import type { Quest } from '@state/questTypes';

type NewQuestInput = Omit<Quest, 'id' | 'createdAt' | 'updatedAt' | 'active'> & {
  id?: string;
  active?: boolean;
};

export const questRepository = {
  async getAll(): Promise<Quest[]> {
    return safeDbOperation('loading quests', () => db.quests.toArray(), []);
  },

  async getById(id: string): Promise<Quest | undefined> {
    return safeDbOperation(`loading quest ${id}`, () => db.quests.get(id), undefined);
  },

  async getByCategory(category: Quest['category']): Promise<Quest[]> {
    try {
      // Use a more reliable query method
      const allQuests = await this.getAll();
      return allQuests.filter(quest => quest.category === category);
    } catch (error) {
      console.error(formatDatabaseError(`loading quests by category ${category}`, error), error);
      return [];
    }
  },

  async getActive(): Promise<Quest[]> {
    try {
      // Use a more reliable query method
      const allQuests = await this.getAll();
      return allQuests.filter(quest => quest.active === true);
    } catch (error) {
      console.error(formatDatabaseError('loading active quests', error), error);
      return [];
    }
  },

  async getRecurringChores(): Promise<Quest[]> {
    try {
      // Get all active chores that have a recurrence pattern
      const allQuests = await this.getAll();
      return allQuests.filter(quest => 
        quest.category === 'chores' && 
        quest.active === true && 
        quest.recurrence !== null &&
        quest.recurrence !== undefined
      );
    } catch (error) {
      console.error(formatDatabaseError('loading recurring chores', error), error);
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

      await executeDbOperation('creating quest', () => db.quests.add(questToSave));
      queueBackup();
      return id;
    } catch (error) {
      console.error(formatDatabaseError('creating quest', error), error);
      throw error;
    }
  },

  async update(id: string, updates: Partial<Quest>): Promise<void> {
    try {
      const now = new Date().toISOString();
      await executeDbOperation('updating quest', () => db.quests.update(id, { ...updates, updatedAt: now }));
      queueBackup();
    } catch (error) {
      console.error(formatDatabaseError(`updating quest ${id}`, error), error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await executeDbOperation('deleting quest', () => db.quests.delete(id));
      queueBackup();
    } catch (error) {
      console.error(formatDatabaseError(`deleting quest ${id}`, error), error);
      throw error;
    }
  },

  async initializeStockQuests(): Promise<void> {
    try {
      const existingQuests = await this.getAll();
      if (existingQuests.length > 0) {
        return;
      }

      const stockQuests = [
        { title: 'Bring a diaper', category: 'helping' as const, points: 1 },
        { title: 'Quiet time (10m)', category: 'quiet' as const, points: 2 },
        { title: 'Kind words', category: 'kindness' as const, points: 1 },
        { title: 'Help with dishes', category: 'helping' as const, points: 2 },
        { title: 'Share toys', category: 'kindness' as const, points: 1 }
      ];

      for (const quest of stockQuests) {
        await this.create(quest);
      }
    } catch (error) {
      console.error(formatDatabaseError('initializing stock quests', error), error);
    }
  }
};
