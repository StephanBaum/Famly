import { GroceryItem, GroceryCategory } from '../types';
import { format } from 'date-fns';

/**
 * Accurately determines if a grocery item has a short shelf-life and should be bought fresh
 * shortly before cooking (fresh meat, fish, delicate greens, fresh berries),
 * or if it is a shelf-stable pantry staple (pasta, rice, flour, canned goods, spices, potatoes).
 */
export function detectIsPerishable(name: string, _category?: GroceryCategory): boolean {
  const n = (name || '').toLowerCase().trim();
  if (!n) return false;

  // Fresh fish & seafood (very short shelf-life)
  if (
    n.includes('lachs') ||
    n.includes('fisch') ||
    n.includes('forelle') ||
    n.includes('garnele') ||
    n.includes('seelachs') ||
    n.includes('kabeljau') ||
    n.includes('thunfisch') ||
    n.includes('shrimp') ||
    n.includes('dorade') ||
    n.includes('meeresfrüchte')
  ) {
    return true;
  }

  // Fresh poultry & meat (must be cooked promptly)
  if (
    n.includes('hackfleisch') ||
    n.includes('faschiertes') ||
    n.includes('hähnchen') ||
    n.includes('hühnchen') ||
    n.includes('pute') ||
    n.includes('rindfleisch') ||
    n.includes('schweinefleisch') ||
    n.includes('steak') ||
    n.includes('filet') ||
    n.includes('geschnetzeltes') ||
    n.includes('gulasch') ||
    n.includes('speck') ||
    n.includes('bratwurst')
  ) {
    return true;
  }

  // Fresh delicate salads, herbs & sprouts
  if (
    n.includes('feldsalat') ||
    n.includes('spinat') ||
    n.includes('rucola') ||
    n.includes('kopfsalat') ||
    n.includes('eisbergsalat') ||
    n.includes('basilikum') ||
    n.includes('koriander') ||
    n.includes('dill') ||
    n.includes('schnittlauch') ||
    n.includes('petersilie') ||
    n.includes('sprossen') ||
    n.includes('kresse')
  ) {
    return true;
  }

  // Fresh delicate berries & soft fruit
  if (
    n.includes('erdbeere') ||
    n.includes('himbeere') ||
    n.includes('heidelbeere') ||
    n.includes('blaubeere') ||
    n.includes('brombeere')
  ) {
    return true;
  }

  // Fresh mushrooms
  if (
    n.includes('champignon') ||
    n.includes('pilze') ||
    n.includes('austernpilz') ||
    n.includes('pfifferling')
  ) {
    return true;
  }

  return false;
}

/**
 * Calculates horizon bucket for multi-week shopping separation:
 * - Shelf-stable pantry items (pasta, rice, flour, canned goods): returns 'pantry_all'
 *   -> Consolidates across weeks into 1 item with summed amounts.
 * - Perishable items (fresh meat, fish, berries):
 *   -> 'soon' (targetDate within next 3 days)
 *   -> 'future_YYYY-II-ww' (grouped by specific future calendar week)
 *   -> Kept separate so Week 1 and Week 2 fresh items remain distinct!
 */
export function getHorizonBucket(targetDate?: string, isPerishable?: boolean): string {
  if (!isPerishable || !targetDate) {
    return 'pantry_all';
  }

  try {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    if (targetDate <= todayStr) {
      return 'soon';
    }

    const today = new Date(todayStr);
    const target = new Date(targetDate);
    const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 3) {
      return 'soon';
    }

    // Separate future weeks into distinct buckets (ISO week numbering)
    return `future_${format(target, 'yyyy-II-ww')}`;
  } catch {
    return 'soon';
  }
}

/**
 * Predicts store based on learned user mappings or item keywords
 */
export function predictStoreForItem(name: string, storeLearningMap: Record<string, string> = {}): string {
  const clean = (name || '').toLowerCase().trim();
  if (!clean) return 'Rewe';

  // Check learned preferences
  if (storeLearningMap[clean]) {
    return storeLearningMap[clean];
  }
  for (const [key, storeName] of Object.entries(storeLearningMap)) {
    if (clean.includes(key) || key.includes(clean)) {
      return storeName;
    }
  }

  // Rule-based keyword matching
  if (
    clean.includes('shampoo') ||
    clean.includes('seife') ||
    clean.includes('zahnpasta') ||
    clean.includes('windel') ||
    clean.includes('deo') ||
    clean.includes('duschgel') ||
    clean.includes('toilettenpapier') ||
    clean.includes('klavier') ||
    clean.includes('waschmittel') ||
    clean.includes('putzmittel') ||
    clean.includes('creme') ||
    clean.includes('feuchttücher') ||
    clean.includes('spülmittel') ||
    clean.includes('kosmetik')
  ) {
    return 'dm';
  }

  if (
    clean.includes('brot') ||
    clean.includes('brötchen') ||
    clean.includes('croissant') ||
    clean.includes('baguette') ||
    clean.includes('semmel') ||
    clean.includes('brezel') ||
    clean.includes('kuchen') ||
    clean.includes('gebäck')
  ) {
    return 'Bäcker';
  }

  if (
    clean.includes('aspirin') ||
    clean.includes('ibuprofen') ||
    clean.includes('pflaster') ||
    clean.includes('schmerzmittel') ||
    clean.includes('hustensaft') ||
    clean.includes('nasenspray') ||
    clean.includes('bandage') ||
    clean.includes('apotheke')
  ) {
    return 'Apotheke';
  }

  return 'Rewe';
}

/**
 * Deduplicates grocery list items with intelligent perishable horizon separation:
 * - Shelf-stable items across weeks merge into 1 item with combined amounts.
 * - Perishable items for different weeks remain distinct entries.
 */
export function sanitizeAndDeduplicateGroceries(rawItems: GroceryItem[]): GroceryItem[] {
  if (!Array.isArray(rawItems)) return [];

  const seenIds = new Set<string>();
  const repairedItems: GroceryItem[] = rawItems
    .filter((item) => item && typeof item === 'object' && item.name)
    .map((item, idx) => {
      let itemId = item.id;
      if (!itemId || seenIds.has(itemId)) {
        itemId = `g_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 9)}`;
      }
      seenIds.add(itemId);
      const isPerishable =
        typeof item.isPerishable === 'boolean'
          ? item.isPerishable
          : detectIsPerishable(item.name, item.category);

      return {
        ...item,
        id: itemId,
        name: (item.name || '').trim(),
        store: (item.store || 'Rewe').trim(),
        amount: item.amount ? String(item.amount).trim() : '',
        checked: Boolean(item.checked),
        targetDate: item.targetDate,
        recipeTitle: item.recipeTitle,
        recipeId: item.recipeId,
        mealSlot: item.mealSlot,
        isPerishable,
      };
    });

  const uncheckedMap = new Map<string, GroceryItem>();
  const checkedItems: GroceryItem[] = [];

  for (const item of repairedItems) {
    if (item.checked) {
      checkedItems.push(item);
      continue;
    }

    // Horizon key ensures perishable items for Week 1 vs Week 2 stay separate!
    const horizonBucket = getHorizonBucket(item.targetDate, item.isPerishable);
    const key = `${item.store.toLowerCase()}:::${item.name.toLowerCase()}:::${horizonBucket}`;

    if (uncheckedMap.has(key)) {
      const existing = uncheckedMap.get(key)!;
      // Merge amounts if distinct
      if (item.amount && (!existing.amount || !existing.amount.includes(item.amount))) {
        existing.amount = existing.amount ? `${existing.amount} + ${item.amount}` : item.amount;
      }
      // Retain earliest target date
      if (item.targetDate && (!existing.targetDate || item.targetDate < existing.targetDate)) {
        existing.targetDate = item.targetDate;
      }
      if (!existing.recipeTitle && item.recipeTitle) {
        existing.recipeTitle = item.recipeTitle;
      }
      if (!existing.recipeId && item.recipeId) {
        existing.recipeId = item.recipeId;
      }
      if (item.isPerishable) {
        existing.isPerishable = true;
      }
    } else {
      uncheckedMap.set(key, { ...item });
    }
  }

  return [...Array.from(uncheckedMap.values()), ...checkedItems];
}

/**
 * Removes unbought grocery items when a meal is swapped, cancelled, or set to "Auswärts essen"
 */
export function removeGroceriesForMeal(
  groceries: GroceryItem[],
  targetDate: string,
  options?: { recipeTitle?: string; recipeId?: string; slot?: string }
): { updatedGroceries: GroceryItem[]; removedCount: number } {
  let removedCount = 0;
  const updatedGroceries = groceries.filter((item) => {
    // Only remove unchecked items with matching targetDate
    if (item.checked || !item.targetDate || item.targetDate !== targetDate) {
      return true;
    }

    if (options?.recipeId && item.recipeId && item.recipeId !== options.recipeId) {
      return true;
    }

    if (options?.recipeTitle && item.recipeTitle) {
      const normQuery = options.recipeTitle.toLowerCase().trim();
      const normTitle = item.recipeTitle.toLowerCase().trim();
      if (!normTitle.includes(normQuery) && !normQuery.includes(normTitle)) {
        return true;
      }
    }

    if (options?.slot && item.mealSlot && item.mealSlot !== options.slot) {
      return true;
    }

    removedCount++;
    return false;
  });

  return { updatedGroceries, removedCount };
}

/**
 * Clears old unbought ingredients for specific dates when re-planning a week
 */
export function clearGroceriesForDates(
  groceries: GroceryItem[],
  dates: string[]
): { updatedGroceries: GroceryItem[]; removedCount: number } {
  const dateSet = new Set(dates);
  let removedCount = 0;

  const updatedGroceries = groceries.filter((item) => {
    // Never remove manual items (!targetDate) or already bought items (checked)
    if (!item.checked && item.targetDate && dateSet.has(item.targetDate)) {
      removedCount++;
      return false;
    }
    return true;
  });

  return { updatedGroceries, removedCount };
}

/**
 * Self-cleaning: clears unchecked grocery items from past dates (targetDate < today)
 */
export function cleanPastMealGroceries(
  groceries: GroceryItem[],
  referenceDateStr?: string
): { updatedGroceries: GroceryItem[]; removedCount: number; removedItems: GroceryItem[] } {
  const todayStr = referenceDateStr || format(new Date(), 'yyyy-MM-dd');
  const removedItems: GroceryItem[] = [];

  const updatedGroceries = groceries.filter((item) => {
    // Only clean unchecked items whose meal cooking date has passed
    if (!item.checked && item.targetDate && item.targetDate < todayStr) {
      removedItems.push(item);
      return false;
    }
    return true;
  });

  return {
    updatedGroceries,
    removedCount: removedItems.length,
    removedItems,
  };
}
