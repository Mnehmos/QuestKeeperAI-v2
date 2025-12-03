import React, { useState, useEffect } from 'react';
import { usePartyStore, MemberRole, CharacterType } from '../../stores/partyStore';

interface CharacterPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  partyId?: string;
}

const ROLE_OPTIONS: { value: MemberRole; label: string; description: string }[] = [
  { value: 'leader', label: 'Leader', description: 'Commands the party' },
  { value: 'member', label: 'Member', description: 'Full party member' },
  { value: 'companion', label: 'Companion', description: 'Ally, no loot share' },
  { value: 'hireling', label: 'Hireling', description: 'Paid helper' },
  { value: 'prisoner', label: 'Prisoner', description: 'Captive' },
  { value: 'mount', label: 'Mount', description: 'Riding animal' },
];

const CHARACTER_TYPE_FILTERS: { value: CharacterType | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pc', label: 'Players' },
  { value: 'npc', label: 'NPCs' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'enemy', label: 'Enemies' },
];

export const CharacterPickerModal: React.FC<CharacterPickerModalProps> = ({
  isOpen,
  onClose,
  partyId,
}) => {
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<MemberRole>('member');
  const [typeFilter, setTypeFilter] = useState<CharacterType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activePartyId = usePartyStore((state) => state.activePartyId);
  const unassignedCharacters = usePartyStore((state) => state.unassignedCharacters);
  const syncUnassignedCharacters = usePartyStore((state) => state.syncUnassignedCharacters);
  const addMember = usePartyStore((state) => state.addMember);

  const targetPartyId = partyId || activePartyId;

  // Sync unassigned characters when modal opens
  useEffect(() => {
    if (isOpen) {
      syncUnassignedCharacters();
      setSelectedCharacter(null);
      setSelectedRole('member');
      setSearchQuery('');
      setError(null);
    }
  }, [isOpen, syncUnassignedCharacters]);

  if (!isOpen) return null;

  // Filter characters
  const filteredCharacters = unassignedCharacters.filter((char) => {
    // Type filter
    if (typeFilter !== 'all' && char.characterType !== typeFilter) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        char.name.toLowerCase().includes(query) ||
        char.class.toLowerCase().includes(query) ||
        (char.race && char.race.toLowerCase().includes(query))
      );
    }

    return true;
  });

  const handleAddMember = async () => {
    if (!targetPartyId || !selectedCharacter) {
      setError('Please select a character');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const success = await addMember(targetPartyId, selectedCharacter, selectedRole);
      if (success) {
        onClose();
      } else {
        setError('Failed to add member to party');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type: CharacterType) => {
    switch (type) {
      case 'pc':
        return 'text-terminal-green';
      case 'npc':
        return 'text-blue-400';
      case 'neutral':
        return 'text-gray-400';
      case 'enemy':
        return 'text-red-400';
      default:
        return 'text-terminal-green';
    }
  };

  const getTypeLabel = (type: CharacterType) => {
    switch (type) {
      case 'pc':
        return 'PC';
      case 'npc':
        return 'NPC';
      case 'neutral':
        return 'Neutral';
      case 'enemy':
        return 'Enemy';
      default:
        return type;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-terminal-black border-2 border-terminal-green rounded-xl w-full max-w-md max-h-[85vh] overflow-hidden shadow-[0_0_50px_rgba(0,255,0,0.3)] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-terminal-green/30 bg-terminal-green/5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-terminal-green">+ ADD PARTY MEMBER</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full border border-terminal-green/50 text-terminal-green hover:bg-terminal-green/20 transition-colors flex items-center justify-center"
            >
              X
            </button>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="p-3 border-b border-terminal-green/20 space-y-3">
          {/* Search */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search characters..."
            className="w-full bg-black border border-terminal-green/50 text-terminal-green px-3 py-2 rounded-lg focus:outline-none focus:border-terminal-green text-sm"
          />

          {/* Type Filter */}
          <div className="flex gap-1 flex-wrap">
            {CHARACTER_TYPE_FILTERS.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setTypeFilter(filter.value)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  typeFilter === filter.value
                    ? 'bg-terminal-green text-black font-bold'
                    : 'bg-terminal-green/10 text-terminal-green hover:bg-terminal-green/20'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Character List */}
        <div className="flex-1 overflow-y-auto">
          {filteredCharacters.length > 0 ? (
            <div className="divide-y divide-terminal-green/10">
              {filteredCharacters.map((char) => (
                <button
                  key={char.id}
                  onClick={() => setSelectedCharacter(char.id)}
                  className={`w-full p-3 text-left transition-colors ${
                    selectedCharacter === char.id
                      ? 'bg-terminal-green/20'
                      : 'hover:bg-terminal-green/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Selection Indicator */}
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                        selectedCharacter === char.id
                          ? 'border-terminal-green bg-terminal-green'
                          : 'border-terminal-green/50'
                      }`}
                    >
                      {selectedCharacter === char.id && (
                        <div className="w-2 h-2 rounded-full bg-black" />
                      )}
                    </div>

                    {/* Character Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-terminal-green truncate">{char.name}</div>
                      <div className="text-xs text-terminal-green/60">
                        Level {char.level} {char.class}
                        {char.race && ` · ${char.race}`}
                      </div>
                    </div>

                    {/* Type Badge */}
                    <span className={`text-xs px-2 py-0.5 rounded ${getTypeColor(char.characterType)} bg-current/10`}>
                      {getTypeLabel(char.characterType)}
                    </span>

                    {/* HP */}
                    <div className="text-xs text-terminal-green/60 text-right">
                      <div>HP</div>
                      <div>
                        {char.hp}/{char.maxHp}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <div className="text-terminal-green/50 text-sm mb-2">
                {unassignedCharacters.length === 0
                  ? 'No unassigned characters available'
                  : 'No characters match your search'}
              </div>
              {unassignedCharacters.length === 0 && (
                <div className="text-xs text-terminal-green/30">
                  All characters are already in parties
                </div>
              )}
            </div>
          )}
        </div>

        {/* Role Selection (shown when character selected) */}
        {selectedCharacter && (
          <div className="p-3 border-t border-terminal-green/20 bg-terminal-green/5">
            <label className="block text-xs font-bold text-terminal-green/70 mb-2 uppercase">
              Assign Role
            </label>
            <div className="grid grid-cols-3 gap-2">
              {ROLE_OPTIONS.map((role) => (
                <button
                  key={role.value}
                  onClick={() => setSelectedRole(role.value)}
                  className={`px-2 py-2 text-xs rounded transition-all ${
                    selectedRole === role.value
                      ? role.value === 'leader'
                        ? 'bg-yellow-500/20 border-2 border-yellow-500 text-yellow-400'
                        : 'bg-terminal-green/20 border-2 border-terminal-green text-terminal-green'
                      : 'bg-black/30 border border-terminal-green/30 text-terminal-green/70 hover:border-terminal-green/50'
                  }`}
                >
                  {role.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="px-4 py-2 bg-red-900/30 border-t border-red-500/50 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-terminal-green/30 flex gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-terminal-green/50 text-terminal-green rounded-lg hover:bg-terminal-green/10 transition-colors"
          >
            Cancel
          </button>
          <div className="flex-1" />
          <button
            onClick={handleAddMember}
            disabled={!selectedCharacter || loading}
            className="px-6 py-2 bg-terminal-green text-black font-bold rounded-lg hover:bg-terminal-green-bright transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(0,255,0,0.3)] flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin">*</span>
                Adding...
              </>
            ) : (
              <>+ Add to Party</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CharacterPickerModal;
