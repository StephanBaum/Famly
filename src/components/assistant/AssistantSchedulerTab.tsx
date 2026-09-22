import React from 'react';
import { Sparkles, CalendarCheck, Clock, Check, Calendar } from 'lucide-react';
import { ChoreScheduleProposal } from '../../services/choreSchedulerService';

interface AssistantSchedulerTabProps {
  choreProposals: ChoreScheduleProposal[];
  scheduledChoreIds: Set<string>;
  onScheduleSingleProposal: (proposal: ChoreScheduleProposal) => void;
  onScheduleAllProposals: () => void;
}

export const AssistantSchedulerTab: React.FC<AssistantSchedulerTabProps> = ({
  choreProposals,
  scheduledChoreIds,
  onScheduleSingleProposal,
  onScheduleAllProposals,
}) => {
  const unscheduledCount = choreProposals.filter((p) => !scheduledChoreIds.has(p.chore.id)).length;

  return (
    <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 scrollbar-thin">
      <div className="duo-card p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <h4 className="text-sm font-black text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-600" />
            Proaktiver Aufgaben-Terminplaner
          </h4>
          <p className="text-xs text-amber-800 dark:text-amber-300">
            Findet freie Zeitfenster ohne Terminkollisionen für alle offenen Aufgaben.
          </p>
        </div>

        {unscheduledCount > 0 && (
          <button
            type="button"
            onClick={onScheduleAllProposals}
            className="duo-btn duo-btn-green px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shrink-0"
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Alle {unscheduledCount} Aufgaben einplanen</span>
          </button>
        )}
      </div>

      {choreProposals.length === 0 ? (
        <div className="text-center py-12 space-y-2">
          <span className="text-4xl">🎉</span>
          <h3 className="text-base font-black">Keine offenen Aufgaben!</h3>
          <p className="text-xs text-stone-500 dark:text-slate-400">
            Alle Familienaufgaben sind bereits erledigt oder im Kalender eingeplant.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {choreProposals.map((proposal) => {
            const isAlreadyScheduled = scheduledChoreIds.has(proposal.chore.id);

            return (
              <div
                key={proposal.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isAlreadyScheduled
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 opacity-80'
                    : 'bg-white dark:bg-slate-800/80 border-stone-200 dark:border-slate-700 shadow-xs'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-black text-stone-900 dark:text-white">
                        🧹 {proposal.chore.title}
                      </span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        ⭐ {proposal.chore.stars} Sterne
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                        👤 {proposal.targetMember.name}
                      </span>
                    </div>

                    <p className="text-xs text-stone-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-stone-400" />
                      <span>Vorschlag: <strong>{proposal.reason}</strong></span>
                    </p>
                  </div>

                  <div className="shrink-0">
                    {isAlreadyScheduled ? (
                      <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-xl bg-emerald-100/70 dark:bg-emerald-900/40">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        Im Kalender eingetragen
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onScheduleSingleProposal(proposal)}
                        className="duo-btn duo-btn-amber px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 w-full sm:w-auto justify-center"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>In Kalender einplanen</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
