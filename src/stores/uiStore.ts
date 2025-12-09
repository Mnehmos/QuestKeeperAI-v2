import { create } from 'zustand';

export type ActiveTab = 'adventure' | 'combat' | 'character' | 'map' | 'journal' | 'settings';
export type Theme = 'green' | 'amber';

interface UIState {
  activeTab: ActiveTab;
  isSidebarOpen: boolean;
  theme: Theme;
  setActiveTab: (tab: ActiveTab) => void;
  toggleSidebar: () => void;
  setTheme: (theme: Theme) => void;

  // Character Creation Modal
  showCharacterModal: boolean;
  characterModalCallback: ((characterId: string) => void) | null;
  openCharacterModal: (callback?: (characterId: string) => void) => void;
  closeCharacterModal: () => void;
  
  // Campaign Wizard Modal
  showCampaignWizard: boolean;
  campaignWizardCallback: ((sessionId: string, initialPrompt: string) => void) | null;
  openCampaignWizard: (callback?: (sessionId: string, initialPrompt: string) => void) => void;
  closeCampaignWizard: () => void;
  
  // Session Manager Modal
  showSessionManager: boolean;
  openSessionManager: () => void;
  closeSessionManager: () => void;
  
  // Quick Command Dispatch (for sidebar buttons)
  pendingCommand: string | null;
  setPendingCommand: (command: string) => void;
  clearPendingCommand: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeTab: 'adventure',
  isSidebarOpen: false,
  theme: 'green',
  showCharacterModal: false,
  characterModalCallback: null,
  showCampaignWizard: false,
  campaignWizardCallback: null,
  showSessionManager: false,

  setActiveTab: (activeTab) => set({ activeTab }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setTheme: (theme) => set({ theme }),

  // Character Modal Actions
  openCharacterModal: (callback) => set({ 
    showCharacterModal: true, 
    characterModalCallback: callback || null 
  }),
  closeCharacterModal: () => set({ 
    showCharacterModal: false, 
    characterModalCallback: null 
  }),
  
  // Campaign Wizard Actions
  openCampaignWizard: (callback) => set({
    showCampaignWizard: true,
    campaignWizardCallback: callback || null
  }),
  closeCampaignWizard: () => set({
    showCampaignWizard: false,
    campaignWizardCallback: null
  }),
  
  // Session Manager Actions
  openSessionManager: () => set({ showSessionManager: true }),
  closeSessionManager: () => set({ showSessionManager: false }),
  
  // Quick Command Dispatch
  pendingCommand: null,
  setPendingCommand: (command) => set({ pendingCommand: command }),
  clearPendingCommand: () => set({ pendingCommand: null }),
}));
