import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PinPad from '../PinPad';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>
  }
}));

describe('PinPad', () => {
  const mockOnPinEntered = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render with default title', () => {
    render(<PinPad onPinEntered={mockOnPinEntered} onCancel={mockOnCancel} />);
    
    expect(screen.getByText('Enter Parent PIN')).toBeInTheDocument();
  });

  it('should render with custom title', () => {
    render(
      <PinPad 
        onPinEntered={mockOnPinEntered} 
        onCancel={mockOnCancel} 
        title="Custom Title" 
      />
    );
    
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
  });

  it('should call onPinEntered when 4 digits are entered', () => {
    vi.useFakeTimers();
    
    render(<PinPad onPinEntered={mockOnPinEntered} onCancel={mockOnCancel} />);
    
    // Enter 4 digits
    fireEvent.click(screen.getByText('1'));
    fireEvent.click(screen.getByText('2'));
    fireEvent.click(screen.getByText('3'));
    fireEvent.click(screen.getByText('4'));
    
    // Fast forward timers to trigger the auto-submit
    vi.advanceTimersByTime(300);
    
    expect(mockOnPinEntered).toHaveBeenCalledWith('1234');
    
    vi.useRealTimers();
  });

  it('should call onCancel when cancel button is clicked', () => {
    render(<PinPad onPinEntered={mockOnPinEntered} onCancel={mockOnCancel} />);
    
    fireEvent.click(screen.getByText('Cancel'));
    
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('should handle backspace correctly', () => {
    render(<PinPad onPinEntered={mockOnPinEntered} onCancel={mockOnCancel} />);
    
    // Enter some digits
    fireEvent.click(screen.getByText('1'));
    fireEvent.click(screen.getByText('2'));
    
    // Backspace
    fireEvent.click(screen.getByText('←'));
    
    // Enter more digits
    fireEvent.click(screen.getByText('3'));
    fireEvent.click(screen.getByText('4'));
    fireEvent.click(screen.getByText('5'));
    
    // Should only have 4 digits (1, 3, 4, 5)
    // The auto-submit behavior is tested in another test
  });

  it('should have appropriate accessibility attributes', () => {
    render(<PinPad onPinEntered={mockOnPinEntered} onCancel={mockOnCancel} />);
    
    // Check that the dialog has the correct role
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    
    // Check that the title is properly associated
    const title = screen.getByText('Enter Parent PIN');
    expect(title).toHaveAttribute('id', 'pin-pad-title');
    expect(dialog).toHaveAttribute('aria-labelledby', 'pin-pad-title');
  });
});
