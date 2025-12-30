import { describe, it, expect, beforeEach } from 'vitest';
import { pinManager } from '../state/pinManager';

describe('pinManager', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('should set and validate a PIN', () => {
    const pin = '1234';
    
    pinManager.setPin(pin);
    expect(pinManager.validatePin(pin)).toBe(true);
  });

  it('should return false for invalid PIN', () => {
    const pin = '1234';
    const wrongPin = '4321';
    
    pinManager.setPin(pin);
    expect(pinManager.validatePin(wrongPin)).toBe(false);
  });

  it('should check if PIN is set', () => {
    expect(pinManager.isPinSet()).toBe(false);
    
    pinManager.setPin('1234');
    expect(pinManager.isPinSet()).toBe(true);
  });

  it('should clear the PIN', () => {
    pinManager.setPin('1234');
    expect(pinManager.isPinSet()).toBe(true);
    
    pinManager.clearPin();
    expect(pinManager.isPinSet()).toBe(false);
  });

  it('should initialize default PIN if none exists', () => {
    expect(pinManager.isPinSet()).toBe(false);
    
    pinManager.initializeDefaultPin();
    expect(pinManager.isPinSet()).toBe(true);
    expect(pinManager.validatePin('1234')).toBe(true);
  });

  it('should not override existing PIN when initializing default', () => {
    pinManager.setPin('5678');
    expect(pinManager.isPinSet()).toBe(true);
    
    pinManager.initializeDefaultPin();
    expect(pinManager.validatePin('5678')).toBe(true);
    expect(pinManager.validatePin('1234')).toBe(false);
  });
});