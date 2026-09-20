import React, { useState } from 'react';
import { useFamily } from '../context/FamilyContext';
import { Recipe } from '../types';
import {
  Utensils,
  Clock,
  Users,
  ShoppingCart,
  BookOpen,
  Calendar,
  Sparkles,
  ExternalLink,
  Search,
  ChefHat,
  Plus,
  X,
  Pencil,
  Trash2,
  Heart,
} from 'lucide-react';
import { format, addDays, startOfWeek } from 'date-fns';
import { de } from 'date-fns/locale';
import { RecipeImportModal } from '../components/RecipeImportModal';
import { RecipeEditModal } from '../components/RecipeEditModal';
import { AutoMealPlanModal } from '../components/AutoMealPlanModal';
import { ModalPortal } from '../components/ModalPortal';

// Robust food photo fallback helper
const getRecipePhoto = (recipe: Recipe): string => {
  if (
    recipe.imageUrl &&
    recipe.imageUrl.startsWith('http') &&
    !recipe.imageUrl.includes('photo-1621996346565-e3d5d6281057')
  ) {
    return recipe.imageUrl;
  }
  const t = (recipe.title || '').toLowerCase();
  if (t.includes('pasta') || t.includes('spaghetti') || t.includes('fettuccine') || t.includes('zitronen')) {
    return 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=600&q=80';
  }
  if (t.includes('pizza')) {
    return 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=600&q=80';
  }
  if (t.includes('curry') || t.includes('thai') || t.includes('noodle')) {
    return 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=600&q=80';
  }
  if (t.includes('salmon') || t.includes('fish') || t.includes('lachs')) {
    return 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80';
  }
  if (t.includes('pancake') || t.includes('cake') || t.includes('strudel') || t.includes('baking') || t.includes('kuchen')) {
    return 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=600&q=80';
  }
  if (t.includes('taco') || t.includes('burrito') || t.includes('mexican')) {
    return 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=600&q=80';
  }
  if (t.includes('spätzle') || t.includes('kaesspatzen')) {
    return 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=600&q=80';
  }
  return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
};

// Duolingo-styled category pill badge styling
const getCategoryBadge = (category?: Recipe['category']) => {
  switch (category) {
    case 'quick':
      return { label: 'Schnell', icon: '⚡', bg: 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700' };
    case 'comfort':
      return { label: 'Hausmannskost', icon: '🍲', bg: 'bg-orange-100 dark:bg-orange-950/60 text-orange-900 dark:text-orange-200 border-orange-300 dark:border-orange-700' };
    case 'healthy':
      return { label: 'Gesund', icon: '🥗', bg: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700' };
    case 'baking':
      return { label: 'Backen', icon: '🥐', bg: 'bg-pink-100 dark:bg-pink-950/60 text-pink-900 dark:text-pink-200 border-pink-300 dark:border-pink-700' };
    default:
      return { label: 'Favorit', icon: '🌟', bg: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 border-indigo-300 dark:border-indigo-700' };
  }
};

const CUSTOM_DISH_SUGGESTIONS = [
  { title: 'Pizza vom Vortag & Salat', icon: '🍕' },
  { title: 'Asiatisch / Nudeln to-go', icon: '🍜' },
  { title: 'Warme Paninis & Suppe', icon: '🥪' },
  { title: 'Frischer bunter Familiensalat', icon: '🥗' },
  { title: 'Pasta mit Knoblauch & Olivenöl', icon: '🍝' },
  { title: 'Selbstgemachte Freitag-Burger', icon: '🍔' },
];

export const MealPlannerView: React.FC = () => {
  const {
    members,
    recipes,
    mealPlans,
    setMealSlot,
    addRecipeIngredientsToGrocery,
    addMultipleRecipesToGrocery,
    updateRecipe,
    deleteRecipe,
    toggleFavoriteRecipe,
    addRecipe,
  } = useFamily();

  const [activeTab, setActiveTab] = useState<'week' | 'recipes'>('week');
  const [selectedRecipeForModal, setSelectedRecipeForModal] = useState<Recipe | null>(null);
  const [recipeToEdit, setRecipeToEdit] = useState<Recipe | null>(null);
  const [recipeToDelete, setRecipeToDelete] = useState<Recipe | null>(null);
  const [editingSlot, setEditingSlot] = useState<{
    date: string;
    slot: 'breakfast' | 'lunch' | 'dinner';
    currentTitle: string;
    currentRecipeId?: string;
    currentChefId?: string;
  } | null>(null);

  const [slotPickerTab, setSlotPickerTab] = useState<'box' | 'custom'>('box');
  const [slotCategoryFilter, setSlotCategoryFilter] = useState<string>('all');
  const [slotSearchQuery, setSlotSearchQuery] = useState<string>('');

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAutoPlanModalOpen, setIsAutoPlanModalOpen] = useState(false);
  const [recipeBoxFilter, setRecipeBoxFilter] = useState<'all' | 'favorites' | 'quick' | 'comfort' | 'healthy' | 'baking'>('all');
  const [recipeBoxSearch, setRecipeBoxSearch] = useState<string>('');
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // 7 days of the current week starting from Monday
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Day Focus for mobile vs Full 7-Day Week
  const todayDateStr = format(new Date(), 'yyyy-MM-dd');
  const todayIdx = weekDays.findIndex((d) => format(d, 'yyyy-MM-dd') === todayDateStr);
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(todayIdx >= 0 ? todayIdx : 0);
  const [plannerMode, setPlannerMode] = useState<'focus' | 'grid'>('focus');

  const handleSyncRecipe = (recipe: Recipe) => {
    const result = addRecipeIngredientsToGrocery(recipe);
    if (result.skippedCount > 0) {
      setSyncFeedback(
        `${result.addedCount} Zutaten auf die Einkaufsliste gesetzt! ${result.skippedCount} Standard-Vorräte übersprungen (${result.skippedNames.join(', ')}) 🧂`
      );
    } else {
      setSyncFeedback(`${result.addedCount} Zutaten auf deine Einkaufsliste gesetzt! 🛒`);
    }
    setTimeout(() => setSyncFeedback(null), 5000);
  };

  const handleApplyAutoPlan = (
    assignments: Array<{ date: string; recipe: Recipe }>,
    syncGroceries: boolean
  ) => {
    const recipesToSync: Recipe[] = [];
    assignments.forEach(({ date, recipe }) => {
      // If recipe is not already in the family recipes library, persist it
      if (!recipes.some((r) => r.id === recipe.id)) {
        addRecipe(recipe);
      }
      setMealSlot(date, 'dinner', {
        title: recipe.title,
        recipeId: recipe.id,
      });
      recipesToSync.push(recipe);
    });

    if (syncGroceries) {
      const syncRes = addMultipleRecipesToGrocery(recipesToSync);
      setSyncFeedback(
        `Wochenplan gezaubert! 7 Tage belegt & ${syncRes.addedCount} Zutaten (~${syncRes.estimatedTotalCost} €) gebündelt auf die Einkaufsliste gesetzt! 🪄🛒`
      );
    } else {
      setSyncFeedback(`Wochenplan gezaubert! 7 Tage abwechslungsreich belegt! 🪄`);
    }
    setTimeout(() => setSyncFeedback(null), 5000);
  };

  const handleSlotSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlot || !editingSlot.currentTitle.trim()) return;

    setMealSlot(editingSlot.date, editingSlot.slot, {
      title: editingSlot.currentTitle.trim(),
      recipeId: editingSlot.currentRecipeId || undefined,
      chefId: editingSlot.currentChefId || undefined,
    });
    setEditingSlot(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="duo-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 border-2 border-stone-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold">
            <Utensils className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-stone-900 dark:text-white">Familien-Essensplan</h2>
            <p className="text-xs font-semibold text-stone-500 dark:text-slate-400">
              Wochenmenüs, Rezeptkarten & automatische Einkaufslisten abstimmen
            </p>
          </div>
        </div>

        {/* Tab switch & Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-stone-100 dark:bg-slate-800 p-1.5 rounded-2xl border-2 border-stone-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('week')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'week'
                  ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-xs'
                  : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Wochenplan</span>
            </button>
            <button
              onClick={() => setActiveTab('recipes')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'recipes'
                  ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-xs'
                  : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Rezeptbox ({recipes.length})</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsAutoPlanModalOpen(true)}
            className="duo-btn duo-btn-purple px-3.5 py-2 text-xs font-black rounded-2xl flex items-center gap-1.5 shadow-sm whitespace-nowrap shrink-0"
            title="Woche automatisch mit Lieblingsgerichten oder Entdeckungen füllen"
          >
            <Sparkles className="w-4 h-4 fill-white stroke-[2.5]" />
            <span>Woche zaubern ✨</span>
          </button>

          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="duo-btn duo-btn-green px-3.5 py-2 text-xs font-black rounded-2xl flex items-center gap-1.5 shadow-sm whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Rezept hinzufügen</span>
          </button>
        </div>
      </div>

      {/* Sync Feedback Toast */}
      {syncFeedback && (
        <div className="duo-card p-4 bg-emerald-50 dark:bg-emerald-950/50 border-2 border-emerald-300 dark:border-emerald-700 text-xs font-black text-emerald-900 dark:text-emerald-200 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <span>{syncFeedback}</span>
          <button
            onClick={() => setSyncFeedback(null)}
            className="text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 ml-2 font-black"
          >
            ✕
          </button>
        </div>
      )}

      {/* WEEKLY BOARD TAB */}
      {activeTab === 'week' && (
        <div className="space-y-4">
          
          {/* Day Strip & View Layout Toggle */}
          <div className="duo-card bg-white dark:bg-slate-900 p-3 sm:p-4 border-2 border-stone-200 dark:border-slate-800 space-y-3 shadow-xs">
            {/* Header: Week Title & Mode Switcher */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-black text-stone-500 dark:text-slate-400 uppercase tracking-wider">
                Woche: {format(weekDays[0], 'd. MMM', { locale: de })} – {format(weekDays[6], 'd. MMM', { locale: de })}
              </span>

              {/* Mode Switcher: Focus Day vs Full Week Grid */}
              <div className="flex items-center gap-1 bg-stone-100 dark:bg-slate-800 p-1 rounded-xl border border-stone-200 dark:border-slate-700 shrink-0">
                <button
                  type="button"
                  onClick={() => setPlannerMode('focus')}
                  className={`px-2.5 sm:px-3 py-1 text-xs font-black rounded-lg transition-all ${
                    plannerMode === 'focus'
                      ? 'bg-white dark:bg-slate-700 text-teal-800 dark:text-teal-200 shadow-xs'
                      : 'text-stone-500 dark:text-slate-400 hover:text-stone-800'
                  }`}
                >
                  ⭐ Fokus-Tag
                </button>
                <button
                  type="button"
                  onClick={() => setPlannerMode('grid')}
                  className={`px-2.5 sm:px-3 py-1 text-xs font-black rounded-lg transition-all ${
                    plannerMode === 'grid'
                      ? 'bg-white dark:bg-slate-700 text-teal-800 dark:text-teal-200 shadow-xs'
                      : 'text-stone-500 dark:text-slate-400 hover:text-stone-800'
                  }`}
                >
                  📅 7-Tage-Raster
                </button>
              </div>
            </div>

            {/* 7-Day Responsive Grid (Never clips Saturday/Sunday!) */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2 w-full">
              {weekDays.map((day, idx) => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const isToday = dateStr === todayDateStr;
                const isSelected = idx === selectedDayIdx && plannerMode === 'focus';
                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => {
                      setSelectedDayIdx(idx);
                      setPlannerMode('focus');
                    }}
                    className={`flex flex-col items-center justify-center py-2 px-1 sm:px-2 rounded-xl border-2 transition-all min-w-0 ${
                      isSelected
                        ? 'bg-teal-600 text-white border-teal-700 shadow-xs'
                        : isToday
                        ? 'bg-teal-50 dark:bg-teal-950/50 text-teal-900 dark:text-teal-200 border-teal-300 dark:border-teal-700 font-extrabold'
                        : 'bg-stone-50 dark:bg-slate-800 text-stone-600 dark:text-slate-300 border-stone-200 dark:border-slate-700 hover:bg-stone-100 font-bold'
                    }`}
                  >
                    <span className="text-[10px] sm:text-xs uppercase tracking-wider truncate w-full text-center">
                      {isToday ? '★ Heute' : format(day, 'EEE', { locale: de })}
                    </span>
                    <span className="text-xs sm:text-sm font-black truncate w-full text-center">
                      <span className="sm:hidden">{format(day, 'd.', { locale: de })}</span>
                      <span className="hidden sm:inline">{format(day, 'd. MMM', { locale: de })}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* MODE 1: DAY FOCUS */}
          {plannerMode === 'focus' && (() => {
            const focusDay = weekDays[selectedDayIdx] || weekDays[0];
            const dateStr = format(focusDay, 'yyyy-MM-dd');
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

                  {dayPlan?.dinner?.title ? (
                    <div className="p-5 space-y-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        {dinnerRecipe && (
                          <img
                            src={getRecipePhoto(dinnerRecipe)}
                            alt={dayPlan.dinner.title}
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
                              {dayPlan.dinner.title}
                            </h4>
                            {dinnerRecipe && (
                              <button
                                type="button"
                                onClick={() => toggleFavoriteRecipe(dinnerRecipe.id)}
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
                            onClick={() => {
                              setEditingSlot({
                                date: dateStr,
                                slot: 'dinner',
                                currentTitle: dayPlan?.dinner?.title || '',
                                currentRecipeId: dayPlan?.dinner?.recipeId,
                                currentChefId: dayPlan?.dinner?.chefId,
                              });
                              setSlotPickerTab(dayPlan?.dinner?.recipeId ? 'box' : 'custom');
                              setSlotCategoryFilter('all');
                              setSlotSearchQuery('');
                            }}
                            className="duo-btn duo-btn-white px-4 py-2 text-xs font-black rounded-xl"
                          >
                            <Pencil className="w-3.5 h-3.5 mr-1" />
                            <span>Gericht / Koch ändern</span>
                          </button>

                          {dinnerRecipe && (
                            <button
                              type="button"
                              onClick={() => setSelectedRecipeForModal(dinnerRecipe)}
                              className="text-xs font-bold text-teal-700 dark:text-teal-400 hover:underline px-2 py-1"
                            >
                              Rezept anzeigen
                            </button>
                          )}
                        </div>

                        {dinnerRecipe && (
                          <button
                            type="button"
                            onClick={() => handleSyncRecipe(dinnerRecipe)}
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
                        onClick={() => {
                          setEditingSlot({
                            date: dateStr,
                            slot: 'dinner',
                            currentTitle: '',
                            currentRecipeId: undefined,
                            currentChefId: undefined,
                          });
                          setSlotPickerTab('box');
                          setSlotCategoryFilter('all');
                          setSlotSearchQuery('');
                        }}
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
                    onClick={() => {
                      setEditingSlot({
                        date: dateStr,
                        slot: 'lunch',
                        currentTitle: dayPlan?.lunch?.title || '',
                        currentRecipeId: dayPlan?.lunch?.recipeId,
                        currentChefId: dayPlan?.lunch?.chefId,
                      });
                      setSlotPickerTab(dayPlan?.lunch?.recipeId ? 'box' : 'custom');
                      setSlotCategoryFilter('all');
                      setSlotSearchQuery('');
                    }}
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

                    {dayPlan?.lunch?.title ? (
                      <div className="space-y-1">
                        <p className="text-base font-black text-stone-900 dark:text-white">
                          {dayPlan.lunch.title}
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
                    onClick={() => {
                      setEditingSlot({
                        date: dateStr,
                        slot: 'breakfast',
                        currentTitle: dayPlan?.breakfast?.title || '',
                        currentRecipeId: dayPlan?.breakfast?.recipeId,
                        currentChefId: dayPlan?.breakfast?.chefId,
                      });
                      setSlotPickerTab(dayPlan?.breakfast?.recipeId ? 'box' : 'custom');
                      setSlotCategoryFilter('all');
                      setSlotSearchQuery('');
                    }}
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

                    {dayPlan?.breakfast?.title ? (
                      <div className="space-y-1">
                        <p className="text-base font-black text-stone-900 dark:text-white">
                          {dayPlan.breakfast.title}
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
          })()}

          {/* MODE 2: FULL 7-DAY GRID */}
          {plannerMode === 'grid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-3 animate-in fade-in">
              {weekDays.map((day) => {
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
                        onClick={() => {
                          setEditingSlot({
                            date: dateStr,
                            slot: 'dinner',
                            currentTitle: dayPlan?.dinner?.title || '',
                            currentRecipeId: dayPlan?.dinner?.recipeId,
                            currentChefId: dayPlan?.dinner?.chefId,
                          });
                          setSlotPickerTab(dayPlan?.dinner?.recipeId ? 'box' : dayPlan?.dinner?.title ? 'custom' : 'box');
                          setSlotCategoryFilter('all');
                          setSlotSearchQuery('');
                        }}
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
                                    toggleFavoriteRecipe(dinnerRecipe.id);
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
                        onClick={() => {
                          setEditingSlot({
                            date: dateStr,
                            slot: 'lunch',
                            currentTitle: dayPlan?.lunch?.title || '',
                            currentRecipeId: dayPlan?.lunch?.recipeId,
                            currentChefId: dayPlan?.lunch?.chefId,
                          });
                          setSlotPickerTab(dayPlan?.lunch?.recipeId ? 'box' : dayPlan?.lunch?.title ? 'custom' : 'box');
                          setSlotCategoryFilter('all');
                          setSlotSearchQuery('');
                        }}
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
                        onClick={() => {
                          setEditingSlot({
                            date: dateStr,
                            slot: 'breakfast',
                            currentTitle: dayPlan?.breakfast?.title || '',
                            currentRecipeId: dayPlan?.breakfast?.recipeId,
                            currentChefId: dayPlan?.breakfast?.chefId,
                          });
                          setSlotPickerTab(dayPlan?.breakfast?.recipeId ? 'box' : dayPlan?.breakfast?.title ? 'custom' : 'box');
                          setSlotCategoryFilter('all');
                          setSlotSearchQuery('');
                        }}
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
                          onClick={() => setSelectedRecipeForModal(dinnerRecipe)}
                          className="text-[11px] font-bold text-teal-700 dark:text-teal-400 hover:text-teal-950 underline"
                        >
                          Rezept
                        </button>
                        <button
                          onClick={() => handleSyncRecipe(dinnerRecipe)}
                          title="Zutaten zur Einkaufsliste hinzufügen"
                          className="text-[10px] font-black text-teal-700 dark:text-teal-300 hover:text-teal-900 flex items-center gap-1 bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-teal-200 dark:border-teal-800 shadow-2xs active:translate-y-0.5 transition-all"
                        >
                          <ShoppingCart className="w-3 h-3" />
                          <span>Auf Liste</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* RECIPE BOX TAB */}
      {activeTab === 'recipes' && (() => {
        const favoritesCount = recipes.filter((r) => r.isFavorite).length;
        const filteredRecipes = recipes.filter((r) => {
          const matchesFilter =
            recipeBoxFilter === 'all'
              ? true
              : recipeBoxFilter === 'favorites'
              ? Boolean(r.isFavorite)
              : recipeBoxFilter === 'quick'
              ? r.category === 'quick' || parseInt(r.prepTime || '30', 10) <= 25
              : r.category === recipeBoxFilter;

          const q = recipeBoxSearch.toLowerCase().trim();
          const matchesSearch =
            !q ||
            r.title.toLowerCase().includes(q) ||
            (r.notes && r.notes.toLowerCase().includes(q)) ||
            r.ingredients.some((ing) => ing.name.toLowerCase().includes(q));

          return matchesFilter && matchesSearch;
        });

        return (
          <div className="space-y-4">
            {/* Filter & Search Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border-2 border-stone-200 dark:border-slate-800 shadow-xs">
              {/* Category & Favorite Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { id: 'all', label: `Alle (${recipes.length})`, icon: '✨' },
                  { id: 'favorites', label: `Favoriten (${favoritesCount})`, icon: '❤️' },
                  { id: 'quick', label: 'Schnell (<30m)', icon: '⚡' },
                  { id: 'comfort', label: 'Hausmannskost', icon: '🍲' },
                  { id: 'healthy', label: 'Gesund', icon: '🥗' },
                  { id: 'baking', label: 'Backen', icon: '🥐' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setRecipeBoxFilter(tab.id as any)}
                    className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 border ${
                      recipeBoxFilter === tab.id
                        ? tab.id === 'favorites'
                          ? 'bg-rose-500 text-white border-rose-600 shadow-xs'
                          : 'bg-teal-600 text-white border-teal-700 shadow-xs'
                        : 'bg-stone-50 dark:bg-slate-800 text-stone-600 dark:text-slate-300 border-stone-200 dark:border-slate-700 hover:bg-stone-100 dark:hover:bg-slate-750'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Search Field */}
              <div className="relative min-w-[200px] w-full sm:w-auto">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Rezepte oder Zutaten..."
                  value={recipeBoxSearch}
                  onChange={(e) => setRecipeBoxSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:border-teal-500 text-stone-900 dark:text-white"
                />
                {recipeBoxSearch && (
                  <button
                    type="button"
                    onClick={() => setRecipeBoxSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-600 font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Recipes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRecipes.map((recipe) => (
                <div
                  key={recipe.id}
                  className="duo-card bg-white dark:bg-slate-900 border-2 border-stone-200 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow group relative"
                >
                  <div>
                    <div className="relative h-44 overflow-hidden">
                      <img
                        src={getRecipePhoto(recipe)}
                        alt={recipe.title}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                      {/* Category Pill */}
                      <div className="absolute top-3 left-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-stone-800 dark:text-white shadow-xs capitalize">
                        {recipe.category}
                      </div>

                      {/* Top Right Action Icons: Favorite + Edit + Delete */}
                      <div className="absolute top-3 right-3 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavoriteRecipe(recipe.id);
                          }}
                          className={`p-1.5 rounded-xl shadow-sm backdrop-blur-xs transition-all active:scale-95 ${
                            recipe.isFavorite
                              ? 'bg-rose-500 text-white hover:bg-rose-600'
                              : 'bg-white/90 dark:bg-slate-800/90 hover:bg-white text-stone-600 dark:text-slate-300 hover:text-rose-500'
                          }`}
                          title={recipe.isFavorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen ❤️'}
                        >
                          <Heart className={`w-3.5 h-3.5 ${recipe.isFavorite ? 'fill-white' : ''}`} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRecipeToEdit(recipe);
                          }}
                          className="p-1.5 rounded-xl bg-white/90 dark:bg-slate-800/90 hover:bg-white text-stone-700 dark:text-slate-200 hover:text-teal-700 shadow-sm backdrop-blur-xs transition-all active:scale-95"
                          title="Rezept bearbeiten"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRecipeToDelete(recipe);
                          }}
                          className="p-1.5 rounded-xl bg-white/90 dark:bg-slate-800/90 hover:bg-white text-stone-700 dark:text-slate-200 hover:text-rose-600 shadow-sm backdrop-blur-xs transition-all active:scale-95"
                          title="Rezept löschen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Time badge */}
                      <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-white flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-300" />
                        <span>{recipe.prepTime}</span>
                      </div>
                    </div>

                    <div className="p-5 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-black text-stone-900 dark:text-white text-base leading-snug">
                          {recipe.title}
                        </h3>
                        {recipe.isFavorite && (
                          <span className="text-rose-500 text-xs shrink-0" title="Favorit">
                            ❤️
                          </span>
                        )}
                      </div>
                      {recipe.notes && (
                        <p className="text-xs text-stone-600 dark:text-slate-300 line-clamp-2">{recipe.notes}</p>
                      )}

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {recipe.ingredients.slice(0, 4).map((ing, i) => (
                          <span
                            key={i}
                            className="text-[11px] bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300 px-2 py-0.5 rounded-md font-medium"
                          >
                            {ing.name}
                          </span>
                        ))}
                        {recipe.ingredients.length > 4 && (
                          <span className="text-[11px] bg-stone-100 dark:bg-slate-800 text-stone-400 dark:text-slate-500 px-1.5 py-0.5 rounded-md font-medium">
                            +{recipe.ingredients.length - 4} weitere
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action bar */}
                  <div className="px-5 py-3.5 bg-stone-50/70 dark:bg-slate-800/80 border-t border-stone-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedRecipeForModal(recipe)}
                        className="text-xs font-bold text-stone-700 dark:text-slate-300 hover:text-stone-900 dark:hover:text-white underline"
                      >
                        Details ({recipe.ingredients.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setRecipeToEdit(recipe)}
                        className="text-xs font-bold text-teal-700 dark:text-teal-300 hover:text-teal-900 flex items-center gap-1 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-teal-200 dark:border-teal-700 shadow-2xs"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>Bearbeiten</span>
                      </button>
                    </div>
                    <button
                      onClick={() => handleSyncRecipe(recipe)}
                      className="duo-btn duo-btn-green px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Einkaufsliste</span>
                    </button>
                  </div>
                </div>
              ))}

              {filteredRecipes.length === 0 && (
                <div className="col-span-full p-12 text-center duo-card bg-white dark:bg-slate-900 border-2 border-dashed border-stone-200 dark:border-slate-800 rounded-3xl">
                  <span className="text-4xl block mb-2">
                    {recipeBoxFilter === 'favorites' ? '❤️' : '🍳'}
                  </span>
                  <h4 className="text-base font-black text-stone-900 dark:text-white">
                    {recipeBoxFilter === 'favorites'
                      ? 'Noch keine Lieblingsrezepte markiert'
                      : 'Keine passenden Rezepte gefunden'}
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                    {recipeBoxFilter === 'favorites'
                      ? 'Klicke auf das Herz-Symbol bei einem beliebigen Rezept, um es als Familien-Favoriten zu speichern!'
                      : 'Passe die Filter oder den Suchbegriff an oder erstelle ein neues Rezept.'}
                  </p>
                  <div className="flex items-center justify-center gap-3 mt-4">
                    {recipeBoxFilter !== 'all' && (
                      <button
                        type="button"
                        onClick={() => {
                          setRecipeBoxFilter('all');
                          setRecipeBoxSearch('');
                        }}
                        className="duo-btn duo-btn-white px-4 py-2 text-xs font-bold rounded-xl"
                      >
                        Filter zurücksetzen
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsImportModalOpen(true)}
                      className="duo-btn duo-btn-white px-4 py-2 text-xs font-bold rounded-xl"
                    >
                      Link importieren
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecipeToEdit({} as any)}
                      className="duo-btn duo-btn-green px-4 py-2 text-xs font-black rounded-xl"
                    >
                      + Rezept erstellen
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Edit Slot Modal */}
      {editingSlot && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl border-2 border-stone-200 dark:border-slate-800 animate-in fade-in zoom-in-95 max-h-[92vh] flex flex-col my-auto">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-stone-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-xs shrink-0 ${
                    editingSlot.slot === 'breakfast'
                      ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border-b-4 border-amber-300'
                      : editingSlot.slot === 'lunch'
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border-b-4 border-emerald-300'
                      : 'bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-200 border-b-4 border-teal-300'
                  }`}
                >
                  {editingSlot.slot === 'breakfast' ? '🍳' : editingSlot.slot === 'lunch' ? '🥗' : '🍲'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full border ${
                        editingSlot.slot === 'breakfast'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : editingSlot.slot === 'lunch'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-teal-50 text-teal-700 border-teal-200'
                      }`}
                    >
                      {editingSlot.slot === 'breakfast' ? 'Frühstück' : editingSlot.slot === 'lunch' ? 'Mittagessen' : 'Abendessen'}
                    </span>
                    <span className="text-xs text-stone-500 dark:text-slate-400 font-semibold flex items-center gap-1 capitalize">
                      <Calendar className="w-3 h-3 text-stone-400" />
                      {format(new Date(editingSlot.date), 'EEEE, d. MMMM', { locale: de })}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-stone-900 dark:text-white leading-tight mt-0.5">
                    Was gibt es zu essen?
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingSlot(null)}
                className="w-9 h-9 rounded-2xl bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 text-stone-500 hover:text-stone-800 dark:text-slate-400 flex items-center justify-center transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex items-center bg-stone-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-stone-200/80 dark:border-slate-700 my-3 shrink-0">
              <button
                type="button"
                onClick={() => setSlotPickerTab('box')}
                className={`flex-1 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all ${
                  slotPickerTab === 'box'
                    ? 'bg-white dark:bg-slate-700 text-teal-800 dark:text-teal-200 shadow-xs border border-stone-200 dark:border-slate-600'
                    : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                <BookOpen className="w-4 h-4 text-teal-600" />
                <span>Aus Rezeptbox wählen ({recipes.length})</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSlotPickerTab('custom');
                  setEditingSlot({
                    ...editingSlot,
                    currentRecipeId: undefined,
                  });
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all ${
                  slotPickerTab === 'custom'
                    ? 'bg-white dark:bg-slate-700 text-teal-800 dark:text-teal-200 shadow-xs border border-stone-200 dark:border-slate-600'
                    : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                <span>✏️ Eigenes Gericht / Reste</span>
              </button>
            </div>

            {/* Main Form Content */}
            <form onSubmit={handleSlotSave} className="flex-1 overflow-y-auto space-y-4 pr-1 flex flex-col justify-between">
              
              <div className="space-y-4">
                {/* TAB 1: VISUAL RECIPE BOX PICKER */}
                {slotPickerTab === 'box' ? (
                  <div className="space-y-3">
                    {/* Search and Category Filter Pills */}
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={slotSearchQuery}
                          onChange={(e) => setSlotSearchQuery(e.target.value)}
                          placeholder="Rezepttitel, Kategorie oder Zutaten suchen..."
                          className="w-full pl-9 pr-8 py-2 rounded-xl border border-stone-200 dark:border-slate-700 text-xs font-semibold focus:outline-none bg-stone-50/60 dark:bg-slate-800 text-stone-900 dark:text-white"
                        />
                        {slotSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setSlotSearchQuery('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Category Pills */}
                      <div className="flex items-center gap-1.5 flex-wrap pb-1 text-xs">
                        {[
                          { id: 'all', label: `Alle (${recipes.length})`, icon: '✨' },
                          { id: 'favorites', label: `Favoriten (${recipes.filter((r) => r.isFavorite).length})`, icon: '❤️' },
                          { id: 'quick', label: 'Schnell (<30m)', icon: '⚡' },
                          { id: 'comfort', label: 'Hausmannskost', icon: '🍲' },
                          { id: 'healthy', label: 'Gesund', icon: '🥗' },
                          { id: 'baking', label: 'Backen', icon: '🥐' },
                        ].map((tab) => (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setSlotCategoryFilter(tab.id)}
                            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap text-xs transition-all flex items-center gap-1.5 border ${
                              slotCategoryFilter === tab.id
                                ? tab.id === 'favorites'
                                  ? 'bg-rose-500 text-white border-rose-600 shadow-xs'
                                  : 'bg-teal-600 text-white border-teal-700 shadow-xs'
                                : 'bg-white dark:bg-slate-800 text-stone-600 dark:text-slate-300 border-stone-200 dark:border-slate-700 hover:bg-stone-100'
                            }`}
                          >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Visual Grid of Recipes */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto p-1.5 border border-stone-200/90 dark:border-slate-700 rounded-2xl bg-stone-50/50 dark:bg-slate-800/40">
                      {recipes
                        .filter((r) => {
                          const matchesCat =
                            slotCategoryFilter === 'all'
                              ? true
                              : slotCategoryFilter === 'favorites'
                              ? Boolean(r.isFavorite)
                              : slotCategoryFilter === 'quick'
                              ? r.category === 'quick' || parseInt(r.prepTime || '30', 10) <= 25
                              : r.category === slotCategoryFilter;

                          const q = slotSearchQuery.toLowerCase().trim();
                          const matchesSearch =
                            !q ||
                            r.title.toLowerCase().includes(q) ||
                            (r.notes && r.notes.toLowerCase().includes(q)) ||
                            r.ingredients.some((ing) => ing.name.toLowerCase().includes(q));

                          return matchesCat && matchesSearch;
                        })
                        .map((r) => {
                          const isSelected = editingSlot.currentRecipeId === r.id;
                          const cat = getCategoryBadge(r.category);
                          const photo = getRecipePhoto(r);
                          return (
                            <div
                              key={r.id}
                              onClick={() => {
                                setEditingSlot({
                                  ...editingSlot,
                                  currentTitle: r.title,
                                  currentRecipeId: r.id,
                                });
                              }}
                              className={`group cursor-pointer text-left rounded-2xl border-2 transition-all overflow-hidden flex flex-col relative ${
                                isSelected
                                  ? 'bg-teal-50/90 dark:bg-teal-950/60 border-teal-500 shadow-md ring-2 ring-teal-400/50 border-b-4 border-b-teal-600 scale-[1.01]'
                                  : 'bg-white dark:bg-slate-900 border-stone-200 dark:border-slate-800 hover:border-teal-300 hover:shadow-md border-b-4 hover:-translate-y-0.5'
                              }`}
                            >
                              {/* Photo Header */}
                              <div className="relative h-28 w-full overflow-hidden bg-stone-200 dark:bg-slate-800">
                                <img
                                  src={photo}
                                  alt={r.title}
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).src =
                                      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
                                  }}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                                {/* Category Badge */}
                                <div className="absolute top-2 left-2">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shadow-xs backdrop-blur-xs flex items-center gap-1 ${cat.bg}`}
                                  >
                                    <span>{cat.icon}</span>
                                    <span>{cat.label}</span>
                                  </span>
                                </div>

                                {/* Heart Favorite Button */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFavoriteRecipe(r.id);
                                  }}
                                  className={`absolute top-2 right-2 z-10 p-1.5 rounded-xl backdrop-blur-xs transition-all ${
                                    r.isFavorite
                                      ? 'bg-rose-500 text-white shadow-xs'
                                      : 'bg-black/50 hover:bg-black/70 text-white/80 hover:text-white'
                                  }`}
                                  title={r.isFavorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen ❤️'}
                                >
                                  <Heart className={`w-3 h-3 ${r.isFavorite ? 'fill-white' : ''}`} />
                                </button>

                                {/* Bottom Time / Servings Pills */}
                                <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between text-[10px] text-white font-bold">
                                  <span className="flex items-center gap-1 bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded-full">
                                    <Clock className="w-2.5 h-2.5 text-teal-300" />
                                    {r.prepTime}
                                  </span>
                                  <span className="flex items-center gap-1 bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded-full">
                                    <Users className="w-2.5 h-2.5 text-amber-300" />
                                    {r.servings}P
                                  </span>
                                </div>
                              </div>

                              {/* Card Body */}
                              <div className="p-2.5 flex-1 flex flex-col justify-between">
                                <div>
                                  <h4 className="font-bold text-xs text-stone-900 dark:text-white line-clamp-2 leading-snug group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors">
                                    {r.title}
                                  </h4>
                                  <p className="text-[10px] text-stone-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                                    <span>🥕</span>
                                    <span>{r.ingredients.length} Zutaten</span>
                                  </p>
                                </div>
                                {isSelected && (
                                  <div className="mt-2 pt-1.5 border-t border-teal-200 dark:border-teal-800 flex items-center justify-between text-[10px] font-black text-teal-700 dark:text-teal-300">
                                    <span>Bereit zum Eintragen</span>
                                    <span>✓</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}

                      {/* + Import New Recipe Card */}
                      <button
                        type="button"
                        onClick={() => setIsImportModalOpen(true)}
                        className="min-h-[150px] rounded-2xl border-2 border-dashed border-teal-300 dark:border-teal-700 hover:border-teal-500 bg-teal-50/40 dark:bg-teal-950/20 hover:bg-teal-50/80 p-4 flex flex-col items-center justify-center text-center transition-all group border-b-4"
                      >
                        <div className="w-10 h-10 rounded-2xl bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                          <Plus className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-teal-900 dark:text-teal-200">Rezept importieren</span>
                        <span className="text-[10px] text-teal-600 dark:text-teal-400 mt-0.5">Link, Foto oder Text</span>
                      </button>
                    </div>

                    {/* Spotlight Box on Selected Recipe */}
                    {(() => {
                      const sel = recipes.find((r) => r.id === editingSlot.currentRecipeId);
                      if (!sel) return null;
                      return (
                        <div className="p-3 bg-gradient-to-r from-teal-50/90 to-emerald-50/80 dark:from-slate-800 dark:to-slate-800 border-2 border-teal-200 dark:border-teal-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs animate-in fade-in">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <img
                              src={getRecipePhoto(sel)}
                              alt={sel.title}
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src =
                                  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
                              }}
                              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover shadow-2xs border border-teal-200 dark:border-teal-700 shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] uppercase font-black text-teal-700 dark:text-teal-300 tracking-wider">
                                  Aktuelle Auswahl
                                </span>
                                <span className="text-[10px] bg-teal-200/90 dark:bg-teal-900/60 text-teal-900 dark:text-teal-200 px-1.5 py-0.2 rounded-md font-bold">
                                  ⏱️ {sel.prepTime}
                                </span>
                                {sel.isFavorite && (
                                  <span className="text-[10px] text-rose-500 font-bold flex items-center gap-0.5">
                                    ❤️ Favorit
                                  </span>
                                )}
                              </div>
                              <h4 className="text-sm font-black text-stone-900 dark:text-white truncate mt-0.5">
                                {sel.title}
                              </h4>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {sel.ingredients.slice(0, 3).map((ing, idx) => (
                                  <span
                                    key={idx}
                                    className="text-[10px] bg-white dark:bg-slate-900 text-stone-600 dark:text-slate-300 px-1.5 py-0.5 rounded-md border border-stone-200 dark:border-slate-700 font-medium"
                                  >
                                    {ing.name}
                                  </span>
                                ))}
                                {sel.ingredients.length > 3 && (
                                  <span className="text-[10px] text-stone-500 dark:text-slate-400 font-medium">
                                    +{sel.ingredients.length - 3} weitere
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSyncRecipe(sel)}
                            className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl duo-btn duo-btn-green text-xs font-bold w-full sm:w-auto justify-center"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span>Zur Einkaufsliste</span>
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  /* TAB 2: CUSTOM DISH / LEFTOVERS */
                  <div className="space-y-3 bg-stone-50/80 dark:bg-slate-800/80 p-4 rounded-2xl border border-stone-200 dark:border-slate-700">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 dark:text-slate-300 uppercase mb-1">
                        Gerichtsname oder Idee
                      </label>
                      <input
                        type="text"
                        value={editingSlot.currentTitle}
                        onChange={(e) =>
                          setEditingSlot({
                            ...editingSlot,
                            currentTitle: e.target.value,
                            currentRecipeId: undefined,
                          })
                        }
                        placeholder="z.B. Lasagne-Reste, Freitagspizza, Paninis"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-slate-700 text-sm font-semibold focus:outline-none bg-white dark:bg-slate-900 text-stone-900 dark:text-white"
                        required
                      />
                    </div>

                    <div>
                      <span className="block text-[11px] font-bold text-stone-500 dark:text-slate-400 uppercase mb-1.5">
                        Schnelle Familien-Vorschläge
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {CUSTOM_DISH_SUGGESTIONS.map((s, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() =>
                              setEditingSlot({
                                ...editingSlot,
                                currentTitle: s.title,
                                currentRecipeId: undefined,
                              })
                            }
                            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 hover:border-teal-400 hover:bg-teal-50/50 text-xs font-semibold text-stone-700 dark:text-slate-200 flex items-center gap-1.5 transition-all active:scale-95"
                          >
                            <span>{s.icon}</span>
                            <span>{s.title}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Chef assignment */}
                <div className="pt-2 border-t border-stone-100 dark:border-slate-800">
                  <label className="block text-xs font-bold text-stone-600 dark:text-slate-300 uppercase mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <ChefHat className="w-4 h-4 text-amber-500" />
                      <span>Chefkoch / Kochdienst zuweisen</span>
                    </span>
                    {editingSlot.currentChefId && (
                      <button
                        type="button"
                        onClick={() => setEditingSlot({ ...editingSlot, currentChefId: undefined })}
                        className="text-[11px] text-stone-400 hover:text-stone-600 underline font-semibold"
                      >
                        Koch zurücksetzen
                      </button>
                    )}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {members.map((m) => {
                      const isChef = editingSlot.currentChefId === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() =>
                            setEditingSlot({
                              ...editingSlot,
                              currentChefId: isChef ? undefined : m.id,
                            })
                          }
                          className={`p-2.5 rounded-2xl flex items-center gap-2.5 border-2 transition-all text-left ${
                            isChef
                              ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-400 dark:border-amber-700 shadow-xs ring-2 ring-amber-300/60 border-b-4 translate-y-[-1px]'
                              : 'bg-white dark:bg-slate-900 border-stone-200 dark:border-slate-800 hover:border-stone-300 hover:bg-stone-50 border-b-2'
                          }`}
                        >
                          <div className="w-9 h-9 rounded-xl bg-stone-100 dark:bg-slate-800 flex items-center justify-center text-lg shrink-0 shadow-2xs">
                            {m.avatar}
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="block text-xs font-bold text-stone-800 dark:text-white truncate">{m.name}</span>
                            <span className="text-[10px] text-stone-500 dark:text-slate-400 block truncate">
                              {isChef ? '👨‍🍳 Chefkoch' : 'Helfer'}
                            </span>
                          </div>
                          {isChef && (
                            <span className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                              ✓
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Modal Footer actions */}
              <div className="flex items-center justify-between pt-3 border-t border-stone-100 dark:border-slate-800 mt-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingSlot(null)}
                  className="duo-btn duo-btn-white px-4 py-2 text-xs font-bold rounded-xl"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={!editingSlot.currentTitle.trim()}
                  className="duo-btn duo-btn-green px-6 py-2.5 text-xs font-black rounded-xl disabled:opacity-50"
                >
                  <span>Speichern</span>
                  <span className="ml-1">✨</span>
                </button>
              </div>
            </form>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* Recipe Detail Modal */}
      {selectedRecipeForModal && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-xl border-2 border-stone-200 dark:border-slate-800 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="relative h-48 rounded-2xl overflow-hidden mb-4">
              <img
                src={getRecipePhoto(selectedRecipeForModal)}
                alt={selectedRecipeForModal.title}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
                }}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setSelectedRecipeForModal(null)}
                className="absolute top-3 right-3 bg-black/50 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200 capitalize">
                    {selectedRecipeForModal.category}
                  </span>
                  <span className="text-xs text-stone-500 dark:text-slate-400 font-semibold flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-500" />
                    {selectedRecipeForModal.prepTime}
                  </span>
                  <span className="text-xs text-stone-500 dark:text-slate-400 font-semibold flex items-center gap-1">
                    <Users className="w-3 h-3 text-blue-500" />
                    {selectedRecipeForModal.servings} Portionen
                  </span>
                  {selectedRecipeForModal.sourceUrl && (
                    <a
                      href={selectedRecipeForModal.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-0.5 ml-auto"
                    >
                      <span>Original-Link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-xl font-black text-stone-900 dark:text-white leading-tight">
                    {selectedRecipeForModal.title}
                  </h3>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        toggleFavoriteRecipe(selectedRecipeForModal.id);
                        setSelectedRecipeForModal({
                          ...selectedRecipeForModal,
                          isFavorite: !selectedRecipeForModal.isFavorite,
                        });
                      }}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all active:scale-95 shadow-2xs ${
                        selectedRecipeForModal.isFavorite
                          ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-700 text-rose-600 dark:text-rose-300'
                          : 'bg-stone-50 dark:bg-slate-800 border-stone-200 dark:border-slate-700 text-stone-600 dark:text-slate-300 hover:text-rose-500'
                      }`}
                      title={selectedRecipeForModal.isFavorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen ❤️'}
                    >
                      <Heart
                        className={`w-3.5 h-3.5 ${
                          selectedRecipeForModal.isFavorite ? 'fill-rose-500 text-rose-500' : ''
                        }`}
                      />
                      <span className="hidden sm:inline">
                        {selectedRecipeForModal.isFavorite ? 'Favorit' : 'Merken'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRecipeToEdit(selectedRecipeForModal);
                        setSelectedRecipeForModal(null);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-700 text-xs font-bold transition-all active:scale-95 shadow-2xs"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Bearbeiten</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRecipeToDelete(selectedRecipeForModal);
                        setSelectedRecipeForModal(null);
                      }}
                      className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-700 transition-all active:scale-95 shadow-2xs"
                      title="Rezept löschen"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {selectedRecipeForModal.tags && selectedRecipeForModal.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedRecipeForModal.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-extrabold bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300 px-2 py-0.5 rounded-md border border-stone-200 dark:border-slate-700"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {selectedRecipeForModal.notes && (
                  <p className="text-xs text-stone-600 dark:text-slate-300 mt-2 bg-stone-50 dark:bg-slate-800/80 p-2.5 rounded-xl border border-stone-200 dark:border-slate-700 font-medium">
                    {selectedRecipeForModal.notes}
                  </p>
                )}
              </div>

              {/* Ingredients List */}
              <div>
                <h4 className="text-xs font-black text-stone-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Zutaten ({selectedRecipeForModal.ingredients.length})
                </h4>
                <div className="divide-y divide-stone-100 dark:divide-slate-800 border border-stone-200 dark:border-slate-700 rounded-2xl overflow-hidden">
                  {selectedRecipeForModal.ingredients.map((ing, idx) => (
                    <div
                      key={idx}
                      className="px-3.5 py-2 flex items-center justify-between text-xs bg-stone-50/40 dark:bg-slate-800/60"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md ${
                            ing.category === 'produce'
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                              : ing.category === 'dairy'
                              ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
                              : ing.category === 'meat'
                              ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                              : ing.category === 'bakery'
                              ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                              : 'bg-stone-100 dark:bg-slate-700 text-stone-700 dark:text-slate-200'
                          }`}
                        >
                          {ing.category}
                        </span>
                        <span className="font-extrabold text-stone-800 dark:text-white">{ing.name}</span>
                      </div>
                      <span className="text-stone-500 dark:text-slate-400 font-bold bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-stone-200 dark:border-slate-700">
                        {ing.amount}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Instructions List (if present) */}
              {selectedRecipeForModal.instructions && selectedRecipeForModal.instructions.length > 0 && (
                <div>
                  <h4 className="text-xs font-black text-stone-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Zubereitung ({selectedRecipeForModal.instructions.length} Schritte)
                  </h4>
                  <div className="space-y-2">
                    {selectedRecipeForModal.instructions.map((step, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2.5 p-2.5 bg-stone-50 dark:bg-slate-800/70 rounded-xl border border-stone-200 dark:border-slate-700 text-xs"
                      >
                        <span className="w-5 h-5 rounded-full bg-amber-400 text-stone-900 font-black flex items-center justify-center shrink-0 text-[11px]">
                          {idx + 1}
                        </span>
                        <p className="text-stone-700 dark:text-slate-300 font-medium leading-relaxed">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between">
                <button
                  onClick={() => {
                    handleSyncRecipe(selectedRecipeForModal);
                    setSelectedRecipeForModal(null);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl duo-btn duo-btn-green text-xs font-black shadow-xs transition-colors"
                >
                  <ShoppingCart className="w-4 h-4 stroke-[2.5]" />
                  <span>Zutaten zur Einkaufsliste senden</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* Smart Recipe Import Modal */}
      <RecipeImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onRecipeSaved={(newRecipe) => {
          setSelectedRecipeForModal(newRecipe);
        }}
      />

      {/* Recipe Edit Modal */}
      <RecipeEditModal
        recipe={recipeToEdit}
        isOpen={!!recipeToEdit}
        onClose={() => setRecipeToEdit(null)}
        onSave={(updated) => {
          updateRecipe(updated.id, updated);
          setRecipeToEdit(null);
          setSyncFeedback(`Rezept "${updated.title}" erfolgreich gespeichert! ✨`);
          setTimeout(() => setSyncFeedback(null), 4000);
        }}
        onDelete={(id) => {
          const rec = recipes.find((r) => r.id === id);
          deleteRecipe(id);
          setRecipeToEdit(null);
          setSyncFeedback(`Rezept "${rec?.title || 'Gericht'}" gelöscht.`);
          setTimeout(() => setSyncFeedback(null), 4000);
        }}
      />

      {/* Recipe Delete Confirmation Dialog */}
      {recipeToDelete && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border-2 border-stone-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-stone-900 dark:text-white">Rezept wirklich löschen?</h3>
              <p className="text-xs text-stone-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                Möchtest du <strong className="text-stone-900 dark:text-white">"{recipeToDelete.title}"</strong> wirklich löschen? Das Rezept wird aus der Rezeptbox und aus allen geplanten Mahlzeiten entfernt.
              </p>
              <div className="flex items-center justify-end gap-2 mt-5">
                <button
                  type="button"
                  onClick={() => setRecipeToDelete(null)}
                  className="duo-btn duo-btn-white px-4 py-2 text-xs font-bold rounded-xl"
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  onClick={() => {
                    deleteRecipe(recipeToDelete.id);
                    setSyncFeedback(`Rezept "${recipeToDelete.title}" gelöscht.`);
                    setRecipeToDelete(null);
                    setTimeout(() => setSyncFeedback(null), 4000);
                  }}
                  className="duo-btn duo-btn-rose px-5 py-2 text-xs font-black rounded-xl"
                >
                  Ja, Rezept löschen
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Auto Meal Plan Modal */}
      <AutoMealPlanModal
        isOpen={isAutoPlanModalOpen}
        onClose={() => setIsAutoPlanModalOpen(false)}
        weekDays={weekDays}
        currentMealPlans={mealPlans}
        recipes={recipes}
        onApplyPlan={handleApplyAutoPlan}
        onToggleFavorite={toggleFavoriteRecipe}
      />
    </div>
  );
};
