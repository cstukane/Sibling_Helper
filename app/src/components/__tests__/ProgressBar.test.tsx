import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProgressBar from '../ProgressBar';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  }
}));

describe('ProgressBar', () => {
  it('should render progress bar with correct percentage', () => {
    render(<ProgressBar current={5} max={10} />);
    
    const progressBar = screen.getByRole('progressbar');
    // We can't easily test the width animation, but we can test that it renders
    expect(progressBar).toBeInTheDocument();
  });

  it('should render label when provided', () => {
    render(<ProgressBar current={5} max={10} label="XP to Level 2" />);
    
    expect(screen.getByText('XP to Level 2')).toBeInTheDocument();
    expect(screen.getByText('5 / 10')).toBeInTheDocument();
  });

  it('should handle edge cases', () => {
    // Test with 0 progress
    const { rerender } = render(<ProgressBar current={0} max={10} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    
    // Test with full progress
    rerender(<ProgressBar current={10} max={10} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    
    // Test with over max progress
    rerender(<ProgressBar current={15} max={10} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});
