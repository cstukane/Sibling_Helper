import { useState, useEffect } from 'react';
import { boardRepository } from '@data/repositories/boardRepository';
import { questRepository } from '@data/repositories/questRepository';
import type { DailyBoardItem } from './boardTypes';
import type { Quest } from './questTypes';

type BoardHook = {
  boardItems: (DailyBoardItem & { quest?: Quest })[];
  loading: boolean;
  error: string | null;
  completeQuest: (boardItemId: string) => Promise<void>;
  refreshBoard: (heroId: string, date: string) => Promise<void>;
};

export function useBoard(heroId: string, date: string): BoardHook {
  const [boardItems, setBoardItems] = useState<(DailyBoardItem & { quest?: Quest })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBoard = async () => {
    try {
      setLoading(true);
      const items = await boardRepository.getByHeroAndDate(heroId, date);
      
      // Fetch quest details for each board item
      const itemsWithQuests = await Promise.all(
        items.map(async (item) => {
          const quest = await questRepository.getById(item.questId);
          return { ...item, quest };
        })
      );
      
      setBoardItems(itemsWithQuests);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load board');
      setBoardItems([]);
    } finally {
      setLoading(false);
    }
  };

  const completeQuest = async (boardItemId: string) => {
    try {
      await boardRepository.markCompleted(boardItemId);
      await loadBoard();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete quest');
    }
  };

  const refreshBoard = async (heroId: string, date: string) => {
    try {
      // Generate a new board if none exists
      const existingItems = await boardRepository.getByHeroAndDate(heroId, date);
      if (existingItems.length === 0) {
        // Get 3 random active quests for the board
        const activeQuests = await questRepository.getActive();
        const selectedQuests = activeQuests
          .sort(() => 0.5 - Math.random())
          .slice(0, 3)
          .map(quest => quest.id);
        
        await boardRepository.generateDailyBoard(heroId, date, selectedQuests);
      }
      
      await loadBoard();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh board');
    }
  };

  useEffect(() => {
    if (heroId && date) {
      refreshBoard(heroId, date);
    }
  }, [heroId, date]);

  return {
    boardItems,
    loading,
    error,
    completeQuest,
    refreshBoard
  };
}