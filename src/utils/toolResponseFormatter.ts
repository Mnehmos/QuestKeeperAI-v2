/**
 * Format MCP tool responses into beautiful markdown
 * Now also supports returning structured data for rich visualizations
 */

import { useCombatStore } from '../stores/combatStore';

// Visualization type indicators for components
export type VisualizationType =
    | 'world'
    | 'world_overview'
    | 'nation'
    | 'nation_list'
    | 'region'
    | 'region_detail'
    | 'strategy_state'
    | null;

export interface FormattedResponse {
    markdown: string;
    visualization?: {
        type: VisualizationType;
        data: any;
    };
}


/**
 * Process pre-formatted combat response text:
 * - Extract embedded STATE_JSON and update combat store
 * - Strip STATE_JSON block from display text
 */
function processFormattedCombatResponse(text: string): string {
    console.log('[processFormattedCombatResponse] Called with text length:', text.length);
    
    // Extract STATE_JSON if present
    const stateJsonMatch = text.match(/<!-- STATE_JSON\n([\s\S]*?)\nSTATE_JSON -->/);
    
    if (stateJsonMatch && stateJsonMatch[1]) {
        console.log('[processFormattedCombatResponse] Found STATE_JSON block');
        try {
            const stateJson = JSON.parse(stateJsonMatch[1]);
            console.log('[processFormattedCombatResponse] Parsed STATE_JSON:', {
                encounterId: stateJson.encounterId,
                participantCount: stateJson.participants?.length,
                participants: stateJson.participants?.map((p: any) => ({ name: p.name, id: p.id, hp: p.hp }))
            });
            
            // Update combat store with the state
            useCombatStore.getState().updateFromStateJson(stateJson);
            console.log('[processFormattedCombatResponse] Called updateFromStateJson');
        } catch (e) {
            console.warn('[processFormattedCombatResponse] Failed to parse STATE_JSON:', e);
        }
    } else {
        console.log('[processFormattedCombatResponse] No STATE_JSON block found');
    }
    
    // Strip the STATE_JSON block from display
    return text.replace(/\n*<!-- STATE_JSON[\s\S]*?STATE_JSON -->\n*/g, '').trim();
}

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

// ============================================================================
// WORLD VISUALIZATION FORMATTERS
// ============================================================================

/**
 * Format world data (from get_world, create_world, list_worlds)
 */
export function formatWorld(data: any): FormattedResponse {
    const world = data.world || data;

    let markdown = `## 🌍 ${world.name || 'World'}\n\n`;

    if (world.seed) markdown += `**Seed:** \`${world.seed}\`\n`;
    if (world.width && world.height) markdown += `**Size:** ${world.width}×${world.height}\n`;
    if (world.id) markdown += `**ID:** \`${world.id.substring(0, 12)}...\`\n`;

    markdown += `\n`;

    // Environment info
    if (world.environment) {
        const env = world.environment;
        markdown += `### 🌤️ Environment\n\n`;
        if (env.timeOfDay || env.time_of_day) markdown += `- **Time:** ${env.timeOfDay || env.time_of_day}\n`;
        if (env.weather || env.weatherConditions) markdown += `- **Weather:** ${env.weather || env.weatherConditions}\n`;
        if (env.season) markdown += `- **Season:** ${typeof env.season === 'string' ? env.season : env.season.current}\n`;
        if (env.temperature) markdown += `- **Temperature:** ${typeof env.temperature === 'string' ? env.temperature : env.temperature.current}\n`;
        if (env.moonPhase || env.moon_phase) markdown += `- **Moon:** ${env.moonPhase || env.moon_phase}\n`;
        markdown += `\n`;
    }

    return {
        markdown,
        visualization: {
            type: 'world',
            data: world
        }
    };
}

/**
 * Format world list (from list_worlds)
 */
export function formatWorldList(data: any): FormattedResponse {
    const worlds = data.worlds || [];
    const count = data.count ?? worlds.length;

    let markdown = `## 🌍 Worlds (${count})\n\n`;

    if (worlds.length === 0) {
        markdown += `> No worlds found. Create one with \`generate_world\` or \`create_world\`.\n`;
        return { markdown };
    }

    markdown += `| Name | Size | Seed | ID |\n`;
    markdown += `|------|------|------|----|\n`;

    worlds.forEach((world: any) => {
        const name = world.name || 'Unnamed';
        const size = world.width && world.height ? `${world.width}×${world.height}` : 'N/A';
        const seed = world.seed || 'N/A';
        const id = world.id?.substring(0, 8) || 'N/A';
        markdown += `| ${name} | ${size} | \`${seed}\` | \`${id}...\` |\n`;
    });

    markdown += `\n`;

    return {
        markdown,
        visualization: worlds.length === 1 ? { type: 'world', data: worlds[0] } : undefined
    };
}

/**
 * Format world map overview (from get_world_map_overview)
 */
export function formatWorldMapOverview(data: any): FormattedResponse {
    let markdown = `## 🗺️ World Map Overview\n\n`;

    if (data.seed) markdown += `**Seed:** \`${data.seed}\`\n`;
    if (data.dimensions) {
        markdown += `**Dimensions:** ${data.dimensions.width}×${data.dimensions.height}\n`;
    }
    markdown += `\n`;

    // Biome distribution
    if (data.biomeDistribution) {
        markdown += `### 🌿 Biome Distribution\n\n`;
        const sorted = Object.entries(data.biomeDistribution)
            .sort(([, a], [, b]) => (b as number) - (a as number));

        markdown += `| Biome | Coverage |\n`;
        markdown += `|-------|----------|\n`;
        sorted.forEach(([biome, pct]) => {
            const bar = '█'.repeat(Math.round((pct as number) / 5)) + '░'.repeat(20 - Math.round((pct as number) / 5));
            markdown += `| ${biome.replace(/_/g, ' ')} | ${bar} ${pct}% |\n`;
        });
        markdown += `\n`;
    }

    // Stats
    markdown += `### 📊 Statistics\n\n`;
    if (data.regionCount !== undefined) markdown += `- **Regions:** ${data.regionCount}\n`;
    if (data.structureCount !== undefined) markdown += `- **Structures:** ${data.structureCount}\n`;
    if (data.riverTileCount !== undefined) markdown += `- **River Tiles:** ${data.riverTileCount}\n`;

    return {
        markdown,
        visualization: {
            type: 'world_overview',
            data
        }
    };
}

/**
 * Format region data (from get_region_map)
 */
export function formatRegion(data: any): FormattedResponse {
    const region = data.region || data;

    let markdown = `## 📍 ${region.name}\n\n`;

    markdown += `**Type:** ${region.type}\n`;
    if (region.dominantBiome) markdown += `**Biome:** ${region.dominantBiome.replace(/_/g, ' ')}\n`;
    if (region.capitalX !== undefined && region.capitalY !== undefined) {
        markdown += `**Capital:** (${region.capitalX}, ${region.capitalY})\n`;
    }
    markdown += `\n`;

    // Structures in region
    if (data.structures && data.structures.length > 0) {
        markdown += `### 🏗️ Structures (${data.structures.length})\n\n`;
        data.structures.forEach((s: any) => {
            const icon = getStructureIcon(s.type);
            const x = s.x ?? s.location?.x;
            const y = s.y ?? s.location?.y;
            markdown += `- ${icon} **${s.name}** (${s.type}) at (${x}, ${y})`;
            if (s.population) markdown += ` - Pop: ${s.population.toLocaleString()}`;
            markdown += `\n`;
        });
        markdown += `\n`;
    }

    if (data.tileCount) {
        markdown += `**Area:** ${data.tileCount} tiles\n`;
    }

    return {
        markdown,
        visualization: {
            type: 'region_detail',
            data
        }
    };
}

/**
 * Format nation data (from get_nation_state, create_nation)
 */
export function formatNation(data: any): FormattedResponse {
    const nation = data.nation || data;

    const ideologyIcons: Record<string, string> = {
        democracy: '🗳️',
        autocracy: '👑',
        theocracy: '⛪',
        tribal: '🏕️'
    };

    let markdown = `## ${ideologyIcons[nation.ideology] || '🏴'} ${nation.name}\n\n`;

    markdown += `**Leader:** ${nation.leader}\n`;
    markdown += `**Ideology:** ${nation.ideology}\n`;
    markdown += `**GDP:** $${nation.gdp?.toLocaleString() || 0}\n\n`;

    // Personality traits
    markdown += `### 🧠 Personality\n\n`;
    markdown += `| Trait | Value |\n`;
    markdown += `|-------|-------|\n`;
    markdown += `| ⚔️ Aggression | ${nation.aggression}/100 |\n`;
    markdown += `| 🤝 Trust | ${nation.trust}/100 |\n`;
    markdown += `| 👁️ Paranoia | ${nation.paranoia}/100 |\n`;
    markdown += `\n`;

    // Resources
    if (nation.resources) {
        markdown += `### 📦 Resources\n\n`;
        markdown += `- 🌾 Food: **${nation.resources.food}**\n`;
        markdown += `- ⚙️ Metal: **${nation.resources.metal}**\n`;
        markdown += `- 🛢️ Oil: **${nation.resources.oil}**\n`;
        markdown += `\n`;
    }

    // Public intent
    if (nation.publicIntent) {
        markdown += `### 📢 Declaration\n\n`;
        markdown += `> *"${nation.publicIntent}"*\n\n`;
    }

    // Relations
    if (nation.relations && Object.keys(nation.relations).length > 0) {
        markdown += `### 🤝 Relations\n\n`;
        for (const [id, rel] of Object.entries(nation.relations) as [string, any][]) {
            const status = rel.alliance ? '🤝 Allied' : rel.truceUntil ? '⚖️ Truce' : '—';
            const opinion = rel.opinion > 0 ? `+${rel.opinion}` : rel.opinion;
            markdown += `- **${id.substring(0, 8)}...**: ${opinion} (${status})\n`;
        }
        markdown += `\n`;
    }

    return {
        markdown,
        visualization: {
            type: 'nation',
            data: nation
        }
    };
}

/**
 * Format strategy state (from get_strategy_state - with Fog of War)
 */
export function formatStrategyState(data: any): FormattedResponse {
    let markdown = `## ⚔️ Grand Strategy View\n\n`;

    const nations = data.nations || [];
    const regions = data.regions || [];

    if (nations.length > 0) {
        markdown += `### 🏴 Nations (${nations.length})\n\n`;
        nations.forEach((n: any) => {
            const ideologyIcons: Record<string, string> = {
                democracy: '🗳️',
                autocracy: '👑',
                theocracy: '⛪',
                tribal: '🏕️'
            };
            markdown += `- ${ideologyIcons[n.ideology] || '🏴'} **${n.name}** (${n.leader}) - GDP: $${n.gdp?.toLocaleString() || '???'}\n`;
        });
        markdown += `\n`;
    }

    if (regions.length > 0) {
        markdown += `### 📍 Regions (${regions.length})\n\n`;
        const byOwner: Record<string, any[]> = {};
        regions.forEach((r: any) => {
            const owner = r.ownerNationId || 'Unclaimed';
            if (!byOwner[owner]) byOwner[owner] = [];
            byOwner[owner].push(r);
        });

        for (const [owner, regs] of Object.entries(byOwner)) {
            const ownerLabel = owner === 'Unclaimed' ? '🏳️ Unclaimed' : `🏴 ${owner.substring(0, 8)}...`;
            markdown += `**${ownerLabel}** (${regs.length} regions)\n`;
            regs.slice(0, 5).forEach((r: any) => {
                markdown += `  - ${r.name} (${r.type})\n`;
            });
            if (regs.length > 5) markdown += `  - ...and ${regs.length - 5} more\n`;
            markdown += `\n`;
        }
    }

    return {
        markdown,
        visualization: {
            type: 'strategy_state',
            data
        }
    };
}

/**
 * Helper: Get structure icon
 */
function getStructureIcon(type: string): string {
    const icons: Record<string, string> = {
        city: '🏙️',
        town: '🏘️',
        village: '🏠',
        castle: '🏰',
        ruins: '🏚️',
        dungeon: '⚔️',
        temple: '⛪',
    };
    return icons[type?.toLowerCase()] || '🏛️';
}

/**
 * Auto-detect response type and format accordingly
 * Returns FormattedResponse with both markdown and optional visualization data
 */
export function formatToolResponseWithVisualization(toolName: string, response: any): FormattedResponse {
    try {
        // Parse if string
        const data = typeof response === 'string' ? JSON.parse(response) : response;

        // Extract from MCP wrapper if present
        let actualData = data;
        if (data.content?.[0]?.text) {
            const textContent = data.content[0].text;
            // Try to parse as JSON, but if it fails, treat as pre-formatted text
            try {
                actualData = JSON.parse(textContent);
            } catch {
                // Text is already formatted (e.g., combat responses with emojis)
                // Process any embedded STATE_JSON and strip it from display
                const cleanedText = processFormattedCombatResponse(textContent);
                return { markdown: cleanedText };
            }
        }

        // World tools - return rich visualization data
        if (toolName === 'list_worlds' || actualData.worlds) {
            return formatWorldList(actualData);
        }

        if (toolName === 'get_world' || toolName === 'create_world' ||
            (actualData.name && actualData.seed && actualData.width)) {
            return formatWorld(actualData);
        }

        if (toolName === 'get_world_map_overview' || actualData.biomeDistribution) {
            return formatWorldMapOverview(actualData);
        }

        if (toolName === 'get_region_map' || (actualData.region && actualData.tiles)) {
            return formatRegion(actualData);
        }

        // Nation/Strategy tools
        if (toolName === 'create_nation' || toolName === 'get_nation_state' ||
            (actualData.name && actualData.ideology && actualData.gdp !== undefined)) {
            return formatNation(actualData);
        }

        if (toolName === 'get_strategy_state' || (actualData.nations && actualData.regions)) {
            return formatStrategyState(actualData);
        }

        // Fall back to existing formatters
        const markdown = formatToolResponse(toolName, response);
        return { markdown };

    } catch (e) {
        const markdown = typeof response === 'string' ? response : JSON.stringify(response, null, 2);
        return { markdown };
    }
}

/**
 * Auto-detect response type and format accordingly
 */
export function formatToolResponse(toolName: string, response: any): string {
    try {
        // Parse if string
        const data = typeof response === 'string' ? JSON.parse(response) : response;
        
        // Extract from MCP wrapper if present
        let actualData = data;
        if (data.content?.[0]?.text) {
            const textContent = data.content[0].text;
            // Try to parse as JSON, but if it fails, treat as pre-formatted text
            try {
                actualData = JSON.parse(textContent);
            } catch {
                // Text is already formatted (e.g., combat responses with emojis)
                // Process any embedded STATE_JSON and strip it from display
                return processFormattedCombatResponse(textContent);
            }
        }

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

        // Secret Keeper tools - redact sensitive information
        if (toolName === 'create_secret' || (actualData.secret && actualData.warning)) {
            return formatCreateSecret(actualData);
        }

        if (toolName === 'get_secret' || (actualData.secretDescription && !actualData.secrets)) {
            return formatGetSecret(actualData);
        }

        if (toolName === 'list_secrets' || actualData.secretsByType) {
            return formatListSecrets(actualData);
        }

        if (toolName === 'get_secrets_for_context' || actualData.context?.includes('DO NOT REVEAL')) {
            return formatSecretsForContext(actualData);
        }

        if (toolName === 'check_for_leaks' || actualData.leaks !== undefined) {
            return formatCheckForLeaks(actualData);
        }

        if (toolName === 'check_reveal_conditions' || actualData.secretsToReveal) {
            return formatCheckRevealConditions(actualData);
        }

        if (toolName === 'reveal_secret' || actualData.spoilerMarkdown || actualData.message?.includes('revealed')) {
            return formatRevealSecret(actualData);
        }

        if (toolName === 'update_secret' && actualData.secret) {
            return formatUpdateSecret(actualData);
        }

        if (toolName === 'delete_secret') {
            return formatDeleteSecret(actualData);
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

// ============================================================================
// SECRET KEEPER FORMATTERS - Redact sensitive information from tool responses
// ============================================================================

/**
 * Format create_secret response - hide the actual secret content
 */
export function formatCreateSecret(data: any): string {
    const secret = data.secret || data;

    let markdown = `## 🔒 Secret Created\n\n`;
    markdown += `**Name:** ${secret.name}\n`;
    markdown += `**Type:** ${secret.type} (${secret.category || 'general'})\n`;
    markdown += `**Sensitivity:** ${secret.sensitivity?.toUpperCase() || 'MEDIUM'}\n\n`;

    markdown += `> Secret registered successfully. Hidden from player view.\n\n`;

    // Censor the actual secret content
    markdown += `[censor]`;
    markdown += `ID: ${secret.id}\n`;
    markdown += `Secret: ${secret.secretDescription}\n`;
    if (secret.leakPatterns?.length) {
        markdown += `Leak Patterns: ${secret.leakPatterns.join(', ')}\n`;
    }
    markdown += `[/censor]`;

    if (data.warning) {
        markdown += `\n\n⚠️ *${data.warning}*`;
    }

    return markdown;
}

/**
 * Format get_secret response - fully censor for player safety
 */
export function formatGetSecret(data: any): string {
    const secret = data.secret || data;

    let markdown = `## 🔒 Secret Details\n\n`;
    markdown += `**Name:** ${secret.name}\n`;
    markdown += `**Type:** ${secret.type}\n`;
    markdown += `**Status:** ${secret.revealed ? '🔓 Revealed' : '🔒 Hidden'}\n\n`;

    // Everything sensitive goes in censor block
    markdown += `[censor]`;
    markdown += `ID: ${secret.id}\n`;
    markdown += `Public: ${secret.publicDescription}\n`;
    markdown += `Secret: ${secret.secretDescription}\n`;
    markdown += `Sensitivity: ${secret.sensitivity}\n`;
    if (secret.leakPatterns?.length) {
        markdown += `Leak Patterns: ${secret.leakPatterns.join(', ')}\n`;
    }
    if (secret.revealConditions?.length) {
        markdown += `Reveal Conditions: ${JSON.stringify(secret.revealConditions)}\n`;
    }
    if (secret.revealed) {
        markdown += `Revealed At: ${secret.revealedAt}\n`;
        markdown += `Revealed By: ${secret.revealedBy}\n`;
    }
    markdown += `[/censor]`;

    return markdown;
}

/**
 * Format list_secrets response - show summary, hide details
 */
export function formatListSecrets(data: any): string {
    const secrets = data.secrets || [];
    const count = data.count || secrets.length;

    let markdown = `## 🔒 Secrets Registry (${count})\n\n`;

    if (secrets.length === 0) {
        return markdown + `> No secrets found for this world.`;
    }

    // Group by type if available
    const byType = data.secretsByType || {};

    if (Object.keys(byType).length > 0) {
        for (const [type, typeSecrets] of Object.entries(byType)) {
            const items = typeSecrets as any[];
            markdown += `### ${getSecretTypeIcon(type)} ${type.charAt(0).toUpperCase() + type.slice(1)} (${items.length})\n\n`;

            items.forEach((s: any) => {
                const status = s.revealed ? '🔓' : '🔒';
                markdown += `- ${status} **${s.name}** [censor](${s.id?.substring(0, 8)})[/censor]\n`;
            });
            markdown += `\n`;
        }
    } else {
        secrets.forEach((s: any) => {
            const status = s.revealed ? '🔓' : '🔒';
            const icon = getSecretTypeIcon(s.type);
            markdown += `- ${status} ${icon} **${s.name}** - ${s.type} [censor](${s.id?.substring(0, 8)})[/censor]\n`;
        });
    }

    // Stats summary
    const revealed = secrets.filter((s: any) => s.revealed).length;
    const hidden = count - revealed;
    markdown += `\n---\n`;
    markdown += `**Stats:** ${hidden} hidden, ${revealed} revealed\n`;

    return markdown;
}

/**
 * Format get_secrets_for_context - FULLY CENSOR (this is LLM-only context)
 */
export function formatSecretsForContext(data: any): string {
    let markdown = `## 🔒 Secrets Context Loaded\n\n`;
    markdown += `**Secrets Loaded:** ${data.secretCount || 0}\n`;
    markdown += `**World:** [censor]${data.worldId}[/censor]\n\n`;

    markdown += `> Context injected into LLM system prompt.\n\n`;

    // The entire context is DM-only
    markdown += `[censor]`;
    markdown += `--- FULL SECRET CONTEXT (DM ONLY) ---\n`;
    markdown += data.context || 'No context available';
    markdown += `\n--- END SECRET CONTEXT ---`;
    markdown += `[/censor]`;

    return markdown;
}

/**
 * Format check_for_leaks response - show leak detection results
 */
export function formatCheckForLeaks(data: any): string {
    let markdown = `## 🔍 Leak Detection\n\n`;

    if (data.clean) {
        markdown += `✅ **No leaks detected**\n\n`;
        markdown += `> Text is safe to display to player.`;
        return markdown;
    }

    markdown += `⚠️ **Potential leaks found: ${data.leaks?.length || 0}**\n\n`;

    if (data.leaks?.length) {
        markdown += `| Secret | Pattern | Severity |\n`;
        markdown += `|--------|---------|----------|\n`;

        data.leaks.forEach((leak: any) => {
            markdown += `| [censor]${leak.secretName}[/censor] | \`${leak.pattern}\` | ${leak.severity} |\n`;
        });
        markdown += `\n`;
    }

    if (data.recommendation) {
        markdown += `> 💡 ${data.recommendation}`;
    }

    return markdown;
}

/**
 * Format check_reveal_conditions response
 */
export function formatCheckRevealConditions(data: any): string {
    let markdown = `## 🎯 Reveal Condition Check\n\n`;

    const toReveal = data.secretsToReveal || [];

    if (toReveal.length === 0) {
        markdown += `> No secrets triggered by this event.\n`;
        return markdown;
    }

    markdown += `**Secrets Ready to Reveal:** ${toReveal.length}\n\n`;

    toReveal.forEach((s: any) => {
        markdown += `### 🔓 ${s.name}\n`;
        markdown += `- Type: ${s.type}\n`;
        markdown += `- [censor]Secret: ${s.secretDescription}[/censor]\n`;

        if (s.matchedConditions?.length) {
            markdown += `- Matched: ${s.matchedConditions.map((c: any) => c.type).join(', ')}\n`;
        }
        markdown += `\n`;
    });

    if (data.instruction) {
        markdown += `> 💡 ${data.instruction}`;
    }

    return markdown;
}

/**
 * Format reveal_secret response - show the spoiler markdown for player
 */
export function formatRevealSecret(data: any): string {
    // If already revealed, show that message
    if (data.message?.includes('already revealed')) {
        let markdown = `## 🔓 Secret Already Revealed\n\n`;
        markdown += `> This secret was previously revealed.\n\n`;
        markdown += `[censor]`;
        markdown += `Revealed At: ${data.revealedAt}\n`;
        markdown += `Revealed By: ${data.revealedBy}`;
        markdown += `[/censor]`;
        return markdown;
    }

    let markdown = `## 🔮 Secret Revealed!\n\n`;

    if (data.partial) {
        markdown += `*Partial reveal - hint only*\n\n`;
    }

    markdown += `**Triggered By:** ${data.triggeredBy}\n\n`;

    // The spoilerMarkdown is safe to show - it's designed for player viewing
    if (data.spoilerMarkdown) {
        markdown += `---\n\n`;
        markdown += data.spoilerMarkdown;
        markdown += `\n\n---\n`;
    }

    // Narration is also safe
    if (data.narration && !data.spoilerMarkdown) {
        markdown += `> ${data.narration}\n\n`;
    }

    // DM-only details
    markdown += `\n[censor]`;
    markdown += `Secret ID: ${data.secret?.id}\n`;
    markdown += `Full Secret: ${data.secret?.secretDescription}`;
    markdown += `[/censor]`;

    return markdown;
}

/**
 * Format update_secret response
 */
export function formatUpdateSecret(data: any): string {
    let markdown = `## 🔒 Secret Updated\n\n`;
    markdown += `✅ ${data.message || 'Secret updated successfully'}\n\n`;

    if (data.secret) {
        markdown += `**Name:** ${data.secret.name}\n`;
        markdown += `**Type:** ${data.secret.type}\n\n`;

        markdown += `[censor]`;
        markdown += `ID: ${data.secret.id}\n`;
        markdown += `Updated fields saved to database`;
        markdown += `[/censor]`;
    }

    return markdown;
}

/**
 * Format delete_secret response
 */
export function formatDeleteSecret(data: any): string {
    let markdown = `## 🗑️ Secret Deleted\n\n`;
    markdown += `✅ ${data.message || 'Secret removed from database'}\n\n`;

    markdown += `[censor]Secret ID: ${data.secretId || 'unknown'}[/censor]`;

    return markdown;
}

/**
 * Helper: Get icon for secret type
 */
function getSecretTypeIcon(type: string): string {
    const icons: Record<string, string> = {
        npc: '👤',
        location: '📍',
        item: '📦',
        quest: '📜',
        plot: '🎭',
        mechanic: '⚙️',
        custom: '✨',
    };
    return icons[type?.toLowerCase()] || '🔒';
}

// ============================================================================
// COMBAT TOOL FORMATTERS - Rich output for LLM action guidance
// These formatters provide clear, actionable context to help the LLM
// understand combat state and what actions to take next.
// ============================================================================

/**
 * Format create_encounter response with clear next steps
 */
export function formatCreateEncounter(data: any): string {
    const encounterId = data.encounterId || data.encounter?.id;
    const participants = data.participants || data.encounter?.participants || [];

    let output = `⚔️ COMBAT ENCOUNTER STARTED!\n`;
    output += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    output += `Encounter ID: ${encounterId}\n\n`;

    if (participants.length > 0) {
        output += `📋 INITIATIVE ORDER:\n`;
        const sorted = [...participants].sort((a: any, b: any) => (b.initiative || 0) - (a.initiative || 0));
        sorted.forEach((p: any, i: number) => {
            const hpStatus = p.hp <= 0 ? '💀' : p.hp < (p.maxHp || p.hp) / 2 ? '🩹' : '💚';
            const turnMarker = i === 0 ? '👉 ' : '   ';
            output += `${turnMarker}${i + 1}. ${p.name} ${hpStatus} (Init: ${p.initiative || 0}, HP: ${p.hp}/${p.maxHp || p.hp})\n`;
        });
        output += `\n`;
    }

    output += `⚡ NEXT STEP: Check whose turn it is using get_encounter_state, then:\n`;
    output += `   - If enemy turn: Use execute_combat_action then advance_turn\n`;
    output += `   - If player turn: Present options and wait for input\n`;

    return output;
}

/**
 * Format get_encounter_state response with clear turn indicator
 */
export function formatGetEncounterState(data: any): string {
    const round = data.round || 1;
    const currentTurn = data.currentTurn || {};
    const participants = data.participants || [];
    const currentIndex = data.currentTurnIndex ?? 0;

    // Find current participant
    const currentParticipant = participants[currentIndex] ||
        participants.find((p: any) => p.id === currentTurn.participantId) ||
        participants[0];

    const isEnemy = currentParticipant?.isEnemy ??
        currentParticipant?.type === 'enemy' ??
        !currentParticipant?.name?.toLowerCase().includes('player');

    let output = `⚔️ COMBAT STATUS - ROUND ${round}\n`;
    output += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    // Current turn indicator - very prominent
    if (currentParticipant) {
        const icon = isEnemy ? '👹' : '🧙';
        output += `${icon} CURRENT TURN: ${currentParticipant.name?.toUpperCase()}\n`;
        output += `   HP: ${currentParticipant.hp}/${currentParticipant.maxHp || currentParticipant.hp}`;
        if (currentParticipant.ac) output += ` | AC: ${currentParticipant.ac}`;
        output += `\n\n`;
    }

    // Initiative order
    output += `📋 INITIATIVE ORDER:\n`;
    participants.forEach((p: any, i: number) => {
        const isCurrent = i === currentIndex || p.id === currentTurn.participantId;
        const hpStatus = p.hp <= 0 ? '💀 DEAD' : p.hp < (p.maxHp || p.hp) / 2 ? '🩹 Wounded' : '💚';
        const marker = isCurrent ? '👉 ' : '   ';
        const enemyTag = (p.isEnemy || p.type === 'enemy') ? '[ENEMY]' : '[ALLY]';
        output += `${marker}${i + 1}. ${p.name} ${hpStatus} ${enemyTag}\n`;
    });
    output += `\n`;

    // Clear action guidance
    if (isEnemy && currentParticipant) {
        output += `⚡ ACTION REQUIRED: This is an ENEMY turn!\n`;
        output += `   1. Narrate ${currentParticipant.name}'s action dramatically\n`;
        output += `   2. Call execute_combat_action (attack/ability/move)\n`;
        output += `   3. Call advance_turn to proceed\n`;
        output += `   DO NOT ask permission - execute the enemy action NOW!\n`;
    } else {
        output += `⏳ PLAYER TURN: Present options and wait for player input.\n`;
        output += `   After player chooses: execute_combat_action then advance_turn\n`;
    }

    return output;
}

/**
 * Format execute_combat_action response with damage results
 */
export function formatExecuteCombatAction(data: any): string {
    let output = `\n`;

    // Determine action type and result
    const actionType = data.actionType || data.action?.type || 'action';
    const success = data.success ?? data.hit ?? true;
    const damage = data.damage ?? data.totalDamage ?? 0;
    const targetName = data.targetName || data.target?.name || 'target';
    const attackerName = data.attackerName || data.attacker?.name || 'attacker';

    if (actionType === 'attack' || data.hit !== undefined) {
        if (success || data.hit) {
            output += `🎯 HIT! ${attackerName} strikes ${targetName}!\n`;
            if (damage > 0) {
                output += `💥 DAMAGE: ${damage} points\n`;
            }
        } else {
            output += `❌ MISS! ${attackerName}'s attack fails to connect.\n`;
        }
    } else if (actionType === 'heal' || data.healing) {
        const healing = data.healing || damage;
        output += `✨ HEALED! ${targetName} recovers ${healing} HP!\n`;
    } else if (actionType === 'ability' || actionType === 'spell') {
        output += `🔮 ${attackerName} uses ${data.abilityName || 'an ability'}!\n`;
        if (data.effect) output += `   Effect: ${data.effect}\n`;
    } else {
        output += `✅ Action completed: ${data.message || actionType}\n`;
    }

    // Show updated HP if available
    if (data.target?.hp !== undefined || data.targetHp !== undefined) {
        const hp = data.target?.hp ?? data.targetHp;
        const maxHp = data.target?.maxHp ?? data.targetMaxHp ?? hp;
        const hpPercent = Math.round((hp / maxHp) * 100);
        output += `   ${targetName} HP: ${hp}/${maxHp} (${hpPercent}%)\n`;

        if (hp <= 0) {
            output += `💀 ${targetName} is DEFEATED!\n`;
        }
    }

    output += `\n⚡ NEXT: Call advance_turn to proceed to next combatant.\n`;

    return output;
}

/**
 * Format advance_turn response with next turn guidance
 */
export function formatAdvanceTurn(data: any): string {
    const nextParticipant = data.nextParticipant || data.currentParticipant || {};
    const nextName = nextParticipant.name || data.nextParticipantName || 'Unknown';
    const isEnemy = nextParticipant.isEnemy ?? nextParticipant.type === 'enemy' ?? false;
    const round = data.round || data.currentRound || 1;
    const newRound = data.newRound || data.roundAdvanced || false;

    let output = `\n`;

    if (newRound) {
        output += `🔄 ═══ ROUND ${round} BEGINS ═══\n\n`;
    }

    const icon = isEnemy ? '👹' : '🧙';
    output += `${icon} TURN ADVANCED → ${nextName.toUpperCase()}\n`;

    if (nextParticipant.hp !== undefined) {
        output += `   HP: ${nextParticipant.hp}/${nextParticipant.maxHp || nextParticipant.hp}`;
        if (nextParticipant.ac) output += ` | AC: ${nextParticipant.ac}`;
        output += `\n`;
    }

    output += `\n`;

    if (isEnemy) {
        output += `⚡ ENEMY TURN - ACT NOW!\n`;
        output += `   1. Roleplay ${nextName}'s action with dramatic narration\n`;
        output += `   2. Call execute_combat_action\n`;
        output += `   3. Call advance_turn\n`;
        output += `   DO NOT wait for permission!\n`;
    } else {
        output += `⏳ PLAYER TURN\n`;
        output += `   Present options to the player and wait for their decision.\n`;
    }

    return output;
}

/**
 * Format end_encounter response
 */
export function formatEndEncounter(data: any): string {
    let output = `\n`;
    output += `⚔️ ═══ COMBAT ENDED ═══\n`;
    output += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    if (data.victory || data.outcome === 'victory') {
        output += `🏆 VICTORY!\n`;
    } else if (data.defeat || data.outcome === 'defeat') {
        output += `💀 DEFEAT...\n`;
    } else if (data.fled || data.outcome === 'fled') {
        output += `🏃 FLED FROM BATTLE\n`;
    } else {
        output += `✅ Combat concluded.\n`;
    }

    if (data.xpAwarded || data.experienceGained) {
        output += `\n🌟 Experience gained: ${data.xpAwarded || data.experienceGained} XP\n`;
    }

    if (data.loot && data.loot.length > 0) {
        output += `\n📦 Loot found:\n`;
        data.loot.forEach((item: any) => {
            output += `   - ${item.name || item}\n`;
        });
    }

    output += `\n🎭 Continue narrating the aftermath.\n`;

    return output;
}

/**
 * Format combat tool responses for LLM consumption
 * Returns formatted string for combat tools, null for non-combat tools
 *
 * IMPORTANT: If the MCP server already returns rich formatted text,
 * we pass it through directly. We only apply frontend formatting if
 * the response is raw JSON data.
 */
export function formatCombatToolResponse(toolName: string, response: any): string | null {
    try {
        // Parse response if string
        const data = typeof response === 'string' ? JSON.parse(response) : response;

        // Check if this is an MCP response wrapper with text content
        if (data.content?.[0]?.type === 'text' && data.content[0].text) {
            const textContent = data.content[0].text;

            // If the MCP server already returned formatted text (contains emoji/formatting),
            // pass it through directly - don't try to reformat it
            if (textContent.includes('═══') || textContent.includes('⚔️') ||
                textContent.includes('COMBAT') || textContent.includes('TURN')) {
                return textContent;
            }

            // Try to parse as JSON for further processing
            try {
                const innerData = JSON.parse(textContent);
                // Continue with formatting below using innerData
                return formatCombatData(toolName, innerData);
            } catch {
                // Not JSON, but also not our formatted text - return as-is
                return textContent;
            }
        }

        // Direct data (not in MCP wrapper)
        return formatCombatData(toolName, data);

    } catch (e) {
        console.warn('[formatCombatToolResponse] Failed to format:', e);
        return null;
    }
}

/**
 * Internal helper to format combat data
 */
function formatCombatData(toolName: string, data: any): string | null {
    // Match tool names (handle both snake_case and various naming conventions)
    const normalizedName = toolName.toLowerCase().replace(/-/g, '_');

    if (normalizedName === 'create_encounter' || normalizedName === 'start_combat') {
        return formatCreateEncounter(data);
    }

    if (normalizedName === 'get_encounter_state' || normalizedName === 'get_combat_state') {
        return formatGetEncounterState(data);
    }

    if (normalizedName === 'execute_combat_action' || normalizedName === 'combat_action') {
        return formatExecuteCombatAction(data);
    }

    if (normalizedName === 'advance_turn' || normalizedName === 'next_turn') {
        return formatAdvanceTurn(data);
    }

    if (normalizedName === 'end_encounter' || normalizedName === 'end_combat') {
        return formatEndEncounter(data);
    }

    // Not a combat tool
    return null;
}
