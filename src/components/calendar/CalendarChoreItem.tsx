import React from 'react';
import { Chore, FamilyMember } from '../../types';
import { CHORE_FREQUENCY_MAP } from '../chores/ChoresTab';
import { CheckCircle2, Circle, Edit2, Trash2 } from 'lucide-react';

interface CalendarChoreItemProps {
  chore: Chore;
  members: FamilyMember[];
  onToggle: (chore: Chore) => void;
  onEdit: (chore: Chore) => void;
  onDelete: (chore: Chore) => void;
  variant?: 'compact' | 'full' | 'agenda';
}

export const CalendarChoreItem: React.FC<CalendarChoreItemProps> = ({
  chore,
  members,
  onToggle,
  onEdit,
  onDelete,
  variant = 'full',
}) => {
  const assignees =
    chore.assignedMemberIds && chore.assignedMemberIds.length > 0
      ? members.filter((m) => chore.assignedMemberIds!.includes(m.id))
      : chore.assignedMemberId
      ? members.filter((m) => m.id === chore.assignedMemberId)
      : [];

  const completedByMember = chore.completedByMemberId
    ? members.find((m) => m.id === chore.completedByMemberId)
    : null;

  const isAgenda = variant === 'agenda';
  const isCompact = variant === 'compact';

  return (
    <div
      className={`rounded-2xl border-2 transition-all flex items-center justify-between gap-2.5 ${
        isCompact ? 'p-2.5' : isAgenda ? 'p-4' : 'p-3'
      } ${
        chore.completed
          ? 'bg-stone-50/80 dark:bg-slate-800/40 border-stone-200 dark:border-slate-700 opacity-75'
          : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <button
          type="button"
          onClick={() => onToggle(chore)}
          className={`p-1 rounded-xl transition-all ${
            chore.completed
              ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60'
              : 'text-amber-600 dark:text-amber-400 hover:scale-110'
          }`}
          title={chore.completed ? 'Als unerledigt markieren' : 'Als erledigt markieren'}
        >
          {chore.completed ? (
            <CheckCircle2 className={`${isCompact ? 'w-5 h-5' : 'w-5 sm:w-6 h-5 sm:h-6'} fill-emerald-100 dark:fill-emerald-950`} />
          ) : (
            <Circle className={`${isCompact ? 'w-5 h-5' : 'w-5 sm:w-6 h-5 sm:h-6'}`} />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`${isCompact ? 'text-xs' : 'text-xs sm:text-sm'} font-black truncate ${
                chore.completed
                  ? 'line-through text-stone-400 dark:text-slate-500'
                  : 'text-stone-900 dark:text-white'
              }`}
            >
              {chore.title}
            </span>
            <span className="px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 text-[10px] sm:text-xs font-black shrink-0">
              +{chore.stars} ★
            </span>
            <span className="text-[10px] sm:text-xs text-stone-400 dark:text-slate-500 font-semibold shrink-0">
              {CHORE_FREQUENCY_MAP[chore.frequency]?.label || chore.frequency}
            </span>
            {isAgenda && chore.dueDate && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300">
                📅 {chore.dueDate}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 mt-0.5 text-[10px] sm:text-xs text-stone-500 dark:text-slate-400">
            {completedByMember ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <span>✓ Erledigt von {completedByMember.avatar} {completedByMember.name}</span>
              </span>
            ) : assignees.length > 0 ? (
              <span className="flex items-center gap-1">
                <span>👤 {assignees.map((m) => m.name).join(', ')}</span>
              </span>
            ) : (
              <span className="text-amber-600 dark:text-amber-400 font-bold">
                🤝 Wer zuerst kommt
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={() => onEdit(chore)}
          className="p-1 sm:p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-white rounded-lg transition-colors"
          title="Aufgabe bearbeiten"
        >
          <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(chore)}
          className="p-1 sm:p-1.5 text-stone-400 hover:text-rose-600 rounded-lg transition-colors"
          title="Aufgabe löschen"
        >
          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      </div>
    </div>
  );
};
