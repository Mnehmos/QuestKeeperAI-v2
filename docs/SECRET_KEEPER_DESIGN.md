# Secret Keeper System Design

**Feature:** AI DM Secret Management
**Purpose:** Enable the LLM to know secrets without revealing them to players
**Status:** Phase 1 Implemented - Core Infrastructure

---

## Implementation Status

### ✅ Phase 1: Core Infrastructure (DONE)
| Component | File | Status |
|-----------|------|--------|
| System Prompt | `settingsStore.ts` | ✅ Complete with reveal conditions, spoiler format |
| `/secrets` Command | `ChatInput.tsx:620-671` | ✅ Shows world secrets |
| Context Injection | `ChatInput.tsx:846-874` | ✅ Injects secrets with "DO NOT REVEAL" |
| Spoiler Component | `src/components/chat/Spoiler.tsx` | ✅ Clickable reveal UI |

### ⏳ Phase 2: Filtering (TODO)
| Component | Status | Notes |
|-----------|--------|-------|
| Leak Pattern Detection | ❌ | Need post-processor for LLM responses |
| Response Redaction | ❌ | Critical leaks should be caught |
| Semantic Leak Check | ❌ | Check for meaning, not just keywords |

### ⏳ Phase 3: Automation (TODO)
| Component | Status | Notes |
|-----------|--------|-------|
| Reveal Condition Engine | ❌ | Check conditions on game events |
| Event-based Triggers | ❌ | Skill checks, quest completion, etc. |
| Partial Reveal Support | ❌ | Hints without full disclosure |

### ⏳ Phase 4: Frontend (TODO)
| Component | Status | Notes |
|-----------|--------|-------|
| Secret Indicator | ❌ | Show when LLM has secrets in context |
| DM Secret Panel | ❌ | View/manage all secrets |
| Secret Management UI | ❌ | Create/edit secrets visually |

---

## Overview

The Secret Keeper allows the AI Dungeon Master to maintain narrative secrets (plot twists, NPC motivations, trap solutions, hidden loot) while preventing accidental disclosure to players. Secrets are injected into LLM context with clear "DO NOT REVEAL" instructions, and responses are post-processed to catch/redact any leaks.

---

## Use Cases

| Secret Type | Example | Revelation Trigger |
|-------------|---------|-------------------|
| NPC True Motivation | "Innkeeper is secretly a cultist" | Player discovers evidence, Insight check |
| Trap Location | "Pressure plate at tile (5,3)" | Perception check, triggered, disarmed |
| Puzzle Solution | "Say 'friend' in Elvish" | Player solves it |
| Hidden Loot | "Chest contains Flame Tongue sword" | Player opens/identifies |
| Enemy Weakness | "Troll is vulnerable to fire" | Arcana check, experimentation |
| Plot Twist | "The king is the villain" | Story milestone reached |
| Quest Secret Objective | "Retrieve the item, don't let patron know contents" | Quest completion |
| DC/Target Numbers | "DC 15 to pick the lock" | Optional: always hide or reveal after roll |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     SECRET KEEPER SYSTEM                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   DATABASE   │───▶│   INJECTOR   │───▶│  LLM PROMPT  │      │
│  │   (Secrets)  │    │  (Formats)   │    │  (Private)   │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│         │                                        │               │
│         │                                        ▼               │
│         │                               ┌──────────────┐        │
│         │                               │  LLM OUTPUT  │        │
│         │                               └───────┬──────┘        │
│         │                                       │               │
│         │                                       ▼               │
│         │                               ┌──────────────┐        │
│         │                               │   FILTER     │        │
│         │                               │  (Redacts)   │        │
│         │                               └───────┬──────┘        │
│         │                                       │               │
│         ▼                                       ▼               │
│  ┌──────────────┐                      ┌──────────────┐        │
│  │  REVELATION  │◀─────────────────────│   PLAYER     │        │
│  │   ENGINE     │   (triggers reveal)  │   OUTPUT     │        │
│  └──────────────┘                      └──────────────┘        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Model

### Secret Schema

```typescript
interface Secret {
  id: string;
  worldId: string;
  
  // Classification
  type: 'npc' | 'location' | 'item' | 'quest' | 'plot' | 'mechanic' | 'custom';
  category: 'motivation' | 'trap' | 'puzzle' | 'loot' | 'weakness' | 'twist' | 'other';
  
  // The secret content
  name: string;                    // "Innkeeper's True Identity"
  publicDescription: string;       // What player knows: "A friendly innkeeper"
  secretDescription: string;       // What AI knows: "Actually a vampire lord"
  
  // Linked entities (optional)
  linkedEntityId?: string;         // NPC ID, Item ID, Location ID, etc.
  linkedEntityType?: string;       // 'npc', 'item', 'location', 'quest'
  
  // Revelation control
  revealed: boolean;               // Has this been revealed?
  revealedAt?: string;             // Timestamp of revelation
  revealedBy?: string;             // What triggered it
  
  // Revelation conditions (dynamic)
  revealConditions?: RevealCondition[];
  
  // Importance for filtering
  sensitivity: 'low' | 'medium' | 'high' | 'critical';
  
  // Keywords that might indicate a leak
  leakPatterns?: string[];         // ["vampire", "undead", "blood"]
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  notes?: string;                  // DM notes about this secret
}

interface RevealCondition {
  type: 'skill_check' | 'quest_complete' | 'item_interact' | 'dialogue' | 
        'combat_end' | 'location_enter' | 'time_passed' | 'manual';
  
  // Condition specifics
  skill?: string;                  // "Insight", "Perception", "Arcana"
  dc?: number;                     // Difficulty class
  questId?: string;                // Quest that must be complete
  itemId?: string;                 // Item that must be interacted with
  locationId?: string;             // Location that must be entered
  npcId?: string;                  // NPC that must be talked to
  dialogueTrigger?: string;        // Keyword in dialogue
  hoursRequired?: number;          // Time that must pass
  
  // Partial reveal support
  partialReveal?: boolean;         // Reveal hint, not full secret
  partialText?: string;            // "You sense something is off about the innkeeper"
}
```

### Secret-Aware Entity Extensions

```typescript
// Extend existing NPC type
interface NPC {
  // ... existing fields
  
  // Secret fields (only in DM context)
  secretMotivation?: string;
  secretAllegiance?: string;
  hiddenAbilities?: string[];
  secretInventory?: string[];      // Items they have but don't show
}

// Extend existing Item type  
interface Item {
  // ... existing fields
  
  identified: boolean;             // Has player identified this?
  unidentifiedName?: string;       // "Mysterious Potion"
  unidentifiedDescription?: string;
  cursed?: boolean;
  curseDescription?: string;       // Only revealed when curse activates
}

// Extend existing Location/POI type
interface Location {
  // ... existing fields
  
  hiddenFeatures?: HiddenFeature[];
  secretExits?: SecretExit[];
  traps?: Trap[];
}

interface Trap {
  id: string;
  name: string;
  location: { x: number; y: number };
  detected: boolean;
  triggered: boolean;
  disarmed: boolean;
  
  // Secret info
  detectionDC: number;
  disarmDC: number;
  effect: string;                  // "2d6 poison damage"
  description: string;             // What it looks like when detected
}
```

---

## LLM Prompt Injection

### System Prompt Structure

```markdown
# DUNGEON MASTER INSTRUCTIONS

You are the Dungeon Master for this RPG session. You have access to both PUBLIC 
and SECRET information. Follow these rules strictly:

## PUBLIC INFORMATION
This information is known to the player and can be freely discussed:
{publicContext}

## SECRET INFORMATION (DO NOT REVEAL)
⚠️ CRITICAL: The following information is SECRET. You know this to inform your 
narration, but you must NEVER directly reveal it to the player. Do not hint at 
it unless the revelation conditions are met.

{secretContext}

### Secret Handling Rules:
1. NEVER state secrets directly, even if the player asks
2. NEVER confirm or deny guesses about secrets
3. If a player is close to discovering a secret, describe environmental clues only
4. When a reveal condition is met, call the `reveal_secret` tool
5. You may use secrets to inform NPC behavior without stating them
6. If you accidentally start to reveal a secret, stop and redirect

### Example of CORRECT secret handling:
Secret: "The innkeeper is a vampire"
Player: "Is the innkeeper a vampire?"
CORRECT: "The innkeeper laughs heartily. 'A vampire? In my establishment? What a 
peculiar question!' He continues polishing a glass, though you notice he avoids 
the shaft of sunlight from the window."
WRONG: "You can't tell for sure, but there are signs he might be a vampire."

### Current Active Secrets:
{formattedSecrets}
```

### Secret Context Formatting

```typescript
function formatSecretsForLLM(secrets: Secret[]): string {
  const grouped = groupBy(secrets, 'type');
  
  let output = '';
  
  for (const [type, typeSecrets] of Object.entries(grouped)) {
    output += `\n### ${type.toUpperCase()} SECRETS\n`;
    
    for (const secret of typeSecrets) {
      output += `
[SECRET-${secret.id}] ${secret.name}
- Sensitivity: ${secret.sensitivity.toUpperCase()}
- Public Knowledge: ${secret.publicDescription}
- Hidden Truth: ${secret.secretDescription}
- Leak Patterns to AVOID: ${secret.leakPatterns?.join(', ') || 'none specified'}
- Reveal Conditions: ${formatRevealConditions(secret.revealConditions)}
`;
    }
  }
  
  return output;
}

function formatRevealConditions(conditions?: RevealCondition[]): string {
  if (!conditions || conditions.length === 0) return 'Manual only';
  
  return conditions.map(c => {
    switch (c.type) {
      case 'skill_check': return `DC ${c.dc} ${c.skill} check`;
      case 'quest_complete': return `Complete quest ${c.questId}`;
      case 'location_enter': return `Enter location ${c.locationId}`;
      case 'dialogue': return `NPC says "${c.dialogueTrigger}"`;
      default: return c.type;
    }
  }).join(' OR ');
}
```

---

## Response Filtering

### Post-Processing Pipeline

```typescript
interface FilterResult {
  originalText: string;
  filteredText: string;
  leaksDetected: LeakDetection[];
  wasModified: boolean;
}

interface LeakDetection {
  secretId: string;
  secretName: string;
  pattern: string;
  position: { start: number; end: number };
  severity: 'warning' | 'critical';
  action: 'flagged' | 'redacted' | 'rewritten';
}

class SecretFilter {
  private secrets: Secret[];
  
  constructor(secrets: Secret[]) {
    this.secrets = secrets.filter(s => !s.revealed);
  }
  
  /**
   * Check LLM response for potential secret leaks
   */
  filter(response: string): FilterResult {
    const leaks: LeakDetection[] = [];
    let filtered = response;
    
    for (const secret of this.secrets) {
      // Check explicit leak patterns
      for (const pattern of secret.leakPatterns || []) {
        const regex = new RegExp(`\\b${escapeRegex(pattern)}\\b`, 'gi');
        const matches = [...response.matchAll(regex)];
        
        for (const match of matches) {
          // Context-aware check - is this actually a leak?
          if (this.isActualLeak(response, match, secret)) {
            leaks.push({
              secretId: secret.id,
              secretName: secret.name,
              pattern,
              position: { start: match.index!, end: match.index! + match[0].length },
              severity: secret.sensitivity === 'critical' ? 'critical' : 'warning',
              action: 'flagged'
            });
          }
        }
      }
      
      // Check for semantic leaks (more sophisticated)
      const semanticLeaks = this.checkSemanticLeak(response, secret);
      leaks.push(...semanticLeaks);
    }
    
    // Handle critical leaks by redacting
    for (const leak of leaks.filter(l => l.severity === 'critical')) {
      filtered = this.redactLeak(filtered, leak);
      leak.action = 'redacted';
    }
    
    return {
      originalText: response,
      filteredText: filtered,
      leaksDetected: leaks,
      wasModified: leaks.some(l => l.action === 'redacted')
    };
  }
  
  /**
   * Context-aware check to reduce false positives
   */
  private isActualLeak(text: string, match: RegExpMatchArray, secret: Secret): boolean {
    // Get surrounding context (50 chars each side)
    const start = Math.max(0, match.index! - 50);
    const end = Math.min(text.length, match.index! + match[0].length + 50);
    const context = text.slice(start, end).toLowerCase();
    
    // False positive patterns (player asking, DM denying)
    const falsePositivePatterns = [
      'you ask', 'you wonder', 'you suspect',
      'there\'s no sign', 'no indication', 'appears normal',
      'laughs at the suggestion', 'denies', 'shakes head'
    ];
    
    for (const fp of falsePositivePatterns) {
      if (context.includes(fp)) return false;
    }
    
    // True positive patterns (direct statements)
    const truePositivePatterns = [
      'actually', 'in truth', 'secretly', 'really is',
      'reveals', 'you discover', 'turns out', 'is actually'
    ];
    
    for (const tp of truePositivePatterns) {
      if (context.includes(tp)) return true;
    }
    
    // Default to flagging high-sensitivity secrets
    return secret.sensitivity === 'critical' || secret.sensitivity === 'high';
  }
  
  /**
   * Redact a leaked secret from the response
   */
  private redactLeak(text: string, leak: LeakDetection): string {
    const before = text.slice(0, leak.position.start);
    const after = text.slice(leak.position.end);
    return before + '[REDACTED]' + after;
  }
  
  /**
   * Check for semantic leaks (meaning revealed without exact words)
   */
  private checkSemanticLeak(text: string, secret: Secret): LeakDetection[] {
    // This could be enhanced with embeddings/similarity checking
    // For now, use simple heuristic patterns
    const leaks: LeakDetection[] = [];
    
    // Check for confirmation patterns + secret-adjacent words
    const confirmationPatterns = [
      /you('re| are) (right|correct) (about|regarding)/i,
      /indeed[,.]?\s+\w+\s+is/i,
      /the truth is/i,
      /I (must |should |will )?reveal/i,
      /you('ve| have) (discovered|uncovered|learned)/i
    ];
    
    for (const pattern of confirmationPatterns) {
      if (pattern.test(text)) {
        // Check if any secret-related content is nearby
        // This is a simplified check
        leaks.push({
          secretId: secret.id,
          secretName: secret.name,
          pattern: pattern.source,
          position: { start: 0, end: 0 }, // Would need actual position
          severity: 'warning',
          action: 'flagged'
        });
      }
    }
    
    return leaks;
  }
}
```

---

## Revelation System

### Reveal Triggers

```typescript
class RevelationEngine {
  /**
   * Check if any secrets should be revealed based on game events
   */
  async checkRevealConditions(
    event: GameEvent,
    secrets: Secret[]
  ): Promise<Secret[]> {
    const toReveal: Secret[] = [];
    
    for (const secret of secrets.filter(s => !s.revealed)) {
      for (const condition of secret.revealConditions || []) {
        if (await this.conditionMet(event, condition)) {
          toReveal.push(secret);
          break; // One condition is enough
        }
      }
    }
    
    return toReveal;
  }
  
  private async conditionMet(
    event: GameEvent,
    condition: RevealCondition
  ): Promise<boolean> {
    switch (condition.type) {
      case 'skill_check':
        return event.type === 'skill_check' &&
               event.skill === condition.skill &&
               event.result >= (condition.dc || 0);
               
      case 'quest_complete':
        return event.type === 'quest_complete' &&
               event.questId === condition.questId;
               
      case 'location_enter':
        return event.type === 'location_enter' &&
               event.locationId === condition.locationId;
               
      case 'item_interact':
        return event.type === 'item_interact' &&
               event.itemId === condition.itemId;
               
      case 'combat_end':
        return event.type === 'combat_end';
        
      case 'dialogue':
        return event.type === 'dialogue' &&
               event.text?.toLowerCase().includes(
                 condition.dialogueTrigger?.toLowerCase() || ''
               );
               
      case 'manual':
        return false; // Only via explicit tool call
        
      default:
        return false;
    }
  }
  
  /**
   * Reveal a secret and update the game state
   */
  async revealSecret(
    secretId: string,
    triggeredBy: string,
    partial: boolean = false
  ): Promise<RevealResult> {
    const secret = await this.getSecret(secretId);
    
    if (secret.revealed) {
      return { success: false, reason: 'Already revealed' };
    }
    
    // Update secret state
    await this.updateSecret(secretId, {
      revealed: !partial, // Full reveal
      revealedAt: new Date().toISOString(),
      revealedBy: triggeredBy
    });
    
    // Generate reveal narration for LLM
    const narration = partial
      ? secret.revealConditions?.find(c => c.partialReveal)?.partialText
      : this.generateRevealNarration(secret);
    
    return {
      success: true,
      secret,
      narration,
      partial
    };
  }
  
  private generateRevealNarration(secret: Secret): string {
    // Template-based reveal narration
    const templates: Record<string, string> = {
      'npc-motivation': `The truth becomes clear: ${secret.secretDescription}`,
      'trap-triggered': `With a click, ${secret.secretDescription}`,
      'item-identified': `You realize this is actually ${secret.secretDescription}`,
      'plot-twist': `A shocking revelation: ${secret.secretDescription}`,
    };
    
    const key = `${secret.type}-${secret.category}`;
    return templates[key] || `You discover: ${secret.secretDescription}`;
  }
}
```

---

## MCP Tools

### New Tools for Secret Management

```typescript
// Create a new secret
create_secret: {
  worldId: string,
  type: 'npc' | 'location' | 'item' | 'quest' | 'plot' | 'mechanic' | 'custom',
  category: string,
  name: string,
  publicDescription: string,
  secretDescription: string,
  linkedEntityId?: string,
  linkedEntityType?: string,
  sensitivity: 'low' | 'medium' | 'high' | 'critical',
  leakPatterns?: string[],
  revealConditions?: RevealCondition[]
}

// Reveal a secret (DM action or triggered)
reveal_secret: {
  secretId: string,
  triggeredBy: string,  // "Insight check DC 15" or "Player opened chest"
  partial?: boolean     // Hint only, not full reveal
}

// Get all secrets for context injection
get_secrets: {
  worldId: string,
  includeRevealed?: boolean,  // Default false
  types?: string[],           // Filter by type
  linkedEntityId?: string     // Secrets for specific NPC/item/etc
}

// Update secret (change conditions, patterns, etc)
update_secret: {
  secretId: string,
  updates: Partial<Secret>
}

// Check if any secrets should be revealed
check_reveal_conditions: {
  worldId: string,
  event: GameEvent
}

// List all secrets (DM view)
list_secrets: {
  worldId: string,
  filter?: {
    revealed?: boolean,
    type?: string,
    sensitivity?: string
  }
}
```

---

## Frontend Integration

### Secret Indicator in Chat

When the AI is using secret knowledge, show a subtle indicator:

```tsx
// In ChatHistory.tsx
const SecretIndicator: React.FC<{ hasSecrets: boolean }> = ({ hasSecrets }) => {
  if (!hasSecrets) return null;
  
  return (
    <div className="absolute top-2 right-2 group">
      <span className="text-purple-400 text-xs opacity-50 group-hover:opacity-100">
        🔮
      </span>
      <div className="hidden group-hover:block absolute right-0 top-6 
                      bg-terminal-black border border-purple-400 p-2 text-xs 
                      text-purple-300 w-48 z-10">
        The DM knows secrets about this scene
      </div>
    </div>
  );
};
```

### DM Mode Toggle (Future)

For solo play with self-DMing, allow viewing secrets:

```tsx
const DMSecretPanel: React.FC = () => {
  const [showSecrets, setShowSecrets] = useState(false);
  const secrets = useGameStateStore(s => s.secrets);
  
  return (
    <div className="border border-purple-400/30 p-2">
      <button 
        onClick={() => setShowSecrets(!showSecrets)}
        className="text-purple-400 text-sm"
      >
        {showSecrets ? '🔓 Hide Secrets' : '🔒 DM View'}
      </button>
      
      {showSecrets && (
        <div className="mt-2 space-y-2">
          {secrets.map(s => (
            <SecretCard key={s.id} secret={s} />
          ))}
        </div>
      )}
    </div>
  );
};
```

---

## Example Workflow

### 1. DM Creates Secret

```
DM: "Create a secret that the innkeeper is actually a vampire"

Tool Call: create_secret({
  worldId: "middle-earth-001",
  type: "npc",
  category: "motivation",
  name: "Innkeeper's True Nature",
  publicDescription: "A friendly, rotund innkeeper who runs the Prancing Pony",
  secretDescription: "Actually a 300-year-old vampire who uses the inn to find victims",
  linkedEntityId: "npc-innkeeper-001",
  linkedEntityType: "npc",
  sensitivity: "critical",
  leakPatterns: ["vampire", "undead", "blood", "immortal", "fangs", "drinks blood"],
  revealConditions: [
    { type: "skill_check", skill: "Insight", dc: 18 },
    { type: "location_enter", locationId: "inn-basement" },
    { type: "dialogue", dialogueTrigger: "garlic" }
  ]
})
```

### 2. Player Interacts

```
Player: "I talk to the innkeeper. Does he seem trustworthy?"

LLM Context includes:
[SECRET-001] Innkeeper's True Nature
- Hidden Truth: Actually a 300-year-old vampire
- Leak Patterns: vampire, undead, blood, immortal, fangs

LLM Response: "The innkeeper greets you warmly, his smile broad beneath a 
well-groomed mustache. 'Welcome, welcome! What can I get for you?' He seems 
genuinely hospitable, though you notice he stays behind the bar, in the shadows 
away from the afternoon sun streaming through the windows."
```

### 3. Player Probes

```
Player: "I want to roll Insight to see if he's hiding something"

Tool Call: dice_roll({ expression: "1d20+4" }) → Result: 19

Tool Call: check_reveal_conditions({
  worldId: "middle-earth-001",
  event: { type: "skill_check", skill: "Insight", result: 19 }
})

Result: Secret "Innkeeper's True Nature" meets reveal condition (DC 18)

Tool Call: reveal_secret({
  secretId: "secret-001",
  triggeredBy: "Insight check (rolled 19 vs DC 18)",
  partial: false
})

LLM Response: "As you study the innkeeper's face, you notice something 
unsettling. His skin is impossibly smooth for a man who claims to have run this 
inn for decades. His eyes, when they catch the light, seem to gleam with an 
unnatural hunger. And those teeth... are those canines a bit too sharp? A chill 
runs down your spine as the terrible truth dawns on you—this is no ordinary 
innkeeper. This creature is a vampire."
```

---

## Implementation Priority

### Phase 1: Core Infrastructure
1. Secret database schema and repository
2. `create_secret`, `get_secrets`, `reveal_secret` tools
3. Basic LLM prompt injection

### Phase 2: Filtering
4. Leak pattern detection
5. Response post-processing
6. Redaction system

### Phase 3: Automation
7. Reveal condition engine
8. Event-based trigger system
9. Partial reveal support

### Phase 4: Frontend
10. Secret indicator in chat
11. DM secret panel (optional)
12. Secret management UI

---

## Related Systems

- **Quest System** - Quests can have secret objectives
- **NPC System** - NPCs have secret motivations
- **Item System** - Items can be unidentified/cursed
- **Combat System** - Enemy weaknesses are secrets
- **World Environment** - Hidden locations, secret doors

---

## Success Criteria

- [ ] Secrets persist to database
- [ ] LLM receives secrets in context
- [ ] LLM follows "DO NOT REVEAL" instructions
- [ ] Leak patterns detected in responses
- [ ] Critical leaks redacted
- [ ] Reveal conditions trigger correctly
- [ ] Player experience feels natural, not filtered

