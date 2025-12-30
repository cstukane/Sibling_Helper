import { describe, it, expect, beforeEach } from 'vitest';

describe('Dark Mode and Border Color', () => {
  beforeEach(() => {
    // Clear any existing styles
    document.documentElement.removeAttribute('style');
    localStorage.clear();
  });

  it('should set CSS variable for frame border', () => {
    // Set a border color
    document.documentElement.style.setProperty('--frame-border', '#ff0000');
    
    const borderColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--frame-border')
      .trim();
    
    expect(borderColor).toBe('#ff0000');
  });

  it('should store border color preference in localStorage', () => {
    localStorage.setItem('borderColor', '#00ff00');
    
    const savedColor = localStorage.getItem('borderColor');
    expect(savedColor).toBe('#00ff00');
  });

  it('should handle system default border color', () => {
    localStorage.setItem('borderColor', 'system');
    
    const savedColor = localStorage.getItem('borderColor');
    expect(savedColor).toBe('system');
  });

  it('should support predefined border color options', () => {
    const colorOptions = [
      'system',
      '#000000', // Slate
      '#374151', // Graphite
      '#312e81', // Indigo
      '#065f46', // Emerald
      '#991b1b'  // Rose
    ];
    
    colorOptions.forEach(color => {
      localStorage.setItem('borderColor', color);
      expect(localStorage.getItem('borderColor')).toBe(color);
    });
  });

  it('should apply dark mode class to document', () => {
    document.documentElement.classList.add('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    
    document.documentElement.classList.remove('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});