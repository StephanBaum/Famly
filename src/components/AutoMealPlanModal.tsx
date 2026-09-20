import React, { useState, useEffect, useMemo } from 'react';
import { Recipe, MealPlanDay } from '../types';
import { RECIPE_THEMES, CURATED_RECIPE_CATALOG } from '../utils/recipeCatalog';
import { ModalPortal } from './ModalPortal';
import { MealPlanPreviewCard } from './meal-planner/MealPlanPreviewCard';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  X,
  Sparkles,
  RefreshCw,
  Calendar,
  ShoppingCart,
  Zap,
  ChevronDown,
  ChevronUp,
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
    syncGroceries: boolean,
    groceriesToSync?: Array<{ date: string; recipe: Recipe }>
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
  synergyConnection?: {
    type: 'cook-extra' | 'use-leftovers';
    partnerDayName: string;
    baseName: string;
    tip: string;
    timeSaved: number;
  };
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
  const [syncScope, setSyncScope] = useState<'all' | 'first4days'>('all');
  const [showGroceryPreview, setShowGroceryPreview] = useState<boolean>(false);

  const [assignments, setAssignments] = useState<PlannedDayAssignment[]>([]);

  // Combined recipe pool: user's recipe box + curated catalog (deduplicated by title)
  const allAvailableRecipes = useMemo(() => {
    const existingTitles = new Set(recipes.map((r) => r.title.toLowerCase().trim()));
    const additionalFromCatalog = CURATED_RECIPE_CATALOG.filter(
      (c) => !existingTitles.has(c.title.toLowerCase().trim())
    );
    return [...recipes, ...additionalFromCatalog];
  }, [recipes]);

  // Favorite recipes pool
  const favoriteRecipes = useMemo(() => {
    return allAvailableRecipes.filter((r) => r.isFavorite);
  }, [allAvailableRecipes]);

  // Discoverable new recipes
  const discoverRecipes = useMemo(() => {
    return allAvailableRecipes.filter((r) => !r.isFavorite);
  }, [allAvailableRecipes]);

  // Helper to resolve or synthesize a recipe with full ingredients if missing
  const resolveFullRecipe = (title: string, existingRecipeId?: string): Recipe => {
    if (existingRecipeId) {
      const found = allAvailableRecipes.find((r) => r.id === existingRecipeId);
      if (found) return found;
    }
    const matchByTitle = allAvailableRecipes.find(
      (r) => r.title.toLowerCase().trim() === title.toLowerCase().trim()
    );
    if (matchByTitle) return matchByTitle;

    // Synthesize realistic family ingredients from title keywords
    const lower = title.toLowerCase();
    if (lower.includes('lachs') || lower.includes('fisch')) {
      return {
        id: `synth_${Date.now()}_lachs`,
        title,
        prepTime: '25 Min.',
        servings: 5,
        category: 'healthy',
        mainProtein: 'fish',
        estimatedCost: 16.0,
        imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80',
        ingredients: [
          { name: 'Lachsfilet (frisch)', amount: '600g', category: 'meat' },
          { name: 'Frischer Brokkoli', amount: '500g', category: 'produce' },
          { name: 'Jasminreis', amount: '500g', category: 'pantry' },
          { name: 'Sojasauce', amount: '2 EL', category: 'pantry' },
          { name: 'Bio-Honig', amount: '2 EL', category: 'pantry' },
        ],
        instructions: [
          'Jasminreis in leichtem Salzwasser aufkochen und 12 Minuten quellen lassen.',
          'Lachs mit Sojasauce und Honig marinieren.',
          'Brokkoli 4 Minuten dämpfen.',
          'Lachs von jeder Seite 3 Minuten scharf anbraten und mit Reis und Brokkoli servieren.',
        ],
      };
    }
    if (lower.includes('schmor') || lower.includes('gulasch') || lower.includes('rind')) {
      return {
        id: `synth_${Date.now()}_schmor`,
        title,
        prepTime: '45 Min.',
        servings: 5,
        category: 'comfort',
        mainProtein: 'meat',
        estimatedCost: 15.0,
        imageUrl: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=600&q=80',
        ingredients: [
          { name: 'Rindergulasch (gewürfelt)', amount: '600g', category: 'meat' },
          { name: 'Festkochende Kartoffeln', amount: '1kg', category: 'produce' },
          { name: 'Bundmöhren', amount: '500g', category: 'produce' },
          { name: 'Rinderbrühe', amount: '500ml', category: 'pantry' },
        ],
        instructions: [
          'Fleisch scharf anbraten, Möhren und Zwiebeln zugeben.',
          'Mit Rinderbrühe ablöschen und 35 Minuten schmoren.',
          'Kartoffeln zugeben und 15 Minuten weich köcheln.',
          'Heiß abschmecken und servieren.',
        ],
      };
    }
    if (lower.includes('bowl') || lower.includes('salat')) {
      return {
        id: `synth_${Date.now()}_bowl`,
        title,
        prepTime: '20 Min.',
        servings: 5,
        category: 'healthy',
        mainProtein: 'vegetarian',
        estimatedCost: 11.5,
        imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
        ingredients: [
          { name: 'Basmatireis', amount: '300g', category: 'pantry' },
          { name: 'Reife Avocados', amount: '2 Stück', category: 'produce' },
          { name: 'Kichererbsen (Dose)', amount: '1 Dose (400g)', category: 'pantry' },
          { name: 'Feta-Käse', amount: '200g', category: 'dairy' },
          { name: 'Kirschtomaten', amount: '250g', category: 'produce' },
        ],
        instructions: [
          'Reis garen und leicht abkühlen lassen.',
          'Kichererbsen in der Pfanne mit etwas Olivenöl anrösten.',
          'Tomaten halbieren, Avocado in Scheiben fächern.',
          'Alles in Bowls anrichten und mit Feta toppen.',
        ],
      };
    }
    // Default complete family pasta recipe
    return {
      id: `synth_${Date.now()}_pasta`,
      title,
      prepTime: '20 Min.',
      servings: 5,
      category: 'quick',
      mainProtein: 'pasta',
      estimatedCost: 9.0,
      imageUrl: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=600&q=80',
      ingredients: [
        { name: 'Spaghetti', amount: '500g', category: 'pantry' },
        { name: 'Kirschtomaten', amount: '250g', category: 'produce' },
        { name: 'Frisches Basilikum', amount: '1 Bund', category: 'produce' },
        { name: 'Parmesankäse', amount: '100g', category: 'dairy' },
        { name: 'Natives Olivenöl extra', amount: '3 EL', category: 'pantry' },
      ],
      instructions: [
        'Spaghetti in Salzwasser al dente kochen.',
        'Kirschtomaten in Olivenöl anschwenken.',
        'Heiße Nudeln, Basilikum und Parmesan unterheben.',
        'Mit Salz und Pfeffer abschmecken.',
      ],
    };
  };

  // Smart candidate picker with strict zero-duplicate rule and protein diversity
  const pickCandidate = (
    mode: PlanSourceMode,
    theme: PlanThemeFilter,
    excludeIds: Set<string>,
    lastProtein?: string,
    proteinCounts: Map<string, number> = new Map()
  ): Recipe => {
    let pool: Recipe[] = [];

    if (mode === 'favorites') {
      pool = favoriteRecipes;
    } else if (mode === 'discover') {
      pool = discoverRecipes;
    } else {
      // 50/50 mix
      const pickFav = Math.random() < 0.5 && favoriteRecipes.length > 0;
      pool = pickFav ? favoriteRecipes : discoverRecipes;
    }

    if (pool.length === 0) {
      pool = allAvailableRecipes;
    }

    // Apply theme filter
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

    // STRICT HARD RULE: Exclude all recipes already picked in this week!
    let available = pool.filter((r) => !excludeIds.has(r.id));

    // Fallback: If chosen theme/mode has fewer than 7 unique recipes, draw from the 40+ catalog
    if (available.length === 0) {
      available = allAvailableRecipes.filter((r) => !excludeIds.has(r.id));
    }
    // Absolute fallback (emergency only, if entire catalog >40 was somehow exhausted)
    if (available.length === 0) {
      available = allAvailableRecipes;
    }

    // VARIETY GUARD (Soft Filters):
    // 1. Avoid repeating same mainProtein on consecutive days (e.g. no fish 2 days in a row)
    // 2. Max 2x fish/salmon per week
    // 3. Max 2x red meat per week
    let scoredCandidates = available.filter((r) => {
      const protein = r.mainProtein || 'vegetarian';
      if (lastProtein && protein === lastProtein && (protein === 'fish' || protein === 'meat')) {
        return false;
      }
      const count = proteinCounts.get(protein) || 0;
      if (protein === 'fish' && count >= 2) return false;
      if (protein === 'meat' && count >= 2) return false;
      return true;
    });

    if (scoredCandidates.length === 0) {
      // Relax protein constraints if pool is tight, but strictly maintain zero duplicate IDs
      scoredCandidates = available;
    }

    const randomIndex = Math.floor(Math.random() * scoredCandidates.length);
    return scoredCandidates[randomIndex] || available[0] || allAvailableRecipes[0];
  };

  // Generate the full plan with guaranteed, smart Batch-Prep Synergies
  const generatePlan = () => {
    const chosenIds = new Set<string>();
    const proteinCounts = new Map<string, number>();
    const newAssignments: (PlannedDayAssignment | null)[] = new Array(weekDays.length).fill(null);

    // 1. Lock in already planned days if onlyEmptyDays is set
    for (let dayIdx = 0; dayIdx < weekDays.length; dayIdx++) {
      const day = weekDays[dayIdx];
      const dateStr = format(day, 'yyyy-MM-dd');
      const existingPlan = currentMealPlans.find((p) => p.date === dateStr);
      const isAlreadyPlanned = Boolean(existingPlan?.dinner?.title);

      if (onlyEmptyDays && isAlreadyPlanned) {
        const fullRecipe = resolveFullRecipe(
          existingPlan!.dinner!.title,
          existingPlan!.dinner!.recipeId
        );
        chosenIds.add(fullRecipe.id);
        const prot = fullRecipe.mainProtein || 'vegetarian';
        proteinCounts.set(prot, (proteinCounts.get(prot) || 0) + 1);

        newAssignments[dayIdx] = {
          dateStr,
          dayName: format(day, 'EEEE', { locale: de }),
          formattedDate: format(day, 'd. MMMM', { locale: de }),
          recipe: fullRecipe,
          isAlreadyPlanned: true,
        };
      }
    }

    // 2. Actively schedule intentional synergy pairs!
    // In a 7-day schedule: guarantee 1-2 pairs (e.g. Days 1->2 and Days 4->5).
    // In a 14-day schedule: guarantee 2-3 pairs (e.g. Days 1->2, Days 4->5, Days 8->9).
    const candidatePairSlots: number[] = [];
    for (let i = 0; i < weekDays.length - 1; i++) {
      if (!newAssignments[i] && !newAssignments[i + 1]) {
        candidatePairSlots.push(i);
      }
    }

    const targetPairsCount = weekDays.length > 7 ? 3 : (weekDays.length >= 5 ? 2 : 1);
    const synergyBases: Array<'rice' | 'potatoes' | 'chicken' | 'pasta' | 'veggies'> = [
      'rice',
      'potatoes',
      'chicken',
      'pasta',
      'veggies',
    ];
    // Shuffle synergy bases to keep each generation varied
    const shuffledBases = [...synergyBases].sort(() => 0.5 - Math.random());

    let pairsPlaced = 0;
    for (const slotIdx of candidatePairSlots) {
      if (pairsPlaced >= targetPairsCount) break;
      if (newAssignments[slotIdx] || newAssignments[slotIdx + 1]) continue;

      const base = shuffledBases[pairsPlaced % shuffledBases.length];

      const cookExtraPool = allAvailableRecipes.filter(
        (r) => r.synergyBase === base && r.synergyRole === 'cook-extra' && !chosenIds.has(r.id)
      );
      const useLeftoversPool = allAvailableRecipes.filter(
        (r) => r.synergyBase === base && r.synergyRole === 'use-leftovers' && !chosenIds.has(r.id)
      );

      if (cookExtraPool.length > 0 && useLeftoversPool.length > 0) {
        const cookExtraRecipe = cookExtraPool[Math.floor(Math.random() * cookExtraPool.length)];
        const useLeftoversRecipe = useLeftoversPool[Math.floor(Math.random() * useLeftoversPool.length)];

        chosenIds.add(cookExtraRecipe.id);
        chosenIds.add(useLeftoversRecipe.id);

        const prot1 = cookExtraRecipe.mainProtein || 'vegetarian';
        const prot2 = useLeftoversRecipe.mainProtein || 'vegetarian';
        proteinCounts.set(prot1, (proteinCounts.get(prot1) || 0) + 1);
        proteinCounts.set(prot2, (proteinCounts.get(prot2) || 0) + 1);

        const day1 = weekDays[slotIdx];
        const day2 = weekDays[slotIdx + 1];
        const day1Name = format(day1, 'EEEE', { locale: de });
        const day2Name = format(day2, 'EEEE', { locale: de });

        const baseName =
          base === 'rice'
            ? 'Reis'
            : base === 'potatoes'
            ? 'Kartoffeln'
            : base === 'chicken'
            ? 'Hähnchen'
            : base === 'pasta'
            ? 'Nudeln'
            : 'Süßkartoffeln / Gemüse';

        newAssignments[slotIdx] = {
          dateStr: format(day1, 'yyyy-MM-dd'),
          dayName: day1Name,
          formattedDate: format(day1, 'd. MMMM', { locale: de }),
          recipe: cookExtraRecipe,
          isAlreadyPlanned: false,
          synergyConnection: {
            type: 'cook-extra',
            partnerDayName: day2Name,
            baseName,
            tip: cookExtraRecipe.synergyTip || `Koche heute extra ${baseName} für morgen!`,
            timeSaved: useLeftoversRecipe.timeSavedMinutes || 15,
          },
        };

        newAssignments[slotIdx + 1] = {
          dateStr: format(day2, 'yyyy-MM-dd'),
          dayName: day2Name,
          formattedDate: format(day2, 'd. MMMM', { locale: de }),
          recipe: useLeftoversRecipe,
          isAlreadyPlanned: false,
          synergyConnection: {
            type: 'use-leftovers',
            partnerDayName: day1Name,
            baseName,
            tip: useLeftoversRecipe.synergyTip || `Nutzt den gekochten ${baseName} von gestern!`,
            timeSaved: useLeftoversRecipe.timeSavedMinutes || 15,
          },
        };

        pairsPlaced++;
      }
    }

    // 3. Fill all remaining open days
    for (let dayIdx = 0; dayIdx < weekDays.length; dayIdx++) {
      if (newAssignments[dayIdx]) continue;

      const day = weekDays[dayIdx];
      const dateStr = format(day, 'yyyy-MM-dd');
      const prevAssignment = dayIdx > 0 ? newAssignments[dayIdx - 1] : undefined;
      const lastProtein = prevAssignment?.recipe?.mainProtein;

      const recipe = pickCandidate(sourceMode, themeFilter, chosenIds, lastProtein, proteinCounts);
      chosenIds.add(recipe.id);
      const prot = recipe.mainProtein || 'vegetarian';
      proteinCounts.set(prot, (proteinCounts.get(prot) || 0) + 1);

      newAssignments[dayIdx] = {
        dateStr,
        dayName: format(day, 'EEEE', { locale: de }),
        formattedDate: format(day, 'd. MMMM', { locale: de }),
        recipe,
        isAlreadyPlanned: false,
      };
    }

    setAssignments(newAssignments as PlannedDayAssignment[]);
  };

  // Single-day shuffle: replace one day's recipe while preserving zero duplicates and checking synergy
  const handleShuffleSingleDay = (index: number) => {
    setAssignments((prev) => {
      const current = prev[index];
      if (!current) return prev;

      const otherIds = new Set(prev.filter((_, i) => i !== index).map((a) => a.recipe.id));
      otherIds.add(current.recipe.id); // exclude current to get a brand-new distinct one

      const prevAssignment = index > 0 ? prev[index - 1] : undefined;
      const nextAssignment = index < prev.length - 1 ? prev[index + 1] : undefined;

      let synergyPartner: Recipe | undefined;
      let synergyConn: PlannedDayAssignment['synergyConnection'] = undefined;

      // If previous day has cook-extra, prioritize matching use-leftovers!
      if (prevAssignment?.recipe.synergyRole === 'cook-extra' && prevAssignment.recipe.synergyBase) {
        const base = prevAssignment.recipe.synergyBase;
        synergyPartner = allAvailableRecipes.find(
          (r) => r.synergyBase === base && r.synergyRole === 'use-leftovers' && !otherIds.has(r.id)
        );
        if (synergyPartner) {
          const baseName =
            base === 'rice'
              ? 'Reis'
              : base === 'potatoes'
              ? 'Kartoffeln'
              : base === 'chicken'
              ? 'Hähnchen'
              : base === 'pasta'
              ? 'Nudeln'
              : 'Süßkartoffeln / Gemüse';
          synergyConn = {
            type: 'use-leftovers',
            partnerDayName: prevAssignment.dayName,
            baseName,
            tip: synergyPartner.synergyTip || `Nutzt den gekochten ${baseName} von gestern!`,
            timeSaved: synergyPartner.timeSavedMinutes || 15,
          };
        }
      } else if (nextAssignment?.recipe.synergyRole === 'use-leftovers' && nextAssignment.recipe.synergyBase) {
        // If next day is use-leftovers, prioritize cook-extra for this day!
        const base = nextAssignment.recipe.synergyBase;
        synergyPartner = allAvailableRecipes.find(
          (r) => r.synergyBase === base && r.synergyRole === 'cook-extra' && !otherIds.has(r.id)
        );
        if (synergyPartner) {
          const baseName =
            base === 'rice'
              ? 'Reis'
              : base === 'potatoes'
              ? 'Kartoffeln'
              : base === 'chicken'
              ? 'Hähnchen'
              : base === 'pasta'
              ? 'Nudeln'
              : 'Süßkartoffeln / Gemüse';
          synergyConn = {
            type: 'cook-extra',
            partnerDayName: nextAssignment.dayName,
            baseName,
            tip: synergyPartner.synergyTip || `Koche heute doppelt ${baseName} für morgen vor!`,
            timeSaved: synergyPartner.timeSavedMinutes || 15,
          };
        }
      }

      const prevProtein = prevAssignment?.recipe.mainProtein;
      const newRecipe =
        synergyPartner || pickCandidate(sourceMode, themeFilter, otherIds, prevProtein);

      const updated = [...prev];
      updated[index] = {
        ...current,
        recipe: newRecipe,
        isAlreadyPlanned: false,
        synergyConnection: synergyConn,
      };
      return updated;
    });
  };

  // Consolidated ingredients & budget calculations (dynamically adjusted for syncScope)
  const { consolidatedIngredients, totalEstimatedCost, totalTimeSaved, relevantCount } = useMemo(() => {
    const relevantAssignments = syncScope === 'first4days' ? assignments.slice(0, 4) : assignments;
    const map = new Map<string, { name: string; amounts: string[]; category?: string }>();
    let totalCost = 0;
    let timeSaved = 0;

    relevantAssignments.forEach((a) => {
      totalCost += a.recipe.estimatedCost || 13.5;
      if (a.synergyConnection?.type === 'use-leftovers') {
        timeSaved += a.synergyConnection.timeSaved || 15;
      }

      a.recipe.ingredients.forEach((ing) => {
        const clean = ing.name.toLowerCase().trim();
        if (
          clean === 'salz' ||
          clean === 'pfeffer' ||
          clean === 'wasser' ||
          clean === 'leitungswasser'
        ) {
          return;
        }
        const key = clean
          .replace(/^(frische[rsn]?|bio-|reife[rsn]?|gekochtes?|festkochende)\s+/i, '')
          .replace(/\s*\([^)]*\)/g, '')
          .trim();

        if (map.has(key)) {
          const item = map.get(key)!;
          if (ing.amount && !item.amounts.includes(ing.amount)) {
            item.amounts.push(ing.amount);
          }
        } else {
          map.set(key, {
            name: ing.name,
            amounts: ing.amount ? [ing.amount] : [],
            category: ing.category,
          });
        }
      });
    });

    return {
      consolidatedIngredients: Array.from(map.values()),
      totalEstimatedCost: Math.round(totalCost * 10) / 10,
      totalTimeSaved: timeSaved,
      relevantCount: relevantAssignments.length,
    };
  }, [assignments, syncScope]);

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
    const groceriesToSync = syncScope === 'first4days' ? toApply.slice(0, 4) : toApply;
    onApplyPlan(toApply, syncToGroceries, groceriesToSync);
    try {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }
    onClose();
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl border-2 border-stone-200 dark:border-slate-800 animate-in fade-in zoom-in-95 max-h-[94vh] flex flex-col my-auto overflow-hidden">
          {/* Header */}
          <div className="flex items-start justify-between pb-3 border-b border-stone-100 dark:border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 text-white flex items-center justify-center text-2xl shadow-md shrink-0">
                ✨
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-200 border border-teal-300 dark:border-teal-700">
                    Smarter Wochen-Generator
                  </span>
                  <span className="text-xs text-stone-500 dark:text-slate-400 font-semibold flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-stone-400" />
                    Woche vom {format(weekDays[0], 'd. MMM', { locale: de })} –{' '}
                    {format(weekDays[6], 'd. MMM', { locale: de })}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-stone-900 dark:text-white leading-tight mt-0.5">
                  Woche zaubern mit smartem Vorkochen
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
                      <span>Favoriten ({favoriteRecipes.length})</span>
                    </div>
                    <p className="text-[11px] text-stone-500 dark:text-slate-400 font-medium mt-0.5">
                      Ergänzt mit passenden Entdeckungen
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
                      Frische Ideen aus 40+ Familien-Rezepten
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

              {/* Scope toggle & Synergy Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2 border-t border-stone-200/60 dark:border-slate-700 gap-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-stone-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={onlyEmptyDays}
                    onChange={(e) => setOnlyEmptyDays(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span>Bereits geplante Wochentage behalten (nur Lücken füllen)</span>
                </label>

                {totalTimeSaved > 0 && (
                  <span className="inline-flex items-center gap-1 font-black text-amber-800 dark:text-amber-300 bg-amber-100/90 dark:bg-amber-950/70 px-2.5 py-1 rounded-xl border border-amber-300 dark:border-amber-700 text-[11px]">
                    <Zap className="w-3 h-3 fill-amber-500 text-amber-500" />
                    <span>~{totalTimeSaved} Min. Zeitersparnis durch Vorkochen!</span>
                  </span>
                )}
              </div>
            </div>

            {/* Step 2: 7-Day Live Preview & Shuffle Cards */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-black text-stone-700 dark:text-slate-300 uppercase tracking-wider">
                  Vorschau für Montag bis Sonntag (klicke 🔄 zum Austauschen einzelner Tage)
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2">
                {assignments.map((assignment, idx) => (
                  <MealPlanPreviewCard
                    key={assignment.dateStr}
                    assignment={assignment}
                    index={idx}
                    onShuffleDay={handleShuffleSingleDay}
                    onToggleFavorite={(recipeId) => {
                      onToggleFavorite(recipeId);
                      setAssignments((prev) =>
                        prev.map((a, i) =>
                          i === idx
                            ? {
                                ...a,
                                recipe: {
                                  ...a.recipe,
                                  isFavorite: !a.recipe.isFavorite,
                                },
                              }
                            : a
                        )
                      );
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Step 3: Expandable Grocery & Budget Preview */}
            <div className="duo-card p-3 sm:p-4 bg-emerald-50/70 dark:bg-emerald-950/40 border-2 border-emerald-200 dark:border-emerald-800/60 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    🛒
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-emerald-950 dark:text-emerald-200">
                      Wocheneinkauf & Budget-Schätzung
                    </h5>
                    <p className="text-[11px] font-semibold text-emerald-800/80 dark:text-emerald-300/80">
                      {consolidatedIngredients.length} zusammengeführte Zutaten für {relevantCount} Familien-Abendessen
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-black tracking-wider text-emerald-700 dark:text-emerald-400 block">
                      Geschätzter Warenkorb
                    </span>
                    <span className="text-sm font-black text-emerald-900 dark:text-emerald-100">
                      ca. {totalEstimatedCost.toFixed(2).replace('.', ',')} €
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowGroceryPreview(!showGroceryPreview)}
                    className="p-1.5 rounded-xl bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 font-black text-xs flex items-center gap-1 shadow-2xs"
                  >
                    <span>{showGroceryPreview ? 'Schließen' : 'Details'}</span>
                    {showGroceryPreview ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Accordion content */}
              {showGroceryPreview && (
                <div className="pt-3 border-t border-emerald-200/80 dark:border-emerald-800/80 animate-in fade-in">
                  <p className="text-[11px] text-emerald-900 dark:text-emerald-200 font-semibold mb-2">
                    Mehrfach vorkommende Zutaten (z.B. Zwiebeln, Knoblauch, Reis) wurden automatisch zu Vorratseinheiten gebündelt:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5 max-h-48 overflow-y-auto pr-1">
                    {consolidatedIngredients.map((item, i) => (
                      <div
                        key={i}
                        className="p-1.5 bg-white dark:bg-slate-800 rounded-lg border border-emerald-100 dark:border-slate-700 text-xs flex items-center justify-between"
                      >
                        <span className="font-bold text-stone-800 dark:text-stone-200 truncate">
                          {item.name}
                        </span>
                        {item.amounts.length > 0 && (
                          <span className="text-[10px] bg-emerald-100/70 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 px-1.5 py-0.2 rounded font-semibold shrink-0 ml-1">
                            {item.amounts.join(' + ')}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer actions */}
          <div className="pt-3 border-t border-stone-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 w-full md:w-auto">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-black text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 shrink-0">
                <input
                  type="checkbox"
                  checked={syncToGroceries}
                  onChange={(e) => setSyncToGroceries(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Zutaten auf Einkaufsliste (~{Math.round(totalEstimatedCost)} €)</span>
              </label>

              {syncToGroceries && (
                <div className="flex items-center bg-emerald-100/70 dark:bg-emerald-950/80 p-0.5 rounded-xl border border-emerald-300 dark:border-emerald-700/80 shrink-0">
                  <button
                    type="button"
                    onClick={() => setSyncScope('all')}
                    className={`px-2.5 py-1 text-xs font-black rounded-lg transition-all ${
                      syncScope === 'all'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-emerald-800 dark:text-emerald-300 hover:text-emerald-950 dark:hover:text-white'
                    }`}
                  >
                    Alle {assignments.length} Tage
                  </button>
                  <button
                    type="button"
                    onClick={() => setSyncScope('first4days')}
                    className={`px-2.5 py-1 text-xs font-black rounded-lg transition-all flex items-center gap-1 ${
                      syncScope === 'first4days'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-emerald-800 dark:text-emerald-300 hover:text-emerald-950 dark:hover:text-white'
                    }`}
                  >
                    <span>⚡ Nur 3–4 Tage</span>
                    <span className="text-[10px] opacity-85">(Frische)</span>
                  </button>
                </div>
              )}
            </div>

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
                className="duo-btn duo-btn-green px-5 py-2.5 text-xs font-black rounded-xl shadow-md flex items-center gap-1.5 whitespace-nowrap"
              >
                <Sparkles className="w-4 h-4 stroke-[2.5]" />
                <span>Plan übernehmen ✨</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
