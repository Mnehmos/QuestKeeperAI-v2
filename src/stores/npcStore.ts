import { create } from 'zustand';
import { mcpManager } from '../services/mcpClient';
import { parseMcpResponse } from '../utils/mcpUtils';

// Types matching backend npc-memory.repo.ts
export type Familiarity = 'stranger' | 'acquaintance' | 'friend' | 'close_friend' | 'rival' | 'enemy';
export type Disposition = 'hostile' | 'unfriendly' | 'neutral' | 'friendly' | 'helpful';
export type Importance = 'low' | 'medium' | 'high' | 'critical';

export interface NpcRelationship {
  characterId: string;
  npcId: string;
  npcName?: string;  // Populated from character data
  familiarity: Familiarity;
  disposition: Disposition;
  notes: string | null;
  firstMetAt: string | null;
  lastInteractionAt: string | null;
  interactionCount: number;
}

export interface NpcMemory {
  id: number;
  characterId: string;
  npcId: string;
  npcName?: string;
  summary: string;
  importance: Importance;
  topics: string[];
  createdAt: string;
}

interface NpcState {
  // Data
  relationships: NpcRelationship[];
  memories: NpcMemory[];
  selectedNpcId: string | null;
  isLoading: boolean;
  
  // Actions
  setSelectedNpc: (npcId: string | null) => void;
  fetchRecentMemories: (characterId: string, limit?: number) => Promise<void>;
  fetchNpcHistory: (characterId: string, npcId: string) => Promise<void>;
  clearNpcData: () => void;
}

export const useNpcStore = create<NpcState>((set, _get) => ({
  relationships: [],
  memories: [],
  selectedNpcId: null,
  isLoading: false,

  setSelectedNpc: (npcId) => set({ selectedNpcId: npcId }),

  fetchRecentMemories: async (characterId, limit = 20) => {
    set({ isLoading: true });
    try {
      const result = await mcpManager.gameStateClient.callTool('get_recent_interactions', {
        characterId,
        limit
      });
      
      const data = parseMcpResponse<{ memories: NpcMemory[] }>(result, { memories: [] });
      set({ memories: data.memories || [] });
    } catch (e) {
      console.warn('[npcStore] Failed to fetch recent memories:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchNpcHistory: async (characterId, npcId) => {
    set({ isLoading: true, selectedNpcId: npcId });
    try {
      // Fetch relationship and history in parallel
      const [relResult, histResult] = await Promise.all([
        mcpManager.gameStateClient.callTool('get_npc_relationship', { characterId, npcId }),
        mcpManager.gameStateClient.callTool('get_conversation_history', { characterId, npcId, limit: 50 })
      ]);
      
      const relData = parseMcpResponse<NpcRelationship | null>(relResult, null);
      const histData = parseMcpResponse<{ memories: NpcMemory[] }>(histResult, { memories: [] });
      
      // Update relationship in list
      if (relData) {
        set(state => ({
          relationships: state.relationships.some(r => r.npcId === npcId)
            ? state.relationships.map(r => r.npcId === npcId ? relData : r)
            : [...state.relationships, relData]
        }));
      }
      
      // Update memories for selected NPC
      set({ memories: histData.memories || [] });
    } catch (e) {
      console.warn('[npcStore] Failed to fetch NPC history:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  clearNpcData: () => set({
    relationships: [],
    memories: [],
    selectedNpcId: null
  })
}));

// Familiarity visual config
export const FAMILIARITY_CONFIG: Record<Familiarity, { color: string; icon: string; label: string }> = {
  stranger: { color: '#6b7280', icon: '👤', label: 'Stranger' },
  acquaintance: { color: '#3b82f6', icon: '🤝', label: 'Acquaintance' },
  friend: { color: '#22c55e', icon: '💚', label: 'Friend' },
  close_friend: { color: '#eab308', icon: '⭐', label: 'Close Friend' },
  rival: { color: '#f97316', icon: '⚔️', label: 'Rival' },
  enemy: { color: '#ef4444', icon: '💀', label: 'Enemy' }
};

// Disposition visual config
export const DISPOSITION_CONFIG: Record<Disposition, { icon: string; label: string }> = {
  hostile: { icon: '😡', label: 'Hostile' },
  unfriendly: { icon: '😒', label: 'Unfriendly' },
  neutral: { icon: '😐', label: 'Neutral' },
  friendly: { icon: '🙂', label: 'Friendly' },
  helpful: { icon: '😊', label: 'Helpful' }
};

// Importance visual config
export const IMPORTANCE_CONFIG: Record<Importance, { color: string; badge: string }> = {
  low: { color: '#6b7280', badge: '' },
  medium: { color: '#3b82f6', badge: '!' },
  high: { color: '#f97316', badge: '!!' },
  critical: { color: '#ef4444', badge: '!!!' }
};
