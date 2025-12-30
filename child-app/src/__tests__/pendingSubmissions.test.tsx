import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { render, screen } from '@testing-library/react';
import PendingSubmissions from '../pages/PendingSubmissions';
import { boardRepository } from '../data/repositories/boardRepository';
import { questRepository } from '../data/repositories/questRepository';

// Mock the CSS module
vi.mock('../assets/theme.css', () => ({}));

// Mock the analytics service
vi.mock('../services/analytics', () => ({
  default: {
    logPendingOpened: vi.fn()
  }
}));

vi.mock('../data/repositories/boardRepository', () => ({
  boardRepository: {
    getAll: vi.fn()
  }
}));

vi.mock('../data/repositories/questRepository', () => ({
  questRepository: {
    getById: vi.fn()
  }
}));

describe('PendingSubmissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setupMocks = () => {
    (boardRepository.getAll as unknown as Mock).mockResolvedValue([
      {
        id: 'b1',
        questId: 'q1',
        date: '2023-01-01T00:00:00.000Z',
        heroId: 'hero-1',
        completedAt: null
      },
      {
        id: 'b2',
        questId: 'q2',
        date: '2023-01-01T00:00:00.000Z',
        heroId: 'hero-1',
        completedAt: '2023-01-01T01:00:00.000Z'
      }
    ]);

    (questRepository.getById as unknown as Mock).mockImplementation(
      (id: string) => {
        const map: Record<string, { id: string; title: string; points: number }> = {
          q1: { id: 'q1', title: 'Clean your room', points: 3 },
          q2: { id: 'q2', title: 'Help with dinner', points: 2 }
        };
        return Promise.resolve(map[id]);
      }
    );
  };

  it('should render the title', async () => {
    setupMocks();
    render(<PendingSubmissions />);

    expect(await screen.findByText('Pending Submissions')).toBeInTheDocument();
  });

  it('should render submissions when data is available', async () => {
    setupMocks();
    render(<PendingSubmissions />);

    expect(await screen.findByText('Clean your room')).toBeInTheDocument();
    expect(await screen.findByText('Help with dinner')).toBeInTheDocument();
  });

  it('should render status chips for each submission', async () => {
    setupMocks();
    render(<PendingSubmissions />);

    expect(await screen.findByText('Pending')).toBeInTheDocument();
    expect(await screen.findByText('Approved')).toBeInTheDocument();
  });
});
