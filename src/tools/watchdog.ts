// Local tool definitions for Watchdog System
import { watchdogService } from '../services/watchdog';
// We'll import ToolDefinition after refactoring toolRegistry, or define it here for now if needed.
// To avoid circular refs before refactor, I'll assume the shape.

export const watchdogTools = {
    submit_bug_report: {
        name: 'submit_bug_report',
        description: 'Submits a bug report with severity, description, and optional context. Automatically captures recent logs and game state.',
        parameters: {
            type: 'object',
            properties: {
                severity: { 
                    type: 'string', 
                    enum: ['low', 'medium', 'high', 'critical'],
                    description: 'Severity of the bug'
                },
                description: { 
                    type: 'string',
                    description: 'Detailed description of the issue or error'
                },
                context: { 
                    type: 'object',
                    description: 'Additional context (JSON object)'
                }
            },
            required: ['severity', 'description']
        },
        execute: async (args: any) => {
            const result = await watchdogService.submitBugReport(args);
            return {
                content: [
                    {
                        type: 'text',
                        text: `Bug report submitted successfully. ID: ${result}`
                    }
                ]
            };
        }
    },

    get_recent_logs: {
        name: 'get_recent_logs',
        description: 'Retrieves the most recent logs captured by the Watchdog service for debugging.',
        parameters: {
            type: 'object',
            properties: {
                limit: { type: 'number', description: 'Number of logs to return (default: all)' }
            },
            required: []
        },
        execute: async (args: any) => {
            const logs = watchdogService.getRecentLogs();
            const limit = args.limit || logs.length;
            const slice = logs.slice(-limit);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(slice, null, 2)
                    }
                ]
            };
        }
    }
};
