import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useRedemptions } from '../state/redemptions';
import { redemptionRepository } from '../data/repositories/redemptionRepository';
import type { Mock } from 'vitest';

// Mock the repository
vi.mock('../data/repositories/redemptionRepository', () => ({
  redemptionRepository: {
    getByHeroId: vi.fn(),
    create: vi.fn()
  }
}));

describe('useRedemptions', () => {
  const heroId = 'hero-1';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load redemptions for a hero', async () => {
    const mockRedemptions = [
      {
        id: 'red1',
        heroId,
        rewardId: 'r1',
        pointsSpent: 5,
        redeemedAt: '2023-01-01T00:00:00.000Z'
      }
    ];

    (redemptionRepository.getByHeroId as Mock).mockResolvedValue(mockRedemptions);

    const { result } = renderHook(() => useRedemptions(heroId));

    await waitFor(() => {
      expect(result.current.redemptions).toEqual(mockRedemptions);
      expect(result.current.loading).toBe(false);
    });
  });

  it('should redeem a reward', async () => {
    const mockRedemptions: any[] = [];
    const redemptionData = {
      heroId,
      rewardId: 'r1',
      pointsSpent: 5
    };

    (redemptionRepository.getByHeroId as Mock).mockResolvedValue(mockRedemptions);
    (redemptionRepository.create as Mock).mockResolvedValue('red1');

    const { result } = renderHook(() => useRedemptions(heroId));

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.redemptions).toEqual(mockRedemptions);
    });

    // Redeem a reward
    await result.current.redeemReward(heroId, 'r1', 5);

    expect(redemptionRepository.create).toHaveBeenCalledWith(redemptionData);
  });

  it('should handle loading errors', async () => {
    (redemptionRepository.getByHeroId as Mock).mockRejectedValue(new Error('Failed to load'));

    const { result } = renderHook(() => useRedemptions(heroId));

    await waitFor(() => {
      expect(result.current.error).toBe('Failed to load');
      expect(result.current.redemptions).toEqual([]);
    });
  });
});
