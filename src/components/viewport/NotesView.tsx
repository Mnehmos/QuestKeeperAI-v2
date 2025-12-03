import React, { useState, useMemo } from 'react';
import { useGameStateStore } from '../../stores/gameStateStore';
import { useNotesStore, getSortedNotes, CATEGORY_INFO, Note, NoteCategory } from '../../stores/notesStore';

export const NotesView: React.FC = () => {
  const quests = useGameStateStore((state) => state.quests);
  const activeCharacterId = useGameStateStore((state) => state.activeCharacterId);
  const activeWorldId = useGameStateStore((state) => state.activeWorldId);
  
  // Use the dedicated notes store
  const notes = useNotesStore((state) => state.notes);
  const addNote = useNotesStore((state) => state.addNote);
  const updateNote = useNotesStore((state) => state.updateNote);
  const deleteNote = useNotesStore((state) => state.deleteNote);
  const togglePin = useNotesStore((state) => state.togglePin);

  const [activeTab, setActiveTab] = useState<'quests' | 'notes'>('quests');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<NoteCategory | 'all'>('all');

  // Form state for new/edit note
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteCategory, setNoteCategory] = useState<NoteCategory>('general');
  const [noteTags, setNoteTags] = useState('');

  // Filter and sort notes
  const filteredNotes = useMemo(() => {
    let filtered = notes;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((n) => n.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (n) =>
          n.title.toLowerCase().includes(query) ||
          n.content.toLowerCase().includes(query) ||
          n.tags.some((t) => t.toLowerCase().includes(query))
      );
    }

    return getSortedNotes(filtered);
  }, [notes, selectedCategory, searchQuery]);

  const resetForm = () => {
    setNoteTitle('');
    setNoteContent('');
    setNoteCategory('general');
    setNoteTags('');
    setIsAdding(false);
    setEditingId(null);
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    const tags = noteTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    addNote({
      title: noteTitle.trim() || 'Untitled Note',
      content: noteContent.trim(),
      category: noteCategory,
      tags,
      author: 'player',
      characterId: activeCharacterId || undefined,
      worldId: activeWorldId || undefined,
    });

    resetForm();
  };

  const handleEditNote = (note: Note) => {
    setEditingId(note.id);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setNoteCategory(note.category);
    setNoteTags(note.tags.join(', '));
    setIsAdding(true);
  };

  const handleUpdateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !noteContent.trim()) return;

    const tags = noteTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    updateNote(editingId, {
      title: noteTitle.trim() || 'Untitled Note',
      content: noteContent.trim(),
      category: noteCategory,
      tags,
    });

    resetForm();
  };

  const handleDeleteNote = (id: string) => {
    if (confirm('Delete this note permanently?')) {
      deleteNote(id);
      if (editingId === id) {
        resetForm();
      }
    }
  };

  return (
    <div className="h-full flex flex-col p-4 font-mono text-terminal-green overflow-hidden">
      {/* Tab Header */}
      <div className="flex gap-4 mb-4 border-b border-terminal-green-dim pb-2">
        <button
          onClick={() => setActiveTab('quests')}
          className={`text-lg font-bold uppercase tracking-wider transition-colors ${
            activeTab === 'quests'
              ? 'text-terminal-green text-glow'
              : 'text-terminal-green/50 hover:text-terminal-green/80'
          }`}
        >
          Quests ({quests.length})
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`text-lg font-bold uppercase tracking-wider transition-colors ${
            activeTab === 'notes'
              ? 'text-terminal-green text-glow'
              : 'text-terminal-green/50 hover:text-terminal-green/80'
          }`}
        >
          Field Notes ({notes.length})
        </button>

        {activeTab === 'notes' && !isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="ml-auto px-3 py-1 border border-terminal-green text-xs uppercase hover:bg-terminal-green hover:text-terminal-black transition-colors"
          >
            + Add Note
          </button>
        )}
      </div>

      {/* Notes Tab Content */}
      {activeTab === 'notes' && (
        <>
          {/* Search and Filter Bar */}
          {!isAdding && (
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes..."
                className="flex-grow bg-terminal-black border border-terminal-green-dim p-2 text-sm text-terminal-green focus:outline-none focus:border-terminal-green"
              />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as NoteCategory | 'all')}
                className="bg-terminal-black border border-terminal-green-dim p-2 text-sm text-terminal-green focus:outline-none focus:border-terminal-green"
              >
                <option value="all">All Categories</option>
                {Object.entries(CATEGORY_INFO).map(([key, info]) => (
                  <option key={key} value={key}>
                    {info.icon} {info.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Add/Edit Note Form */}
          {isAdding && (
            <form
              onSubmit={editingId ? handleUpdateNote : handleAddNote}
              className="mb-4 border border-terminal-green-dim p-3 bg-terminal-black/50"
            >
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="Note title..."
                  className="flex-grow bg-terminal-black border border-terminal-green-dim p-2 text-sm text-terminal-green focus:outline-none focus:border-terminal-green"
                />
                <select
                  value={noteCategory}
                  onChange={(e) => setNoteCategory(e.target.value as NoteCategory)}
                  className="bg-terminal-black border border-terminal-green-dim p-2 text-sm text-terminal-green focus:outline-none focus:border-terminal-green"
                >
                  {Object.entries(CATEGORY_INFO).map(([key, info]) => (
                    <option key={key} value={key}>
                      {info.icon} {info.label}
                    </option>
                  ))}
                </select>
              </div>

              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Enter your observations..."
                className="w-full bg-terminal-black border border-terminal-green-dim p-2 text-terminal-green focus:outline-none focus:border-terminal-green h-32 resize-none mb-2"
                autoFocus
              />

              <input
                type="text"
                value={noteTags}
                onChange={(e) => setNoteTags(e.target.value)}
                placeholder="Tags (comma separated): goblin, dungeon, treasure..."
                className="w-full bg-terminal-black border border-terminal-green-dim p-2 text-sm text-terminal-green focus:outline-none focus:border-terminal-green mb-2"
              />

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-grow bg-terminal-green/10 border border-terminal-green py-2 hover:bg-terminal-green hover:text-terminal-black transition-colors uppercase text-sm"
                >
                  {editingId ? 'Update Note' : 'Save Note'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 border border-terminal-green-dim py-2 hover:bg-terminal-green-dim/20 transition-colors uppercase text-sm text-terminal-green-dim"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Notes List */}
          <div className="flex-grow overflow-y-auto space-y-3 pr-2">
            {filteredNotes.length === 0 ? (
              <div className="text-center opacity-50 py-8 italic">
                {searchQuery || selectedCategory !== 'all'
                  ? '[NO_MATCHING_NOTES]'
                  : '[NO_DATA_RECORDED]'}
              </div>
            ) : (
              filteredNotes.map((note) => {
                const categoryInfo = CATEGORY_INFO[note.category];
                return (
                  <div
                    key={note.id}
                    className={`border bg-terminal-black/30 p-3 relative group ${
                      note.pinned
                        ? 'border-terminal-amber'
                        : 'border-terminal-green-dim'
                    }`}
                  >
                    {/* Note Header */}
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        {note.pinned && (
                          <span className="text-terminal-amber" title="Pinned">
                            📌
                          </span>
                        )}
                        <span className={categoryInfo.color}>{categoryInfo.icon}</span>
                        <span className="font-bold text-terminal-green-bright">
                          {note.title}
                        </span>
                      </div>
                      <span className="text-xs opacity-50">
                        {new Date(note.updatedAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Note Content */}
                    <div className="whitespace-pre-wrap opacity-90 text-sm mb-2">
                      {note.content}
                    </div>

                    {/* Tags */}
                    {note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {note.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-2 py-0.5 bg-terminal-green/10 border border-terminal-green-dim rounded"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                      <button
                        onClick={() => togglePin(note.id)}
                        className="text-terminal-amber hover:text-terminal-amber/80 text-xs"
                        title={note.pinned ? 'Unpin' : 'Pin'}
                      >
                        {note.pinned ? '[UNPIN]' : '[PIN]'}
                      </button>
                      <button
                        onClick={() => handleEditNote(note)}
                        className="text-terminal-cyan hover:text-terminal-cyan/80 text-xs"
                        title="Edit"
                      >
                        [EDIT]
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="text-red-500 hover:text-red-400 text-xs"
                        title="Delete"
                      >
                        [DEL]
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* Quests Tab Content */}
      {activeTab === 'quests' && (
        <div className="flex-grow overflow-y-auto space-y-3 pr-2">
          {quests.length === 0 ? (
            <div className="text-center opacity-50 py-8 italic">
              [NO_ACTIVE_QUESTS]
            </div>
          ) : (
            quests.map((quest) => (
              <div
                key={quest.id}
                className="border border-terminal-green-dim bg-terminal-black/30 p-3"
              >
                {/* Quest Header */}
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-terminal-green-bright">
                    {quest.status === 'completed'
                      ? '✅'
                      : quest.status === 'failed'
                      ? '❌'
                      : '📜'}{' '}
                    {quest.title || quest.name}
                  </h3>
                  <span
                    className={`text-xs uppercase px-2 py-0.5 rounded ${
                      quest.status === 'completed'
                        ? 'bg-green-700 text-green-100'
                        : quest.status === 'failed'
                        ? 'bg-red-700 text-red-100'
                        : 'bg-terminal-amber text-terminal-black'
                    }`}
                  >
                    {quest.status}
                  </span>
                </div>

                {/* Quest Giver */}
                {quest.questGiver && (
                  <div className="text-xs text-terminal-green/60 mb-2">
                    Given by: {quest.questGiver}
                  </div>
                )}

                {/* Description */}
                <p className="text-sm opacity-80 mb-3">{quest.description}</p>

                {/* Objectives */}
                {quest.objectives.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs uppercase text-terminal-green/60 mb-1">
                      Objectives:
                    </div>
                    <div className="space-y-1 pl-2">
                      {quest.objectives.map((obj) => (
                        <div
                          key={obj.id}
                          className={`text-sm flex items-start gap-2 ${
                            obj.completed
                              ? 'text-green-400 line-through opacity-60'
                              : ''
                          }`}
                        >
                          <span className="flex-shrink-0">
                            {obj.completed ? '✓' : '○'}
                          </span>
                          <span className="flex-grow">{obj.description}</span>
                          <span className="text-xs opacity-60">
                            {obj.progress || `${obj.current}/${obj.required}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rewards */}
                {(quest.rewards?.experience ||
                  quest.rewards?.gold ||
                  (quest.rewards?.items && quest.rewards.items.length > 0)) && (
                  <div className="border-t border-terminal-green-dim pt-2 mt-2">
                    <div className="text-xs uppercase text-terminal-green/60 mb-1">
                      Rewards:
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs">
                      {quest.rewards.experience ? (
                        <span className="text-terminal-cyan">
                          ⭐ {quest.rewards.experience} XP
                        </span>
                      ) : null}
                      {quest.rewards.gold ? (
                        <span className="text-terminal-amber">
                          💰 {quest.rewards.gold} gold
                        </span>
                      ) : null}
                      {quest.rewards.items?.map((item, i) => (
                        <span key={i} className="text-terminal-green">
                          📦 {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
