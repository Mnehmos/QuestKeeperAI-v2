/**
 * Vitest Global Test Setup
 * 
 * Configures JSDOM environment and mocks for Tauri APIs
 */
import '@testing-library/jest-dom/vitest';
import { vi, beforeEach, afterEach } from 'vitest';

// Mock Tauri APIs globally
vi.mock('@tauri-apps/api', () => ({
  invoke: vi.fn(),
  convertFileSrc: vi.fn((path: string) => `asset://${path}`),
}));

vi.mock('@tauri-apps/plugin-shell', () => ({
  Command: {
    sidecar: vi.fn(() => ({
      execute: vi.fn().mockResolvedValue({ code: 0, stdout: '', stderr: '' }),
      spawn: vi.fn().mockResolvedValue({
        pid: 12345,
        write: vi.fn(),
        kill: vi.fn(),
      }),
      on: vi.fn(),
    })),
  },
}));

// Mock window.matchMedia for components that use it
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
}));

// Clean up mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// Console warnings filter (optional - reduce noise)
const originalWarn = console.warn;
console.warn = (...args: unknown[]) => {
  // Filter out known harmless warnings
  const message = args[0]?.toString() || '';
  if (
    message.includes('React does not recognize') ||
    message.includes('Invalid DOM property')
  ) {
    return;
  }
  originalWarn(...args);
};
