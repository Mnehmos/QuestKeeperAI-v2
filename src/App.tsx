import { useEffect } from "react";
import { AppLayout } from "./components/layout/AppLayout";
import { mcpManager } from "./services/mcpClient";
import { useGameStateStore } from "./stores/gameStateStore";
import { useCombatStore } from "./stores/combatStore";
import { usePartyStore } from "./stores/partyStore";
import { useSessionStore } from "./stores/sessionStore";
import { eventPoller } from "./services/eventPoller";
import "./App.css";
import { useUIStore } from "./stores/uiStore";
import { CharacterCreationModal } from "./components/adventure/CharacterCreationModal";
import { CampaignSetupWizard } from "./components/session/CampaignSetupWizard";

function App() {
  const syncState = useGameStateStore((state) => state.syncState);
  const syncCombatState = useCombatStore((state) => state.syncCombatState);
  const initializeParty = usePartyStore((state) => state.initialize);
  const initializeSession = useSessionStore((state) => state.initialize);
  
  // UI Store for modal control
  const showCharacterModal = useUIStore((state) => state.showCharacterModal);
  const closeCharacterModal = useUIStore((state) => state.closeCharacterModal);
  const characterModalCallback = useUIStore((state) => state.characterModalCallback);
  
  // Campaign Wizard modal
  const showCampaignWizard = useUIStore((state) => state.showCampaignWizard);
  const closeCampaignWizard = useUIStore((state) => state.closeCampaignWizard);
  const campaignWizardCallback = useUIStore((state) => state.campaignWizardCallback);

  useEffect(() => {
    const initMcp = async () => {
      try {
        await mcpManager.initializeAll();
        console.log("[App] MCP Initialized successfully");

        // Start autonomous event polling
        eventPoller.start();

        // Initialize party store first (it will sync active character to gameState)
        console.log("[App] Initializing party store...");
        await initializeParty();
        
        // Initialize session store (migrates existing state if needed)
        console.log("[App] Initializing session store...");
        initializeSession();

        // Initial sync for game state (will respect party's active character)
        console.log("[App] Starting initial state sync...");
        syncState();
        syncCombatState();
      } catch (error) {
        console.error("[App] Failed to initialize MCP:", error);
      }
    };
    initMcp();

    // Poll for game state updates every 30 seconds (reduced from 5s)
    // Note: State is now synced automatically after LLM tool calls, 
    // so this is just a backup for any changes made outside the LLM flow
    const interval = setInterval(() => {
      syncState();
      syncCombatState();
    }, 30000);

    return () => {
      clearInterval(interval);
      eventPoller.stop();
    };
  }, []); // Empty dependency array to run only once on mount

  return (
    <>
      <AppLayout />
      <CharacterCreationModal 
        isOpen={showCharacterModal} 
        onClose={(newCharacterId) => {
            closeCharacterModal();
            if (characterModalCallback) characterModalCallback(newCharacterId || '');
        }}
      />
      <CampaignSetupWizard
        isOpen={showCampaignWizard}
        onClose={closeCampaignWizard}
        onComplete={(sessionId, initialPrompt) => {
          closeCampaignWizard();
          if (campaignWizardCallback) campaignWizardCallback(sessionId, initialPrompt);
        }}
      />
    </>
  );
}

export default App;

