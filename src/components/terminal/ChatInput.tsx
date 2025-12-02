import React, { useState } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { mcpManager } from '../../services/mcpClient';
import { useGameStateStore } from '../../stores/gameStateStore';
import { useCombatStore } from '../../stores/combatStore';
import { useUIStore, ActiveTab } from '../../stores/uiStore';

// Helper to categorize tools
function categorizeTools(tools: any[]): Record<string, any[]> {
  const categories: Record<string, any[]> = {
    'Events': [],
    'World Generation': [],
    'Combat': [],
    'Characters': [],
    'Inventory': [],
    'Quests': [],
    'Math & Dice': [],
    'Grand Strategy': [],
    'Turn Management': [],
    'Other': []
  };

  for (const tool of tools) {
    const name = tool.name;
    if (name.includes('subscribe') || name.includes('event')) {
      categories['Events'].push(tool);
    } else if (name.includes('world') || name.includes('map') || name.includes('region')) {
      categories['World Generation'].push(tool);
    } else if (name.includes('encounter') || name.includes('combat') || name.includes('advance_turn') && !name.includes('nation')) {
      categories['Combat'].push(tool);
    } else if (name.includes('character')) {
      categories['Characters'].push(tool);
    } else if (name.includes('item') || name.includes('inventory') || name.includes('equip')) {
      categories['Inventory'].push(tool);
    } else if (name.includes('quest') || name.includes('objective')) {
      categories['Quests'].push(tool);
    } else if (name.includes('dice') || name.includes('probability') || name.includes('algebra') || name.includes('physics')) {
      categories['Math & Dice'].push(tool);
    } else if (name.includes('nation') || name.includes('alliance') || name.includes('claim') || name.includes('strategy')) {
      categories['Grand Strategy'].push(tool);
    } else if (name.includes('turn') || name.includes('ready') || name.includes('poll')) {
      categories['Turn Management'].push(tool);
    } else {
      categories['Other'].push(tool);
    }
  }

  // Remove empty categories
  for (const key of Object.keys(categories)) {
    if (categories[key].length === 0) {
      delete categories[key];
    }
  }

  return categories;
}

// Format tools into readable output
function formatToolsOutput(tools: any[]): string {
  const categories = categorizeTools(tools);
  let output = `## MCP Server Connected ✓\n\n`;
  output += `**Total Tools:** ${tools.length}\n\n`;

  for (const [category, categoryTools] of Object.entries(categories)) {
    output += `### ${category} (${categoryTools.length})\n`;
    for (const tool of categoryTools) {
      output += `- \`${tool.name}\`\n`;
    }
    output += '\n';
  }

  output += `---\n*Server: rpg-mcp | Protocol: MCP v2024-11-05*`;
  return output;
}

// Slash command handlers
interface CommandResult {
  content: string;
  type?: 'text' | 'info' | 'error' | 'success';
}

async function handleSlashCommand(command: string, args: string): Promise<CommandResult | null> {
  const gameState = useGameStateStore.getState();
  const combatState = useCombatStore.getState();
  const uiStore = useUIStore.getState();

  switch (command) {
    // === SYSTEM COMMANDS ===
    case 'test': {
      const result = await mcpManager.gameStateClient.listTools();
      const tools = result?.tools || [];
      return { content: formatToolsOutput(tools) };
    }

    case 'help': {
      return {
        content: `## Quest Keeper AI Commands

### 📡 System
| Command | Description |
|---------|-------------|
| \`/test\` | Test MCP server connection |
| \`/status\` | Show current game state summary |
| \`/sync\` | Force sync all state from server |
| \`/debug\` | Show debug info (IDs, connection status) |
| \`/clear\` | Clear chat history |

### 🎭 Characters
| Command | Description |
|---------|-------------|
| \`/characters\` | List all characters |
| \`/character [id]\` | Show character details (current if no ID) |
| \`/party\` | Show party summary |

### 🎒 Inventory & Items
| Command | Description |
|---------|-------------|
| \`/inventory\` | Show current character's inventory |
| \`/items\` | List all item templates |

### 📜 Quests
| Command | Description |
|---------|-------------|
| \`/quests\` | Show active quests |
| \`/questlog\` | Show full quest log |

### ⚔️ Combat
| Command | Description |
|---------|-------------|
| \`/combat\` | Show current combat state |
| \`/initiative\` | Show initiative order |

### 🌍 World
| Command | Description |
|---------|-------------|
| \`/worlds\` | List all worlds |
| \`/world [id]\` | Show world details |

### 🎲 Dice & Math
| Command | Description |
|---------|-------------|
| \`/roll <expr>\` | Quick dice roll (e.g., \`/roll 2d6+3\`) |
| \`/adv <expr>\` | Roll with advantage |
| \`/dis <expr>\` | Roll with disadvantage |

### 🖥️ UI
| Command | Description |
|---------|-------------|
| \`/tab <n>\` | Switch tab (adventure, combat, character, map, journal, settings) |

### 🔒 Secret Keeper
| Command | Description |
|---------|-------------|
| \`/secrets\` | Show player-hidden secrets for current world/quest |

---
*Type naturally to interact with the AI, or use commands for quick actions.*`
      };
    }

    case 'status': {
      const activeChar = gameState.activeCharacter;
      const party = gameState.party;
      const inventory = gameState.inventory;
      const encounterId = combatState.activeEncounterId;
      const combatants = combatState.entities;

      let status = `## Game Status\n\n`;

      // Character
      if (activeChar) {
        status += `### Active Character\n`;
        status += `**${activeChar.name}** - Level ${activeChar.level} ${activeChar.class || ''}\n`;
        status += `HP: ${activeChar.hp?.current || 0}/${activeChar.hp?.max || 0}\n\n`;
      } else {
        status += `### Active Character\n*No character selected*\n\n`;
      }

      // Party
      status += `### Party\n`;
      status += party.length > 0 ? `${party.length} member(s)\n\n` : `*No party members*\n\n`;

      // Inventory
      status += `### Inventory\n`;
      status += `${inventory.length} item(s)\n\n`;

      // Combat
      status += `### Combat\n`;
      if (encounterId) {
        status += `**Active Encounter:** ${encounterId}\n`;
        status += `Combatants: ${combatants.length}\n\n`;
      } else {
        status += `*No active combat*\n\n`;
      }

      // Connection
      status += `### MCP Connection\n`;
      status += mcpManager.gameStateClient.isConnected() ? `✓ Connected` : `✗ Disconnected`;

      return { content: status };
    }

    case 'sync': {
      try {
        await gameState.syncState();
        await combatState.syncCombatState();
        return { content: `✓ State synchronized successfully`, type: 'success' };
      } catch (error: any) {
        return { content: `✗ Sync failed: ${error.message}`, type: 'error' };
      }
    }

    case 'debug': {
      const activeChar = gameState.activeCharacter;
      const encounterId = combatState.activeEncounterId;

      let debug = `## Debug Info\n\n`;
      debug += `### IDs\n`;
      debug += `- Active Character ID: \`${activeChar?.id || 'none'}\`\n`;
      debug += `- Active Encounter ID: \`${encounterId || 'none'}\`\n\n`;

      debug += `### MCP Status\n`;
      debug += `- Game State Client: ${mcpManager.gameStateClient.isConnected() ? '✓ Connected' : '✗ Disconnected'}\n`;
      debug += `- Combat Client: ${mcpManager.combatClient.isConnected() ? '✓ Connected' : '✗ Disconnected'}\n\n`;

      debug += `### Store Sizes\n`;
      debug += `- Party: ${gameState.party.length}\n`;
      debug += `- Inventory: ${gameState.inventory.length}\n`;
      debug += `- Notes: ${gameState.notes.length}\n`;
      debug += `- Combatants: ${combatState.entities.length}\n`;
      debug += `- Terrain: ${combatState.terrain.length}\n`;

      return { content: debug };
    }

    case 'clear': {
      useChatStore.getState().clearHistory();
      return { content: `✓ Chat cleared`, type: 'success' };
    }

    // === CHARACTER COMMANDS ===
    case 'characters': {
      try {
        const result = await mcpManager.gameStateClient.callTool('list_characters', {});
        const text = result?.content?.[0]?.text || '[]';
        
        // Try to parse as JSON, otherwise treat as message
        let chars;
        try {
          chars = JSON.parse(text);
        } catch {
          return { content: text }; // Return as-is if not JSON
        }

        if (!Array.isArray(chars) || chars.length === 0) {
          return { content: `*No characters found*\n\nUse the AI to create a character: "Create a fighter named Valeros"` };
        }

        let output = `## Characters (${chars.length})\n\n`;
        for (const char of chars) {
          output += `### ${char.name}\n`;
          output += `- **ID:** \`${char.id}\`\n`;
          output += `- **Level:** ${char.level || 1}\n`;
          output += `- **HP:** ${char.hp || 0}/${char.maxHp || 0}\n`;
          output += `- **AC:** ${char.ac || 10}\n\n`;
        }
        return { content: output };
      } catch (error: any) {
        return { content: `Error listing characters: ${error.message}`, type: 'error' };
      }
    }

    case 'character': {
      try {
        const charId = args.trim() || gameState.activeCharacter?.id;
        if (!charId) {
          return { content: `No character ID provided and no active character.\n\nUsage: \`/character <id>\` or set an active character first.`, type: 'error' };
        }

        const result = await mcpManager.gameStateClient.callTool('get_character', { id: charId });
        const text = result?.content?.[0]?.text || 'null';
        
        let char;
        try {
          char = JSON.parse(text);
        } catch {
          return { content: text };
        }

        if (!char) {
          return { content: `Character not found: ${charId}`, type: 'error' };
        }

        let output = `## ${char.name}\n\n`;
        output += `**ID:** \`${char.id}\`\n`;
        output += `**Level:** ${char.level || 1}\n`;
        output += `**HP:** ${char.hp || 0}/${char.maxHp || 0}\n`;
        output += `**AC:** ${char.ac || 10}\n\n`;

        if (char.stats) {
          output += `### Ability Scores\n`;
          output += `| STR | DEX | CON | INT | WIS | CHA |\n`;
          output += `|-----|-----|-----|-----|-----|-----|\n`;
          output += `| ${char.stats.str || 10} | ${char.stats.dex || 10} | ${char.stats.con || 10} | ${char.stats.int || 10} | ${char.stats.wis || 10} | ${char.stats.cha || 10} |\n`;
        }

        return { content: output };
      } catch (error: any) {
        return { content: `Error getting character: ${error.message}`, type: 'error' };
      }
    }

    case 'party': {
      const party = gameState.party;
      if (party.length === 0) {
        return { content: `*No party members*\n\nCreate characters using the AI.` };
      }

      let output = `## Party (${party.length})\n\n`;
      for (const member of party) {
        const isActive = member.id === gameState.activeCharacter?.id;
        output += `### ${member.name} ${isActive ? '(Active)' : ''}\n`;
        output += `Level ${member.level || 1} ${member.class || ''}\n`;
        output += `HP: ${member.hp?.current || 0}/${member.hp?.max || 0}\n\n`;
      }
      return { content: output };
    }

    // === INVENTORY COMMANDS ===
    case 'inventory': {
      try {
        const charId = gameState.activeCharacter?.id;
        if (!charId) {
          return { content: `No active character. Select a character first.`, type: 'error' };
        }

        const result = await mcpManager.gameStateClient.callTool('get_inventory', { characterId: charId });
        const text = result?.content?.[0]?.text || '[]';
        
        let items;
        try {
          items = JSON.parse(text);
        } catch {
          return { content: text };
        }

        if (!Array.isArray(items) || items.length === 0) {
          return { content: `*Inventory is empty*` };
        }

        let output = `## Inventory (${items.length} items)\n\n`;
        output += `| Item | Type | Qty | Equipped |\n`;
        output += `|------|------|-----|----------|\n`;
        for (const item of items) {
          output += `| ${item.name} | ${item.type || '-'} | ${item.quantity || 1} | ${item.equipped ? '✓' : '-'} |\n`;
        }
        return { content: output };
      } catch (error: any) {
        return { content: `Error getting inventory: ${error.message}`, type: 'error' };
      }
    }

    case 'items': {
      return { content: `Item templates are created with the \`create_item_template\` tool.\n\nAsk the AI: "Create a longsword item template"` };
    }

    // === QUEST COMMANDS ===
    case 'quests':
    case 'questlog': {
      try {
        const charId = gameState.activeCharacter?.id;
        if (!charId) {
          return { content: `No active character. Select a character first.`, type: 'error' };
        }

        const result = await mcpManager.gameStateClient.callTool('get_quest_log', { characterId: charId });
        const text = result?.content?.[0]?.text || '[]';
        
        let quests;
        try {
          quests = JSON.parse(text);
        } catch {
          return { content: text };
        }

        if (!Array.isArray(quests) || quests.length === 0) {
          return { content: `*No active quests*\n\nAsk the AI to create a quest.` };
        }

        let output = `## Quest Log (${quests.length})\n\n`;
        for (const quest of quests) {
          output += `### ${quest.name}\n`;
          output += `**Status:** ${quest.status || 'active'}\n`;
          output += `${quest.description || ''}\n\n`;

          if (quest.objectives && quest.objectives.length > 0) {
            output += `**Objectives:**\n`;
            for (const obj of quest.objectives) {
              const done = obj.completed ? '✓' : '○';
              output += `- ${done} ${obj.description} (${obj.current || 0}/${obj.required})\n`;
            }
            output += '\n';
          }
        }
        return { content: output };
      } catch (error: any) {
        return { content: `Error getting quests: ${error.message}`, type: 'error' };
      }
    }

    // === COMBAT COMMANDS ===
    case 'combat': {
      const encounterId = combatState.activeEncounterId;
      if (!encounterId) {
        return { content: `*No active combat*\n\nStart combat by asking the AI: "Start combat with 2 goblins"` };
      }

      try {
        const result = await mcpManager.gameStateClient.callTool('get_encounter_state', { encounterId });
        const text = result?.content?.[0]?.text || 'null';
        
        let encounter;
        try {
          encounter = JSON.parse(text);
        } catch {
          return { content: text };
        }

        if (!encounter) {
          return { content: `Could not retrieve encounter state`, type: 'error' };
        }

        let output = `## Combat - Round ${encounter.round || 1}\n\n`;
        output += `**Encounter ID:** \`${encounterId}\`\n\n`;

        output += `### Initiative Order\n`;
        output += `| # | Name | HP | Conditions |\n`;
        output += `|---|------|----|-----------|\n`;

        const participants = encounter.participants || [];
        for (let i = 0; i < participants.length; i++) {
          const p = participants[i];
          const isCurrent = i === encounter.currentTurn;
          const marker = isCurrent ? '→' : (i + 1).toString();
          output += `| ${marker} | ${p.name} | ${p.hp}/${p.maxHp} | ${(p.conditions || []).join(', ') || '-'} |\n`;
        }

        return { content: output };
      } catch (error: any) {
        return { content: `Error getting combat state: ${error.message}`, type: 'error' };
      }
    }

    case 'initiative': {
      const combatants = combatState.entities;
      if (combatants.length === 0) {
        return { content: `*No combatants*` };
      }

      let output = `## Initiative Order\n\n`;
      // Use turnOrder from combatState if available, otherwise just list entities
      const turnOrder = combatState.turnOrder || [];
      if (turnOrder.length > 0) {
        for (let i = 0; i < turnOrder.length; i++) {
          const name = turnOrder[i];
          const entity = combatants.find(c => c.name === name);
          const hp = entity?.metadata?.hp;
          output += `${i + 1}. **${name}** - ${hp?.current || 0}/${hp?.max || 0} HP\n`;
        }
      } else {
        for (let i = 0; i < combatants.length; i++) {
          const c = combatants[i];
          output += `${i + 1}. **${c.name}** - ${c.metadata?.hp?.current || 0}/${c.metadata?.hp?.max || 0} HP\n`;
        }
      }
      return { content: output };
    }

    // === WORLD COMMANDS ===
    case 'worlds': {
      try {
        const result = await mcpManager.gameStateClient.callTool('list_worlds', {});
        const text = result?.content?.[0]?.text || '[]';
        
        let worlds;
        try {
          worlds = JSON.parse(text);
        } catch {
          return { content: text };
        }

        if (!Array.isArray(worlds) || worlds.length === 0) {
          return { content: `*No worlds created*\n\nAsk the AI: "Create a new world called Eldoria"` };
        }

        let output = `## Worlds (${worlds.length})\n\n`;
        for (const world of worlds) {
          output += `### ${world.name}\n`;
          output += `- **ID:** \`${world.id}\`\n`;
          output += `- **Size:** ${world.width}x${world.height}\n`;
          output += `- **Seed:** ${world.seed}\n\n`;
        }
        return { content: output };
      } catch (error: any) {
        return { content: `Error listing worlds: ${error.message}`, type: 'error' };
      }
    }

    case 'world': {
      const worldId = args.trim();
      if (!worldId) {
        return { content: `Usage: \`/world <id>\`\n\nUse \`/worlds\` to list available worlds.`, type: 'error' };
      }

      try {
        const result = await mcpManager.gameStateClient.callTool('get_world', { id: worldId });
        const text = result?.content?.[0]?.text || 'null';
        
        let world;
        try {
          world = JSON.parse(text);
        } catch {
          return { content: text };
        }

        if (!world) {
          return { content: `World not found: ${worldId}`, type: 'error' };
        }

        let output = `## ${world.name}\n\n`;
        output += `**ID:** \`${world.id}\`\n`;
        output += `**Size:** ${world.width}x${world.height}\n`;
        output += `**Seed:** ${world.seed}\n`;

        return { content: output };
      } catch (error: any) {
        return { content: `Error getting world: ${error.message}`, type: 'error' };
      }
    }

    // === DICE COMMANDS ===
    case 'roll': {
      if (!args.trim()) {
        return { content: `Usage: \`/roll <expression>\`\n\nExamples:\n- \`/roll 1d20+5\`\n- \`/roll 4d6dl1\` (drop lowest)\n- \`/roll 2d6!\` (exploding)`, type: 'error' };
      }

      try {
        // Use 'steps' format to get detailed breakdown
        const result = await mcpManager.gameStateClient.callTool('dice_roll', { 
          expression: args.trim(),
          exportFormat: 'steps'
        });
        const text = result?.content?.[0]?.text || '';
        
        // The 'steps' format returns multi-line text like:
        // Input: 2d6+3
        // Result: 12
        // 
        // Steps:
        // 1. Rolled 2d6: [4, 5]
        // 2. Total: 12
        
        let output = `## 🎲 ${args.trim()}\n\n`;
        output += '```\n' + text + '\n```';

        return { content: output };
      } catch (error: any) {
        return { content: `Dice roll error: ${error.message}`, type: 'error' };
      }
    }

    case 'adv': {
      if (!args.trim()) {
        return { content: `Usage: \`/adv <expression>\` - Roll with advantage\n\nExample: \`/adv 1d20+5\``, type: 'error' };
      }

      try {
        const expr = args.trim();
        // Convert 1d20 to 2d20kh1 (keep highest 1)
        const advExpr = expr.replace(/(\d*)d20/i, '2d20kh1');
        const result = await mcpManager.gameStateClient.callTool('dice_roll', { 
          expression: advExpr,
          exportFormat: 'steps'
        });
        const text = result?.content?.[0]?.text || '';

        let output = `## 🎲 ${expr} (Advantage)\n\n`;
        output += '```\n' + text + '\n```';

        return { content: output };
      } catch (error: any) {
        return { content: `Dice roll error: ${error.message}`, type: 'error' };
      }
    }

    case 'dis': {
      if (!args.trim()) {
        return { content: `Usage: \`/dis <expression>\` - Roll with disadvantage\n\nExample: \`/dis 1d20+5\``, type: 'error' };
      }

      try {
        const expr = args.trim();
        // Convert 1d20 to 2d20kl1 (keep lowest 1)
        const disExpr = expr.replace(/(\d*)d20/i, '2d20kl1');
        const result = await mcpManager.gameStateClient.callTool('dice_roll', { 
          expression: disExpr,
          exportFormat: 'steps'
        });
        const text = result?.content?.[0]?.text || '';

        let output = `## 🎲 ${expr} (Disadvantage)\n\n`;
        output += '```\n' + text + '\n```';

        return { content: output };
      } catch (error: any) {
        return { content: `Dice roll error: ${error.message}`, type: 'error' };
      }
    }

    // === SECRET KEEPER COMMANDS ===
    case 'secrets': {
      try {
        const worldId = gameState.activeWorldId;
        if (!worldId) {
          return { content: `No active world. Select a world first.`, type: 'error' };
        }

        const result = await mcpManager.gameStateClient.callTool('get_secrets', { worldId });
        const text = result?.content?.[0]?.text || '{}';

        let secrets;
        try {
          secrets = JSON.parse(text);
        } catch {
          return { content: text };
        }

        if (!secrets || (Array.isArray(secrets) && secrets.length === 0) || Object.keys(secrets).length === 0) {
          return { content: `*No secrets stored for this world*\n\nSecrets are automatically created during world/quest generation.` };
        }

        let output = `## 🔒 Secret Keeper - Hidden Information\n\n`;
        output += `**World:** ${gameState.worlds?.find((w: any) => w.id === worldId)?.name || worldId}\n\n`;
        output += `> **WARNING:** This information is hidden from players!\n\n`;

        // Format secrets based on structure
        if (Array.isArray(secrets)) {
          for (const secret of secrets) {
            output += `### ${secret.type || 'Secret'}\n`;
            output += `**ID:** \`${secret.id}\`\n`;
            if (secret.description) output += `${secret.description}\n`;
            if (secret.revealCondition) output += `*Reveal when:* ${secret.revealCondition}\n`;
            output += '\n';
          }
        } else {
          // Object format
          for (const [key, value] of Object.entries(secrets)) {
            output += `### ${key}\n`;
            if (typeof value === 'object') {
              output += '```json\n' + JSON.stringify(value, null, 2) + '\n```\n\n';
            } else {
              output += `${value}\n\n`;
            }
          }
        }

        return { content: output };
      } catch (error: any) {
        return { content: `Error getting secrets: ${error.message}`, type: 'error' };
      }
    }

    // === UI COMMANDS ===
    case 'tab': {
      const validTabs: ActiveTab[] = ['adventure', 'combat', 'character', 'map', 'journal', 'settings'];
      const tab = args.trim().toLowerCase() as ActiveTab;

      if (!tab || !validTabs.includes(tab)) {
        return { content: `Usage: \`/tab <n>\`\n\nValid tabs: ${validTabs.join(', ')}`, type: 'error' };
      }

      uiStore.setActiveTab(tab);
      return { content: `Switched to **${tab}** tab`, type: 'success' };
    }

    default:
      return null; // Not a recognized command
  }
}

export const ChatInput: React.FC = () => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const addMessage = useChatStore((state) => state.addMessage);
  const getMessages = useChatStore((state) => state.getMessages);
  const startStreamingMessage = useChatStore((state) => state.startStreamingMessage);
  const updateStreamingMessage = useChatStore((state) => state.updateStreamingMessage);
  const updateToolStatus = useChatStore((state) => state.updateToolStatus);
  const finalizeStreamingMessage = useChatStore((state) => state.finalizeStreamingMessage);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const currentInput = input;
    setInput('');
    setIsLoading(true);

    // Add user message
    addMessage({
      id: Date.now().toString(),
      sender: 'user',
      content: currentInput,
      timestamp: Date.now(),
      type: 'text',
    });

    // Check for slash commands
    if (currentInput.startsWith('/')) {
      const spaceIndex = currentInput.indexOf(' ');
      const command = spaceIndex === -1 
        ? currentInput.slice(1).toLowerCase() 
        : currentInput.slice(1, spaceIndex).toLowerCase();
      const args = spaceIndex === -1 ? '' : currentInput.slice(spaceIndex + 1);

      try {
        const result = await handleSlashCommand(command, args);

        if (result) {
          addMessage({
            id: Date.now().toString() + '-ai',
            sender: result.type === 'error' ? 'system' : 'ai',
            content: result.content,
            timestamp: Date.now(),
            type: result.type || 'text',
          });
        } else {
          // Unknown command
          addMessage({
            id: Date.now().toString() + '-err',
            sender: 'system',
            content: `Unknown command: \`/${command}\`\n\nType \`/help\` for available commands.`,
            timestamp: Date.now(),
            type: 'error',
          });
        }
      } catch (error: any) {
        addMessage({
          id: Date.now().toString() + '-err',
          sender: 'system',
          content: `Command error: ${error.message}`,
          timestamp: Date.now(),
          type: 'error',
        });
      }

      setIsLoading(false);
      return;
    }

    // Send to LLM with streaming
    try {
      const { useSettingsStore } = await import('../../stores/settingsStore');
      const { llmService } = await import('../../services/llm/LLMService');

      const systemPrompt = useSettingsStore.getState().systemPrompt;
      const currentMessages = getMessages();

      const history: any[] = currentMessages
        .filter(msg => !msg.partial && (msg.sender === 'user' || msg.sender === 'ai'))
        .flatMap(msg => {
          const messages = [];

          const mainMsg: any = {
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.content
          };

          if (msg.isToolCall) {
            mainMsg.toolCalls = [{
              id: msg.toolCallId || msg.toolName,
              type: 'function',
              function: {
                name: msg.toolName,
                arguments: JSON.stringify(msg.toolArguments)
              }
            }];
          }

          messages.push(mainMsg);

          if (msg.isToolCall && msg.toolResponse) {
            messages.push({
              role: 'tool',
              toolCallId: msg.toolCallId || msg.toolName,
              content: msg.toolResponse
            });
          }

          return messages;
        });

      if (systemPrompt) {
        history.unshift({ role: 'system', content: systemPrompt });
      }

      // Inject active selection context so the LLM uses the UI-selected character/world by default
      try {
        const { useGameStateStore } = await import('../../stores/gameStateStore');
        const gameState = useGameStateStore.getState();
        const activeChar = gameState.activeCharacter;
        const activeWorldId = gameState.activeWorldId;
        const activeWorld = (gameState.worlds || []).find((w: any) => w.id === activeWorldId);

        const selectionContext = [
          'Use the UI-selected character and world as defaults; do NOT ask for IDs if not necessary.',
          activeChar
            ? `Active character: ${activeChar.name} (id: ${activeChar.id || 'unknown'}), level ${activeChar.level}, class ${activeChar.class}, HP ${activeChar.hp.current}/${activeChar.hp.max}, AC ${activeChar.stats?.dex ? 10 + Math.floor((activeChar.stats.dex - 10) / 2) : 'n/a'}.`
            : 'No active character selected.',
          activeWorld
            ? `Active world: ${activeWorld.name} (id: ${activeWorld.id || 'unknown'}, size: ${activeWorld.width}x${activeWorld.height}).`
            : 'No active world selected.',
          'If the user asks for inventory/quests/status, default to the active character unless they explicitly name another.'
        ].join('\n');

        history.unshift({ role: 'system', content: selectionContext });

        // Inject world environment context for immersive scene descriptions
        const worldEnv = activeWorld?.environment || gameState.world?.environment || {};
        if (worldEnv && Object.keys(worldEnv).length > 0) {
          const envContext = [
            '--- CURRENT ENVIRONMENT ---',
            worldEnv.date ? `Date: ${typeof worldEnv.date === 'object' ? worldEnv.date.full_date : worldEnv.date}` : null,
            worldEnv.time_of_day || worldEnv.timeOfDay ? `Time of Day: ${worldEnv.time_of_day || worldEnv.timeOfDay}` : null,
            worldEnv.season ? `Season: ${typeof worldEnv.season === 'object' ? worldEnv.season.current : worldEnv.season}` : null,
            worldEnv.weather || worldEnv.weatherConditions ? `Weather: ${typeof worldEnv.weather === 'object' ? worldEnv.weather.condition : (worldEnv.weather || worldEnv.weatherConditions)}` : null,
            worldEnv.temperature ? `Temperature: ${typeof worldEnv.temperature === 'object' ? worldEnv.temperature.current : worldEnv.temperature}` : null,
            worldEnv.lighting ? `Lighting: ${typeof worldEnv.lighting === 'object' ? worldEnv.lighting.overall : worldEnv.lighting}` : null,
            worldEnv.moon_phase || worldEnv.moonPhase ? `Moon Phase: ${typeof (worldEnv.moon_phase || worldEnv.moonPhase) === 'object' ? (worldEnv.moon_phase || worldEnv.moonPhase).phase : (worldEnv.moon_phase || worldEnv.moonPhase)}` : null,
            'Use this environment data when describing scenes or when the player asks about weather/time/conditions.'
          ].filter(Boolean).join('\n');

          history.unshift({ role: 'system', content: envContext });
        }

        // Inject secrets context for the Secret Keeper system (GM-only knowledge)
        if (activeWorldId) {
          try {
            const secretsResult = await mcpManager.gameStateClient.callTool('get_secrets', { worldId: activeWorldId });
            const secretsText = secretsResult?.content?.[0]?.text || '{}';
            let secrets;
            try {
              secrets = JSON.parse(secretsText);
            } catch {
              secrets = null;
            }

            if (secrets && Object.keys(secrets).length > 0) {
              const secretsContext = [
                '--- SECRET KEEPER: GM-ONLY KNOWLEDGE ---',
                'The following secrets are HIDDEN from the player. Use them to guide the narrative but NEVER reveal them directly.',
                'Only hint at secrets when dramatically appropriate. Use spoiler tags for any reveals.',
                '',
                JSON.stringify(secrets, null, 2),
                '',
                'Remember: These secrets enhance the story. Drop hints, create tension, but protect the mystery.',
                '--- END SECRETS ---'
              ].join('\n');

              history.unshift({ role: 'system', content: secretsContext });
            }
          } catch (secretsErr) {
            console.warn('[ChatInput] Failed to fetch secrets for context:', secretsErr);
          }
        }
      } catch (err) {
        console.warn('[ChatInput] Failed to inject selection context into system prompt:', err);
      }

      let currentStreamId = Date.now().toString() + '-ai';
      startStreamingMessage(currentStreamId, 'ai');
      let accumulatedContent = '';

      await llmService.streamMessage(
        history,
        {
          onChunk: (chunk: string) => {
            accumulatedContent += chunk;
            updateStreamingMessage(currentStreamId, accumulatedContent);
          },
          onToolCall: (toolCall: any) => {
            updateStreamingMessage(currentStreamId, undefined, toolCall);
          },
          onToolResult: (_: string, result: any) => {
             updateToolStatus(currentStreamId, 'completed', JSON.stringify(result));
          },
          onStreamStart: () => {
             finalizeStreamingMessage(currentStreamId);
             currentStreamId = Date.now().toString() + '-ai';
             accumulatedContent = '';
             startStreamingMessage(currentStreamId, 'ai');
          },
          onComplete: () => {
            finalizeStreamingMessage(currentStreamId);
            setIsLoading(false);
          },
          onError: (error: string) => {
            addMessage({
              id: Date.now().toString() + '-err',
              sender: 'system',
              content: `Error: ${error}`,
              timestamp: Date.now(),
              type: 'error',
            });
            finalizeStreamingMessage(currentStreamId);
            setIsLoading(false);
          }
        }
      );

    } catch (error: any) {
      addMessage({
        id: Date.now().toString() + '-err',
        sender: 'system',
        content: `LLM Error: ${error.message}`,
        timestamp: Date.now(),
        type: 'error',
      });
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-terminal-green-dim bg-terminal-black">
      <div className="flex gap-2 items-center">
        <div className="flex-grow flex items-center bg-terminal-black border border-terminal-green-dim p-2">
          <span className="text-terminal-green mr-2 font-bold">{'>'}</span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder={isLoading ? "PROCESSING..." : "ENTER_COMMAND..."}
            className="flex-grow bg-transparent focus:outline-none text-terminal-green placeholder-terminal-green/30 font-mono disabled:opacity-50"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 border border-terminal-green text-terminal-green hover:bg-terminal-green hover:text-terminal-black transition-all duration-200 uppercase tracking-wider font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? '...' : 'Execute'}
        </button>
      </div>
    </form>
  );
};
