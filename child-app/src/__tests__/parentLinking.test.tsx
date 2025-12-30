import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ParentLinking from '../components/ParentLinking';

// Mock the CSS module
vi.mock('../assets/theme.css', () => ({}));

// Mock the analytics service
vi.mock('../services/analytics', () => ({
  default: {
    logLinkParentAttempt: vi.fn(),
    logLinkParentSuccess: vi.fn(),
    logLinkParentFailure: vi.fn()
  }
}));

describe('ParentLinking', () => {
  const mockOnLinkSuccess = vi.fn();
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the title and instructions', () => {
    render(<ParentLinking onLinkSuccess={mockOnLinkSuccess} onBack={mockOnBack} />);
    
    expect(screen.getByText('Link to Parent')).toBeInTheDocument();
    expect(screen.getByText('Enter the 6-digit code provided by your parent to link your account.')).toBeInTheDocument();
  });

  it('should validate 6-digit code input', () => {
    render(<ParentLinking onLinkSuccess={mockOnLinkSuccess} onBack={mockOnBack} />);
    
    const input = screen.getByLabelText('Enter 6-digit code');
    
    // Test valid input
    fireEvent.change(input, { target: { value: '123456' } });
    expect(input).toHaveValue('123456');
    
    // Test that non-digits are filtered
    fireEvent.change(input, { target: { value: '12a4b6' } });
    expect(input).toHaveValue('1246');
    
    // Test that input is limited to 6 characters
    fireEvent.change(input, { target: { value: '1234567' } });
    expect(input).toHaveValue('123456');
  });

  it('should show error for invalid code submission', () => {
    render(<ParentLinking onLinkSuccess={mockOnLinkSuccess} onBack={mockOnBack} />);
    
    const form = screen.getByRole('form');
    fireEvent.submit(form);
    
    expect(screen.getByText('Please enter a valid 6-digit code')).toBeInTheDocument();
  });

  it('should call onBack when back button is clicked', () => {
    render(<ParentLinking onLinkSuccess={mockOnLinkSuccess} onBack={mockOnBack} />);
    
    const backButton = screen.getByText('←');
    fireEvent.click(backButton);
    
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });
});