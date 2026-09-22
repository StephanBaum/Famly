import { useState, useEffect } from 'react';
import { PinnedNote } from '../../types';
import { STORAGE_KEYS, getStoredOrDefault } from '../storageKeys';

interface UseNotesSliceOptions {
  currentMemberId: string | 'all';
  fallbackMemberId?: string;
}

export function useNotesSlice({
  currentMemberId,
  fallbackMemberId,
}: UseNotesSliceOptions) {
  const [notes, setNotes] = useState<PinnedNote[]>(() => {
    const stored = getStoredOrDefault<PinnedNote[] | null>(STORAGE_KEYS.NOTES, null);
    if (stored !== null) return stored;
    return [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
  }, [notes]);

  const addNote = (title: string, content: string, tag: PinnedNote['tag'], isPinned = false) => {
    const newNote: PinnedNote = {
      id: `n_${Date.now()}`,
      title,
      content,
      tag,
      isPinned,
      authorMemberId: currentMemberId === 'all' ? (fallbackMemberId || 'm1') : currentMemberId,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setNotes((prev) => [newNote, ...prev]);
  };

  const deleteNote = (id: string) => {
    setNotes((prev) => prev.filter((note) => note.id !== id));
  };

  return {
    notes,
    setNotes,
    addNote,
    deleteNote,
  };
}
