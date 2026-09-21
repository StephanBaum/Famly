import React, { useState, useEffect } from 'react';
import { Chore, FamilyMember } from '../../types';
import { ModalPortal } from '../ModalPortal';
import { Sparkles } from 'lucide-react';
import { format } from 'date-fns';

interface CalendarChoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingChore: Chore | null;
  defaultDate?: string;
  members: FamilyMember[];
  onSave: (data: {
    title: string;
    assignedMemberId: string;
    frequency: Chore['frequency'];
    stars: number;
    assignedMemberIds: string[];
    dueDate?: string;
  }) => void;
}

export const CalendarChoreModal: React.FC<CalendarChoreModalProps> = ({
  isOpen,
  onClose,
  editingChore,
  defaultDate,
  members,
  onSave,
}) => {
  const [choreFormTitle, setChoreFormTitle] = useState('');
  const [choreFormAssignees, setChoreFormAssignees] = useState<string[]>([]);
  const [choreFormFrequency, setChoreFormFrequency] = useState<Chore['frequency']>('once');
  const [choreFormStars, setChoreFormStars] = useState(3);
  const [choreFormDate, setChoreFormDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    if (!isOpen) return;

    if (editingChore) {
      setChoreFormTitle(editingChore.title);
      const existingAssignees =
        editingChore.assignedMemberIds && editingChore.assignedMemberIds.length > 0
          ? editingChore.assignedMemberIds
          : editingChore.assignedMemberId
          ? [editingChore.assignedMemberId]
          : [];
      setChoreFormAssignees(existingAssignees);
      setChoreFormFrequency(editingChore.frequency);
      setChoreFormStars(editingChore.stars);
      setChoreFormDate(editingChore.dueDate || format(new Date(), 'yyyy-MM-dd'));
    } else {
      setChoreFormTitle('');
      setChoreFormAssignees([]);
      setChoreFormFrequency('once');
      setChoreFormStars(3);
      setChoreFormDate(defaultDate || format(new Date(), 'yyyy-MM-dd'));
    }
  }, [isOpen, editingChore, defaultDate]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!choreFormTitle.trim()) return;

    onSave({
      title: choreFormTitle.trim(),
      assignedMemberId: choreFormAssignees[0] || '',
      assignedMemberIds: choreFormAssignees,
      frequency: choreFormFrequency,
      stars: Number(choreFormStars),
      dueDate: choreFormDate || undefined,
    });
    onClose();
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-xl border-2 border-stone-200 dark:border-slate-800 animate-in fade-in zoom-in-95 max-h-[92vh] flex flex-col my-auto overflow-hidden">
          <div className="flex items-center justify-between p-5 sm:p-6 pb-3 border-b border-stone-100 dark:border-slate-800 shrink-0">
            <h3 className="text-lg font-black text-stone-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>{editingChore ? 'Aufgabe bearbeiten' : 'Neue Aufgabe anlegen'}</span>
            </h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-slate-800 text-stone-400 hover:text-stone-600 dark:hover:text-white flex items-center justify-center text-sm font-bold transition-colors shrink-0"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 p-5 sm:p-6 pt-4 flex-1 overflow-y-auto scrollbar-thin">
            <div>
              <label className="block text-xs font-bold text-stone-600 dark:text-slate-300 uppercase mb-1">
                Titel der Aufgabe
              </label>
              <input
                type="text"
                placeholder="z.B. Spülmaschine ausräumen, Müll rausbringen, Hasenstall sauber machen"
                value={choreFormTitle}
                onChange={(e) => setChoreFormTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-sm focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-600 dark:text-slate-300 uppercase mb-1">
                  📅 Datum / Fälligkeit
                </label>
                <input
                  type="date"
                  value={choreFormDate}
                  onChange={(e) => setChoreFormDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-600 dark:text-slate-300 uppercase mb-1">
                  Häufigkeit
                </label>
                <select
                  value={choreFormFrequency}
                  onChange={(e) => setChoreFormFrequency(e.target.value as Chore['frequency'])}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-sm focus:outline-none cursor-pointer font-semibold"
                >
                  <option value="once">🎯 Einmalig (Standard)</option>
                  <option value="weekly">🗓️ Wöchentlich</option>
                  <option value="2x_weekly">🔄 2x pro Woche</option>
                  <option value="biweekly">⏳ Alle 2 Wochen</option>
                  <option value="monthly">📅 Monatlich</option>
                  <option value="daily">☀️ Täglich</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-600 dark:text-slate-300 uppercase mb-1">
                Belohnung (Sterne)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={choreFormStars}
                onChange={(e) => setChoreFormStars(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-sm focus:outline-none font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-600 dark:text-slate-300 uppercase mb-1.5">
                Zuständigkeit (Mehrfachauswahl möglich)
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setChoreFormAssignees([])}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    choreFormAssignees.length === 0
                      ? 'bg-amber-100 dark:bg-amber-950 border-amber-500 text-amber-900 dark:text-amber-200 shadow-2xs'
                      : 'bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700 text-stone-600 dark:text-slate-300'
                  }`}
                >
                  🤝 Offen für alle (Wer zuerst kommt)
                </button>
                {members.map((m) => {
                  const isSelected = choreFormAssignees.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setChoreFormAssignees((prev) =>
                          prev.includes(m.id)
                            ? prev.filter((id) => id !== m.id)
                            : [...prev, m.id]
                        );
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
                        isSelected
                          ? 'bg-amber-50 dark:bg-amber-950 border-amber-500 text-amber-800 dark:text-amber-200 shadow-2xs'
                          : 'bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700 text-stone-600 dark:text-slate-300'
                      }`}
                    >
                      <span>{m.avatar}</span>
                      <span>{m.name}</span>
                      {isSelected && <span className="font-bold">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="duo-btn duo-btn-white px-4 py-2 text-xs font-bold rounded-xl"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                className="duo-btn duo-btn-amber px-5 py-2 text-xs font-black rounded-xl"
              >
                {editingChore ? 'Änderungen speichern' : 'Aufgabe anlegen'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
};
