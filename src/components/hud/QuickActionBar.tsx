import React from 'react';
import { useHudStore } from '../../stores/hudStore';
import { useChatStore } from '../../stores/chatStore';
import { useCombatStore } from '../../stores/combatStore';
import { useGameStateStore } from '../../stores/gameStateStore';

/**
 * Bottom action bar for quick intent buttons.
 * Terminal-styled configuration.
 */
export const QuickActionBar: React.FC = () => {
    const toggleInventory = useHudStore(s => s.toggleInventory);
    const setPrefillInput = useChatStore(s => s.setPrefillInput);
    
    // Combat Context
    const activeEncounterId = useCombatStore(s => s.activeEncounterId);
    const entities = useCombatStore(s => s.entities);
    const activeCharacter = useGameStateStore(s => s.activeCharacter);

    // Determine if it's the player's turn
    const isPlayerTurn = React.useMemo(() => {
        if (!activeEncounterId || !activeCharacter) return false;
        const currentEntity = entities.find(e => e.isCurrentTurn);
        return currentEntity?.name === activeCharacter.name; 
    }, [activeEncounterId, entities, activeCharacter]);

    const handleAction = (text: string) => {
        setPrefillInput(text);
    };
    
    return (
        <div className="flex gap-2 p-2 bg-black/90 rounded-sm border-t border-x border-green-900/50 shadow-2xl animate-fade-in-up">
            <ActionButton label="Inventory" icon="🎒" onClick={toggleInventory} />
            <ActionButton label="Melee" icon="⚔️" onClick={() => handleAction("I attack with my weapon")} />
            <ActionButton label="Cast" icon="🔮" onClick={() => handleAction("I cast ")} />
            <ActionButton 
                label="End Turn" 
                icon="⏳" 
                onClick={() => handleAction("I end my turn")} 
                secondary 
                disabled={!isPlayerTurn}
            />
        </div>
    );
};

interface ActionButtonProps {
    label: string;
    icon: string;
    onClick: () => void;
    secondary?: boolean;
    disabled?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({ label, icon, onClick, secondary, disabled }) => (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`
        flex flex-col items-center justify-center
        w-20 h-14 rounded-sm transition-all border font-mono
        ${disabled 
            ? 'opacity-30 cursor-not-allowed bg-gray-900 border-gray-800 text-gray-600' 
            : secondary 
                ? 'bg-red-900/10 hover:bg-red-900/30 border-red-900/30 text-red-500' 
                : 'bg-green-900/10 hover:bg-green-900/30 border-green-900/30 text-green-500 hover:text-green-300'
        }
        active:scale-95
      `}
    >
        <span className="text-xl mb-1 filter drop-shadow-md">{icon}</span>
        <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
    </button>
);
