import React from 'react';
import { 
  useNpcStore, 
  FAMILIARITY_CONFIG, 
  DISPOSITION_CONFIG,
  type NpcRelationship 
} from '../../stores/npcStore';

interface NpcRelationshipCardProps {
  relationship: NpcRelationship;
  isSelected: boolean;
  onClick: () => void;
}

/**
 * Compact card showing NPC relationship status
 */
export const NpcRelationshipCard: React.FC<NpcRelationshipCardProps> = ({
  relationship,
  isSelected,
  onClick
}) => {
  const famConfig = FAMILIARITY_CONFIG[relationship.familiarity];
  const dispConfig = DISPOSITION_CONFIG[relationship.disposition];
  
  // Format last interaction date
  const lastSeen = relationship.lastInteractionAt 
    ? new Date(relationship.lastInteractionAt).toLocaleDateString()
    : 'Never';
  
  return (
    <div 
      className={`
        p-3 rounded cursor-pointer transition-all
        border border-terminal-green-dim/30
        hover:border-terminal-green
        ${isSelected ? 'bg-terminal-green/20 border-terminal-green' : 'bg-terminal-black/50'}
      `}
      onClick={onClick}
    >
      {/* Header: Name + Icons */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-terminal-green-bright font-medium truncate">
          {relationship.npcName || relationship.npcId.slice(0, 8)}
        </span>
        <div className="flex items-center gap-1 text-sm">
          <span title={famConfig.label}>{famConfig.icon}</span>
          <span title={dispConfig.label}>{dispConfig.icon}</span>
        </div>
      </div>
      
      {/* Familiarity badge */}
      <div className="flex items-center gap-2 mb-1">
        <span 
          className="text-xs px-1.5 py-0.5 rounded"
          style={{ backgroundColor: famConfig.color + '30', color: famConfig.color }}
        >
          {famConfig.label}
        </span>
      </div>
      
      {/* Footer: Stats */}
      <div className="text-xs text-terminal-green-dim flex justify-between">
        <span>{relationship.interactionCount} interactions</span>
        <span>Last: {lastSeen}</span>
      </div>
    </div>
  );
};

/**
 * List of NPC relationships as cards
 */
export const NpcRelationshipList: React.FC = () => {
  const relationships = useNpcStore(s => s.relationships);
  const selectedNpcId = useNpcStore(s => s.selectedNpcId);
  const setSelectedNpc = useNpcStore(s => s.setSelectedNpc);
  
  if (relationships.length === 0) {
    return (
      <div className="text-terminal-green-dim text-sm italic p-4 text-center">
        No NPCs met yet
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      {relationships.map(rel => (
        <NpcRelationshipCard
          key={rel.npcId}
          relationship={rel}
          isSelected={selectedNpcId === rel.npcId}
          onClick={() => setSelectedNpc(rel.npcId)}
        />
      ))}
    </div>
  );
};
