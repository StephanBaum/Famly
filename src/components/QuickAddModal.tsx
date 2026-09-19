import React, { useState } from 'react';
import { useFamily } from '../context/FamilyContext';
import { AppointmentCategory, GroceryCategory } from '../types';
import { Calendar, ShoppingCart, Sparkles, Pin } from 'lucide-react';
import { ModalPortal } from './ModalPortal';
import { format } from 'date-fns';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: 'calendar' | 'meals' | 'photos' | 'lists') => void;
}

type QuickType = 'event' | 'grocery' | 'chore' | 'note';

export const QuickAddModal: React.FC<QuickAddModalProps> = ({ isOpen, onClose }) => {
  const { members, currentMemberId, addAppointment, addGrocery, addChore, addNote, stores } = useFamily();
  const [selectedType, setSelectedType] = useState<QuickType>('event');

  // Event form
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [eventTime, setEventTime] = useState('16:00');
  const [eventCategory, setEventCategory] = useState<AppointmentCategory>('family');

  // Grocery form
  const [groceryName, setGroceryName] = useState('');
  const [groceryAmount, setGroceryAmount] = useState('');
  const [groceryStore, setGroceryStore] = useState('Rewe');
  const [groceryCat] = useState<GroceryCategory>('produce');

  // Chore form
  const [choreTitle, setChoreTitle] = useState('');
  const [choreMember, setChoreMember] = useState(members[2]?.id || members[0]?.id || 'm1');

  // Note form
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedType === 'event') {
      if (!eventTitle.trim()) return;
      addAppointment({
        title: eventTitle.trim(),
        date: eventDate,
        time: eventTime,
        category: eventCategory,
        memberIds: currentMemberId === 'all' ? [members[0]?.id || 'm1'] : [currentMemberId],
      });
    } else if (selectedType === 'grocery') {
      if (!groceryName.trim()) return;
      addGrocery(groceryName.trim(), groceryStore, groceryAmount.trim() || undefined, groceryCat);
    } else if (selectedType === 'chore') {
      if (!choreTitle.trim()) return;
      addChore(choreTitle.trim(), choreMember, 'daily', 3);
    } else if (selectedType === 'note') {
      if (!noteTitle.trim() || !noteContent.trim()) return;
      addNote(noteTitle.trim(), noteContent.trim(), 'info', true);
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-xl border-2 border-stone-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between mb-4 border-b border-stone-100 dark:border-slate-800 pb-3">
          <h3 className="text-lg font-black text-stone-900 dark:text-white">Schnell hinzufügen</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 dark:hover:text-white text-sm font-bold">
            ✕
          </button>
        </div>

        {/* Type Picker Tabs */}
        <div className="grid grid-cols-4 gap-1.5 p-1 bg-stone-100 dark:bg-slate-800 rounded-2xl mb-4">
          <button
            type="button"
            onClick={() => setSelectedType('event')}
            className={`py-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all ${
              selectedType === 'event' ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-2xs' : 'text-stone-600 dark:text-slate-400'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Termin</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedType('grocery')}
            className={`py-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all ${
              selectedType === 'grocery' ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-2xs' : 'text-stone-600 dark:text-slate-400'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Einkauf</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedType('chore')}
            className={`py-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all ${
              selectedType === 'chore' ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-300 shadow-2xs' : 'text-stone-600 dark:text-slate-400'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Aufgabe</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedType('note')}
            className={`py-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all ${
              selectedType === 'note' ? 'bg-white dark:bg-slate-700 text-rose-700 dark:text-rose-300 shadow-2xs' : 'text-stone-600 dark:text-slate-400'
            }`}
          >
            <Pin className="w-3.5 h-3.5" />
            <span>Notiz</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {selectedType === 'event' && (
            <>
              <div>
                <label className="block text-xs font-bold text-stone-600 dark:text-slate-300 uppercase mb-1">Titel</label>
                <input
                  type="text"
                  placeholder="z.B. Zahnarztbesuch, Fußballtraining"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-sm focus:outline-none"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-sm focus:outline-none"
                  required
                />
                <input
                  type="time"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-sm focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-600 dark:text-slate-300 uppercase mb-1">Kategorie</label>
                <select
                  value={eventCategory}
                  onChange={(e) => setEventCategory(e.target.value as AppointmentCategory)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-sm focus:outline-none"
                >
                  <option value="family">🎉 Familienausflug</option>
                  <option value="sports">⚽ Sport & Vereine</option>
                  <option value="school">🎒 Schule & Kita</option>
                  <option value="health">🩺 Arzt & Gesundheit</option>
                  <option value="work">💼 Arbeit & Erledigung</option>
                  <option value="social">☕ Freunde & Treffen</option>
                </select>
              </div>
            </>
          )}

          {selectedType === 'grocery' && (
            <>
              <div>
                <label className="block text-xs font-bold text-stone-600 dark:text-slate-300 uppercase mb-1">Artikel</label>
                <input
                  type="text"
                  placeholder="z.B. Sauerteigbrot, Hafermilch"
                  value={groceryName}
                  onChange={(e) => setGroceryName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-sm focus:outline-none"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Menge (z.B. 2x, 500g)"
                  value={groceryAmount}
                  onChange={(e) => setGroceryAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-sm focus:outline-none"
                />
                <select
                  value={groceryStore}
                  onChange={(e) => setGroceryStore(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-sm focus:outline-none font-bold"
                >
                  {stores.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.icon} {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {selectedType === 'chore' && (
            <>
              <div>
                <label className="block text-xs font-bold text-stone-600 dark:text-slate-300 uppercase mb-1">Aufgabe</label>
                <input
                  type="text"
                  placeholder="z.B. Hund ausführen, Zimmer aufräumen"
                  value={choreTitle}
                  onChange={(e) => setChoreTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-sm focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-600 dark:text-slate-300 uppercase mb-1">Zuweisen an</label>
                <select
                  value={choreMember}
                  onChange={(e) => setChoreMember(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-sm focus:outline-none"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.avatar} {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {selectedType === 'note' && (
            <>
              <div>
                <label className="block text-xs font-bold text-stone-600 dark:text-slate-300 uppercase mb-1">Titel</label>
                <input
                  type="text"
                  placeholder="z.B. WLAN-Code, Gutschein"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-sm focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-600 dark:text-slate-300 uppercase mb-1">Inhalt</label>
                <textarea
                  rows={2}
                  placeholder="Notiz-Details..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-sm focus:outline-none"
                  required
                />
              </div>
            </>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="duo-btn duo-btn-white px-4 py-2 text-xs font-bold rounded-xl"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="duo-btn duo-btn-green px-5 py-2 text-xs font-black rounded-xl"
            >
              Jetzt hinzufügen
            </button>
          </div>
        </form>
      </div>
    </div>
    </ModalPortal>
  );
};
