import { db } from '../db';
import { heroRepository } from './heroRepository';
import { executeDbOperation, safeDbOperation } from '../dbOperations';
import { queueBackup } from '../dbMaintenance';
import { formatDatabaseError } from '../../utils/errorMessages';
import type { DailyBoardItem } from '@state/boardTypes';

type NewBoardItemInput = Omit<DailyBoardItem, 'id' | 'completedAt'> & {
  id?: string;
  completedAt?: string | null;
};

export const boardRepository = {
  async getAll(): Promise<DailyBoardItem[]> {
    return safeDbOperation('loading board items', () => db.board.toArray(), []);
  },

  async getByDate(date: string): Promise<DailyBoardItem[]> {
    return safeDbOperation(
      `loading board items for ${date}`,
      () => db.board.where('date').equals(date).toArray(),
      []
    );
  },

  async getByHeroAndDate(heroId: string, date: string): Promise<DailyBoardItem[]> {
    return safeDbOperation(
      `loading board items for hero ${heroId} on ${date}`,
      () =>
        db.board
          .where('heroId')
          .equals(heroId)
          .and(item => item.date === date)
          .toArray(),
      []
    );
  },

  async getById(id: string): Promise<DailyBoardItem | undefined> {
    return safeDbOperation(`loading board item ${id}`, () => db.board.get(id), undefined);
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

      await executeDbOperation('creating board item', () => db.board.add(boardItemToSave));
      queueBackup();
      return id;
    } catch (error) {
      console.error(formatDatabaseError('creating board item', error), error);
      throw error;
    }
  },

  async update(id: string, updates: Partial<DailyBoardItem>): Promise<void> {
    try {
      await executeDbOperation('updating board item', () => db.board.update(id, updates));
      queueBackup();
    } catch (error) {
      console.error(formatDatabaseError(`updating board item ${id}`, error), error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await executeDbOperation('deleting board item', () => db.board.delete(id));
      queueBackup();
    } catch (error) {
      console.error(formatDatabaseError(`deleting board item ${id}`, error), error);
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
      console.error(formatDatabaseError(`marking board item ${id} as completed`, error), error);
      throw error;
    }
  },

  async generateDailyBoard(heroId: string, date: string, questIds: string[]): Promise<void> {
    try {
      // Clear existing board items for this date and hero
      const existingItems = await this.getByHeroAndDate(heroId, date);
      for (const item of existingItems) {
        await this.delete(item.id);
      }

      // Create new board items
      for (const questId of questIds) {
        // Generate a unique ID for the board item
        const boardItemId = `board-${heroId}-${date}-${questId}`;
        
        // Check if the board item already exists before creating it
        const existingBoardItem = await this.getById(boardItemId);
        if (!existingBoardItem) {
          await this.create({
            id: boardItemId,
            questId,
            date,
            heroId
          });
        }
      }
    } catch (error) {
      console.error(formatDatabaseError(`generating daily board for hero ${heroId} on ${date}`, error), error);
      throw error;
    }
  }
};
