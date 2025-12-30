import { describe, it, expect } from 'vitest';
import { themeTokens, getTokenValue } from '../components/themeTokens';

describe('Theme Tokens', () => {
  it('should have consistent token structure', () => {
    expect(themeTokens.light).toBeDefined();
    expect(themeTokens.dark).toBeDefined();
    
    // Check that both themes have the same keys
    const lightKeys = Object.keys(themeTokens.light);
    const darkKeys = Object.keys(themeTokens.dark);
    
    expect(lightKeys).toEqual(darkKeys);
  });

  it('should return correct token values', () => {
    // Test a few key tokens
    expect(getTokenValue('bg.surface', false)).toBe('#ffffff');
    expect(getTokenValue('bg.surface', true)).toBe('#0f172a');
    expect(getTokenValue('text.primary', false)).toBe('#0f172a');
    expect(getTokenValue('text.primary', true)).toBe('#f8fafc');
  });
});
