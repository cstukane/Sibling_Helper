import { db } from '../db';
import type { Hero } from '../../types/heroTypes';

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
  async getAll(): Promise<Hero[]> {
    try {
      return await db.heroes.toArray();
    } catch (error) {
      console.error('Error getting all heroes:', error);
      return [];
    }
  },

  async getById(id: string): Promise<Hero | undefined> {
    try {
      return await db.heroes.get(id);
    } catch (error) {
      console.error(`Error getting hero by id ${id}:`, error);
      return undefined;
    }
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

      await db.heroes.add(heroToSave);
      return id;
    } catch (error) {
      console.error('Error creating hero:', error);
      throw error;
    }
  },

  async update(id: string, updates: Partial<Hero>): Promise<void> {
    try {
      const now = new Date().toISOString();
      await db.heroes.update(id, { ...updates, updatedAt: now });
    } catch (error) {
      console.error(`Error updating hero ${id}:`, error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await db.heroes.delete(id);
    } catch (error) {
      console.error(`Error deleting hero ${id}:`, error);
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
      console.error(`Error adding ${points} progression points to hero ${heroId}:`, error);
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
      console.error(`Error adding ${points} reward points to hero ${heroId}:`, error);
      throw error;
    }
  },

  async spendRewardPoints(heroId: string, points: number): Promise<void> {
    try {
      // Spending rewards only decreases reward points, not progression points
      await this.addRewardPoints(heroId, -points);
    } catch (error) {
      console.error(`Error spending ${points} reward points for hero ${heroId}:`, error);
      throw error;
    }
  },

  async earnPointsFromQuest(heroId: string, points: number): Promise<void> {
    try {
      // Earning points from quests contributes to BOTH progression AND reward points
      await this.addProgressionPoints(heroId, points);
      await this.addRewardPoints(heroId, points);
    } catch (error) {
      console.error(`Error earning ${points} points from quest for hero ${heroId}:`, error);
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
      console.error('Error initializing default hero:', error);
      throw error;
    }
  }
};
