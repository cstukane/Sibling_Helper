import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useQuests } from '../state/quests';
import { questRepository } from '../data/repositories/questRepository';
import type { Mock } from 'vitest';

// Mock the repository
vi.mock('../data/repositories/questRepository', () => ({
  questRepository: {
    getAll: vi.fn(),
    initializeStockQuests: vi.fn(),
    create: vi.fn(),
    getById: vi.fn()
  }
}));

describe('useQuests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should initialize with stock quests', async () => {
    const mockQuests = [
      {
        id: 'q1',
        title: 'Bring a diaper',
        category: 'helping',
        points: 1,
        active: true,
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      },
      {
        id: 'q2',
        title: 'Quiet time (10m)',
        category: 'quiet',
        points: 2,
        active: true,
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      }
    ];

    (questRepository.getAll as Mock).mockResolvedValue(mockQuests);
    (questRepository.initializeStockQuests as Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useQuests());

    await waitFor(() => {
      expect(result.current.quests).toEqual(mockQuests);
      expect(result.current.loading).toBe(false);
    });
  });

  it('should add a new quest', async () => {
    const mockQuests: any[] = [];
    const newQuest = {
      title: 'Help with dishes',
      category: 'helping' as const,
      points: 2
    };

    const addedQuest = {
      id: 'q3',
      ...newQuest,
      active: true,
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z'
    };

    (questRepository.getAll as Mock).mockResolvedValue(mockQuests);
    (questRepository.initializeStockQuests as Mock).mockResolvedValue(undefined);
    (questRepository.create as Mock).mockResolvedValue('q3');
    (questRepository.getById as Mock).mockResolvedValue(addedQuest);

    const { result } = renderHook(() => useQuests());

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.quests).toEqual(mockQuests);
    });

    // Add new quest
    await result.current.addQuest(newQuest);

    expect(questRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: newQuest.title,
        category: newQuest.category,
        points: newQuest.points,
        active: true,
        description: null
      })
    );
    // Note: In a real test, we would verify the state update as well
  });

  it('should handle loading errors', async () => {
    (questRepository.getAll as Mock).mockRejectedValue(new Error('Failed to load'));
    (questRepository.initializeStockQuests as Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useQuests());

    await waitFor(() => {
      expect(result.current.error).toContain('Failed to load');
      expect(result.current.quests).toEqual([]);
    });
  });
});

