import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';

// Mock the db module
vi.mock('../../db', () => {
  return {
    db: {
      version: vi.fn().mockReturnThis(),
      stores: vi.fn().mockReturnThis(),
      heroes: {
        toArray: vi.fn(() => Promise.resolve([])),
        get: vi.fn(() => Promise.resolve(undefined)),
        add: vi.fn(() => Promise.resolve()),
        update: vi.fn(() => Promise.resolve()),
        delete: vi.fn(() => Promise.resolve())
      }
    }
  };
});

// Now import the heroRepository after mocking
import { heroRepository } from '../heroRepository';

describe('heroRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a hero', async () => {
    const heroData = {
      name: 'Big Sibling',
      progressionPoints: 0,
      rewardPoints: 0,
      streakDays: 0,
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z',
      avatarUrl: null
    };

    const db = (await import('../../db')) as unknown as {
      db: { heroes: { add: Mock } };
    };
    db.db.heroes.add.mockResolvedValueOnce(undefined);

    const id = await heroRepository.create(heroData);
    
    expect(id).toBeDefined();
    expect(id).toMatch(/^hero-\d+$/);
    expect(db.db.heroes.add).toHaveBeenCalled();
  });

  it('should get a hero by id', async () => {
    const mockHero = {
      id: 'hero-1',
      name: 'Big Sibling',
      progressionPoints: 0,
      rewardPoints: 0,
      streakDays: 0,
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z',
      avatarUrl: null
    };

    const db = (await import('../../db')) as unknown as {
      db: { heroes: { get: Mock } };
    };
    db.db.heroes.get.mockResolvedValueOnce(mockHero);

    const hero = await heroRepository.getById('hero-1');
    
    expect(hero).toEqual(mockHero);
    expect(db.db.heroes.get).toHaveBeenCalledWith('hero-1');
  });
});
