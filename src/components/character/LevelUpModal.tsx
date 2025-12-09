import React, { useState } from 'react';
import { useGameStateStore } from '../../stores/gameStateStore';
import { mcpManager } from '../../services/mcpClient';

interface LevelUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  characterId: string;
  characterName: string;
  currentLevel: number;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({ 
  isOpen, 
  onClose, 
  characterId, 
  characterName, 
  currentLevel 
}) => {
  const [hpIncrease, setHpIncrease] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const syncState = useGameStateStore(state => state.syncState);

  if (!isOpen) return null;

  const handleLevelUp = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      // Call MCP Tool
      await mcpManager.gameStateClient.callTool('level_up', {
        characterId,
        hpIncrease: hpIncrease || undefined,
        targetLevel: currentLevel + 1
      });

      // Refresh data
      await syncState(true);
      onClose();
    } catch (e: any) {
      console.error('Level up failed:', e);
      setError(e.message || 'Failed to process level up.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-terminal-black border border-terminal-green p-6 w-[400px] shadow-[0_0_30px_rgba(34,197,94,0.2)] relative">
        <h2 className="text-2xl font-bold text-terminal-green-bright mb-2 text-center">
          LEVEL UP AVAILABLE!
        </h2>
        <div className="text-center text-terminal-green/80 mb-6">
          {characterName} is reaching Level {currentLevel + 1}
        </div>

        {error && (
          <div className="mb-4 p-2 bg-red-900/20 border border-red-500/50 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <div className="space-y-4 mb-6">
          <div className="p-4 bg-terminal-green/5 border border-terminal-green/20 rounded">
            <label className="block text-sm font-bold text-terminal-green mb-2">
              HP Increase (Optional)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                value={hpIncrease}
                onChange={(e) => setHpIncrease(parseInt(e.target.value) || 0)}
                className="flex-1 bg-black border border-terminal-green/50 p-2 text-terminal-green focus:outline-none focus:border-terminal-green-bright"
                placeholder="Roll hit die..."
              />
            </div>
            <p className="text-xs text-terminal-green/40 mt-1">
              Manually roll your hit die + CON mod and enter the result.
            </p>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-terminal-green/60 hover:text-terminal-green transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleLevelUp}
            disabled={isSubmitting}
            className="px-6 py-2 bg-terminal-green text-terminal-black font-bold rounded hover:bg-terminal-green-bright transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? 'ASCENDING...' : 'LEVEL UP!'}
          </button>
        </div>
      </div>
    </div>
  );
};
