/**
 * Mock MCP Client for Testing
 * 
 * Provides a testable mock of the MCP client with configurable responses.
 */
import { vi } from 'vitest';

export interface MockToolResponse {
  content: Array<{ type: string; text: string }>;
}

export interface MockMcpClient {
  callTool: ReturnType<typeof vi.fn>;
  isConnected: ReturnType<typeof vi.fn>;
  connect: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  getAvailableTools: ReturnType<typeof vi.fn>;
  
  // Test helpers
  mockToolResponse: (toolName: string, response: any) => void;
  mockToolError: (toolName: string, error: string) => void;
  clearMocks: () => void;
}

/**
 * Create a mock MCP client for testing
 */
export function createMockMcpClient(): MockMcpClient {
  const toolResponses = new Map<string, any>();
  const toolErrors = new Map<string, string>();

  const callTool = vi.fn(async (name: string, _args: any) => {
    // Check for configured error
    if (toolErrors.has(name)) {
      throw new Error(toolErrors.get(name));
    }

    // Check for configured response
    if (toolResponses.has(name)) {
      const response = toolResponses.get(name);
      return wrapInMcpFormat(response);
    }

    // Default: return empty success response
    return wrapInMcpFormat({ success: true });
  });

  const isConnected = vi.fn(() => true);
  const connect = vi.fn(async () => true);
  const disconnect = vi.fn(async () => {});
  const getAvailableTools = vi.fn(() => [
    'list_characters',
    'get_character',
    'create_character',
    'update_character',
    'delete_character',
    'create_encounter',
    'get_encounter_state',
    'execute_combat_action',
    'advance_turn',
    'end_encounter',
    'dice_roll',
    'get_inventory',
    'give_item',
    'equip_item',
  ]);

  return {
    callTool,
    isConnected,
    connect,
    disconnect,
    getAvailableTools,

    // Test helpers
    mockToolResponse: (toolName: string, response: any) => {
      toolResponses.set(toolName, response);
    },
    
    mockToolError: (toolName: string, error: string) => {
      toolErrors.set(toolName, error);
    },
    
    clearMocks: () => {
      toolResponses.clear();
      toolErrors.clear();
      callTool.mockClear();
      isConnected.mockClear();
      connect.mockClear();
      disconnect.mockClear();
    },
  };
}

/**
 * Wrap a response in MCP content format
 */
function wrapInMcpFormat(data: any): MockToolResponse {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(data),
      },
    ],
  };
}

/**
 * Create a mock character for testing
 */
export function createMockCharacter(overrides: Partial<{
  id: string;
  name: string;
  class: string;
  race: string;
  level: number;
  hp: number;
  maxHp: number;
  ac: number;
  stats: { str: number; dex: number; con: number; int: number; wis: number; cha: number };
}> = {}) {
  return {
    id: 'char-test-001',
    name: 'Test Hero',
    class: 'Fighter',
    race: 'Human',
    level: 1,
    hp: 10,
    maxHp: 10,
    ac: 16,
    stats: { str: 16, dex: 14, con: 14, int: 10, wis: 12, cha: 10 },
    ...overrides,
  };
}

/**
 * Create a mock encounter for testing
 */
export function createMockEncounter(overrides: Partial<{
  id: number;
  isActive: boolean;
  round: number;
  currentTurn: number;
  participants: any[];
}> = {}) {
  return {
    id: 1,
    isActive: true,
    round: 1,
    currentTurn: 0,
    participants: [
      { id: 'char-test-001', name: 'Test Hero', hp: 10, maxHp: 10, initiative: 15, isEnemy: false },
      { id: 'goblin-001', name: 'Goblin', hp: 7, maxHp: 7, initiative: 12, isEnemy: true },
    ],
    ...overrides,
  };
}
