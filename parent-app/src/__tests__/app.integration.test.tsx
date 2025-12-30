import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';
import { mockIndexedDB, mockLocalStorage } from './testUtils';

// Mock all child components to simplify testing
vi.mock('../pages/ParentMode', () => ({
  default: () => <div data-testid="parent-mode">Parent Mode</div>
}));

describe('App Integration', () => {
  mockIndexedDB();
  mockLocalStorage();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render parent mode by default', () => {
    render(<App />);
    
    expect(screen.getByTestId('parent-mode')).toBeInTheDocument();
  });
});
