import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmSubmitModal from '../components/ConfirmSubmitModal';

// Mock the CSS module
vi.mock('../assets/theme.css', () => ({}));

describe('ConfirmSubmitModal', () => {
  const mockOnConfirm = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render with quest name and points', () => {
    render(
      <ConfirmSubmitModal 
        taskName="Clean your room"
        points={5}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );
    
    expect(screen.getByText('Submit task?')).toBeInTheDocument();
    expect(screen.getByText('Clean your room')).toBeInTheDocument();
    expect(screen.getByText('Earn 5 points')).toBeInTheDocument();
  });

  it('should render with quest name and no points', () => {
    render(
      <ConfirmSubmitModal 
        taskName="Clean your room"
        points={0}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );
    
    expect(screen.getByText('Submit task?')).toBeInTheDocument();
    expect(screen.getByText('Clean your room')).toBeInTheDocument();
    expect(screen.queryByText(/points/i)).not.toBeInTheDocument();
  });

  it('should call onConfirm when confirm button is clicked', () => {
    render(
      <ConfirmSubmitModal 
        taskName="Clean your room"
        points={5}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );
    
    fireEvent.click(screen.getByText('Submit'));
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it('should call onCancel when Cancel button is clicked', () => {
    render(
      <ConfirmSubmitModal
        taskName="Clean your room"
        points={10}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });
});
