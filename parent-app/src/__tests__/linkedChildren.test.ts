import { describe, it, expect, beforeEach } from 'vitest';

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

// Mock the global localStorage
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('Linked Children Storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should initialize with empty linked children array', () => {
    const stored = localStorage.getItem('linked_children');
    if (stored) {
      const parsed = JSON.parse(stored);
      expect(Array.isArray(parsed)).toBe(true);
    } else {
      // If nothing is stored, it should be treated as empty array
      expect(stored).toBeNull();
    }
  });

  it('should store linked children data', () => {
    const childData = [
      {
        id: 'link-1',
        childId: 'child-1',
        name: 'Emma',
        currentPoints: 50,
        lastSyncedAt: '2023-01-01T00:00:00Z',
        pin: '123456'
      }
    ];
    
    localStorage.setItem('linked_children', JSON.stringify(childData));
    
    const stored = localStorage.getItem('linked_children');
    expect(stored).not.toBeNull();
    
    const parsed = JSON.parse(stored!);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].childId).toBe('child-1');
    expect(parsed[0].name).toBe('Emma');
  });

  it('should handle empty linked children array', () => {
    localStorage.setItem('linked_children', JSON.stringify([]));
    
    const stored = localStorage.getItem('linked_children');
    expect(stored).not.toBeNull();
    
    const parsed = JSON.parse(stored!);
    expect(parsed).toHaveLength(0);
  });
});