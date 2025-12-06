import { EventEmitter } from 'events';

export type EventType = 'error:log' | 'warn:log' | 'info:log';

export interface LogEvent {
  message: string;
  source?: string;
  timestamp: number;
  data?: any;
}

class TypedEventBus extends EventEmitter {
  emit(event: EventType, payload: LogEvent): boolean {
    return super.emit(event, payload);
  }

  on(event: EventType, listener: (payload: LogEvent) => void): this {
    return super.on(event, listener);
  }

  off(event: EventType, listener: (payload: LogEvent) => void): this {
    return super.off(event, listener);
  }
}

export const eventBus = new TypedEventBus();
