import React, { useState } from 'react';
import { Chore, FamilyMember } from '../../types';
import { CheckCircle2, Circle, Edit2, Trash2 } from 'lucide-react';
import { ModalPortal } from '../ModalPortal';

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
  onToggleChore: (id: string, completingMemberId?: string) => void;
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
  const [claimingChore, setClaimingChore] = useState<Chore | null>(null);

  const getEligibleClaimants = (chore: Chore): FamilyMember[] => {
    if (chore.assignedMemberIds && chore.assignedMemberIds.length > 0) {
      const matched = members.filter((m) => chore.assignedMemberIds!.includes(m.id));
      if (matched.length > 0) return matched;
    }
    const kids = members.filter((m) => m.isChild);
    return kids.length > 0 ? kids : members;
  };

  const handleChoreClick = (chore: Chore) => {
    if (chore.completed) {
      onToggleChore(chore.id);
      return;
    }

    if (currentMemberId !== 'all') {
      onToggleChore(chore.id, currentMemberId);
      return;
    }

    const assignees =
      chore.assignedMemberIds && chore.assignedMemberIds.length > 0
        ? members.filter((m) => chore.assignedMemberIds!.includes(m.id))
        : chore.assignedMemberId
        ? members.filter((m) => m.id === chore.assignedMemberId)
        : [];

    if (assignees.length === 1) {
      onToggleChore(chore.id, assignees[0].id);
    } else {
      setClaimingChore(chore);
    }
  };

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
              onClick={() => handleChoreClick(chore)}
              className={`cursor-pointer flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all ${
                chore.completed
                  ? 'bg-amber-50/20 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 opacity-70'
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
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-stone-100 dark:bg-slate-700 text-stone-600 dark:text-slate-300 flex items-center gap-1">
                      <span>{CHORE_FREQUENCY_MAP[chore.frequency]?.icon || '🎯'}</span>
                      <span>{CHORE_FREQUENCY_MAP[chore.frequency]?.label || 'Einmalig'}</span>
                    </span>

                    {chore.completed ? (
                      <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 font-bold">
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
                    ) : assignees.length === 0 ? (
                      <span className="text-xs font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800/60 px-2 py-0.5 rounded-lg flex items-center gap-1">
                        <span>👥</span>
                        <span>Offen für alle (Wer zuerst kommt)</span>
                      </span>
                    ) : assignees.length === 1 ? (
                      <span className="text-xs text-stone-500 dark:text-slate-400 flex items-center gap-1 font-bold">
                        <span>Zugewiesen an:</span>
                        <span>{assignees[0].avatar}</span>
                        <span className="text-stone-700 dark:text-slate-200">{assignees[0].name}</span>
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 px-2 py-0.5 rounded-lg flex items-center gap-1">
                        <span>👥</span>
                        <span>
                          {assignees.map((a) => `${a.avatar} ${a.name}`).join(' & ')} (Wer zuerst kommt)
                        </span>
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

      {/* Claim Picker Modal for Open / Multi-Assignee Chores */}
      {claimingChore && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-xl border-2 border-stone-200 dark:border-slate-800 animate-in fade-in zoom-in-95 text-center">
              <span className="text-4xl mb-2 block">🌟</span>
              <h3 className="text-lg font-black text-stone-900 dark:text-white mb-1">
                Wer hat es erledigt?
              </h3>
              <p className="text-xs font-semibold text-stone-500 dark:text-slate-400 mb-4">
                „{claimingChore.title}“ (+{claimingChore.stars} ⭐)
              </p>

              <div className="space-y-2 mb-4">
                {getEligibleClaimants(claimingChore).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      onToggleChore(claimingChore.id, m.id);
                      setClaimingChore(null);
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-2xl border-2 border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 hover:bg-amber-50 hover:border-amber-300 dark:hover:bg-amber-950/40 dark:hover:border-amber-700 transition-all cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{m.avatar}</span>
                      <div>
                        <p className="text-sm font-black text-stone-900 dark:text-white">{m.name}</p>
                        <p className="text-[10px] font-bold text-stone-400">{m.role}</p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-2.5 py-1 rounded-xl">
                      +{claimingChore.stars} ⭐
                    </span>
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setClaimingChore(null)}
                className="duo-btn duo-btn-white w-full py-2 text-xs font-bold rounded-xl"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
};
