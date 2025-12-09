import React, { useState, useEffect } from 'react';
import { useGameStateStore } from '../../stores/gameStateStore';
import { useCombatStore } from '../../stores/combatStore';
import { mcpManager } from '../../services/mcpClient';
import { useChatStore } from '../../stores/chatStore';

interface Corpse {
  id: string;
  characterName: string;
  characterType: string;
  state: string;
  looted: boolean;
  position?: { x: number; y: number };
}

interface LootItem {
  itemId: string;
  name: string;
  quantity: number;
  type?: string;
}

interface LootPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Loot Panel - Lightweight UI for viewing and looting corpses
 */
export const LootPanel: React.FC<LootPanelProps> = ({ isOpen, onClose }) => {
  const activeCharacter = useGameStateStore((s) => s.activeCharacter);
  const activeEncounterId = useCombatStore((s) => s.activeEncounterId);
  const addMessage = useChatStore((s) => s.addMessage);
  
  const [corpses, setCorpses] = useState<Corpse[]>([]);
  const [selectedCorpse, setSelectedCorpse] = useState<string | null>(null);
  const [lootItems, setLootItems] = useState<LootItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch corpses when panel opens
  useEffect(() => {
    if (isOpen && activeEncounterId) {
      fetchCorpses();
    }
  }, [isOpen, activeEncounterId]);

  const fetchCorpses = async () => {
    if (!activeEncounterId) return;
    setIsLoading(true);
    try {
      const result = await mcpManager.gameStateClient.callTool('list_corpses_in_encounter', {
        encounterId: activeEncounterId
      });
      const text = result?.content?.[0]?.text || '{}';
      const data = JSON.parse(text);
      setCorpses(data.corpses || []);
    } catch (error) {
      console.error('Failed to fetch corpses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLoot = async (corpseId: string) => {
    setIsLoading(true);
    try {
      const result = await mcpManager.gameStateClient.callTool('get_corpse_inventory', {
        corpseId
      });
      const text = result?.content?.[0]?.text || '{}';
      const data = JSON.parse(text);
      setLootItems(data.available || []);
      setSelectedCorpse(corpseId);
    } catch (error) {
      console.error('Failed to fetch loot:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLootAll = async () => {
    if (!activeCharacter?.id || !selectedCorpse) return;
    setIsLoading(true);
    
    try {
      const result = await mcpManager.gameStateClient.callTool('loot_corpse', {
        characterId: activeCharacter.id,
        corpseId: selectedCorpse,
        lootAll: true
      });
      
      const text = result?.content?.[0]?.text || '{}';
      const data = JSON.parse(text);
      
      // Log to chat
      const items = data.itemsLooted || [];
      addMessage({
        id: Date.now().toString(),
        sender: 'system',
        content: `💰 **${activeCharacter.name}** loots ${items.length} items from corpse.`,
        timestamp: Date.now(),
        type: 'info'
      });
      
      // Refresh
      await fetchCorpses();
      setSelectedCorpse(null);
      setLootItems([]);
      await useGameStateStore.getState().syncState();
    } catch (error: any) {
      addMessage({
        id: Date.now().toString(),
        sender: 'system',
        content: `❌ Loot failed: ${error.message}`,
        timestamp: Date.now(),
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const selectedCorpseData = corpses.find(c => c.id === selectedCorpse);

  return (
    <div className="loot-panel-overlay" onClick={onClose}>
      <div className="loot-panel" onClick={(e) => e.stopPropagation()}>
        <div className="loot-panel-header">
          <h3>💀 Corpses & Loot</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="loot-panel-content">
          {!activeEncounterId ? (
            <div className="empty-state">No active encounter - no corpses to loot</div>
          ) : isLoading && corpses.length === 0 ? (
            <div className="loading">Loading...</div>
          ) : corpses.length === 0 ? (
            <div className="empty-state">No corpses in this encounter</div>
          ) : (
            <div className="corpse-grid">
              {/* Corpse List */}
              <div className="corpse-list">
                <div className="section-title">Bodies ({corpses.length})</div>
                {corpses.map(corpse => (
                  <div 
                    key={corpse.id}
                    className={`corpse-item ${corpse.looted ? 'looted' : ''} ${selectedCorpse === corpse.id ? 'selected' : ''}`}
                    onClick={() => fetchLoot(corpse.id)}
                  >
                    <span className="corpse-icon">{corpse.looted ? '💀' : '⚰️'}</span>
                    <span className="corpse-name">{corpse.characterName}</span>
                    <span className="corpse-type">{corpse.characterType}</span>
                    {corpse.looted && <span className="looted-badge">Looted</span>}
                  </div>
                ))}
              </div>

              {/* Loot Details */}
              {selectedCorpse && (
                <div className="loot-details">
                  <div className="section-title">
                    {selectedCorpseData?.characterName}'s Remains
                  </div>
                  
                  {lootItems.length === 0 ? (
                    <div className="empty-loot">Nothing left to loot</div>
                  ) : (
                    <>
                      <div className="loot-list">
                        {lootItems.map((item, i) => (
                          <div key={i} className="loot-item">
                            <span className="item-name">{item.name}</span>
                            {item.quantity > 1 && <span className="item-qty">x{item.quantity}</span>}
                          </div>
                        ))}
                      </div>
                      
                      <button 
                        className="loot-all-btn"
                        onClick={handleLootAll}
                        disabled={isLoading || !activeCharacter}
                      >
                        {isLoading ? 'Looting...' : '💰 Loot All'}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <style>{`
          .loot-panel-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
          }
          
          .loot-panel {
            background: linear-gradient(135deg, #1a1f2e 0%, #0d1117 100%);
            border: 1px solid rgba(234, 179, 8, 0.3);
            border-radius: 12px;
            width: 500px;
            max-width: 90vw;
            max-height: 80vh;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
          }
          
          .loot-panel-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          }
          
          .loot-panel-header h3 {
            margin: 0;
            font-size: 18px;
            color: #fbbf24;
          }
          
          .close-btn {
            background: none;
            border: none;
            color: #94a3b8;
            font-size: 24px;
            cursor: pointer;
          }
          
          .loot-panel-content {
            padding: 16px;
            max-height: 60vh;
            overflow-y: auto;
          }
          
          .empty-state, .loading {
            text-align: center;
            color: #64748b;
            padding: 32px;
          }
          
          .corpse-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
          }
          
          .section-title {
            font-size: 12px;
            font-weight: 600;
            color: #94a3b8;
            text-transform: uppercase;
            margin-bottom: 8px;
          }
          
          .corpse-list {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }
          
          .corpse-item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s;
          }
          
          .corpse-item:hover {
            background: rgba(234, 179, 8, 0.1);
            border-color: rgba(234, 179, 8, 0.3);
          }
          
          .corpse-item.selected {
            background: rgba(234, 179, 8, 0.2);
            border-color: rgba(234, 179, 8, 0.5);
          }
          
          .corpse-item.looted {
            opacity: 0.6;
          }
          
          .corpse-icon { font-size: 16px; }
          .corpse-name { flex: 1; color: #e2e8f0; font-size: 13px; }
          .corpse-type { font-size: 11px; color: #64748b; }
          .looted-badge {
            font-size: 10px;
            background: rgba(100, 116, 139, 0.3);
            color: #94a3b8;
            padding: 2px 6px;
            border-radius: 4px;
          }
          
          .loot-details {
            background: rgba(0, 0, 0, 0.2);
            border-radius: 8px;
            padding: 12px;
          }
          
          .empty-loot {
            color: #64748b;
            font-size: 13px;
            text-align: center;
            padding: 16px;
          }
          
          .loot-list {
            display: flex;
            flex-direction: column;
            gap: 4px;
            margin-bottom: 12px;
          }
          
          .loot-item {
            display: flex;
            justify-content: space-between;
            padding: 6px 8px;
            background: rgba(255, 255, 255, 0.03);
            border-radius: 4px;
          }
          
          .item-name { color: #e2e8f0; font-size: 13px; }
          .item-qty { color: #94a3b8; font-size: 12px; }
          
          .loot-all-btn {
            width: 100%;
            padding: 10px;
            background: linear-gradient(135deg, #eab308 0%, #ca8a04 100%);
            border: none;
            border-radius: 6px;
            color: #1a1a1a;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
          }
          
          .loot-all-btn:hover:not(:disabled) {
            background: linear-gradient(135deg, #facc15 0%, #eab308 100%);
          }
          
          .loot-all-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
        `}</style>
      </div>
    </div>
  );
};
