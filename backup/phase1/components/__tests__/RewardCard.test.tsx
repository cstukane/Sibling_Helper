import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import RewardCard from '../RewardCard';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  }
}));

describe('RewardCard', () => {
  const defaultProps = {
    title: 'Pick a movie',
    cost: 5,
    description: 'Choose any movie for family night',
    canAfford: true,
    onRedeem: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render reward title, cost, and description', () => {
    render(<RewardCard {...defaultProps} />);
    
    expect(screen.getByText('Pick a movie')).toBeInTheDocument();
    expect(screen.getByText('5 pts')).toBeInTheDocument();
    expect(screen.getByText('Choose any movie for family night')).toBeInTheDocument();
  });

  it('should call onRedeem when clicked and user can afford', () => {
    render(<RewardCard {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Redeem'));
    
    expect(defaultProps.onRedeem).toHaveBeenCalledTimes(1);
  });

  it('should not call onRedeem when user cannot afford', () => {
    render(<RewardCard {...defaultProps} canAfford={false} />);
    
    fireEvent.click(screen.getByText('Not enough points'));
    
    expect(defaultProps.onRedeem).not.toHaveBeenCalled();
  });

  it('should show different text when user cannot afford', () => {
    render(<RewardCard {...defaultProps} canAfford={false} />);
    
    expect(screen.getByText('Not enough points')).toBeInTheDocument();
    expect(screen.getByText('Not enough points')).toBeDisabled();
  });

  it('should have appropriate styling based on affordability', () => {
    const { rerender } = render(<RewardCard {...defaultProps} canAfford={true} />);
    
    const redeemButton = screen.getByText('Redeem');
    expect(redeemButton).not.toBeDisabled();
    
    rerender(<RewardCard {...defaultProps} canAfford={false} />);
    
    const noPointsButton = screen.getByText('Not enough points');
    expect(noPointsButton).toBeDisabled();
  });
});