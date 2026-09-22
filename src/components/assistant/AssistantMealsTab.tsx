import React from 'react';
import { Plus } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { Recipe, MealPlanDay } from '../../types';

interface AssistantMealsTabProps {
  safeMealPlans: MealPlanDay[];
  safeRecipes: Recipe[];
  todayStr: string;
  todayPlan?: MealPlanDay;
  onSetMealSlot: (date: string, slot: 'breakfast' | 'lunch' | 'dinner', data: { title: string; recipeId?: string }) => void;
  onSuccessNotice: (msg: string) => void;
}

export const AssistantMealsTab: React.FC<AssistantMealsTabProps> = ({
  safeMealPlans,
  safeRecipes,
  todayStr,
  todayPlan,
  onSetMealSlot,
  onSuccessNotice,
}) => {
  return (
    <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 scrollbar-thin">
      {/* Today's Meal Plan Card */}
      <div className="duo-card p-4 sm:p-5 bg-stone-50 dark:bg-slate-800/60 border border-stone-200 dark:border-slate-700 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-stone-400 dark:text-slate-400">
            Heute im Essensplan ({format(new Date(), 'EEEE, d. MMMM', { locale: de })})
          </span>
          <span
            className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
              todayPlan?.dinner?.title
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
            }`}
          >
            {todayPlan?.dinner?.title ? '✓ Bereits geplant (Kein Konflikt)' : 'Noch offen'}
          </span>
        </div>

        {todayPlan?.dinner?.title ? (
          <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-stone-200 dark:border-slate-700 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🍽️</span>
              <div>
                <h4 className="text-sm font-black text-stone-900 dark:text-white">
                  {todayPlan.dinner.title}
                </h4>
                <p className="text-xs text-stone-500 dark:text-slate-400">
                  Fest für das heutige Abendessen vorgesehen.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-900/50 space-y-2">
            <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
              Für heute Abend ist noch kein Gericht im Essensplan eingetragen!
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {safeRecipes.slice(0, 3).map((rec) => (
                <button
                  key={rec.id}
                  type="button"
                  onClick={() => {
                    onSetMealSlot(todayStr, 'dinner', {
                      title: rec.title,
                      recipeId: rec.id,
                    });
                    onSuccessNotice(`✓ "${rec.title}" wurde als heutiges Abendessen eingetragen!`);
                  }}
                  className="duo-btn duo-btn-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-600" />
                  <span>{rec.title} ({rec.prepTime})</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Weekly Open Slot Overview */}
      <div className="space-y-3">
        <h4 className="text-sm font-black text-stone-900 dark:text-white flex items-center gap-2">
          <span>Wochen-Essensplan Übersicht</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {[0, 1, 2, 3, 4, 5, 6].map((dayOffset) => {
            const targetDate = addDays(new Date(), dayOffset);
            const dStr = format(targetDate, 'yyyy-MM-dd');
            const dayName = format(targetDate, 'EEEE', { locale: de });
            const plan = safeMealPlans.find((mp) => mp && mp.date === dStr);
            const hasDinner = Boolean(plan?.dinner?.title);

            return (
              <div
                key={dStr}
                className={`p-3 rounded-2xl border flex items-center justify-between gap-2 ${
                  hasDinner
                    ? 'bg-white dark:bg-slate-800/80 border-stone-200 dark:border-slate-700'
                    : 'bg-stone-50 dark:bg-slate-800/40 border-dashed border-stone-300 dark:border-slate-700'
                }`}
              >
                <div>
                  <span className="text-[11px] font-black uppercase text-stone-400 dark:text-slate-400 block">
                    {dayOffset === 0 ? 'Heute' : dayOffset === 1 ? 'Morgen' : dayName}
                  </span>
                  <span className="text-xs font-bold text-stone-800 dark:text-white">
                    {plan?.dinner?.title || '— Offener Tag —'}
                  </span>
                </div>

                {!hasDinner && (
                  <button
                    type="button"
                    onClick={() => {
                      const randomRecipe = safeRecipes[Math.floor(Math.random() * safeRecipes.length)] || safeRecipes[0];
                      if (randomRecipe) {
                        onSetMealSlot(dStr, 'dinner', {
                          title: randomRecipe.title,
                          recipeId: randomRecipe.id,
                        });
                        onSuccessNotice(`✓ "${randomRecipe.title}" für ${dayName} eingetragen!`);
                      }
                    }}
                    className="duo-btn duo-btn-amber px-2.5 py-1 text-[11px] font-bold rounded-lg flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Vorschlagen</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
