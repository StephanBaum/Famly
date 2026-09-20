import React from 'react';
import { Chore, FamilyMember } from '../../types';
import { CheckCircle2, Circle, Edit2, Trash2 } from 'lucide-react';

export const CHORE_FREQUENCY_MAP: Record<string, { label: string; icon: string }> = {
  once: { label: 'Einmalig', icon: '🎯' },
  '2x_weekly': { label: '2x / Woche', icon: '🔄' },
  weekly: { label: 'Wöchentlich', icon: '🗓️' },
  biweekly: { label: 'Alle 2 Wochen', icon: '⏳' },
  monthly: { label: 'Monatlich', icon: '📅' },
  daily: { label: 'Täglich', icon: '☀️' },
};

interface ChoresTabProps {
  chores: Chore[];
  members: FamilyMember[];
  currentMemberId: string | 'all';
  onToggleChore: (id: string) => void;
  onEditChore: (chore: Chore) => void;
  onDeleteChore: (chore: Chore) => void;
}

export const ChoresTab: React.FC<ChoresTabProps> = ({
  chores,
  members,
  currentMemberId,
  onToggleChore,
  onEditChore,
  onDeleteChore,
}) => {
  return (
    <div className="duo-card p-6 bg-white dark:bg-slate-900 border-2 border-stone-200 dark:border-slate-800 space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-black text-stone-900 dark:text-white">
          Aktive Aufgaben ({chores.length})
        </h4>
        <span className="text-xs text-stone-400 dark:text-slate-400 font-bold">
          Zeige für: {currentMemberId === 'all' ? 'Ganze Familie' : 'Ausgewähltes Mitglied'}
        </span>
      </div>

      <div className="space-y-2">
        {chores.map((chore) => {
          const assigned = members.find((m) => m.id === chore.assignedMemberId);
          return (
            <div
              key={chore.id}
              onClick={() => onToggleChore(chore.id)}
              className={`cursor-pointer flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all ${
                chore.completed
                  ? 'bg-amber-50/20 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 opacity-65'
                  : 'bg-stone-50/40 dark:bg-slate-800/60 border-b-4 border-stone-200 dark:border-slate-700 hover:bg-stone-50 dark:hover:bg-slate-800 hover:border-amber-300'
              }`}
            >
              <div className="flex items-center gap-3">
                {chore.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-amber-500 fill-amber-100 dark:fill-amber-950/50 shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-stone-300 dark:text-slate-600 hover:text-amber-500 shrink-0" />
                )}

                <div>
                  <p
                    className={`text-sm font-black ${
                      chore.completed
                        ? 'line-through text-stone-400 dark:text-slate-500'
                        : 'text-stone-800 dark:text-white'
                    }`}
                  >
                    {chore.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-stone-100 dark:bg-slate-700 text-stone-600 dark:text-slate-300 flex items-center gap-1">
                      <span>{CHORE_FREQUENCY_MAP[chore.frequency]?.icon || '🎯'}</span>
                      <span>{CHORE_FREQUENCY_MAP[chore.frequency]?.label || 'Einmalig'}</span>
                    </span>
                    {assigned && (
                      <span className="text-xs text-stone-500 dark:text-slate-400 flex items-center gap-1 font-bold">
                        <span>Zugewiesen an:</span>
                        <span>{assigned.avatar}</span>
                        <span className="text-stone-700 dark:text-slate-200">{assigned.name}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 text-xs font-black border border-amber-300 dark:border-amber-700">
                  <span>⭐</span>
                  <span>+{chore.stars} Sterne</span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditChore(chore);
                  }}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                  title="Aufgabe bearbeiten"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteChore(chore);
                  }}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  title="Aufgabe löschen"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
