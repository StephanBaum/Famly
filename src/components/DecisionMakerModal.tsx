import React, { useState, useMemo } from 'react';
import { useFamily } from '../context/FamilyContext';
import { ModalPortal } from './ModalPortal';
import {
  decideMeal,
  decideChoreAssignee,
  decideActivity,
  decideCustom,
  DecisionResult,
} from '../services/decisionService';
import { Scale, Sparkles, Utensils, CheckCircle2, Compass, Check, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

interface DecisionMakerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'dinner' | 'chores' | 'activity' | 'custom';
}

const DEFAULT_ACTIVITIES = [
  { title: 'Abenteuerspielplatz & Picknick', isOutdoor: true, durationHours: 2.5, costLevel: 'free' as const },
  { title: 'Naturkundemuseum & Planetarium', isOutdoor: false, durationHours: 3, costLevel: 'low' as const },
  { title: 'Familien-Fahrradtour zum See', isOutdoor: true, durationHours: 2, costLevel: 'free' as const },
  { title: 'Hallenbad / Erlebnisbad', isOutdoor: false, durationHours: 3.5, costLevel: 'high' as const },
  { title: 'Gemütlicher Brettspiel-Nachmittag', isOutdoor: false, durationHours: 2, costLevel: 'free' as const },
];

export const DecisionMakerModal: React.FC<DecisionMakerModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'dinner',
}) => {
  const {
    recipes,
    members,
    chores,
    appointments,
    setMealSlot,
    updateChore,
  } = useFamily();

  const [activeTab, setActiveTab] = useState<'dinner' | 'chores' | 'activity' | 'custom'>(initialMode);
  const [selectedChoreId, setSelectedChoreId] = useState<string>('');
  const [maxDinnerPrepTime, setMaxDinnerPrepTime] = useState<number>(30);
  const [customQuestion, setCustomQuestion] = useState<string>('Welchen Film schauen wir heute Abend?');
  const [customOptionsText, setCustomOptionsText] = useState<string>('Der König der Löwen\nPaddington 2\nFindet Nemo');
  const [appliedNotice, setAppliedNotice] = useState<string | null>(null);

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todaysAppointments = appointments.filter((a) => a.date === todayStr);

  // Compute decision result dynamically based on active tab
  const decisionResult: DecisionResult = useMemo(() => {
    if (activeTab === 'dinner') {
      const candidates = recipes.slice(0, 6);
      return decideMeal(candidates, ['Nudeln', 'Tomaten', 'Käse', 'Eier'], todaysAppointments, maxDinnerPrepTime);
    }

    if (activeTab === 'chores') {
      const targetChore = chores.find((c) => c.id === selectedChoreId) || chores[0];
      if (!targetChore) {
        return decideCustom('Keine Aufgaben vorhanden', ['Neue Aufgabe anlegen']);
      }
      return decideChoreAssignee(targetChore, members, todaysAppointments);
    }

    if (activeTab === 'activity') {
      return decideActivity(DEFAULT_ACTIVITIES, 'Bewölkt mit etwas Sonne', false, 20);
    }

    // Custom
    const lines = customOptionsText.split('\n').map((s) => s.trim()).filter(Boolean);
    return decideCustom(customQuestion, lines);
  }, [activeTab, recipes, chores, selectedChoreId, members, todaysAppointments, maxDinnerPrepTime, customQuestion, customOptionsText]);

  if (!isOpen) return null;

  const handleApplyWinner = () => {
    if (activeTab === 'dinner' && decisionResult.winner.payload) {
      const recipe = decisionResult.winner.payload;
      setMealSlot(todayStr, 'dinner', {
        title: recipe.title,
        recipeId: recipe.id,
      });
      setAppliedNotice(`"${recipe.title}" wurde direkt als heutiges Abendessen eingetragen! 🍽️`);
      setTimeout(() => setAppliedNotice(null), 4000);
    } else if (activeTab === 'chores') {
      const targetChore = chores.find((c) => c.id === selectedChoreId) || chores[0];
      const member = decisionResult.winner.payload;
      if (targetChore && member) {
        updateChore(targetChore.id, {
          assignedMemberId: member.id,
        });
        setAppliedNotice(`Aufgabe "${targetChore.title}" wurde ${member.name} zugewiesen! ✅`);
        setTimeout(() => setAppliedNotice(null), 4000);
      }
    } else {
      setAppliedNotice(`Entscheidung "${decisionResult.winner.title}" angenommen! 🚀`);
      setTimeout(() => setAppliedNotice(null), 4000);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full shadow-2xl border-2 border-stone-200 dark:border-slate-800 animate-in fade-in zoom-in-95 max-h-[92vh] flex flex-col my-auto overflow-hidden">
          
          {/* Modal Header */}
          <div className="p-4 sm:p-5 border-b border-stone-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-stone-50/50 dark:bg-slate-800/40">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black text-stone-900 dark:text-white">
                    Familienrat & Entscheidungs-Finder
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-black border border-indigo-200 dark:border-indigo-800">
                    Open-Jev
                  </span>
                </div>
                <p className="text-xs text-stone-500 dark:text-slate-400">
                  Blitzschnelle, objektive Familien-Entscheidungen ohne Diskussionen
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-slate-800 text-stone-400 hover:text-stone-600 dark:hover:text-white flex items-center justify-center text-sm font-bold transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Mode Selector Tabs */}
          <div className="flex items-center gap-1.5 p-2.5 sm:p-3 bg-stone-100/70 dark:bg-slate-800/80 border-b border-stone-200/60 dark:border-slate-700 overflow-x-auto scrollbar-none shrink-0">
            <button
              onClick={() => setActiveTab('dinner')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'dinner'
                  ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-stone-600 dark:text-slate-400 hover:text-stone-900'
              }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>🥕 Was kochen?</span>
            </button>
            <button
              onClick={() => setActiveTab('chores')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'chores'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-stone-600 dark:text-slate-400 hover:text-stone-900'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>🧹 Wer ist dran?</span>
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'activity'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-stone-600 dark:text-slate-400 hover:text-stone-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>☀️ Ausflug & Freizeit</span>
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'custom'
                  ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                  : 'text-stone-600 dark:text-slate-400 hover:text-stone-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>🎲 Freie Wahl</span>
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-4 sm:p-6 space-y-4 flex-1 overflow-y-auto scrollbar-thin">
            {appliedNotice && (
              <div className="p-3 rounded-2xl bg-emerald-600 text-white text-xs font-bold shadow-md flex items-center gap-2 animate-in fade-in">
                <Check className="w-4 h-4 shrink-0" />
                <span>{appliedNotice}</span>
              </div>
            )}

            {/* Context Inputs based on tab */}
            {activeTab === 'dinner' && (
              <div className="flex items-center justify-between gap-3 p-3 bg-amber-50/60 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-800/40 text-xs">
                <span className="font-bold text-amber-900 dark:text-amber-200">
                  Max. Zubereitungszeit heute:
                </span>
                <div className="flex items-center gap-1">
                  {[15, 30, 45].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => setMaxDinnerPrepTime(mins)}
                      className={`px-2.5 py-1 rounded-lg font-black transition-all ${
                        maxDinnerPrepTime === mins
                          ? 'bg-amber-500 text-white shadow-2xs'
                          : 'bg-white dark:bg-slate-800 text-stone-600 dark:text-slate-300'
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'chores' && chores.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-stone-600 dark:text-slate-300 uppercase mb-1">
                  Zu vergebende Aufgabe auswählen:
                </label>
                <select
                  value={selectedChoreId || chores[0]?.id}
                  onChange={(e) => setSelectedChoreId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-xs font-bold focus:outline-none"
                >
                  {chores.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} (+{c.stars}★)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {activeTab === 'custom' && (
              <div className="space-y-2.5">
                <input
                  type="text"
                  value={customQuestion}
                  onChange={(e) => setCustomQuestion(e.target.value)}
                  placeholder="Frage eingeben..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-xs font-bold focus:outline-none"
                />
                <textarea
                  rows={3}
                  value={customOptionsText}
                  onChange={(e) => setCustomOptionsText(e.target.value)}
                  placeholder="Optionen (eine pro Zeile)..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-xs font-medium focus:outline-none"
                />
              </div>
            )}

            {/* Decision Winner Card */}
            <div className="p-4 sm:p-5 rounded-3xl bg-linear-to-br from-indigo-500 to-purple-600 text-white shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-black uppercase tracking-wider">
                  🏆 Empfohlene Wahl
                </span>
                <span className="text-xl font-black">
                  {decisionResult.winner.percentage}% Fit
                </span>
              </div>

              <div>
                <h4 className="text-lg sm:text-xl font-black">
                  {decisionResult.winner.title}
                </h4>
                <p className="text-xs text-white/90 mt-1">
                  {decisionResult.summary}
                </p>
              </div>

              {decisionResult.winner.pros.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {decisionResult.winner.pros.map((pro, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-white/20 text-white text-[10px] font-bold"
                    >
                      {pro}
                    </span>
                  ))}
                </div>
              )}

              {/* Action Button */}
              <div className="pt-2">
                <button
                  onClick={handleApplyWinner}
                  className="w-full py-2.5 px-4 rounded-2xl bg-white hover:bg-stone-100 text-indigo-700 font-black text-xs sm:text-sm shadow-md flex items-center justify-center gap-1.5 transition-all transform active:scale-98"
                >
                  <span>Entscheidung übernehmen</span>
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </button>
              </div>
            </div>

            {/* Other Ranked Options */}
            {decisionResult.options.length > 1 && (
              <div className="space-y-2 pt-2">
                <div className="text-[11px] font-black text-stone-400 dark:text-slate-500 uppercase tracking-wider">
                  Weitere Alternativen im Vergleich:
                </div>
                <div className="space-y-2">
                  {decisionResult.options.slice(1).map((opt) => (
                    <div
                      key={opt.id}
                      className="p-3 rounded-2xl border border-stone-200 dark:border-slate-800 bg-stone-50/50 dark:bg-slate-800/40 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-stone-800 dark:text-white truncate">
                          {opt.title}
                        </span>
                        <span className="font-black text-stone-500 dark:text-slate-400 shrink-0">
                          {opt.percentage}%
                        </span>
                      </div>

                      {/* Percentage Bar */}
                      <div className="w-full h-2 rounded-full bg-stone-200 dark:bg-slate-700 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-indigo-500/70 transition-all duration-500"
                          style={{ width: `${opt.percentage}%` }}
                        />
                      </div>

                      {opt.cons.length > 0 && (
                        <div className="text-[10px] text-stone-500 dark:text-slate-400 italic">
                          {opt.cons.join(' • ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-4 border-t border-stone-100 dark:border-slate-800 flex items-center justify-between bg-stone-50/40 dark:bg-slate-800/40 shrink-0">
            <span className="text-[10px] text-stone-400 font-medium">
              Kalibriertes System-1 Entscheidungsmodell
            </span>
            <button
              onClick={onClose}
              className="duo-btn duo-btn-white px-4 py-2 text-xs font-bold rounded-xl"
            >
              Schließen
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
