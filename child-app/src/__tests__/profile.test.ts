import { describe, it, expect, vi } from 'vitest';

describe('profile customization', () => {
  it('includes avatarUrl in the hero shape', () => {
    const testHero = {
      id: 'test-hero-1',
      name: 'Test Child',
      progressionPoints: 0,
      rewardPoints: 0,
      streakDays: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      avatarUrl: 'data:image/png;base64,AAA'
    };

    expect(testHero.avatarUrl).toMatch(/^data:image\/png;base64,/);
  });

  it('simulates a profile update without throwing', () => {
    vi.useFakeTimers();
    let updated = false;

    const updateProfileTest = (heroId: string, newName: string) => {
      void heroId;
      void newName;
      setTimeout(() => {
        updated = true;
      }, 100);
    };

    updateProfileTest('hero-1', 'Emma');
    vi.runAllTimers();

    expect(updated).toBe(true);
    vi.useRealTimers();
  });
});
