import { create } from 'zustand';
import { CreatureSize } from '../utils/gridHelpers';
import { mcpManager } from '../services/mcpClient';
import { useGameStateStore } from './gameStateStore';
import { parseMcpResponse, debounce } from '../utils/mcpUtils';

export type Vector3 = { x: number; y: number; z: number };

export interface EntityMetadata {
  hp: {
    current: number;
    max: number;
    temp?: number;
  };
  ac: number;
  creatureType: string;
  conditions: string[];
  stats?: {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
  };
  description?: string;
  notes?: string;
}

export interface Entity {
  id: string;
  name: string;
  type: 'character' | 'npc' | 'monster';
  size: CreatureSize;
  position: Vector3;
  color: string;
  model?: string;
  metadata: EntityMetadata;
  isCurrentTurn?: boolean;
}

export interface GridConfig {
  size: number;
  divisions: number;
}

export interface TerrainFeature {
  id: string;
  type: string;
  position: Vector3;
  dimensions: { width: number; height: number; depth: number };
  blocksMovement: boolean;
  coverType?: 'half' | 'three-quarters' | 'full' | 'none';
  color: string;
}

/**
 * Structure returned by get_encounter_state (now returns JSON!)
 */
interface EncounterStateJson {
  encounterId: string;
  round: number;
  currentTurnIndex: number;
  currentTurn: {
    id: string;
    name: string;
    isEnemy: boolean;
  } | null;
  turnOrder: string[];
  participants: Array<{
    id: string;
    name: string;
    hp: number;
    maxHp: number;
    initiative: number;
    isEnemy: boolean;
    conditions: string[];
    isDefeated: boolean;
    isCurrentTurn: boolean;
  }>;
}

interface CombatState {
  entities: Entity[];
  terrain: TerrainFeature[];
  selectedEntityId: string | null;
  selectedTerrainId: string | null;
  gridConfig: GridConfig;
  battlefieldDescription: string | null;
  
  // rpg-mcp encounter tracking
  activeEncounterId: string | null;
  currentRound: number;
  currentTurnName: string | null;
  turnOrder: string[];
  isSyncing: boolean;
  lastSyncTime: number;

  addEntity: (entity: Entity) => void;
  removeEntity: (id: string) => void;
  updateEntity: (id: string, updates: Partial<Entity>) => void;
  updateEntityMetadata: (id: string, metadata: Partial<EntityMetadata>) => void;
  selectEntity: (id: string | null) => void;
  selectTerrain: (id: string | null) => void;
  setGridConfig: (config: GridConfig) => void;
  setBattlefieldDescription: (desc: string | null) => void;
  setActiveEncounterId: (id: string | null) => void;
  syncCombatState: () => Promise<void>;
  updateFromStateJson: (stateJson: EncounterStateJson) => void;
  clearCombat: () => void;
}

const MOCK_ENTITIES: Entity[] = [];

/**
 * Extract embedded JSON from tool response text
 * Looks for <!-- STATE_JSON ... STATE_JSON --> markers
 */
function extractEmbeddedStateJson(text: string): EncounterStateJson | null {
  const match = text.match(/<!-- STATE_JSON\n([\s\S]*?)\nSTATE_JSON -->/);
  if (match && match[1]) {
    try {
      return JSON.parse(match[1]);
    } catch (e) {
      console.warn('[extractEmbeddedStateJson] Failed to parse embedded JSON:', e);
      return null;
    }
  }
  return null;
}

/**
 * Determine entity type and color based on isEnemy flag and name
 */
function determineEntityType(_name: string, isEnemy: boolean, isCurrentTurn: boolean): { type: 'character' | 'npc' | 'monster'; color: string } {
  if (isEnemy) {
    return { type: 'monster', color: isCurrentTurn ? '#ff6666' : '#ff4444' }; // Red for monsters
  }
  
  // First non-enemy is usually the player character
  return { type: 'character', color: isCurrentTurn ? '#66ff66' : '#44ff44' }; // Green for players
}

/**
 * Convert EncounterStateJson to Entity array for the battlemap
 */
function stateJsonToEntities(data: EncounterStateJson, gridConfig: GridConfig): Entity[] {
  const entities: Entity[] = [];
  const participantCount = data.participants.length;
  
  // Position participants in a circle around the center
  const radius = Math.min(gridConfig.size / 4, 6);
  
  data.participants.forEach((p, index) => {
    // Calculate position in a circle
    const angle = (2 * Math.PI * index) / participantCount - Math.PI / 2; // Start from top
    
    const x = Math.round(Math.cos(angle) * radius);
    const z = Math.round(Math.sin(angle) * radius);
    
    const { type, color } = determineEntityType(p.name, p.isEnemy, p.isCurrentTurn);

    const entity: Entity = {
      id: p.id,
      name: p.name,
      type,
      size: 'Medium' as CreatureSize,
      position: { x, y: 0, z },
      color,
      model: 'box',
      isCurrentTurn: p.isCurrentTurn,
      metadata: {
        hp: {
          current: p.hp,
          max: p.maxHp
        },
        ac: 10, // Default AC
        creatureType: type,
        conditions: p.conditions
      }
    };
    
    entities.push(entity);
  });

  return entities;
}

/**
 * Generate battlefield description from state JSON
 */
function generateBattlefieldDescription(data: EncounterStateJson): string {
  if (!data.participants || data.participants.length === 0) {
    return 'No active combat encounter.';
  }

  const lines = [
    `⚔️ Combat Round ${data.round}`,
    `🎯 Current Turn: ${data.currentTurn?.name || 'Unknown'}`,
    `📋 Initiative: ${data.turnOrder.join(' → ')}`,
    '',
    '👥 Combatants:'
  ];
  
  data.participants.forEach(p => {
    const hpPercent = p.maxHp > 0 ? Math.round((p.hp / p.maxHp) * 100) : 0;
    const hpBar = p.isDefeated ? '💀' : hpPercent > 66 ? '🟢' : hpPercent > 33 ? '🟡' : '🔴';
    const conditions = p.conditions.length > 0 
      ? ` [${p.conditions.join(', ')}]` 
      : '';
    const turnMarker = p.isCurrentTurn ? '▶ ' : '  ';
    
    lines.push(`${turnMarker}${hpBar} ${p.name}: ${p.hp}/${p.maxHp} HP${conditions}`);
  });

  return lines.join('\n');
}

export const useCombatStore = create<CombatState>((set, get) => ({
  entities: MOCK_ENTITIES,
  terrain: [],
  selectedEntityId: null,
  selectedTerrainId: null,
  gridConfig: { size: 20, divisions: 20 },
  battlefieldDescription: null,
  
  // rpg-mcp encounter tracking
  activeEncounterId: null,
  currentRound: 0,
  currentTurnName: null,
  turnOrder: [],
  isSyncing: false,
  lastSyncTime: 0,

  addEntity: (entity) => set((state) => ({
    entities: [...state.entities, entity]
  })),

  removeEntity: (id) => set((state) => ({
    entities: state.entities.filter((ent) => ent.id !== id),
    selectedEntityId: state.selectedEntityId === id ? null : state.selectedEntityId
  })),

  updateEntity: (id, updates) => set((state) => ({
    entities: state.entities.map((ent) =>
      ent.id === id ? { ...ent, ...updates } : ent
    )
  })),

  updateEntityMetadata: (id, metadata) => set((state) => ({
    entities: state.entities.map((ent) => {
      if (ent.id !== id) return ent;
      const newMetadata = { ...ent.metadata, ...metadata };

      if (metadata.hp) {
        newMetadata.hp = { ...ent.metadata.hp, ...metadata.hp };
      }

      if (metadata.stats) {
        newMetadata.stats = { ...(ent.metadata.stats || {}), ...metadata.stats } as any;
      }

      return { ...ent, metadata: newMetadata };
    })
  })),

  selectEntity: (id) => set({ selectedEntityId: id, selectedTerrainId: null }),

  selectTerrain: (id) => set({ selectedTerrainId: id, selectedEntityId: null }),

  setGridConfig: (config) => set({ gridConfig: config }),

  setBattlefieldDescription: (desc) => set({ battlefieldDescription: desc }),
  
  setActiveEncounterId: (id) => set({ activeEncounterId: id }),
  
  clearCombat: () => set({
    entities: [],
    terrain: [],
    activeEncounterId: null,
    currentRound: 0,
    currentTurnName: null,
    turnOrder: [],
    battlefieldDescription: null,
    selectedEntityId: null
  }),

  /**
   * Update store from a state JSON object
   * Can be called when parsing tool responses with embedded state
   */
  updateFromStateJson: (stateJson: EncounterStateJson) => {
    const { gridConfig } = get();
    
    const entities = stateJsonToEntities(stateJson, gridConfig);
    const description = generateBattlefieldDescription(stateJson);
    
    set({
      entities,
      activeEncounterId: stateJson.encounterId,
      currentRound: stateJson.round,
      currentTurnName: stateJson.currentTurn?.name || null,
      turnOrder: stateJson.turnOrder,
      battlefieldDescription: description
    });
    
    console.log('[updateFromStateJson] Updated combat state:', {
      encounterId: stateJson.encounterId,
      round: stateJson.round,
      entityCount: entities.length,
      currentTurn: stateJson.currentTurn?.name
    });
    
    // Sync HP changes back to game state store for party panel
    const gameState = useGameStateStore.getState();
    console.log('[updateFromStateJson] Party state:', gameState.party.map(c => ({ name: c.name, id: c.id, hp: c.hp?.current })));
    console.log('[updateFromStateJson] Combat participants:', stateJson.participants.map(p => ({ name: p.name, id: p.id, hp: p.hp })));
    
    const updatedParty = gameState.party.map(char => {
      // Find matching participant by name or ID
      const participant = stateJson.participants.find(
        p => p.name === char.name || p.id === char.id
      );
      if (participant && participant.hp !== char.hp.current) {
        console.log('[updateFromStateJson] Syncing HP for', char.name, ':', char.hp.current, '->', participant.hp);
        return { ...char, hp: { ...char.hp, current: participant.hp } };
      }
      return char;
    });
    
    // Only update if there were changes
    if (updatedParty.some((char, i) => char.hp.current !== gameState.party[i]?.hp.current)) {
      useGameStateStore.setState({ party: updatedParty });
      // Also update active character if it was affected
      const activeId = gameState.activeCharacterId;
      if (activeId) {
        const updatedActive = updatedParty.find(c => c.id === activeId);
        if (updatedActive) {
          useGameStateStore.setState({ activeCharacter: updatedActive });
        }
      }
    }
  },

  syncCombatState: async () => {
    const { activeEncounterId, isSyncing, lastSyncTime } = get();
    
    // Prevent concurrent syncs and rate limit
    if (isSyncing) {
      return;
    }
    
    const now = Date.now();
    if (now - lastSyncTime < 1000) {
      return;
    }
    
    // If no active encounter, nothing to sync
    if (!activeEncounterId) {
      console.log('[syncCombatState] No active encounter. Use create_encounter via LLM to start combat.');
      return;
    }

    set({ isSyncing: true, lastSyncTime: now });

    try {
      console.log('[syncCombatState] Fetching encounter state for:', activeEncounterId);
      
      const result = await mcpManager.combatClient.callTool('get_encounter_state', {
        encounterId: activeEncounterId
      });

      console.log('[syncCombatState] Raw result:', result);

      // NEW: get_encounter_state now returns JSON directly!
      const data = parseMcpResponse<EncounterStateJson | null>(result, null);
      
      if (data && data.participants) {
        console.log('[syncCombatState] Parsed encounter data:', data);
        
        // Use the new updateFromStateJson method
        get().updateFromStateJson(data);
      } else if (typeof data === 'string') {
        // Fallback: check if it's text with embedded JSON
        const embedded = extractEmbeddedStateJson(data);
        if (embedded) {
          get().updateFromStateJson(embedded);
        } else {
          console.warn('[syncCombatState] Response is text without embedded JSON');
        }
      } else {
        console.warn('[syncCombatState] No valid data in response');
      }
    } catch (e: any) {
      const errorMsg = e?.message || String(e);
      
      // If encounter not found, clear the active encounter
      if (errorMsg.includes('not found') || errorMsg.includes('does not exist')) {
        console.log('[syncCombatState] Encounter not found, clearing combat state');
        set({ 
          activeEncounterId: null,
          entities: [],
          battlefieldDescription: 'No active encounter.',
          currentRound: 0,
          currentTurnName: null,
          turnOrder: []
        });
      } else {
        console.warn('[syncCombatState] Failed to sync combat state:', e);
      }
    } finally {
      set({ isSyncing: false });
    }
  }
}));

// Export debounced sync for use in components
export const debouncedSyncCombatState = debounce(() => {
  useCombatStore.getState().syncCombatState();
}, 500);

/**
 * Helper to parse combat tool responses and update store
 * Call this after receiving any combat tool response
 */
export function handleCombatToolResponse(responseText: string): void {
  const embedded = extractEmbeddedStateJson(responseText);
  if (embedded) {
    useCombatStore.getState().updateFromStateJson(embedded);
  }
}
