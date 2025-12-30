import { boardRepository } from '../data/repositories/boardRepository';
import type { DailyBoardItem } from '../types/boardTypes';

export const boardService = {
  async getBoardItemsByDate(date: string): Promise<DailyBoardItem[]> {
    try {
      return await boardRepository.getByDate(date);
    } catch (error) {
      console.error(`Error getting board items by date ${date}:`, error);
      throw error;
    }
  },

  async getBoardItemsByHeroAndDate(heroId: string, date: string): Promise<DailyBoardItem[]> {
    try {
      return await boardRepository.getByHeroAndDate(heroId, date);
    } catch (error) {
      console.error(`Error getting board items for hero ${heroId} on date ${date}:`, error);
      throw error;
    }
  },

  async markQuestCompleted(boardItemId: string): Promise<void> {
    try {
      await boardRepository.markCompleted(boardItemId);
    } catch (error) {
      console.error(`Error marking board item ${boardItemId} as completed:`, error);
      throw error;
    }
  },

  async generateDailyBoard(heroId: string, date: string, questIds: string[]): Promise<void> {
    try {
      await boardRepository.generateDailyBoard(heroId, date, questIds);
    } catch (error) {
      console.error(`Error generating daily board for hero ${heroId} on date ${date}:`, error);
      throw error;
    }
  }
};