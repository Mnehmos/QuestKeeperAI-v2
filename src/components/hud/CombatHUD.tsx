import React from 'react';
import { TurnOrderBar } from './TurnOrderBar';
import { PartyStatusBar } from './PartyStatusBar';
import { AuraListPanel } from './AuraListPanel';
import { InventoryDrawer } from './InventoryDrawer';
import { CharacterQuickView } from './CharacterQuickView';
import { QuickActionBar } from './QuickActionBar';
import { useCombatStore } from '../../stores/combatStore';

export const CombatHUD: React.FC = () => {
  const activeEncounterId = useCombatStore(s => s.activeEncounterId);
  
  // If no combat, maybe show a minimal exploration HUD?
  // For now, these components can handle their own "empty" states or we hide them
  
  return (
    <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
      {/* Top: Turn Order (Only visible during combat) */}
      {activeEncounterId && <TurnOrderBar />}

      {/* Left: Party Status + Auras */}
      <div className="absolute left-0 top-20 bottom-20 w-64 pointer-events-auto">
        <PartyStatusBar />
        {activeEncounterId && <AuraListPanel />}
      </div>

      {/* Right: Drawers and Quick View */}
      <div className="absolute right-0 top-0 bottom-0 pointer-events-none flex flex-col items-end">
         <InventoryDrawer />
         <div className="pointer-events-auto mt-auto mb-20 mr-4">
            <CharacterQuickView />
         </div>
      </div>

      {/* Bottom: Quick Actions */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-auto">
        <QuickActionBar />
      </div>
    </div>
  );
};
