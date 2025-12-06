import { describe, it, expect, vi, beforeEach } from 'vitest';
import { watchdogService } from './watchdog';
import { eventBus } from '../utils/eventBus';

// Mock mcpClient dependencies
vi.mock('./mcpClient', () => ({
    mcpManager: {
        isReady: () => true,
        getPendingCount: () => 0
    }
}));

// Mock combatStore
vi.mock('../stores/combatStore', () => ({
    useCombatStore: {
        getState: () => ({
            entities: [],
            activeEncounterId: 'test-encounter',
            currentRound: 1,
            currentTurnName: 'Hero'
        })
    }
}));

describe('WatchdogService', () => {
    beforeEach(() => {
        // Clear buffer if possible, but private. 
        // We can just emit new events and check if they appear.
    });

    it('should capture logs from eventBus', () => {
        const timestamp = Date.now();
        eventBus.emit('error:log', {
            message: 'Test Error',
            source: 'Test',
            timestamp
        });

        const logs = watchdogService.getRecentLogs();
        const lastLog = logs[logs.length - 1];
        expect(lastLog).toContain('Test Error');
        expect(lastLog).toContain('Test');
    });

    it('should capture context correctly', () => {
        const context = watchdogService.captureContext();
        expect(context.mcp.connected).toBe(true);
        expect(context.combat.isCombatActive).toBe(true);
        expect(context.combat.currentTurnName).toBe('Hero');
    });

    it('should submit bug report', async () => {
        const id = await watchdogService.submitBugReport({
            severity: 'medium',
            description: 'Something broke'
        });
        
        expect(id).toBeDefined();
        expect(id.length).toBeGreaterThan(0);
    });
});
