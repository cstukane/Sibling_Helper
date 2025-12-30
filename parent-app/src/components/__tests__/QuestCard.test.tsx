import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import QuestCard from '../QuestCard';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  }
}));

describe('QuestCard', () => {
  const defaultProps = {
    title: 'Bring a diaper',
    points: 1
  };

  it('should render quest title and points', () => {
    render(<QuestCard {...defaultProps} />);
    
    expect(screen.getByText('Bring a diaper')).toBeInTheDocument();
    expect(screen.getByText('+1 pts')).toBeInTheDocument();
  });

  it('should show completed state when completed prop is true', () => {
    render(<QuestCard {...defaultProps} completed={true} />);
    
    expect(screen.getByText('Completed!')).toBeInTheDocument();
  });

  it('should call onComplete when clicked and not already completed', () => {
    const onComplete = vi.fn();
    render(<QuestCard {...defaultProps} onComplete={onComplete} />);
    
    fireEvent.click(screen.getByRole('button'));
    
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('should not call onComplete when already completed', () => {
    const onComplete = vi.fn();
    render(<QuestCard {...defaultProps} completed={true} onComplete={onComplete} />);
    
    fireEvent.click(screen.getByRole('button'));
    
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('should have appropriate aria labels', () => {
    render(<QuestCard {...defaultProps} />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Complete quest Bring a diaper');
  });

  it('should have appropriate aria labels when completed', () => {
    render(<QuestCard {...defaultProps} completed={true} />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Completed quest Bring a diaper');
  });
});
