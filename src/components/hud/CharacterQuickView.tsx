import React from 'react';
import { useCombatStore } from '../../stores/combatStore';

/**
 * Displays details for the currently Selected Entity (Target).
 * Terminal-styled HUD element.
 */
export const CharacterQuickView: React.FC = () => {
    const selectedEntityId = useCombatStore(s => s.selectedEntityId);
    const entities = useCombatStore(s => s.entities);
    
    // Find the selected entity
    const entity = selectedEntityId ? entities.find(e => e.id === selectedEntityId) : null;
    
    if (!entity) return null;

    const meta = entity.metadata;
    const isEnemy = entity.type === 'monster';
    
    return (
        <div className="bg-black/95 border border-green-500/30 rounded-sm p-4 w-64 shadow-2xl animate-fade-in-up font-mono">
            {/* Header */}
            <div className="flex items-center justify-between mb-3 border-b border-green-900/50 pb-2">
                <h3 className={`font-bold text-lg truncate ${isEnemy ? 'text-red-500' : 'text-green-400'}`}>
                    {entity.name}
                </h3>
                <span className={`text-[10px] uppercase px-1.5 py-0.5 border rounded-sm ${
                   isEnemy 
                    ? 'bg-red-900/20 text-red-500 border-red-900/50' 
                    : 'bg-green-900/20 text-green-500 border-green-900/50'
                }`}>
                   {entity.type}
                </span>
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-green-900/10 border border-green-900/30 rounded-sm p-2 text-center">
                    <div className="text-[10px] text-green-600 uppercase tracking-wider mb-1">HP</div>
                    <div className="text-xl text-green-400">
                        {meta.hp.current} <span className="text-sm text-green-700">/ {meta.hp.max}</span>
                    </div>
                </div>
                <div className="bg-green-900/10 border border-green-900/30 rounded-sm p-2 text-center">
                    <div className="text-[10px] text-green-600 uppercase tracking-wider mb-1">AC</div>
                    <div className="text-xl text-green-400">
                        {meta.ac}
                    </div>
                </div>
            </div>
            
            {/* Conditions */}
            {meta.conditions && meta.conditions.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                    {meta.conditions.map(c => (
                        <span 
                            key={c} 
                            title={c}
                            className="text-[10px] bg-yellow-900/20 text-yellow-500 border border-yellow-900/50 px-2 py-0.5 rounded-sm cursor-help"
                        >
                           {c}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
};
