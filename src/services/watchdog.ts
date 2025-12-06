import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { eventBus, LogEvent } from '../utils/eventBus';
import { useCombatStore } from '../stores/combatStore';
import { mcpManager } from './mcpClient';

// Fix z.enum usage by providing at least one value and casting to tuple if needed, or just standard array
export const BugReportSchema = z.object({
    id: z.string().uuid().optional(),
    severity: z.enum(['low', 'medium', 'high', 'critical'] as const),
    description: z.string(),
    context: z.record(z.any()).optional(),
    recentLogs: z.array(z.string()).optional(),
    timestamp: z.string().datetime().optional()
});

export type BugReport = z.infer<typeof BugReportSchema>;

class WatchdogService {
    private logBuffer: string[] = [];
    private readonly BUFFER_SIZE = 100;

    constructor() {
        this.subscribe();
    }

    private subscribe() {
        // Subscribe to relevant events
        const eventHandler = (event: LogEvent) => {
            this.addLog(`[${new Date(event.timestamp).toISOString()}] [${event.source || 'UNKNOWN'}] ${event.message}`);
        };

        eventBus.on('error:log', eventHandler);
        eventBus.on('warn:log', eventHandler);
        // We can subscribe to info logs too if we want a fuller picture, but maybe just errors/warns for now to reduce noise
    }

    private addLog(log: string) {
        this.logBuffer.push(log);
        if (this.logBuffer.length > this.BUFFER_SIZE) {
            this.logBuffer.shift(); // Remove oldest
        }
    }

    public getRecentLogs(): string[] {
        return [...this.logBuffer];
    }

    public captureContext(): Record<string, any> {
        // Snapshot relevant game state
        try {
            const combatStore = useCombatStore.getState();
            
            return {
                timestamp: new Date().toISOString(),
                mcp: {
                    connected: mcpManager.isReady(),
                    pendingRequests: mcpManager.getPendingCount()
                },
                combat: {
                    entityCount: combatStore.entities.length,
                    isCombatActive: !!combatStore.activeEncounterId,
                    turn: combatStore.currentRound,
                    currentTurnName: combatStore.currentTurnName
                },
                // Add more tokens/stores here as needed
            };
        } catch (error) {
            console.error('[Watchdog] Failed to capture context:', error);
            return { error: 'Failed to capture context' };
        }
    }

    public async submitBugReport(reportData: Omit<BugReport, 'id' | 'timestamp' | 'recentLogs'>): Promise<string> {
        const id = uuidv4();
        const timestamp = new Date().toISOString();
        
        const fullReport: BugReport = {
            id,
            timestamp,
            recentLogs: this.getRecentLogs(),
            ...reportData,
            context: {
                ...this.captureContext(),
                ...(reportData.context || {})
            }
        };

        // Validate
        const validation = BugReportSchema.safeParse(fullReport);
        if (!validation.success) {
            throw new Error(`Invalid bug report: ${validation.error.message}`);
        }

        // In a real app, send to API/Backend. 
        // For now, we simulate saving and log to console.
        console.group('[Watchdog] 🐞 BUG REPORT SUBMITTED');
        console.log(`ID: ${fullReport.id}`);
        console.log(`Severity: ${fullReport.severity}`);
        console.log(`Description: ${fullReport.description}`);
        console.log('Context:', fullReport.context);
        console.log('Recent Logs:', fullReport.recentLogs);
        console.groupEnd();

        // TODO: Actually save this somewhere permanent if possible (e.g. write to file via Tauri)
        // For now, returning the ID is enough for the tool.
        
        return id;
    }
}

export const watchdogService = new WatchdogService();
