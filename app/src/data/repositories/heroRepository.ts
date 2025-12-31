import { db } from '../db';
import { executeDbOperation, safeDbOperation } from '../dbOperations';
import { queueBackup } from '../dbMaintenance';
import { formatDatabaseError } from '../../utils/errorMessages';
import { buildCacheKey, queryCache } from '../queryCache';
import { applyPagination, type PaginationOptions } from '../queryUtils';
import type { Hero } from '@state/heroTypes';

type NewHeroInput = Omit<
  Hero,
  'id' | 'progressionPoints' | 'rewardPoints' | 'streakDays' | 'createdAt' | 'updatedAt' | 'avatarUrl'
> & {
  id?: string;
  progressionPoints?: number;
  rewardPoints?: number;
  streakDays?: number;
  createdAt?: string;
  updatedAt?: string;
  avatarUrl?: string | null;
};

export const heroRepository = {
  async getAll(pagination?: PaginationOptions<Hero>): Promise<Hero[]> {
    const cacheKey = buildCacheKey('heroes', 'all', pagination);
    return queryCache.getOrSet(cacheKey, () =>
      safeDbOperation('loading heroes', () => applyPagination(db.heroes, pagination).toArray(), [])
    );
  },

  async getById(id: string): Promise<Hero | undefined> {
    const cacheKey = buildCacheKey('heroes', 'byId', id);
    return queryCache.getOrSet(cacheKey, () =>
      safeDbOperation(`loading hero ${id}`, () => db.heroes.get(id), undefined)
    );
  },

  async create(hero: NewHeroInput): Promise<string> {
    try {
      const id = hero.id || `hero-${Date.now()}`;
      const now = new Date().toISOString();

      const heroToSave: Hero = {
        id,
        name: hero.name,
        progressionPoints: hero.progressionPoints || 0,
        rewardPoints: hero.rewardPoints || 0,
        streakDays: hero.streakDays || 0,
        createdAt: hero.createdAt || now,
        updatedAt: hero.updatedAt || now,
        avatarUrl: hero.avatarUrl || null
      };

      await executeDbOperation('creating hero', () => db.heroes.add(heroToSave));
      queueBackup();
      queryCache.invalidate('heroes:');
      return id;
    } catch (error) {
      console.error(formatDatabaseError('creating hero', error), error);
      throw error;
    }
  },

  async update(id: string, updates: Partial<Hero>): Promise<void> {
    try {
      const now = new Date().toISOString();
      await executeDbOperation('updating hero', () => db.heroes.update(id, { ...updates, updatedAt: now }));
      queueBackup();
      queryCache.invalidate('heroes:');
    } catch (error) {
      console.error(formatDatabaseError(`updating hero ${id}`, error), error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await executeDbOperation('deleting hero', () => db.heroes.delete(id));
      queueBackup();
      queryCache.invalidate('heroes:');
    } catch (error) {
      console.error(formatDatabaseError(`deleting hero ${id}`, error), error);
      throw error;
    }
  },

  async addProgressionPoints(heroId: string, points: number): Promise<void> {
    try {
      const hero = await this.getById(heroId);
      if (hero) {
        // Only progression points increase, never decrease
        const newProgressionPoints = Math.max(0, hero.progressionPoints + points);
        await this.update(heroId, { progressionPoints: newProgressionPoints });
      }
    } catch (error) {
      console.error(formatDatabaseError(`adding progression points to hero ${heroId}`, error), error);
      throw error;
    }
  },

  async addRewardPoints(heroId: string, points: number): Promise<void> {
    try {
      const hero = await this.getById(heroId);
      if (hero) {
        // Reward points can increase or decrease
        const newRewardPoints = Math.max(0, hero.rewardPoints + points);
        await this.update(heroId, { rewardPoints: newRewardPoints });
      }
    } catch (error) {
      console.error(formatDatabaseError(`adding reward points to hero ${heroId}`, error), error);
      throw error;
    }
  },

  async spendRewardPoints(heroId: string, points: number): Promise<void> {
    try {
      // Spending rewards only decreases reward points, not progression points
      await this.addRewardPoints(heroId, -points);
    } catch (error) {
      console.error(formatDatabaseError(`spending reward points for hero ${heroId}`, error), error);
      throw error;
    }
  },

  async earnPointsFromQuest(heroId: string, points: number): Promise<void> {
    try {
      // Earning points from quests contributes to BOTH progression AND reward points
      await this.addProgressionPoints(heroId, points);
      await this.addRewardPoints(heroId, points);
    } catch (error) {
      console.error(formatDatabaseError(`earning quest points for hero ${heroId}`, error), error);
      throw error;
    }
  },

  async initializeDefaultHero(): Promise<Hero> {
    try {
      const existingHeroes = await this.getAll();
      if (existingHeroes.length > 0) {
        return existingHeroes[0];
      }

      const defaultHero = {
        name: 'Big Sibling',
        progressionPoints: 0,
        rewardPoints: 0,
        streakDays: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        avatarUrl: null
      };

      const id = await this.create(defaultHero);
      const hero = await this.getById(id);
      return hero!;
    } catch (error) {
      console.error(formatDatabaseError('initializing default hero', error), error);
      throw error;
    }
  }
};
