import React, { useState, useMemo, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useFamily } from '../context/FamilyContext';
import { AppointmentCategory, GroceryCategory } from '../types';
import {
  Calendar,
  ShoppingCart,
  Sparkles,
  Pin,
  Mic,
  MicOff,
  Wand2,
  Trash2,
  Check,
} from 'lucide-react';
import { ModalPortal } from './ModalPortal';
import { VoiceInputModal } from './VoiceInputModal';
import { parseUniversalInput } from '../utils/universalParser';
import { format } from 'date-fns';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: 'calendar' | 'meals' | 'photos' | 'lists') => void;
}

type QuickType = 'smart' | 'event' | 'grocery' | 'chore' | 'note';

export const QuickAddModal: React.FC<QuickAddModalProps> = ({ isOpen, onClose }) => {
  const { members, currentMemberId, addAppointment, addGrocery, addChore, addNote, stores } = useFamily();
  const [selectedType, setSelectedType] = useState<QuickType>('smart');
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  // Smart Universal Input state
  const [smartText, setSmartText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Manual exclusions from the parsed set if user taps delete on a preview item
  const [excludedIds, setExcludedIds] = useState<string[]>([]);

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

  // Setup Web Speech API for inline recording in Smart tab
  useEffect(() => {
    if (!isOpen && isRecording) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsRecording(false);
    }
  }, [isOpen, isRecording]);

  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Spracherkennung wird in diesem Browser leider nicht unterstützt.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'de-DE';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => setIsRecording(true);

      recognition.onresult = (event: any) => {
        let currentText = '';
        for (let i = 0; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript + ' ';
        }
        setSmartText(currentText.trim());
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognition.onend = () => setIsRecording(false);

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Speech recognition start failed:', err);
      setIsRecording(false);
    }
  };

  // Compute live parse result
  const rawParsed = useMemo(() => {
    if (selectedType !== 'smart' || !smartText.trim()) {
      return { appointments: [], chores: [], groceries: [] };
    }
    return parseUniversalInput(smartText, members, stores);
  }, [selectedType, smartText, members, stores]);

  const parsedData = useMemo(() => {
    return {
      appointments: rawParsed.appointments.filter((a) => !excludedIds.includes(a.id)),
      chores: rawParsed.chores.filter((c) => !excludedIds.includes(c.id)),
      groceries: rawParsed.groceries.filter((g) => !excludedIds.includes(g.id)),
    };
  }, [rawParsed, excludedIds]);

  const totalParsedCount =
    parsedData.appointments.length + parsedData.chores.length + parsedData.groceries.length;

  if (!isOpen) return null;

  const handleSmartSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (totalParsedCount === 0) return;

    // Add appointments
    parsedData.appointments.forEach((app) => {
      addAppointment({
        title: app.title,
        date: app.date,
        time: app.time,
        category: app.category,
        memberIds: app.memberIds,
      });
    });

    // Add chores
    parsedData.chores.forEach((chore) => {
      addChore(
        chore.title,
        chore.assignedMemberId,
        chore.frequency,
        chore.stars,
        chore.assignedMemberIds,
        chore.dueDate
      );
    });

    // Add groceries
    parsedData.groceries.forEach((g) => {
      addGrocery(g.name, g.store, g.amount, g.category);
    });

    // Celebration
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
    });

    setSmartText('');
    setExcludedIds([]);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedType === 'smart') {
      handleSmartSubmit(e);
      return;
    }

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
      addChore(choreTitle.trim(), choreMember, 'once', 3);
    } else if (selectedType === 'note') {
      if (!noteTitle.trim() || !noteContent.trim()) return;
      addNote(noteTitle.trim(), noteContent.trim(), 'info', true);
    }

    onClose();
  };

  const handleVoiceAdd = (items: Array<{ name: string; category: GroceryCategory }>) => {
    items.forEach((item) => {
      addGrocery(item.name, groceryStore, undefined, item.category);
    });
    setIsVoiceModalOpen(false);
    onClose();
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-xl border-2 border-stone-200 dark:border-slate-800 animate-in fade-in zoom-in-95 my-auto max-h-[92vh] flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-3 border-b border-stone-100 dark:border-slate-800 pb-3 shrink-0">
            <h3 className="text-lg font-black text-stone-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>Schnell hinzufügen</span>
            </h3>
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-stone-600 dark:hover:text-white text-sm font-bold"
            >
              ✕
            </button>
          </div>

          {/* Type Picker Tabs */}
          <div className="grid grid-cols-5 gap-1 p-1 bg-stone-100 dark:bg-slate-800 rounded-2xl mb-4 shrink-0">
            <button
              type="button"
              onClick={() => setSelectedType('smart')}
              className={`py-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                selectedType === 'smart'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-2xs'
                  : 'text-stone-600 dark:text-slate-400 hover:text-stone-900'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Smart KI</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedType('event')}
              className={`py-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                selectedType === 'event'
                  ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-2xs'
                  : 'text-stone-600 dark:text-slate-400'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Termin</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedType('grocery')}
              className={`py-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                selectedType === 'grocery'
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-2xs'
                  : 'text-stone-600 dark:text-slate-400'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Einkauf</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedType('chore')}
              className={`py-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                selectedType === 'chore'
                  ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-300 shadow-2xs'
                  : 'text-stone-600 dark:text-slate-400'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Aufgabe</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedType('note')}
              className={`py-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                selectedType === 'note'
                  ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-2xs'
                  : 'text-stone-600 dark:text-slate-400'
              }`}
            >
              <Pin className="w-3.5 h-3.5" />
              <span>Notiz</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 flex-1 overflow-y-auto scrollbar-thin pr-1">
            {/* SMART UNIVERSAL INPUT TAB */}
            {selectedType === 'smart' && (
              <div className="space-y-3">
                <div className="relative">
                  <textarea
                    rows={3}
                    placeholder="Sprechen oder tippen wie im echten Leben:&#10;„Morgen um 15 Uhr Zahnarzt für Sophie, Spülmaschine ausräumen für Leo, und Milch & Eier bei Rewe“"
                    value={smartText}
                    onChange={(e) => {
                      setSmartText(e.target.value);
                      setExcludedIds([]);
                    }}
                    className="w-full p-3.5 pr-12 rounded-2xl border-2 border-stone-200 dark:border-slate-700 bg-stone-50/50 dark:bg-slate-800 text-stone-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={toggleRecording}
                    className={`absolute right-3 top-3 w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                      isRecording
                        ? 'bg-rose-500 text-white animate-pulse'
                        : 'bg-stone-200 dark:bg-slate-700 text-stone-600 dark:text-slate-300 hover:bg-stone-300'
                    }`}
                    title={isRecording ? 'Aufnahme stoppen' : 'Spracheingabe starten'}
                  >
                    {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                </div>

                {/* Quick chip suggestions */}
                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className="text-[11px] font-bold text-stone-400 dark:text-slate-500">Beispiele:</span>
                  <button
                    type="button"
                    onClick={() => setSmartText('Morgen um 16 Uhr Fußballtraining für Leo')}
                    className="px-2 py-0.5 rounded-lg bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300 text-[11px] font-medium hover:bg-stone-200"
                  >
                    ⚽ Leo Training
                  </button>
                  <button
                    type="button"
                    onClick={() => setSmartText('Zimmer aufräumen für Sophie und Spülmaschine für Papa')}
                    className="px-2 py-0.5 rounded-lg bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300 text-[11px] font-medium hover:bg-stone-200"
                  >
                    ⭐ Chores
                  </button>
                  <button
                    type="button"
                    onClick={() => setSmartText('Milch, Bio-Eier und Butter bei Rewe')}
                    className="px-2 py-0.5 rounded-lg bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300 text-[11px] font-medium hover:bg-stone-200"
                  >
                    🛒 Einkauf
                  </button>
                </div>

                {/* Live Preview of Parsed Items */}
                {totalParsedCount > 0 && (
                  <div className="p-3 bg-stone-50 dark:bg-slate-800/80 rounded-2xl border border-stone-200 dark:border-slate-700 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-black text-stone-700 dark:text-slate-300">
                      <span>Erkannte Einträge ({totalParsedCount})</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px] flex items-center gap-1">
                        <Check className="w-3 h-3" /> Bereit zum Übernehmen
                      </span>
                    </div>

                    <div className="space-y-1.5 max-h-[160px] overflow-y-auto scrollbar-none">
                      {/* Appointments */}
                      {parsedData.appointments.map((app) => (
                        <div
                          key={app.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-xs font-bold text-blue-900 dark:text-blue-200"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span>📅</span>
                            <span className="truncate">{app.title}</span>
                            <span className="text-[10px] opacity-75 shrink-0">
                              ({app.date} • {app.time})
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setExcludedIds((prev) => [...prev, app.id])}
                            className="p-1 text-stone-400 hover:text-rose-600 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}

                      {/* Chores */}
                      {parsedData.chores.map((chore) => (
                        <div
                          key={chore.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-xs font-bold text-amber-900 dark:text-amber-200"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span>⭐</span>
                            <span className="truncate">{chore.title}</span>
                            <span className="text-[10px] opacity-75 shrink-0">
                              ({members.find((m) => m.id === chore.assignedMemberId)?.name || 'Offen'} • +{chore.stars}★)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setExcludedIds((prev) => [...prev, chore.id])}
                            className="p-1 text-stone-400 hover:text-rose-600 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}

                      {/* Groceries */}
                      {parsedData.groceries.map((g) => (
                        <div
                          key={g.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-900 dark:text-emerald-200"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span>🛒</span>
                            <span className="truncate">
                              {g.amount ? `${g.amount} ` : ''}
                              {g.name}
                            </span>
                            <span className="text-[10px] opacity-75 shrink-0">
                              ({g.store})
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setExcludedIds((prev) => [...prev, g.id])}
                            className="p-1 text-stone-400 hover:text-rose-600 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* EVENT TAB */}
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

            {/* GROCERY TAB */}
            {selectedType === 'grocery' && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-stone-600 dark:text-slate-300 uppercase">Artikel</label>
                    <button
                      type="button"
                      onClick={() => setIsVoiceModalOpen(true)}
                      className="text-xs font-black text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Mic className="w-3 h-3" />
                      <span>Per Sprache diktieren</span>
                    </button>
                  </div>
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

            {/* CHORE TAB */}
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

            {/* NOTE TAB */}
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

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100 dark:border-slate-800 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="duo-btn duo-btn-white px-4 py-2 text-xs font-bold rounded-xl"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={selectedType === 'smart' && totalParsedCount === 0}
                className="duo-btn duo-btn-green px-5 py-2 text-xs font-black rounded-xl disabled:opacity-40"
              >
                {selectedType === 'smart'
                  ? totalParsedCount > 0
                    ? `✨ Alles übernehmen (${totalParsedCount})`
                    : 'Smart übernehmen'
                  : 'Jetzt hinzufügen'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Voice Dictation Modal */}
      <VoiceInputModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onAddItems={handleVoiceAdd}
      />
    </ModalPortal>
  );
};
