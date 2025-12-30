import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useHero } from '../state/hero';

// Mock the repository
vi.mock('../data/repositories/heroRepository', () => ({
  heroRepository: {
    initializeDefaultHero: vi.fn(),
    update: vi.fn()
  }
}));

describe('useHero', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default hero', async () => {
    const mockHero = {
      id: 'hero-1',
      name: 'Test Child',
      progressionPoints: 0,
      rewardPoints: 0,
      streakDays: 0,
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z',
      avatarUrl: null
    };
    const { heroRepository } = await import('../data/repositories/heroRepository');
    (heroRepository.initializeDefaultHero as unknown as Mock).mockResolvedValue(mockHero);

    const { result } = renderHook(() => useHero());
    
    await waitFor(() => {
      expect(result.current.hero).toEqual(mockHero);
      expect(result.current.loading).toBe(false);
    });
  });

  // Add more tests as needed
});
