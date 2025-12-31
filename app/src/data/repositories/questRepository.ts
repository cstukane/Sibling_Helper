import { db } from '../db';
import { executeDbOperation, safeDbOperation } from '../dbOperations';
import { queueBackup } from '../dbMaintenance';
import { formatDatabaseError } from '../../utils/errorMessages';
import { buildCacheKey, queryCache } from '../queryCache';
import { applyPagination, type PaginationOptions } from '../queryUtils';
import type { IndexableType } from 'dexie';
import type { Quest } from '@state/questTypes';

type NewQuestInput = Omit<Quest, 'id' | 'createdAt' | 'updatedAt' | 'active'> & {
  id?: string;
  active?: boolean;
};

export const questRepository = {
  async getAll(pagination?: PaginationOptions<Quest>): Promise<Quest[]> {
    const cacheKey = buildCacheKey('quests', 'all', pagination);
    return queryCache.getOrSet(cacheKey, () =>
      safeDbOperation('loading quests', () => applyPagination(db.quests, pagination).toArray(), [])
    );
  },

  async getById(id: string): Promise<Quest | undefined> {
    const cacheKey = buildCacheKey('quests', 'byId', id);
    return queryCache.getOrSet(cacheKey, () =>
      safeDbOperation(`loading quest ${id}`, () => db.quests.get(id), undefined)
    );
  },

  async getByCategory(category: Quest['category']): Promise<Quest[]> {
    const cacheKey = buildCacheKey('quests', 'byCategory', category);
    return queryCache.getOrSet(cacheKey, () =>
      safeDbOperation(
        `loading quests by category ${category}`,
        () => db.quests.where('category').equals(category ?? '').toArray(),
        []
      )
    );
  },

  async getActive(): Promise<Quest[]> {
    const cacheKey = buildCacheKey('quests', 'active');
    return queryCache.getOrSet(cacheKey, () =>
      safeDbOperation(
        'loading active quests',
        () => db.quests.where('active').equals(true as unknown as IndexableType).toArray(),
        []
      )
    );
  },

  async getRecurringChores(): Promise<Quest[]> {
    const cacheKey = buildCacheKey('quests', 'recurringChores');
    return queryCache.getOrSet(cacheKey, () =>
      safeDbOperation(
        'loading recurring chores',
        () =>
          db.quests
            .where('category')
            .equals('chores')
            .filter(quest => quest.active === true && quest.recurrence !== null && quest.recurrence !== undefined)
            .toArray(),
        []
      )
    );
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
      queryCache.invalidate('quests:');
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
      queryCache.invalidate('quests:');
    } catch (error) {
      console.error(formatDatabaseError(`updating quest ${id}`, error), error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await executeDbOperation('deleting quest', () => db.quests.delete(id));
      queueBackup();
      queryCache.invalidate('quests:');
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
