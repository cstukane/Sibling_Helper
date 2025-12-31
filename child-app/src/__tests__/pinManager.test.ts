import { describe, it, expect, beforeEach } from 'vitest';
import { pinManager } from '../state/pinManager';

describe('pinManager', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('should set and validate a PIN', async () => {
    const pin = '1234';
    
    await pinManager.setPin(pin);
    await expect(pinManager.validatePin(pin)).resolves.toBe(true);
  });

  it('should return false for invalid PIN', async () => {
    const pin = '1234';
    const wrongPin = '4321';
    
    await pinManager.setPin(pin);
    await expect(pinManager.validatePin(wrongPin)).resolves.toBe(false);
  });

  it('should check if PIN is set', async () => {
    expect(pinManager.isPinSet()).toBe(false);
    
    await pinManager.setPin('1234');
    expect(pinManager.isPinSet()).toBe(true);
  });

  it('should clear the PIN', async () => {
    await pinManager.setPin('1234');
    expect(pinManager.isPinSet()).toBe(true);
    
    pinManager.clearPin();
    expect(pinManager.isPinSet()).toBe(false);
  });

  it('should initialize default PIN if none exists', async () => {
    expect(pinManager.isPinSet()).toBe(false);
    
    await pinManager.initializeDefaultPin();
    expect(pinManager.isPinSet()).toBe(true);
    await expect(pinManager.validatePin('1234')).resolves.toBe(true);
  });

  it('should not override existing PIN when initializing default', async () => {
    await pinManager.setPin('5678');
    expect(pinManager.isPinSet()).toBe(true);
    
    await pinManager.initializeDefaultPin();
    await expect(pinManager.validatePin('5678')).resolves.toBe(true);
    await expect(pinManager.validatePin('1234')).resolves.toBe(false);
  });
});
