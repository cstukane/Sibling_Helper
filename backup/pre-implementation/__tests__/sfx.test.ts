import { describe, it, expect, vi } from 'vitest';
import { sfx } from '../assets/sfx';

// Mock AudioContext
const mockAudioContext = {
  createOscillator: vi.fn(() => ({
    connect: vi.fn(),
    type: '',
    frequency: {
      setValueAtTime: vi.fn()
    },
    start: vi.fn(),
    stop: vi.fn()
  })),
  createGain: vi.fn(() => ({
    connect: vi.fn(),
    gain: {
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn()
    }
  })),
  destination: {}
};

describe('Sound Effects', () => {
  beforeEach(() => {
    // Mock AudioContext
    (window as any).AudioContext = vi.fn(() => mockAudioContext);
    (window as any).webkitAudioContext = vi.fn(() => mockAudioContext);
  });

  it('should have playQuestComplete method', () => {
    expect(typeof sfx.playQuestComplete).toBe('function');
  });

  it('should have playRewardRedeem method', () => {
    expect(typeof sfx.playRewardRedeem).toBe('function');
  });

  it('should not throw errors when playing sounds', () => {
    // These methods should not throw errors even in test environment
    expect(() => sfx.playQuestComplete()).not.toThrow();
    expect(() => sfx.playRewardRedeem()).not.toThrow();
  });
});