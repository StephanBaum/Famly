import React from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Recipe, MealPlanDay, FamilyMember } from '../../types';
import { Clock, Users, ShoppingCart, Pencil, Heart } from 'lucide-react';
import { getRecipePhoto } from './mealUtils';

interface DayFocusCardProps {
  focusDay: Date;
  isToday: boolean;
  mealPlan?: MealPlanDay;
  recipes: Recipe[];
  members: FamilyMember[];
  onOpenEditSlot: (
    slot: 'breakfast' | 'lunch' | 'dinner',
    currentTitle?: string,
    currentRecipeId?: string,
    currentChefId?: string
  ) => void;
  onSelectRecipe: (recipe: Recipe) => void;
  onSyncRecipe: (recipe: Recipe) => void;
  onToggleFavorite: (recipeId: string) => void;
}

export const DayFocusCard: React.FC<DayFocusCardProps> = ({
  focusDay,
  isToday,
  mealPlan,
  recipes,
  members,
  onOpenEditSlot,
  onSelectRecipe,
  onSyncRecipe,
  onToggleFavorite,
}) => {
  const dinnerRecipe = mealPlan?.dinner?.recipeId
    ? recipes.find((r) => r.id === mealPlan.dinner?.recipeId)
    : null;
  const dinnerChef = mealPlan?.dinner?.chefId
    ? members.find((m) => m.id === mealPlan.dinner?.chefId)
    : null;

  const lunchChef = mealPlan?.lunch?.chefId
    ? members.find((m) => m.id === mealPlan.lunch?.chefId)
    : null;

  const breakfastChef = mealPlan?.breakfast?.chefId
    ? members.find((m) => m.id === mealPlan.breakfast?.chefId)
    : null;

  return (
    <div className="space-y-4 animate-in fade-in">
      {/* Day Header Banner */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <h3 className="text-lg sm:text-xl font-black text-stone-900 dark:text-white capitalize">
            {format(focusDay, 'EEEE, d. MMMM', { locale: de })}
          </h3>
          {isToday && (
            <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200 border border-teal-300 dark:border-teal-700">
              Heute
            </span>
          )}
        </div>
      </div>

      {/* HERO: TONIGHT'S DINNER */}
      <div className="duo-card overflow-hidden bg-white dark:bg-slate-900 border-2 border-teal-200 dark:border-teal-900/60 shadow-sm">
        <div className="p-4 bg-teal-50/80 dark:bg-teal-950/40 border-b border-teal-100 dark:border-teal-900/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🍲</span>
            <h4 className="text-sm font-black text-teal-950 dark:text-teal-200 uppercase tracking-wider">
              Heutiges Abendessen
            </h4>
          </div>
          {dinnerChef && (
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-xl border border-teal-200 dark:border-teal-800 text-xs font-bold text-stone-800 dark:text-slate-200 shadow-2xs">
              <span>👨‍🍳 Koch:</span>
              <span>{dinnerChef.avatar}</span>
              <span>{dinnerChef.name}</span>
            </div>
          )}
        </div>

        {mealPlan?.dinner?.title ? (
          <div className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {dinnerRecipe && (
                <img
                  src={getRecipePhoto(dinnerRecipe)}
                  alt={mealPlan.dinner.title}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
                  }}
                  className="w-full sm:w-44 h-36 sm:h-32 object-cover rounded-2xl border border-stone-200 dark:border-slate-700 shadow-xs shrink-0"
                />
              )}
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <h4 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white leading-tight">
                    {mealPlan.dinner.title}
                  </h4>
                  {dinnerRecipe && (
                    <button
                      type="button"
                      onClick={() => onToggleFavorite(dinnerRecipe.id)}
                      className={`p-2 rounded-xl border transition-all shrink-0 ${
                        dinnerRecipe.isFavorite
                          ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-700 text-rose-500 shadow-2xs'
                          : 'bg-stone-100 dark:bg-slate-800 border-stone-200 dark:border-slate-700 text-stone-400 hover:text-rose-500'
                      }`}
                      title={dinnerRecipe.isFavorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen ❤️'}
                    >
                      <Heart className={`w-4 h-4 ${dinnerRecipe.isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap text-xs">
                  {dinnerRecipe?.prepTime && (
                    <span className="bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 border border-stone-200 dark:border-slate-700">
                      <Clock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                      <span>{dinnerRecipe.prepTime}</span>
                    </span>
                  )}
                  {dinnerRecipe?.servings && (
                    <span className="bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 border border-stone-200 dark:border-slate-700">
                      <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>{dinnerRecipe.servings} Portionen</span>
                    </span>
                  )}
                  {dinnerRecipe?.category && (
                    <span className="capitalize px-2.5 py-1 rounded-lg font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800">
                      {dinnerRecipe.category}
                    </span>
                  )}
                  {dinnerRecipe?.estimatedCost && (
                    <span className="px-2.5 py-1 rounded-lg font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                      <span>🏷️</span>
                      <span>~{dinnerRecipe.estimatedCost.toFixed(2)} €</span>
                    </span>
                  )}
                  {dinnerRecipe?.synergyTip && (
                    <span className="px-2.5 py-1 rounded-lg font-black bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 flex items-center gap-1">
                      <span>⚡</span>
                      <span>{dinnerRecipe.synergyTip}</span>
                    </span>
                  )}
                </div>

                {dinnerRecipe?.notes && (
                  <p className="text-xs text-stone-500 dark:text-slate-400 font-medium line-clamp-2">
                    {dinnerRecipe.notes}
                  </p>
                )}
              </div>
            </div>

            {/* Action Bar for Dinner */}
            <div className="pt-3 border-t border-stone-100 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onOpenEditSlot(
                      'dinner',
                      mealPlan?.dinner?.title || '',
                      mealPlan?.dinner?.recipeId,
                      mealPlan?.dinner?.chefId
                    )
                  }
                  className="duo-btn duo-btn-white px-4 py-2 text-xs font-black rounded-xl"
                >
                  <Pencil className="w-3.5 h-3.5 mr-1" />
                  <span>Gericht / Koch ändern</span>
                </button>

                {dinnerRecipe && (
                  <button
                    type="button"
                    onClick={() => onSelectRecipe(dinnerRecipe)}
                    className="text-xs font-bold text-teal-700 dark:text-teal-400 hover:underline px-2 py-1"
                  >
                    Rezept anzeigen
                  </button>
                )}
              </div>

              {dinnerRecipe && (
                <button
                  type="button"
                  onClick={() => onSyncRecipe(dinnerRecipe)}
                  className="duo-btn duo-btn-green px-5 py-2.5 text-xs font-black rounded-xl shadow-xs flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-4 h-4 stroke-[2.5]" />
                  <span>Zutaten zur Einkaufsliste</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center space-y-3">
            <p className="text-sm font-bold text-stone-500 dark:text-slate-400 capitalize">
              Noch kein Abendessen für {format(focusDay, 'EEEE', { locale: de })} geplant!
            </p>
            <button
              type="button"
              onClick={() => onOpenEditSlot('dinner', '', undefined, undefined)}
              className="duo-btn duo-btn-green px-6 py-2.5 text-xs font-black rounded-xl shadow-xs"
            >
              + Abendessen aus Rezeptbox wählen
            </button>
          </div>
        )}
      </div>

      {/* LUNCH & BREAKFAST */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* LUNCH CARD */}
        <div
          onClick={() =>
            onOpenEditSlot(
              'lunch',
              mealPlan?.lunch?.title || '',
              mealPlan?.lunch?.recipeId,
              mealPlan?.lunch?.chefId
            )
          }
          className="cursor-pointer group duo-card p-4 sm:p-5 bg-white dark:bg-slate-900 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all space-y-3"
        >
          <div className="flex items-center justify-between border-b border-stone-100 dark:border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">🥗</span>
              <h4 className="text-xs font-black text-stone-700 dark:text-slate-300 uppercase tracking-wider">
                Mittagessen
              </h4>
            </div>
            {lunchChef && (
              <span className="text-[11px] font-bold text-stone-600 dark:text-slate-300 bg-stone-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                {lunchChef.avatar} {lunchChef.name}
              </span>
            )}
          </div>

          {mealPlan?.lunch?.title ? (
            <div className="space-y-1">
              <p className="text-base font-black text-stone-900 dark:text-white">
                {mealPlan.lunch.title}
              </p>
              <span className="text-xs text-teal-700 dark:text-teal-400 font-extrabold group-hover:underline block">
                Tippen zum Ändern →
              </span>
            </div>
          ) : (
            <p className="text-xs text-stone-400 italic py-2 group-hover:text-emerald-700 font-bold">
              + Tippen zum Planen oder Reste
            </p>
          )}
        </div>

        {/* BREAKFAST CARD */}
        <div
          onClick={() =>
            onOpenEditSlot(
              'breakfast',
              mealPlan?.breakfast?.title || '',
              mealPlan?.breakfast?.recipeId,
              mealPlan?.breakfast?.chefId
            )
          }
          className="cursor-pointer group duo-card p-4 sm:p-5 bg-white dark:bg-slate-900 hover:border-amber-300 dark:hover:border-amber-700 transition-all space-y-3"
        >
          <div className="flex items-center justify-between border-b border-stone-100 dark:border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">🍳</span>
              <h4 className="text-xs font-black text-stone-700 dark:text-slate-300 uppercase tracking-wider">
                Frühstück
              </h4>
            </div>
            {breakfastChef && (
              <span className="text-[11px] font-bold text-stone-600 dark:text-slate-300 bg-stone-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                {breakfastChef.avatar} {breakfastChef.name}
              </span>
            )}
          </div>

          {mealPlan?.breakfast?.title ? (
            <div className="space-y-1">
              <p className="text-base font-black text-stone-900 dark:text-white">
                {mealPlan.breakfast.title}
              </p>
              <span className="text-xs text-amber-800 dark:text-amber-300 font-extrabold group-hover:underline block">
                Tippen zum Ändern →
              </span>
            </div>
          ) : (
            <p className="text-xs text-stone-400 italic py-2 group-hover:text-amber-700 font-bold">
              + Tippen zum Planen
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
