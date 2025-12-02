# Bundled Database Setup - Quest Keeper AI

**Date:** December 1, 2025  
**Status:** ✅ COMPLETE

---

## Overview

Quest Keeper AI ships with a **pre-populated database** containing the Fellowship of the Ring as starting game state. Each user gets their own copy of this initial database when they install the game.

---

## How It Works

### 1. Initial Database (`src-tauri/rpg.db`)

This is the "seed" database that ships with the application:
- **Size:** ~180KB
- **Contains:** 9 Fellowship characters with stats, inventory, and quest
- **Location:** `src-tauri/rpg.db` (bundled with app)

### 2. User's Working Database

When the user runs the game:
- The MCP server creates/uses `rpg.db` in the working directory
- On first run, it automatically uses the bundled seed data
- User's progress is saved to their local copy
- Original seed database remains unchanged

---

## Fellowship Characters Included

✅ **All 9 members of the Fellowship:**

1. **Gandalf the Grey** - Wizard, Level 15
2. **Aragorn, Son of Arathorn** - Ranger, Level 12  
3. **Legolas Greenleaf** - Ranger (Archer), Level 10
4. **Gimli, Son of Glóin** - Fighter, Level 10
5. **Boromir of Gondor** - Fighter, Level 10
6. **Frodo Baggins** - Rogue, Level 5
7. **Samwise Gamgee** - Fighter, Level 4
8. **Meriadoc Brandybuck** - Rogue, Level 3
9. **Peregrin Took** - Rogue, Level 2

---

## Updating the Bundled Database

If you want to update the starting game state (add characters, items, quests, etc.):

### Method 1: Via Claude Desktop (Recommended)

1. Open Claude Desktop with the rpg-mcp server configured
2. Create/modify characters, items, quests using Claude
3. Run the bundling script:
   ```bash
   npm run db:bundle
   ```
4. The script will:
   - Copy the database from Claude Desktop  
   - Merge WAL files (checkpoint)
   - Create a single standalone .db file
   - Place it in `src-tauri/rpg.db`

### Method 2: Direct SQL Edits

1. Open `src-tauri/rpg.db` with a SQLite browser
2. Make your changes
3. Save and close

---

## Database Schema

The database includes these tables:

- `characters` - Player characters and NPCs
- `items` - Item templates
- `inventory` - Character inventories
- `quests` - Quest definitions  
- `quest_logs` - Character quest progress
- `worlds` - World definitions
- `encounters` - Combat encounters
- `nations` - Grand strategy nations

---

## .gitignore Rules

The repo is configured to:

✅ **INCLUDE in version control:**
- `src-tauri/rpg.db` - The seed database

❌ **EXCLUDE from version control:**
- `src-tauri/rpg.db-shm` - Runtime shared memory
- `src-tauri/rpg.db-wal` - Runtime write-ahead log  
- Any other `*.db` files in the working directory

---

## Tauri Build Process

When you run `npm run tauri build`:

1. Tauri packages `src-tauri/rpg.db` into the app bundle
2. On user's first run:
   - MCP server spawns in the Tauri app directory
   - Finds the bundled `rpg.db`
   - Opens it for reading/writing
3. All user changes are saved to their local copy
4. Original seed remains in the app bundle (unmodified)

---

## Testing

### Test the Bundled Database

```bash
# Start the dev server
npm run tauri dev

# In the app, type:
/test

# Then ask:
show me all characters
```

**Expected Result:**
- Should show 9 Fellowship characters
- Character sheets should display properly
- Inventory should show signature items (Sting, Glamdring, Ring, etc.)

---

## Troubleshooting

### "0 characters found"

**Cause:** Database not bundled or corrupted  
**Fix:** Run `npm run db:bundle` again

### "Database is locked"

**Cause:** Claude Desktop or another process is using the source database  
**Fix:** Close Claude Desktop, then run `npm run db:bundle`

### "Database disk image is malformed"

**Cause:** Incomplete checkpoint (WAL not merged)  
**Fix:** Delete `src-tauri/rpg.db*` and run `npm run db:bundle` again

---

## Future: Custom Starting States

You could create multiple seed databases:

- `rpg-fellowship.db` - LOTR Fellowship (current)
- `rpg-empty.db` - Fresh start
- `rpg-demo.db` - Tutorial scenario
- `rpg-moria.db` - Mines of Moria campaign

Then let users choose at first launch!

---

## Scripts Reference

```json
{
  "db:bundle": "node scripts/checkpoint-database.js"
}
```

This script:
1. Opens Claude Desktop's database (read-only)
2. Copies `.db`, `.db-wal`, `.db-shm` files
3. Checkpoints WAL to merge all data
4. Switches to DELETE mode (no WAL files)
5. Cleans up temporary files
6. Verifies data integrity

---

**✅ Your game now ships with the Fellowship ready to go!**
