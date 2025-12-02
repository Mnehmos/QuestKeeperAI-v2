# Quest Keeper AI - Worker Agent Initialization

**Document Type:** Master initialization prompt for AI worker agents  
**Generated:** December 2024  
**Scope:** Post-session handoff, immediate development priorities

---

## 🎯 Mission Brief

You are a worker agent contributing to **Quest Keeper AI**, a desktop RPG companion that combines an AI Dungeon Master with a visual game engine. Your work enables the vision of "a game where you can DO anything, TRACK everything, and GET BETTER continuously."

**Current State:** Integration between frontend (Tauri/React) and backend (rpg-mcp) is complete, but the build is broken and several features need finishing.

**Immediate Goal:** Fix build errors, complete world environment integration, and harden the active selection system.

---

## 📖 Required Reading (In Order)

1. **This document** - Orientation and context
2. **GAP_ANALYSIS.md** - Detailed task breakdown with effort estimates
3. **WORKER_HANDOFF.md** - Implementation specifics and code locations
4. **Your assigned section** - Based on worker role

**Project Context (reference as needed):**
- `/mnt/project/PROJECT_VISION.md` - Why we're building this
- `/mnt/project/DEVELOPMENT_PLAN.md` - 6-phase roadmap
- `/mnt/project/RPG-MCP-INTEGRATION.md` - How frontend connects to backend

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     QUEST KEEPER AI                             │
├─────────────────────────────────────────────────────────────────┤
│  TAURI SHELL (Rust)                                             │
│  ├── Window management                                          │
│  ├── File system access                                         │
│  └── Sidecar spawning ──────────────────────────┐              │
│                                                   │              │
│  REACT FRONTEND (TypeScript)                      │              │
│  ├── Terminal Panel (Chat + Commands)            │              │
│  ├── Viewport Panel (3D + Sheets)                │              │
│  └── Zustand Stores ◄────────────────────────────┤              │
│       ├── chatStore (messages, sessions)         │              │
│       ├── gameStateStore (chars, items, world)   │              │
│       ├── combatStore (entities, encounters)     │              │
│       ├── uiStore (active tab, settings)         │              │
│       └── settingsStore (API keys, model)        │              │
│                                                   │              │
│  MCP CLIENT                                       │              │
│  └── JSON-RPC over stdio ◄───────────────────────┤              │
│                                                   ▼              │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  RPG-MCP SERVER (Node.js binary)                            ││
│  │  ├── 80+ MCP Tools                                          ││
│  │  ├── SQLite Database (rpg.db)                               ││
│  │  └── PubSub Events                                          ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚨 Current Blockers

### Build Broken (P0)

```
11 TypeScript errors preventing npm run build
```

**Root causes:**
1. Property name mismatches (`combatants` vs `entities`, `clearMessages` vs `clearHistory`)
2. Missing type (`'success'` not in MessageType union)
3. Null handling (`null` not assignable to `any[]`)
4. Missing namespace (`NodeJS` not found)
5. Unused parameters (linter warnings treated as errors)

**Impact:** Cannot develop, test, or build until fixed.

---

## 👷 Worker Roles

### Worker 1: Build Fixer
**Objective:** Restore build to passing state  
**Scope:** TypeScript errors only, no refactoring  
**Time:** 1 hour  
**Deliverable:** `npm run build` exits 0

### Worker 2: World Environment Integrator
**Objective:** Complete frontend for world environment  
**Scope:** LLM context injection, UI form, display  
**Time:** 4 hours  
**Deliverable:** Set weather → See weather → LLM knows weather

### Worker 3: Selection Synchronizer
**Objective:** Harden character/world selection  
**Scope:** Single source of truth, sync lock, status indicator  
**Time:** 3 hours  
**Deliverable:** Selection stays stable across all views

### Worker 4: Character Sheet Enricher
**Objective:** Add missing character data displays  
**Scope:** AC, proficiency, conditions, saves  
**Time:** 4 hours  
**Deliverable:** Character sheet shows full D&D-style stats

---

## 📁 Key File Locations

```
Frontend: C:\Users\mnehm\Desktop\Quest Keeper AI attempt 2\

src/
├── components/
│   ├── terminal/
│   │   ├── ChatInput.tsx      ← LLM context injection, slash commands
│   │   ├── ChatHistory.tsx    ← Message display
│   │   └── ChatSidebar.tsx    ← Session/character selection
│   └── viewport/
│       ├── CharacterSheetView.tsx  ← Character display (enrichment target)
│       ├── WorldStateView.tsx      ← World display (env form target)
│       ├── InventoryView.tsx       ← Item display
│       ├── BattlemapCanvas.tsx     ← 3D combat view
│       └── CharacterHeader.tsx     ← Party selector
├── stores/
│   ├── gameStateStore.ts    ← Character/world/inventory state
│   ├── combatStore.ts       ← Combat entities (has `entities`, not `combatants`)
│   ├── chatStore.ts         ← Messages (has `clearHistory`, not `clearMessages`)
│   └── settingsStore.ts     ← API keys, model selection
├── services/
│   ├── mcpClient.ts         ← MCP connection management
│   └── llm/
│       └── LLMService.ts    ← Tool calling, streaming
└── utils/
    └── mcpUtils.ts          ← Response parsing helpers

Backend: C:\Users\mnehm\AppData\Roaming\Roo-Code\MCP\rpg-mcp\

Binary (bundled in frontend):
  src-tauri/binaries/rpg-mcp-server-x86_64-pc-windows-msvc.exe
  src-tauri/binaries/better_sqlite3.node

Database (created at runtime):
  rpg.db (in working directory)
```

---

## 🔧 Development Commands

```bash
# Navigate to frontend
cd "C:\Users\mnehm\Desktop\Quest Keeper AI attempt 2"

# Install dependencies
npm install

# Check for type errors (should be 0 after Worker 1)
npm run build

# Development mode with hot reload
npm run tauri dev

# Production build
npm run tauri build

# Run tests (if configured)
npm test
```

---

## ✅ Acceptance Criteria Summary

### After Worker 1 (Build Fixer)
- [ ] `npm run build` completes with exit code 0
- [ ] `npm run tauri dev` launches application
- [ ] No TypeScript errors in VS Code
- [ ] `/test` command lists 80+ MCP tools

### After Worker 2 (Environment Integrator)
- [ ] WorldStateView shows environment form
- [ ] Quick presets (Dawn, Noon, Dusk, Night, Storm) work
- [ ] Setting values → Refresh → Values display correctly
- [ ] Chat message "What's the weather?" uses environment data
- [ ] LLM describes scenes with correct time/weather

### After Worker 3 (Selection Synchronizer)
- [ ] Select Frodo → All views show Frodo data
- [ ] Select Aragorn → All views update immediately
- [ ] Sync operation doesn't change selection
- [ ] Status indicator shows current character/world ID
- [ ] Single "Sync Now" button triggers all sync

### After Worker 4 (Character Enricher)
- [ ] AC displayed with calculation breakdown
- [ ] Proficiency bonus shown (+2 to +6 based on level)
- [ ] Conditions section visible (even if "None")
- [ ] Saving throws shown for all 6 abilities
- [ ] Currencies displayed (gold, silver, copper)

---

## 🔄 Handoff Protocol

When completing your work:

1. **Test your changes** - Verify acceptance criteria
2. **Document what you changed** - Update WORKER_HANDOFF.md
3. **List any new issues found** - Add to GAP_ANALYSIS.md
4. **Commit with clear message** - Reference the worker role

**Commit message format:**
```
[Worker N] Brief description

- Specific change 1
- Specific change 2
- Fixes #issue if applicable
```

---

## ⚠️ Constraints

1. **Don't refactor unrelated code** - Stay focused on your assigned scope
2. **Match existing style** - Terminal green aesthetic, Zustand patterns
3. **Test before declaring done** - Acceptance criteria must pass
4. **Ask if uncertain** - Better to clarify than break something

---

## 📞 Escalation

If blocked for more than 30 minutes:
1. Document what you tried
2. Capture exact error messages
3. Note which file/line is problematic
4. Request assistance with specific question

---

## 🎯 Success Vision

After all workers complete:

1. **Build passes** - Clean TypeScript compilation
2. **Environment works** - Set "Stormy Night" → LLM narrates thunder
3. **Selection stable** - Switch characters without confusion
4. **Character complete** - Full D&D stat block visible

This enables the next phase: **World Map Visualization** (Phase 2 of development plan).

---

## Quick Reference Card

| Need To | Command/Location |
|---------|-----------------|
| Build project | `npm run build` |
| Run development | `npm run tauri dev` |
| Test MCP connection | Type `/test` in chat |
| Force sync | Type `/sync` in chat |
| Check active selection | Type `/debug` in chat |
| Find character state | `src/stores/gameStateStore.ts` |
| Find combat state | `src/stores/combatStore.ts` |
| Find chat state | `src/stores/chatStore.ts` |
| Find MCP client | `src/services/mcpClient.ts` |
| Find LLM service | `src/services/llm/LLMService.ts` |

---

**Document Version:** 1.0  
**Next Review:** After all workers complete

