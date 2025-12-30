import { useState, useEffect } from 'react';
import { redemptionRepository } from '@data/repositories/redemptionRepository';
import type { Redemption } from './redemptionTypes';

type RedemptionsHook = {
  redemptions: Redemption[];
  loading: boolean;
  error: string | null;
  redeemReward: (heroId: string, rewardId: string, pointsSpent: number) => Promise<void>;
  refreshRedemptions: (heroId: string) => Promise<void>;
};

export function useRedemptions(heroId: string): RedemptionsHook {
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRedemptions = async () => {
    try {
      setLoading(true);
      const redemptionsData = await redemptionRepository.getByHeroId(heroId);
      setRedemptions(redemptionsData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load redemptions');
      setRedemptions([]);
    } finally {
      setLoading(false);
    }
  };

  const redeemReward = async (heroId: string, rewardId: string, pointsSpent: number) => {
    try {
      await redemptionRepository.create({ heroId, rewardId, pointsSpent });
      await loadRedemptions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to redeem reward');
    }
  };

  const refreshRedemptions = async (heroId: string) => {
    await loadRedemptions();
  };

  useEffect(() => {
    if (heroId) {
      loadRedemptions();
    }
  }, [heroId]);

  return {
    redemptions,
    loading,
    error,
    redeemReward,
    refreshRedemptions
  };
}