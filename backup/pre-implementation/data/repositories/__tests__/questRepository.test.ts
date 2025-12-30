import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the db module
vi.mock('../../db', () => {
  return {
    db: {
      version: vi.fn().mockReturnThis(),
      stores: vi.fn().mockReturnThis(),
      quests: {
        toArray: vi.fn(() => Promise.resolve([])),
        get: vi.fn(() => Promise.resolve(undefined)),
        add: vi.fn(() => Promise.resolve()),
        update: vi.fn(() => Promise.resolve()),
        delete: vi.fn(() => Promise.resolve()),
        where: vi.fn(() => ({
          equals: vi.fn(() => ({
            toArray: vi.fn(() => Promise.resolve([]))
          }))
        }))
      }
    }
  };
});

// Now import the questRepository after mocking
import { questRepository } from '../questRepository';

describe('questRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a quest', async () => {
    const questData = {
      title: 'Bring a diaper',
      category: 'helping' as const,
      points: 1
    };

    const db = await import('../../db');
    db.db.quests.add.mockResolvedValueOnce(undefined);

    const id = await questRepository.create(questData);
    
    expect(id).toBeDefined();
    expect(id).toMatch(/^quest-\d+$/);
    expect(db.db.quests.add).toHaveBeenCalled();
  });

  it('should get a quest by id', async () => {
    const mockQuest = {
      id: 'q1',
      title: 'Bring a diaper',
      category: 'helping',
      points: 1,
      active: true,
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z'
    };

    const db = await import('../../db');
    db.db.quests.get.mockResolvedValueOnce(mockQuest);

    const quest = await questRepository.getById('q1');
    
    expect(quest).toEqual(mockQuest);
    expect(db.db.quests.get).toHaveBeenCalledWith('q1');
  });
});