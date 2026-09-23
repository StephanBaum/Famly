import { GroceryItem, MealPlanDay, Recipe } from '../types';
import { addDays, format } from 'date-fns';

export interface StagedCartItem {
  id: string;
  name: string;
  amount?: string;
  category?: string;
  sourceRecipe?: string;
  estimatedPriceEur: number;
}

export interface StagedCartDetails {
  items: StagedCartItem[];
  totalItemCount: number;
  estimatedTotalEur: number;
  mealTitles: string[];
  daysCovered: number;
  reweCartUrl: string;
  instacartCartUrl: string;
  amazonFreshUrl: string;
}

// Basic staple names to exclude unless explicitly missing
const PANTRY_STAPLES = new Set([
  'salz', 'pfeffer', 'wasser', 'öl', 'olivenöl', 'pflanzenöl', 'mehl', 'zucker',
  'essig', 'backpulver', 'oregano', 'paprikapulver', 'zimt', 'knoblauchpulver'
]);

/**
 * Builds an autonomous staged cart from upcoming meals and unchecked groceries
 */
export function getButlerStagedCart(
  mealPlans: MealPlanDay[],
  recipes: Recipe[],
  groceries: GroceryItem[],
  daysAhead: number = 3
): StagedCartDetails {
  const today = new Date();
  const targetDates: string[] = [];
  for (let i = 0; i < daysAhead; i++) {
    targetDates.push(format(addDays(today, i), 'yyyy-MM-dd'));
  }

  const stagedItemsMap = new Map<string, StagedCartItem>();
  const mealTitles: string[] = [];

  // 1. Collect ingredients from upcoming planned meals
  targetDates.forEach((dateStr) => {
    const meal = mealPlans.find((m) => m.date === dateStr);
    if (!meal) return;

    // Check Dinner, Lunch, Breakfast recipes
    const recipeIds = [
      meal.dinner?.recipeId,
      meal.lunch?.recipeId,
      meal.breakfast?.recipeId,
    ].filter(Boolean) as string[];

    recipeIds.forEach((rId) => {
      const recipe = recipes.find((r) => r.id === rId);
      if (!recipe) return;

      if (!mealTitles.includes(recipe.title)) {
        mealTitles.push(recipe.title);
      }

      recipe.ingredients.forEach((ing, idx) => {
        const cleanName = ing.name.trim();
        const lowerName = cleanName.toLowerCase();

        // Skip standard pantry staples
        if (PANTRY_STAPLES.has(lowerName)) return;

        const key = lowerName;
        if (!stagedItemsMap.has(key)) {
          // Estimate realistic German supermarket price (1.50 - 4.50 EUR)
          const isProduce = ['tomate', 'salat', 'gurke', 'apfel', 'zitrone', 'zwiebel', 'knoblauch'].some(p => lowerName.includes(p));
          const isMeatOrCheese = ['hackfleisch', 'hähnchen', 'käse', 'parmesan', 'mozzarella', 'lachs'].some(p => lowerName.includes(p));
          const price = isMeatOrCheese ? 4.49 : isProduce ? 1.79 : 2.49;

          stagedItemsMap.set(key, {
            id: `staged_${rId}_${idx}`,
            name: cleanName,
            amount: ing.amount,
            category: ing.category,
            sourceRecipe: recipe.title,
            estimatedPriceEur: price,
          });
        }
      });
    });
  });

  // 2. Add current unchecked groceries that aren't already included
  groceries
    .filter((g) => !g.checked)
    .forEach((g) => {
      const lower = g.name.toLowerCase().trim();
      if (!stagedItemsMap.has(lower)) {
        stagedItemsMap.set(lower, {
          id: `staged_g_${g.id}`,
          name: g.name,
          category: g.category,
          estimatedPriceEur: 2.29,
        });
      }
    });

  const items = Array.from(stagedItemsMap.values());
  const totalItemCount = items.length;
  const estimatedTotalEur = Number(
    items.reduce((sum, item) => sum + item.estimatedPriceEur, 0).toFixed(2)
  );

  // Generate Store Integration URLs
  const itemNames = items.map((i) => i.name);
  const searchKeywords = itemNames.slice(0, 5).join(' ');

  // Rewe Lieferservice Search & Staging Gateway
  const reweCartUrl = `https://shop.rewe.de/productList?search=${encodeURIComponent(searchKeywords || 'Lebensmittel')}`;

  // Instacart Shoppable Recipe/Ingredients Deep-Link
  const instacartCartUrl = `https://www.instacart.com/store/partner_recipes?ingredients=${encodeURIComponent(
    itemNames.slice(0, 10).join(',')
  )}`;

  // Amazon Fresh Cart Search
  const amazonFreshUrl = `https://www.amazon.de/s?k=${encodeURIComponent(searchKeywords || 'Lebensmittel')}&i=fresh`;

  return {
    items,
    totalItemCount,
    estimatedTotalEur,
    mealTitles,
    daysCovered: daysAhead,
    reweCartUrl,
    instacartCartUrl,
    amazonFreshUrl,
  };
}
