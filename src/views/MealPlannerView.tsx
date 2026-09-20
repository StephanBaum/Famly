import React, { useState, useMemo } from 'react';
import { useFamily } from '../context/FamilyContext';
import { Recipe } from '../types';
import {
  Utensils,
  BookOpen,
  Calendar,
  Sparkles,
  Plus,
  Trash2,
} from 'lucide-react';
import { format, addDays, startOfWeek } from 'date-fns';
import { de } from 'date-fns/locale';
import { RecipeImportModal } from '../components/RecipeImportModal';
import { RecipeEditModal } from '../components/RecipeEditModal';
import { AutoMealPlanModal } from '../components/AutoMealPlanModal';
import { ModalPortal } from '../components/ModalPortal';
import { DayFocusCard } from '../components/meal-planner/DayFocusCard';
import { WeeklyGridView } from '../components/meal-planner/WeeklyGridView';
import { RecipeDetailModal } from '../components/meal-planner/RecipeDetailModal';
import { SlotEditModal, EditingSlotState } from '../components/meal-planner/SlotEditModal';
import { RecipeBoxTab } from '../components/meal-planner/RecipeBoxTab';

export const MealPlannerView: React.FC = () => {
  const {
    members,
    recipes,
    mealPlans,
    setMealSlot,
    addRecipeIngredientsToGrocery,
    addMultipleRecipesToGrocery,
    removeGroceriesForMeal,
    clearGroceriesForDates,
    updateRecipe,
    deleteRecipe,
    toggleFavoriteRecipe,
    addRecipe,
  } = useFamily();

  const [activeTab, setActiveTab] = useState<'week' | 'recipes'>('week');
  const [selectedRecipeForModal, setSelectedRecipeForModal] = useState<Recipe | null>(null);
  const [recipeToEdit, setRecipeToEdit] = useState<Recipe | null>(null);
  const [recipeToDelete, setRecipeToDelete] = useState<Recipe | null>(null);
  const [editingSlot, setEditingSlot] = useState<EditingSlotState | null>(null);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAutoPlanModalOpen, setIsAutoPlanModalOpen] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Rolling Planning Horizon: 'today-7' (7 days starting Today), 'today-14' (14 days starting Today), or 'calendar' (Mon-Sun)
  const [horizonMode, setHorizonMode] = useState<'today-7' | 'today-14' | 'calendar'>('today-7');
  const [dayOffset, setDayOffset] = useState<number>(0);

  const today = new Date();
  const todayDateStr = format(today, 'yyyy-MM-dd');

  // Dynamically compute days: Today is anchored on the very left (index 0) by default
  const weekDays = useMemo(() => {
    if (horizonMode === 'calendar') {
      const start = addDays(startOfWeek(today, { weekStartsOn: 1 }), dayOffset);
      return Array.from({ length: 7 }, (_, i) => addDays(start, i));
    }
    const count = horizonMode === 'today-14' ? 14 : 7;
    const start = addDays(today, dayOffset);
    return Array.from({ length: count }, (_, i) => addDays(start, i));
  }, [horizonMode, dayOffset]);

  // Day Focus for mobile vs Full 7-Day / 14-Day Grid
  const todayIdx = weekDays.findIndex((d) => format(d, 'yyyy-MM-dd') === todayDateStr);
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(() => (todayIdx >= 0 ? todayIdx : 0));
  const [plannerMode, setPlannerMode] = useState<'focus' | 'grid'>('focus');

  const handleSyncRecipe = (recipe: Recipe) => {
    const targetDay = weekDays[selectedDayIdx] || new Date();
    const targetDateStr = format(targetDay, 'yyyy-MM-dd');
    const result = addRecipeIngredientsToGrocery(recipe, targetDateStr);
    if (result.skippedCount > 0) {
      setSyncFeedback(
        `${result.addedCount} Zutaten für ${format(targetDay, 'EEEE, d. MMM', { locale: de })} auf die Einkaufsliste gesetzt! ${result.skippedCount} Standard-Vorräte übersprungen 🧂`
      );
    } else {
      setSyncFeedback(
        `${result.addedCount} Zutaten für ${format(targetDay, 'EEEE, d. MMM', { locale: de })} auf deine Einkaufsliste gesetzt! 🛒`
      );
    }
    setTimeout(() => setSyncFeedback(null), 5000);
  };

  const handleApplyAutoPlan = (
    assignments: Array<{ date: string; recipe: Recipe }>
  ) => {
    assignments.forEach(({ date, recipe }) => {
      // If recipe is not already in the family recipes library, persist it
      if (!recipes.some((r) => r.id === recipe.id)) {
        addRecipe(recipe);
      }
      setMealSlot(date, 'dinner', {
        title: recipe.title,
        recipeId: recipe.id,
      });
    });

    // Self-Cleaning: Clear old unbought groceries for the affected dates first to prevent duplicates
    const targetDates = assignments.map((a) => a.date);
    clearGroceriesForDates(targetDates);

    // Automatic grocery synchronization for all planned meals
    const syncRes = addMultipleRecipesToGrocery(
      assignments.map((item) => ({ recipe: item.recipe, date: item.date }))
    );
    setSyncFeedback(
      `Wochenplan gezaubert! ${assignments.length} Tage belegt & ${syncRes.addedCount} Zutaten (~${syncRes.estimatedTotalCost} €) automatisch auf die Einkaufsliste synchronisiert! 🪄🛒`
    );
    setTimeout(() => setSyncFeedback(null), 5000);
  };

  const handleSlotSave = (
    date: string,
    slot: 'breakfast' | 'lunch' | 'dinner',
    data: { title: string; recipeId?: string; chefId?: string },
    oldRecipeId?: string
  ) => {
    // 1. If old recipe was replaced or removed, self-clean the previous meal's unbought groceries
    if (oldRecipeId && oldRecipeId !== data.recipeId) {
      removeGroceriesForMeal(date, { recipeId: oldRecipeId, slot });
    }

    // 2. Set the meal slot
    setMealSlot(date, slot, data);

    // 3. If a new recipe was chosen, automatically add and sync its ingredients to groceries!
    if (data.recipeId) {
      const newRecipe = recipes.find((r) => r.id === data.recipeId);
      if (newRecipe) {
        addRecipeIngredientsToGrocery(newRecipe, date);
        setSyncFeedback(
          oldRecipeId && oldRecipeId !== data.recipeId
            ? `Gericht getauscht: Zutaten für "${newRecipe.title}" automatisch auf die Einkaufsliste synchronisiert! 🛒✨`
            : `"${newRecipe.title}" eingetragen – Zutaten automatisch auf die Einkaufsliste synchronisiert! 🛒✨`
        );
      } else {
        setSyncFeedback(`Mahlzeit aktualisiert! ✨`);
      }
    } else if (oldRecipeId) {
      setSyncFeedback(`Mahlzeit geändert & alte Zutaten von der Einkaufsliste bereinigt 🧹`);
    } else {
      setSyncFeedback(`Mahlzeit aktualisiert! ✨`);
    }

    setEditingSlot(null);
    setTimeout(() => setSyncFeedback(null), 4000);
  };

  const handleClearSlot = (
    date: string,
    slot: 'breakfast' | 'lunch' | 'dinner',
    oldRecipeId?: string
  ) => {
    const removed = removeGroceriesForMeal(date, { recipeId: oldRecipeId, slot });
    setMealSlot(date, slot, { title: '', recipeId: undefined, chefId: undefined });
    setEditingSlot(null);
    if (removed > 0) {
      setSyncFeedback(`Mahlzeit geleert & ${removed} Zutaten von der Einkaufsliste entfernt 🧹`);
    } else {
      setSyncFeedback('Mahlzeit geleert');
    }
    setTimeout(() => setSyncFeedback(null), 4000);
  };

  const handleQuickSetSlot = (
    date: string,
    slot: 'breakfast' | 'lunch' | 'dinner',
    title: string,
    oldRecipeId?: string
  ) => {
    const removed = removeGroceriesForMeal(date, { recipeId: oldRecipeId, slot });
    setMealSlot(date, slot, { title, recipeId: undefined });
    if (removed > 0) {
      setSyncFeedback(`${title}: ${removed} nicht gekaufte Zutaten von der Einkaufsliste aufgeräumt 🧹`);
    } else {
      setSyncFeedback(`${title} eingetragen ✨`);
    }
    setTimeout(() => setSyncFeedback(null), 4000);
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
            {/* Header: Week Title, Horizon Switcher, and Nav */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black text-stone-800 dark:text-slate-200 uppercase tracking-wider">
                  {horizonMode === 'today-14' ? '2-Wochen-Plan:' : 'Wochenplan:'}{' '}
                  {format(weekDays[0], 'd. MMM', { locale: de })} – {format(weekDays[weekDays.length - 1], 'd. MMM', { locale: de })}
                </span>
                {dayOffset !== 0 && (
                  <button
                    type="button"
                    onClick={() => setDayOffset(0)}
                    className="duo-btn px-2 py-0.5 text-[10px] font-black rounded-lg bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-200"
                  >
                    ★ Zurück zu Heute
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Rolling Horizon Switcher: 7 Tage vs 14 Tage */}
                <div className="flex items-center gap-1 bg-stone-100 dark:bg-slate-800 p-1 rounded-xl border border-stone-200 dark:border-slate-700 shrink-0 text-xs font-black">
                  <button
                    type="button"
                    onClick={() => setHorizonMode('today-7')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      horizonMode === 'today-7'
                        ? 'bg-white dark:bg-slate-700 text-teal-800 dark:text-teal-200 shadow-xs'
                        : 'text-stone-500 dark:text-slate-400 hover:text-stone-800'
                    }`}
                    title="7 Tage rollend ab heute anzeigen"
                  >
                    7 Tage
                  </button>
                  <button
                    type="button"
                    onClick={() => setHorizonMode('today-14')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      horizonMode === 'today-14'
                        ? 'bg-white dark:bg-slate-700 text-teal-800 dark:text-teal-200 shadow-xs'
                        : 'text-stone-500 dark:text-slate-400 hover:text-stone-800'
                    }`}
                    title="14 Tage (2 Wochen) im Voraus planen"
                  >
                    14 Tage (2 Wo.)
                  </button>
                </div>

                {/* Shift Navigation: ◀ Heute ▶ */}
                <div className="flex items-center gap-1 bg-stone-100 dark:bg-slate-800 p-1 rounded-xl border border-stone-200 dark:border-slate-700 shrink-0">
                  <button
                    type="button"
                    onClick={() => setDayOffset((prev) => prev - (horizonMode === 'today-14' ? 14 : 7))}
                    className="px-2 py-1 text-xs font-black text-stone-600 dark:text-slate-300 hover:text-stone-900"
                    title="Frühere Tage anzeigen"
                  >
                    ◀
                  </button>
                  <button
                    type="button"
                    onClick={() => setDayOffset(0)}
                    className={`px-2 py-1 text-xs font-black rounded-lg ${
                      dayOffset === 0
                        ? 'bg-white dark:bg-slate-700 text-teal-800 dark:text-teal-200 shadow-xs'
                        : 'text-stone-500 dark:text-slate-400 hover:text-stone-900'
                    }`}
                    title="Heute ganz links anzeigen"
                  >
                    Heute
                  </button>
                  <button
                    type="button"
                    onClick={() => setDayOffset((prev) => prev + (horizonMode === 'today-14' ? 14 : 7))}
                    className="px-2 py-1 text-xs font-black text-stone-600 dark:text-slate-300 hover:text-stone-900"
                    title="Spätere Tage anzeigen"
                  >
                    ▶
                  </button>
                </div>

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
                    📅 Raster
                  </button>
                </div>
              </div>
            </div>

            {/* 7-Day / 14-Day Responsive Day Buttons */}
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
            const dayPlan = mealPlans.find((m) => m.date === dateStr);

            return (
              <DayFocusCard
                focusDay={focusDay}
                isToday={dateStr === todayDateStr}
                mealPlan={dayPlan}
                recipes={recipes}
                members={members}
                onOpenEditSlot={(slot, currentTitle, currentRecipeId, currentChefId) => {
                  setEditingSlot({
                    date: dateStr,
                    slot,
                    currentTitle: currentTitle || '',
                    currentRecipeId,
                    currentChefId,
                  });
                }}
                onSelectRecipe={(recipe) => setSelectedRecipeForModal(recipe)}
                onToggleFavorite={toggleFavoriteRecipe}
                onQuickSetSlot={(slot, title, oldRecipeId) =>
                  handleQuickSetSlot(dateStr, slot, title, oldRecipeId)
                }
              />
            );
          })()}

          {/* MODE 2: FULL GRID */}
          {plannerMode === 'grid' && (
            <WeeklyGridView
              weekDays={weekDays}
              todayDateStr={todayDateStr}
              mealPlans={mealPlans}
              recipes={recipes}
              members={members}
              onOpenEditSlot={(slot, dateStr, currentTitle, currentRecipeId, currentChefId) => {
                setEditingSlot({
                  date: dateStr,
                  slot,
                  currentTitle: currentTitle || '',
                  currentRecipeId,
                  currentChefId,
                });
              }}
              onSelectRecipe={(recipe) => setSelectedRecipeForModal(recipe)}
              onToggleFavorite={toggleFavoriteRecipe}
            />
          )}
        </div>
      )}

      {/* RECIPE BOX TAB */}
      {activeTab === 'recipes' && (
        <RecipeBoxTab
          recipes={recipes}
          onSelectRecipeForModal={(recipe) => setSelectedRecipeForModal(recipe)}
          onEditRecipe={(recipe) => setRecipeToEdit(recipe)}
          onDeleteRecipe={(recipe) => setRecipeToDelete(recipe)}
          onToggleFavorite={toggleFavoriteRecipe}
          onSyncRecipe={handleSyncRecipe}
          onOpenImportModal={() => setIsImportModalOpen(true)}
        />
      )}

      {/* Modals */}
      <SlotEditModal
        editingSlot={editingSlot}
        recipes={recipes}
        members={members}
        onClose={() => setEditingSlot(null)}
        onSave={handleSlotSave}
        onClearSlot={handleClearSlot}
        onToggleFavorite={toggleFavoriteRecipe}
        onOpenImportModal={() => setIsImportModalOpen(true)}
      />

      <RecipeDetailModal
        recipe={selectedRecipeForModal}
        onClose={() => setSelectedRecipeForModal(null)}
        onToggleFavorite={toggleFavoriteRecipe}
        onEditRecipe={(r) => {
          setSelectedRecipeForModal(null);
          setRecipeToEdit(r);
        }}
        onDeleteRecipe={(r) => {
          setSelectedRecipeForModal(null);
          setRecipeToDelete(r);
        }}
        onSyncRecipe={(r) => {
          handleSyncRecipe(r);
          setSelectedRecipeForModal(null);
        }}
      />

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
