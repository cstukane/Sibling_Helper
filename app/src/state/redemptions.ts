import { useState, useEffect, useRef } from 'react';
import { redemptionRepository } from '@data/repositories/redemptionRepository';
import type { Redemption } from './redemptionTypes';
import { formatDatabaseError } from '../utils/errorMessages';
import { cacheKeys, cacheTtlMs, loadCachedState, saveCachedState } from './stateCache';
import { clampNumber } from './stateValidation';

type RedemptionsHook = {
  redemptions: Redemption[];
  loading: boolean;
  error: string | null;
  redeemReward: (heroId: string, rewardId: string, pointsSpent: number) => Promise<void>;
  refreshRedemptions: () => Promise<void>;
};

export function useRedemptions(heroId: string): RedemptionsHook {
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const redemptionsRef = useRef<Redemption[]>([]);

  const loadRedemptions = async (options?: { silent?: boolean }) => {
    try {
      if (!options?.silent) {
        setLoading(true);
      }
      const redemptionsData = await redemptionRepository.getByHeroId(heroId);
      setRedemptions(redemptionsData);
      setError(null);
    } catch (err) {
      setError(formatDatabaseError('loading redemptions', err));
      setRedemptions([]);
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  };

  const redeemReward = async (heroId: string, rewardId: string, pointsSpent: number) => {
    if (!heroId || !rewardId) {
      setError('Reward redemption requires a hero and reward.');
      return;
    }

    const safePoints = clampNumber(pointsSpent, 0, 100000);
    const now = new Date().toISOString();
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const optimisticRedemption: Redemption = {
      id: tempId,
      heroId,
      rewardId,
      pointsSpent: safePoints,
      redeemedAt: now,
      notes: null
    };
    const previous = redemptionsRef.current;
    setRedemptions([...previous, optimisticRedemption]);

    try {
      const id = await redemptionRepository.create({ heroId, rewardId, pointsSpent: safePoints });
      const saved = await redemptionRepository.getById(id);
      if (saved) {
        setRedemptions(prev => prev.map(item => (item.id === tempId ? saved : item)));
      } else {
        setRedemptions(prev => prev.filter(item => item.id !== tempId));
      }
      setError(null);
    } catch (err) {
      setRedemptions(previous);
      setError(formatDatabaseError('redeeming a reward', err));
    }
  };

  const refreshRedemptions = async () => {
    await loadRedemptions();
  };

  useEffect(() => {
    redemptionsRef.current = redemptions;
  }, [redemptions]);

  useEffect(() => {
    if (heroId) {
      const cacheKey = cacheKeys.redemptions(heroId);
      const cached = loadCachedState<Redemption[]>(cacheKey, cacheTtlMs.redemptions);
      if (cached) {
        setRedemptions(cached);
        setLoading(false);
      }
      loadRedemptions({ silent: !!cached });
    }
  }, [heroId]);

  useEffect(() => {
    if (heroId) {
      saveCachedState(cacheKeys.redemptions(heroId), redemptions);
    }
  }, [heroId, redemptions]);

  return {
    redemptions,
    loading,
    error,
    redeemReward,
    refreshRedemptions
  };
}
