# Quest Keeper AI - Task Map

**Version:** 1.0  
**Last Updated:** December 2024  
**Format:** Hierarchical task breakdown with dependencies and estimates

---

## Legend

```
Status Icons:
⬜ Not Started
🟡 In Progress
✅ Complete
🔴 Blocked
⏸️ On Hold

Priority:
P0 = Critical (blocking other work)
P1 = High (this sprint)
P2 = Medium (next sprint)
P3 = Low (backlog)

Estimates: Hours (h) or Days (d)
```

---

## Epic 1: Quest System Overhaul

**Goal:** Transform broken UUID-only quest system into full-featured OSRS/D&D quest tracking

### 1.1 Immediate Fix - Quest Log [P0]

| ID | Task | Status | Est. | Depends On | Assignee |
|----|------|--------|------|------------|----------|
| Q-001 | Modify `getQuestLog()` in quest.repo.ts to fetch full quest data | ⬜ | 2h | - | Backend |
| Q-002 | Update `get_quest_log` tool to return detailed objects | ⬜ | 1h | Q-001 | Backend |
| Q-003 | Add `getQuestById()` helper in quest.repo.ts | ⬜ | 30m | - | Backend |
| Q-004 | Create `get_quest` tool for single quest lookup | ⬜ | 30m | Q-003 | Backend |
| Q-005 | Update `toolResponseFormatter.ts` for new quest format | ⬜ | 1h | Q-002 | Frontend |
| Q-006 | Test quest log display in UI | ⬜ | 30m | Q-005 | QA |

**Acceptance Criteria:**
- `get_quest_log` returns objects with name, description, objectives, rewards
- Frontend displays quest names and progress bars
- No more UUID-only responses

---

### 1.2 Quest Listing & Search [P1]

| ID | Task | Status | Est. | Depends On | Assignee |
|----|------|--------|------|------------|----------|
| Q-010 | Add `list_quests` tool (all quests in world) | ⬜ | 1h | Q-003 | Backend |
| Q-011 | Add `search_quests` tool (by giver, location, reward) | ⬜ | 1.5h | Q-010 | Backend |
| Q-012 | Add world_id filter to quest queries | ⬜ | 30m | Q-010 | Backend |

---

### 1.3 Objective Progress Tracking [P0]

| ID | Task | Status | Est. | Depends On | Assignee |
|----|------|--------|------|------------|----------|
| Q-020 | Add `updateObjectiveProgress()` in quest.repo.ts | ⬜ | 1h | - | Backend |
| Q-021 | Create `update_quest_objective` tool | ⬜ | 30m | Q-020 | Backend |
| Q-022 | Create `complete_objective` tool (mark single objective done) | ⬜ | 30m | Q-020 | Backend |
| Q-023 | Auto-complete quest when all objectives done | ⬜ | 1h | Q-022 | Backend |
| Q-024 | Add objective progress UI component | ⬜ | 1.5h | Q-021 | Frontend |

**Acceptance Criteria:**
- "Kill 3/10 goblins" updates properly
- Quest auto-completes when all objectives hit 100%
- UI shows progress bars per objective

---

### 1.4 Quest State Management [P1]

| ID | Task | Status | Est. | Depends On | Assignee |
|----|------|--------|------|------------|----------|
| Q-030 | Add `fail_quest` tool | ⬜ | 30m | - | Backend |
| Q-031 | Add `abandon_quest` tool (can re-accept) | ⬜ | 30m | - | Backend |
| Q-032 | Add `restart_quest` tool (for repeatables) | ⬜ | 45m | Q-031 | Backend |
| Q-033 | Track quest history (when started, completed, failed) | ⬜ | 1h | - | Backend |

---

### 1.5 Quest Rewards [P0]

| ID | Task | Status | Est. | Depends On | Assignee |
|----|------|--------|------|------------|----------|
| Q-040 | Implement `claim_quest_rewards` tool | ⬜ | 1.5h | - | Backend |
| Q-041 | Grant XP to character on reward claim | ⬜ | 30m | Q-040 | Backend |
| Q-042 | Grant gold to character on reward claim | ⬜ | 30m | Q-040 | Backend |
| Q-043 | Grant items to inventory on reward claim | ⬜ | 45m | Q-040 | Backend |
| Q-044 | Add `preview_quest_rewards` tool | ⬜ | 30m | Q-040 | Backend |
| Q-045 | Rewards modal in frontend | ⬜ | 1h | Q-044 | Frontend |

**Acceptance Criteria:**
- Completing "Kill Goblins" grants 100 XP, 50 gold, Iron Sword
- Character stats actually update
- UI shows reward notification

---

### 1.6 Quest Discovery System (OSRS-Style) [P2]

| ID | Task | Status | Est. | Depends On | Assignee |
|----|------|--------|------|------------|----------|
| Q-050 | Add `quest_discovery` table to schema | ⬜ | 30m | - | Backend |
| Q-051 | Run migration for new table | ⬜ | 15m | Q-050 | Backend |
| Q-052 | Add `discover_quest` tool | ⬜ | 45m | Q-051 | Backend |
| Q-053 | Add `accept_quest` tool (discovered → active) | ⬜ | 30m | Q-052 | Backend |
| Q-054 | Track discovery source (NPC, location, item) | ⬜ | 30m | Q-052 | Backend |
| Q-055 | "Discovered Quests" section in quest log UI | ⬜ | 1h | Q-053 | Frontend |

---

### 1.7 Prerequisites & Requirements [P1]

| ID | Task | Status | Est. | Depends On | Assignee |
|----|------|--------|------|------------|----------|
| Q-060 | Add `min_level` column to quests table | ⬜ | 15m | - | Backend |
| Q-061 | Add `skill_requirements` JSON column | ⬜ | 15m | - | Backend |
| Q-062 | Add `item_requirements` JSON column | ⬜ | 15m | - | Backend |
| Q-063 | Implement `check_prerequisites` tool | ⬜ | 1.5h | Q-060-062 | Backend |
| Q-064 | Block quest accept if requirements not met | ⬜ | 30m | Q-063 | Backend |
| Q-065 | Show requirements in quest detail view | ⬜ | 1h | Q-063 | Frontend |

**Acceptance Criteria:**
- Quest shows "Requires: Level 40 Fishing"
- Cannot accept quest without meeting requirements
- Clear UI feedback on missing requirements

---

### 1.8 Quest Chains [P2]

| ID | Task | Status | Est. | Depends On | Assignee |
|----|------|--------|------|------------|----------|
| Q-070 | Add `quest_chains` table | ⬜ | 30m | - | Backend |
| Q-071 | Add `quest_chain_id` and `chain_order` to quests | ⬜ | 20m | Q-070 | Backend |
| Q-072 | Run migration | ⬜ | 15m | Q-071 | Backend |
| Q-073 | Add `get_quest_chain` tool | ⬜ | 45m | Q-072 | Backend |
| Q-074 | Add `get_next_quest_in_chain` tool | ⬜ | 30m | Q-073 | Backend |
| Q-075 | Auto-discover next quest when chain quest completed | ⬜ | 45m | Q-074, Q-052 | Backend |
| Q-076 | Quest chain visualization in UI | ⬜ | 2h | Q-073 | Frontend |

---

## Epic 2: World Visualization

**Goal:** See and interact with the Perlin-generated world

### 2.1 POI System (Backend) [P1]

| ID | Task | Status | Est. | Depends On | Assignee |
|----|------|--------|------|------------|----------|
| W-001 | Design POI schema (types, properties, metadata) | ⬜ | 1h | - | Design |
| W-002 | Add `points_of_interest` table | ⬜ | 30m | W-001 | Backend |
| W-003 | Add `routes` table (connections between POIs) | ⬜ | 30m | W-001 | Backend |
| W-004 | Run migrations | ⬜ | 15m | W-002, W-003 | Backend |
| W-005 | Implement `create_poi` tool | ⬜ | 1h | W-004 | Backend |
| W-006 | Implement `update_poi` tool | ⬜ | 30m | W-005 | Backend |
| W-007 | Implement `delete_poi` tool | ⬜ | 20m | W-005 | Backend |
| W-008 | Implement `get_poi` tool | ⬜ | 20m | W-005 | Backend |
| W-009 | Implement `list_pois` tool (with filters) | ⬜ | 45m | W-005 | Backend |
| W-010 | Implement `create_route` tool | ⬜ | 45m | W-003 | Backend |

---

### 2.2 World Map Component (Frontend) [P1]

| ID | Task | Status | Est. | Depends On | Assignee |
|----|------|--------|------|------------|----------|
| W-020 | Create `WorldMap.tsx` component shell | ⬜ | 30m | - | Frontend |
| W-021 | Fetch world tile data from `get_world_map_overview` | ⬜ | 45m | W-020 | Frontend |
| W-022 | Render 2D tile grid with biome colors | ⬜ | 2h | W-021 | Frontend |
| W-023 | Add pan/zoom controls | ⬜ | 1h | W-022 | Frontend |
| W-024 | Render POI markers on map | ⬜ | 1.5h | W-009 | Frontend |
| W-025 | POI click → detail popup | ⬜ | 1h | W-024 | Frontend |
| W-026 | Render routes between POIs | ⬜ | 1h | W-010 | Frontend |
| W-027 | Add "Enter Location" button on POI popup | ⬜ | 30m | W-025 | Frontend |

---

### 2.3 Location View [P2]

| ID | Task | Status | Est. | Depends On | Assignee |
|----|------|--------|------|------------|----------|
| W-030 | Design location view layout | ⬜ | 1h | - | Design |
| W-031 | Create `LocationView.tsx` component | ⬜ | 1h | W-030 | Frontend |
| W-032 | Display location description, NPCs, shops | ⬜ | 1.5h | W-031 | Frontend |
| W-033 | "Start Combat" button to create encounter | ⬜ | 1h | W-032 | Frontend |
| W-034 | Transition from Location → Battlemap on combat | ⬜ | 45m | W-033 | Frontend |

---

### 2.4 3D World Map (Optional Enhancement) [P3]

| ID | Task | Status | Est. | Depends On | Assignee |
|----|------|--------|------|------------|----------|
| W-040 | Create `WorldMap3D.tsx` using Three.js | ⬜ | 3h | W-022 | Frontend |
| W-041 | Generate terrain mesh from heightmap | ⬜ | 2h | W-040 | Frontend |
| W-042 | Apply biome textures/colors | ⬜ | 1.5h | W-041 | Frontend |
| W-043 | 3D POI markers (models/sprites) | ⬜ | 2h | W-042 | Frontend |
| W-044 | Toggle between 2D/3D views | ⬜ | 30m | W-043 | Frontend |

---

## Epic 3: Progression Systems

**Goal:** OSRS-style skills, achievements, and reputation

### 3.1 Skill System [P2]

| ID | Task | Status | Est. | Depends On | Assignee |
|----|------|--------|------|------------|----------|
| S-001 | Design skill list and XP curve | ⬜ | 1h | - | Design |
| S-002 | Add `skills` table to schema | ⬜ | 30m | S-001 | Backend |
| S-003 | Add `character_skills` table | ⬜ | 30m | S-002 | Backend |
| S-004 | Implement `grant_skill_xp` tool | ⬜ | 1h | S-003 | Backend |
| S-005 | Implement `get_character_skills` tool | ⬜ | 30m | S-003 | Backend |
| S-006 | Implement `check_skill_requirement` tool | ⬜ | 30m | S-005 | Backend |
| S-007 | XP curve calculation (OSRS formula) | ⬜ | 1h | S-004 | Backend |
| S-008 | Skills panel in character sheet UI | ⬜ | 2h | S-005 | Frontend |
| S-009 | Level-up notification | ⬜ | 45m | S-008 | Frontend |

---

### 3.2 Achievement System [P3]

| ID | Task | Status | Est. | Depends On | Assignee |
|----|------|--------|------|------------|----------|
| A-001 | Design achievement categories | ⬜ | 1h | - | Design |
| A-002 | Add `achievements` table | ⬜ | 30m | A-001 | Backend |
| A-003 | Add `character_achievements` table | ⬜ | 30m | A-002 | Backend |
| A-004 | Implement `unlock_achievement` tool | ⬜ | 45m | A-003 | Backend |
| A-005 | Implement `get_achievements` tool | ⬜ | 30m | A-003 | Backend |
| A-006 | Achievement triggers (quest complete, level up, etc.) | ⬜ | 2h | A-004 | Backend |
| A-007 | Achievements panel in UI | ⬜ | 1.5h | A-005 | Frontend |
| A-008 | Achievement unlock toast notification | ⬜ | 30m | A-007 | Frontend |

---

### 3.3 Faction/Reputation System [P2]

| ID | Task | Status | Est. | Depends On | Assignee |
|----|------|--------|------|------------|----------|
| F-001 | Design faction list and reputation tiers | ⬜ | 1h | - | Design |
| F-002 | Add `factions` table | ⬜ | 30m | F-001 | Backend |
| F-003 | Add `character_reputation` table | ⬜ | 30m | F-002 | Backend |
| F-004 | Implement `modify_reputation` tool | ⬜ | 45m | F-003 | Backend |
| F-005 | Implement `get_reputation` tool | ⬜ | 30m | F-003 | Backend |
| F-006 | Implement `check_reputation_requirement` tool | ⬜ | 30m | F-005 | Backend |
| F-007 | Reputation affects NPC dialogue (LLM context) | ⬜ | 1h | F-005 | Backend |
| F-008 | Reputation panel in UI | ⬜ | 1.5h | F-005 | Frontend |

---

## Epic 4: Enhanced Combat

**Goal:** Tactical, spatial, interactive battlemap

### 4.1 Spatial Combat [P2]

| ID | Task | Status | Est. | Depends On | Assignee |
|----|------|--------|------|------------|----------|
| C-001 | Add x, y, z position fields to encounter participants | ⬜ | 30m | - | Backend |
| C-002 | Implement `move_combatant` tool | ⬜ | 45m | C-001 | Backend |
| C-003 | Calculate movement distance/cost | ⬜ | 1h | C-002 | Backend |
| C-004 | Implement opportunity attack triggers | ⬜ | 1.5h | C-003 | Backend |
| C-005 | Range checking for attacks | ⬜ | 45m | C-001 | Backend |

---

### 4.2 Interactive Battlemap [P2]

| ID | Task | Status | Est. | Depends On | Assignee |
|----|------|--------|------|------------|----------|
| C-010 | Token click → select | ⬜ | 1h | - | Frontend |
| C-011 | Token drag → show movement range | ⬜ | 1.5h | C-010 | Frontend |
| C-012 | Token drop → call move_combatant | ⬜ | 1h | C-002, C-011 | Frontend |
| C-013 | Right-click context menu (attack, abilities) | ⬜ | 1.5h | C-010 | Frontend |
| C-014 | Highlight valid targets | ⬜ | 1h | C-005, C-013 | Frontend |
| C-015 | Combat log panel | ⬜ | 1.5h | - | Frontend |

---

### 4.3 Area Effects [P3]

| ID | Task | Status | Est. | Depends On | Assignee |
|----|------|--------|------|------------|----------|
| C-020 | Implement AoE targeting (cone, sphere, line) | ⬜ | 2h | C-001 | Backend |
| C-021 | Calculate affected targets in area | ⬜ | 1h | C-020 | Backend |
| C-022 | AoE preview overlay on battlemap | ⬜ | 2h | C-020 | Frontend |
| C-023 | AoE damage resolution | ⬜ | 1h | C-021 | Backend |

---

## Epic 5: Session Management

**Goal:** Save, load, and resume game state

### 5.1 Session Persistence [P2]

| ID | Task | Status | Est. | Depends On | Assignee |
|----|------|--------|------|------------|----------|
| SS-001 | Design session schema | ⬜ | 30m | - | Design |
| SS-002 | Add `sessions` table | ⬜ | 30m | SS-001 | Backend |
| SS-003 | Implement `save_session` tool | ⬜ | 1.5h | SS-002 | Backend |
| SS-004 | Implement `load_session` tool | ⬜ | 1.5h | SS-002 | Backend |
| SS-005 | Implement `list_sessions` tool | ⬜ | 30m | SS-002 | Backend |
| SS-006 | Implement `delete_session` tool | ⬜ | 30m | SS-002 | Backend |
| SS-007 | Auto-save on state changes | ⬜ | 1h | SS-003 | Backend |
| SS-008 | Session browser UI | ⬜ | 2h | SS-005 | Frontend |

---

### 5.2 Context Condensing [P2]

| ID | Task | Status | Est. | Depends On | Assignee |
|----|------|--------|------|------------|----------|
| SS-010 | Design condensed context format | ⬜ | 1h | - | Design |
| SS-011 | Implement `export_session` tool (markdown, json, condensed) | ⬜ | 2h | SS-010 | Backend |
| SS-012 | Token counting for context | ⬜ | 1h | SS-011 | Backend |
| SS-013 | Priority-based information selection | ⬜ | 1.5h | SS-012 | Backend |
| SS-014 | "Continue Session" button that loads condensed context | ⬜ | 1h | SS-011 | Frontend |

---

## Epic 6: Batch Operations & Workflows

**Goal:** Complex generation with minimal tool calls

### 6.1 Batch Tools [P2]

| ID | Task | Status | Est. | Depends On | Assignee |
|----|------|--------|------|------------|----------|
| B-001 | Implement `batch_create_characters` tool | ⬜ | 1.5h | - | Backend |
| B-002 | Implement `batch_create_npcs` tool | ⬜ | 1h | B-001 | Backend |
| B-003 | Implement `batch_distribute_items` tool | ⬜ | 1h | - | Backend |
| B-004 | Implement `batch_create_relationships` tool | ⬜ | 1.5h | - | Backend |
| B-005 | Transaction wrapper for atomic batch ops | ⬜ | 1h | B-001 | Backend |

---

### 6.2 Workflow Engine [P3]

| ID | Task | Status | Est. | Depends On | Assignee |
|----|------|--------|------|------------|----------|
| B-010 | Design workflow YAML schema | ⬜ | 1h | - | Design |
| B-011 | Implement YAML parser for workflows | ⬜ | 2h | B-010 | Backend |
| B-012 | Dependency resolution (DAG) | ⬜ | 2h | B-011 | Backend |
| B-013 | Variable interpolation (${...}) | ⬜ | 1.5h | B-012 | Backend |
| B-014 | Workflow executor with rollback | ⬜ | 2h | B-013 | Backend |
| B-015 | Create template workflows (Fellowship, Bandit Camp) | ⬜ | 2h | B-014 | Content |
| B-016 | Workflow browser UI | ⬜ | 2h | B-015 | Frontend |

---

## Sprint Planning Helper

### Sprint 1 (This Week) - Quest System Critical Fix
```
Q-001, Q-002, Q-003, Q-004, Q-005, Q-006
Q-020, Q-021, Q-022, Q-023, Q-024
Q-040, Q-041, Q-042, Q-043

Total: ~12 hours
```

### Sprint 2 (Next Week) - Quest System Completion + POI Start
```
Q-010, Q-011, Q-012
Q-030, Q-031, Q-032, Q-033
Q-060, Q-061, Q-062, Q-063, Q-064, Q-065
W-001, W-002, W-003, W-004

Total: ~14 hours
```

### Sprint 3 - World Visualization
```
W-005 through W-010 (POI Backend)
W-020 through W-027 (World Map Frontend)

Total: ~14 hours
```

---

## Dependency Graph (Simplified)

```
                    ┌─────────────┐
                    │ Quest Fix   │
                    │ (Q-001-006) │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ Tracking │ │ Rewards  │ │ Prereqs  │
        │ (Q-020s) │ │ (Q-040s) │ │ (Q-060s) │
        └────┬─────┘ └────┬─────┘ └────┬─────┘
             │            │            │
             └────────────┼────────────┘
                          ▼
                    ┌──────────┐
                    │  Chains  │
                    │ (Q-070s) │
                    └────┬─────┘
                         │
                         ▼
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
  ┌──────────┐    ┌──────────┐    ┌──────────┐
  │ POI Sys  │    │ Skills   │    │ Sessions │
  │ (W-001s) │    │ (S-001s) │    │ (SS-001s)│
  └────┬─────┘    └──────────┘    └──────────┘
       │
       ▼
  ┌──────────┐
  │World Map │
  │ (W-020s) │
  └──────────┘
```

---

## Document History

| Date | Version | Changes |
|------|---------|---------|
| Dec 2024 | 1.0 | Initial task breakdown |

