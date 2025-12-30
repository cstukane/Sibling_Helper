import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';

// Mock the db module
vi.mock('../../db', () => {
  return {
    db: {
      version: vi.fn().mockReturnThis(),
      stores: vi.fn().mockReturnThis(),
      redemptions: {
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

// Mock heroRepository
vi.mock('../heroRepository', () => ({
  heroRepository: {
    spendRewardPoints: vi.fn().mockResolvedValue(undefined)
  }
}));

// Now import the redemptionRepository after mocking
import { redemptionRepository } from '../redemptionRepository';

describe('redemptionRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a redemption', async () => {
    const redemptionData = {
      heroId: 'hero-1',
      rewardId: 'r1',
      pointsSpent: 5
    };

    const db = (await import('../../db')) as unknown as {
      db: { redemptions: { add: Mock } };
    };
    db.db.redemptions.add.mockResolvedValueOnce(undefined);

    const id = await redemptionRepository.create(redemptionData);
    
    expect(id).toBeDefined();
    expect(id).toMatch(/^redemption-\d+$/);
    expect(db.db.redemptions.add).toHaveBeenCalled();
  });

  it('should get a redemption by id', async () => {
    const mockRedemption = {
      id: 'red1',
      heroId: 'hero-1',
      rewardId: 'r1',
      pointsSpent: 5,
      redeemedAt: '2023-01-01T00:00:00.000Z'
    };

    const db = (await import('../../db')) as unknown as {
      db: { redemptions: { get: Mock } };
    };
    db.db.redemptions.get.mockResolvedValueOnce(mockRedemption);

    const redemption = await redemptionRepository.getById('red1');
    
    expect(redemption).toEqual(mockRedemption);
    expect(db.db.redemptions.get).toHaveBeenCalledWith('red1');
  });
});
