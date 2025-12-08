import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Import other stores for orchestration
import { useChatStore } from './chatStore';
import { usePartyStore } from './partyStore';
import { useGameStateStore } from './gameStateStore';

// ============================================
// Types
// ============================================

export interface SessionSnapshot {
  partyName: string;
  level: number;
  locationName: string;
  memberCount: number;
}

export interface CampaignSession {
  id: string;
  name: string;
  description?: string;
  
  // 🔗 Links to other stores
  partyId: string | null;
  worldId: string | null;
  chatSessionId: string | null;
  activeCharacterId: string | null;
  
  // 📊 Metadata
  createdAt: number;
  lastPlayedAt: number;
  playtime: number; // Accumulated playtime in ms
  
  // Snapshot for UI cards (without loading full stores)
  snapshot: SessionSnapshot;
}

export interface CreateSessionOptions {
  name: string;
  description?: string;
  partyId?: string | null;
  worldId?: string | null;
  chatSessionId?: string | null;
  activeCharacterId?: string | null;
}

// ============================================
// Store Interface
// ============================================

interface SessionState {
  sessions: CampaignSession[];
  activeSessionId: string | null;
  sessionStartTime: number | null; // For tracking playtime
  isInitialized: boolean;
  
  // CRUD Operations
  createSession: (options: CreateSessionOptions) => string;
  updateSession: (sessionId: string, updates: Partial<CampaignSession>) => void;
  deleteSession: (sessionId: string) => void;
  
  // Session Management
  switchSession: (sessionId: string) => Promise<void>;
  getActiveSession: () => CampaignSession | null;
  
  // Metadata
  updateSnapshot: (sessionId: string) => void;
  updatePlaytime: () => void;
  
  // Initialization
  initialize: () => void;
  migrateDefaultSession: () => void;
}

// ============================================
// Helper Functions
// ============================================

function generateId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function createDefaultSnapshot(): SessionSnapshot {
  return {
    partyName: 'No Party',
    level: 1,
    locationName: 'Unknown',
    memberCount: 0,
  };
}

// ============================================
// Store Implementation
// ============================================

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      sessions: [],
      activeSessionId: null,
      sessionStartTime: null,
      isInitialized: false,

      // ============================================
      // CRUD Operations
      // ============================================

      createSession: (options) => {
        const id = generateId();
        
        // Create a new chat session for this campaign
        let chatSessionId = options.chatSessionId;
        if (!chatSessionId) {
          chatSessionId = useChatStore.getState().createSession();
          // Update the chat session title
          useChatStore.getState().updateSessionTitle(chatSessionId, options.name);
        }
        
        const newSession: CampaignSession = {
          id,
          name: options.name,
          description: options.description,
          partyId: options.partyId || null,
          worldId: options.worldId || null,
          chatSessionId,
          activeCharacterId: options.activeCharacterId || null,
          createdAt: Date.now(),
          lastPlayedAt: Date.now(),
          playtime: 0,
          snapshot: createDefaultSnapshot(),
        };
        
        set((state) => ({
          sessions: [newSession, ...state.sessions],
          activeSessionId: id,
          sessionStartTime: Date.now(),
        }));
        
        console.log(`[SessionStore] Created session: ${options.name} (${id})`);
        return id;
      },

      updateSession: (sessionId, updates) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? { ...s, ...updates, lastPlayedAt: Date.now() }
              : s
          ),
        }));
      },

      deleteSession: (sessionId) => {
        const state = get();
        const session = state.sessions.find((s) => s.id === sessionId);
        
        if (session) {
          // Also delete the associated chat session
          if (session.chatSessionId) {
            useChatStore.getState().deleteSession(session.chatSessionId);
          }
        }
        
        set((state) => {
          const newSessions = state.sessions.filter((s) => s.id !== sessionId);
          let newActiveId = state.activeSessionId;
          
          // If we deleted the active session, switch to another or null
          if (state.activeSessionId === sessionId) {
            newActiveId = newSessions.length > 0 ? newSessions[0].id : null;
          }
          
          return {
            sessions: newSessions,
            activeSessionId: newActiveId,
          };
        });
        
        console.log(`[SessionStore] Deleted session: ${sessionId}`);
      },

      // ============================================
      // Session Switching (Orchestration)
      // ============================================

      switchSession: async (sessionId) => {
        const session = get().sessions.find((s) => s.id === sessionId);
        if (!session) {
          console.error(`[SessionStore] Session not found: ${sessionId}`);
          return;
        }
        
        console.log(`[SessionStore] Switching to session: ${session.name}`);
        
        // Update playtime for current session before switching
        get().updatePlaytime();
        
        // Lock game state to prevent race conditions during switch
        const gameState = useGameStateStore.getState();
        
        // Batch dispatch to all stores
        
        // 1. Switch chat session
        if (session.chatSessionId) {
          useChatStore.getState().switchSession(session.chatSessionId);
        }
        
        // 2. Set active party (without triggering sync yet)
        if (session.partyId) {
          usePartyStore.getState().setActivePartyId(session.partyId);
        }
        
        // 3. Set active world
        if (session.worldId) {
          gameState.setActiveWorldId(session.worldId, false);
        }
        
        // 4. Set active character
        if (session.activeCharacterId) {
          gameState.setActiveCharacterId(session.activeCharacterId, false);
        }
        
        // 5. Update session store state
        set({
          activeSessionId: sessionId,
          sessionStartTime: Date.now(),
        });
        
        // 6. Force sync to load the new state
        gameState.unlockSelection();
        await gameState.syncState(true);
        
        // 7. Update last played time
        get().updateSession(sessionId, { lastPlayedAt: Date.now() });
        
        console.log(`[SessionStore] Switched to session: ${session.name}`);
      },

      getActiveSession: () => {
        const { sessions, activeSessionId } = get();
        return sessions.find((s) => s.id === activeSessionId) || null;
      },

      // ============================================
      // Metadata Management
      // ============================================

      updateSnapshot: (sessionId) => {
        const partyStore = usePartyStore.getState();
        const gameState = useGameStateStore.getState();
        
        const activeParty = partyStore.getActiveParty();
        const world = gameState.world;
        
        const snapshot: SessionSnapshot = {
          partyName: activeParty?.name || 'No Party',
          level: gameState.activeCharacter?.level || 1,
          locationName: world?.location || 'Unknown',
          memberCount: activeParty?.members?.length || 0,
        };
        
        get().updateSession(sessionId, { snapshot });
      },

      updatePlaytime: () => {
        const { activeSessionId, sessionStartTime } = get();
        
        if (activeSessionId && sessionStartTime) {
          const elapsed = Date.now() - sessionStartTime;
          const session = get().sessions.find((s) => s.id === activeSessionId);
          
          if (session) {
            get().updateSession(activeSessionId, {
              playtime: session.playtime + elapsed,
            });
          }
          
          // Reset start time
          set({ sessionStartTime: Date.now() });
        }
      },

      // ============================================
      // Initialization & Migration
      // ============================================

      initialize: () => {
        if (get().isInitialized) return;
        
        console.log('[SessionStore] Initializing...');
        
        // If no sessions exist, migrate current state
        if (get().sessions.length === 0) {
          get().migrateDefaultSession();
        }
        
        // Start tracking playtime for active session
        const activeSession = get().getActiveSession();
        if (activeSession) {
          set({ sessionStartTime: Date.now() });
        }
        
        set({ isInitialized: true });
        console.log('[SessionStore] Initialization complete');
      },

      migrateDefaultSession: () => {
        console.log('[SessionStore] Migrating existing state to default session...');
        
        const partyStore = usePartyStore.getState();
        const gameState = useGameStateStore.getState();
        const chatStore = useChatStore.getState();
        
        // Check if there's any existing state to migrate
        const hasExistingState = 
          partyStore.activePartyId ||
          gameState.activeWorldId ||
          chatStore.currentSessionId;
        
        if (!hasExistingState) {
          console.log('[SessionStore] No existing state to migrate');
          return;
        }
        
        // Create a default session wrapping the existing state
        const id = generateId();
        
        const defaultSession: CampaignSession = {
          id,
          name: 'Default Campaign',
          description: 'Migrated from existing game state',
          partyId: partyStore.activePartyId,
          worldId: gameState.activeWorldId,
          chatSessionId: chatStore.currentSessionId,
          activeCharacterId: gameState.activeCharacterId,
          createdAt: Date.now(),
          lastPlayedAt: Date.now(),
          playtime: 0,
          snapshot: createDefaultSnapshot(),
        };
        
        set({
          sessions: [defaultSession],
          activeSessionId: id,
          sessionStartTime: Date.now(),
        });
        
        // Update snapshot with current data
        setTimeout(() => get().updateSnapshot(id), 100);
        
        console.log('[SessionStore] Created default session from existing state');
      },
    }),
    {
      name: 'quest-keeper-sessions',
      partialize: (state) => ({
        sessions: state.sessions,
        activeSessionId: state.activeSessionId,
      }),
    }
  )
);

// ============================================
// Exports for orchestration
// ============================================

export const sessionStore = {
  getState: useSessionStore.getState,
  subscribe: useSessionStore.subscribe,
};
