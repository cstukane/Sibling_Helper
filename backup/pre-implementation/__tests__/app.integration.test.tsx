import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import App from '../App';
import { mockIndexedDB, mockLocalStorage } from './testUtils';

// Mock all child components to simplify testing
vi.mock('../pages/Home', () => ({
  default: () => <div data-testid="home-page">Home Page</div>
}));

vi.mock('../pages/ParentMode', () => ({
  default: () => <div data-testid="parent-mode">Parent Mode</div>
}));

vi.mock('../pages/RewardShop', () => ({
  default: () => <div data-testid="reward-shop">Reward Shop</div>
}));

vi.mock('../components/ParentModeToggle', () => ({
  default: ({ onParentModeChange }: any) => (
    <button 
      data-testid="parent-toggle" 
      onClick={() => onParentModeChange(true)}
    >
      Toggle Parent Mode
    </button>
  )
}));

describe('App Integration', () => {
  const { mockDexie } = mockIndexedDB();
  mockLocalStorage();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the home page by default', () => {
    render(<App />);
    
    expect(screen.getByTestId('home-page')).toBeInTheDocument();
  });

  it('should switch to parent mode when toggle is clicked', async () => {
    render(<App />);
    
    // Initially shows home page
    expect(screen.getByTestId('home-page')).toBeInTheDocument();
    
    // Click parent mode toggle
    fireEvent.click(screen.getByTestId('parent-toggle'));
    
    // Should now show parent mode
    await waitFor(() => {
      expect(screen.getByTestId('parent-mode')).toBeInTheDocument();
    });
  });

  it('should navigate to reward shop when link is clicked', async () => {
    render(<App />);
    
    // Initially shows home page
    expect(screen.getByTestId('home-page')).toBeInTheDocument();
    
    // TODO: Add navigation to reward shop when implemented
    // This would require updating the Home component to include navigation
  });
});