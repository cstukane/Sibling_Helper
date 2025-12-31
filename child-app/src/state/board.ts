import { useState, useEffect, useRef } from 'react';
import { boardRepository } from '@data/repositories/boardRepository';
import { questRepository } from '@data/repositories/questRepository';
import type { DailyBoardItem } from './boardTypes';
import type { Quest } from './questTypes';
import { formatDatabaseError } from '../utils/errorMessages';
import { cacheKeys, cacheTtlMs, loadCachedState, saveCachedState } from './stateCache';

type BoardHook = {
  boardItems: (DailyBoardItem & { quest?: Quest })[];
  loading: boolean;
  error: string | null;
  completeQuest: (boardItemId: string) => Promise<void>;
  refreshBoard: (heroId: string, date: string, options?: { silent?: boolean }) => Promise<void>;
};

export function useBoard(heroId: string, date: string): BoardHook {
  const [boardItems, setBoardItems] = useState<(DailyBoardItem & { quest?: Quest })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const boardRef = useRef<(DailyBoardItem & { quest?: Quest })[]>([]);

  const loadBoard = async (options?: { silent?: boolean }) => {
    try {
      if (!options?.silent) {
        setLoading(true);
      }
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
      setError(formatDatabaseError('loading today\'s board', err));
      setBoardItems([]);
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  };

  const completeQuest = async (boardItemId: string) => {
    const previous = boardRef.current;
    const now = new Date().toISOString();
    setBoardItems(prev =>
      prev.map(item =>
        item.id === boardItemId && !item.completedAt
          ? { ...item, completedAt: now }
          : item
      )
    );

    try {
      await boardRepository.markCompleted(boardItemId);
      setError(null);
    } catch (err) {
      setBoardItems(previous);
      setError(formatDatabaseError('completing a quest', err));
    }
  };

  const refreshBoard = async (heroId: string, date: string, options?: { silent?: boolean }) => {
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
      
      await loadBoard(options);
    } catch (err) {
      setError(formatDatabaseError('refreshing the board', err));
    }
  };

  useEffect(() => {
    if (heroId && date) {
      const cacheKey = cacheKeys.board(heroId, date);
      const cached = loadCachedState<(DailyBoardItem & { quest?: Quest })[]>(cacheKey, cacheTtlMs.board);
      if (cached) {
        setBoardItems(cached);
        setLoading(false);
      }
      refreshBoard(heroId, date, { silent: !!cached });
    }
  }, [heroId, date]);

  useEffect(() => {
    boardRef.current = boardItems;
  }, [boardItems]);

  useEffect(() => {
    if (heroId && date) {
      saveCachedState(cacheKeys.board(heroId, date), boardItems);
    }
  }, [boardItems, heroId, date]);

  return {
    boardItems,
    loading,
    error,
    completeQuest,
    refreshBoard
  };
}
