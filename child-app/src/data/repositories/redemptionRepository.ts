import { db } from '../db';
import { heroRepository } from './heroRepository';
import { executeDbOperation, safeDbOperation } from '../dbOperations';
import { queueBackup } from '../dbMaintenance';
import { formatDatabaseError } from '../../utils/errorMessages';
import type { Redemption } from '@state/redemptionTypes';

export const redemptionRepository = {
  async getAll(): Promise<Redemption[]> {
    return safeDbOperation('loading redemptions', () => db.redemptions.toArray(), []);
  },

  async getById(id: string): Promise<Redemption | undefined> {
    return safeDbOperation(`loading redemption ${id}`, () => db.redemptions.get(id), undefined);
  },

  async getByHeroId(heroId: string): Promise<Redemption[]> {
    return safeDbOperation(
      `loading redemptions for hero ${heroId}`,
      () => db.redemptions.where('heroId').equals(heroId).toArray(),
      []
    );
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
      await executeDbOperation('creating redemption', () => db.redemptions.add(redemptionToSave));
      queueBackup();
      return id;
    } catch (error) {
      console.error(formatDatabaseError('creating redemption', error), error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await executeDbOperation('deleting redemption', () => db.redemptions.delete(id));
      queueBackup();
    } catch (error) {
      console.error(formatDatabaseError(`deleting redemption ${id}`, error), error);
      throw error;
    }
  }
};
