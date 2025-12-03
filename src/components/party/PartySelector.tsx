import React, { useEffect, useState, useRef } from 'react';
import { usePartyStore } from '../../stores/partyStore';
import { useGameStateStore } from '../../stores/gameStateStore';

interface PartySelectorProps {
  onCreateParty?: () => void;
  className?: string;
}

export const PartySelector: React.FC<PartySelectorProps> = ({ onCreateParty, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const parties = usePartyStore((state) => state.parties);
  const activePartyId = usePartyStore((state) => state.activePartyId);
  const partyDetails = usePartyStore((state) => state.partyDetails);
  const setActivePartyId = usePartyStore((state) => state.setActivePartyId);
  const syncPartyDetails = usePartyStore((state) => state.syncPartyDetails);
  const isInitialized = usePartyStore((state) => state.isInitialized);
  const isSyncing = usePartyStore((state) => state.isSyncing);

  const setActiveCharacterId = useGameStateStore((state) => state.setActiveCharacterId);
  const syncGameState = useGameStateStore((state) => state.syncState);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeParty = activePartyId ? partyDetails[activePartyId] : null;
  const memberCount = activeParty?.members?.length || 0;

  const handleSelectParty = async (partyId: string) => {
    setActivePartyId(partyId);
    await syncPartyDetails(partyId);
    
    // Get the newly synced party details and sync the active character
    const newPartyDetails = usePartyStore.getState().partyDetails[partyId];
    if (newPartyDetails) {
      const activeMember = newPartyDetails.members.find(m => m.isActive);
      if (activeMember) {
        console.log('[PartySelector] Syncing active character for new party:', activeMember.character.name);
        setActiveCharacterId(activeMember.characterId, true);
        await syncGameState(true);
      }
    }
    
    setIsOpen(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'dormant': return 'bg-yellow-500';
      case 'archived': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  // Find the currently playing character name
  const playingMember = activeParty?.members.find(m => m.isActive);
  const playingCharacterName = playingMember?.character.name;

  // Show loading state if not initialized or syncing
  const isLoading = !isInitialized || isSyncing;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Selector Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-terminal-green/10 border border-terminal-green/50 rounded-lg hover:bg-terminal-green/20 hover:border-terminal-green transition-all min-w-[180px]"
      >
        {isLoading ? (
          <span className="animate-pulse text-terminal-green/70">Loading...</span>
        ) : activeParty ? (
          <>
            <span className={`w-2 h-2 rounded-full ${getStatusColor(activeParty.status)}`} />
            <div className="flex-1 text-left">
              <div className="text-sm font-medium text-terminal-green truncate max-w-[120px]">
                {activeParty.name}
              </div>
              <div className="text-xs text-terminal-green/60">
                {playingCharacterName ? (
                  <span>Playing: <span className="text-terminal-green">{playingCharacterName}</span></span>
                ) : (
                  <span>{memberCount} member{memberCount !== 1 ? 's' : ''}</span>
                )}
              </div>
            </div>
            <svg
              className={`w-4 h-4 text-terminal-green/60 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </>
        ) : (
          <>
            <span className="text-sm text-terminal-green/70">No Party Selected</span>
            <svg
              className={`w-4 h-4 text-terminal-green/60 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-terminal-black border border-terminal-green rounded-lg shadow-lg shadow-terminal-green/20 z-50 overflow-hidden">
          {/* Header */}
          <div className="px-3 py-2 border-b border-terminal-green/30 bg-terminal-green/5">
            <div className="text-xs font-bold uppercase tracking-widest text-terminal-green/60">
              Select Party
            </div>
          </div>

          {/* Party List */}
          <div className="max-h-64 overflow-y-auto">
            {parties.length > 0 ? (
              parties.map((party) => {
                const details = partyDetails[party.id];
                const count = details?.members?.length || 0;
                const isActive = party.id === activePartyId;
                const activeChar = details?.members.find(m => m.isActive);

                return (
                  <button
                    key={party.id}
                    onClick={() => handleSelectParty(party.id)}
                    className={`w-full px-3 py-2 text-left hover:bg-terminal-green/10 transition-colors flex items-center gap-2 ${
                      isActive ? 'bg-terminal-green/20' : ''
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${getStatusColor(party.status)}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-terminal-green truncate">
                        {party.name}
                      </div>
                      <div className="text-xs text-terminal-green/60">
                        {activeChar ? (
                          <span>Playing: {activeChar.character.name}</span>
                        ) : (
                          <span>{count} member{count !== 1 ? 's' : ''} · {party.status}</span>
                        )}
                      </div>
                    </div>
                    {isActive && (
                      <svg className="w-4 h-4 text-terminal-green flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-4 text-center text-terminal-green/50 text-sm">
                No parties created yet
              </div>
            )}
          </div>

          {/* Create Party Button */}
          {onCreateParty && (
            <div className="border-t border-terminal-green/30">
              <button
                onClick={() => {
                  setIsOpen(false);
                  onCreateParty();
                }}
                className="w-full px-3 py-2 text-left hover:bg-terminal-green/10 transition-colors flex items-center gap-2 text-terminal-green"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-sm font-medium">Create New Party</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PartySelector;
