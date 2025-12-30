import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';

// Mock the db module
vi.mock('../../db', () => {
  return {
    db: {
      version: vi.fn().mockReturnThis(),
      stores: vi.fn().mockReturnThis(),
      board: {
        toArray: vi.fn(() => Promise.resolve([])),
        get: vi.fn(() => Promise.resolve(undefined)),
        add: vi.fn(() => Promise.resolve()),
        update: vi.fn(() => Promise.resolve()),
        delete: vi.fn(() => Promise.resolve()),
        where: vi.fn(() => ({
          equals: vi.fn(() => ({
            toArray: vi.fn(() => Promise.resolve([])),
            and: vi.fn(() => ({
              toArray: vi.fn(() => Promise.resolve([]))
            }))
          }))
        }))
      }
    }
  };
});

// Mock heroRepository
vi.mock('../heroRepository', () => ({
  heroRepository: {
    addPoints: vi.fn().mockResolvedValue(undefined)
  }
}));

// Now import the boardRepository after mocking
import { boardRepository } from '../boardRepository';

describe('boardRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a board item', async () => {
    const boardItemData = {
      questId: 'q1',
      date: '2023-01-01',
      heroId: 'hero-1'
    };

    const db = (await import('../../db')) as unknown as {
      db: { board: { add: Mock } };
    };
    db.db.board.add.mockResolvedValueOnce(undefined);

    const id = await boardRepository.create(boardItemData);
    
    expect(id).toBeDefined();
    expect(id).toMatch(/^board-\d+$/);
    expect(db.db.board.add).toHaveBeenCalled();
  });

  it('should get a board item by id', async () => {
    const mockBoardItem = {
      id: 'b1',
      questId: 'q1',
      date: '2023-01-01',
      heroId: 'hero-1',
      completedAt: null
    };

    const db = (await import('../../db')) as unknown as {
      db: { board: { get: Mock } };
    };
    db.db.board.get.mockResolvedValueOnce(mockBoardItem);

    const boardItem = await boardRepository.getById('b1');
    
    expect(boardItem).toEqual(mockBoardItem);
    expect(db.db.board.get).toHaveBeenCalledWith('b1');
  });
});
