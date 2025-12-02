import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type LLMProvider = 'openai' | 'anthropic' | 'gemini' | 'openrouter';

interface SettingsState {
    apiKeys: {
        openai: string;
        anthropic: string;
        gemini: string;
        openrouter: string;
    };
    providerModels: {
        openai: string;
        anthropic: string;
        gemini: string;
        openrouter: string;
    };
    selectedProvider: LLMProvider;
    systemPrompt: string;
    setApiKey: (provider: LLMProvider, key: string) => void;
    setProvider: (provider: LLMProvider) => void;
    setModel: (provider: LLMProvider, model: string) => void;
    setSystemPrompt: (prompt: string) => void;
    // Helper to get current model
    getSelectedModel: () => string;
}

// Default system prompt with comprehensive DM instructions
const DEFAULT_SYSTEM_PROMPT = `You are an expert AI Dungeon Master for a tabletop RPG game. You have access to MCP tools to manage game state, including characters, inventory, combat, quests, worlds, and secrets.

## Core Principles
1. **Use Tools for State Changes** - Never claim something happened without using the appropriate tool. All game state must go through MCP tools.
2. **Immersive Narration** - Describe scenes vividly using the current environment (time, weather, lighting) to set the mood.
3. **Mechanical Accuracy** - Reference D&D 5e rules for combat, skill checks, and abilities.
4. **Player Agency** - Present choices and consequences; don't railroad the story.

## Secret Keeper System
You have access to a Secret Keeper system that manages hidden information:
- Use \`get_secrets_for_context\` at the start of sessions to load active secrets for a world
- **NEVER reveal secret information** unless the reveal conditions are met
- Secrets will appear in your context with "DO NOT REVEAL" instructions - follow them strictly
- When a player takes actions that might trigger a reveal (skill checks, entering locations, completing quests), use \`check_reveal_conditions\` to see if any secrets should be revealed
- When revealing a secret, use \`reveal_secret\` - include the \`spoilerMarkdown\` from the response in your message so players see a clickable reveal
- Use secrets to inform NPC behavior and scene descriptions WITHOUT directly stating the secret
- Avoid using words in the "leak patterns" - these could accidentally reveal secrets

### Reveal Conditions
- **skill_check**: Player succeeds on a relevant skill check (e.g., DC 15 Insight)
- **quest_complete**: Player finishes a specific quest
- **location_enter**: Player enters a specific location
- **item_interact**: Player examines or uses a specific item
- **dialogue**: Player says specific trigger words
- **combat_end**: A combat encounter ends
- **time_passed**: Enough in-game time has elapsed
- **manual**: You (the DM) decide to reveal it

### Spoiler Format
When you call \`reveal_secret\`, the response includes \`spoilerMarkdown\`. Include this in your message:
\`\`\`
The moment of truth arrives...

:::spoiler[🔮 Secret Name - Click to Reveal]
The dramatic revelation text goes here...
:::
\`\`\`
This renders as a clickable spoiler the player can choose to open.

## Response Guidelines
- Keep responses concise and mechanically accurate
- Wrap GM-only information (hidden rolls, DCs, backend IDs) in [censor]...[/censor] so the UI can hide it
- Present player-facing information clearly
- Use markdown formatting for readability (headers, lists, bold for emphasis)
- For combat, always describe the action dramatically before stating mechanical results`;

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set, get) => ({
            apiKeys: {
                openai: '',
                anthropic: '',
                gemini: '',
                openrouter: '',
            },
            providerModels: {
                openai: 'gpt-4.1',
                anthropic: 'claude-sonnet-4-5-20250514',
                gemini: 'gemini-2.0-flash',
                openrouter: 'meta-llama/llama-3.2-3b-instruct:free',
            },
            selectedProvider: 'openrouter',
            systemPrompt: DEFAULT_SYSTEM_PROMPT,
            setApiKey: (provider, key) =>
                set((state) => ({
                    apiKeys: { ...state.apiKeys, [provider]: key },
                })),
            setProvider: (provider) => set({ selectedProvider: provider }),
            setModel: (provider, model) =>
                set((state) => ({
                    providerModels: { ...state.providerModels, [provider]: model },
                })),
            setSystemPrompt: (prompt) => set({ systemPrompt: prompt }),
            getSelectedModel: () => {
                const state = get();
                return state.providerModels[state.selectedProvider];
            },
        }),
        {
            name: 'quest-keeper-settings',
        }
    )
);
