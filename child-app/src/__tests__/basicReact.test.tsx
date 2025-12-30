import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('Basic React Test', () => {
  it('should render a simple component', () => {
    render(<div>Hello World</div>);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });
});
