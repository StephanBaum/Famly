import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { Chore, FamilyMember } from '../../types';
import { ActiveTab } from '../Header';

interface DashboardChoresCardProps {
  relevantChores: Chore[];
  members: FamilyMember[];
  currentMemberId: string;
  onNavigate: (tab: ActiveTab) => void;
  onChoreClick: (chore: Chore) => void;
}

export const DashboardChoresCard: React.FC<DashboardChoresCardProps> = ({
  relevantChores,
  members,
  currentMemberId,
  onNavigate,
  onChoreClick,
}) => {
  return (
    <div className="duo-card p-4 sm:p-6 bg-white dark:bg-slate-900">
      <div className="flex items-center justify-between mb-4 gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 flex items-center justify-center font-black shrink-0">
            <span>⭐</span>
          </div>
          <div className="min-w-0">
            <h3 className="font-black text-stone-900 dark:text-white text-base truncate">Aufgaben heute</h3>
          </div>
        </div>
        <button
          onClick={() => onNavigate('calendar')}
          className="duo-btn duo-btn-white px-3 py-1.5 text-xs font-extrabold rounded-xl shrink-0 whitespace-nowrap"
        >
          <span>Alle Aufgaben</span>
        </button>
      </div>

      {relevantChores.length === 0 ? (
        <div className="text-center py-6 bg-stone-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-stone-200 dark:border-slate-700">
          <span className="text-2xl mb-1 block">✨</span>
          <p className="text-xs font-bold text-stone-600 dark:text-slate-300">Keine offenen Aufgaben für heute.</p>
          <button
            onClick={() => onNavigate('calendar')}
            className="mt-2 text-xs font-black text-amber-600 dark:text-amber-400 hover:underline"
          >
            + Erste Aufgabe eintragen
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {relevantChores.slice(0, 4).map((chore) => {
            const assignees =
              chore.assignedMemberIds && chore.assignedMemberIds.length > 0
                ? members.filter((m) => chore.assignedMemberIds!.includes(m.id))
                : chore.assignedMemberId
                ? members.filter((m) => m.id === chore.assignedMemberId)
                : [];
            const completedBy = members.find((m) => m.id === chore.completedByMemberId);

            return (
              <div
                key={chore.id}
                onClick={() => onChoreClick(chore)}
                className={`cursor-pointer flex items-center justify-between p-3 rounded-2xl border-2 transition-all ${
                  chore.completed
                    ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 opacity-65'
                    : 'bg-white dark:bg-slate-800/80 border-b-4 border-stone-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-600'
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
                      className={`text-xs font-extrabold ${
                        chore.completed ? 'line-through text-stone-400 dark:text-slate-500' : 'text-stone-800 dark:text-white'
                      }`}
                    >
                      {chore.title}
                    </p>

                    {chore.completed ? (
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1 mt-0.5">
                        <span>✓ Erledigt von</span>
                        {completedBy ? (
                          <>
                            <span>{completedBy.avatar}</span>
                            <span className="font-extrabold">{completedBy.name}</span>
                          </>
                        ) : (
                          <span>einem Familienmitglied</span>
                        )}
                      </span>
                    ) : currentMemberId === 'all' && (
                      <span className="text-[10px] text-stone-500 dark:text-slate-400 font-bold flex items-center gap-1 mt-0.5">
                        {assignees.length === 0 ? (
                          <span className="text-teal-600 dark:text-teal-400">👥 Offen für alle</span>
                        ) : assignees.length === 1 ? (
                          <>
                            <span>{assignees[0].avatar}</span>
                            <span>{assignees[0].name}</span>
                          </>
                        ) : (
                          <span className="text-indigo-600 dark:text-indigo-400">
                            👥 {assignees.map((a) => a.name).join(' & ')}
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-xs font-black text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded-lg">
                  ⭐ +{chore.stars}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
