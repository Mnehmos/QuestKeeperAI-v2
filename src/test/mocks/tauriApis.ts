/**
 * Mock Tauri APIs for Testing
 * 
 * Provides testable mocks for Tauri shell, filesystem, and other platform APIs.
 */
import { vi } from 'vitest';

/**
 * Mock sidecar process
 */
export interface MockSidecarProcess {
  pid: number;
  stdout: {
    on: ReturnType<typeof vi.fn>;
    removeListener: ReturnType<typeof vi.fn>;
  };
  stderr: {
    on: ReturnType<typeof vi.fn>;
    removeListener: ReturnType<typeof vi.fn>;
  };
  write: ReturnType<typeof vi.fn>;
  kill: ReturnType<typeof vi.fn>;
  
  // Test helpers
  emitStdout: (data: string) => void;
  emitStderr: (data: string) => void;
  emitClose: (code: number) => void;
}

/**
 * Create a mock sidecar process
 */
export function createMockSidecarProcess(): MockSidecarProcess {
  const stdoutListeners: Array<(data: string) => void> = [];
  const stderrListeners: Array<(data: string) => void> = [];
  const closeListeners: Array<(code: number) => void> = [];

  return {
    pid: 12345,
    stdout: {
      on: vi.fn((event: string, callback: (data: string) => void) => {
        if (event === 'data') {
          stdoutListeners.push(callback);
        }
      }),
      removeListener: vi.fn((event: string, callback: (data: string) => void) => {
        if (event === 'data') {
          const idx = stdoutListeners.indexOf(callback);
          if (idx >= 0) stdoutListeners.splice(idx, 1);
        }
      }),
    },
    stderr: {
      on: vi.fn((event: string, callback: (data: string) => void) => {
        if (event === 'data') {
          stderrListeners.push(callback);
        }
      }),
      removeListener: vi.fn((event: string, callback: (data: string) => void) => {
        if (event === 'data') {
          const idx = stderrListeners.indexOf(callback);
          if (idx >= 0) stderrListeners.splice(idx, 1);
        }
      }),
    },
    write: vi.fn(async (_data: string) => {}),
    kill: vi.fn(async () => {}),

    // Test helpers
    emitStdout: (data: string) => {
      stdoutListeners.forEach((cb) => cb(data));
    },
    emitStderr: (data: string) => {
      stderrListeners.forEach((cb) => cb(data));
    },
    emitClose: (code: number) => {
      closeListeners.forEach((cb) => cb(code));
    },
  };
}

/**
 * Mock Command.sidecar factory
 */
export function createMockCommandSidecar() {
  const processes: MockSidecarProcess[] = [];

  return {
    sidecar: vi.fn((_name: string, _args?: string[]) => {
      const process = createMockSidecarProcess();
      processes.push(process);

      return {
        execute: vi.fn(async () => ({ code: 0, stdout: '', stderr: '' })),
        spawn: vi.fn(async () => process),
        on: vi.fn(),
      };
    }),

    // Test helper: get spawned processes
    getProcesses: () => processes,
    clearProcesses: () => processes.length = 0,
  };
}

/**
 * Mock filesystem API
 */
export const mockFs = {
  readTextFile: vi.fn(async (_path: string) => ''),
  writeTextFile: vi.fn(async (_path: string, _contents: string) => {}),
  readDir: vi.fn(async (_path: string) => []),
  createDir: vi.fn(async (_path: string) => {}),
  exists: vi.fn(async (_path: string) => true),
  removeFile: vi.fn(async (_path: string) => {}),
  removeDir: vi.fn(async (_path: string) => {}),
  copyFile: vi.fn(async (_source: string, _destination: string) => {}),
  renameFile: vi.fn(async (_oldPath: string, _newPath: string) => {}),
};

/**
 * Mock path API
 */
export const mockPath = {
  appDataDir: vi.fn(async () => '/mock/app/data'),
  appLocalDataDir: vi.fn(async () => '/mock/app/local'),
  appConfigDir: vi.fn(async () => '/mock/app/config'),
  dataDir: vi.fn(async () => '/mock/data'),
  localDataDir: vi.fn(async () => '/mock/local'),
  cacheDir: vi.fn(async () => '/mock/cache'),
  configDir: vi.fn(async () => '/mock/config'),
  executableDir: vi.fn(async () => '/mock/executable'),
  homeDir: vi.fn(async () => '/mock/home'),
  resourceDir: vi.fn(async () => '/mock/resource'),
  tempDir: vi.fn(async () => '/mock/temp'),
  join: vi.fn(async (...paths: string[]) => paths.join('/')),
  resolve: vi.fn(async (...paths: string[]) => paths.join('/')),
  basename: vi.fn(async (path: string) => path.split('/').pop() || ''),
  dirname: vi.fn(async (path: string) => path.split('/').slice(0, -1).join('/')),
};

/**
 * Reset all Tauri mocks
 */
export function resetTauriMocks() {
  Object.values(mockFs).forEach((fn) => fn.mockClear());
  Object.values(mockPath).forEach((fn) => fn.mockClear());
}
