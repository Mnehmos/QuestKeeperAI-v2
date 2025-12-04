# Quest Keeper AI - Project Vision

**Version:** 2.0
**Last Updated:** December 3, 2024

---

## Elevator Pitch

**Quest Keeper AI** is a desktop RPG companion that combines an AI Dungeon Master with a visual game engine. Think D&D Beyond meets AI Dungeon meets OSRS—where every action has mechanical weight, every quest tracks progress, and your world persists across sessions.

---

## The Problem

Current AI RPG tools fall into two camps:

1. **Pure Narrative** (AI Dungeon, NovelAI)
   - Great storytelling, zero mechanical tracking
   - "You have a sword" but no stats, no inventory, no progression
   - Session amnesia—every conversation starts fresh

2. **Pure Mechanics** (D&D Beyond, Roll20)
   - Excellent character sheets and dice
   - No AI storytelling
   - Manual everything

**The Gap:** No tool combines rich AI narrative with persistent, trackable game state.

---

## The Solution

Quest Keeper AI bridges the gap with:

| Layer | What It Does | How It Works |
|-------|--------------|--------------|
| **AI DM** | Narrates, roleplays NPCs, drives story | LLM (Claude/GPT/Gemini) with game context |
| **MCP Engine** | Enforces rules, tracks state | rpg-mcp backend with 80+ tools |
| **Visual Frontend** | Shows battlemaps, world maps, sheets | Tauri + React + Three.js |
| **Persistence** | Saves everything, forever | SQLite + session management |

### Key Differentiators

1. **LLM Never Lies About State**
   - AI can't hallucinate your HP or inventory
   - All state comes from verified database
   - LLM describes, engine validates

2. **OSRS-Style Progression**
   - Skills level up with XP
   - Quest chains unlock content
   - Requirements gate progression
   - Everything tracks

3. **Visual Grounding**
   - 3D battlemaps for combat
   - 2D world maps for exploration
   - Character sheets with real data
   - Inventory with actual items

4. **Infinite Sessions**
   - Context condensing when LLM limits hit
   - Full state persisted to SQLite
   - Resume any time, from any point

---

## Target User Personas

### 1. Solo RPG Player ("The Lone Wolf")
> "I want to play D&D but I don't have a group."

- Plays alone with AI DM
- Values deep progression systems
- Wants their choices to matter mechanically
- Enjoys visual feedback (battlemaps, maps)

### 2. DM Prep Tool User ("The Worldbuilder")
> "I need to generate and organize my campaign world."

- Uses the tool for worldbuilding
- Creates NPCs, locations, quest chains
- Exports content for use in real sessions
- Values batch generation ("make me 10 tavern NPCs")

### 3. Casual Explorer ("The Story Seeker")
> "I just want to see what happens."

- Less concerned with mechanics
- Enjoys narrative emergence
- Likes the visual novel aspect
- May not engage deeply with progression

---

## Core Features

### ✅ Implemented (Phases 1 & 2 Complete)
- ✅ Character creation with D&D 5e stats, point buy, dice rolling
- ✅ AI-generated character backstories
- ✅ Inventory system with D&D 5e items, equipment slots
- ✅ Combat encounters with initiative, HP, conditions, cover
- ✅ 3D battlemap visualization with terrain and tokens
- ✅ Multi-LLM support (OpenAI, Anthropic, Gemini, OpenRouter)
- ✅ Procedural world generation (Perlin noise, 28+ biomes)
- ✅ Quest system with objectives, rewards, progress tracking
- ✅ 2D world map with zoom, pan, and POI markers
- ✅ Party management with roles and formations
- ✅ Notes system with categories, tags, and search
- ✅ World environment (weather, time, moon phases)
- ✅ Session persistence via Zustand

### 🔧 In Progress (Phases 4 & 5 Partial)
- 🔧 Interactive battlemap (click-to-move pending)
- 🔧 Combat log panel
- 🔧 Session export (Markdown/PDF)
- 🔧 Context condensing for long sessions

### ⬜ Planned (Phases 3 & 6)
- ⬜ Skill system with OSRS-style XP curves
- ⬜ Achievement tracking
- ⬜ Faction reputation system
- ⬜ Quest chains and prerequisites
- ⬜ Batch generation workflows
- ⬜ Multiplayer foundation

---

## Technical Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      QUEST KEEPER AI                            │
│                                                                 │
│  ┌──────────────────────┐    ┌────────────────────────────────┐│
│  │    TAURI SHELL       │    │       REACT FRONTEND           ││
│  │  (Native Desktop)    │    │  ┌────────────┬──────────────┐ ││
│  │                      │    │  │  Terminal  │   Viewport   │ ││
│  │  - Window management │    │  │  (Chat)    │  - Battlemap │ ││
│  │  - File system       │    │  │            │  - World Map │ ││
│  │  - Sidecar spawning  │    │  │            │  - Sheets    │ ││
│  └──────────┬───────────┘    │  └────────────┴──────────────┘ ││
│             │                │                                 ││
│             │ Spawn          │  Zustand State ─────────────────┤│
│             ▼                │                                 ││
│  ┌──────────────────────┐    └─────────────────────────────────┘│
│  │    RPG-MCP SERVER    │◄──── JSON-RPC (stdio) ────►           │
│  │  (Node.js Binary)    │                                       │
│  │                      │    ┌─────────────────────────────────┐│
│  │  - 80+ MCP Tools     │    │         LLM PROVIDERS           ││
│  │  - SQLite Database   │    │  ┌─────┐ ┌─────┐ ┌─────┐ ┌────┐││
│  │  - PubSub Events     │    │  │Claude│ │ GPT │ │Gemini│ │OR  │││
│  │  - Audit Logging     │    │  └──┬──┘ └──┬──┘ └──┬───┘ └─┬──┘││
│  └──────────────────────┘    │     └───────┴───────┴───────┘   ││
│                              │            Tool Calls           ││
│                              └─────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Message
    │
    ▼
┌─────────────────┐
│  LLM Provider   │ ◄─── System Prompt + Game Context
└────────┬────────┘
         │
         │ Tool Calls (if needed)
         ▼
┌─────────────────┐
│   MCP Client    │ ───► "create_character", "execute_combat_action", etc.
└────────┬────────┘
         │
         │ JSON-RPC over stdio
         ▼
┌─────────────────┐
│  rpg-mcp Server │ ───► SQLite (persistent state)
└────────┬────────┘
         │
         │ Tool Results
         ▼
┌─────────────────┐
│  LLM Provider   │ ───► Incorporate results into response
└────────┬────────┘
         │
         │ Assistant Message
         ▼
┌─────────────────┐
│    Frontend     │ ───► Update Zustand stores ───► Re-render UI
└─────────────────┘
```

---

## Design Principles

### 1. Mechanical Honesty
> The AI describes the world; the engine defines it.

- LLM responses are narrative, not authoritative
- All game state comes from MCP tools
- If it's not in the database, it doesn't exist

### 2. Progressive Disclosure
> Simple surface, deep systems underneath.

- Basic play works out of the box
- Advanced features reveal themselves over time
- Expert users can access raw tools

### 3. Visual Grounding
> If you can track it, you can see it.

- Every data point has a visual representation
- Maps, charts, progress bars, tokens
- No blind faith in AI descriptions

### 4. Session Resilience
> Your adventure never truly ends.

- Auto-save on every state change
- Context condenses when needed
- Resume from any point

### 5. Extensibility
> The system grows with you.

- Custom items, quests, factions
- Workflow templates for generation
- Plugin-ready architecture

---

## Success Metrics

### User Engagement
- Average session length > 30 minutes
- Return rate > 50% within 7 days
- Quest completion rate > 60%

### Technical Quality
- MCP call failure rate < 1%
- UI response time < 200ms
- State sync accuracy 100%

### Feature Completeness
- All 6 epics delivered
- All P0/P1 tasks complete
- Test coverage > 80%

---

## Competitive Landscape

| Product | Narrative | Mechanics | Visual | Persistence | AI |
|---------|-----------|-----------|--------|-------------|-----|
| AI Dungeon | ⭐⭐⭐ | ⭐ | ⭐ | ⭐ | ⭐⭐⭐ |
| D&D Beyond | ⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐ |
| Roll20 | ⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐ |
| Foundry VTT | ⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐ |
| **Quest Keeper** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |

**Our Edge:** We're the only tool that combines AI narrative with real mechanical depth and persistent state.

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| LLM hallucinations break immersion | Medium | High | Strict tool-based state, validation |
| Context limits hit mid-session | High | Medium | Context condensing system |
| Performance with large worlds | Medium | Medium | LOD, chunking, lazy loading |
| User expects "real" D&D rules | High | Low | Clear documentation, flexible system |
| Scope creep | High | Medium | Strict phase boundaries, MVP focus |

---

## Team & Responsibilities

| Role | Responsibility |
|------|----------------|
| Backend Dev | rpg-mcp tools, database, migrations |
| Frontend Dev | React components, Three.js, state management |
| AI/Prompt Engineer | System prompts, tool descriptions, context design |
| QA | Testing, edge cases, user flows |
| Content Creator | Quest templates, item databases, workflows |

---

## Links & Resources

### Repositories
- **Frontend:** Quest Keeper AI v2 (Tauri + React)
- **Backend:** rpg-mcp (MCP Server)

### Documentation
- `DEVELOPMENT_PLAN.md` - Strategic roadmap
- `TASK_MAP.md` - Detailed task breakdown
- `RPG-MCP-INTEGRATION.md` - Integration reference
- `GENERATIVE_WORLD_BUILDING_DESIGN.md` - Batch generation design

### Reference
- [MCP Protocol Spec](https://modelcontextprotocol.io)
- [D&D 5e SRD](https://www.dndbeyond.com/sources/basic-rules)
- [OSRS Wiki](https://oldschool.runescape.wiki)

---

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| Dec 2024 | 1.0 | Initial vision document |
| Dec 3, 2024 | 2.0 | Updated feature status - Phases 1 & 2 complete |

