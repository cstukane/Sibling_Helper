import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useBoard } from '../state/board';
import { boardRepository } from '../data/repositories/boardRepository';
import { questRepository } from '../data/repositories/questRepository';
import { mockIndexedDB } from './testUtils';
import type { Mock } from 'vitest';

// Mock the repositories
vi.mock('../data/repositories/boardRepository');
vi.mock('../data/repositories/questRepository');

describe('useBoard', () => {
  const { mockDexie } = mockIndexedDB();
  const heroId = 'hero-1';
  const date = '2023-01-01';

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset mock implementation
    (boardRepository as any).mockImplementation(() => mockDexie);
    (questRepository as any).mockImplementation(() => mockDexie);
  });

  it('should load board items with quest details', async () => {
    const mockBoardItems = [
      {
        id: 'b1',
        questId: 'q1',
        date,
        heroId,
        completedAt: null
      }
    ];

    const mockQuest = {
      id: 'q1',
      title: 'Bring a diaper',
      category: 'helping',
      points: 1,
      active: true,
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z'
    };

    (boardRepository.getByHeroAndDate as Mock).mockResolvedValue(mockBoardItems);
    (questRepository.getById as Mock).mockResolvedValue(mockQuest);

    const { result } = renderHook(() => useBoard(heroId, date));

    await waitFor(() => {
      expect(result.current.boardItems).toEqual([
        {
          ...mockBoardItems[0],
          quest: mockQuest
        }
      ]);
      expect(result.current.loading).toBe(false);
    });
  });

  it('should complete a quest', async () => {
    const mockBoardItems: any[] = [];
    
    (boardRepository.getByHeroAndDate as Mock).mockResolvedValue(mockBoardItems);
    (boardRepository.markCompleted as Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useBoard(heroId, date));

    await waitFor(() => {
      expect(result.current.boardItems).toEqual([]);
    });

    // Complete a quest
    await result.current.completeQuest('b1');

    expect(boardRepository.markCompleted).toHaveBeenCalledWith('b1');
  });

  it('should handle loading errors', async () => {
    (boardRepository.getByHeroAndDate as Mock).mockRejectedValue(new Error('Failed to load'));

    const { result } = renderHook(() => useBoard(heroId, date));

    await waitFor(() => {
      expect(result.current.error).toBe('Failed to load');
      expect(result.current.boardItems).toEqual([]);
    });
  });
});