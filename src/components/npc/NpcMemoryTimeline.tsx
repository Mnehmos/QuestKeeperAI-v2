import React from 'react';
import { 
  useNpcStore, 
  IMPORTANCE_CONFIG,
  type NpcMemory 
} from '../../stores/npcStore';

interface MemoryItemProps {
  memory: NpcMemory;
}

/**
 * Single memory item in the timeline
 */
const MemoryItem: React.FC<MemoryItemProps> = ({ memory }) => {
  const config = IMPORTANCE_CONFIG[memory.importance];
  const date = new Date(memory.createdAt).toLocaleString();
  
  return (
    <div className="flex gap-3 py-2 border-b border-terminal-green-dim/20 last:border-0">
      {/* Importance indicator */}
      <div 
        className="w-1 rounded-full flex-shrink-0"
        style={{ backgroundColor: config.color }}
        title={`${memory.importance} importance`}
      />
      
      {/* Content */}
      <div className="flex-grow min-w-0">
        <div className="text-terminal-green-bright text-sm">
          {config.badge && (
            <span className="mr-1" style={{ color: config.color }}>
              {config.badge}
            </span>
          )}
          {memory.summary}
        </div>
        
        {/* Topics */}
        {memory.topics.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {memory.topics.map((topic, i) => (
              <span 
                key={i}
                className="text-xs px-1.5 py-0.5 rounded bg-terminal-green/20 text-terminal-green"
              >
                {topic}
              </span>
            ))}
          </div>
        )}
        
        {/* Timestamp */}
        <div className="text-xs text-terminal-green-dim mt-1">
          {date}
        </div>
      </div>
    </div>
  );
};

/**
 * Timeline view of NPC conversation memories
 */
export const NpcMemoryTimeline: React.FC = () => {
  const memories = useNpcStore(s => s.memories);
  const isLoading = useNpcStore(s => s.isLoading);
  
  if (isLoading) {
    return (
      <div className="text-terminal-green-dim text-sm italic p-4 text-center">
        Loading memories...
      </div>
    );
  }
  
  if (memories.length === 0) {
    return (
      <div className="text-terminal-green-dim text-sm italic p-4 text-center">
        No conversation history
      </div>
    );
  }
  
  return (
    <div className="space-y-0">
      {memories.map(memory => (
        <MemoryItem key={memory.id} memory={memory} />
      ))}
    </div>
  );
};
