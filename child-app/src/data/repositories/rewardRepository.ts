import { db } from '../db';
import { executeDbOperation, safeDbOperation } from '../dbOperations';
import { queueBackup } from '../dbMaintenance';
import { formatDatabaseError } from '../../utils/errorMessages';
import { buildCacheKey, queryCache } from '../queryCache';
import { applyPagination, type PaginationOptions } from '../queryUtils';
import type { IndexableType } from 'dexie';
import type { Reward } from '@state/rewardTypes';

type NewRewardInput = Omit<Reward, 'id' | 'active'> & {
  id?: string;
  active?: boolean;
};

export const rewardRepository = {
  async getAll(pagination?: PaginationOptions<Reward>): Promise<Reward[]> {
    const cacheKey = buildCacheKey('rewards', 'all', pagination);
    return queryCache.getOrSet(cacheKey, () =>
      safeDbOperation('loading rewards', () => applyPagination(db.rewards, pagination).toArray(), [])
    );
  },

  async getById(id: string): Promise<Reward | undefined> {
    const cacheKey = buildCacheKey('rewards', 'byId', id);
    return queryCache.getOrSet(cacheKey, () =>
      safeDbOperation(`loading reward ${id}`, () => db.rewards.get(id), undefined)
    );
  },

  async getActive(): Promise<Reward[]> {
    const cacheKey = buildCacheKey('rewards', 'active');
    return queryCache.getOrSet(cacheKey, () =>
      safeDbOperation(
        'loading active rewards',
        () => db.rewards.where('active').equals(true as unknown as IndexableType).toArray(),
        []
      )
    );
  },

  async create(reward: NewRewardInput): Promise<string> {
    try {
      const id = reward.id || `reward-${Date.now()}`;
      
      const rewardToSave: Reward = {
        id,
        title: reward.title,
        cost: reward.cost,
        description: reward.description || null,
        active: reward.active !== undefined ? reward.active : true
      };

      await executeDbOperation('creating reward', () => db.rewards.add(rewardToSave));
      queueBackup();
      queryCache.invalidate('rewards:');
      return id;
    } catch (error) {
      console.error(formatDatabaseError('creating reward', error), error);
      throw error;
    }
  },

  async update(id: string, updates: Partial<Reward>): Promise<void> {
    try {
      await executeDbOperation('updating reward', () => db.rewards.update(id, updates));
      queueBackup();
      queryCache.invalidate('rewards:');
    } catch (error) {
      console.error(formatDatabaseError(`updating reward ${id}`, error), error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await executeDbOperation('deleting reward', () => db.rewards.delete(id));
      queueBackup();
      queryCache.invalidate('rewards:');
    } catch (error) {
      console.error(formatDatabaseError(`deleting reward ${id}`, error), error);
      throw error;
    }
  },

  async initializeDefaultRewards(): Promise<void> {
    try {
      // Check if we already have rewards in the database
      const existingRewards = await this.getAll();
      if (existingRewards.length > 0) {
        return;
      }

      const defaultRewards = [
        { id: 'reward-1', title: 'Pick a movie', cost: 5 },
        { id: 'reward-2', title: '15 minutes extra play time', cost: 3 },
        { id: 'reward-3', title: 'Special snack', cost: 2 }
      ];

      // Check if each reward already exists before creating it
      for (const reward of defaultRewards) {
        const existingReward = await this.getById(reward.id);
        if (!existingReward) {
          await this.create(reward);
        }
      }
    } catch (error) {
      console.error(formatDatabaseError('initializing default rewards', error), error);
    }
  }
};
