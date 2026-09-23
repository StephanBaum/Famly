import React from 'react';
import { CopilotAction } from '../../services/familyCopilotService';
import { detectStickerFromTitle } from '../calendar/calendarConstants';
import { Undo2, Clock, MapPin, CheckCircle, Sparkles, ChefHat } from 'lucide-react';

interface AssistantVisualResultCardProps {
  action: CopilotAction;
  onUndo: (action: CopilotAction) => void;
  onExecute: (action: CopilotAction) => boolean;
}

export const AssistantVisualResultCard: React.FC<AssistantVisualResultCardProps> = ({
  action,
  onUndo,
  onExecute,
}) => {
  const { type, payload, autoExecuted, description } = action;

  // 1. Appointment Card
  if (type === 'ADD_APPOINTMENT' || type === 'SCHEDULE_CHORE') {
    const sticker = payload.sticker || detectStickerFromTitle(payload.title || '', payload.category);
    return (
      <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-800/90 border-2 border-blue-200 dark:border-blue-800/80 shadow-xs flex items-center justify-between gap-3 animate-in fade-in">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-700/60 flex items-center justify-center text-2xl shadow-2xs shrink-0">
            {sticker}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/80 px-2 py-0.5 rounded-md">
                Termin eingetragen
              </span>
              <span className="text-xs font-bold text-stone-500 dark:text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-stone-400" />
                {payload.date || 'Heute'} • {payload.time || 'Ganztägig'}
              </span>
            </div>
            <h4 className="text-sm font-black text-stone-900 dark:text-white truncate mt-0.5">
              {payload.title}
            </h4>
            {payload.location && (
              <p className="text-[11px] text-stone-500 dark:text-slate-400 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-stone-400" />
                <span className="truncate">{payload.location}</span>
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onUndo(action)}
          className="px-2.5 py-1.5 rounded-xl bg-stone-100 dark:bg-slate-700/60 hover:bg-stone-200 dark:hover:bg-slate-700 text-stone-600 dark:text-slate-300 text-xs font-bold flex items-center gap-1 transition-all shrink-0 cursor-pointer active:scale-95"
          title="Termin rückgängig machen"
        >
          <Undo2 className="w-3 h-3" />
          <span>Rückgängig</span>
        </button>
      </div>
    );
  }

  // 2. Meal Plan Card
  if (type === 'SET_MEAL') {
    const slotLabel =
      payload.slot === 'breakfast'
        ? 'Frühstück'
        : payload.slot === 'lunch'
        ? 'Mittagessen'
        : 'Abendessen';

    return (
      <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-800/90 border-2 border-amber-200 dark:border-amber-800/80 shadow-xs flex items-center justify-between gap-3 animate-in fade-in">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-700/60 flex items-center justify-center text-2xl shadow-2xs shrink-0">
            🍲
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded-md flex items-center gap-1">
                <ChefHat className="w-3 h-3" />
                <span>{slotLabel}</span>
              </span>
              <span className="text-xs font-bold text-stone-500 dark:text-slate-400">
                {payload.date || 'Heute'}
              </span>
            </div>
            <h4 className="text-sm font-black text-stone-900 dark:text-white truncate mt-0.5">
              {payload.title}
            </h4>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onUndo(action)}
          className="px-2.5 py-1.5 rounded-xl bg-stone-100 dark:bg-slate-700/60 hover:bg-stone-200 dark:hover:bg-slate-700 text-stone-600 dark:text-slate-300 text-xs font-bold flex items-center gap-1 transition-all shrink-0 cursor-pointer active:scale-95"
          title="Essensplan rückgängig machen"
        >
          <Undo2 className="w-3 h-3" />
          <span>Rückgängig</span>
        </button>
      </div>
    );
  }

  // 3. Grocery Card
  if (type === 'ADD_GROCERY') {
    return (
      <div className="p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-slate-800/90 border-2 border-emerald-200 dark:border-emerald-800/80 shadow-xs flex items-center justify-between gap-3 animate-in fade-in">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-base shrink-0">
            🛒
          </div>
          <div className="min-w-0">
            <span className="text-xs font-black text-stone-900 dark:text-white truncate block">
              {payload.name} {payload.amount ? `(${payload.amount})` : ''}
            </span>
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
              Auf Einkaufsliste [{payload.store || 'Supermarkt'}]
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onUndo(action)}
          className="px-2 py-1 rounded-xl bg-stone-100 dark:bg-slate-700/60 text-stone-600 dark:text-slate-300 text-[11px] font-bold flex items-center gap-1 transition-all shrink-0 cursor-pointer"
        >
          <Undo2 className="w-3 h-3" />
          <span>Rückgängig</span>
        </button>
      </div>
    );
  }

  // 4. Stars & Chores Card
  if (type === 'AWARD_STARS' || type === 'COMPLETE_CHORE' || type === 'ADD_CHORE') {
    return (
      <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-800/90 border-2 border-amber-200 dark:border-amber-800/80 shadow-xs flex items-center justify-between gap-3 animate-in fade-in">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-amber-400 text-stone-950 flex items-center justify-center text-2xl shadow-xs font-black shrink-0 animate-bounce">
            ⭐
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded-md flex items-center gap-1 w-fit">
              <Sparkles className="w-3 h-3" />
              <span>Aufgaben & Belohnung</span>
            </span>
            <h4 className="text-sm font-black text-stone-900 dark:text-white truncate mt-0.5">
              {description}
            </h4>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onUndo(action)}
          className="px-2.5 py-1.5 rounded-xl bg-stone-100 dark:bg-slate-700/60 hover:bg-stone-200 dark:hover:bg-slate-700 text-stone-600 dark:text-slate-300 text-xs font-bold flex items-center gap-1 transition-all shrink-0 cursor-pointer"
        >
          <Undo2 className="w-3 h-3" />
          <span>Rückgängig</span>
        </button>
      </div>
    );
  }

  // 5. General Fallback Card
  return (
    <div className="flex items-center justify-between gap-2 p-2.5 px-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700/60 text-xs font-bold text-emerald-900 dark:text-emerald-200 shadow-2xs animate-in fade-in">
      <div className="flex items-center gap-2 min-w-0">
        <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span className="truncate">{description}</span>
      </div>
      {autoExecuted ? (
        <button
          type="button"
          onClick={() => onUndo(action)}
          className="text-[11px] font-black underline text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 shrink-0 cursor-pointer flex items-center gap-1"
        >
          <Undo2 className="w-3 h-3" />
          <span>Rückgängig</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => onExecute(action)}
          className="px-2 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-black hover:bg-emerald-700 shrink-0 cursor-pointer"
        >
          Jetzt ausführen
        </button>
      )}
    </div>
  );
};
