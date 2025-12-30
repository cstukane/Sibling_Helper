import { db } from '../db';
import type { Reward } from '@state/rewardTypes';

type NewRewardInput = Omit<Reward, 'id' | 'active'> & {
  id?: string;
  active?: boolean;
};

export const rewardRepository = {
  async getAll(): Promise<Reward[]> {
    try {
      return await db.rewards.toArray();
    } catch (error) {
      console.error('Error getting all rewards:', error);
      return [];
    }
  },

  async getById(id: string): Promise<Reward | undefined> {
    try {
      return await db.rewards.get(id);
    } catch (error) {
      console.error(`Error getting reward by id ${id}:`, error);
      return undefined;
    }
  },

  async getActive(): Promise<Reward[]> {
    try {
      // Use a more reliable query method
      const allRewards = await this.getAll();
      return allRewards.filter(reward => reward.active === true);
    } catch (error) {
      console.error('Error getting active rewards:', error);
      return [];
    }
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

      await db.rewards.add(rewardToSave);
      return id;
    } catch (error) {
      console.error('Error creating reward:', error);
      throw error;
    }
  },

  async update(id: string, updates: Partial<Reward>): Promise<void> {
    try {
      await db.rewards.update(id, updates);
    } catch (error) {
      console.error(`Error updating reward ${id}:`, error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await db.rewards.delete(id);
    } catch (error) {
      console.error(`Error deleting reward ${id}:`, error);
      throw error;
    }
  },

  async initializeDefaultRewards(): Promise<void> {
    try {
      const existingRewards = await this.getAll();
      if (existingRewards.length > 0) {
        return;
      }

      const defaultRewards = [
        { title: 'Pick a movie', cost: 5 },
        { title: '15 minutes extra play time', cost: 3 },
        { title: 'Special snack', cost: 2 }
      ];

      for (const reward of defaultRewards) {
        await this.create(reward);
      }
    } catch (error) {
      console.error('Error initializing default rewards:', error);
    }
  }
};
