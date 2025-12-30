import { db } from '../db';
import { heroRepository } from './heroRepository';
import type { DailyBoardItem } from '../../types/boardTypes';

type NewBoardItemInput = Omit<DailyBoardItem, 'id' | 'completedAt'> & {
  id?: string;
  completedAt?: string | null;
};

export const boardRepository = {
  async getAll(): Promise<DailyBoardItem[]> {
    try {
      return await db.board.toArray();
    } catch (error) {
      console.error('Error getting all board items:', error);
      return [];
    }
  },

  async getByDate(date: string): Promise<DailyBoardItem[]> {
    try {
      return await db.board.where('date').equals(date).toArray();
    } catch (error) {
      console.error(`Error getting board items by date ${date}:`, error);
      return [];
    }
  },

  async getByHeroAndDate(heroId: string, date: string): Promise<DailyBoardItem[]> {
    try {
      return await db.board
        .where('heroId')
        .equals(heroId)
        .and(item => item.date === date)
        .toArray();
    } catch (error) {
      console.error(`Error getting board items for hero ${heroId} on date ${date}:`, error);
      return [];
    }
  },

  async getById(id: string): Promise<DailyBoardItem | undefined> {
    try {
      return await db.board.get(id);
    } catch (error) {
      console.error(`Error getting board item by id ${id}:`, error);
      return undefined;
    }
  },

  async create(boardItem: NewBoardItemInput): Promise<string> {
    try {
      const id = boardItem.id || `board-${Date.now()}`;
      
      const boardItemToSave: DailyBoardItem = {
        id,
        questId: boardItem.questId,
        date: boardItem.date,
        heroId: boardItem.heroId,
        completedAt: boardItem.completedAt || null
      };

      await db.board.add(boardItemToSave);
      return id;
    } catch (error) {
      console.error('Error creating board item:', error);
      throw error;
    }
  },

  async update(id: string, updates: Partial<DailyBoardItem>): Promise<void> {
    try {
      await db.board.update(id, updates);
    } catch (error) {
      console.error(`Error updating board item ${id}:`, error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await db.board.delete(id);
    } catch (error) {
      console.error(`Error deleting board item ${id}:`, error);
      throw error;
    }
  },

  async markCompleted(id: string): Promise<void> {
    try {
      // First, get the board item to find the associated quest
      const boardItem = await this.getById(id);
      if (!boardItem) {
        throw new Error('Board item not found');
      }

      // Mark the board item as completed
      await this.update(id, { completedAt: new Date().toISOString() });

      // Get the quest to determine points
      const quest = await db.quests.get(boardItem.questId);
      if (quest) {
        // Earn points for BOTH progression AND rewards
        await heroRepository.earnPointsFromQuest(boardItem.heroId, quest.points);
      }
    } catch (error) {
      console.error(`Error marking board item ${id} as completed:`, error);
      throw error;
    }
  },

  async generateDailyBoard(heroId: string, date: string, questIds: string[]): Promise<void> {
    try {
      // Check if board items already exist for this date and hero
      const existingItems = await this.getByHeroAndDate(heroId, date);
      
      // If board already exists, don't regenerate
      if (existingItems.length > 0) {
        return;
      }

      // Create new board items
      for (const questId of questIds) {
        await this.create({
          questId,
          date,
          heroId
        });
      }
    } catch (error) {
      console.error(`Error generating daily board for hero ${heroId} on date ${date}:`, error);
      throw error;
    }
  }
};
