import { useEffect } from "react";
import { AppLayout } from "./components/layout/AppLayout";
import { mcpManager } from "./services/mcpClient";
import { useGameStateStore } from "./stores/gameStateStore";
import { useCombatStore } from "./stores/combatStore";
import { usePartyStore } from "./stores/partyStore";
import "./App.css";

function App() {
  const syncState = useGameStateStore((state) => state.syncState);
  const syncCombatState = useCombatStore((state) => state.syncCombatState);
  const initializeParty = usePartyStore((state) => state.initialize);

  useEffect(() => {
    const initMcp = async () => {
      try {
        await mcpManager.initializeAll();
        console.log("[App] MCP Initialized successfully");

        // Initialize party store first (it will sync active character to gameState)
        console.log("[App] Initializing party store...");
        await initializeParty();

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

    return () => clearInterval(interval);
  }, []); // Empty dependency array to run only once on mount

  return (
    <AppLayout />
  );
}

export default App;
