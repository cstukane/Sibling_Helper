import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the db module
vi.mock('../../db', () => {
  return {
    db: {
      version: vi.fn().mockReturnThis(),
      stores: vi.fn().mockReturnThis(),
      rewards: {
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

// Now import the rewardRepository after mocking
import { rewardRepository } from '../rewardRepository';

describe('rewardRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a reward', async () => {
    const rewardData = {
      title: 'Pick a movie',
      cost: 5
    };

    const db = await import('../../db');
    db.db.rewards.add.mockResolvedValueOnce(undefined);

    const id = await rewardRepository.create(rewardData);
    
    expect(id).toBeDefined();
    expect(id).toMatch(/^reward-\d+$/);
    expect(db.db.rewards.add).toHaveBeenCalled();
  });

  it('should get a reward by id', async () => {
    const mockReward = {
      id: 'r1',
      title: 'Pick a movie',
      cost: 5,
      active: true
    };

    const db = await import('../../db');
    db.db.rewards.get.mockResolvedValueOnce(mockReward);

    const reward = await rewardRepository.getById('r1');
    
    expect(reward).toEqual(mockReward);
    expect(db.db.rewards.get).toHaveBeenCalledWith('r1');
  });
});