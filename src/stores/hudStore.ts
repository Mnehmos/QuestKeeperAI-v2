import { create } from 'zustand';

interface HudState {
  // Panel Visibility
  isInventoryOpen: boolean;
  isRestPanelOpen: boolean;
  isLootPanelOpen: boolean;
  activePanel: 'none' | 'character' | 'inventory' | 'party';
  
  // Selection mirrors combatStore but manages UI-specifics
  selectedEntityId: string | null;
  
  // Quick Action / Intent Input
  quickActionText: string | null;

  // Actions
  toggleInventory: () => void;
  toggleRestPanel: () => void;
  toggleLootPanel: () => void;
  setActivePanel: (panel: HudState['activePanel']) => void;
  setSelectedEntityId: (id: string | null) => void;
  setQuickActionText: (text: string | null) => void;
  
  // Computed helpers could go here or as separate hooks
}

export const useHudStore = create<HudState>((set) => ({
  isInventoryOpen: false,
  isRestPanelOpen: false,
  isLootPanelOpen: false,
  activePanel: 'none',
  selectedEntityId: null,
  quickActionText: null,

  toggleInventory: () => set((state) => ({ 
    isInventoryOpen: !state.isInventoryOpen,
    activePanel: !state.isInventoryOpen ? 'inventory' : 'none'
  })),

  toggleRestPanel: () => set((state) => ({ 
    isRestPanelOpen: !state.isRestPanelOpen 
  })),

  toggleLootPanel: () => set((state) => ({ 
    isLootPanelOpen: !state.isLootPanelOpen 
  })),

  setActivePanel: (panel) => set({ activePanel: panel }),
  
  setSelectedEntityId: (id) => set({ selectedEntityId: id }),
  
  setQuickActionText: (text) => set({ quickActionText: text })
}));

