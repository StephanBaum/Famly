import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Recipe,
  MealPlanDay,
  GroceryItem,
  Ingredient,
  GroceryCategory,
} from '../../types';
import {
  detectIsPerishable,
  getHorizonBucket,
  predictStoreForItem,
  removeGroceriesForMeal as removeMealGroceriesUtil,
  clearGroceriesForDates as clearDatesGroceriesUtil,
  cleanPastMealGroceries as cleanPastMealGroceriesUtil,
} from '../../utils/grocerySyncUtils';
import {
  STORAGE_KEYS,
  getStoredOrDefault,
  RecipeSyncResult,
  BatchRecipeSyncResult,
} from '../storageKeys';

interface UseRecipesMealPlanSliceOptions {
  setGroceries: React.Dispatch<React.SetStateAction<GroceryItem[]>>;
  currentMemberId: string | 'all';
  fallbackMemberId?: string;
  storeLearningMap: Record<string, string>;
  isItemInStock: (name: string) => boolean;
}

export function useRecipesMealPlanSlice({
  setGroceries,
  currentMemberId,
  fallbackMemberId,
  storeLearningMap,
  isItemInStock,
}: UseRecipesMealPlanSliceOptions) {
  const [recipes, setRecipes] = useState<Recipe[]>(() => {
    const stored = getStoredOrDefault<Recipe[] | null>(STORAGE_KEYS.RECIPES, null);
    if (stored !== null) return stored;
    return [];
  });

  const [mealPlans, setMealPlans] = useState<MealPlanDay[]>(() => {
    const stored = getStoredOrDefault<MealPlanDay[] | null>(STORAGE_KEYS.MEAL_PLANS, null);
    if (stored !== null) return stored;
    return [];
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(recipes));
  }, [recipes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MEAL_PLANS, JSON.stringify(mealPlans));
  }, [mealPlans]);

  // Recipes & Meal planning
  const addRecipe = (rec: Omit<Recipe, 'id'> | Recipe): Recipe => {
    const newRec: Recipe = {
      ...rec,
      id: 'id' in rec && rec.id ? rec.id : `r_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    };
    setRecipes((prev) => [newRec, ...prev]);
    return newRec;
  };

  const updateRecipe = (id: string, updates: Partial<Recipe>) => {
    setRecipes((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
  };

  const deleteRecipe = (id: string) => {
    setRecipes((prev) => prev.filter((r) => r.id !== id));
    // Also clean up any meal plans referencing this deleted recipe
    setMealPlans((prev) =>
      prev.map((day) => {
        let modified = false;
        const newDay = { ...day };
        (['breakfast', 'lunch', 'dinner'] as const).forEach((slot) => {
          if (newDay[slot]?.recipeId === id) {
            newDay[slot] = {
              ...newDay[slot]!,
              recipeId: undefined,
            };
            modified = true;
          }
        });
        return modified ? newDay : day;
      })
    );
  };

  const toggleFavoriteRecipe = (id: string) => {
    setRecipes((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isFavorite: !r.isFavorite } : r))
    );
  };

  const setMealSlot = (
    date: string,
    slot: 'breakfast' | 'lunch' | 'dinner',
    data: { title: string; recipeId?: string; chefId?: string }
  ) => {
    setMealPlans((prev) => {
      const existingIdx = prev.findIndex((p) => p.date === date);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          [slot]: data,
        };
        return updated;
      } else {
        return [...prev, { date, [slot]: data }];
      }
    });
  };

  const addRecipeIngredientsToGrocery = (recipe: Recipe, targetDate?: string): RecipeSyncResult => {
    const toAdd: GroceryItem[] = [];
    const skippedNames: string[] = [];

    recipe.ingredients.forEach((ing: Ingredient, idx) => {
      if (isItemInStock(ing.name)) {
        skippedNames.push(ing.name);
      } else {
        const assignedStore = predictStoreForItem(ing.name, storeLearningMap);
        toAdd.push({
          id: `g_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 9)}`,
          name: ing.name.trim(),
          amount: ing.amount ? ing.amount.trim() : undefined,
          store: assignedStore,
          category: ing.category,
          checked: false,
          addedByMemberId: currentMemberId === 'all' ? fallbackMemberId : currentMemberId,
          targetDate,
          recipeTitle: recipe.title,
          recipeId: recipe.id,
          mealSlot: 'dinner',
          isPerishable: detectIsPerishable(ing.name, ing.category),
        });
      }
    });

    if (toAdd.length > 0) {
      setGroceries((prev) => {
        const next = [...prev];
        toAdd.forEach((newItem) => {
          const existingIdx = next.findIndex(
            (g) =>
              !g.checked &&
              g.store.toLowerCase().trim() === newItem.store.toLowerCase().trim() &&
              g.name.toLowerCase().trim() === newItem.name.toLowerCase().trim() &&
              getHorizonBucket(g.targetDate, g.isPerishable) === getHorizonBucket(newItem.targetDate, newItem.isPerishable)
          );
          if (existingIdx >= 0) {
            const existing = next[existingIdx];
            const newAmount = newItem.amount?.trim();
            let mergedAmount = existing.amount;
            if (newAmount && (!existing.amount || !existing.amount.includes(newAmount))) {
              mergedAmount = existing.amount ? `${existing.amount} + ${newAmount}` : newAmount;
            }
            const earliestDate =
              newItem.targetDate && (!existing.targetDate || newItem.targetDate < existing.targetDate)
                ? newItem.targetDate
                : existing.targetDate;

            next[existingIdx] = {
              ...existing,
              amount: mergedAmount,
              targetDate: earliestDate,
              recipeTitle: existing.recipeTitle || newItem.recipeTitle,
              recipeId: existing.recipeId || newItem.recipeId,
              isPerishable: existing.isPerishable || newItem.isPerishable,
            };
          } else {
            next.unshift(newItem);
          }
        });
        return next;
      });

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
    }

    return {
      addedCount: toAdd.length,
      skippedCount: skippedNames.length,
      skippedNames,
    };
  };

  const addMultipleRecipesToGrocery = (
    recipesListOrAssignments: Recipe[] | Array<{ recipe: Recipe; date?: string }>
  ): BatchRecipeSyncResult => {
    const normalized: Array<{ recipe: Recipe; date?: string }> = recipesListOrAssignments.map((item) => {
      if ('ingredients' in item) {
        return { recipe: item, date: undefined };
      }
      return item;
    });

    const consolidatedMap = new Map<
      string,
      {
        name: string;
        amounts: string[];
        store: string;
        category?: GroceryCategory;
        recipeTitles: string[];
        recipeIds: string[];
        targetDates: string[];
        isPerishable: boolean;
      }
    >();
    const skippedNames: string[] = [];
    let mergedCount = 0;

    normalized.forEach(({ recipe, date }) => {
      recipe.ingredients.forEach((ing) => {
        const stapleCheck = ing.name.toLowerCase().trim();
        if (
          stapleCheck === 'salz' ||
          stapleCheck === 'meersalz' ||
          stapleCheck === 'speisesalz' ||
          stapleCheck === 'pfeffer' ||
          stapleCheck === 'schwarzer pfeffer' ||
          stapleCheck === 'wasser' ||
          stapleCheck === 'leitungswasser'
        ) {
          if (!skippedNames.includes(ing.name)) {
            skippedNames.push(ing.name);
          }
          return;
        }

        const isPerishable = detectIsPerishable(ing.name, ing.category);
        const horizonBucket = getHorizonBucket(date, isPerishable);
        const assignedStore = predictStoreForItem(ing.name, storeLearningMap);

        const cleanBase = ing.name
          .toLowerCase()
          .replace(/^(frische[rsn]?|bio-|reife[rsn]?|gekochtes?|festkochende)\s+/i, '')
          .replace(/\s*\([^)]*\)/g, '')
          .trim();

        const key = `${cleanBase}:::${assignedStore.toLowerCase()}:::${horizonBucket}`;

        if (consolidatedMap.has(key)) {
          mergedCount++;
          const existing = consolidatedMap.get(key)!;
          if (ing.amount && !existing.amounts.includes(ing.amount)) {
            existing.amounts.push(ing.amount);
          }
          if (!existing.recipeTitles.includes(recipe.title)) {
            existing.recipeTitles.push(recipe.title);
          }
          if (!existing.recipeIds.includes(recipe.id)) {
            existing.recipeIds.push(recipe.id);
          }
          if (date && !existing.targetDates.includes(date)) {
            existing.targetDates.push(date);
          }
          if (isPerishable) {
            existing.isPerishable = true;
          }
        } else {
          consolidatedMap.set(key, {
            name: ing.name,
            amounts: ing.amount ? [ing.amount] : [],
            store: assignedStore,
            category: ing.category,
            recipeTitles: [recipe.title],
            recipeIds: [recipe.id],
            targetDates: date ? [date] : [],
            isPerishable,
          });
        }
      });
    });

    const activeMember = currentMemberId === 'all' ? fallbackMemberId : currentMemberId;
    const toAdd: GroceryItem[] = Array.from(consolidatedMap.entries()).map(([_, val], idx) => {
      let combinedAmount = val.amounts.join(' + ');
      if (val.amounts.length > 1) {
        combinedAmount = `${val.amounts.join(' + ')} (für ${val.recipeTitles.length} Gerichte)`;
      }

      const earliestDate = val.targetDates.length > 0 ? [...val.targetDates].sort()[0] : undefined;

      return {
        id: `g_batch_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 9)}`,
        name: val.name.trim(),
        amount: combinedAmount || undefined,
        store: val.store,
        category: val.category,
        checked: false,
        addedByMemberId: activeMember,
        targetDate: earliestDate,
        recipeTitle: val.recipeTitles.join(', '),
        recipeId: val.recipeIds[0],
        mealSlot: 'dinner',
        isPerishable: val.isPerishable,
      };
    });

    if (toAdd.length > 0) {
      setGroceries((prev) => {
        const next = [...prev];
        toAdd.forEach((newItem) => {
          const existingIdx = next.findIndex(
            (g) =>
              !g.checked &&
              g.store.toLowerCase().trim() === newItem.store.toLowerCase().trim() &&
              g.name.toLowerCase().trim() === newItem.name.toLowerCase().trim() &&
              getHorizonBucket(g.targetDate, g.isPerishable) === getHorizonBucket(newItem.targetDate, newItem.isPerishable)
          );
          if (existingIdx >= 0) {
            const existing = next[existingIdx];
            const newAmount = newItem.amount?.trim();
            let mergedAmount = existing.amount;
            if (newAmount && (!existing.amount || !existing.amount.includes(newAmount))) {
              mergedAmount = existing.amount ? `${existing.amount} + ${newAmount}` : newAmount;
            }
            const earliestDate =
              newItem.targetDate && (!existing.targetDate || newItem.targetDate < existing.targetDate)
                ? newItem.targetDate
                : existing.targetDate;

            next[existingIdx] = {
              ...existing,
              amount: mergedAmount,
              targetDate: earliestDate,
              recipeTitle: existing.recipeTitle || newItem.recipeTitle,
              recipeId: existing.recipeId || newItem.recipeId,
              isPerishable: existing.isPerishable || newItem.isPerishable,
            };
          } else {
            next.unshift(newItem);
          }
        });
        return next;
      });

      confetti({
        particleCount: 75,
        spread: 75,
        origin: { y: 0.8 },
      });
    }

    const recipesList = normalized.map((n) => n.recipe);
    const estimatedTotalCost = Math.round(
      recipesList.reduce((sum, r) => sum + (r.estimatedCost || 13.5), 0) * 10
    ) / 10;

    return {
      addedCount: toAdd.length,
      mergedCount,
      estimatedTotalCost,
      skippedCount: skippedNames.length,
      skippedNames,
    };
  };

  // Self-Cleaning: Remove unbought items when a meal is swapped or cancelled
  const removeGroceriesForMeal = (
    date: string,
    options?: { recipeTitle?: string; recipeId?: string; slot?: string }
  ): number => {
    let count = 0;
    setGroceries((prev) => {
      const { updatedGroceries, removedCount } = removeMealGroceriesUtil(prev, date, options);
      count = removedCount;
      return updatedGroceries;
    });
    return count;
  };

  // Self-Cleaning: Clear old unbought ingredients for specific dates when re-planning a week
  const clearGroceriesForDates = (dates: string[]): number => {
    let count = 0;
    setGroceries((prev) => {
      const { updatedGroceries, removedCount } = clearDatesGroceriesUtil(prev, dates);
      count = removedCount;
      return updatedGroceries;
    });
    return count;
  };

  // Self-Cleaning: Auto-clean obsolete unbought ingredients from past days
  const cleanPastMealGroceries = (): { removedCount: number; removedItems: GroceryItem[] } => {
    let count = 0;
    let items: GroceryItem[] = [];
    setGroceries((prev) => {
      const { updatedGroceries, removedCount, removedItems } = cleanPastMealGroceriesUtil(prev);
      count = removedCount;
      items = removedItems;
      return updatedGroceries;
    });
    return { removedCount: count, removedItems: items };
  };

  return {
    recipes,
    setRecipes,
    mealPlans,
    setMealPlans,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    toggleFavoriteRecipe,
    setMealSlot,
    addRecipeIngredientsToGrocery,
    addMultipleRecipesToGrocery,
    removeGroceriesForMeal,
    clearGroceriesForDates,
    cleanPastMealGroceries,
  };
}
