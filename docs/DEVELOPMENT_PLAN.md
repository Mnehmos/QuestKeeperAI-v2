# Quest Keeper AI - Development Plan

**Version:** 2.0
**Last Updated:** December 3, 2024
**Status:** Active Development (Phase 2 Complete)

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

### Phase 1: Core System Fixes ✅ COMPLETE
**Goal:** Make existing systems actually work
**Status:** Complete

| System | Status | Work Required |
|--------|--------|---------------|
| Characters | ✅ Complete | Full creation modal with dice rolling, point buy, AI backstory |
| Items | ✅ Complete | D&D 5e item database, equipment slots |
| Combat | ✅ Complete | 3D battlemap, initiative, terrain, cover system |
| **Quests** | ✅ Complete | Full quest data, objectives, rewards |
| World Gen | ✅ Complete | Perlin noise, biomes, regions, structures |

**Deliverables:**
1. ✅ Quest system returns full data (not just UUIDs)
2. ✅ Quest objective tracking works
3. ✅ Quest rewards actually grant items/XP
4. ✅ Frontend displays quests in Notes tab

---

### Phase 2: World Visualization ✅ COMPLETE
**Goal:** See the generated world
**Status:** Complete

**Components:**
1. **World Map Visualizer** ✅
   - 2D canvas-based tile renderer with zoom (0.25x-6x)
   - POI markers with emoji icons (city, town, dungeon, temple, etc.)
   - Click-to-select POI with detail panel
   - Multiple view modes: biomes, heightmap, temperature, moisture, rivers

2. **POI System** ✅
   - 11 POI types with descriptions
   - Structure rendering on world map
   - POI detail panel with coordinates, region, biome info
   - Region highlighting and capital markers

3. **Visualization Features** ✅
   - Biome color mapping (28+ biome types)
   - River visualization
   - Region boundaries
   - Interactive tooltips with coordinates

**Deliverables:**
1. ✅ WorldMapCanvas.tsx component (2D canvas renderer)
2. ✅ POI schema integrated with world state
3. ✅ POIDetailPanel.tsx for location details
4. ✅ Structure/POI click handling

---

### Phase 3: Progression Systems (OSRS-Style) ⬜ NOT STARTED
**Goal:** Deep, trackable character growth
**Status:** Not Started - Next Priority

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

### Phase 4: Enhanced Combat 🔧 PARTIAL
**Goal:** Tactical, spatial, visual combat
**Status:** 60% Complete

**Components:**
1. **Grid-Based Positioning** ✅
   - X/Y/Z coordinates for all entities
   - MCP coordinate system (0-20 range)
   - Grid visualization with compass rose
   - Coordinate labels at intervals

2. **Battlemap Visualization** ✅
   - 3D React Three Fiber battlemap
   - Entity tokens with size support
   - Terrain features with blocking/cover
   - 3-point dynamic lighting
   - Camera controls (position, zoom, rotation)

3. **Combat Features** 🔧 Partial
   - ✅ Cover mechanics (half/three-quarters/full)
   - ✅ Creature conditions system
   - ✅ Initiative and turn order
   - ⬜ Area effects visualization
   - ⬜ Click-to-move interactions
   - ⬜ Combat log panel

**Deliverables:**
1. ✅ Spatial combat with grid system
2. ✅ 3D battlemap with tokens and terrain
3. ⬜ AoE visualization
4. ⬜ Combat log panel
5. ⬜ Interactive token movement (drag-and-drop)

---

### Phase 5: Session Management 🔧 PARTIAL
**Goal:** Play forever, context permitting
**Status:** 65% Complete

**Components:**
1. **Session Save/Load** ✅
   - ✅ Zustand persist middleware for all stores
   - ✅ localStorage auto-persistence
   - ✅ Chat session management (create/switch/delete)
   - ✅ Game state auto-saving
   - ⬜ Multiple save slots/files
   - ⬜ Manual save/load to file

2. **Context Condensing** ⬜
   - ⬜ Summarize for LLM
   - ⬜ Token-aware compression
   - ⬜ Priority information

3. **Session Export** 🔧 Partial
   - ✅ JSON state available in stores
   - ✅ Character/quest/inventory data exportable
   - ⬜ Markdown adventure log export
   - ⬜ PDF character sheet export
   - ⬜ Dedicated export UI

**Deliverables:**
1. ✅ Auto-save via Zustand persist
2. ✅ Chat session management
3. ⬜ `export_session` with formats
4. ⬜ Context condenser
5. ⬜ Explicit save/load file UI

---

### Phase 6: Workflow Automation ⬜ NOT STARTED
**Goal:** One prompt → complex generation
**Status:** Not Started

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
- [x] Replace text parsing with JSON parsing in frontend (dual parsing strategy implemented)
- [x] Add proper error messages to UI (CommandResult with error types)
- [ ] Implement retry logic for MCP calls
- [x] Add loading states throughout (isSyncing flags in all stores)

### Should Address
- [ ] Add test suite for parsers
- [ ] Document all tool schemas
- [ ] Performance profiling for large worlds
- [ ] Accessibility improvements

### Nice to Have
- [x] Streaming LLM responses (StreamingMessage component)
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

### Phase 1 Complete When: ✅ ACHIEVED
- [x] `get_quest_log` returns full quest objects with objectives
- [x] Player can accept, track, and complete a quest
- [x] Rewards actually modify character state
- [x] Frontend displays quest log properly

### Phase 2 Complete When: ✅ ACHIEVED
- [x] World map renders in viewport
- [x] POIs visible on map
- [x] Click POI → see details
- [ ] Combat at POI → battlemap transition (partial - manual transition)

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

### Immediate Priorities
1. **Phase 3: Progression Systems** - Begin skill system implementation
2. **Combat Log Panel** - Add combat action history display
3. **Interactive Token Movement** - Click-to-move on battlemap

### Future Priorities
1. **Context Condensing** - LLM token management for long sessions
2. **Export System** - Markdown/PDF export for adventure logs
3. **Phase 6: Workflows** - Batch generation tools

---

## Bonus Features Implemented (Not in Original Plan)

| Feature | Description |
|---------|-------------|
| **Party System** | Full party management with roles, formations, share percentages |
| **Notes System** | Categorized notes with tags, search, pinning |
| **World Environment** | Weather, time, moon phases, forecasts, hazards |
| **AI Backstory Generation** | LLM-generated character backgrounds during creation |
| **Dice Rolling UI** | Interactive dice mechanics in character creation |
| **Secret Keeper** | Spoiler/censor system for GM-only content |

---

## Document History

| Date | Version | Changes |
|------|---------|---------|
| Dec 2024 | 1.0 | Initial plan based on system reviews |
| Dec 3, 2024 | 2.0 | Updated with implementation status - Phase 1 & 2 complete |

