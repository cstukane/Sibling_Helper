import { useState, useEffect } from 'react';
import { questRepository } from '@data/repositories/questRepository';
import type { Quest } from './questTypes';

type QuestsHook = {
  quests: Quest[];
  loading: boolean;
  error: string | null;
  addQuest: (quest: NewQuestInput) => Promise<void>;
  updateQuest: (id: string, updates: Partial<Quest>) => Promise<void>;
  deleteQuest: (id: string) => Promise<void>;
  refreshQuests: () => Promise<void>;
  getRecurringChores: () => Promise<Quest[]>;
};

type NewQuestInput = Omit<Quest, 'id' | 'created_at' | 'updated_at' | 'active'> & {
  active?: boolean;
};

export function useQuests(): QuestsHook {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadQuests = async () => {
    try {
      setLoading(true);
      await questRepository.initializeStockQuests();
      const questsData = await questRepository.getAll();
      setQuests(questsData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quests');
      setQuests([]);
    } finally {
      setLoading(false);
    }
  };

  const addQuest = async (quest: NewQuestInput) => {
    try {
      const id = await questRepository.create(quest);
      const newQuest = await questRepository.getById(id);
      if (newQuest) {
        setQuests(prev => [...prev, newQuest]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add quest');
    }
  };

  const updateQuest = async (id: string, updates: Partial<Quest>) => {
    try {
      await questRepository.update(id, updates);
      setQuests(prev => prev.map(quest => (quest.id === id ? { ...quest, ...updates } : quest)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update quest');
    }
  };

  const deleteQuest = async (id: string) => {
    try {
      await questRepository.delete(id);
      setQuests(prev => prev.filter(quest => quest.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete quest');
    }
  };

  const refreshQuests = async () => {
    await loadQuests();
  };

  const getRecurringChores = async (): Promise<Quest[]> => {
    try {
      return await questRepository.getRecurringChores();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get recurring chores');
      return [];
    }
  };

  useEffect(() => {
    loadQuests();
  }, []);

  return {
    quests,
    loading,
    error,
    addQuest,
    updateQuest,
    deleteQuest,
    refreshQuests,
    getRecurringChores
  };
}
