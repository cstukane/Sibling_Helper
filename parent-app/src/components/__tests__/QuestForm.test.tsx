import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import QuestForm from '../QuestForm';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  }
}));

describe('QuestForm Component', () => {
  const mockOnSave = vi.fn();
  const mockOnCancel = vi.fn();

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render form fields for creating a new task', () => {
    render(<QuestForm onSave={mockOnSave} onCancel={mockOnCancel} />);
    
    expect(screen.getByLabelText('Title')).toBeInTheDocument();
    expect(screen.getByLabelText('Description (Optional)')).toBeInTheDocument();
    expect(screen.getByLabelText('Category (Optional)')).toBeInTheDocument();
    expect(screen.getByLabelText('Points')).toBeInTheDocument();
    expect(screen.getByLabelText('Recurrence (Optional)')).toBeInTheDocument();
    expect(screen.getByLabelText('Active')).toBeInTheDocument();
  });

  it('should render form with existing quest data for editing', () => {
    const quest = {
      id: '1',
      title: 'Help with dishes',
      description: 'Clean and put away dishes',
      category: 'helping',
      points: 10,
      active: true,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z'
    };
    
    render(<QuestForm quest={quest} onSave={mockOnSave} onCancel={mockOnCancel} />);
    
    expect(screen.getByDisplayValue('Help with dishes')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Clean and put away dishes')).toBeInTheDocument();
    expect(screen.getByDisplayValue('10')).toBeInTheDocument();
  });

  it('should call onSave when form is submitted', () => {
    render(<QuestForm onSave={mockOnSave} onCancel={mockOnCancel} />);
    
    // Fill in form fields
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Test Task' }
    });
    
    fireEvent.change(screen.getByLabelText('Points'), {
      target: { value: '10' }
    });
    
    // Submit form
    fireEvent.click(screen.getByText('Save'));
    
    expect(mockOnSave).toHaveBeenCalledTimes(1);
    expect(mockOnSave).toHaveBeenCalledWith({
      title: 'Test Task',
      description: null,
      category: undefined,
      points: 10,
      active: true,
      recurrence: undefined
    });
  });

  it('should call onCancel when cancel button is clicked', () => {
    render(<QuestForm onSave={mockOnSave} onCancel={mockOnCancel} />);
    
    fireEvent.click(screen.getByText('Cancel'));
    
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('should handle recurrence selection', () => {
    render(<QuestForm onSave={mockOnSave} onCancel={mockOnCancel} />);
    
    // Select daily recurrence
    const recurrenceSelect = screen.getByLabelText('Recurrence (Optional)');
    fireEvent.change(recurrenceSelect, {
      target: { value: 'daily' }
    });
    
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Daily Task' }
    });
    
    fireEvent.change(screen.getByLabelText('Points'), {
      target: { value: '5' }
    });
    
    // Submit form
    fireEvent.click(screen.getByText('Save'));
    
    expect(mockOnSave).toHaveBeenCalledWith({
      title: 'Daily Task',
      description: null,
      category: undefined,
      points: 5,
      active: true,
      recurrence: { type: 'daily' }
    });
  });

  it('should handle "none" recurrence selection', () => {
    render(<QuestForm onSave={mockOnSave} onCancel={mockOnCancel} />);
    
    // Select "none" recurrence (should result in undefined)
    const recurrenceSelect = screen.getByLabelText('Recurrence (Optional)');
    fireEvent.change(recurrenceSelect, {
      target: { value: 'none' }
    });
    
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'One-time Task' }
    });
    
    fireEvent.change(screen.getByLabelText('Points'), {
      target: { value: '10' }
    });
    
    // Submit form
    fireEvent.click(screen.getByText('Save'));
    
    expect(mockOnSave).toHaveBeenCalledWith({
      title: 'One-time Task',
      description: null,
      category: undefined,
      points: 10,
      active: true,
      recurrence: undefined
    });
  });
});
