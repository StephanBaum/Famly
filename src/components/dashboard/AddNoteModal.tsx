import React, { useState } from 'react';
import { ModalPortal } from '../ModalPortal';

interface AddNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddNote: (title: string, content: string, tag: 'urgent' | 'info' | 'fun' | 'wifi') => void;
}

export const AddNoteModal: React.FC<AddNoteModalProps> = ({
  isOpen,
  onClose,
  onAddNote,
}) => {
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteTag, setNoteTag] = useState<'urgent' | 'info' | 'fun' | 'wifi'>('info');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteContent.trim()) return;
    onAddNote(noteTitle.trim(), noteContent.trim(), noteTag);
    setNoteTitle('');
    setNoteContent('');
    onClose();
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-xl border-2 border-stone-200 dark:border-slate-800 animate-in fade-in zoom-in-95 my-auto overflow-hidden">
          <div className="flex items-center justify-between mb-4 border-b border-stone-100 dark:border-slate-800 pb-3">
            <h3 className="text-lg font-black text-stone-900 dark:text-white">Notiz anheften</h3>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-slate-800 text-stone-400 hover:text-stone-600 dark:hover:text-white flex items-center justify-center text-sm font-bold transition-colors shrink-0"
            >
              ✕
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-extrabold text-stone-600 dark:text-slate-300 uppercase mb-1">
                Titel
              </label>
              <input
                type="text"
                placeholder="z.B. Babysitter-Telefon, WLAN-Passwort"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-sm focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-stone-600 dark:text-slate-300 uppercase mb-1">
                Kategorie
              </label>
              <div className="grid grid-cols-4 gap-2">
                {([
                  { tag: 'info', label: 'Info' },
                  { tag: 'urgent', label: 'Wichtig' },
                  { tag: 'wifi', label: 'WLAN' },
                  { tag: 'fun', label: 'Spaß' },
                ] as const).map(({ tag, label }) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setNoteTag(tag)}
                    className={`duo-btn py-1.5 text-xs font-black rounded-xl ${
                      noteTag === tag ? 'duo-btn-rose' : 'duo-btn-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-stone-600 dark:text-slate-300 uppercase mb-1">
                Details
              </label>
              <textarea
                rows={3}
                placeholder="Nachricht oder Notiz hier eingeben..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-sm focus:outline-none"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="duo-btn duo-btn-white px-4 py-2 text-xs font-bold rounded-xl"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                className="duo-btn duo-btn-rose px-5 py-2 text-xs font-black rounded-xl"
              >
                Notiz anheften
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
};
