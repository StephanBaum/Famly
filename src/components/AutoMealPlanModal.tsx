import React, { useState, useEffect } from 'react';
import { Recipe, MealPlanDay } from '../types';
import { RECIPE_THEMES, CURATED_RECIPE_CATALOG } from '../utils/recipeCatalog';
import { ModalPortal } from './ModalPortal';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  X,
  Sparkles,
  RefreshCw,
  Heart,
  Calendar,
  Clock,
  ShoppingCart,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AutoMealPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  weekDays: Date[];
  currentMealPlans: MealPlanDay[];
  recipes: Recipe[];
  onApplyPlan: (
    assignments: Array<{ date: string; recipe: Recipe }>,
    syncGroceries: boolean
  ) => void;
  onToggleFavorite: (recipeId: string) => void;
}

type PlanSourceMode = 'mix' | 'favorites' | 'discover';
type PlanThemeFilter = 'all' | 'healthy' | 'fresh' | 'warming' | 'quick' | 'kids';

interface PlannedDayAssignment {
  dateStr: string;
  dayName: string;
  formattedDate: string;
  recipe: Recipe;
  isAlreadyPlanned: boolean;
}

export const AutoMealPlanModal: React.FC<AutoMealPlanModalProps> = ({
  isOpen,
  onClose,
  weekDays,
  currentMealPlans,
  recipes,
  onApplyPlan,
  onToggleFavorite,
}) => {
  const [sourceMode, setSourceMode] = useState<PlanSourceMode>('mix');
  const [themeFilter, setThemeFilter] = useState<PlanThemeFilter>('all');
  const [onlyEmptyDays, setOnlyEmptyDays] = useState<boolean>(false);
  const [syncToGroceries, setSyncToGroceries] = useState<boolean>(true);

  const [assignments, setAssignments] = useState<PlannedDayAssignment[]>([]);

  // Combined recipe pool: user's recipe box + curated catalog (deduplicated by title)
  const allAvailableRecipes = React.useMemo(() => {
    const existingTitles = new Set(recipes.map((r) => r.title.toLowerCase().trim()));
    const additionalFromCatalog = CURATED_RECIPE_CATALOG.filter(
      (c) => !existingTitles.has(c.title.toLowerCase().trim())
    );
    return [...recipes, ...additionalFromCatalog];
  }, [recipes]);

  // Favorite recipes pool
  const favoriteRecipes = React.useMemo(() => {
    return allAvailableRecipes.filter((r) => r.isFavorite);
  }, [allAvailableRecipes]);

  // Discoverable new recipes (from catalog not in current box, or un-favorited)
  const discoverRecipes = React.useMemo(() => {
    return allAvailableRecipes.filter((r) => !r.isFavorite);
  }, [allAvailableRecipes]);

  // Helper to pick a candidate recipe
  const pickCandidate = (
    mode: PlanSourceMode,
    theme: PlanThemeFilter,
    excludeIds: Set<string>
  ): Recipe => {
    let pool: Recipe[] = [];

    if (mode === 'favorites') {
      pool = favoriteRecipes.length > 0 ? favoriteRecipes : allAvailableRecipes;
    } else if (mode === 'discover') {
      pool = discoverRecipes.length > 0 ? discoverRecipes : allAvailableRecipes;
    } else {
      // mix: 50% chance of favorite if favorites exist
      const pickFav = Math.random() < 0.5 && favoriteRecipes.length > 0;
      pool = pickFav ? favoriteRecipes : discoverRecipes.length > 0 ? discoverRecipes : allAvailableRecipes;
    }

    // Apply theme filter if selected
    if (theme !== 'all') {
      const themeMatches = pool.filter((r) => {
        if (r.theme === theme) return true;
        if (theme === 'quick') {
          return r.category === 'quick' || parseInt(r.prepTime || '30', 10) <= 25;
        }
        if (theme === 'healthy') return r.category === 'healthy';
        if (theme === 'warming') return r.category === 'comfort';
        if (theme === 'kids') return r.category === 'family-favorite';
        return false;
      });
      if (themeMatches.length > 0) {
        pool = themeMatches;
      }
    }

    // Exclude recipes already chosen in this week if possible
    const unpicked = pool.filter((r) => !excludeIds.has(r.id));
    const candidates = unpicked.length > 0 ? unpicked : pool;

    const randomIndex = Math.floor(Math.random() * candidates.length);
    return candidates[randomIndex] || allAvailableRecipes[0];
  };

  // Generate the 7-day assignments
  const generatePlan = () => {
    const chosenIds = new Set<string>();
    const newAssignments: PlannedDayAssignment[] = [];

    weekDays.forEach((day) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const existingPlan = currentMealPlans.find((p) => p.date === dateStr);
      const isAlreadyPlanned = Boolean(existingPlan?.dinner?.title);

      if (onlyEmptyDays && isAlreadyPlanned) {
        // Keep existing recipe
        const existingRecipe = recipes.find((r) => r.id === existingPlan?.dinner?.recipeId);
        const fallbackRecipe: Recipe = existingRecipe || {
          id: `custom_${dateStr}`,
          title: existingPlan?.dinner?.title || 'Bereits geplant',
          prepTime: '30 Min.',
          servings: 5,
          category: 'family-favorite',
          imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
          ingredients: [],
        };
        newAssignments.push({
          dateStr,
          dayName: format(day, 'EEEE', { locale: de }),
          formattedDate: format(day, 'd. MMMM', { locale: de }),
          recipe: fallbackRecipe,
          isAlreadyPlanned: true,
        });
        chosenIds.add(fallbackRecipe.id);
      } else {
        const recipe = pickCandidate(sourceMode, themeFilter, chosenIds);
        chosenIds.add(recipe.id);
        newAssignments.push({
          dateStr,
          dayName: format(day, 'EEEE', { locale: de }),
          formattedDate: format(day, 'd. MMMM', { locale: de }),
          recipe,
          isAlreadyPlanned: false,
        });
      }
    });

    setAssignments(newAssignments);
  };

  // Single-day shuffle: replace one day's recipe
  const handleShuffleSingleDay = (index: number) => {
    setAssignments((prev) => {
      const current = prev[index];
      if (!current) return prev;

      const otherIds = new Set(prev.filter((_, i) => i !== index).map((a) => a.recipe.id));
      otherIds.add(current.recipe.id); // exclude current to get a different one

      const newRecipe = pickCandidate(sourceMode, themeFilter, otherIds);
      const updated = [...prev];
      updated[index] = {
        ...current,
        recipe: newRecipe,
        isAlreadyPlanned: false,
      };
      return updated;
    });
  };

  // Generate on mount or mode/filter change
  useEffect(() => {
    if (isOpen) {
      generatePlan();
    }
  }, [isOpen, sourceMode, themeFilter, onlyEmptyDays]);

  if (!isOpen) return null;

  const handleApply = () => {
    const toApply = assignments.map((a) => ({
      date: a.dateStr,
      recipe: a.recipe,
    }));
    onApplyPlan(toApply, syncToGroceries);
    try {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) {
      // ignore
    }
    onClose();
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl border-2 border-stone-200 dark:border-slate-800 animate-in fade-in zoom-in-95 max-h-[92vh] flex flex-col my-auto overflow-hidden">
          
          {/* Header */}
          <div className="flex items-start justify-between pb-3 border-b border-stone-100 dark:border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 text-white flex items-center justify-center text-2xl shadow-md shrink-0">
                ✨
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-200 border border-teal-300 dark:border-teal-700">
                    Smarter Wochenplaner
                  </span>
                  <span className="text-xs text-stone-500 dark:text-slate-400 font-semibold flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-stone-400" />
                    Woche vom {format(weekDays[0], 'd. MMM', { locale: de })} – {format(weekDays[6], 'd. MMM', { locale: de })}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-stone-900 dark:text-white leading-tight mt-0.5">
                  Woche automatisch mit Rezepten befüllen
                </h3>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-2xl bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 text-stone-500 hover:text-stone-800 dark:text-slate-400 flex items-center justify-center transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto space-y-4 py-3 pr-1">
            
            {/* Step 1: Controls (Source & Theme) */}
            <div className="duo-card p-3 sm:p-4 bg-stone-50/80 dark:bg-slate-800/60 border border-stone-200 dark:border-slate-700 space-y-3">
              
              {/* Row 1: Source Mode */}
              <div>
                <label className="block text-xs font-black text-stone-700 dark:text-slate-300 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                  <span>1. Rezept-Quelle</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSourceMode('mix')}
                    className={`p-2.5 rounded-xl border-2 text-left transition-all ${
                      sourceMode === 'mix'
                        ? 'bg-teal-50 dark:bg-teal-950/70 border-teal-500 text-teal-950 dark:text-teal-100 ring-2 ring-teal-400/40'
                        : 'bg-white dark:bg-slate-900 border-stone-200 dark:border-slate-700 text-stone-600 dark:text-slate-300 hover:bg-stone-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-black text-xs">
                      <span>🎲</span>
                      <span>Bunter Mix (50/50)</span>
                    </div>
                    <p className="text-[11px] text-stone-500 dark:text-slate-400 font-medium mt-0.5">
                      Favoriten gemischt mit neuen Entdeckungen
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSourceMode('favorites')}
                    className={`p-2.5 rounded-xl border-2 text-left transition-all ${
                      sourceMode === 'favorites'
                        ? 'bg-rose-50 dark:bg-rose-950/70 border-rose-500 text-rose-950 dark:text-rose-100 ring-2 ring-rose-400/40'
                        : 'bg-white dark:bg-slate-900 border-stone-200 dark:border-slate-700 text-stone-600 dark:text-slate-300 hover:bg-stone-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-black text-xs text-rose-600 dark:text-rose-400">
                      <span>❤️</span>
                      <span>Nur Favoriten ({favoriteRecipes.length})</span>
                    </div>
                    <p className="text-[11px] text-stone-500 dark:text-slate-400 font-medium mt-0.5">
                      Nur Gerichte, die die Familie liebt
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSourceMode('discover')}
                    className={`p-2.5 rounded-xl border-2 text-left transition-all ${
                      sourceMode === 'discover'
                        ? 'bg-blue-50 dark:bg-blue-950/70 border-blue-500 text-blue-950 dark:text-blue-100 ring-2 ring-blue-400/40'
                        : 'bg-white dark:bg-slate-900 border-stone-200 dark:border-slate-700 text-stone-600 dark:text-slate-300 hover:bg-stone-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-black text-xs text-blue-600 dark:text-blue-400">
                      <span>🔍</span>
                      <span>Neue Entdeckungen</span>
                    </div>
                    <p className="text-[11px] text-stone-500 dark:text-slate-400 font-medium mt-0.5">
                      Frische Abwechslung aus 20+ Rezepten
                    </p>
                  </button>
                </div>
              </div>

              {/* Row 2: Themes / Mood */}
              <div>
                <label className="block text-xs font-black text-stone-700 dark:text-slate-300 uppercase tracking-wide mb-1.5 flex items-center justify-between">
                  <span>2. Thema & Stimmung für die Woche</span>
                  <button
                    type="button"
                    onClick={generatePlan}
                    className="text-teal-600 dark:text-teal-400 hover:underline font-bold text-xs flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Alles neu würfeln</span>
                  </button>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setThemeFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all ${
                      themeFilter === 'all'
                        ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900 border-transparent shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-stone-700 dark:text-slate-300 border-stone-200 dark:border-slate-700 hover:bg-stone-100'
                    }`}
                  >
                    🌈 Bunt gemischt
                  </button>
                  {RECIPE_THEMES.map((th) => {
                    const isSelected = themeFilter === th.id;
                    return (
                      <button
                        key={th.id}
                        type="button"
                        onClick={() => setThemeFilter(th.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? `${th.badgeClass} ring-2 ring-offset-1 shadow-xs`
                            : 'bg-white dark:bg-slate-800 text-stone-700 dark:text-slate-300 border-stone-200 dark:border-slate-700 hover:bg-stone-100'
                        }`}
                      >
                        <span>{th.icon}</span>
                        <span>{th.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Scope toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-stone-200/60 dark:border-slate-700 text-xs">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-stone-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={onlyEmptyDays}
                    onChange={(e) => setOnlyEmptyDays(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span>Bereits geplante Wochentage behalten (nur Lücken füllen)</span>
                </label>
                <span className="text-[11px] text-stone-400 dark:text-slate-500">
                  7 Tage Abendessen
                </span>
              </div>
            </div>

            {/* Step 2: 7-Day Live Preview & Shuffle Cards */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-black text-stone-700 dark:text-slate-300 uppercase tracking-wider">
                  Vorschau für Montag bis Sonntag (klicke 🔄 zum Austauschen einzelner Tage)
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2.5">
                {assignments.map((assignment, idx) => {
                  const r = assignment.recipe;
                  const isFav = Boolean(r.isFavorite);

                  return (
                    <div
                      key={assignment.dateStr}
                      className="duo-card p-2.5 bg-white dark:bg-slate-900 border-2 border-stone-200 dark:border-slate-800 rounded-2xl flex flex-col justify-between hover:border-teal-300 transition-all shadow-xs group relative"
                    >
                      {/* Day Header */}
                      <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-stone-100 dark:border-slate-800">
                        <div>
                          <span className="block text-xs font-black text-stone-900 dark:text-white leading-tight">
                            {assignment.dayName.slice(0, 2)}
                          </span>
                          <span className="block text-[10px] font-bold text-stone-400">
                            {format(new Date(assignment.dateStr), 'd.M.')}
                          </span>
                        </div>

                        {/* 🔄 Single Day Shuffle button */}
                        <button
                          type="button"
                          onClick={() => handleShuffleSingleDay(idx)}
                          title="Anderes Gericht für diesen Tag würfeln"
                          className="w-6 h-6 rounded-lg bg-stone-100 dark:bg-slate-800 hover:bg-teal-100 dark:hover:bg-teal-950/70 text-stone-500 hover:text-teal-700 dark:text-slate-400 dark:hover:text-teal-300 flex items-center justify-center transition-colors"
                        >
                          <RefreshCw className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Recipe Image & Title */}
                      <div className="space-y-1.5">
                        <div className="relative h-20 w-full rounded-xl overflow-hidden bg-stone-100 dark:bg-slate-800">
                          <img
                            src={r.imageUrl}
                            alt={r.title}
                            onError={(e) => {
                              // Fallback on image failure
                              e.currentTarget.src =
                                'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
                            }}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                          {/* Heart Favorite Toggle Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleFavorite(r.id);
                              // also update locally in assignment
                              setAssignments((prev) =>
                                prev.map((a, i) =>
                                  i === idx
                                    ? { ...a, recipe: { ...a.recipe, isFavorite: !a.recipe.isFavorite } }
                                    : a
                                )
                              );
                            }}
                            title={isFav ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
                            className={`absolute top-1 right-1 w-6 h-6 rounded-lg flex items-center justify-center backdrop-blur-xs transition-all ${
                              isFav
                                ? 'bg-rose-500 text-white shadow-xs'
                                : 'bg-black/50 text-white/80 hover:text-white hover:bg-black/70'
                            }`}
                          >
                            <Heart
                              className={`w-3 h-3 ${isFav ? 'fill-white stroke-white' : 'stroke-white'}`}
                            />
                          </button>

                          {/* Time badge */}
                          <div className="absolute bottom-1 left-1.5 text-[9px] font-bold text-white flex items-center gap-0.5 bg-black/60 px-1.5 py-0.2 rounded-md">
                            <Clock className="w-2.5 h-2.5 text-amber-300" />
                            <span>{r.prepTime}</span>
                          </div>
                        </div>

                        <div>
                          <h5
                            className="text-xs font-black text-stone-900 dark:text-white line-clamp-2 leading-tight"
                            title={r.title}
                          >
                            {r.title}
                          </h5>
                          <span className="text-[10px] text-stone-400 dark:text-slate-400 mt-0.5 block">
                            {r.ingredients.length} Zutaten
                          </span>
                        </div>
                      </div>

                      {/* Source tag */}
                      <div className="mt-2 pt-1.5 border-t border-stone-100 dark:border-slate-800 flex items-center justify-between text-[10px] font-bold">
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
                          <span className="text-[9px] text-amber-600 font-black">Fix</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Footer actions */}
          <div className="pt-3 border-t border-stone-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-black text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <input
                type="checkbox"
                checked={syncToGroceries}
                onChange={(e) => setSyncToGroceries(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Alle benötigten Zutaten direkt auf die Einkaufsliste setzen</span>
            </label>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="duo-btn duo-btn-white px-4 py-2 text-xs font-bold rounded-xl"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="duo-btn duo-btn-green px-6 py-2.5 text-xs font-black rounded-xl shadow-md flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 stroke-[2.5]" />
                <span>Wochenplan übernehmen ✨</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </ModalPortal>
  );
};
