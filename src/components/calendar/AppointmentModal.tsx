import React, { useState, useEffect } from 'react';
import { Appointment, AppointmentCategory, FamilyMember, RecurrenceFrequency } from '../../types';
import { ModalPortal } from '../ModalPortal';
import { CATEGORY_CONFIG } from './calendarConstants';
import { Repeat } from 'lucide-react';
import { format } from 'date-fns';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingAppointment: Appointment | null;
  defaultDate?: string;
  members: FamilyMember[];
  currentMemberId: string | 'all';
  loggedInMemberId?: string | null;
  onSave: (payload: Omit<Appointment, 'id'>) => void;
}

export const AppointmentModal: React.FC<AppointmentModalProps> = ({
  isOpen,
  onClose,
  editingAppointment,
  defaultDate,
  members,
  currentMemberId,
  loggedInMemberId,
  onSave,
}) => {
  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [formTime, setFormTime] = useState('14:00');
  const [formDuration, setFormDuration] = useState(60);
  const [formLocation, setFormLocation] = useState('');
  const [formCategory, setFormCategory] = useState<AppointmentCategory>('family');
  const [formMembers, setFormMembers] = useState<string[]>([]);
  const [formNotes, setFormNotes] = useState('');
  const [formRecurrence, setFormRecurrence] = useState<RecurrenceFrequency>('none');
  const [formRecurrenceDays, setFormRecurrenceDays] = useState<number[]>([]);
  const [formRecurrenceEndDate, setFormRecurrenceEndDate] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;

    if (editingAppointment) {
      setFormTitle(editingAppointment.title);
      setFormDate(editingAppointment.date);
      setFormTime(editingAppointment.time);
      setFormDuration(editingAppointment.durationMinutes || 60);
      setFormLocation(editingAppointment.location || '');
      setFormCategory(editingAppointment.category);
      setFormMembers(editingAppointment.memberIds);
      setFormNotes(editingAppointment.notes || '');
      setFormRecurrence(editingAppointment.recurrence || 'none');
      setFormRecurrenceDays(editingAppointment.recurrenceDays || []);
      setFormRecurrenceEndDate(editingAppointment.recurrenceEndDate || '');
    } else {
      setFormTitle('');
      setFormDate(defaultDate || format(new Date(), 'yyyy-MM-dd'));
      setFormTime('15:00');
      setFormDuration(60);
      setFormLocation('');
      setFormCategory('family');
      // Default to the currently logged in person (the creator), or filtered member, NOT always members[0]
      const defaultMemberId =
        (loggedInMemberId && members.some((m) => m.id === loggedInMemberId))
          ? loggedInMemberId
          : (currentMemberId !== 'all' && members.some((m) => m.id === currentMemberId))
            ? currentMemberId
            : (members[0]?.id || 'm1');
      setFormMembers([defaultMemberId]);
      setFormNotes('');
      setFormRecurrence('none');
      setFormRecurrenceDays([]);
      setFormRecurrenceEndDate('');
    }
  }, [isOpen, editingAppointment, defaultDate, currentMemberId, loggedInMemberId, members]);

  if (!isOpen) return null;

  const toggleMemberInForm = (id: string) => {
    setFormMembers((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || formMembers.length === 0) return;

    onSave({
      title: formTitle.trim(),
      date: formDate,
      time: formTime,
      durationMinutes: Number(formDuration),
      location: formLocation.trim() || undefined,
      category: formCategory,
      memberIds: formMembers,
      notes: formNotes.trim() || undefined,
      recurrence: formRecurrence !== 'none' ? formRecurrence : undefined,
      recurrenceDays:
        (formRecurrence === 'weekly' || formRecurrence === 'biweekly') && formRecurrenceDays.length > 0
          ? formRecurrenceDays
          : undefined,
      recurrenceEndDate: formRecurrence !== 'none' && formRecurrenceEndDate ? formRecurrenceEndDate : undefined,
    });
    onClose();
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-xl border-2 border-stone-200 dark:border-slate-800 animate-in fade-in zoom-in-95 max-h-[92vh] flex flex-col my-auto overflow-hidden">
          <div className="flex items-center justify-between p-5 sm:p-6 pb-3 border-b border-stone-100 dark:border-slate-800 shrink-0">
            <h3 className="text-lg font-black text-stone-900 dark:text-white">
              {editingAppointment ? 'Termin bearbeiten' : 'Neuer Termin'}
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
                Titel
              </label>
              <input
                type="text"
                placeholder="z.B. Leo Fußballturnier, Zahnarztkontrolle, Klavier"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-sm focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-600 dark:text-slate-300 uppercase mb-1">
                  Datum
                </label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-sm focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-600 dark:text-slate-300 uppercase mb-1">
                  Uhrzeit
                </label>
                <input
                  type="time"
                  value={formTime}
                  onChange={(e) => setFormTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-sm focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-600 dark:text-slate-300 uppercase mb-1">
                  Dauer (Minuten)
                </label>
                <input
                  type="number"
                  min="15"
                  step="15"
                  value={formDuration}
                  onChange={(e) => setFormDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-600 dark:text-slate-300 uppercase mb-1">
                  Kategorie
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as AppointmentCategory)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-sm focus:outline-none"
                >
                  {Object.entries(CATEGORY_CONFIG).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.icon} {v.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-600 dark:text-slate-300 uppercase mb-1">
                Ort (optional)
              </label>
              <input
                type="text"
                placeholder="z.B. Sportplatz West, Zahnarztpraxis Dr. Schmidt"
                value={formLocation}
                onChange={(e) => setFormLocation(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-sm focus:outline-none"
              />
            </div>

            {/* Wiederholung */}
            <div className="p-3 bg-stone-50 dark:bg-slate-800/60 rounded-2xl border border-stone-200 dark:border-slate-700 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-600 dark:text-slate-300 uppercase mb-1 flex items-center gap-1">
                    <Repeat className="w-3.5 h-3.5 text-blue-500" />
                    <span>Wiederholung</span>
                  </label>
                  <select
                    value={formRecurrence}
                    onChange={(e) => setFormRecurrence(e.target.value as RecurrenceFrequency)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-sm focus:outline-none"
                  >
                    <option value="none">Einmalig</option>
                    <option value="daily">Täglich</option>
                    <option value="weekly">Wöchentlich</option>
                    <option value="biweekly">Alle 2 Wochen</option>
                    <option value="monthly">Monatlich</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-600 dark:text-slate-300 uppercase mb-1">
                    Wiederholen bis (optional)
                  </label>
                  <input
                    type="date"
                    value={formRecurrenceEndDate}
                    onChange={(e) => setFormRecurrenceEndDate(e.target.value)}
                    disabled={formRecurrence === 'none'}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-sm focus:outline-none disabled:opacity-50"
                  />
                </div>
              </div>

              {(formRecurrence === 'weekly' || formRecurrence === 'biweekly') && (
                <div>
                  <label className="block text-[11px] font-bold text-stone-500 dark:text-slate-400 mb-1">
                    An folgenden Wochentagen wiederholen:
                  </label>
                  <div className="grid grid-cols-7 gap-1">
                    {[
                      { dayNum: 1, label: 'Mo' },
                      { dayNum: 2, label: 'Di' },
                      { dayNum: 3, label: 'Mi' },
                      { dayNum: 4, label: 'Do' },
                      { dayNum: 5, label: 'Fr' },
                      { dayNum: 6, label: 'Sa' },
                      { dayNum: 0, label: 'So' },
                    ].map(({ dayNum, label }) => {
                      const isDaySelected = formRecurrenceDays.includes(dayNum);
                      return (
                        <button
                          key={dayNum}
                          type="button"
                          onClick={() => {
                            setFormRecurrenceDays((prev) =>
                              prev.includes(dayNum)
                                ? prev.filter((d) => d !== dayNum)
                                : [...prev, dayNum]
                            );
                          }}
                          className={`py-1.5 rounded-lg text-xs font-bold transition-all border ${
                            isDaySelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                              : 'bg-white dark:bg-slate-700 text-stone-600 dark:text-slate-300 border-stone-200 dark:border-slate-600 hover:bg-stone-100'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Multi-member Selection */}
            <div>
              <label className="block text-xs font-bold text-stone-600 dark:text-slate-300 uppercase mb-1.5">
                Teilnehmende Personen (Mehrfachauswahl)
              </label>
              <div className="flex flex-wrap gap-2">
                {members.map((m) => {
                  const isSelected = formMembers.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleMemberInForm(m.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-950 border-blue-500 text-blue-700 dark:text-blue-300 shadow-2xs'
                          : 'bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700 text-stone-600 dark:text-slate-300 hover:bg-stone-50'
                      }`}
                    >
                      <span>{m.avatar}</span>
                      <span>{m.name}</span>
                      {isSelected && <span className="font-bold">✓</span>}
                    </button>
                  );
                })}
              </div>
              {formMembers.length === 0 && (
                <p className="text-[11px] text-rose-500 mt-1">Bitte mindestens ein Familienmitglied auswählen.</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-600 dark:text-slate-300 uppercase mb-1">
                Notizen & Details (optional)
              </label>
              <textarea
                rows={2}
                placeholder="z.B. Trinkflasche mitnehmen, Papa holt ab..."
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-sm focus:outline-none"
              />
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
                disabled={formMembers.length === 0}
                className="duo-btn duo-btn-blue px-5 py-2 text-xs font-black rounded-xl disabled:opacity-50"
              >
                {editingAppointment ? 'Änderungen speichern' : 'Termin anlegen'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
};
