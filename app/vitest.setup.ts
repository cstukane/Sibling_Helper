import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';
import { vi } from 'vitest';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock localStorage properly
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
});

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

// Mock service worker
Object.defineProperty(window.navigator, 'serviceWorker', {
  value: {
    register: vi.fn().mockResolvedValue({}),
    ready: Promise.resolve({
      pushManager: {
        subscribe: vi.fn().mockResolvedValue({
          endpoint: 'test-endpoint',
          getKey: vi.fn().mockReturnValue(new Uint8Array()),
        }),
      },
    }),
  },
  writable: true,
});

if (!('userAgent' in window.navigator) || !window.navigator.userAgent) {
  Object.defineProperty(window.navigator, 'userAgent', {
    value: 'node.js',
    configurable: true
  });
}

// Mock React-specific globals
Object.defineProperty(window, 'requestAnimationFrame', {
  value: vi.fn().mockImplementation((callback) => {
    return setTimeout(callback, 0);
  }),
  writable: true,
});

Object.defineProperty(window, 'cancelAnimationFrame', {
  value: vi.fn().mockImplementation((id) => {
    clearTimeout(id);
  }),
  writable: true,
});
