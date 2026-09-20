import React from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Recipe, MealPlanDay, FamilyMember } from '../../types';
import { Utensils, Clock, Heart, ShoppingCart } from 'lucide-react';
import { getRecipePhoto } from './mealUtils';

interface WeeklyGridViewProps {
  weekDays: Date[];
  todayDateStr: string;
  mealPlans: MealPlanDay[];
  recipes: Recipe[];
  members: FamilyMember[];
  onOpenEditSlot: (
    slot: 'breakfast' | 'lunch' | 'dinner',
    dateStr: string,
    currentTitle?: string,
    currentRecipeId?: string,
    currentChefId?: string
  ) => void;
  onSelectRecipe: (recipe: Recipe) => void;
  onToggleFavorite: (recipeId: string) => void;
}

export const WeeklyGridView: React.FC<WeeklyGridViewProps> = ({
  weekDays,
  todayDateStr,
  mealPlans,
  recipes,
  members,
  onOpenEditSlot,
  onSelectRecipe,
  onToggleFavorite,
}) => {
  const isMultiWeek = weekDays.length > 7;
  const week1Days = isMultiWeek ? weekDays.slice(0, 7) : weekDays;
  const week2Days = isMultiWeek ? weekDays.slice(7) : [];

  const renderDayCard = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const isToday = dateStr === todayDateStr;
    const dayPlan = mealPlans.find((m) => m.date === dateStr);

    const dinnerRecipe = dayPlan?.dinner?.recipeId
      ? recipes.find((r) => r.id === dayPlan.dinner?.recipeId)
      : null;
    const dinnerChef = dayPlan?.dinner?.chefId
      ? members.find((m) => m.id === dayPlan.dinner?.chefId)
      : null;

    const lunchChef = dayPlan?.lunch?.chefId
      ? members.find((m) => m.id === dayPlan.lunch?.chefId)
      : null;

    const breakfastChef = dayPlan?.breakfast?.chefId
      ? members.find((m) => m.id === dayPlan.breakfast?.chefId)
      : null;

    return (
      <div
        key={dateStr}
        className={`duo-card bg-white dark:bg-slate-900 border-2 flex flex-col justify-between overflow-hidden shadow-xs transition-all ${
          isToday
            ? 'border-teal-500 dark:border-teal-400 ring-4 ring-teal-400/20'
            : 'border-stone-200 dark:border-slate-800 hover:border-teal-200'
        }`}
      >
            {/* Day Header */}
            <div
              className={`px-3 py-2 border-b text-center flex items-center justify-between ${
                isToday
                  ? 'bg-teal-500 text-white font-black'
                  : 'bg-stone-50/90 dark:bg-slate-800 text-stone-700 dark:text-slate-300 font-bold'
              }`}
            >
              <span className="text-xs uppercase tracking-wider">{format(day, 'EEE', { locale: de })}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  isToday ? 'bg-white/20 text-white' : 'bg-stone-200/70 dark:bg-slate-700 text-stone-700 dark:text-slate-300'
                }`}
              >
                {format(day, 'd. MMM', { locale: de })}
              </span>
            </div>

            {/* Meals in Day */}
            <div className="p-2.5 space-y-2.5 flex-1 flex flex-col justify-between">
              {/* DINNER */}
              <div
                onClick={() =>
                  onOpenEditSlot(
                    'dinner',
                    dateStr,
                    dayPlan?.dinner?.title || '',
                    dayPlan?.dinner?.recipeId,
                    dayPlan?.dinner?.chefId
                  )
                }
                className="group cursor-pointer rounded-2xl p-2.5 bg-teal-50/40 dark:bg-teal-950/30 hover:bg-teal-50 border border-teal-100 dark:border-teal-900/40 hover:border-teal-300 transition-all relative"
              >
                <div className="flex items-center justify-between text-[11px] font-black text-teal-800 dark:text-teal-300 mb-1.5">
                  <span className="flex items-center gap-1">
                    <Utensils className="w-3.5 h-3.5 text-teal-600" />
                    <span>Abendessen</span>
                  </span>
                  {dinnerChef && (
                    <span
                      title={`Koch: ${dinnerChef.name}`}
                      className="flex items-center gap-1 text-[10px] bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full border border-stone-200 dark:border-slate-700 shadow-2xs font-bold text-stone-700 dark:text-slate-200"
                    >
                      <span>{dinnerChef.avatar}</span>
                      <span>{dinnerChef.name}</span>
                    </span>
                  )}
                </div>

                {dayPlan?.dinner?.title ? (
                  <div>
                    {dinnerRecipe && (
                      <img
                        src={getRecipePhoto(dinnerRecipe)}
                        alt={dayPlan.dinner.title}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
                        }}
                        className="w-full h-20 object-cover rounded-xl mb-1.5 shadow-2xs border border-teal-200/60 group-hover:scale-[1.02] transition-transform"
                      />
                    )}
                    <div className="flex items-start justify-between gap-1">
                      <p className="text-xs font-black text-stone-900 dark:text-white line-clamp-2 leading-tight flex-1">
                        {dayPlan.dinner.title}
                      </p>
                      {dinnerRecipe && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(dinnerRecipe.id);
                          }}
                          className={`p-1 rounded-lg transition-colors shrink-0 ${
                            dinnerRecipe.isFavorite
                              ? 'text-rose-500 hover:text-rose-600'
                              : 'text-stone-300 dark:text-slate-600 hover:text-rose-400'
                          }`}
                          title={dinnerRecipe.isFavorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen ❤️'}
                        >
                          <Heart className={`w-3.5 h-3.5 ${dinnerRecipe.isFavorite ? 'fill-rose-500' : ''}`} />
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      {dinnerRecipe?.prepTime && (
                        <span className="text-[10px] text-stone-500 dark:text-slate-400 font-semibold flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5 text-teal-600" />
                          {dinnerRecipe.prepTime}
                        </span>
                      )}
                      {dinnerRecipe?.estimatedCost && (
                        <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                          ~{dinnerRecipe.estimatedCost.toFixed(0)}€
                        </span>
                      )}
                    </div>
                    {dinnerRecipe?.synergyTip && (
                      <div
                        title={dinnerRecipe.synergyTip}
                        className="mt-1 text-[9px] font-black text-amber-900 dark:text-amber-200 bg-amber-100 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-700 px-1.5 py-0.5 rounded flex items-center gap-1 truncate"
                      >
                        <span className="shrink-0">⚡</span>
                        <span className="truncate">{dinnerRecipe.synergyTip}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-stone-400 italic py-2 text-center font-medium group-hover:text-teal-600">
                    + Planen
                  </p>
                )}
              </div>

              {/* LUNCH */}
              <div
                onClick={() =>
                  onOpenEditSlot(
                    'lunch',
                    dateStr,
                    dayPlan?.lunch?.title || '',
                    dayPlan?.lunch?.recipeId,
                    dayPlan?.lunch?.chefId
                  )
                }
                className={`cursor-pointer rounded-xl p-2 border transition-all ${
                  dayPlan?.lunch?.title
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/30 hover:bg-emerald-50 border-emerald-200/80 dark:border-emerald-900/40'
                    : 'bg-stone-50/80 dark:bg-slate-800/80 hover:bg-stone-100 border-stone-200/60 dark:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-black text-emerald-800 dark:text-emerald-300 mb-1">
                  <span className="flex items-center gap-1">
                    <span>🥗</span>
                    <span>Mittag</span>
                  </span>
                  {lunchChef && (
                    <span className="text-[9px] bg-white dark:bg-slate-800 px-1.5 py-0.2 rounded font-bold text-stone-600 dark:text-slate-300">
                      {lunchChef.avatar} {lunchChef.name}
                    </span>
                  )}
                </div>
                <p className="text-xs font-extrabold text-stone-800 dark:text-slate-200 truncate">
                  {dayPlan?.lunch?.title || (
                    <span className="text-stone-400 font-normal italic">+ Mittag</span>
                  )}
                </p>
              </div>

              {/* BREAKFAST */}
              <div
                onClick={() =>
                  onOpenEditSlot(
                    'breakfast',
                    dateStr,
                    dayPlan?.breakfast?.title || '',
                    dayPlan?.breakfast?.recipeId,
                    dayPlan?.breakfast?.chefId
                  )
                }
                className={`cursor-pointer rounded-xl p-2 border transition-all ${
                  dayPlan?.breakfast?.title
                    ? 'bg-amber-50/50 dark:bg-amber-950/30 hover:bg-amber-50 border-amber-200/80 dark:border-amber-900/40'
                    : 'bg-stone-50/80 dark:bg-slate-800/80 hover:bg-stone-100 border-stone-200/60 dark:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-black text-amber-800 dark:text-amber-300 mb-1">
                  <span className="flex items-center gap-1">
                    <span>🍳</span>
                    <span>Frühstück</span>
                  </span>
                  {breakfastChef && (
                    <span className="text-[9px] bg-white dark:bg-slate-800 px-1.5 py-0.2 rounded font-bold text-stone-600 dark:text-slate-300">
                      {breakfastChef.avatar} {breakfastChef.name}
                    </span>
                  )}
                </div>
                <p className="text-xs font-extrabold text-stone-800 dark:text-slate-200 truncate">
                  {dayPlan?.breakfast?.title || (
                    <span className="text-stone-400 font-normal italic">+ Frühstück</span>
                  )}
                </p>
              </div>
            </div>

            {/* Footer Quick Grocery Sync */}
            {dinnerRecipe && (
              <div className="p-2 bg-stone-50/80 dark:bg-slate-800/80 border-t border-stone-100 dark:border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => onSelectRecipe(dinnerRecipe)}
                  className="text-[11px] font-bold text-teal-700 dark:text-teal-400 hover:text-teal-950 underline"
                >
                  Rezept
                </button>
                <span
                  title="Zutaten sind automatisch auf der Einkaufsliste synchronisiert"
                  className="text-[10px] font-black text-emerald-700 dark:text-emerald-300 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800"
                >
                  <ShoppingCart className="w-3 h-3 text-emerald-600" />
                  <span>Auf Liste ✓</span>
                </span>
              </div>
            )}
      </div>
    );
  };

  if (isMultiWeek) {
    return (
      <div className="space-y-6 animate-in fade-in">
        {/* Week 1 */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 px-1">
            <span className="text-xs font-black text-teal-800 dark:text-teal-200 bg-teal-100 dark:bg-teal-950/70 px-3 py-1 rounded-xl border border-teal-300 dark:border-teal-700">
              Woche 1: Nächste 7 Tage (ab heute)
            </span>
            <span className="text-xs font-bold text-stone-500 dark:text-slate-400">
              {format(week1Days[0], 'd. MMM', { locale: de })} – {format(week1Days[6], 'd. MMM', { locale: de })}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-3">
            {week1Days.map(renderDayCard)}
          </div>
        </div>

        {/* Week 2 */}
        <div className="space-y-2.5 pt-2">
          <div className="flex items-center gap-2 px-1">
            <span className="text-xs font-black text-indigo-800 dark:text-indigo-200 bg-indigo-100 dark:bg-indigo-950/70 px-3 py-1 rounded-xl border border-indigo-300 dark:border-indigo-700">
              Woche 2: Folgewoche
            </span>
            <span className="text-xs font-bold text-stone-500 dark:text-slate-400">
              {format(week2Days[0], 'd. MMM', { locale: de })} – {format(week2Days[week2Days.length - 1], 'd. MMM', { locale: de })}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-3">
            {week2Days.map(renderDayCard)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-3 animate-in fade-in">
      {weekDays.map(renderDayCard)}
    </div>
  );
};
