import React from 'react';
import { useCombatStore } from '../../stores/combatStore';

/**
 * AuraListPanel - Shows active auras in the combat HUD
 * Displays aura name, owner, radius, and concentration status
 */
export const AuraListPanel: React.FC = () => {
  const auras = useCombatStore(s => s.auras);
  const entities = useCombatStore(s => s.entities);
  
  // Don't render if no auras
  if (auras.length === 0) {
    return null;
  }
  
  return (
    <div className="bg-terminal-black/90 border border-terminal-green-dim rounded p-2 mt-2">
      <h4 className="text-terminal-green text-xs uppercase tracking-wider mb-2 border-b border-terminal-green-dim pb-1">
        Active Auras ({auras.length})
      </h4>
      
      <div className="space-y-1.5 max-h-32 overflow-y-auto">
        {auras.map(aura => {
          const owner = entities.find(e => e.id === aura.ownerId);
          const ownerName = owner?.name || 'Unknown';
          
          // Determine color indicator
          const colorClass = aura.affectsEnemies 
            ? 'bg-red-500' 
            : aura.affectsAllies 
              ? 'bg-blue-500' 
              : 'bg-yellow-500';
          
          return (
            <div 
              key={aura.id}
              className="flex items-center gap-2 text-xs"
            >
              {/* Color indicator */}
              <div className={`w-2 h-2 rounded-full ${colorClass}`} />
              
              {/* Aura info */}
              <div className="flex-grow min-w-0">
                <div className="text-terminal-green-bright truncate">
                  {aura.spellName}
                </div>
                <div className="text-terminal-green-dim text-[10px]">
                  {ownerName} • {aura.radius}ft
                </div>
              </div>
              
              {/* Concentration indicator */}
              {aura.requiresConcentration && (
                <span 
                  className="text-yellow-400 text-sm" 
                  title="Requires Concentration"
                >
                  ⚡
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
