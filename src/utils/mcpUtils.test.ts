/**
 * Tests for MCP Utility Functions
 * 
 * These are pure functions with no dependencies - perfect TDD targets.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  parseMcpResponse,
  isErrorResponse,
  getErrorMessage,
  executeBatchToolCalls,
  debounce,
  throttle,
} from './mcpUtils';

describe('mcpUtils', () => {
  describe('parseMcpResponse', () => {
    it('should return fallback for null input', () => {
      const result = parseMcpResponse(null, { default: true });
      expect(result).toEqual({ default: true });
    });

    it('should return fallback for undefined input', () => {
      const result = parseMcpResponse(undefined, []);
      expect(result).toEqual([]);
    });

    it('should parse direct JSON response (no content wrapper)', () => {
      const directJson = { characters: [{ name: 'Gandalf' }], count: 1 };
      const result = parseMcpResponse(directJson, {});
      expect(result).toEqual(directJson);
    });

    it('should parse MCP content wrapper format', () => {
      const mcpResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ characters: [{ name: 'Frodo' }] }),
          },
        ],
      };
      const result = parseMcpResponse<{ characters: { name: string }[] }>(mcpResponse, { characters: [] });
      expect(result.characters[0].name).toBe('Frodo');
    });

    it('should return raw text when JSON parse fails', () => {
      const mcpResponse = {
        content: [
          {
            type: 'text',
            text: 'You rolled a 17!',
          },
        ],
      };
      const result = parseMcpResponse<string>(mcpResponse, '');
      expect(result).toBe('You rolled a 17!');
    });

    it('should handle simple value types', () => {
      expect(parseMcpResponse(42, 0)).toBe(42);
      expect(parseMcpResponse('hello', '')).toBe('hello');
      expect(parseMcpResponse(true, false)).toBe(true);
    });

    it('should handle empty content array', () => {
      const mcpResponse = { content: [] };
      const result = parseMcpResponse(mcpResponse, { fallback: true });
      expect(result).toEqual({ fallback: true });
    });

    it('should handle content without text type', () => {
      const mcpResponse = {
        content: [{ type: 'image', data: 'base64...' }],
      };
      const result = parseMcpResponse(mcpResponse, 'fallback');
      expect(result).toBe('fallback');
    });
  });

  describe('isErrorResponse', () => {
    it('should return false for null/undefined', () => {
      expect(isErrorResponse(null)).toBe(false);
      expect(isErrorResponse(undefined)).toBe(false);
    });

    it('should detect direct error object', () => {
      expect(isErrorResponse({ error: 'Something went wrong' })).toBe(true);
      expect(isErrorResponse({ error: { message: 'Failed' } })).toBe(true);
    });

    it('should detect error in MCP content', () => {
      const mcpError = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ error: 'Character not found' }),
          },
        ],
      };
      expect(isErrorResponse(mcpError)).toBe(true);
    });

    it('should return false for successful responses', () => {
      expect(isErrorResponse({ success: true, data: {} })).toBe(false);
      expect(isErrorResponse({
        content: [{ type: 'text', text: JSON.stringify({ success: true }) }],
      })).toBe(false);
    });
  });

  describe('getErrorMessage', () => {
    it('should return null for null/undefined', () => {
      expect(getErrorMessage(null)).toBeNull();
      expect(getErrorMessage(undefined)).toBeNull();
    });

    it('should extract string error message', () => {
      expect(getErrorMessage({ error: 'Failed to load' })).toBe('Failed to load');
    });

    it('should extract error.message', () => {
      expect(getErrorMessage({ error: { message: 'Database error' } })).toBe('Database error');
    });

    it('should extract error from MCP content', () => {
      const mcpError = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ error: 'Character not found' }),
          },
        ],
      };
      expect(getErrorMessage(mcpError)).toBe('Character not found');
    });

    it('should return null for non-error responses', () => {
      expect(getErrorMessage({ success: true })).toBeNull();
    });
  });

  describe('executeBatchToolCalls', () => {
    it('should execute multiple tool calls in parallel', async () => {
      const mockClient = {
        callTool: vi.fn()
          .mockResolvedValueOnce({ result: 'first' })
          .mockResolvedValueOnce({ result: 'second' }),
      };

      const calls = [
        { name: 'tool_a', args: { id: 1 } },
        { name: 'tool_b', args: { id: 2 } },
      ];

      const results = await executeBatchToolCalls(mockClient, calls);

      expect(results).toHaveLength(2);
      expect(results[0].name).toBe('tool_a');
      expect(results[0].result).toEqual({ result: 'first' });
      expect(results[1].name).toBe('tool_b');
      expect(results[1].result).toEqual({ result: 'second' });
    });

    it('should handle individual tool errors without failing batch', async () => {
      const mockClient = {
        callTool: vi.fn()
          .mockResolvedValueOnce({ success: true })
          .mockRejectedValueOnce(new Error('Tool failed')),
      };

      const calls = [
        { name: 'working_tool', args: {} },
        { name: 'broken_tool', args: {} },
      ];

      const results = await executeBatchToolCalls(mockClient, calls);

      expect(results).toHaveLength(2);
      expect(results[0].error).toBeUndefined();
      expect(results[1].error).toBe('Tool failed');
      expect(results[1].result).toBeNull();
    });

    it('should track duration for each call', async () => {
      const mockClient = {
        callTool: vi.fn().mockImplementation(
          () => new Promise((resolve) => setTimeout(() => resolve({ ok: true }), 10))
        ),
      };

      const calls = [{ name: 'slow_tool', args: {} }];
      const results = await executeBatchToolCalls(mockClient, calls);

      expect(results[0].duration).toBeGreaterThanOrEqual(10);
    });

    it('should return empty array for empty input', async () => {
      const mockClient = { callTool: vi.fn() };
      const results = await executeBatchToolCalls(mockClient, []);
      expect(results).toEqual([]);
      expect(mockClient.callTool).not.toHaveBeenCalled();
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it('should delay function execution', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced();
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should reset delay on subsequent calls', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced();
      vi.advanceTimersByTime(50);
      debounced(); // Reset timer
      vi.advanceTimersByTime(50);
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(50);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should pass arguments to the debounced function', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced('arg1', 'arg2');
      vi.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });

  describe('throttle', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it('should execute immediately on first call', () => {
      const fn = vi.fn();
      const throttled = throttle(fn, 100);

      throttled();
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should ignore calls within throttle period', () => {
      const fn = vi.fn();
      const throttled = throttle(fn, 100);

      throttled();
      throttled();
      throttled();

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should allow calls after throttle period', () => {
      const fn = vi.fn();
      const throttled = throttle(fn, 100);

      throttled();
      vi.advanceTimersByTime(100);
      throttled();

      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should pass arguments to the throttled function', () => {
      const fn = vi.fn();
      const throttled = throttle(fn, 100);

      throttled('test', 123);
      expect(fn).toHaveBeenCalledWith('test', 123);
    });
  });
});
