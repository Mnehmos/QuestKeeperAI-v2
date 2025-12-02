# Quest Keeper AI - Gap Analysis & Task Breakdown

**Generated:** December 2024  
**Alignment:** Development Plan Phases 1-6  
**Status:** Pre-implementation analysis

---

## Overview

This document maps identified gaps to development phases, assigns effort estimates, and defines acceptance criteria for each work item.

---

## Recent Updates

### December 2024 - Secret Keeper Integration

**Completed:**
- ✅ System prompt updated with Secret Keeper instructions in `settingsStore.ts`
- ✅ `/secrets` command added to ChatInput for viewing world secrets
- ✅ Secrets context injection into LLM history (GM-only knowledge)
- ✅ System prompt includes reveal condition types and spoiler format

**Secret Keeper Status:**
| Component | Status | Notes |
|-----------|--------|-------|
| System Prompt Instructions | ✅ Done | Includes reveal conditions, spoiler format |
| `/secrets` slash command | ✅ Done | Shows secrets for active world |
| Context Injection | ✅ Done | Injects secrets into LLM with "DO NOT REVEAL" instructions |
| Backend MCP tools | ⚠️ Partial | `get_secrets` exists, need `reveal_secret`, `check_reveal_conditions` |
| Spoiler Component | ✅ Done | `Spoiler.tsx` exists for clickable reveals |
| Leak Detection Filter | ❌ TODO | Post-processing to catch accidental reveals |

---

## Phase 1: Core System Fixes (Current Sprint)

### 1.1 TypeScript Build Errors (BLOCKING)

**Priority:** P0 - Must fix before any other work  
**Effort:** 1 hour  
**Owner:** Worker 1 (Build Fixer)

| Error ID | File | Line | Error | Fix |
|----------|------|------|-------|-----|
| TS-001 | ChatInput.tsx | 161 | `combatants` not on CombatState | → `entities` |
| TS-002 | ChatInput.tsx | 225 | `combatants` not on CombatState | → `entities` |
| TS-003 | ChatInput.tsx | 232 | `clearMessages` not on ChatState | → `clearHistory` |
| TS-004 | ChatInput.tsx | 450 | `combatants` not on CombatState | → `entities` |
| TS-005 | ChatInput.tsx | 667 | `"success"` not MessageType | Add to union |
| TS-006 | LLMService.ts | 87 | `null` not assignable to `any[]` | `\|\| []` |
| TS-007 | LLMService.ts | 226 | `undefined` not assignable to `string` | Null check |
| TS-008 | mcpClient.ts | 43 | `NodeJS` namespace missing | `@types/node` |
| TS-009 | mcpUtils.ts | 157 | Unused `index` | `_index` |
| TS-010 | mcpUtils.ts | 192 | `NodeJS` namespace missing | `@types/node` |
| TS-011 | toolResponseFormatter.ts | 187 | Unused `index` | `_index` |

**Acceptance Criteria:**
- [ ] `npm run build` exits 0
- [ ] `npm run tauri dev` launches
- [ ] No red squiggles in VS Code

---

### 1.2 Quest System Data Retrieval

**Priority:** P1 - Core functionality  
**Effort:** 2 hours  
**Status:** Partially addressed in backend, frontend formatter exists

**Current State:**
- `get_quest_log` returns full quest objects (backend fixed)
- Frontend `parseQuestsFromResponse` handles new format
- Quest objectives display in NotesView

**Remaining Gaps:**

| Gap | Current | Required | Effort |
|-----|---------|----------|--------|
| No `get_quest` single lookup | Must iterate | Direct fetch | 30 min (backend) |
| Quest rewards not granted | Manual only | Auto on complete | 1 hour (backend) |
| Quest prerequisite checking | Not enforced | Block if unmet | 1 hour (backend) |

**Acceptance Criteria:**
- [ ] `/quests` shows full quest details
- [ ] Completing quest grants XP/gold
- [ ] Can't accept quest if prereqs unmet

---

### 1.3 Active Selection Synchronization

**Priority:** P1 - UX critical  
**Effort:** 3 hours  
**Owner:** Worker 3 (Selection Hardener)

**Current State:**
- Selection stored in `gameStateStore` (activeCharacterId, activeWorldId)
- Multiple components read/write selection
- Race conditions during sync

**Gaps:**

| Gap | Impact | Fix | Effort |
|-----|--------|-----|--------|
| No sync lock | Selection flips | Add `isSyncing` guard | 30 min |
| No visible status | User confusion | Status bar component | 1 hour |
| Distributed sync buttons | Inconsistent | Unified control | 30 min |
| No selection persistence | Lost on reload | Already persisted via Zustand | ✅ |

**Affected Components:**
1. `CharacterHeader.tsx` - Party dropdown
2. `ChatSidebar.tsx` - Character list
3. `CharacterSheetView.tsx` - Data display
4. `InventoryView.tsx` - Items
5. `NotesView.tsx` - Quests
6. `ChatInput.tsx` - Context injection

**Acceptance Criteria:**
- [ ] Select character → All views update
- [ ] Sync doesn't change selection
- [ ] Status indicator shows current IDs
- [ ] Single "Sync Now" button

---

## Phase 2: World Visualization

### 2.1 World Environment Integration

**Priority:** P1 - Enables narrative coherence  
**Effort:** 4 hours total  
**Owner:** Worker 2 (Environment Integrator)

**Backend Status:** ✅ Complete
- `update_world_environment` tool exists
- Environment stored in world.environment JSON column
- Schema supports: date, timeOfDay, season, moonPhase, weatherConditions, temperature, lighting

**Frontend Gaps:**

| Gap | Current | Required | Effort |
|-----|---------|----------|--------|
| No LLM context injection | Character only | Character + Environment | 30 min |
| No UI to set environment | Backend only | Form + quick actions | 2 hours |
| WorldStateView shows "Unknown" | No data | Live data | 30 min (display ready, needs data) |
| No time advancement | Static | Manual + auto option | 2 hours |

**UI Requirements:**

```
WorldEnvironmentForm:
├── Date input (text or date picker)
├── Time of Day dropdown (dawn, morning, noon, afternoon, dusk, evening, night, midnight)
├── Season dropdown (spring, summer, autumn, winter)
├── Weather dropdown (clear, cloudy, rainy, stormy, snowy, foggy)
├── Temperature dropdown (freezing, cold, cool, mild, warm, hot, scorching)
├── Lighting dropdown (bright daylight, overcast, dim, moonlit, darkness)
└── Quick Presets row:
    ├── [Dawn] → timeOfDay: dawn, lighting: golden
    ├── [Noon] → timeOfDay: noon, lighting: bright
    ├── [Dusk] → timeOfDay: dusk, lighting: orange
    ├── [Night] → timeOfDay: night, lighting: moonlit
    └── [Storm] → weather: stormy, lighting: dark
```

**LLM Context Injection Format:**
```
--- CURRENT ENVIRONMENT ---
Date: Third Age, Year 3018, October 25
Time: Early evening
Season: Autumn
Weather: Clear skies
Temperature: Cool
Lighting: Fading twilight
Moon Phase: Waxing gibbous

Use this environment data when describing scenes. The party is traveling at this time of day under these conditions.
```

**Acceptance Criteria:**
- [ ] Form visible in WorldStateView
- [ ] Setting values persists to database
- [ ] Refresh shows correct values
- [ ] LLM describes scenes using environment
- [ ] Quick presets work

---

### 2.2 World Map Visualization (Future)

**Priority:** P2 - Phase 2 deliverable  
**Effort:** 2-3 weeks  
**Dependencies:** Phase 1 complete

**Not in current scope but documented for planning:**

| Component | Description | Effort |
|-----------|-------------|--------|
| WorldMap.tsx | 2D tile renderer using Perlin data | 3 days |
| POI system | Backend tools for points of interest | 2 days |
| POI markers | Frontend icons on map | 1 day |
| Zoom levels | World → Region → Local | 2 days |
| Navigation | Click POI to "enter" | 1 day |

---

## Phase 3: Progression Systems

### 3.1 Character Sheet Enrichment

**Priority:** P2 - Quality improvement  
**Effort:** 4 hours  
**Owner:** Worker 4 (Character Enrichment)

**Current Display:**
- Name, level, class ✅
- HP bar ✅
- XP bar ✅
- Ability scores (STR, DEX, CON, INT, WIS, CHA) ✅
- Equipment (armor, weapons, other) ✅

**Missing:**

| Field | Calculation | Source | Effort |
|-------|-------------|--------|--------|
| AC | 10 + DEX mod + armor bonus | Computed | 30 min |
| Proficiency bonus | (level + 7) / 4 rounded down | Computed | 15 min |
| Conditions | List of active effects | character.conditions | 30 min |
| Saving throws | Ability mod + prof (if proficient) | Computed | 1 hour |
| Skills | Ability mod + prof (if proficient) | Computed | 2 hours |
| Currencies | Gold, silver, copper | character.currencies or inventory | 30 min |
| Speed | Base 30ft, modified by race/effects | character.speed | 15 min |
| Initiative | DEX modifier + bonuses | Computed | 15 min |

**Display Layout:**
```
┌────────────────────────────────────────┐
│ VALEROS - Level 5 Fighter              │
│ HP: ████████░░ 45/50   AC: 18         │
│ XP: ██████░░░░ 6500/10000              │
├────────────────────────────────────────┤
│ STR 16 (+3)  DEX 14 (+2)  CON 14 (+2) │
│ INT 10 (+0)  WIS 12 (+1)  CHA 10 (+0) │
├────────────────────────────────────────┤
│ Proficiency: +3   Initiative: +2       │
│ Speed: 30 ft                           │
├────────────────────────────────────────┤
│ SAVES: STR* +6, DEX +2, CON* +5, ...  │
│ (*proficient)                          │
├────────────────────────────────────────┤
│ CONDITIONS: [None]                     │
├────────────────────────────────────────┤
│ EQUIPMENT                              │
│ Armor: Chain Mail (+6 AC)              │
│ Weapons: Longsword, Shield             │
├────────────────────────────────────────┤
│ CURRENCIES                             │
│ 💰 150 gp  🥈 34 sp  🥉 12 cp          │
└────────────────────────────────────────┘
```

**Acceptance Criteria:**
- [ ] AC displayed with breakdown
- [ ] Proficiency bonus displayed
- [ ] All 6 saving throws shown
- [ ] Conditions section (even if empty)
- [ ] Currencies shown

---

### 3.2 Skill System (Future - Phase 3)

**Not in current scope:**
- Skills with XP tracking
- OSRS-style level curves
- Skill requirements for quests/items
- Skill-based ability checks

---

## Phase 4: Enhanced Combat

### 4.1 Spatial Combat

**Priority:** P2 - Phase 4 deliverable  
**Effort:** 2-3 weeks  
**Dependencies:** Phase 1 complete

**Current State:**
- Combatants arranged in circle
- No X/Y position tracking
- No movement actions
- No grid-based targeting

**Required Backend Changes:**

| Change | Description | Effort |
|--------|-------------|--------|
| Add position to participants | `x: number, y: number` fields | 1 hour |
| Move action | `move_combatant(encounterId, participantId, x, y)` | 2 hours |
| Range checking | `is_in_range(from, to, range)` | 1 hour |
| Opportunity attacks | Triggered on movement | 2 hours |

**Required Frontend Changes:**

| Change | Description | Effort |
|--------|-------------|--------|
| Token positioning | Use actual X/Y instead of circle | 1 hour |
| Click-to-select | Highlight selected token | 2 hours |
| Click-to-move | Right-click destination | 3 hours |
| Range overlay | Show attack range radius | 2 hours |
| Movement path | Show path before confirming | 2 hours |

---

## Phase 5: Session Management (Future)

### 5.1 Session Save/Load

**Not in current scope:**
- `save_session` / `load_session` tools
- Multiple save slots
- Auto-save on state change

### 5.2 Context Condensing

**Not in current scope:**
- Summarize session for LLM
- Token-aware compression
- Priority information ranking

---

## Phase 6: Workflow Automation (Future)

### 6.1 Batch Operations

**Not in current scope:**
- `batch_create_characters`
- `batch_create_npcs`
- `batch_distribute_items`

### 6.2 Workflow Engine

**Not in current scope:**
- YAML workflow definitions
- Dependency resolution
- Template library

---

## Dependency Graph

```
                    ┌─────────────────┐
                    │   BUILD FIX     │
                    │   (BLOCKING)    │
                    └────────┬────────┘
                             │
           ┌─────────────────┼─────────────────┐
           │                 │                 │
           ▼                 ▼                 ▼
    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
    │   SELECTION  │ │    WORLD     │ │  CHARACTER   │
    │    SYNC      │ │  ENVIRONMENT │ │    SHEET     │
    └──────────────┘ └──────────────┘ └──────────────┘
           │                 │                 │
           ▼                 ▼                 │
    ┌──────────────┐ ┌──────────────┐         │
    │   COMBAT     │ │  WORLD MAP   │         │
    │   SPATIAL    │ │   (Phase 2)  │         │
    └──────────────┘ └──────────────┘         │
                                               ▼
                                        ┌──────────────┐
                                        │    SKILL     │
                                        │   SYSTEM     │
                                        │   (Phase 3)  │
                                        └──────────────┘
```

---

## Effort Summary

### Current Sprint (This Week)

| Task | Effort | Owner | Priority |
|------|--------|-------|----------|
| Fix TS build errors | 1 hour | Worker 1 | P0 |
| Selection sync hardening | 3 hours | Worker 3 | P1 |
| World environment UI | 4 hours | Worker 2 | P1 |
| **Total** | **8 hours** | | |

### Next Sprint

| Task | Effort | Priority |
|------|--------|----------|
| Character sheet enrichment | 4 hours | P2 |
| Quest reward auto-grant | 1 hour | P2 |
| Quest prerequisite checks | 1 hour | P2 |
| **Total** | **6 hours** | |

### Backlog

| Task | Effort | Phase |
|------|--------|-------|
| World map visualization | 2 weeks | Phase 2 |
| Spatial combat | 2 weeks | Phase 4 |
| Skill system | 3 weeks | Phase 3 |
| Session management | 2 weeks | Phase 5 |
| Workflow engine | 3 weeks | Phase 6 |

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Build fix takes longer | Low | High | Timebox to 2 hours, escalate if stuck |
| World env data not persisting | Medium | Medium | Test backend tool directly first |
| Selection sync complex | Medium | Medium | Start with minimal lock, iterate |
| Character sheet scope creep | High | Low | Strict acceptance criteria |
| Three.js context lost | Low | Low | Defer unless blocking |

---

## Sign-off Checklist

Before starting worker agents:

- [ ] This gap analysis reviewed and approved
- [ ] WORKER_HANDOFF.md reviewed
- [ ] Development environment verified working
- [ ] rpg-mcp binary present in src-tauri/binaries
- [ ] Pre-populated database accessible (rpg.db)

---

## Document History

| Date | Changes |
|------|---------|
| Dec 2024 | Initial gap analysis from session handoff |

