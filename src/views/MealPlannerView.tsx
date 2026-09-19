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
  Check,
  X,
  Pencil,
  Trash2,
} from 'lucide-react';
import { format, addDays, startOfWeek } from 'date-fns';
import { RecipeImportModal } from '../components/RecipeImportModal';
import { RecipeEditModal } from '../components/RecipeEditModal';

// Robust food photo fallback helper
const getRecipePhoto = (recipe: Recipe): string => {
  if (recipe.imageUrl && recipe.imageUrl.startsWith('http')) return recipe.imageUrl;
  const t = (recipe.title || '').toLowerCase();
  if (t.includes('pasta') || t.includes('spaghetti') || t.includes('fettuccine')) {
    return 'https://images.unsplash.com/photo-1621996346565-e3d5d6281057?auto=format&fit=crop&w=600&q=80';
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
  if (t.includes('pancake') || t.includes('cake') || t.includes('strudel') || t.includes('baking')) {
    return 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=600&q=80';
  }
  if (t.includes('taco') || t.includes('burrito') || t.includes('mexican')) {
    return 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=600&q=80';
  }
  if (t.includes('spätzle') || t.includes('kaesspatzen')) {
    return 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=600&q=80';
  }
  return 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=600&q=80';
};

// Duolingo-styled category pill badge styling
const getCategoryBadge = (category?: Recipe['category']) => {
  switch (category) {
    case 'quick':
      return { label: 'Quick', icon: '⚡', bg: 'bg-amber-100 text-amber-900 border-amber-300' };
    case 'comfort':
      return { label: 'Comfort', icon: '🍲', bg: 'bg-orange-100 text-orange-900 border-orange-300' };
    case 'healthy':
      return { label: 'Healthy', icon: '🥗', bg: 'bg-emerald-100 text-emerald-900 border-emerald-300' };
    case 'baking':
      return { label: 'Baking', icon: '🥐', bg: 'bg-pink-100 text-pink-900 border-pink-300' };
    default:
      return { label: 'Favorite', icon: '🌟', bg: 'bg-indigo-100 text-indigo-900 border-indigo-300' };
  }
};

const CUSTOM_DISH_SUGGESTIONS = [
  { title: '🍕 Leftover Pizza & Salad', icon: '🍕' },
  { title: '🍜 Thai / Asian Takeout', icon: '🍜' },
  { title: '🥪 Warm Paninis & Soup', icon: '🥪' },
  { title: '🥗 Fresh Family Crunch Salad', icon: '🥗' },
  { title: '🍝 Garlic & Olive Oil Pasta', icon: '🍝' },
  { title: '🍔 Friday Homemade Burgers', icon: '🍔' },
];

export const MealPlannerView: React.FC = () => {
  const {
    members,
    recipes,
    mealPlans,
    setMealSlot,
    addRecipeIngredientsToGrocery,
    updateRecipe,
    deleteRecipe,
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
        `Added ${result.addedCount} items to store lists! Skipped ${result.skippedCount} staples already at home (${result.skippedNames.join(', ')}) 🧂`
      );
    } else {
      setSyncFeedback(`Added ${result.addedCount} ingredients to your store shopping lists! 🛒`);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-stone-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
            <Utensils className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-stone-900">Family Meal Planner</h2>
            <p className="text-xs text-stone-500">
              Coordinate weekly dinners, recipe cards & automatic grocery lists
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200/60">
            <button
              onClick={() => setActiveTab('week')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'week'
                  ? 'bg-white text-teal-700 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Weekly Board</span>
            </button>
            <button
              onClick={() => setActiveTab('recipes')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'recipes'
                  ? 'bg-white text-teal-700 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Recipe Box ({recipes.length})</span>
            </button>
          </div>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="duo-btn duo-btn-green px-3.5 py-2 text-xs font-black rounded-2xl flex items-center gap-1.5 shadow-sm"
          >
            <Sparkles className="w-4 h-4 fill-white stroke-[2.5]" />
            <span>Import Recipe</span>
          </button>
        </div>
      </div>

      {/* Sync Feedback Toast (Staples skipped / Items added) */}
      {syncFeedback && (
        <div className="duo-card p-4 bg-emerald-50 border-2 border-emerald-300 text-xs font-black text-emerald-900 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <span>{syncFeedback}</span>
          <button
            onClick={() => setSyncFeedback(null)}
            className="text-emerald-700 hover:text-emerald-900 ml-2 font-black"
          >
            ✕
          </button>
        </div>
      )}

      {/* WEEKLY BOARD TAB */}
      {activeTab === 'week' && (
        <div className="space-y-4">
          
          {/* Day Strip & View Layout Toggle */}
          <div className="bg-white rounded-2xl p-3 border-2 border-stone-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
            {/* Day Pills Strip */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
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
                    className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-xl border-2 transition-all shrink-0 ${
                      isSelected
                        ? 'bg-teal-600 text-white border-teal-700 shadow-xs scale-105'
                        : isToday
                        ? 'bg-teal-50 text-teal-900 border-teal-300 font-extrabold'
                        : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100 font-bold'
                    }`}
                  >
                    <span className="text-[10px] uppercase tracking-wider">
                      {isToday ? '★ Today' : format(day, 'EEE')}
                    </span>
                    <span className="text-xs font-black">{format(day, 'd MMM')}</span>
                  </button>
                );
              })}
            </div>

            {/* Mode Switcher: Focus Day vs Full Week Grid */}
            <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl border border-stone-200 self-end sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => setPlannerMode('focus')}
                className={`px-3 py-1 text-xs font-black rounded-lg transition-all ${
                  plannerMode === 'focus'
                    ? 'bg-white text-teal-800 shadow-xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                ⭐ Day Focus
              </button>
              <button
                type="button"
                onClick={() => setPlannerMode('grid')}
                className={`px-3 py-1 text-xs font-black rounded-lg transition-all ${
                  plannerMode === 'grid'
                    ? 'bg-white text-teal-800 shadow-xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                📅 7-Day Grid
              </button>
            </div>
          </div>

          {/* MODE 1: DAY FOCUS (Uncluttered, high-speed focus for busy parents) */}
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
                    <h3 className="text-lg sm:text-xl font-black text-stone-900">
                      {format(focusDay, 'EEEE, MMMM do')}
                    </h3>
                    {isToday && (
                      <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-300">
                        Today
                      </span>
                    )}
                  </div>
                </div>

                {/* HERO: TONIGHT'S DINNER */}
                <div className="duo-card overflow-hidden bg-white border-2 border-teal-200 shadow-sm">
                  <div className="p-4 bg-teal-50/80 border-b border-teal-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🍲</span>
                      <h4 className="text-sm font-black text-teal-950 uppercase tracking-wider">
                        Tonight's Dinner
                      </h4>
                    </div>
                    {dinnerChef && (
                      <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-teal-200 text-xs font-bold text-stone-800 shadow-2xs">
                        <span>👨‍🍳 Cook:</span>
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
                            className="w-full sm:w-44 h-36 sm:h-32 object-cover rounded-2xl border border-stone-200 shadow-xs shrink-0"
                          />
                        )}
                        <div className="space-y-2 flex-1 min-w-0">
                          <h4 className="text-xl sm:text-2xl font-black text-stone-900 leading-tight">
                            {dayPlan.dinner.title}
                          </h4>
                          
                          <div className="flex items-center gap-2 flex-wrap text-xs">
                            {dinnerRecipe?.prepTime && (
                              <span className="bg-stone-100 text-stone-700 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 border border-stone-200">
                                <Clock className="w-3.5 h-3.5 text-teal-600" />
                                <span>{dinnerRecipe.prepTime}</span>
                              </span>
                            )}
                            {dinnerRecipe?.servings && (
                              <span className="bg-stone-100 text-stone-700 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 border border-stone-200">
                                <Users className="w-3.5 h-3.5 text-blue-600" />
                                <span>Serves {dinnerRecipe.servings}</span>
                              </span>
                            )}
                            {dinnerRecipe?.category && (
                              <span className="capitalize px-2.5 py-1 rounded-lg font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                {dinnerRecipe.category}
                              </span>
                            )}
                          </div>

                          {dinnerRecipe?.notes && (
                            <p className="text-xs text-stone-500 font-medium line-clamp-2">
                              {dinnerRecipe.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Action Bar for Dinner */}
                      <div className="pt-3 border-t border-stone-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
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
                            <span>Change Dinner / Chef</span>
                          </button>

                          {dinnerRecipe && (
                            <button
                              type="button"
                              onClick={() => setSelectedRecipeForModal(dinnerRecipe)}
                              className="text-xs font-bold text-teal-700 hover:underline px-2 py-1"
                            >
                              View Full Recipe
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
                            <span>Add Ingredients to Grocery List</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center space-y-3">
                      <p className="text-sm font-bold text-stone-500">
                        No dinner planned for {format(focusDay, 'EEEE')} yet!
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
                        + Choose Dinner from Recipe Box
                      </button>
                    </div>
                  )}
                </div>

                {/* LUNCH & BREAKFAST (Two Clean Cards) */}
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
                    className="cursor-pointer group duo-card p-4 sm:p-5 bg-white hover:border-emerald-300 transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🥗</span>
                        <h4 className="text-xs font-black text-stone-700 uppercase tracking-wider">
                          Lunch
                        </h4>
                      </div>
                      {lunchChef && (
                        <span className="text-[11px] font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md">
                          {lunchChef.avatar} {lunchChef.name}
                        </span>
                      )}
                    </div>

                    {dayPlan?.lunch?.title ? (
                      <div className="space-y-1">
                        <p className="text-base font-black text-stone-900">
                          {dayPlan.lunch.title}
                        </p>
                        <span className="text-xs text-teal-700 font-extrabold group-hover:underline block">
                          Tap to change lunch →
                        </span>
                      </div>
                    ) : (
                      <p className="text-xs text-stone-400 italic py-2 group-hover:text-emerald-700 font-bold">
                        + Tap to plan lunch or leftovers
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
                    className="cursor-pointer group duo-card p-4 sm:p-5 bg-white hover:border-amber-300 transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🍳</span>
                        <h4 className="text-xs font-black text-stone-700 uppercase tracking-wider">
                          Breakfast
                        </h4>
                      </div>
                      {breakfastChef && (
                        <span className="text-[11px] font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md">
                          {breakfastChef.avatar} {breakfastChef.name}
                        </span>
                      )}
                    </div>

                    {dayPlan?.breakfast?.title ? (
                      <div className="space-y-1">
                        <p className="text-base font-black text-stone-900">
                          {dayPlan.breakfast.title}
                        </p>
                        <span className="text-xs text-amber-800 font-extrabold group-hover:underline block">
                          Tap to change breakfast →
                        </span>
                      </div>
                    ) : (
                      <p className="text-xs text-stone-400 italic py-2 group-hover:text-amber-700 font-bold">
                        + Tap to plan breakfast
                      </p>
                    )}
                  </div>

                </div>

              </div>
            );
          })()}

          {/* MODE 2: FULL 7-DAY GRID (Expanded desktop overview) */}
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
                    className={`bg-white rounded-3xl border-2 flex flex-col justify-between overflow-hidden shadow-xs transition-all ${
                      isToday
                        ? 'border-teal-500 ring-4 ring-teal-400/20'
                        : 'border-stone-200/90 hover:border-teal-200'
                    }`}
                  >
                    {/* Day Header */}
                    <div
                      className={`px-3 py-2 border-b text-center flex items-center justify-between ${
                        isToday
                          ? 'bg-teal-500 text-white font-black'
                          : 'bg-stone-50/90 text-stone-700 font-bold'
                      }`}
                    >
                      <span className="text-xs uppercase tracking-wider">{format(day, 'EEE')}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                          isToday ? 'bg-white/20 text-white' : 'bg-stone-200/70 text-stone-700'
                        }`}
                      >
                        {format(day, 'd MMM')}
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
                        className="group cursor-pointer rounded-2xl p-2.5 bg-teal-50/40 hover:bg-teal-50 border border-teal-100 hover:border-teal-300 transition-all relative"
                      >
                        <div className="flex items-center justify-between text-[11px] font-black text-teal-800 mb-1.5">
                          <span className="flex items-center gap-1">
                            <Utensils className="w-3.5 h-3.5 text-teal-600" />
                            <span>Dinner</span>
                          </span>
                          {dinnerChef && (
                            <span
                              title={`Chef: ${dinnerChef.name}`}
                              className="flex items-center gap-1 text-[10px] bg-white px-2 py-0.5 rounded-full border border-stone-200 shadow-2xs font-bold"
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
                                className="w-full h-20 object-cover rounded-xl mb-1.5 shadow-2xs border border-teal-200/60 group-hover:scale-[1.02] transition-transform"
                              />
                            )}
                            <p className="text-xs font-black text-stone-900 line-clamp-2 leading-tight">
                              {dayPlan.dinner.title}
                            </p>
                            {dinnerRecipe?.prepTime && (
                              <span className="text-[10px] text-stone-500 font-semibold flex items-center gap-1 mt-1">
                                <Clock className="w-2.5 h-2.5 text-teal-600" />
                                {dinnerRecipe.prepTime}
                              </span>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-stone-400 italic py-2 text-center font-medium group-hover:text-teal-600">
                            + Tap to plan dinner
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
                            ? 'bg-emerald-50/50 hover:bg-emerald-50 border-emerald-200/80'
                            : 'bg-stone-50/80 hover:bg-stone-100 border-stone-200/60'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-black text-emerald-800 mb-1">
                          <span className="flex items-center gap-1">
                            <span>🥗</span>
                            <span>Lunch</span>
                          </span>
                          {lunchChef && (
                            <span className="text-[9px] bg-white px-1.5 py-0.2 rounded font-bold text-stone-600">
                              {lunchChef.avatar} {lunchChef.name}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-extrabold text-stone-800 truncate">
                          {dayPlan?.lunch?.title || (
                            <span className="text-stone-400 font-normal italic">+ Plan lunch</span>
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
                            ? 'bg-amber-50/50 hover:bg-amber-50 border-amber-200/80'
                            : 'bg-stone-50/80 hover:bg-stone-100 border-stone-200/60'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-black text-amber-800 mb-1">
                          <span className="flex items-center gap-1">
                            <span>🍳</span>
                            <span>Breakfast</span>
                          </span>
                          {breakfastChef && (
                            <span className="text-[9px] bg-white px-1.5 py-0.2 rounded font-bold text-stone-600">
                              {breakfastChef.avatar} {breakfastChef.name}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-extrabold text-stone-800 truncate">
                          {dayPlan?.breakfast?.title || (
                            <span className="text-stone-400 font-normal italic">+ Plan breakfast</span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Footer Quick Grocery Sync */}
                    {dinnerRecipe && (
                      <div className="p-2 bg-stone-50/80 border-t border-stone-100 flex items-center justify-between">
                        <button
                          onClick={() => setSelectedRecipeForModal(dinnerRecipe)}
                          className="text-[11px] font-bold text-teal-700 hover:text-teal-950 underline"
                        >
                          View Recipe
                        </button>
                        <button
                          onClick={() => handleSyncRecipe(dinnerRecipe)}
                          title="Add ingredients to Grocery list (skips home staples!)"
                          className="text-[10px] font-black text-teal-700 hover:text-teal-900 flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-teal-200 shadow-2xs active:translate-y-0.5 transition-all"
                        >
                          <ShoppingCart className="w-3 h-3" />
                          <span>+ Grocery</span>
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
      {activeTab === 'recipes' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe) => (
            <div
              key={recipe.id}
              className="bg-white rounded-3xl border border-stone-200/80 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow group relative"
            >
              <div>
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={getRecipePhoto(recipe)}
                    alt={recipe.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
                  
                  {/* Category Pill */}
                  <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-stone-800 shadow-xs capitalize">
                    {recipe.category}
                  </div>

                  {/* Quick Edit/Delete on Hover */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setRecipeToEdit(recipe);
                      }}
                      className="p-1.5 rounded-xl bg-white/90 hover:bg-white text-stone-700 hover:text-teal-700 shadow-sm backdrop-blur-xs transition-all active:scale-95"
                      title="Edit recipe"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setRecipeToDelete(recipe);
                      }}
                      className="p-1.5 rounded-xl bg-white/90 hover:bg-white text-stone-700 hover:text-rose-600 shadow-sm backdrop-blur-xs transition-all active:scale-95"
                      title="Delete recipe"
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
                  <h3 className="font-black text-stone-900 text-base leading-snug">
                    {recipe.title}
                  </h3>
                  {recipe.notes && (
                    <p className="text-xs text-stone-600 line-clamp-2">{recipe.notes}</p>
                  )}

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {recipe.ingredients.slice(0, 4).map((ing, i) => (
                      <span
                        key={i}
                        className="text-[11px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md font-medium"
                      >
                        {ing.name}
                      </span>
                    ))}
                    {recipe.ingredients.length > 4 && (
                      <span className="text-[11px] bg-stone-100 text-stone-400 px-1.5 py-0.5 rounded-md font-medium">
                        +{recipe.ingredients.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action bar */}
              <div className="px-5 py-3.5 bg-stone-50/70 border-t border-stone-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedRecipeForModal(recipe)}
                    className="text-xs font-bold text-stone-700 hover:text-stone-900 underline"
                  >
                    Details ({recipe.ingredients.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecipeToEdit(recipe)}
                    className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-teal-200 shadow-2xs"
                  >
                    <Pencil className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                </div>
                <button
                  onClick={() => handleSyncRecipe(recipe)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-colors shrink-0"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Send to Groceries</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Slot Modal - High Visual Rich Food Experience */}
      {editingSlot && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl border-2 border-stone-200 animate-in fade-in zoom-in-95 max-h-[92vh] flex flex-col my-auto">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-stone-100 shrink-0">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-xs shrink-0 ${
                    editingSlot.slot === 'breakfast'
                      ? 'bg-amber-100 text-amber-800 border-b-4 border-amber-300'
                      : editingSlot.slot === 'lunch'
                      ? 'bg-emerald-100 text-emerald-800 border-b-4 border-emerald-300'
                      : 'bg-teal-100 text-teal-800 border-b-4 border-teal-300'
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
                      {editingSlot.slot} Planning
                    </span>
                    <span className="text-xs text-stone-500 font-semibold flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-stone-400" />
                      {format(new Date(editingSlot.date), 'EEEE, MMMM do')}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-stone-900 leading-tight mt-0.5">
                    Choose What's for {editingSlot.slot.charAt(0).toUpperCase() + editingSlot.slot.slice(1)}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingSlot(null)}
                className="w-9 h-9 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-800 flex items-center justify-center transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex items-center bg-stone-100 p-1.5 rounded-2xl border border-stone-200/80 my-3 shrink-0">
              <button
                type="button"
                onClick={() => setSlotPickerTab('box')}
                className={`flex-1 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all ${
                  slotPickerTab === 'box'
                    ? 'bg-white text-teal-800 shadow-xs border border-stone-200'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <BookOpen className="w-4 h-4 text-teal-600" />
                <span>Pick from Recipe Box ({recipes.length})</span>
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
                    ? 'bg-white text-teal-800 shadow-xs border border-stone-200'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <span>✏️ Custom Dish / Leftovers</span>
              </button>
            </div>

            {/* Main Form Content - Scrollable */}
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
                          placeholder="Search recipe title, category, or ingredients..."
                          className="w-full pl-9 pr-8 py-2 rounded-xl border border-stone-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 bg-stone-50/60"
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
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
                        {[
                          { id: 'all', label: `All (${recipes.length})`, icon: '✨' },
                          { id: 'quick', label: 'Quick (<30m)', icon: '⚡' },
                          { id: 'comfort', label: 'Comfort', icon: '🍲' },
                          { id: 'healthy', label: 'Healthy', icon: '🥗' },
                          { id: 'baking', label: 'Baking', icon: '🥐' },
                        ].map((tab) => (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setSlotCategoryFilter(tab.id)}
                            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap text-xs transition-all flex items-center gap-1.5 border ${
                              slotCategoryFilter === tab.id
                                ? 'bg-teal-600 text-white border-teal-700 shadow-xs'
                                : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
                            }`}
                          >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Visual Grid of Recipes */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto p-1.5 border border-stone-200/90 rounded-2xl bg-stone-50/50">
                      {recipes
                        .filter((r) => {
                          const matchesCat =
                            slotCategoryFilter === 'all'
                              ? true
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
                            <button
                              key={r.id}
                              type="button"
                              onClick={() => {
                                setEditingSlot({
                                  ...editingSlot,
                                  currentTitle: r.title,
                                  currentRecipeId: r.id,
                                });
                              }}
                              className={`group text-left rounded-2xl border-2 transition-all overflow-hidden flex flex-col relative ${
                                isSelected
                                  ? 'bg-teal-50/90 border-teal-500 shadow-md ring-2 ring-teal-400/50 border-b-4 border-b-teal-600 scale-[1.01]'
                                  : 'bg-white border-stone-200 hover:border-teal-300 hover:shadow-md border-b-4 hover:-translate-y-0.5'
                              }`}
                            >
                              {/* Photo Header */}
                              <div className="relative h-28 w-full overflow-hidden bg-stone-200">
                                <img
                                  src={photo}
                                  alt={r.title}
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

                                {/* Active checkmark pill */}
                                {isSelected && (
                                  <div className="absolute top-2 right-2 bg-teal-500 text-white px-2 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 shadow-md animate-in zoom-in-75">
                                    <Check className="w-3 h-3 stroke-[3]" />
                                    <span>Selected</span>
                                  </div>
                                )}

                                {/* Bottom Time / Servings Pills */}
                                <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between text-[10px] text-white font-bold">
                                  <span className="flex items-center gap-1 bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded-full">
                                    <Clock className="w-2.5 h-2.5 text-teal-300" />
                                    {r.prepTime}
                                  </span>
                                  <span className="flex items-center gap-1 bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded-full">
                                    <Users className="w-2.5 h-2.5 text-amber-300" />
                                    {r.servings}p
                                  </span>
                                </div>
                              </div>

                              {/* Card Body */}
                              <div className="p-2.5 flex-1 flex flex-col justify-between">
                                <div>
                                  <h4 className="font-bold text-xs text-stone-900 line-clamp-2 leading-snug group-hover:text-teal-700 transition-colors">
                                    {r.title}
                                  </h4>
                                  <p className="text-[10px] text-stone-500 mt-1 flex items-center gap-1">
                                    <span>🥕</span>
                                    <span>{r.ingredients.length} ingredients</span>
                                  </p>
                                </div>
                                {isSelected && (
                                  <div className="mt-2 pt-1.5 border-t border-teal-200 flex items-center justify-between text-[10px] font-black text-teal-700">
                                    <span>Ready to schedule</span>
                                    <span>✓</span>
                                  </div>
                                )}
                              </div>
                            </button>
                          );
                        })
                      }

                      {/* + Import New Recipe Card */}
                      <button
                        type="button"
                        onClick={() => setIsImportModalOpen(true)}
                        className="min-h-[150px] rounded-2xl border-2 border-dashed border-teal-300 hover:border-teal-500 bg-teal-50/40 hover:bg-teal-50/80 p-4 flex flex-col items-center justify-center text-center transition-all group border-b-4"
                      >
                        <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                          <Plus className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-teal-900">+ Add / Import Recipe</span>
                        <span className="text-[10px] text-teal-600 mt-0.5">Link, photo or describe</span>
                      </button>
                    </div>

                    {/* Spotlight Box on Selected Recipe */}
                    {(() => {
                      const sel = recipes.find((r) => r.id === editingSlot.currentRecipeId);
                      if (!sel) return null;
                      return (
                        <div className="p-3 bg-gradient-to-r from-teal-50/90 to-emerald-50/80 border-2 border-teal-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs animate-in fade-in">
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={getRecipePhoto(sel)}
                              alt={sel.title}
                              className="w-13 h-13 rounded-xl object-cover shadow-2xs border border-teal-200 shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] uppercase font-black text-teal-700 tracking-wider">
                                  Current Selection
                                </span>
                                <span className="text-[10px] bg-teal-200/90 text-teal-900 px-1.5 py-0.2 rounded-md font-bold">
                                  ⏱️ {sel.prepTime}
                                </span>
                              </div>
                              <h4 className="text-sm font-black text-stone-900 truncate mt-0.5">
                                {sel.title}
                              </h4>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {sel.ingredients.slice(0, 3).map((ing, idx) => (
                                  <span
                                    key={idx}
                                    className="text-[10px] bg-white text-stone-600 px-1.5 py-0.5 rounded-md border border-stone-200 font-medium"
                                  >
                                    {ing.name}
                                  </span>
                                ))}
                                {sel.ingredients.length > 3 && (
                                  <span className="text-[10px] text-stone-500 font-medium">
                                    +{sel.ingredients.length - 3} more
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSyncRecipe(sel)}
                            className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs active:translate-y-0.5 transition-all border-b-2 border-teal-800"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span>Add to Groceries</span>
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  /* TAB 2: CUSTOM DISH / LEFTOVERS */
                  <div className="space-y-3 bg-stone-50/80 p-4 rounded-2xl border border-stone-200">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                        Dish Name or Meal Idea
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
                        placeholder="e.g. Leftover Lasagna, Friday Takeout, Grilled Paninis"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                        required
                      />
                    </div>

                    <div>
                      <span className="block text-[11px] font-bold text-stone-500 uppercase mb-1.5">
                        Quick Family Suggestions
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
                            className="px-3 py-1.5 rounded-xl bg-white border border-stone-200 hover:border-teal-400 hover:bg-teal-50/50 text-xs font-semibold text-stone-700 flex items-center gap-1.5 transition-all active:scale-95"
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
                <div className="pt-2 border-t border-stone-100">
                  <label className="block text-xs font-bold text-stone-600 uppercase mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <ChefHat className="w-4 h-4 text-amber-500" />
                      <span>Assigned Head Chef / Cooking Duty</span>
                    </span>
                    {editingSlot.currentChefId && (
                      <button
                        type="button"
                        onClick={() => setEditingSlot({ ...editingSlot, currentChefId: undefined })}
                        className="text-[11px] text-stone-400 hover:text-stone-600 underline font-semibold"
                      >
                        Clear chef
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
                              ? 'bg-amber-50 border-amber-400 shadow-xs ring-2 ring-amber-300/60 border-b-4 translate-y-[-1px]'
                              : 'bg-white border-stone-200 hover:border-stone-300 hover:bg-stone-50 border-b-2'
                          }`}
                        >
                          <div className="w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center text-lg shrink-0 shadow-2xs">
                            {m.avatar}
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="block text-xs font-bold text-stone-800 truncate">{m.name}</span>
                            <span className="text-[10px] text-stone-500 block truncate">
                              {isChef ? '👨‍🍳 Head Chef' : 'Helper'}
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
              <div className="flex items-center justify-between pt-3 border-t border-stone-100 mt-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingSlot(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-stone-500 hover:bg-stone-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!editingSlot.currentTitle.trim()}
                  className="px-6 py-2.5 rounded-2xl text-xs font-black bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white shadow-md active:translate-y-0.5 border-b-4 border-teal-800 transition-all flex items-center gap-1.5"
                >
                  <span>Save Meal Plan</span>
                  <span>✨</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Recipe Detail Modal */}
      {selectedRecipeForModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-stone-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="relative h-48 rounded-2xl overflow-hidden mb-4">
              <img
                src={selectedRecipeForModal.imageUrl}
                alt={selectedRecipeForModal.title}
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
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 capitalize">
                    {selectedRecipeForModal.category}
                  </span>
                  <span className="text-xs text-stone-500 font-semibold flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-500" />
                    {selectedRecipeForModal.prepTime}
                  </span>
                  <span className="text-xs text-stone-500 font-semibold flex items-center gap-1">
                    <Users className="w-3 h-3 text-blue-500" />
                    Serves {selectedRecipeForModal.servings}
                  </span>
                  {selectedRecipeForModal.sourceUrl && (
                    <a
                      href={selectedRecipeForModal.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-bold text-teal-600 hover:underline flex items-center gap-0.5 ml-auto"
                    >
                      <span>Original Link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-xl font-black text-stone-900 leading-tight">
                    {selectedRecipeForModal.title}
                  </h3>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setRecipeToEdit(selectedRecipeForModal);
                        setSelectedRecipeForModal(null);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold transition-all active:scale-95 shadow-2xs"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Edit Recipe</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRecipeToDelete(selectedRecipeForModal);
                        setSelectedRecipeForModal(null);
                      }}
                      className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all active:scale-95 shadow-2xs"
                      title="Delete recipe"
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
                        className="text-[10px] font-extrabold bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md border border-stone-200"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {selectedRecipeForModal.notes && (
                  <p className="text-xs text-stone-600 mt-2 bg-stone-50 p-2.5 rounded-xl border border-stone-200 font-medium">
                    {selectedRecipeForModal.notes}
                  </p>
                )}
              </div>

              {/* Ingredients List */}
              <div>
                <h4 className="text-xs font-black text-stone-700 uppercase tracking-wider mb-2">
                  Ingredients List ({selectedRecipeForModal.ingredients.length})
                </h4>
                <div className="divide-y divide-stone-100 border border-stone-200 rounded-2xl overflow-hidden">
                  {selectedRecipeForModal.ingredients.map((ing, idx) => (
                    <div
                      key={idx}
                      className="px-3.5 py-2 flex items-center justify-between text-xs bg-stone-50/40"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md ${
                            ing.category === 'produce'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ing.category === 'dairy'
                              ? 'bg-blue-100 text-blue-800'
                              : ing.category === 'meat'
                              ? 'bg-rose-100 text-rose-800'
                              : ing.category === 'bakery'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-stone-100 text-stone-700'
                          }`}
                        >
                          {ing.category}
                        </span>
                        <span className="font-extrabold text-stone-800">{ing.name}</span>
                      </div>
                      <span className="text-stone-500 font-bold bg-white px-2 py-0.5 rounded border border-stone-200">
                        {ing.amount}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Instructions List (if present) */}
              {selectedRecipeForModal.instructions && selectedRecipeForModal.instructions.length > 0 && (
                <div>
                  <h4 className="text-xs font-black text-stone-700 uppercase tracking-wider mb-2">
                    Step-by-Step Instructions ({selectedRecipeForModal.instructions.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedRecipeForModal.instructions.map((step, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2.5 p-2.5 bg-stone-50 rounded-xl border border-stone-200 text-xs"
                      >
                        <span className="w-5 h-5 rounded-full bg-amber-400 text-stone-900 font-black flex items-center justify-center shrink-0 text-[11px]">
                          {idx + 1}
                        </span>
                        <p className="text-stone-700 font-medium leading-relaxed">{step}</p>
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
                  <span>Send Ingredients to Grocery List (Skip Home Staples)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
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
          setSyncFeedback(`Recipe "${updated.title}" updated successfully! ✨`);
          setTimeout(() => setSyncFeedback(null), 4000);
        }}
        onDelete={(id) => {
          const rec = recipes.find((r) => r.id === id);
          deleteRecipe(id);
          setRecipeToEdit(null);
          setSyncFeedback(`Recipe "${rec?.title || 'Dish'}" deleted.`);
          setTimeout(() => setSyncFeedback(null), 4000);
        }}
      />

      {/* Recipe Delete Confirmation Dialog (From Card Quick Action or Modal) */}
      {recipeToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-2 border-stone-200 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-stone-900">Delete Recipe?</h3>
            <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
              Are you sure you want to delete <strong className="text-stone-900">"{recipeToDelete.title}"</strong>? This will remove it from your family recipe box and clear it from any planned weekly meals.
            </p>
            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => setRecipeToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteRecipe(recipeToDelete.id);
                  setSyncFeedback(`Recipe "${recipeToDelete.title}" deleted.`);
                  setRecipeToDelete(null);
                  setTimeout(() => setSyncFeedback(null), 4000);
                }}
                className="px-5 py-2.5 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors"
              >
                Yes, Delete Recipe
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
