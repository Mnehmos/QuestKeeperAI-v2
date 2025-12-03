import React, { useState, useEffect } from 'react';
import { usePartyStore, MemberRole, CharacterSummary } from '../../stores/partyStore';
import { useGameStateStore } from '../../stores/gameStateStore';

interface PartyCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SelectedMember {
  characterId: string;
  role: MemberRole;
}

const ROLE_OPTIONS: { value: MemberRole; label: string; description: string }[] = [
  { value: 'leader', label: 'Leader', description: 'Commands the party' },
  { value: 'member', label: 'Member', description: 'Full party member' },
  { value: 'companion', label: 'Companion', description: 'Ally, no loot share' },
  { value: 'hireling', label: 'Hireling', description: 'Paid helper' },
];

export const PartyCreatorModal: React.FC<PartyCreatorModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<'info' | 'members' | 'review'>('info');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<SelectedMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createParty = usePartyStore((state) => state.createParty);
  const unassignedCharacters = usePartyStore((state) => state.unassignedCharacters);
  const syncUnassignedCharacters = usePartyStore((state) => state.syncUnassignedCharacters);

  const party = useGameStateStore((state) => state.party);
  const worlds = useGameStateStore((state) => state.worlds);
  const activeWorldId = useGameStateStore((state) => state.activeWorldId);

  // Combine unassigned from partyStore with all characters from gameStateStore
  // until parties are set up, all characters are essentially unassigned
  const availableCharacters: CharacterSummary[] = unassignedCharacters.length > 0
    ? unassignedCharacters
    : party.map((c) => ({
        id: c.id || '',
        name: c.name,
        level: c.level,
        class: c.class,
        race: c.race,
        hp: c.hp.current,
        maxHp: c.hp.max,
        ac: c.armorClass,
        characterType: 'pc' as const,
      })).filter((c) => c.id);

  // Sync unassigned characters when modal opens
  useEffect(() => {
    if (isOpen) {
      syncUnassignedCharacters();
      setStep('info');
      setName('');
      setDescription('');
      setSelectedMembers([]);
      setError(null);
    }
  }, [isOpen, syncUnassignedCharacters]);

  if (!isOpen) return null;

  const handleToggleMember = (characterId: string) => {
    const existing = selectedMembers.find((m) => m.characterId === characterId);
    if (existing) {
      setSelectedMembers(selectedMembers.filter((m) => m.characterId !== characterId));
    } else {
      // First member becomes leader by default
      const role: MemberRole = selectedMembers.length === 0 ? 'leader' : 'member';
      setSelectedMembers([...selectedMembers, { characterId, role }]);
    }
  };

  const handleRoleChange = (characterId: string, role: MemberRole) => {
    // If setting as leader, demote current leader
    if (role === 'leader') {
      setSelectedMembers(
        selectedMembers.map((m) => ({
          ...m,
          role: m.characterId === characterId ? 'leader' : m.role === 'leader' ? 'member' : m.role,
        }))
      );
    } else {
      setSelectedMembers(
        selectedMembers.map((m) => (m.characterId === characterId ? { ...m, role } : m))
      );
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Party name is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const initialMembers = selectedMembers.map((m) => ({
        characterId: m.characterId,
        role: m.role,
      }));

      const partyId = await createParty(
        name.trim(),
        description.trim() || undefined,
        activeWorldId || undefined,
        initialMembers.length > 0 ? initialMembers : undefined
      );

      if (partyId) {
        onClose();
      } else {
        setError('Failed to create party');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create party');
    } finally {
      setLoading(false);
    }
  };

  const getCharacterById = (id: string) => availableCharacters.find((c) => c.id === id);
  const leader = selectedMembers.find((m) => m.role === 'leader');
  const leaderChar = leader ? getCharacterById(leader.characterId) : null;

  const canProceed = () => {
    if (step === 'info') return name.trim().length >= 2;
    if (step === 'members') return true; // Members are optional
    return true;
  };

  const goNext = () => {
    if (step === 'info') setStep('members');
    else if (step === 'members') setStep('review');
  };

  const goBack = () => {
    if (step === 'members') setStep('info');
    else if (step === 'review') setStep('members');
  };

  const steps = ['info', 'members', 'review'] as const;
  const currentStepIndex = steps.indexOf(step);

  const renderInfoStep = () => (
    <div className="space-y-5 animate-fadeIn">
      {/* Party Name */}
      <div>
        <label className="block text-sm font-bold text-terminal-green mb-2">
          PARTY NAME <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-black border-2 border-terminal-green/50 text-terminal-green px-4 py-3 rounded-lg focus:outline-none focus:border-terminal-green-bright focus:shadow-[0_0_10px_rgba(0,255,0,0.3)] transition-all"
          placeholder="The Fellowship of the Ring..."
          autoFocus
          maxLength={50}
        />
        {name.length > 0 && name.length < 2 && (
          <p className="text-red-400 text-xs mt-1">Name must be at least 2 characters</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-bold text-terminal-green mb-2">
          DESCRIPTION <span className="text-terminal-green/50 text-xs font-normal">(optional)</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full h-24 bg-black border border-terminal-green/50 text-terminal-green px-4 py-3 rounded-lg focus:outline-none focus:border-terminal-green-bright resize-none"
          placeholder="A band of adventurers united by fate..."
          maxLength={200}
        />
        <div className="text-xs text-terminal-green/50 text-right mt-1">{description.length}/200</div>
      </div>

      {/* World Info */}
      {activeWorldId && worlds.length > 0 && (
        <div className="border border-terminal-green/30 rounded-lg p-3 bg-terminal-green/5">
          <div className="text-xs text-terminal-green/60 mb-1">Will be linked to:</div>
          <div className="text-sm text-terminal-green font-medium">
            {worlds.find((w: any) => w.id === activeWorldId)?.name || 'Current World'}
          </div>
        </div>
      )}
    </div>
  );

  const renderMembersStep = () => (
    <div className="space-y-4 animate-fadeIn">
      <div className="text-sm text-terminal-green/70 mb-2">
        Select characters to add to your party. You can always add more later.
      </div>

      {/* Available Characters */}
      <div className="border border-terminal-green/30 rounded-lg overflow-hidden">
        <div className="bg-terminal-green/10 px-3 py-2 text-xs font-bold text-terminal-green/80 uppercase tracking-wider">
          Available Characters ({availableCharacters.length})
        </div>

        <div className="max-h-64 overflow-y-auto">
          {availableCharacters.length > 0 ? (
            availableCharacters.map((char) => {
              const isSelected = selectedMembers.some((m) => m.characterId === char.id);
              const memberData = selectedMembers.find((m) => m.characterId === char.id);

              return (
                <div
                  key={char.id}
                  className={`flex items-center gap-3 p-3 border-b border-terminal-green/10 last:border-0 transition-colors ${
                    isSelected ? 'bg-terminal-green/20' : 'hover:bg-terminal-green/5'
                  }`}
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => handleToggleMember(char.id)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-terminal-green border-terminal-green text-black'
                        : 'border-terminal-green/50 hover:border-terminal-green'
                    }`}
                  >
                    {isSelected && (
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>

                  {/* Character Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-terminal-green truncate">{char.name}</div>
                    <div className="text-xs text-terminal-green/60">
                      Level {char.level} {char.class}
                      {char.race && ` · ${char.race}`}
                    </div>
                  </div>

                  {/* HP */}
                  <div className="text-xs text-terminal-green/60">
                    HP: {char.hp}/{char.maxHp}
                  </div>

                  {/* Role Selector (if selected) */}
                  {isSelected && (
                    <select
                      value={memberData?.role || 'member'}
                      onChange={(e) => handleRoleChange(char.id, e.target.value as MemberRole)}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-black border border-terminal-green/50 text-terminal-green text-xs px-2 py-1 rounded"
                    >
                      {ROLE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              );
            })
          ) : (
            <div className="p-4 text-center text-terminal-green/50 text-sm">
              No characters available. Create characters first!
            </div>
          )}
        </div>
      </div>

      {/* Selection Summary */}
      {selectedMembers.length > 0 && (
        <div className="border border-terminal-green/30 rounded-lg p-3 bg-terminal-green/5">
          <div className="text-xs text-terminal-green/60 mb-2">
            Selected: {selectedMembers.length} character{selectedMembers.length !== 1 ? 's' : ''}
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedMembers.map((m) => {
              const char = getCharacterById(m.characterId);
              return (
                <span
                  key={m.characterId}
                  className={`px-2 py-1 rounded text-xs ${
                    m.role === 'leader'
                      ? 'bg-yellow-500/20 border border-yellow-500/50 text-yellow-400'
                      : 'bg-terminal-green/10 border border-terminal-green/30 text-terminal-green'
                  }`}
                >
                  {m.role === 'leader' && '★ '}
                  {char?.name || 'Unknown'}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  const renderReviewStep = () => (
    <div className="space-y-4 animate-fadeIn">
      {/* Party Card Preview */}
      <div className="border-2 border-terminal-green rounded-xl p-5 bg-terminal-green/5">
        <h3 className="text-xl font-bold text-terminal-green-bright mb-1">{name || 'Unnamed Party'}</h3>
        {description && <p className="text-sm text-terminal-green/70 mb-3 italic">"{description}"</p>}

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="bg-black/30 rounded-lg p-3">
            <div className="text-xs text-terminal-green/60 mb-1">Members</div>
            <div className="text-2xl font-bold text-terminal-green">{selectedMembers.length}</div>
          </div>
          <div className="bg-black/30 rounded-lg p-3">
            <div className="text-xs text-terminal-green/60 mb-1">Leader</div>
            <div className="text-lg font-medium text-yellow-400 truncate">
              {leaderChar?.name || 'None assigned'}
            </div>
          </div>
        </div>

        {/* Members List */}
        {selectedMembers.length > 0 && (
          <div className="mt-4 pt-4 border-t border-terminal-green/20">
            <div className="text-xs text-terminal-green/60 mb-2">Party Roster</div>
            <div className="space-y-1">
              {selectedMembers.map((m) => {
                const char = getCharacterById(m.characterId);
                return (
                  <div key={m.characterId} className="flex items-center justify-between text-sm">
                    <span className="text-terminal-green">
                      {m.role === 'leader' && <span className="text-yellow-400 mr-1">★</span>}
                      {char?.name || 'Unknown'}
                    </span>
                    <span className="text-terminal-green/50 text-xs capitalize">{m.role}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-500 rounded-lg p-3 text-red-300 text-sm">
          {error}
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-terminal-black border-2 border-terminal-green rounded-xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-[0_0_50px_rgba(0,255,0,0.3)] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-terminal-green/30 bg-terminal-green/5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold text-terminal-green flex items-center gap-2">
              + CREATE PARTY
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full border border-terminal-green/50 text-terminal-green hover:bg-terminal-green/20 transition-colors flex items-center justify-center"
            >
              X
            </button>
          </div>

          {/* Progress Bar */}
          <div className="flex gap-1">
            {steps.map((s, i) => (
              <div key={s} className="flex-1">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i <= currentStepIndex ? 'bg-terminal-green' : 'bg-terminal-green/20'
                  }`}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {steps.map((s, i) => (
              <span
                key={s}
                className={`text-xs uppercase ${
                  i === currentStepIndex ? 'text-terminal-green font-bold' : 'text-terminal-green/40'
                }`}
              >
                {s === 'info' ? 'Details' : s}
              </span>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {step === 'info' && renderInfoStep()}
          {step === 'members' && renderMembersStep()}
          {step === 'review' && renderReviewStep()}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-terminal-green/30 bg-terminal-green/5 flex gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-terminal-green/50 text-terminal-green rounded-lg hover:bg-terminal-green/10 transition-colors"
          >
            Cancel
          </button>

          <div className="flex-1" />

          {currentStepIndex > 0 && (
            <button
              onClick={goBack}
              className="px-4 py-2 border border-terminal-green/50 text-terminal-green rounded-lg hover:bg-terminal-green/10 transition-colors"
            >
              Back
            </button>
          )}

          {step !== 'review' ? (
            <button
              onClick={goNext}
              disabled={!canProceed()}
              className="px-6 py-2 bg-terminal-green text-black font-bold rounded-lg hover:bg-terminal-green-bright transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(0,255,0,0.3)]"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-terminal-green text-black font-bold rounded-lg hover:bg-terminal-green-bright transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(0,255,0,0.3)] flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin">*</span>
                  Creating...
                </>
              ) : (
                'Create Party'
              )}
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default PartyCreatorModal;
