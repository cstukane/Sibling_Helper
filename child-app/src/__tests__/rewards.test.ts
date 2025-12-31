import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useRewards } from '../state/rewards';
import { rewardRepository } from '../data/repositories/rewardRepository';
import type { Mock } from 'vitest';

// Mock the repository
vi.mock('../data/repositories/rewardRepository', () => ({
  rewardRepository: {
    getActive: vi.fn(),
    initializeDefaultRewards: vi.fn(),
    create: vi.fn(),
    getById: vi.fn()
  }
}));

describe('useRewards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default rewards', async () => {
    const mockRewards = [
      {
        id: 'r1',
        title: 'Pick a movie',
        cost: 5,
        active: true
      },
      {
        id: 'r2',
        title: '15 minutes extra play time',
        cost: 3,
        active: true
      }
    ];

    (rewardRepository.getActive as Mock).mockResolvedValue(mockRewards);
    (rewardRepository.initializeDefaultRewards as Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useRewards());

    await waitFor(() => {
      expect(result.current.rewards).toEqual(mockRewards);
      expect(result.current.loading).toBe(false);
    });
  });

  it('should add a new reward', async () => {
    const mockRewards: any[] = [];
    const newReward = {
      title: 'Special snack',
      cost: 2
    };

    const addedReward = {
      id: 'r3',
      ...newReward,
      active: true,
      description: null
    };

    (rewardRepository.getActive as Mock).mockResolvedValue(mockRewards);
    (rewardRepository.initializeDefaultRewards as Mock).mockResolvedValue(undefined);
    (rewardRepository.create as Mock).mockResolvedValue('r3');
    (rewardRepository.getById as Mock).mockResolvedValue(addedReward);

    const { result } = renderHook(() => useRewards());

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.rewards).toEqual(mockRewards);
    });

    // Add new reward
    await result.current.addReward(newReward);

    expect(rewardRepository.create).toHaveBeenCalledWith(newReward);
  });

  it('should handle loading errors', async () => {
    (rewardRepository.getActive as Mock).mockRejectedValue(new Error('Failed to load'));
    (rewardRepository.initializeDefaultRewards as Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useRewards());

    await waitFor(() => {
      expect(result.current.error).toContain('Failed to load');
      expect(result.current.rewards).toEqual([]);
    });
  });
});

