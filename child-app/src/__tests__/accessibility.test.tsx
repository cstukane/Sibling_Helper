import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import HamburgerMenu from '../components/Navigation/HamburgerMenu';

// Mock the CSS module
vi.mock('../assets/theme.css', () => ({}));

// Mock the analytics service
vi.mock('../services/analytics', () => ({
  default: {
    logNavigation: vi.fn()
  }
}));

// Mock the useTheme hook
vi.mock('../components/ThemeProvider', () => ({
  useTheme: () => ({ isDark: false })
}));

describe('HamburgerMenu Accessibility', () => {
  const mockMenuItems = [
    { id: 'home', label: 'Home', icon: '🏠', onClick: vi.fn() },
    { id: 'tasks', label: 'Quests', icon: '✅', onClick: vi.fn() },
    { id: 'pending', label: 'Pending Submissions', icon: '⏳', onClick: vi.fn() }
  ];

  it('should have proper aria attributes', () => {
    render(<HamburgerMenu menuItems={mockMenuItems} />);
    
    const menuButton = screen.getByLabelText('Open navigation menu');
    expect(menuButton).toHaveAttribute('aria-label', 'Open navigation menu');
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('should toggle aria-expanded when menu opens and closes', () => {
    render(<HamburgerMenu menuItems={mockMenuItems} />);
    
    const menuButton = screen.getByLabelText('Open navigation menu');
    
    // Open menu
    fireEvent.click(menuButton);
    expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    
    // Close menu
    fireEvent.click(menuButton);
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('should close menu when Escape key is pressed', () => {
    render(<HamburgerMenu menuItems={mockMenuItems} />);
    
    const menuButton = screen.getByLabelText('Open navigation menu');
    
    // Open menu
    fireEvent.click(menuButton);
    
    // Press Escape key
    fireEvent.keyDown(document, { key: 'Escape' });
    
    // Menu should be closed
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
  });
});
