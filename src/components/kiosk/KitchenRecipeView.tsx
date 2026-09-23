import React, { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import confetti from 'canvas-confetti';
import {
  ChefHat,
  Clock,
  Users,
  Timer,
  CheckCircle2,
  Circle,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Plus,
  Minus,
  Sparkles,
  BookOpen,
  Heart,
  Flame,
  UtensilsCrossed,
  ListOrdered,
  RotateCcw,
} from 'lucide-react';
import { Recipe, FamilyMember, MealPlanDay } from '../../types';
import { getRecipePhoto } from '../meal-planner/mealUtils';

interface KitchenRecipeViewProps {
  recipes: Recipe[];
  mealPlans: MealPlanDay[];
  members: FamilyMember[];
  initialRecipeId?: string | null;
  onReturnToStation: () => void;
  onOpenAssistant?: () => void;
}

export const KitchenRecipeView: React.FC<KitchenRecipeViewProps> = ({
  recipes,
  mealPlans,
  members: _members,
  initialRecipeId,
  onReturnToStation,
  onOpenAssistant,
}) => {
  const todayStr = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);

  // Today's meal plan
  const todayPlan = useMemo(() => mealPlans.find((m) => m.date === todayStr), [mealPlans, todayStr]);

  // Today's planned recipes
  const todayLunchRecipe = useMemo(() => {
    return todayPlan?.lunch?.recipeId ? recipes.find((r) => r.id === todayPlan.lunch?.recipeId) : null;
  }, [todayPlan, recipes]);

  const todayDinnerRecipe = useMemo(() => {
    return todayPlan?.dinner?.recipeId ? recipes.find((r) => r.id === todayPlan.dinner?.recipeId) : null;
  }, [todayPlan, recipes]);

  // Upcoming planned meals for the next 7 days
  const upcomingPlannedMeals = useMemo(() => {
    return mealPlans
      .filter((m) => m.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5)
      .map((plan) => {
        const dinnerR = plan.dinner?.recipeId ? recipes.find((r) => r.id === plan.dinner?.recipeId) : null;
        const lunchR = plan.lunch?.recipeId ? recipes.find((r) => r.id === plan.lunch?.recipeId) : null;
        return {
          date: plan.date,
          dinner: dinnerR,
          lunch: lunchR,
        };
      })
      .filter((item) => item.dinner || item.lunch);
  }, [mealPlans, recipes, todayStr]);

  // Selected Recipe
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(() => {
    if (initialRecipeId) {
      const match = recipes.find((r) => r.id === initialRecipeId);
      if (match) return match;
    }
    return todayDinnerRecipe || todayLunchRecipe || recipes[0] || null;
  });

  // Active view tab: 'cook' (Active Cooking Appliance Mode) or 'browse' (Browse recipes & meal plan)
  const [activeTab, setActiveTab] = useState<'cook' | 'browse'>(() =>
    selectedRecipe ? 'cook' : 'browse'
  );

  // Scaled servings
  const [servings, setServings] = useState<number>(() => selectedRecipe?.servings || 4);

  // Sync servings when selected recipe changes
  useEffect(() => {
    if (selectedRecipe?.servings) {
      setServings(selectedRecipe.servings);
    }
    setCheckedIngredients({});
    setActiveStepIndex(0);
  }, [selectedRecipe]);

  // Ingredient check-off state (index -> boolean)
  const [checkedIngredients, setCheckedIngredients] = useState<Record<number, boolean>>({});

  // Active Step Navigation
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [showAllSteps, setShowAllSteps] = useState(false);

  // Integrated Kitchen Timer
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Filter for browse mode
  const [browseCategory, setBrowseCategory] = useState<
    'all' | 'planned' | 'quick' | 'kids' | 'healthy' | 'warming' | 'favorites'
  >('all');

  // Play audio chime
  const playChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(739.99, now + 0.1); // F#5
      osc.frequency.setValueAtTime(880.0, now + 0.2); // A5
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.start(now);
      osc.stop(now + 0.45);
    } catch {}
  };

  // Timer countdown effect
  useEffect(() => {
    if (!isTimerRunning || timerSeconds === null) return;
    if (timerSeconds <= 0) {
      setIsTimerRunning(false);
      playChime();
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      return;
    }
    const interval = setInterval(() => {
      setTimerSeconds((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  // Toggle ingredient checkbox
  const toggleIngredient = (idx: number) => {
    playChime();
    setCheckedIngredients((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  // Format timer
  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Helper to dynamically scale ingredient amount
  const scaleAmount = (amountStr: string, baseServings: number, targetServings: number): string => {
    if (!amountStr || baseServings <= 0) return amountStr;
    const ratio = targetServings / baseServings;
    if (ratio === 1) return amountStr;

    // Match leading number (handles integers and decimals e.g. "800g", "0.5 TL", "2-3")
    const match = amountStr.match(/^([\d.,]+)\s*(.*)$/);
    if (!match) return amountStr;

    const rawNum = parseFloat(match[1].replace(',', '.'));
    if (isNaN(rawNum)) return amountStr;

    const scaled = rawNum * ratio;
    // Format nicely (e.g. 1.5 or 400)
    const formattedNum = scaled % 1 === 0 ? scaled.toString() : scaled.toFixed(1).replace('.0', '');
    const unit = match[2];
    return `${formattedNum} ${unit}`.trim();
  };

  // Filtered recipes for browse tab
  const filteredRecipes = useMemo(() => {
    return recipes.filter((r) => {
      if (browseCategory === 'favorites') return r.isFavorite;
      if (browseCategory === 'planned') {
        return mealPlans.some(
          (m) => m.dinner?.recipeId === r.id || m.lunch?.recipeId === r.id
        );
      }
      if (browseCategory === 'quick') {
        return (
          r.theme === 'quick' ||
          r.prepTime?.includes('15') ||
          r.prepTime?.includes('20') ||
          r.prepTime?.includes('25')
        );
      }
      if (browseCategory === 'kids') return r.theme === 'kids';
      if (browseCategory === 'healthy') return r.theme === 'healthy';
      if (browseCategory === 'warming') return r.theme === 'warming';
      return true;
    });
  }, [recipes, mealPlans, browseCategory]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0c1222] text-stone-900 dark:text-white select-none flex flex-col justify-between">
      {/* ========================================================================= */}
      {/* Top Kitchen Station Navigation Bar                                       */}
      {/* ========================================================================= */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-stone-200 dark:border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={onReturnToStation}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-800 dark:text-white font-black text-sm transition-all active:scale-95 shadow-2xs"
            title="Zurück zur Küchen-Station"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Station</span>
          </button>

          <div className="h-6 w-px bg-stone-200 dark:bg-slate-800 hidden sm:block" />

          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400">
              <ChefHat className="w-5 h-5 stroke-[2.5]" />
            </span>
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-tight leading-none text-stone-900 dark:text-white">
                Küchen-Kochstation
              </h1>
              <p className="text-[11px] font-bold text-stone-400 dark:text-slate-500 mt-0.5">
                {selectedRecipe ? selectedRecipe.title : 'Rezept auswählen'}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher: Koch-Modus vs Rezeptbuch */}
        <div className="flex items-center bg-stone-100 dark:bg-slate-800 p-1 rounded-2xl text-xs font-black shadow-2xs">
          <button
            onClick={() => setActiveTab('cook')}
            disabled={!selectedRecipe}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'cook'
                ? 'bg-amber-400 text-stone-900 shadow-xs'
                : 'text-stone-600 dark:text-slate-300 hover:text-stone-900 disabled:opacity-40'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>Koch-Modus</span>
          </button>
          <button
            onClick={() => setActiveTab('browse')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'browse'
                ? 'bg-amber-400 text-stone-900 shadow-xs'
                : 'text-stone-600 dark:text-slate-300 hover:text-stone-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Rezeptbuch ({recipes.length})</span>
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 1. KOCH-MODUS (Active Appliance Cooking Screen)                          */}
      {/* ========================================================================= */}
      {activeTab === 'cook' && selectedRecipe && (
        <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Image, Servings Scaler, Ingredients Checklist & Timer */}
          <div className="lg:col-span-5 space-y-6">
            {/* Hero Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border-2 border-stone-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
              <div className="relative h-44 rounded-2xl overflow-hidden mb-4 shadow-inner">
                <img
                  src={getRecipePhoto(selectedRecipe)}
                  alt={selectedRecipe.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-amber-400 text-stone-900 capitalize shadow-xs">
                      {selectedRecipe.category}
                    </span>
                    <span className="text-[11px] font-bold text-white/90 bg-black/40 backdrop-blur-md px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-300" />
                      {selectedRecipe.prepTime}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                    {selectedRecipe.title}
                  </h2>
                </div>
              </div>

              {/* Portion Scaler */}
              <div className="flex items-center justify-between bg-stone-50 dark:bg-slate-800/80 p-3.5 rounded-2xl border border-stone-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-bold text-stone-600 dark:text-slate-300">
                    Portionen anpassen:
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setServings((s) => Math.max(1, s - 1))}
                    className="w-8 h-8 rounded-xl bg-white dark:bg-slate-700 hover:bg-stone-100 flex items-center justify-center font-black text-stone-800 dark:text-white shadow-2xs border border-stone-200 dark:border-slate-600 active:scale-95 transition-transform"
                    title="Eine Portion weniger"
                  >
                    <Minus className="w-4 h-4 stroke-[3]" />
                  </button>
                  <span className="text-base font-black font-mono w-6 text-center text-stone-900 dark:text-white">
                    {servings}
                  </span>
                  <button
                    onClick={() => setServings((s) => s + 1)}
                    className="w-8 h-8 rounded-xl bg-white dark:bg-slate-700 hover:bg-stone-100 flex items-center justify-center font-black text-stone-800 dark:text-white shadow-2xs border border-stone-200 dark:border-slate-600 active:scale-95 transition-transform"
                    title="Eine Portion mehr"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                  </button>
                </div>
              </div>

              {/* Synergy / Chef Note if available */}
              {selectedRecipe.synergyTip && (
                <div className="mt-3 p-3 bg-teal-50 dark:bg-teal-950/40 rounded-2xl border border-teal-200 dark:border-teal-800 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                  <p className="text-xs font-bold text-teal-900 dark:text-teal-200 leading-snug">
                    {selectedRecipe.synergyTip}
                  </p>
                </div>
              )}
            </div>

            {/* Kitchen Timer Widget */}
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-3xl p-5 shadow-md space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Timer className="w-5 h-5 text-amber-100" />
                  <span className="text-xs font-black uppercase tracking-wider text-amber-100">
                    Küchen-Timer
                  </span>
                </div>
                {timerSeconds !== null && timerSeconds > 0 && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/20 text-white">
                    {isTimerRunning ? 'Läuft...' : 'Pausiert'}
                  </span>
                )}
              </div>

              <div className="text-center py-1 font-mono">
                <span className="text-4xl sm:text-5xl font-black tracking-tight drop-shadow-sm">
                  {timerSeconds !== null ? formatTimer(timerSeconds) : '00:00'}
                </span>
              </div>

              {/* Timer Controls */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                {timerSeconds !== null && timerSeconds > 0 ? (
                  <>
                    <button
                      onClick={() => setIsTimerRunning(!isTimerRunning)}
                      className="px-4 py-2 rounded-xl bg-white text-orange-600 font-black text-xs shadow-xs hover:bg-orange-50 active:scale-95 transition-all"
                    >
                      {isTimerRunning ? 'Pause' : 'Fortsetzen'}
                    </button>
                    <button
                      onClick={() => {
                        setTimerSeconds((prev) => (prev !== null ? prev + 60 : 60));
                      }}
                      className="px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs transition-colors"
                    >
                      +1 Min
                    </button>
                    <button
                      onClick={() => {
                        setTimerSeconds((prev) => (prev !== null ? prev + 300 : 300));
                      }}
                      className="px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs transition-colors"
                    >
                      +5 Min
                    </button>
                    <button
                      onClick={() => {
                        setTimerSeconds(null);
                        setIsTimerRunning(false);
                      }}
                      className="px-3 py-2 rounded-xl bg-black/20 hover:bg-black/30 text-white font-bold text-xs transition-colors flex items-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Stop</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setTimerSeconds(5 * 60);
                        setIsTimerRunning(true);
                        playChime();
                      }}
                      className="px-3.5 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-black text-xs transition-all"
                    >
                      5 Min
                    </button>
                    <button
                      onClick={() => {
                        setTimerSeconds(10 * 60);
                        setIsTimerRunning(true);
                        playChime();
                      }}
                      className="px-3.5 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-black text-xs transition-all"
                    >
                      10 Min
                    </button>
                    <button
                      onClick={() => {
                        setTimerSeconds(20 * 60);
                        setIsTimerRunning(true);
                        playChime();
                      }}
                      className="px-4 py-2 rounded-xl bg-white text-orange-600 font-black text-xs shadow-xs hover:bg-orange-50 active:scale-95 transition-all"
                    >
                      20 Min starten
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Ingredients Checklist */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border-2 border-stone-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UtensilsCrossed className="w-4 h-4 text-orange-500" />
                  <h3 className="text-sm font-black uppercase tracking-wider text-stone-800 dark:text-stone-200">
                    Zutaten abstreichen ({selectedRecipe.ingredients.length})
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-stone-400">
                  {Object.values(checkedIngredients).filter(Boolean).length} / {selectedRecipe.ingredients.length}
                </span>
              </div>

              <p className="text-[11px] font-medium text-stone-400 dark:text-slate-500">
                Tippe auf eine Zutat, sobald sie im Topf ist:
              </p>

              <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
                {selectedRecipe.ingredients.map((ing, idx) => {
                  const isChecked = !!checkedIngredients[idx];
                  const scaledAmountStr = scaleAmount(
                    ing.amount,
                    selectedRecipe.servings || 4,
                    servings
                  );

                  return (
                    <button
                      key={idx}
                      onClick={() => toggleIngredient(idx)}
                      className={`w-full p-2.5 rounded-2xl border-2 flex items-center justify-between text-left transition-all active:scale-98 ${
                        isChecked
                          ? 'bg-stone-50 dark:bg-slate-800/40 border-stone-200 dark:border-slate-700 text-stone-400 dark:text-slate-500 line-through opacity-70'
                          : 'bg-stone-50 dark:bg-slate-800/80 border-stone-200 dark:border-slate-700 text-stone-800 dark:text-white hover:border-amber-400'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {isChecked ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                        ) : (
                          <Circle className="w-5 h-5 text-stone-400 dark:text-slate-500 shrink-0" />
                        )}
                        <span className="text-xs sm:text-sm font-extrabold truncate">
                          {ing.name}
                        </span>
                      </div>
                      <span className="text-xs font-black font-mono px-2 py-0.5 rounded-lg bg-white dark:bg-slate-700 border border-stone-200 dark:border-slate-600 text-stone-700 dark:text-slate-200 shrink-0">
                        {scaledAmountStr}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Step-by-Step Cooking Guide (Extra Large Appliance Typography) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border-2 border-stone-200 dark:border-slate-800 shadow-sm space-y-6">
              {/* Header with Step View Mode Toggle */}
              <div className="flex items-center justify-between gap-3 border-b border-stone-100 dark:border-slate-800 pb-4">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                    <ListOrdered className="w-4 h-4" />
                    <span>Zubereitung</span>
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-stone-900 dark:text-white mt-0.5">
                    Schritt-für-Schritt Kochanleitung
                  </h3>
                </div>

                <button
                  onClick={() => setShowAllSteps(!showAllSteps)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-200 transition-colors"
                >
                  {showAllSteps ? 'Schritt-Ansicht' : 'Alle Schritte'}
                </button>
              </div>

              {/* Mode A: Step-by-Step Focus (Appliance Design readable from 3-5 feet) */}
              {!showAllSteps && selectedRecipe.instructions && selectedRecipe.instructions.length > 0 && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  {/* Step Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-black">
                      <span className="text-stone-500 dark:text-slate-400 uppercase tracking-wider">
                        Schritt {activeStepIndex + 1} von {selectedRecipe.instructions.length}
                      </span>
                      <span className="text-amber-500">
                        {Math.round(((activeStepIndex + 1) / selectedRecipe.instructions.length) * 100)}% abgeschlossen
                      </span>
                    </div>
                    <div className="h-2.5 bg-stone-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-300 rounded-full"
                        style={{
                          width: `${((activeStepIndex + 1) / selectedRecipe.instructions.length) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Giant Step Focus Card */}
                  <div className="min-h-[220px] bg-gradient-to-br from-amber-50/50 to-orange-50/30 dark:from-slate-800/60 dark:to-slate-800/30 p-6 sm:p-8 rounded-3xl border-2 border-amber-200 dark:border-amber-900/40 flex flex-col justify-between">
                    <div>
                      <div className="w-10 h-10 rounded-2xl bg-amber-400 text-stone-900 font-black text-lg flex items-center justify-center shadow-xs mb-4">
                        {activeStepIndex + 1}
                      </div>
                      <p className="text-lg sm:text-2xl font-bold text-stone-800 dark:text-stone-100 leading-relaxed">
                        {selectedRecipe.instructions[activeStepIndex]}
                      </p>
                    </div>
                  </div>

                  {/* Large Touch Navigation Bar (Tappable with knuckles/wet hands) */}
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <button
                      onClick={() => {
                        playChime();
                        setActiveStepIndex((i) => Math.max(0, i - 1));
                      }}
                      disabled={activeStepIndex === 0}
                      className="py-4 px-6 rounded-2xl border-2 border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-stone-50 font-black text-sm sm:text-base text-stone-700 dark:text-slate-200 flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-30 disabled:pointer-events-none shadow-2xs"
                    >
                      <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
                      <span>Voriger Schritt</span>
                    </button>

                    <button
                      onClick={() => {
                        playChime();
                        const totalSteps = selectedRecipe.instructions?.length || 0;
                        if (activeStepIndex < totalSteps - 1) {
                          setActiveStepIndex((i) => i + 1);
                        } else {
                          confetti({ particleCount: 100, spread: 80 });
                        }
                      }}
                      className="py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-stone-950 font-black text-sm sm:text-base flex items-center justify-center gap-2 active:scale-98 transition-all shadow-md"
                    >
                      <span>
                        {selectedRecipe.instructions && activeStepIndex < selectedRecipe.instructions.length - 1
                          ? 'Nächster Schritt'
                          : 'Fertig! Guten Appetit 🎉'}
                      </span>
                      <ChevronRight className="w-5 h-5 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              )}

              {/* Mode B: All Steps View */}
              {showAllSteps && selectedRecipe.instructions && (
                <div className="space-y-3 animate-in fade-in duration-300">
                  {selectedRecipe.instructions.map((step, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setActiveStepIndex(idx);
                        setShowAllSteps(false);
                      }}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-4 ${
                        activeStepIndex === idx
                          ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800'
                          : 'bg-stone-50 dark:bg-slate-800/50 border-stone-200 dark:border-slate-700 hover:bg-stone-100'
                      }`}
                    >
                      <span className="w-8 h-8 rounded-xl bg-amber-400 text-stone-900 font-black text-sm flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <p className="text-sm sm:text-base font-semibold text-stone-800 dark:text-stone-200 leading-relaxed">
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Bottom Quick Switcher */}
              <div className="pt-4 border-t border-stone-100 dark:border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => setActiveTab('browse')}
                  className="text-xs font-black text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1.5"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Anderes Gericht aus dem Rezeptbuch wählen</span>
                </button>

                {onOpenAssistant && (
                  <button
                    onClick={onOpenAssistant}
                    className="text-xs font-black text-stone-500 dark:text-slate-400 hover:text-amber-500 flex items-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Assistenten fragen</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ========================================================================= */}
      {/* 2. REZEPTBUCH / BROWSE TAB                                               */}
      {/* ========================================================================= */}
      {activeTab === 'browse' && (
        <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Today's Highlight Banner */}
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-3xl p-6 sm:p-8 shadow-md">
            <span className="text-xs font-black uppercase tracking-wider text-orange-100 flex items-center gap-1.5 mb-2">
              <ChefHat className="w-4 h-4" />
              <span>Heute auf dem Speiseplan</span>
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              {/* Today's Dinner */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 flex items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-orange-200">
                    Abendessen
                  </span>
                  <h3 className="text-lg font-black text-white">
                    {todayDinnerRecipe ? todayDinnerRecipe.title : 'Kein Gericht hinterlegt'}
                  </h3>
                  {todayDinnerRecipe && (
                    <span className="text-xs text-orange-100 font-semibold flex items-center gap-1 mt-1">
                      <Clock className="w-3.5 h-3.5" />
                      {todayDinnerRecipe.prepTime} • {todayDinnerRecipe.servings} Portionen
                    </span>
                  )}
                </div>

                {todayDinnerRecipe && (
                  <button
                    onClick={() => {
                      setSelectedRecipe(todayDinnerRecipe);
                      setActiveTab('cook');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-white text-orange-600 font-black text-xs shrink-0 shadow-sm hover:bg-orange-50 active:scale-95 transition-all"
                  >
                    Jetzt kochen 👨‍🍳
                  </button>
                )}
              </div>

              {/* Today's Lunch */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 flex items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-orange-200">
                    Mittagessen
                  </span>
                  <h3 className="text-lg font-black text-white">
                    {todayLunchRecipe ? todayLunchRecipe.title : 'Kein Gericht hinterlegt'}
                  </h3>
                  {todayLunchRecipe && (
                    <span className="text-xs text-orange-100 font-semibold flex items-center gap-1 mt-1">
                      <Clock className="w-3.5 h-3.5" />
                      {todayLunchRecipe.prepTime} • {todayLunchRecipe.servings} Portionen
                    </span>
                  )}
                </div>

                {todayLunchRecipe && (
                  <button
                    onClick={() => {
                      setSelectedRecipe(todayLunchRecipe);
                      setActiveTab('cook');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-white text-orange-600 font-black text-xs shrink-0 shadow-sm hover:bg-orange-50 active:scale-95 transition-all"
                  >
                    Jetzt kochen 👨‍🍳
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Upcoming Week Plans Ribbon */}
          {upcomingPlannedMeals.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border-2 border-stone-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-wider text-stone-500 dark:text-slate-400 mb-3">
                Kommende Tage auf dem Menüplan:
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {upcomingPlannedMeals.map((item, i) => {
                  const targetRecipe = item.dinner || item.lunch;
                  if (!targetRecipe) return null;
                  const dayDate = new Date(item.date);
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        setSelectedRecipe(targetRecipe);
                        setActiveTab('cook');
                      }}
                      className="p-3 rounded-2xl bg-stone-50 dark:bg-slate-800/80 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-stone-200 dark:border-slate-700 text-left transition-all active:scale-98"
                    >
                      <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400">
                        {format(dayDate, 'EEEE', { locale: de })}
                      </span>
                      <p className="text-xs font-black text-stone-900 dark:text-white truncate mt-0.5">
                        {targetRecipe.title}
                      </p>
                      <span className="text-[10px] text-stone-400 flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" />
                        {targetRecipe.prepTime}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recipe Category Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'all', label: 'Alle Rezepte' },
              { id: 'planned', label: '🗓️ Geplant' },
              { id: 'quick', label: '⚡ Blitzschnell (<25m)' },
              { id: 'kids', label: '👶 Kinder-Hits' },
              { id: 'healthy', label: '🥗 Gesund & Vital' },
              { id: 'warming', label: '🍲 Wärmend' },
              { id: 'favorites', label: '❤️ Favoriten' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setBrowseCategory(cat.id as any)}
                className={`px-3.5 py-2 rounded-2xl font-black text-xs shrink-0 transition-all ${
                  browseCategory === cat.id
                    ? 'bg-amber-400 text-stone-900 shadow-xs'
                    : 'bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-stone-600 dark:text-slate-300 hover:bg-stone-50'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Recipe Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredRecipes.map((recipe) => (
              <div
                key={recipe.id}
                onClick={() => {
                  setSelectedRecipe(recipe);
                  setActiveTab('cook');
                }}
                className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-stone-200 dark:border-slate-800 overflow-hidden shadow-2xs hover:shadow-md hover:border-amber-400 dark:hover:border-amber-500 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="relative h-36 overflow-hidden">
                  <img
                    src={getRecipePhoto(recipe)}
                    alt={recipe.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2.5 right-2.5 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-full text-white text-[10px] font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-300" />
                    {recipe.prepTime}
                  </div>
                  {recipe.isFavorite && (
                    <span className="absolute top-2.5 left-2.5 p-1 rounded-full bg-rose-500 text-white shadow-xs">
                      <Heart className="w-3 h-3 fill-white" />
                    </span>
                  )}
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400">
                      {recipe.category}
                    </span>
                    <h4 className="text-sm font-black text-stone-900 dark:text-white leading-snug line-clamp-2 mt-0.5">
                      {recipe.title}
                    </h4>
                  </div>

                  <div className="pt-2 border-t border-stone-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-400">
                      {recipe.servings} Portionen
                    </span>
                    <span className="text-xs font-black text-orange-600 dark:text-orange-400 group-hover:underline">
                      Kochen →
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      )}

      {/* Footer Return Bar */}
      <footer className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-stone-200 dark:border-slate-800 px-4 sm:px-8 py-3 flex items-center justify-between text-xs font-bold text-stone-500">
        <span>Küchen-Kiosk • Kochmodus aktiv</span>
        <button
          onClick={onReturnToStation}
          className="text-orange-600 dark:text-orange-400 hover:underline font-black"
        >
          Zurück zur Station 🏡
        </button>
      </footer>
    </div>
  );
};
