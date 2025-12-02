# Backend Worker Prompt - Secret Keeper MCP Tools

**Copy this prompt into Claude Code in the rpg-mcp directory**

---

## Prompt

```
You are implementing Secret Keeper MCP tools for the rpg-mcp backend, which powers Quest Keeper AI - a desktop RPG companion.

## Context

The frontend has already implemented:
- System prompt with Secret Keeper instructions
- `/secrets` slash command that calls `get_secrets`
- Context injection that fetches secrets before each LLM call
- Spoiler component for clickable reveals

The backend needs to provide the MCP tools. A `get_secrets` tool may already exist - verify and enhance if needed.

## Your Tasks

### 1. Verify/Implement `get_secrets` Tool

Check if `get_secrets` exists. If not, create it. It should:

```typescript
// Input
{
  worldId: string;
  includeRevealed?: boolean;  // Default false
  types?: string[];           // Filter by type
  linkedEntityId?: string;    // Secrets for specific NPC/item/location
}

// Output
{
  secrets: Secret[]
}
```

### 2. Implement `create_secret` Tool

```typescript
// Input
{
  worldId: string;
  type: 'npc' | 'location' | 'item' | 'quest' | 'plot' | 'mechanic' | 'custom';
  category?: string;          // 'motivation', 'trap', 'puzzle', 'loot', 'weakness', 'twist'
  name: string;
  publicDescription: string;  // What player knows
  secretDescription: string;  // What AI knows (hidden)
  linkedEntityId?: string;
  linkedEntityType?: string;
  sensitivity: 'low' | 'medium' | 'high' | 'critical';
  leakPatterns?: string[];    // Words that might indicate a leak
  revealConditions?: RevealCondition[];
}

// Output
{
  id: string;
  success: true;
  secret: Secret;
}
```

### 3. Implement `reveal_secret` Tool

This is critical - it marks a secret as revealed and returns spoiler markdown:

```typescript
// Input
{
  secretId: string;
  triggeredBy: string;   // "Insight check DC 15", "Quest completed", etc.
  partial?: boolean;     // Hint only, not full reveal
}

// Output
{
  success: boolean;
  secret: Secret;
  spoilerMarkdown: string;  // Formatted for frontend
  narration: string;        // Suggested reveal text
}
```

The `spoilerMarkdown` should be formatted as:
```
:::spoiler[🔮 {secret.name} - Click to Reveal]
{secret.secretDescription}
:::
```

### 4. Implement `check_reveal_conditions` Tool

Checks if any secrets should be revealed based on a game event:

```typescript
// Input
{
  worldId: string;
  event: {
    type: 'skill_check' | 'quest_complete' | 'location_enter' |
          'item_interact' | 'dialogue' | 'combat_end' | 'time_passed';
    skill?: string;      // For skill_check
    result?: number;     // Roll result
    questId?: string;    // For quest_complete
    locationId?: string; // For location_enter
    itemId?: string;     // For item_interact
    text?: string;       // For dialogue triggers
  }
}

// Output
{
  secretsToReveal: Secret[];
  partialReveals: { secretId: string; hintText: string }[];
}
```

### 5. Implement `update_secret` Tool

```typescript
// Input
{
  secretId: string;
  updates: Partial<Secret>;  // Any fields to update
}

// Output
{
  success: boolean;
  secret: Secret;
}
```

### 6. Implement `list_secrets` Tool (DM View)

```typescript
// Input
{
  worldId: string;
  filter?: {
    revealed?: boolean;
    type?: string;
    sensitivity?: string;
  }
}

// Output
{
  secrets: Secret[];
  stats: {
    total: number;
    revealed: number;
    hidden: number;
    bySensitivity: Record<string, number>;
  }
}
```

## Database Schema

Create or update the secrets table:

```sql
CREATE TABLE IF NOT EXISTS secrets (
  id TEXT PRIMARY KEY,
  world_id TEXT NOT NULL,
  type TEXT NOT NULL,
  category TEXT,
  name TEXT NOT NULL,
  public_description TEXT,
  secret_description TEXT NOT NULL,
  linked_entity_id TEXT,
  linked_entity_type TEXT,
  sensitivity TEXT DEFAULT 'medium',
  leak_patterns TEXT,  -- JSON array
  reveal_conditions TEXT,  -- JSON array
  revealed INTEGER DEFAULT 0,
  revealed_at TEXT,
  revealed_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  FOREIGN KEY (world_id) REFERENCES worlds(id)
);

CREATE INDEX IF NOT EXISTS idx_secrets_world ON secrets(world_id);
CREATE INDEX IF NOT EXISTS idx_secrets_revealed ON secrets(revealed);
CREATE INDEX IF NOT EXISTS idx_secrets_linked ON secrets(linked_entity_id);
```

## RevealCondition Type

```typescript
interface RevealCondition {
  type: 'skill_check' | 'quest_complete' | 'item_interact' | 'dialogue' |
        'combat_end' | 'location_enter' | 'time_passed' | 'manual';
  skill?: string;           // "Insight", "Perception", "Arcana"
  dc?: number;              // Difficulty class
  questId?: string;
  itemId?: string;
  locationId?: string;
  npcId?: string;
  dialogueTrigger?: string; // Keyword in dialogue
  hoursRequired?: number;
  partialReveal?: boolean;
  partialText?: string;     // Hint text for partial reveals
}
```

## Implementation Notes

1. **Repository Pattern**: Follow existing repository patterns in the codebase
2. **Tool Registration**: Register tools in the MCP tool registry
3. **Error Handling**: Return proper error messages, don't throw
4. **Logging**: Use existing logger for audit trail
5. **Validation**: Validate worldId exists before operations

## Testing

After implementation, test with:

```bash
# List tools to verify registration
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node dist/index.js

# Create a secret
echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"create_secret","arguments":{"worldId":"test-world","type":"npc","name":"Innkeeper Secret","publicDescription":"A friendly innkeeper","secretDescription":"Actually a vampire","sensitivity":"critical","leakPatterns":["vampire","undead","fangs"]}}}' | node dist/index.js
```

## Build Commands

After implementing all tools:

```bash
# Build TypeScript
npm run build

# Build binaries for all platforms
npm run build:binaries

# Copy Windows binary to frontend
copy bin\rpg-mcp-win.exe "C:\Users\mnehm\Desktop\Quest Keeper AI attempt 2\src-tauri\binaries\rpg-mcp-server-x86_64-pc-windows-msvc.exe"
```

## Success Criteria

- [ ] `get_secrets` returns secrets for a world
- [ ] `create_secret` creates secrets with all fields
- [ ] `reveal_secret` marks revealed and returns spoiler markdown
- [ ] `check_reveal_conditions` evaluates events against conditions
- [ ] `update_secret` modifies existing secrets
- [ ] `list_secrets` provides DM overview with stats
- [ ] All tools registered and visible in tools/list
- [ ] Database schema created/migrated
- [ ] New binary built and copied to frontend

## File Locations (Typical Structure)

```
rpg-mcp/
├── src/
│   ├── tools/
│   │   ├── secrets/           # Create this directory
│   │   │   ├── createSecret.ts
│   │   │   ├── getSecrets.ts
│   │   │   ├── revealSecret.ts
│   │   │   ├── checkRevealConditions.ts
│   │   │   ├── updateSecret.ts
│   │   │   ├── listSecrets.ts
│   │   │   └── index.ts       # Export all
│   │   └── index.ts           # Register secrets tools
│   ├── repositories/
│   │   └── secretRepository.ts
│   ├── types/
│   │   └── secret.ts
│   └── migrations/
│       └── XXX_add_secrets.ts
├── bin/                       # Output binaries
└── package.json
```

When done, confirm:
1. All 6 tools implemented and tested
2. Binary built successfully
3. Binary copied to frontend location
```

---

## Usage

1. Open terminal in `C:\Users\mnehm\AppData\Roaming\Roo-Code\MCP\rpg-mcp`
2. Launch Claude Code: `claude`
3. Paste the prompt above
4. Let it implement the tools
5. Verify the new binary is copied to the frontend

## Expected Outcome

- 6 new MCP tools for Secret Keeper
- Updated database schema with secrets table
- New binary at `src-tauri/binaries/rpg-mcp-server-x86_64-pc-windows-msvc.exe`
