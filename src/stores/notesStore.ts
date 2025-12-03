import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export type NoteCategory = 'general' | 'character' | 'location' | 'lore' | 'session' | 'combat';

export interface Note {
  id: string;
  title: string;
  content: string;
  category: NoteCategory;
  tags: string[];
  author: 'player' | 'ai';
  createdAt: number;
  updatedAt: number;
  // Optional associations
  characterId?: string;
  worldId?: string;
  questId?: string;
  // For pinning important notes
  pinned?: boolean;
}

interface NotesState {
  notes: Note[];
  
  // Actions
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateNote: (id: string, updates: Partial<Omit<Note, 'id' | 'createdAt'>>) => void;
  deleteNote: (id: string) => void;
  togglePin: (id: string) => void;
  
  // Queries
  getNotesByCategory: (category: NoteCategory) => Note[];
  getNotesByCharacter: (characterId: string) => Note[];
  getNotesByWorld: (worldId: string) => Note[];
  getNotesByTag: (tag: string) => Note[];
  searchNotes: (query: string) => Note[];
  
  // Bulk operations
  importNotes: (notes: Note[]) => void;
  clearAllNotes: () => void;
}

export const useNotesStore = create<NotesState>()(
  persist(
    (set, get) => ({
      notes: [],

      addNote: (noteData) => {
        const id = uuidv4();
        const now = Date.now();
        
        const newNote: Note = {
          ...noteData,
          id,
          createdAt: now,
          updatedAt: now,
          tags: noteData.tags || [],
          pinned: noteData.pinned || false,
        };

        set((state) => ({
          notes: [newNote, ...state.notes]
        }));

        console.log('[NotesStore] Added note:', newNote.title, id);
        return id;
      },

      updateNote: (id, updates) => {
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id
              ? { ...note, ...updates, updatedAt: Date.now() }
              : note
          )
        }));
        console.log('[NotesStore] Updated note:', id);
      },

      deleteNote: (id) => {
        set((state) => ({
          notes: state.notes.filter((note) => note.id !== id)
        }));
        console.log('[NotesStore] Deleted note:', id);
      },

      togglePin: (id) => {
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id
              ? { ...note, pinned: !note.pinned, updatedAt: Date.now() }
              : note
          )
        }));
      },

      getNotesByCategory: (category) => {
        return get().notes.filter((note) => note.category === category);
      },

      getNotesByCharacter: (characterId) => {
        return get().notes.filter((note) => note.characterId === characterId);
      },

      getNotesByWorld: (worldId) => {
        return get().notes.filter((note) => note.worldId === worldId);
      },

      getNotesByTag: (tag) => {
        const lowerTag = tag.toLowerCase();
        return get().notes.filter((note) =>
          note.tags.some((t) => t.toLowerCase() === lowerTag)
        );
      },

      searchNotes: (query) => {
        const lowerQuery = query.toLowerCase();
        return get().notes.filter(
          (note) =>
            note.title.toLowerCase().includes(lowerQuery) ||
            note.content.toLowerCase().includes(lowerQuery) ||
            note.tags.some((t) => t.toLowerCase().includes(lowerQuery))
        );
      },

      importNotes: (notes) => {
        set((state) => ({
          notes: [...notes, ...state.notes]
        }));
        console.log('[NotesStore] Imported', notes.length, 'notes');
      },

      clearAllNotes: () => {
        set({ notes: [] });
        console.log('[NotesStore] Cleared all notes');
      },
    }),
    {
      name: 'quest-keeper-notes',
      version: 1,
    }
  )
);

// Helper to get sorted notes (pinned first, then by date)
export function getSortedNotes(notes: Note[]): Note[] {
  return [...notes].sort((a, b) => {
    // Pinned notes first
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    // Then by update date (newest first)
    return b.updatedAt - a.updatedAt;
  });
}

// Category display info
export const CATEGORY_INFO: Record<NoteCategory, { label: string; icon: string; color: string }> = {
  general: { label: 'General', icon: '📝', color: 'text-terminal-green' },
  character: { label: 'Characters', icon: '👤', color: 'text-terminal-cyan' },
  location: { label: 'Locations', icon: '🗺️', color: 'text-terminal-amber' },
  lore: { label: 'Lore', icon: '📜', color: 'text-purple-400' },
  session: { label: 'Session', icon: '🎲', color: 'text-blue-400' },
  combat: { label: 'Combat', icon: '⚔️', color: 'text-red-400' },
};
