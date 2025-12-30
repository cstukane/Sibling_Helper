import { db } from '../db';
import { heroRepository } from './heroRepository';
import type { Redemption } from '@state/redemptionTypes';

export const redemptionRepository = {
  async getAll(): Promise<Redemption[]> {
    try {
      return await db.redemptions.toArray();
    } catch (error) {
      console.error('Error getting all redemptions:', error);
      return [];
    }
  },

  async getById(id: string): Promise<Redemption | undefined> {
    try {
      return await db.redemptions.get(id);
    } catch (error) {
      console.error(`Error getting redemption by id ${id}:`, error);
      return undefined;
    }
  },

  async getByHeroId(heroId: string): Promise<Redemption[]> {
    try {
      return await db.redemptions.where('heroId').equals(heroId).toArray();
    } catch (error) {
      console.error(`Error getting redemptions for hero ${heroId}:`, error);
      return [];
    }
  },

  async create(redemption: Omit<Redemption, 'id' | 'redeemedAt'> & { id?: string }): Promise<string> {
    try {
      const id = redemption.id || `redemption-${Date.now()}`;
      const now = new Date().toISOString();
      
      const redemptionToSave: Redemption = {
        id,
        heroId: redemption.heroId,
        rewardId: redemption.rewardId,
        pointsSpent: redemption.pointsSpent,
        redeemedAt: now,
        notes: redemption.notes || null
      };

      // First, spend reward points from the hero (only decreases reward points, not progression points)
      await heroRepository.spendRewardPoints(redemption.heroId, redemption.pointsSpent);
      
      // Then create the redemption record
      await db.redemptions.add(redemptionToSave);
      return id;
    } catch (error) {
      console.error('Error creating redemption:', error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await db.redemptions.delete(id);
    } catch (error) {
      console.error(`Error deleting redemption ${id}:`, error);
      throw error;
    }
  }
};