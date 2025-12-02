# Beautiful Tool Output Formatting

**Date:** December 1, 2025  
**Status:** ✅ COMPLETE

---

## Overview

Quest Keeper AI now displays MCP tool outputs in **beautiful, readable markdown** instead of raw JSON. Each tool type has its own custom formatting with icons, tables, and structured layout.

---

## Formatted Tool Types

### 🎭 Characters

**Tool:** `list_characters`

**Old Output:**
```json
{
  "characters": [...],
  "count": 9
}
```

**New Output:**
```markdown
## 🎭 Characters (9)

### 1. Gandalf the Grey

**Level 20** | HP: `85/85` | AC: `15`

💪 **STR** 12 | 🏃 **DEX** 14 | ❤️ **CON** 14 | 🧠 **INT** 20 | 🦉 **WIS** 20 | 💬 **CHA** 18

> *Wizard of the Istari, bearer of Narya. Uses magic to guide and protect the Free Peoples.*

---
```

### 🎒 Inventory

**Tool:** `get_inventory`

**Features:**
- ✅ Grouped by equipped/unequipped
- ✅ Item icons by type (⚔️ weapons, 🛡️ armor, 💍 artifacts)
- ✅ Smart name detection (recognizes LOTR items)
- ✅ Currency display with coin emojis

**Example:**
```markdown
## 🎒 Inventory (3/100)

### 📦 Unequipped

- 💍 **The One Ring** ×1
- 🗡️ **Sting** ×1
- 🛡️ **Mithril Coat** ×1

### 💰 Currency

- 🟡 **50** gold
- ⚪ **25** silver
```

### 📜 Quests

**Tool:** `get_quest_log`

**Features:**
- ✅ Status icons (🔄 active, ✅ completed, ❌ failed)
- ✅ Checkbox objectives
- ✅ Progress tracking
- ✅ Reward display

**Example:**
```markdown
## 📜 Quest Log

### 🔄 Journey Through Moria

Cross the Mines of Moria to reach Lothlórien

**Objectives:**

- [x] Enter the mines (5/5)
- [ ] Navigate the dark halls (2/10)
- [ ] Escape to safety (0/1)

**Rewards:**
- 🌟 1000 XP
- 💰 100 gold

---
```

### ⚔️ Combat

**Tool:** `get_encounter_state`

**Features:**
- ✅ Initiative order with current turn marker
- ✅ Health status icons (💚 healthy, 🩹 wounded, 💀 dead)
- ✅ Condition tracking
- ✅ Round counter

**Example:**
```markdown
## ⚔️ Combat Encounter

**Round:** 3

### 🎯 Initiative Order

👉 **1.** Legolas 💚
　　Initiative: `22` | HP: `75/75`

　 **2.** Cave Troll 🩹
　　Initiative: `18` | HP: `45/120` | 🎭 Stunned

　 **3.** Gimli 💚
　　Initiative: `15` | HP: `90/90`
```

---

## Item Name Recognition

### Known LOTR Items

The formatter automatically recognizes these items by UUID:

| UUID Prefix | Item Name | Icon |
|-------------|-----------|------|
| `46575824` | The One Ring | 💍 |
| `6d0b75e2` | Sting | 🗡️ |
| `7d83ac9a` | Mithril Coat | 🛡️ |

**To Add More:**
Edit `src/utils/toolResponseFormatter.ts` → `guessItemName()` function

---

## Icon Reference

### Item Types

| Type | Icon |
|------|------|
| weapon | ⚔️ |
| armor | 🛡️ |
| consumable | 🧪 |
| quest | 📜 |
| artifact | 💎 |
| tool | 🔧 |
| misc | 📦 |

### Stats

| Stat | Icon |
|------|------|
| Strength | 💪 |
| Dexterity | 🏃 |
| Constitution | ❤️ |
| Intelligence | 🧠 |
| Wisdom | 🦉 |
| Charisma | 💬 |

### Currency

| Coin | Icon |
|------|------|
| Gold | 🟡 |
| Silver | ⚪ |
| Copper | 🟤 |

---

## How It Works

### Architecture

```
Tool Call → MCP Response → formatToolResponse() → Beautiful Markdown → ReactMarkdown
```

### File Structure

```
src/
├── utils/
│   └── toolResponseFormatter.ts    # Formatting logic
└── components/
    └── chat/
        └── ToolCallDisplay.tsx      # Display component
```

### Adding New Formatters

To add a new tool formatter:

1. **Add detection logic** in `formatToolResponse()`:
```typescript
if (toolName === 'your_tool' || actualData.yourField) {
    return formatYourTool(actualData);
}
```

2. **Create formatter function**:
```typescript
export function formatYourTool(data: any): string {
    let markdown = `## 🎯 Your Title\n\n`;
    // ... format data ...
    return markdown;
}
```

3. **Test it!**

---

## Customization

### Change Icons

Edit the helper functions at the bottom of `toolResponseFormatter.ts`:

```typescript
function getItemIcon(type: string): string {
    const icons: Record<string, string> = {
        weapon: '⚔️',  // Change this!
        // ...
    };
    return icons[type.toLowerCase()] || '📦';
}
```

### Change Table Styles

The markdown is rendered by `ReactMarkdown` with:
- `remarkGfm` - GitHub Flavored Markdown (tables, checkboxes)
- `rehypeHighlight` - Code syntax highlighting

Styling is controlled by Tailwind's `prose` classes in `ToolCallDisplay.tsx`.

---

## Examples in Action

### Before
```
{ "characters": [...9 objects...], "count": 9 }
```

### After
```
🎭 Characters (9)

1. Gandalf the Grey
   Level 20 | HP: 85/85 | AC: 15
   💪 STR 12 | 🏃 DEX 14 | ❤️ CON 14 | 🧠 INT 20 | 🦉 WIS 20 | 💬 CHA 18
   > Wizard of the Istari, bearer of Narya...

2. Aragorn, Son of Arathorn
   ...
```

---

## Testing

### Test Commands

```
/test                    # List all tools (baseline)
show me all characters   # Test character formatting
What's in Frodo's inventory?  # Test inventory formatting
```

### Expected Results

✅ Beautiful markdown with icons  
✅ Proper tables and lists  
✅ Collapsible tool call display  
✅ Syntax highlighting for JSON fallbacks

---

## Future Enhancements

### Planned Features

1. **Item Detail Lookup** - Fetch full item data from database
2. **Inline Character Portraits** - Show character art/avatars
3. **Combat Animations** - Animate initiative changes
4. **Quest Progress Bars** - Visual progress indicators
5. **Minimap** - Show location on world map

### Custom Themes

Could support user themes:
- Classic Terminal (current)
- Fantasy Parchment
- Modern Gaming
- Accessibility Mode (high contrast)

---

**✅ Tool outputs now look amazing! 🎨**
