import React, { useState } from 'react';
import { useGameStateStore } from '../../stores/gameStateStore';
import { useCombatStore } from '../../stores/combatStore';
import { mcpManager } from '../../services/mcpClient';
import { useChatStore } from '../../stores/chatStore';

interface RestPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Rest Panel - UI for short and long rests
 * Shows HP recovery preview and spell slot restoration
 */
export const RestPanel: React.FC<RestPanelProps> = ({ isOpen, onClose }) => {
  const activeCharacter = useGameStateStore((s) => s.activeCharacter);
  const activeEncounterId = useCombatStore((s) => s.activeEncounterId);
  const addMessage = useChatStore((s) => s.addMessage);
  
  const [hitDiceToSpend, setHitDiceToSpend] = useState(1);
  const [isResting, setIsResting] = useState(false);
  const [restResult, setRestResult] = useState<any>(null);

  if (!isOpen || !activeCharacter) return null;

  const isInCombat = !!activeEncounterId;
  // Handle both hp object format and direct number format
  const hpObj = activeCharacter.hp as any;
  const currentHp: number = typeof hpObj === 'number' ? hpObj : (hpObj?.current || 0);
  const maxHp: number = typeof hpObj === 'number' ? hpObj : (hpObj?.max || (activeCharacter as any).maxHp || 0);
  const hpMissing = Math.max(0, maxHp - currentHp);
  const conMod = Math.floor(((activeCharacter.stats?.con || 10) - 10) / 2);

  // Calculate estimated short rest healing
  const estimatedShortRestHealing = Math.min(
    hpMissing,
    hitDiceToSpend * (4 + conMod) // Average d8 + CON
  );

  const handleShortRest = async () => {
    if (!activeCharacter?.id || isInCombat) return;
    setIsResting(true);
    
    try {
      const result = await mcpManager.gameStateClient.callTool('take_short_rest', {
        characterId: activeCharacter.id,
        hitDiceToSpend
      });
      
      const text = result?.content?.[0]?.text || '{}';
      const data = JSON.parse(text);
      setRestResult(data);
      
      // Add message to chat
      addMessage({
        id: Date.now().toString(),
        sender: 'system',
        content: `⛺ **${activeCharacter.name}** takes a short rest.\n\n**HP:** ${data.previousHp} → ${data.newHp} (+${data.hpRestored})\n**Hit Dice:** ${data.hitDiceSpent}${data.hitDieSize} rolled [${data.rolls?.join(', ')}]`,
        timestamp: Date.now(),
        type: 'info'
      });
      
      // Refresh game state
      await useGameStateStore.getState().syncState();
    } catch (error: any) {
      addMessage({
        id: Date.now().toString(),
        sender: 'system',
        content: `❌ Rest failed: ${error.message}`,
        timestamp: Date.now(),
        type: 'error'
      });
    } finally {
      setIsResting(false);
    }
  };

  const handleLongRest = async () => {
    if (!activeCharacter?.id || isInCombat) return;
    setIsResting(true);
    
    try {
      const result = await mcpManager.gameStateClient.callTool('take_long_rest', {
        characterId: activeCharacter.id
      });
      
      const text = result?.content?.[0]?.text || '{}';
      const data = JSON.parse(text);
      setRestResult(data);
      
      // Add message to chat
      let msg = `🌙 **${activeCharacter.name}** takes a long rest.\n\n**HP:** ${data.previousHp} → ${data.newHp} (Full)`;
      if (data.spellSlotsRestored) {
        msg += `\n**Spell Slots:** Fully restored`;
      }
      
      addMessage({
        id: Date.now().toString(),
        sender: 'system',
        content: msg,
        timestamp: Date.now(),
        type: 'info'
      });
      
      // Refresh game state
      await useGameStateStore.getState().syncState();
    } catch (error: any) {
      addMessage({
        id: Date.now().toString(),
        sender: 'system',
        content: `❌ Rest failed: ${error.message}`,
        timestamp: Date.now(),
        type: 'error'
      });
    } finally {
      setIsResting(false);
    }
  };

  return (
    <div className="rest-panel-overlay" onClick={onClose}>
      <div className="rest-panel" onClick={(e) => e.stopPropagation()}>
        <div className="rest-panel-header">
          <h3>⛺ Rest Menu</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="rest-panel-content">
          {/* Character Status */}
          <div className="character-status">
            <div className="character-name">{activeCharacter.name}</div>
            <div className="hp-bar-container">
              <div 
                className="hp-bar" 
                style={{ width: `${(currentHp / maxHp) * 100}%` }}
              />
              <span className="hp-text">{currentHp} / {maxHp} HP</span>
            </div>
          </div>

          {/* Combat Warning */}
          {isInCombat && (
            <div className="combat-warning">
              ⚔️ Cannot rest during combat!
            </div>
          )}

          {/* Rest Options */}
          <div className="rest-options">
            {/* Short Rest */}
            <div className={`rest-option ${isInCombat ? 'disabled' : ''}`}>
              <div className="rest-type">
                <span className="rest-icon">☕</span>
                <span className="rest-title">Short Rest</span>
                <span className="rest-duration">1 hour</span>
              </div>
              <div className="rest-description">
                Spend hit dice to recover HP
              </div>
              <div className="hit-dice-selector">
                <label>Hit Dice to spend:</label>
                <div className="dice-controls">
                  <button 
                    onClick={() => setHitDiceToSpend(Math.max(1, hitDiceToSpend - 1))}
                    disabled={hitDiceToSpend <= 1}
                  >-</button>
                  <span className="dice-count">{hitDiceToSpend}</span>
                  <button 
                    onClick={() => setHitDiceToSpend(Math.min(activeCharacter.level || 5, hitDiceToSpend + 1))}
                    disabled={hitDiceToSpend >= (activeCharacter.level || 5)}
                  >+</button>
                </div>
              </div>
              <div className="rest-preview">
                Est. healing: +{estimatedShortRestHealing} HP
              </div>
              <button 
                className="rest-btn short-rest-btn"
                onClick={handleShortRest}
                disabled={isInCombat || isResting || hpMissing === 0}
              >
                {isResting ? 'Resting...' : 'Take Short Rest'}
              </button>
            </div>

            {/* Long Rest */}
            <div className={`rest-option ${isInCombat ? 'disabled' : ''}`}>
              <div className="rest-type">
                <span className="rest-icon">🌙</span>
                <span className="rest-title">Long Rest</span>
                <span className="rest-duration">8 hours</span>
              </div>
              <div className="rest-description">
                Fully restore HP and spell slots
              </div>
              <div className="rest-preview">
                Restores: {hpMissing} HP + all spell slots
              </div>
              <button 
                className="rest-btn long-rest-btn"
                onClick={handleLongRest}
                disabled={isInCombat || isResting}
              >
                {isResting ? 'Resting...' : 'Take Long Rest'}
              </button>
            </div>
          </div>

          {/* Rest Result */}
          {restResult && (
            <div className="rest-result">
              ✓ {restResult.message}
            </div>
          )}
        </div>

        <style>{`
          .rest-panel-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
          }
          
          .rest-panel {
            background: linear-gradient(135deg, #1a1f2e 0%, #0d1117 100%);
            border: 1px solid rgba(139, 92, 246, 0.3);
            border-radius: 12px;
            width: 400px;
            max-width: 90vw;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
          }
          
          .rest-panel-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          }
          
          .rest-panel-header h3 {
            margin: 0;
            font-size: 18px;
            color: #e2e8f0;
          }
          
          .close-btn {
            background: none;
            border: none;
            color: #94a3b8;
            font-size: 24px;
            cursor: pointer;
            padding: 0;
            line-height: 1;
          }
          
          .close-btn:hover {
            color: #e2e8f0;
          }
          
          .rest-panel-content {
            padding: 20px;
          }
          
          .character-status {
            margin-bottom: 16px;
          }
          
          .character-name {
            font-weight: 600;
            color: #e2e8f0;
            margin-bottom: 8px;
          }
          
          .hp-bar-container {
            position: relative;
            height: 24px;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 4px;
            overflow: hidden;
          }
          
          .hp-bar {
            height: 100%;
            background: linear-gradient(90deg, #22c55e 0%, #16a34a 100%);
            transition: width 0.3s ease;
          }
          
          .hp-text {
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 600;
            color: white;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
          }
          
          .combat-warning {
            background: rgba(239, 68, 68, 0.2);
            border: 1px solid rgba(239, 68, 68, 0.5);
            color: #fca5a5;
            padding: 12px;
            border-radius: 8px;
            text-align: center;
            margin-bottom: 16px;
          }
          
          .rest-options {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }
          
          .rest-option {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 16px;
          }
          
          .rest-option.disabled {
            opacity: 0.5;
            pointer-events: none;
          }
          
          .rest-type {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
          }
          
          .rest-icon {
            font-size: 20px;
          }
          
          .rest-title {
            font-weight: 600;
            color: #e2e8f0;
            flex: 1;
          }
          
          .rest-duration {
            font-size: 12px;
            color: #64748b;
          }
          
          .rest-description {
            font-size: 13px;
            color: #94a3b8;
            margin-bottom: 12px;
          }
          
          .hit-dice-selector {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 12px;
          }
          
          .hit-dice-selector label {
            font-size: 13px;
            color: #94a3b8;
          }
          
          .dice-controls {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          
          .dice-controls button {
            width: 28px;
            height: 28px;
            border: 1px solid rgba(139, 92, 246, 0.3);
            background: rgba(139, 92, 246, 0.1);
            color: #a78bfa;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
          }
          
          .dice-controls button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          
          .dice-count {
            font-size: 16px;
            font-weight: 600;
            color: #e2e8f0;
            min-width: 24px;
            text-align: center;
          }
          
          .rest-preview {
            font-size: 12px;
            color: #22c55e;
            margin-bottom: 12px;
          }
          
          .rest-btn {
            width: 100%;
            padding: 10px;
            border: none;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
          }
          
          .short-rest-btn {
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            color: white;
          }
          
          .short-rest-btn:hover:not(:disabled) {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          }
          
          .long-rest-btn {
            background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
            color: white;
          }
          
          .long-rest-btn:hover:not(:disabled) {
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          }
          
          .rest-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          
          .rest-result {
            margin-top: 16px;
            padding: 12px;
            background: rgba(34, 197, 94, 0.1);
            border: 1px solid rgba(34, 197, 94, 0.3);
            border-radius: 8px;
            color: #86efac;
            text-align: center;
          }
        `}</style>
      </div>
    </div>
  );
};
