import React from 'react';
import { useCombatStore } from '../../stores/combatStore';

/**
 * Displays the initiative order for the active combat.
 * Terminal-styled initiative tracker.
 */
export const TurnOrderBar: React.FC = () => {
  const turnOrder = useCombatStore(s => s.turnOrder);
  const entities = useCombatStore(s => s.entities);
  const currentTurnName = useCombatStore(s => s.currentTurnName);

  if (!turnOrder || turnOrder.length === 0) return null;

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/95 border border-green-900/50 rounded-sm px-4 py-2 flex items-center gap-4 pointer-events-auto shadow-lg backdrop-blur-sm z-30">
      <div className="text-[10px] text-green-700 font-mono font-bold tracking-widest uppercase">Turn Order</div>
      <div className="h-4 w-px bg-green-900/50"></div>
      
      <div className="flex items-center gap-2">
        {turnOrder.map((name, idx) => {
          // Find entity to get details (HP, etc)
          const entity = entities.find(e => e.name === name);
          const isCurrent = name === currentTurnName;
          
          return (
             <div 
               key={`${name}-${idx}`}
               className={`
                 relative px-3 py-1.5 border transition-all duration-300 font-mono rounded-sm min-w-[80px] text-center
                 ${isCurrent 
                    ? 'bg-green-900/30 border-green-500 text-green-300 scale-105 z-10 shadow-[0_0_10px_rgba(0,255,65,0.2)]' 
                    : 'bg-black/50 border-green-900/30 text-green-800/70'}
               `}
             >
               <span className="text-xs font-bold block truncate max-w-[100px]">{name}</span>
               
               {/* HP Bar (Mini) */}
               {entity && entity.metadata?.hp && (
                 <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-900/30">
                    <div 
                      className={`h-full ${entity.type === 'monster' ? 'bg-red-500/70' : 'bg-green-500/70'}`}
                      style={{ width: `${(entity.metadata.hp.current / entity.metadata.hp.max) * 100}%` }}
                    />
                 </div>
               )}
             </div>
          );
        })}
      </div>
    </div>
  );
};
