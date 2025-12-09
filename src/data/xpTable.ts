// XP Table mirroring the backend implementation logic
// Level 1 starts at 0 XP
// Values represent the TOTAL XP needed to reach that level
export const XP_TABLE: Record<number, number> = {
    1: 0,
    2: 300,
    3: 900,
    4: 2700,
    5: 6500,
    6: 14000,
    7: 23000,
    8: 34000,
    9: 48000,
    10: 64000,
    11: 85000,
    12: 100000,
    13: 120000,
    14: 140000,
    15: 165000,
    16: 195000,
    17: 225000,
    18: 265000,
    19: 305000,
    20: 355000
};

export const getXpForLevel = (level: number): number => {
    return XP_TABLE[level] || 0;
};

export const getNextLevelXp = (level: number): number => {
    return XP_TABLE[level + 1] || XP_TABLE[20]; // Cap at 20
};
