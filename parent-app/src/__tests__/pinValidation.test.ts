import { describe, it, expect } from 'vitest';

describe('PIN Validation', () => {
  it('should validate 6-digit PINs correctly', () => {
    // Valid 6-digit PINs
    expect(/^\d{6}$/.test('123456')).toBe(true);
    expect(/^\d{6}$/.test('000000')).toBe(true);
    expect(/^\d{6}$/.test('999999')).toBe(true);
    
    // Invalid PINs
    expect(/^\d{6}$/.test('12345')).toBe(false);   // Too short
    expect(/^\d{6}$/.test('1234567')).toBe(false); // Too long
    expect(/^\d{6}$/.test('12345a')).toBe(false);  // Contains letter
    expect(/^\d{6}$/.test('12345!')).toBe(false);  // Contains special character
    expect(/^\d{6}$/.test('')).toBe(false);       // Empty
  });

  it('should extract only digits from PIN input', () => {
    // Function to simulate the PIN input filtering logic
    const filterDigits = (input: string): string => {
      return input.replace(/\D/g, '').slice(0, 6);
    };
    
    expect(filterDigits('123456')).toBe('123456');
    expect(filterDigits('123abc')).toBe('123');
    expect(filterDigits('1234567')).toBe('123456'); // Truncated to 6 digits
    expect(filterDigits('1a2b3c')).toBe('123');
    expect(filterDigits('')).toBe('');
  });
});