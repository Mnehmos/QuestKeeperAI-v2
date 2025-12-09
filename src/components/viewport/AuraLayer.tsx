import React from 'react';
import { useCombatStore } from '../../stores/combatStore';
import { AuraRing } from './AuraRing';

/**
 * AuraLayer - Renders all active auras in the 3D combat scene
 * Each aura is centered on its owner entity
 */
export const AuraLayer: React.FC = () => {
  const auras = useCombatStore(s => s.auras);
  const entities = useCombatStore(s => s.entities);
  
  return (
    <>
      {auras.map(aura => {
        // Find the owner entity to get their position
        const owner = entities.find(e => e.id === aura.ownerId);
        if (!owner) {
          console.warn(`[AuraLayer] Owner ${aura.ownerId} not found for aura ${aura.id}`);
          return null;
        }
        
        return (
          <AuraRing 
            key={aura.id} 
            aura={aura} 
            position={owner.position} 
          />
        );
      })}
    </>
  );
};
