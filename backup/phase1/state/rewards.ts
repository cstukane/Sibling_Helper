import { useState, useEffect } from 'react';
import { rewardRepository } from '@data/repositories/rewardRepository';
import type { Reward } from './rewardTypes';

type RewardsHook = {
  rewards: Reward[];
  loading: boolean;
  error: string | null;
  addReward: (reward: Omit<Reward, 'id'>) => Promise<void>;
  updateReward: (id: string, updates: Partial<Reward>) => Promise<void>;
  deleteReward: (id: string) => Promise<void>;
  refreshRewards: () => Promise<void>;
};

export function useRewards(): RewardsHook {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRewards = async () => {
    try {
      setLoading(true);
      await rewardRepository.initializeDefaultRewards();
      const rewardsData = await rewardRepository.getActive();
      setRewards(rewardsData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load rewards');
      setRewards([]);
    } finally {
      setLoading(false);
    }
  };

  const addReward = async (reward: Omit<Reward, 'id'>) => {
    try {
      const id = await rewardRepository.create(reward);
      const newReward = await rewardRepository.getById(id);
      if (newReward) {
        setRewards(prev => [...prev, newReward]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add reward');
    }
  };

  const updateReward = async (id: string, updates: Partial<Reward>) => {
    try {
      await rewardRepository.update(id, updates);
      setRewards(prev => prev.map(reward => (reward.id === id ? { ...reward, ...updates } : reward)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update reward');
    }
  };

  const deleteReward = async (id: string) => {
    try {
      await rewardRepository.delete(id);
      setRewards(prev => prev.filter(reward => reward.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete reward');
    }
  };

  const refreshRewards = async () => {
    await loadRewards();
  };

  useEffect(() => {
    loadRewards();
  }, []);

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