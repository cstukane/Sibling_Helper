import { questRepository } from '../data/repositories/questRepository';
import type { Quest } from '../types/questTypes';

export const questService = {
  async getAllQuests(): Promise<Quest[]> {
    try {
      return await questRepository.getAll();
    } catch (error) {
      console.error('Error getting all quests:', error);
      throw error;
    }
  },

  async getActiveQuests(): Promise<Quest[]> {
    try {
      return await questRepository.getActive();
    } catch (error) {
      console.error('Error getting active quests:', error);
      throw error;
    }
  },

  async getRecurringChores(): Promise<Quest[]> {
    try {
      return await questRepository.getRecurringChores();
    } catch (error) {
      console.error('Error getting recurring chores:', error);
      throw error;
    }
  },

  async createQuest(questData: Omit<Quest, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      return await questRepository.create(questData);
    } catch (error) {
      console.error('Error creating quest:', error);
      throw error;
    }
  },

  async updateQuest(id: string, updates: Partial<Quest>): Promise<void> {
    try {
      await questRepository.update(id, updates);
    } catch (error) {
      console.error(`Error updating quest ${id}:`, error);
      throw error;
    }
  },

  async deleteQuest(id: string): Promise<void> {
    try {
      await questRepository.delete(id);
    } catch (error) {
      console.error(`Error deleting quest ${id}:`, error);
      throw error;
    }
  }
};