import React from 'react';
import { Utensils, ChevronRight } from 'lucide-react';
import { MealPlanDay, Recipe, FamilyMember } from '../../types';
import { ActiveTab } from '../Header';

interface DashboardDinnerCardProps {
  todayMeal: MealPlanDay | undefined;
  dinnerRecipe: Recipe | null | undefined;
  dinnerChef: FamilyMember | null | undefined;
  onNavigate: (tab: ActiveTab) => void;
  onAddRecipeToGrocery: (recipe: Recipe) => void;
}

export const DashboardDinnerCard: React.FC<DashboardDinnerCardProps> = ({
  todayMeal,
  dinnerRecipe,
  dinnerChef,
  onNavigate,
  onAddRecipeToGrocery,
}) => {
  return (
    <div className="duo-card p-4 sm:p-6 bg-white dark:bg-slate-900">
      <div className="flex items-center justify-between mb-4 gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-2xl bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 flex items-center justify-center font-black shrink-0">
            <Utensils className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="font-black text-stone-900 dark:text-white text-base truncate">Abendessen</h3>
          </div>
        </div>
        <button
          onClick={() => onNavigate('meals')}
          className="duo-btn duo-btn-white px-3 py-1.5 text-xs font-extrabold rounded-xl shrink-0 whitespace-nowrap"
        >
          <span>Essensplan</span>
          <ChevronRight className="w-3.5 h-3.5 ml-1" />
        </button>
      </div>

      {todayMeal?.dinner?.title ? (
        <div className="flex flex-col sm:flex-row gap-4 bg-teal-50/50 dark:bg-teal-950/30 rounded-2xl border-2 border-teal-200 dark:border-teal-900/60 p-4">
          {dinnerRecipe?.imageUrl ? (
            <img
              src={dinnerRecipe.imageUrl}
              alt={todayMeal.dinner.title}
              className="w-full sm:w-32 h-28 object-cover rounded-2xl shadow-xs border-2 border-white dark:border-slate-800"
            />
          ) : (
            <div className="w-full sm:w-32 h-28 rounded-2xl bg-teal-100 dark:bg-teal-950/80 flex items-center justify-center text-3xl">
              🍲
            </div>
          )}
          <div className="flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-teal-200 dark:bg-teal-900/60 text-teal-900 dark:text-teal-200">
                  Abendessen
                </span>
                {dinnerChef && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-stone-700 dark:text-slate-300 border border-stone-200 dark:border-slate-700 flex items-center gap-1">
                    <span>Koch:</span>
                    <span>{dinnerChef.avatar}</span>
                    <span className="font-black">{dinnerChef.name}</span>
                  </span>
                )}
              </div>
              <h4 className="text-base font-black text-stone-900 dark:text-white">{todayMeal.dinner.title}</h4>
              {dinnerRecipe?.notes && (
                <p className="text-xs text-stone-600 dark:text-slate-300 mt-1 font-medium line-clamp-2">
                  {dinnerRecipe.notes}
                </p>
              )}
            </div>

            {dinnerRecipe && (
              <div className="mt-3 pt-2 border-t border-teal-100 dark:border-teal-900/40 flex items-center justify-between">
                <span className="text-xs font-bold text-stone-500 dark:text-slate-400">
                  {dinnerRecipe.ingredients.length} Zutaten
                </span>
                <button
                  onClick={() => onAddRecipeToGrocery(dinnerRecipe)}
                  className="duo-btn duo-btn-green px-3 py-1 text-xs font-black rounded-xl"
                >
                  + Zur Einkaufsliste
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-6 bg-stone-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-stone-200 dark:border-slate-700">
          <p className="text-xs font-bold text-stone-600 dark:text-slate-300">Heutiges Abendessen ist noch nicht geplant!</p>
          <button
            onClick={() => onNavigate('meals')}
            className="mt-2 text-xs font-black text-teal-600 dark:text-teal-400 underline"
          >
            Rezept aus dem Planer wählen
          </button>
        </div>
      )}
    </div>
  );
};
