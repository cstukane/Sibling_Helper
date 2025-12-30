import { vi } from 'vitest';
import type { DailyBoardItem } from '../state/boardTypes';
import type { Hero } from '../state/heroTypes';
import type { Quest } from '../state/questTypes';
import type { Redemption } from '../state/redemptionTypes';
import type { Reward } from '../state/rewardTypes';

// Mock IndexedDB for tests
export const mockIndexedDB = () => {
  const mockDB: {
    heroes: Hero[];
    quests: Quest[];
    board: DailyBoardItem[];
    rewards: Reward[];
    redemptions: Redemption[];
  } = {
    heroes: [],
    quests: [],
    board: [],
    rewards: [],
    redemptions: []
  };

  // Mock Dexie methods
  const mockDexie = {
    version: vi.fn().mockReturnThis(),
    stores: vi.fn().mockReturnThis(),
    heroes: {
      toArray: vi.fn(() => Promise.resolve(mockDB.heroes)),
      get: vi.fn((id: string) => Promise.resolve(mockDB.heroes.find(h => h.id === id))),
      add: vi.fn((hero: Hero) => {
        mockDB.heroes.push(hero);
        return Promise.resolve();
      }),
      update: vi.fn((id: string, updates: Partial<Hero>) => {
        const index = mockDB.heroes.findIndex(h => h.id === id);
        if (index !== -1) {
          mockDB.heroes[index] = { ...mockDB.heroes[index], ...updates };
        }
        return Promise.resolve();
      }),
      delete: vi.fn(() => Promise.resolve())
    },
    quests: {
      toArray: vi.fn(() => Promise.resolve(mockDB.quests)),
      get: vi.fn((id: string) => Promise.resolve(mockDB.quests.find(q => q.id === id))),
      add: vi.fn((quest: Quest) => {
        mockDB.quests.push(quest);
        return Promise.resolve();
      }),
      update: vi.fn((id: string, updates: Partial<Quest>) => {
        const index = mockDB.quests.findIndex(q => q.id === id);
        if (index !== -1) {
          mockDB.quests[index] = { ...mockDB.quests[index], ...updates };
        }
        return Promise.resolve();
      }),
      delete: vi.fn(() => Promise.resolve()),
      where: vi.fn((field: string) => {
        return {
          equals: (value: any) => {
            // For active quests query
            if (field === 'active') {
              return {
                toArray: () => Promise.resolve(
                  mockDB.quests.filter(q => q.active === value)
                )
              };
            }
            // For category queries
            else if (field === 'category') {
              return {
                toArray: () => Promise.resolve(
                  mockDB.quests.filter(q => q.category === value)
                )
              };
            }
            // Default case
            else {
              return {
                toArray: () => Promise.resolve(
                  mockDB.quests.filter(q => (q as Record<string, any>)[field] === value)
                ),
                and: (fn: (quest: Quest) => boolean) => {
                  return {
                    toArray: () => Promise.resolve(
                      mockDB.quests.filter(q => (q as Record<string, any>)[field] === value && fn(q))
                    )
                  };
                }
              };
            }
          }
        };
      })
    },
    board: {
      toArray: vi.fn(() => Promise.resolve(mockDB.board)),
      get: vi.fn((id: string) => Promise.resolve(mockDB.board.find(b => b.id === id))),
      add: vi.fn((item: DailyBoardItem) => {
        mockDB.board.push(item);
        return Promise.resolve();
      }),
      update: vi.fn((id: string, updates: Partial<DailyBoardItem>) => {
        const index = mockDB.board.findIndex(b => b.id === id);
        if (index !== -1) {
          mockDB.board[index] = { ...mockDB.board[index], ...updates };
        }
        return Promise.resolve();
      }),
      delete: vi.fn(() => Promise.resolve()),
      where: vi.fn((field: string) => {
        return {
          equals: (value: any) => {
            // For date queries
            if (field === 'date') {
              return {
                toArray: () => Promise.resolve(
                  mockDB.board.filter(b => b.date === value)
                ),
                and: (fn: (item: DailyBoardItem) => boolean) => {
                  return {
                    toArray: () => Promise.resolve(
                      mockDB.board.filter(b => b.date === value && fn(b))
                    )
                  };
                }
              };
            }
            // For heroId queries
            else if (field === 'heroId') {
              return {
                toArray: () => Promise.resolve(
                  mockDB.board.filter(b => b.heroId === value)
                ),
                and: (fn: (item: DailyBoardItem) => boolean) => {
                  return {
                    toArray: () => Promise.resolve(
                      mockDB.board.filter(b => b.heroId === value && fn(b))
                    )
                  };
                }
              };
            }
            // Default case
            else {
              return {
                toArray: () => Promise.resolve(
                  mockDB.board.filter(b => (b as Record<string, any>)[field] === value)
                ),
                and: (fn: (item: DailyBoardItem) => boolean) => {
                  return {
                    toArray: () => Promise.resolve(
                      mockDB.board.filter(b => (b as Record<string, any>)[field] === value && fn(b))
                    )
                  };
                }
              };
            }
          }
        };
      })
    },
    rewards: {
      toArray: vi.fn(() => Promise.resolve(mockDB.rewards)),
      get: vi.fn((id: string) => Promise.resolve(mockDB.rewards.find(r => r.id === id))),
      add: vi.fn((reward: Reward) => {
        mockDB.rewards.push(reward);
        return Promise.resolve();
      }),
      update: vi.fn((id: string, updates: Partial<Reward>) => {
        const index = mockDB.rewards.findIndex(r => r.id === id);
        if (index !== -1) {
          mockDB.rewards[index] = { ...mockDB.rewards[index], ...updates };
        }
        return Promise.resolve();
      }),
      delete: vi.fn(() => Promise.resolve()),
      where: vi.fn((field: string) => {
        return {
          equals: (value: any) => {
            // For active rewards query
            if (field === 'active') {
              return {
                toArray: () => Promise.resolve(
                  mockDB.rewards.filter(r => r.active === value)
                )
              };
            }
            // Default case
            else {
              return {
                toArray: () => Promise.resolve(
                  mockDB.rewards.filter(r => (r as Record<string, any>)[field] === value)
                )
              };
            }
          }
        };
      })
    },
    redemptions: {
      toArray: vi.fn(() => Promise.resolve(mockDB.redemptions)),
      get: vi.fn((id: string) => Promise.resolve(mockDB.redemptions.find(r => r.id === id))),
      add: vi.fn((redemption: Redemption) => {
        mockDB.redemptions.push(redemption);
        return Promise.resolve();
      }),
      update: vi.fn(() => Promise.resolve()),
      delete: vi.fn(() => Promise.resolve()),
      where: vi.fn((field: string) => {
        return {
          equals: (value: any) => {
            return {
              toArray: () => Promise.resolve(
                mockDB.redemptions.filter(r => (r as Record<string, any>)[field] === value)
              )
            };
          }
        };
      })
    }
  };

  return { mockDB, mockDexie };
};

// Mock localStorage
export const mockLocalStorage = () => {
  const store: Record<string, string> = {};
  
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: vi.fn((key) => store[key] || null),
      setItem: vi.fn((key, value) => {
        store[key] = value.toString();
      }),
      removeItem: vi.fn((key) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        Object.keys(store).forEach(key => delete store[key]);
      })
    },
    writable: true
  });
};

// Mock sound effects
export const mockSoundEffects = () => {
  return {
    playQuestComplete: vi.fn(),
    playRewardRedeem: vi.fn()
  };
};

// Mock confetti
export const mockConfetti = () => {
  return vi.fn();
};
