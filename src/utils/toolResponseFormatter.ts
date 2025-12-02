/**
 * Format MCP tool responses into beautiful markdown
 */

interface Character {
    id: string;
    name: string;
    level: number;
    hp: number;
    maxHp: number;
    ac: number;
    stats?: {
        str: number;
        dex: number;
        con: number;
        int: number;
        wis: number;
        cha: number;
    };
    behavior?: string;
}

interface InventoryItem {
    itemId: string;
    quantity: number;
    equipped: boolean;
}

interface Item {
    id: string;
    name: string;
    type: string;
    description?: string;
    value?: number;
    weight?: number;
    properties?: Record<string, any>;
    createdAt?: string;
    updatedAt?: string;
}

interface DetailedInventoryItem {
    item: Item;
    quantity: number;
    equipped: boolean;
    slot?: string;
}

/**
 * Format a list of characters into a beautiful markdown table
 */
export function formatCharacterList(data: any): string {
    if (!data.characters || data.characters.length === 0) {
        return '> No characters found in the database.';
    }

    const characters: Character[] = data.characters;
    
    let markdown = `## 🎭 Characters (${data.count})\n\n`;
    
    characters.forEach((char, index) => {
        const statLine = char.stats 
            ? `💪 **STR** ${char.stats.str} | 🏃 **DEX** ${char.stats.dex} | ❤️ **CON** ${char.stats.con} | 🧠 **INT** ${char.stats.int} | 🦉 **WIS** ${char.stats.wis} | 💬 **CHA** ${char.stats.cha}`
            : '';

        markdown += `### ${index + 1}. ${char.name}\n\n`;
        markdown += `**Level ${char.level}** | `;
        markdown += `HP: \`${char.hp}/${char.maxHp}\` | `;
        markdown += `AC: \`${char.ac}\`\n\n`;
        
        if (statLine) {
            markdown += `${statLine}\n\n`;
        }
        
        if (char.behavior) {
            markdown += `> *${char.behavior}*\n\n`;
        }
        
        markdown += `---\n\n`;
    });

    return markdown;
}

/**
 * Format a single character into detailed markdown
 */
export function formatCharacter(char: Character): string {
    let markdown = `## 🎭 ${char.name}\n\n`;
    
    markdown += `**Level ${char.level}** | `;
    markdown += `HP: \`${char.hp}/${char.maxHp}\` | `;
    markdown += `AC: \`${char.ac}\`\n\n`;
    
    if (char.stats) {
        markdown += `### 📊 Ability Scores\n\n`;
        markdown += `| Ability | Score | Modifier |\n`;
        markdown += `|---------|-------|----------|\n`;
        markdown += `| 💪 Strength | ${char.stats.str} | ${formatModifier(char.stats.str)} |\n`;
        markdown += `| 🏃 Dexterity | ${char.stats.dex} | ${formatModifier(char.stats.dex)} |\n`;
        markdown += `| ❤️ Constitution | ${char.stats.con} | ${formatModifier(char.stats.con)} |\n`;
        markdown += `| 🧠 Intelligence | ${char.stats.int} | ${formatModifier(char.stats.int)} |\n`;
        markdown += `| 🦉 Wisdom | ${char.stats.wis} | ${formatModifier(char.stats.wis)} |\n`;
        markdown += `| 💬 Charisma | ${char.stats.cha} | ${formatModifier(char.stats.cha)} |\n\n`;
    }
    
    if (char.behavior) {
        markdown += `### 📖 Behavior\n\n`;
        markdown += `> ${char.behavior}\n\n`;
    }

    return markdown;
}

/**
 * Format inventory into beautiful markdown
 * If itemIds are provided, will attempt to look up names from a local cache
 */
export function formatInventory(data: any, itemCache?: Map<string, Item>): string {
    if (!data.items || data.items.length === 0) {
        return '> 🎒 Inventory is empty.';
    }

    const items: InventoryItem[] = data.items;
    const capacity = data.capacity || 100;
    const usedSlots = items.reduce((sum, item) => sum + item.quantity, 0);

    let markdown = `## 🎒 Inventory (${usedSlots}/${capacity})\n\n`;

    // Group items by equipped status
    const equippedItems = items.filter(item => item.equipped);
    const unequippedItems = items.filter(item => !item.equipped);

    if (equippedItems.length > 0) {
        markdown += `### ⚔️ Equipped\n\n`;
        equippedItems.forEach(item => {
            const detail = itemCache?.get(item.itemId);
            const name = detail?.name || guessItemName(item.itemId);
            const icon = getItemIcon(detail?.type || 'misc');
            
            markdown += `- ${icon} **${name}**`;
            if (item.quantity > 1) markdown += ` ×${item.quantity}`;
            if (detail?.description) markdown += `\n  > *${detail.description}*`;
            markdown += `\n`;
        });
        markdown += `\n`;
    }

    if (unequippedItems.length > 0) {
        markdown += `### 📦 Unequipped\n\n`;
        unequippedItems.forEach(item => {
            const detail = itemCache?.get(item.itemId);
            const name = detail?.name || guessItemName(item.itemId);
            const icon = getItemIcon(detail?.type || 'misc');
            
            markdown += `- ${icon} **${name}**`;
            if (item.quantity > 1) markdown += ` ×${item.quantity}`;
            if (detail?.description) markdown += `\n  > *${detail.description}*`;
            markdown += `\n`;
        });
        markdown += `\n`;
    }

    // Currency
    if (data.currency) {
        const { gold = 0, silver = 0, copper = 0 } = data.currency;
        if (gold > 0 || silver > 0 || copper > 0) {
            markdown += `### 💰 Currency\n\n`;
            if (gold > 0) markdown += `- 🟡 **${gold}** gold\n`;
            if (silver > 0) markdown += `- ⚪ **${silver}** silver\n`;
            if (copper > 0) markdown += `- 🟤 **${copper}** copper\n`;
        }
    }

    return markdown;
}

/**
 * Format quest log into markdown
 */
export function formatQuestLog(data: any): string {
    if (!data.quests || data.quests.length === 0) {
        return '> 📜 No active quests.';
    }

    let markdown = `## 📜 Quest Log\n\n`;

    data.quests.forEach((quest: any, _index: number) => {
        const statusIcon = quest.status === 'completed' ? '✅' : quest.status === 'failed' ? '❌' : '🔄';
        
        markdown += `### ${statusIcon} ${quest.title || 'Untitled Quest'}\n\n`;
        
        if (quest.description) {
            markdown += `${quest.description}\n\n`;
        }

        if (quest.objectives && quest.objectives.length > 0) {
            markdown += `**Objectives:**\n\n`;
            quest.objectives.forEach((obj: any) => {
                const done = obj.completed || obj.current >= obj.required;
                const checkbox = done ? '[x]' : '[ ]';
                const progress = obj.required ? ` (${obj.current}/${obj.required})` : '';
                markdown += `- ${checkbox} ${obj.description}${progress}\n`;
            });
            markdown += `\n`;
        }

        if (quest.rewards) {
            markdown += `**Rewards:**\n`;
            if (quest.rewards.experience) markdown += `- 🌟 ${quest.rewards.experience} XP\n`;
            if (quest.rewards.gold) markdown += `- 💰 ${quest.rewards.gold} gold\n`;
            if (quest.rewards.items && quest.rewards.items.length > 0) {
                markdown += `- 🎁 Items: ${quest.rewards.items.join(', ')}\n`;
            }
            markdown += `\n`;
        }

        markdown += `---\n\n`;
    });

    return markdown;
}

/**
 * Format encounter/combat state
 */
export function formatEncounter(data: any): string {
    if (!data) {
        return '> ⚔️ No active encounter.';
    }

    let markdown = `## ⚔️ Combat Encounter\n\n`;
    
    markdown += `**Round:** ${data.round || 1}\n\n`;

    if (data.participants && data.participants.length > 0) {
        markdown += `### 🎯 Initiative Order\n\n`;
        
        const sorted = [...data.participants].sort((a, b) => (b.initiative || 0) - (a.initiative || 0));
        
        sorted.forEach((p: any, index: number) => {
            const isCurrent = p.id === data.currentTurn;
            const marker = isCurrent ? '👉 ' : '　 ';
            const statusIcon = p.hp <= 0 ? '💀' : p.hp < p.maxHp / 2 ? '🩹' : '💚';
            
            markdown += `${marker}**${index + 1}.** ${p.name} ${statusIcon}\n`;
            markdown += `　　Initiative: \`${p.initiative || 0}\` | HP: \`${p.hp}/${p.maxHp}\``;
            
            if (p.conditions && p.conditions.length > 0) {
                markdown += ` | 🎭 ${p.conditions.join(', ')}`;
            }
            
            markdown += `\n\n`;
        });
    }

    return markdown;
}

/**
 * Format a single item into detailed markdown
 */
export function formatItem(data: any): string {
    const item: Item = data.item || data;

    if (!item || !item.name) {
        return '> Item not found.';
    }

    const icon = getItemIcon(item.type);
    let markdown = `## ${icon} ${item.name}\n\n`;

    markdown += `| Property | Value |\n`;
    markdown += `|----------|-------|\n`;
    markdown += `| **Type** | ${item.type} |\n`;
    if (item.value !== undefined) markdown += `| **Value** | ${item.value} gold |\n`;
    if (item.weight !== undefined) markdown += `| **Weight** | ${item.weight} lbs |\n`;
    markdown += `\n`;

    if (item.description) {
        markdown += `### 📖 Description\n\n`;
        markdown += `> ${item.description}\n\n`;
    }

    if (item.properties && Object.keys(item.properties).length > 0) {
        markdown += `### ✨ Properties\n\n`;
        for (const [key, value] of Object.entries(item.properties)) {
            const formattedValue = typeof value === 'object' ? JSON.stringify(value) : value;
            markdown += `- **${key}:** ${formattedValue}\n`;
        }
        markdown += `\n`;
    }

    markdown += `---\n\n`;
    markdown += `*ID: \`${item.id}\`*\n`;

    return markdown;
}

/**
 * Format a list of items into markdown
 */
export function formatItemList(data: any): string {
    const items: Item[] = data.items || [];
    const count = data.count ?? items.length;
    const query = data.query;

    if (items.length === 0) {
        return '> No items found.';
    }

    let markdown = `## 📦 Items (${count})\n\n`;

    if (query && Object.keys(query).length > 0) {
        const filters = Object.entries(query)
            .filter(([_, v]) => v !== undefined)
            .map(([k, v]) => `${k}: ${v}`)
            .join(', ');
        if (filters) {
            markdown += `*Filtered by: ${filters}*\n\n`;
        }
    }

    // Group by type
    const byType: Record<string, Item[]> = {};
    items.forEach(item => {
        const type = item.type || 'misc';
        if (!byType[type]) byType[type] = [];
        byType[type].push(item);
    });

    const typeOrder = ['weapon', 'armor', 'consumable', 'quest', 'misc'];
    const sortedTypes = Object.keys(byType).sort((a, b) => {
        const aIdx = typeOrder.indexOf(a);
        const bIdx = typeOrder.indexOf(b);
        return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
    });

    sortedTypes.forEach(type => {
        const typeItems = byType[type];
        const icon = getItemIcon(type);
        markdown += `### ${icon} ${type.charAt(0).toUpperCase() + type.slice(1)}s (${typeItems.length})\n\n`;

        typeItems.forEach(item => {
            markdown += `- **${item.name}**`;
            if (item.value !== undefined) markdown += ` • ${item.value}g`;
            if (item.weight !== undefined) markdown += ` • ${item.weight}lb`;
            if (item.description) markdown += `\n  > *${item.description.substring(0, 80)}${item.description.length > 80 ? '...' : ''}*`;
            markdown += `\n`;
        });
        markdown += `\n`;
    });

    return markdown;
}

/**
 * Format detailed inventory with full item info
 */
export function formatInventoryDetailed(data: any): string {
    const items: DetailedInventoryItem[] = data.items || [];
    const totalWeight = data.totalWeight || 0;
    const capacity = data.capacity || 100;

    if (items.length === 0) {
        return '> 🎒 Inventory is empty.';
    }

    let markdown = `## 🎒 Inventory\n\n`;
    markdown += `**Weight:** ${totalWeight.toFixed(1)} / ${capacity} lbs\n\n`;

    // Group by equipped status
    const equippedItems = items.filter(i => i.equipped);
    const unequippedItems = items.filter(i => !i.equipped);

    if (equippedItems.length > 0) {
        markdown += `### ⚔️ Equipped\n\n`;
        equippedItems.forEach(inv => {
            const icon = getItemIcon(inv.item.type);
            const slot = inv.slot ? ` [${inv.slot}]` : '';
            markdown += `- ${icon} **${inv.item.name}**${slot}`;
            if (inv.quantity > 1) markdown += ` ×${inv.quantity}`;
            if (inv.item.description) markdown += `\n  > *${inv.item.description}*`;
            markdown += `\n`;
        });
        markdown += `\n`;
    }

    if (unequippedItems.length > 0) {
        // Group unequipped by type
        const byType: Record<string, DetailedInventoryItem[]> = {};
        unequippedItems.forEach(inv => {
            const type = inv.item.type || 'misc';
            if (!byType[type]) byType[type] = [];
            byType[type].push(inv);
        });

        for (const [type, typeItems] of Object.entries(byType)) {
            const icon = getItemIcon(type);
            markdown += `### ${icon} ${type.charAt(0).toUpperCase() + type.slice(1)}s\n\n`;

            typeItems.forEach(inv => {
                markdown += `- **${inv.item.name}**`;
                if (inv.quantity > 1) markdown += ` ×${inv.quantity}`;
                if (inv.item.value) markdown += ` • ${inv.item.value}g`;
                if (inv.item.description) markdown += `\n  > *${inv.item.description}*`;
                markdown += `\n`;
            });
            markdown += `\n`;
        }
    }

    // Currency
    if (data.currency) {
        const { gold = 0, silver = 0, copper = 0 } = data.currency;
        if (gold > 0 || silver > 0 || copper > 0) {
            markdown += `### 💰 Currency\n\n`;
            if (gold > 0) markdown += `- 🟡 **${gold}** gold\n`;
            if (silver > 0) markdown += `- ⚪ **${silver}** silver\n`;
            if (copper > 0) markdown += `- 🟤 **${copper}** copper\n`;
        }
    }

    return markdown;
}

/**
 * Format item transfer result
 */
export function formatTransfer(data: any): string {
    let markdown = `## 🔄 Item Transferred\n\n`;
    markdown += `**${data.item || 'Item'}** ×${data.quantity || 1}\n\n`;
    markdown += `From: \`${data.from?.substring(0, 8) || 'Unknown'}...\`\n`;
    markdown += `To: \`${data.to?.substring(0, 8) || 'Unknown'}...\`\n\n`;
    markdown += `> ${data.message || 'Transfer complete.'}\n`;
    return markdown;
}

/**
 * Format item use result
 */
export function formatUseItem(data: any): string {
    let markdown = `## 🧪 Item Used\n\n`;

    if (data.item) {
        markdown += `**${data.item.name}** was consumed.\n\n`;
        if (data.item.description) {
            markdown += `> *${data.item.description}*\n\n`;
        }
    }

    if (data.effect) {
        markdown += `### ✨ Effect\n\n`;
        if (typeof data.effect === 'object') {
            for (const [key, value] of Object.entries(data.effect)) {
                markdown += `- **${key}:** ${value}\n`;
            }
        } else {
            markdown += `${data.effect}\n`;
        }
        markdown += `\n`;
    }

    markdown += `Target: \`${data.target?.substring(0, 8) || 'self'}...\`\n`;

    return markdown;
}

/**
 * Auto-detect response type and format accordingly
 */
export function formatToolResponse(toolName: string, response: any): string {
    try {
        // Parse if string
        const data = typeof response === 'string' ? JSON.parse(response) : response;
        
        // Extract from MCP wrapper if present
        const actualData = data.content?.[0]?.text 
            ? JSON.parse(data.content[0].text)
            : data;

        // Detect and format based on tool name or data structure
        if (toolName === 'list_characters' || actualData.characters) {
            return formatCharacterList(actualData);
        }

        if (toolName === 'get_character' && actualData.name) {
            return formatCharacter(actualData);
        }

        // Item tools
        if (toolName === 'get_item' || (actualData.item && !actualData.items)) {
            return formatItem(actualData);
        }

        if (toolName === 'list_items' || toolName === 'search_items') {
            return formatItemList(actualData);
        }

        if (toolName === 'transfer_item' && actualData.from && actualData.to) {
            return formatTransfer(actualData);
        }

        if (toolName === 'use_item' && actualData.consumed) {
            return formatUseItem(actualData);
        }

        if (toolName === 'get_inventory_detailed' && actualData.totalWeight !== undefined) {
            return formatInventoryDetailed(actualData);
        }

        // Standard inventory (items array with itemId fields, not full item objects)
        if (toolName === 'get_inventory' || (actualData.items && actualData.items[0]?.itemId)) {
            return formatInventory(actualData);
        }

        // Detailed inventory (items array with full item objects)
        if (actualData.items && actualData.items[0]?.item) {
            return formatInventoryDetailed(actualData);
        }

        if (toolName === 'get_quest_log' || actualData.quests) {
            return formatQuestLog(actualData);
        }

        if (toolName === 'get_encounter_state' || actualData.participants) {
            return formatEncounter(actualData);
        }

        // Fallback: pretty-print JSON
        return `\`\`\`json\n${JSON.stringify(actualData, null, 2)}\n\`\`\``;
        
    } catch (e) {
        // If parsing fails, return as-is
        return typeof response === 'string' ? response : JSON.stringify(response, null, 2);
    }
}

/**
 * Helper: Calculate D&D ability modifier
 */
function formatModifier(score: number): string {
    const mod = Math.floor((score - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
}

/**
 * Helper: Get emoji icon for item type
 */
function getItemIcon(type: string): string {
    const icons: Record<string, string> = {
        weapon: '⚔️',
        armor: '🛡️',
        consumable: '🧪',
        quest: '📜',
        artifact: '💎',
        tool: '🔧',
        misc: '📦',
    };
    return icons[type.toLowerCase()] || '📦';
}

/**
 * Helper: Guess item name from UUID (used when item details aren't available)
 */
function guessItemName(itemId: string): string {
    // Known LOTR items by UUID prefix (from the Fellowship setup)
    const knownItems: Record<string, string> = {
        '46575824': '💍 The One Ring',
        '6d0b75e2': '🗡️ Sting',
        '7d83ac9a': '🛡️ Mithril Coat',
    };

    const prefix = itemId.substring(0, 8);
    if (knownItems[prefix]) {
        return knownItems[prefix];
    }

    return `Item ${prefix}`;
}
