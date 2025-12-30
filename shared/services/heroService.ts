import { heroRepository } from '../data/repositories/heroRepository';
import type { Hero } from '../types/heroTypes';

export const heroService = {
  async getAllHeroes(): Promise<Hero[]> {
    try {
      return await heroRepository.getAll();
    } catch (error) {
      console.error('Error getting all heroes:', error);
      throw error;
    }
  },

  async getHeroById(id: string): Promise<Hero | undefined> {
    try {
      return await heroRepository.getById(id);
    } catch (error) {
      console.error(`Error getting hero by id ${id}:`, error);
      throw error;
    }
  },

  async createHero(heroData: Omit<Hero, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      return await heroRepository.create(heroData);
    } catch (error) {
      console.error('Error creating hero:', error);
      throw error;
    }
  },

  async updateHero(id: string, updates: Partial<Hero>): Promise<void> {
    try {
      await heroRepository.update(id, updates);
    } catch (error) {
      console.error(`Error updating hero ${id}:`, error);
      throw error;
    }
  },

  async deleteHero(id: string): Promise<void> {
    try {
      await heroRepository.delete(id);
    } catch (error) {
      console.error(`Error deleting hero ${id}:`, error);
      throw error;
    }
  },

  async addProgressionPoints(heroId: string, points: number): Promise<void> {
    try {
      await heroRepository.addProgressionPoints(heroId, points);
    } catch (error) {
      console.error(`Error adding progression points to hero ${heroId}:`, error);
      throw error;
    }
  },

  async addRewardPoints(heroId: string, points: number): Promise<void> {
    try {
      await heroRepository.addRewardPoints(heroId, points);
    } catch (error) {
      console.error(`Error adding reward points to hero ${heroId}:`, error);
      throw error;
    }
  },

  async spendRewardPoints(heroId: string, points: number): Promise<void> {
    try {
      await heroRepository.spendRewardPoints(heroId, points);
    } catch (error) {
      console.error(`Error spending reward points for hero ${heroId}:`, error);
      throw error;
    }
  }
};