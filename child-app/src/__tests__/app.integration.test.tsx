import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';
import { mockIndexedDB, mockLocalStorage } from './testUtils';

// Mock all child components to simplify testing
vi.mock('../pages/RewardShop', () => ({
  default: () => <div data-testid="reward-shop">Reward Shop</div>
}));

vi.mock('../pages/Settings', () => ({
  default: () => <div data-testid="settings-page">Settings</div>
}));

vi.mock('../pages/PendingSubmissions', () => ({
  default: () => <div data-testid="pending-page">Pending</div>
}));

vi.mock('../pages/Home', () => ({
  default: ({ onNavigateToRewards, onNavigateToSettings, onNavigateToPending }: any) => (
    <div data-testid="home-page">
      <button data-testid="rewards-link" onClick={onNavigateToRewards}>Rewards</button>
      <button data-testid="settings-link" onClick={onNavigateToSettings}>Settings</button>
      <button data-testid="pending-link" onClick={onNavigateToPending}>Pending</button>
    </div>
  )
}));

describe('App Integration', () => {
  mockIndexedDB();
  mockLocalStorage();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the home page by default', () => {
    render(<App />);
    
    expect(screen.getByTestId('home-page')).toBeInTheDocument();
  });

  it('should navigate to reward shop when link is clicked', async () => {
    render(<App />);

    fireEvent.click(screen.getByTestId('rewards-link'));

    await waitFor(() => {
      expect(screen.getByTestId('reward-shop')).toBeInTheDocument();
    });
  });

  it('should navigate to settings when link is clicked', async () => {
    render(<App />);

    fireEvent.click(screen.getByTestId('settings-link'));

    await waitFor(() => {
      expect(screen.getByTestId('settings-page')).toBeInTheDocument();
    });
  });

  it('should navigate to pending submissions when link is clicked', async () => {
    render(<App />);

    fireEvent.click(screen.getByTestId('pending-link'));

    await waitFor(() => {
      expect(screen.getByTestId('pending-page')).toBeInTheDocument();
    });
  });
});
