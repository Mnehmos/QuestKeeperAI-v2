# Quest Keeper AI - Development Plan

**Version:** 1.0  
**Last Updated:** December 2024  
**Status:** Active Development

---

## Vision Statement

> "A game where you can DO anything, TRACK everything, and GET BETTER continuously."

Quest Keeper AI combines:
- **OSRS-style progression** - Skills, quest chains, discovery, requirements
- **D&D 5e mechanics** - Stats, combat, narrative weight
- **AI Dungeon Master** - LLM-driven storytelling with mechanical grounding
- **Visual World** - 3D battlemaps, world maps, POI visualization

---

## Strategic Pillars

| Pillar | Description | Priority |
|--------|-------------|----------|
| **Mechanical Depth** | Rich, trackable game systems (quests, skills, items) | 🔴 Critical |
| **Visual Feedback** | Maps, battlemaps, character sheets that reflect state | 🟠 High |
| **AI Integration** | LLM DM with proper tools to manipulate world | 🟠 High |
| **Session Continuity** | Save, load, condense, resume anywhere | 🟡 Medium |
| **Multiplayer Foundation** | Session IDs, multi-character support | 🟢 Future |

---

## Development Phases

### Phase 1: Core System Fixes (Current Sprint)
**Goal:** Make existing systems actually work
**Duration:** 1-2 weeks

| System | Status | Work Required |
|--------|--------|---------------|
| Characters | ✅ Working | Minor polish |
| Items | ✅ Working | Done |
| Combat | ✅ Working | Spatial enhancement needed |
| **Quests** | 🔴 Broken | **CRITICAL FIX** |
| World Gen | ⚠️ Partial | POI system needed |

**Deliverables:**
1. ✅ Quest system returns full data (not just UUIDs)
2. ✅ Quest objective tracking works
3. ✅ Quest rewards actually grant items/XP
4. ⬜ Frontend displays quests properly

---

### Phase 2: World Visualization
**Goal:** See the generated world
**Duration:** 2-3 weeks

**Components:**
1. **World Map Visualizer** (New viewport tab)
   - 2D tile map from Perlin data
   - POI markers (towns, dungeons, landmarks)
   - Click-to-enter navigation
   
2. **POI System** (Backend tools)
   - `create_poi`, `update_poi`, `list_pois`, `get_poi`
   - `create_route` (roads, trade routes)
   - POI types: town, city, dungeon, ruins, landmark, camp, shrine

3. **Zoom Level Navigation**
   - World Map → Location → Battlemap
   - Seamless transitions

**Deliverables:**
1. ⬜ WorldMap.tsx component (2D tile renderer)
2. ⬜ POI schema and tools in rpg-mcp
3. ⬜ Location detail view
4. ⬜ Combat trigger from POI

---

### Phase 3: Progression Systems (OSRS-Style)
**Goal:** Deep, trackable character growth
**Duration:** 3-4 weeks

**Components:**
1. **Skill System**
   - Skills: Combat, Magic, Crafting, Gathering, Social
   - XP curves (OSRS-style exponential)
   - Skill requirements for quests/items

2. **Quest Chains**
   - Multi-part storylines
   - Unlock progression
   - Branching paths

3. **Achievement System**
   - Milestones tracked
   - Titles/rewards
   - Discovery achievements

4. **Reputation/Factions**
   - Standing with groups
   - Unlocks based on reputation
   - Faction conflicts

**Deliverables:**
1. ⬜ Skill schema and tools
2. ⬜ Quest chain support
3. ⬜ Achievement tracking
4. ⬜ Faction system

---

### Phase 4: Enhanced Combat
**Goal:** Tactical, spatial, visual combat
**Duration:** 2-3 weeks

**Components:**
1. **Grid-Based Positioning**
   - X/Y coordinates for all participants
   - Movement costs by terrain
   - Opportunity attacks

2. **Battlemap Interactivity**
   - Click to select token
   - Drag to move
   - Context menu for actions

3. **Combat Features**
   - Area effects (fireball, etc.)
   - Cover mechanics
   - Height advantage

**Deliverables:**
1. ⬜ Spatial combat tools
2. ⬜ Interactive battlemap
3. ⬜ AoE visualization
4. ⬜ Combat log panel

---

### Phase 5: Session Management
**Goal:** Play forever, context permitting
**Duration:** 2 weeks

**Components:**
1. **Session Save/Load**
   - Full state persistence
   - Multiple save slots
   - Auto-save

2. **Context Condensing**
   - Summarize for LLM
   - Token-aware compression
   - Priority information

3. **Session Export**
   - Markdown adventure log
   - JSON state dump
   - Character sheets (PDF?)

**Deliverables:**
1. ⬜ `save_session`, `load_session` tools
2. ⬜ `export_session` with formats
3. ⬜ Context condenser
4. ⬜ Session management UI

---

### Phase 6: Workflow Automation
**Goal:** One prompt → complex generation
**Duration:** 2-3 weeks

**Components:**
1. **Batch Operations**
   - `batch_create_characters`
   - `batch_create_npcs`
   - `batch_distribute_items`

2. **Workflow Engine**
   - YAML workflow definitions
   - Dependency resolution
   - Variable interpolation

3. **Template Library**
   - Pre-built campaigns (LOTR, etc.)
   - Settlement generators
   - Encounter generators

**Deliverables:**
1. ⬜ Batch tools in rpg-mcp
2. ⬜ Workflow executor
3. ⬜ Template YAML files
4. ⬜ Workflow browser UI

---

## Technical Debt & Infrastructure

### Must Address
- [ ] Replace text parsing with JSON parsing in frontend
- [ ] Add proper error messages to UI
- [ ] Implement retry logic for MCP calls
- [ ] Add loading states throughout

### Should Address
- [ ] Add test suite for parsers
- [ ] Document all tool schemas
- [ ] Performance profiling for large worlds
- [ ] Accessibility improvements

### Nice to Have
- [ ] Streaming LLM responses
- [ ] WebSocket transport for real-time events
- [ ] Multi-client support
- [ ] Plugin system for custom rules

---

## Resource Allocation

### Backend (rpg-mcp)
```
Phase 1: 60% effort (Quest system critical)
Phase 2: 40% effort (POI tools)
Phase 3: 70% effort (New systems)
Phase 4: 50% effort (Combat tools)
Phase 5: 40% effort (Session tools)
Phase 6: 60% effort (Batch/Workflow)
```

### Frontend (Quest Keeper AI)
```
Phase 1: 40% effort (Quest display)
Phase 2: 60% effort (World map viz)
Phase 3: 30% effort (UI for progression)
Phase 4: 50% effort (Interactive battlemap)
Phase 5: 60% effort (Session UI)
Phase 6: 40% effort (Workflow browser)
```

---

## Success Metrics

### Phase 1 Complete When:
- [ ] `get_quest_log` returns full quest objects with objectives
- [ ] Player can accept, track, and complete a quest
- [ ] Rewards actually modify character state
- [ ] Frontend displays quest log properly

### Phase 2 Complete When:
- [ ] World map renders in viewport
- [ ] POIs visible on map
- [ ] Click POI → see details
- [ ] Combat at POI → battlemap transition

### Phase 3 Complete When:
- [ ] Skills track XP and level
- [ ] Quest chains work (A unlocks B unlocks C)
- [ ] Achievements trigger on milestones
- [ ] Faction reputation affects interactions

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Quest fix takes longer | Medium | High | Timebox to 3 days, simplify if needed |
| World map performance | Low | Medium | Use LOD, chunking, virtualization |
| LLM context overflow | High | High | Priority: Context condensing |
| Scope creep | High | Medium | Strict phase boundaries |
| Breaking changes in MCP | Low | High | Pin dependency versions |

---

## Next Actions

### This Week
1. **Fix `get_quest_log`** - Embed full quest data
2. **Add `get_quest`** - Single quest lookup
3. **Add objective tracking** - Increment progress
4. **Update frontend formatter** - Display quests

### Next Week
1. **Quest chain schema** - Database additions
2. **Prerequisite checking** - Requirements system
3. **Quest discovery** - OSRS-style reveal
4. **POI system design** - Prepare for Phase 2

---

## Document History

| Date | Version | Changes |
|------|---------|---------|
| Dec 2024 | 1.0 | Initial plan based on system reviews |

