import { useState, useEffect, useRef } from 'react';
import { questRepository } from '@data/repositories/questRepository';
import type { Quest } from './questTypes';
import { formatDatabaseError } from '../utils/errorMessages';
import { cacheKeys, cacheTtlMs, loadCachedState, saveCachedState } from './stateCache';
import { clampNumber, sanitizeOptionalText, sanitizeText } from './stateValidation';

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

type NewQuestInput = Omit<Quest, 'id' | 'createdAt' | 'updatedAt' | 'active'> & {
  active?: boolean;
};

export function useQuests(): QuestsHook {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const questsRef = useRef<Quest[]>([]);

  const loadQuests = async (options?: { silent?: boolean }) => {
    try {
      if (!options?.silent) {
        setLoading(true);
      }
      await questRepository.initializeStockQuests();
      const questsData = await questRepository.getAll();
      setQuests(questsData);
      setError(null);
    } catch (err) {
      setError(formatDatabaseError('loading quests', err));
      setQuests([]);
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  };

  const addQuest = async (quest: NewQuestInput) => {
    const sanitizedQuest: NewQuestInput = {
      ...quest,
      title: sanitizeText(quest.title, 80),
      description: sanitizeOptionalText(quest.description, 240),
      points: clampNumber(quest.points, 0, 10000),
      active: quest.active ?? true
    };

    if (!sanitizedQuest.title) {
      setError('Quest title is required.');
      return;
    }

    const now = new Date().toISOString();
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const optimisticQuest: Quest = {
      ...sanitizedQuest,
      id: tempId,
      createdAt: now,
      updatedAt: now,
      active: sanitizedQuest.active ?? true
    };
    const previous = questsRef.current;
    setQuests([...previous, optimisticQuest]);

    try {
      const id = await questRepository.create(sanitizedQuest);
      const newQuest = await questRepository.getById(id);
      if (newQuest) {
        setQuests(prev => prev.map(item => (item.id === tempId ? newQuest : item)));
        setError(null);
        return;
      }
      setQuests(prev => prev.filter(item => item.id !== tempId));
    } catch (err) {
      setQuests(previous);
      setError(formatDatabaseError('adding quest', err));
    }
  };

  const updateQuest = async (id: string, updates: Partial<Quest>) => {
    const sanitizedUpdates: Partial<Quest> = { ...updates };
    if (updates.title !== undefined) {
      const title = sanitizeText(updates.title, 80);
      if (!title) {
        setError('Quest title is required.');
        return;
      }
      sanitizedUpdates.title = title;
    }
    if (updates.description !== undefined) {
      sanitizedUpdates.description = sanitizeOptionalText(updates.description, 240);
    }
    if (updates.points !== undefined) {
      sanitizedUpdates.points = clampNumber(updates.points, 0, 10000);
    }

    const previous = questsRef.current;
    setQuests(prev => prev.map(quest => (quest.id === id ? { ...quest, ...sanitizedUpdates } : quest)));

    try {
      await questRepository.update(id, sanitizedUpdates);
      setError(null);
    } catch (err) {
      setQuests(previous);
      setError(formatDatabaseError('updating quest', err));
    }
  };

  const deleteQuest = async (id: string) => {
    const previous = questsRef.current;
    setQuests(prev => prev.filter(quest => quest.id !== id));
    try {
      await questRepository.delete(id);
      setError(null);
    } catch (err) {
      setQuests(previous);
      setError(formatDatabaseError('deleting quest', err));
    }
  };

  const refreshQuests = async () => {
    await loadQuests();
  };

  const getRecurringChores = async (): Promise<Quest[]> => {
    try {
      return await questRepository.getRecurringChores();
    } catch (err) {
      setError(formatDatabaseError('loading recurring chores', err));
      return [];
    }
  };

  useEffect(() => {
    questsRef.current = quests;
  }, [quests]);

  useEffect(() => {
    const cachedQuests = loadCachedState<Quest[]>(cacheKeys.quests, cacheTtlMs.quests);
    if (cachedQuests) {
      setQuests(cachedQuests);
      setLoading(false);
    }
    loadQuests({ silent: !!cachedQuests });
  }, []);

  useEffect(() => {
    saveCachedState(cacheKeys.quests, quests);
  }, [quests]);

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
