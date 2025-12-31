import { useState, useEffect, useRef } from 'react';
import { rewardRepository } from '@data/repositories/rewardRepository';
import type { Reward } from './rewardTypes';
import { formatDatabaseError } from '../utils/errorMessages';
import { cacheKeys, cacheTtlMs, loadCachedState, saveCachedState } from './stateCache';
import { clampNumber, sanitizeOptionalText, sanitizeText } from './stateValidation';

export type { Reward };

type RewardsHook = {
  rewards: Reward[];
  loading: boolean;
  error: string | null;
  addReward: (reward: NewRewardInput) => Promise<void>;
  updateReward: (id: string, updates: Partial<Reward>) => Promise<void>;
  deleteReward: (id: string) => Promise<void>;
  refreshRewards: () => Promise<void>;
};

type NewRewardInput = Omit<Reward, 'id' | 'active'> & {
  active?: boolean;
};

export function useRewards(): RewardsHook {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const rewardsRef = useRef<Reward[]>([]);

  const loadRewards = async (options?: { silent?: boolean }) => {
    try {
      if (!options?.silent) {
        setLoading(true);
      }
      await rewardRepository.initializeDefaultRewards();
      const rewardsData = await rewardRepository.getActive();
      setRewards(rewardsData);
      setError(null);
    } catch (err) {
      setError(formatDatabaseError('loading rewards', err));
      setRewards([]);
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  };

  const addReward = async (reward: NewRewardInput) => {
    const sanitizedReward: NewRewardInput = {
      ...reward,
      title: sanitizeText(reward.title, 80),
      description: sanitizeOptionalText(reward.description, 240),
      cost: clampNumber(reward.cost, 0, 10000),
      active: reward.active ?? true
    };

    if (!sanitizedReward.title) {
      setError('Reward title is required.');
      return;
    }

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const optimisticReward: Reward = {
      ...sanitizedReward,
      id: tempId,
      active: sanitizedReward.active ?? true
    };
    const previous = rewardsRef.current;
    setRewards([...previous, optimisticReward]);

    try {
      const id = await rewardRepository.create(sanitizedReward);
      const newReward = await rewardRepository.getById(id);
      if (newReward) {
        setRewards(prev => prev.map(item => (item.id === tempId ? newReward : item)));
        setError(null);
        return;
      }
      setRewards(prev => prev.filter(item => item.id !== tempId));
    } catch (err) {
      setRewards(previous);
      setError(formatDatabaseError('adding reward', err));
    }
  };

  const updateReward = async (id: string, updates: Partial<Reward>) => {
    const sanitizedUpdates: Partial<Reward> = { ...updates };
    if (updates.title !== undefined) {
      const title = sanitizeText(updates.title, 80);
      if (!title) {
        setError('Reward title is required.');
        return;
      }
      sanitizedUpdates.title = title;
    }
    if (updates.description !== undefined) {
      sanitizedUpdates.description = sanitizeOptionalText(updates.description, 240);
    }
    if (updates.cost !== undefined) {
      sanitizedUpdates.cost = clampNumber(updates.cost, 0, 10000);
    }

    const previous = rewardsRef.current;
    setRewards(prev => prev.map(reward => (reward.id === id ? { ...reward, ...sanitizedUpdates } : reward)));

    try {
      await rewardRepository.update(id, sanitizedUpdates);
      setError(null);
    } catch (err) {
      setRewards(previous);
      setError(formatDatabaseError('updating reward', err));
    }
  };

  const deleteReward = async (id: string) => {
    const previous = rewardsRef.current;
    setRewards(prev => prev.filter(reward => reward.id !== id));
    try {
      await rewardRepository.delete(id);
      setError(null);
    } catch (err) {
      setRewards(previous);
      setError(formatDatabaseError('deleting reward', err));
    }
  };

  const refreshRewards = async () => {
    await loadRewards();
  };

  useEffect(() => {
    rewardsRef.current = rewards;
  }, [rewards]);

  useEffect(() => {
    const cachedRewards = loadCachedState<Reward[]>(cacheKeys.rewards, cacheTtlMs.rewards);
    if (cachedRewards) {
      setRewards(cachedRewards);
      setLoading(false);
    }
    loadRewards({ silent: !!cachedRewards });
  }, []);

  useEffect(() => {
    saveCachedState(cacheKeys.rewards, rewards);
  }, [rewards]);

  return {
    rewards,
    loading,
    error,
    addReward,
    updateReward,
    deleteReward,
    refreshRewards
  };
}
