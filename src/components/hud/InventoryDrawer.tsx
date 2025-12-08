import React from 'react';
import { useGameStateStore } from '../../stores/gameStateStore';
import { useHudStore } from '../../stores/hudStore';
import { useChatStore } from '../../stores/chatStore';

/**
 * Slide-out Inventory Drawer.
 * Terminal-styled inventory management.
 */
export const InventoryDrawer: React.FC = () => {
  const isOpen = useHudStore(s => s.isInventoryOpen);
  const toggleInventory = useHudStore(s => s.toggleInventory);
  const setPrefillInput = useChatStore(s => s.setPrefillInput);
  
  const inventory = useGameStateStore(s => s.inventory);
  const activeCharacter = useGameStateStore(s => s.activeCharacter);

  if (!isOpen) return null;

  const handleItemClick = (itemName: string) => {
    setPrefillInput(`I use my ${itemName}`);
    toggleInventory(); // Close drawer after selection
  };

  return (
    <div className="w-80 h-full bg-black/95 border-l border-green-900/50 p-6 pointer-events-auto animate-slide-in-right overflow-y-auto font-mono z-40 shadow-2xl">
      <div className="flex justify-between items-center mb-6 border-b border-green-900/30 pb-2">
         <h2 className="text-lg font-bold text-green-500 tracking-wider uppercase">Inventory</h2>
         <button 
           onClick={toggleInventory}
           className="text-green-800 hover:text-green-500 uppercase text-xs tracking-widest border border-green-900/30 px-2 py-1 hover:border-green-500 transition-colors"
         >
           Close
         </button>
      </div>
      
      {!activeCharacter ? (
        <div className="text-green-900/50 italic text-center py-10">No character data.</div>
      ) : (
        <div className="space-y-6">
           {/* Equipment Section */}
           <div className="mb-4">
             <h3 className="text-[10px] uppercase text-green-700 mb-2 font-bold tracking-widest">Current Loadout</h3>
             <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="p-2 border border-green-900/30 bg-green-900/5 rounded-sm">
                  <div className="text-[9px] text-green-800 uppercase mb-1">Main Hand</div>
                  <div className="text-green-400 truncate">{activeCharacter.equipment?.weapons?.[0] || 'Empty'}</div>
                </div>
                <div className="p-2 border border-green-900/30 bg-green-900/5 rounded-sm">
                    <div className="text-[9px] text-green-800 uppercase mb-1">Armor</div>
                    <div className="text-green-400 truncate">{activeCharacter.equipment?.armor || 'None'}</div>
                </div>
             </div>
           </div>

           {/* Items List */}
           <div>
            <h3 className="text-[10px] uppercase text-green-700 mb-2 font-bold tracking-widest">Backpack Content</h3>
            {inventory.length === 0 ? (
                <div className="text-center py-8 text-green-900/40 border border-dashed border-green-900/30 rounded-sm italic">
                Empty Backpack
                </div>
            ) : (
                <ul className="space-y-1">
                {inventory.map((item, i) => (
                    <li 
                    key={item.id || i}
                    onClick={() => handleItemClick(item.name)}
                    className="flex justify-between items-center p-2 rounded-sm border border-transparent hover:border-green-500/30 hover:bg-green-900/10 cursor-pointer transition-all group"
                    >
                    <span className="text-sm text-green-400 group-hover:text-green-300">{item.name}</span>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-green-700 font-bold">x{item.quantity}</span>
                    </div>
                    </li>
                ))}
                </ul>
            )}
           </div>
        </div>
      )}
    </div>
  );
};
