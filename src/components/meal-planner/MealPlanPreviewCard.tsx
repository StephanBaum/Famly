import React from 'react';
import { format } from 'date-fns';
import { RefreshCw, Heart, Clock, Zap } from 'lucide-react';
import { Recipe } from '../../types';

export interface PlannedDayAssignment {
  dateStr: string;
  dayName: string;
  formattedDate: string;
  recipe: Recipe;
  isAlreadyPlanned?: boolean;
  synergyConnection?: {
    type: 'cook-extra' | 'use-leftovers';
    partnerDayName?: string;
    baseName: string;
    tip?: string;
    timeSaved?: number;
  };
}

interface MealPlanPreviewCardProps {
  assignment: PlannedDayAssignment;
  index: number;
  onShuffleDay: (index: number) => void;
  onToggleFavorite: (recipeId: string) => void;
}

export const MealPlanPreviewCard: React.FC<MealPlanPreviewCardProps> = ({
  assignment,
  index,
  onShuffleDay,
  onToggleFavorite,
}) => {
  const r = assignment.recipe;
  const isFav = Boolean(r.isFavorite);
  const syn = assignment.synergyConnection;

  return (
    <div className="duo-card p-2 bg-white dark:bg-slate-900 border-2 border-stone-200 dark:border-slate-800 rounded-2xl flex flex-col justify-between hover:border-teal-400 transition-all shadow-2xs group relative min-w-0">
      {/* Compact Day Header */}
      <div className="flex items-center justify-between pb-1 mb-1 border-b border-stone-100 dark:border-slate-800">
        <div className="flex items-baseline gap-1 min-w-0">
          <span className="text-xs font-black text-stone-900 dark:text-white">
            {assignment.dayName.slice(0, 2)}
          </span>
          <span className="text-[10px] font-bold text-stone-400 truncate">
            {format(new Date(assignment.dateStr), 'd.M.')}
          </span>
        </div>

        {/* 🔄 Single Day Shuffle button */}
        <button
          type="button"
          onClick={() => onShuffleDay(index)}
          title="Anderes Gericht würfeln"
          className="w-5 h-5 rounded-md bg-stone-100 dark:bg-slate-800 hover:bg-teal-100 dark:hover:bg-teal-950/70 text-stone-500 hover:text-teal-700 dark:text-slate-400 dark:hover:text-teal-300 flex items-center justify-center transition-colors shrink-0"
        >
          <RefreshCw className="w-2.5 h-2.5" />
        </button>
      </div>

      {/* Recipe Image with overlay controls */}
      <div className="space-y-1">
        <div className="relative h-16 sm:h-18 w-full rounded-xl overflow-hidden bg-stone-100 dark:bg-slate-800 shrink-0">
          <img
            src={r.imageUrl}
            alt={r.title}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
            }}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

          {/* Heart Favorite Toggle */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(r.id);
            }}
            title={isFav ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
            className={`absolute top-1 right-1 w-5 h-5 rounded-md flex items-center justify-center backdrop-blur-xs transition-all ${
              isFav
                ? 'bg-rose-500 text-white shadow-xs'
                : 'bg-black/50 text-white/80 hover:text-white hover:bg-black/70'
            }`}
          >
            <Heart className={`w-2.5 h-2.5 ${isFav ? 'fill-white stroke-white' : 'stroke-white'}`} />
          </button>

          {/* Time badge */}
          <div className="absolute bottom-1 left-1 text-[9px] font-black text-white flex items-center gap-0.5 bg-black/60 px-1 py-0.2 rounded">
            <Clock className="w-2 h-2 text-amber-300" />
            <span>{r.prepTime}</span>
          </div>
        </div>

        {/* Recipe Title & Budget Info */}
        <div>
          <h5
            className="text-[11px] font-black text-stone-900 dark:text-white line-clamp-2 leading-tight min-h-[2rem]"
            title={r.title}
          >
            {r.title}
          </h5>
          <span className="text-[9px] font-bold text-stone-400 dark:text-slate-400 block truncate">
            {r.ingredients.length} Zutaten • ~{(r.estimatedCost || 12).toFixed(1)}€
          </span>
        </div>
      </div>

      {/* Synergy Badge if connected */}
      {syn ? (
        <div
          title={
            syn.type === 'cook-extra'
              ? `Vorkochen: Doppelt ${syn.baseName} kochen für morgen`
              : `Reste nutzen: Verwertet ${syn.baseName} von gestern`
          }
          className={`mt-1 px-1.5 py-0.5 rounded-lg border text-[9px] font-black leading-tight flex items-center gap-1 truncate ${
            syn.type === 'cook-extra'
              ? 'bg-amber-100/90 dark:bg-amber-950/70 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200'
              : 'bg-emerald-100/90 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200'
          }`}
        >
          <Zap className="w-2.5 h-2.5 text-amber-500 shrink-0" />
          <span className="truncate">
            {syn.type === 'cook-extra' ? `Doppelt ${syn.baseName}` : `Nutzt ${syn.baseName}`}
          </span>
        </div>
      ) : (
        <div className="h-1" />
      )}

      {/* Footer / Status */}
      <div className="mt-1 pt-1 border-t border-stone-100 dark:border-slate-800 flex items-center justify-between text-[9px] font-bold">
        {isFav ? (
          <span className="text-rose-600 dark:text-rose-400 flex items-center gap-0.5">
            <span>❤️</span>
            <span>Favorit</span>
          </span>
        ) : (
          <span className="text-teal-600 dark:text-teal-400 flex items-center gap-0.5">
            <span>✨</span>
            <span>Idee</span>
          </span>
        )}
        {assignment.isAlreadyPlanned && (
          <span className="text-[8px] bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 px-1 py-0.2 rounded font-black">
            Fix
          </span>
        )}
      </div>
    </div>
  );
};
