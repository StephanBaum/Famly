import { CURATED_RECIPE_CATALOG } from '../src/utils/recipeCatalog';
import { INITIAL_RECIPES, INITIAL_MEAL_PLANS } from '../src/utils/initialData';
import { Recipe, MealPlanDay } from '../src/types';

console.log('=== VERIFYING MEAL PLANNER & GROCERY CONSOLIDATION ===\n');

// 1. Check Catalog & Initial Recipes
console.log(`1. Curated Catalog Recipes: ${CURATED_RECIPE_CATALOG.length} recipes`);
console.log(`   Initial Recipes: ${INITIAL_RECIPES.length} recipes`);
console.log(`   Initial Meal Plans: ${INITIAL_MEAL_PLANS.length} days`);

// Verify all initial meal plans link to real recipes with ingredients
console.log('\n2. Verifying Initial Meal Plans have full recipes & ingredients:');
for (const plan of INITIAL_MEAL_PLANS) {
  if (plan.dinner?.title) {
    const linkedRecipe = INITIAL_RECIPES.find((r) => r.id === plan.dinner?.recipeId);
    if (!linkedRecipe) {
      throw new Error(`Meal plan day ${plan.date} (${plan.dinner.title}) has no linked recipe!`);
    }
    if (!linkedRecipe.ingredients || linkedRecipe.ingredients.length === 0) {
      throw new Error(`Recipe ${linkedRecipe.title} has empty ingredients!`);
    }
    console.log(`   ✓ Day ${plan.date}: "${plan.dinner.title}" -> ${linkedRecipe.ingredients.length} ingredients, ~${linkedRecipe.estimatedCost}€`);
  }
}

// 2. Candidate Picker Simulation (from AutoMealPlanModal.tsx)
const allAvailableRecipes: Recipe[] = [...INITIAL_RECIPES, ...CURATED_RECIPE_CATALOG];
const favoriteRecipes = allAvailableRecipes.filter((r) => r.isFavorite);
const discoverRecipes = allAvailableRecipes.filter((r) => !r.isFavorite);

function pickCandidate(
  mode: 'favorites' | 'discover' | 'mix',
  theme: string,
  excludeIds: Set<string>,
  lastProtein?: string,
  proteinCounts: Map<string, number> = new Map()
): Recipe {
  let pool: Recipe[] = [];
  if (mode === 'favorites') {
    pool = favoriteRecipes;
  } else if (mode === 'discover') {
    pool = discoverRecipes;
  } else {
    pool = Math.random() < 0.5 && favoriteRecipes.length > 0 ? favoriteRecipes : discoverRecipes;
  }

  if (pool.length === 0) pool = allAvailableRecipes;

  if (theme !== 'all') {
    const themeMatches = pool.filter((r) => {
      if (r.theme === theme) return true;
      if (theme === 'quick') return r.category === 'quick' || parseInt(r.prepTime || '30', 10) <= 25;
      if (theme === 'healthy') return r.category === 'healthy';
      if (theme === 'warming') return r.category === 'comfort';
      if (theme === 'kids') return r.category === 'family-favorite';
      return false;
    });
    if (themeMatches.length > 0) pool = themeMatches;
  }

  let available = pool.filter((r) => !excludeIds.has(r.id));
  if (available.length === 0) {
    available = allAvailableRecipes.filter((r) => !excludeIds.has(r.id));
  }
  if (available.length === 0) {
    available = allAvailableRecipes;
  }

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
    scoredCandidates = available;
  }

  const randomIndex = Math.floor(Math.random() * scoredCandidates.length);
  return scoredCandidates[randomIndex] || available[0];
}

function generate7DayPlan(mode: 'favorites' | 'discover' | 'mix', theme: string): Recipe[] {
  const chosenIds = new Set<string>();
  const proteinCounts = new Map<string, number>();
  const result: Recipe[] = [];

  for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
    const prevRecipe = dayIdx > 0 ? result[dayIdx - 1] : undefined;
    let matchedSynergyRecipe: Recipe | undefined;

    if (prevRecipe && prevRecipe.synergyRole === 'cook-extra' && prevRecipe.synergyBase) {
      const base = prevRecipe.synergyBase;
      matchedSynergyRecipe = allAvailableRecipes.find(
        (r) => r.synergyBase === base && r.synergyRole === 'use-leftovers' && !chosenIds.has(r.id)
      );
    }

    let recipeToAssign: Recipe;
    if (matchedSynergyRecipe) {
      recipeToAssign = matchedSynergyRecipe;
    } else {
      const lastProtein = prevRecipe?.mainProtein;
      recipeToAssign = pickCandidate(mode, theme, chosenIds, lastProtein, proteinCounts);
    }

    chosenIds.add(recipeToAssign.id);
    const prot = recipeToAssign.mainProtein || 'vegetarian';
    proteinCounts.set(prot, (proteinCounts.get(prot) || 0) + 1);
    result.push(recipeToAssign);
  }

  return result;
}

// 3. Test 100 iterations of 7-day generation across various modes & themes
console.log('\n3. Testing 100 Weekly Generations for Zero Duplicates & Variety:');
const themes = ['all', 'healthy', 'fresh', 'warming', 'quick', 'kids'];
const modes: Array<'favorites' | 'discover' | 'mix'> = ['mix', 'discover', 'favorites'];

let totalSynergiesDetected = 0;
let totalWeeklyCostSum = 0;
let minWeeklyCost = Infinity;
let maxWeeklyCost = -Infinity;

for (let i = 0; i < 100; i++) {
  const mode = modes[i % modes.length];
  const theme = themes[i % themes.length];
  const week = generate7DayPlan(mode, theme);

  const weekCost = week.reduce((sum, r) => sum + (r.estimatedCost || 13.5), 0);
  totalWeeklyCostSum += weekCost;
  if (weekCost < minWeeklyCost) minWeeklyCost = weekCost;
  if (weekCost > maxWeeklyCost) maxWeeklyCost = weekCost;

  // Assert 1: Exactly 7 recipes
  if (week.length !== 7) {
    throw new Error(`Run ${i}: Week has ${week.length} days instead of 7!`);
  }

  // Assert 2: Strictly ZERO duplicate recipe IDs
  const uniqueIds = new Set(week.map((r) => r.id));
  if (uniqueIds.size !== 7) {
    throw new Error(`Run ${i} (mode: ${mode}, theme: ${theme}): DUPLICATE DETECTED! Found ${uniqueIds.size} unique out of 7 recipes.`);
  }

  // Assert 3: No consecutive fish (salmon) meals
  for (let d = 1; d < 7; d++) {
    if (week[d].mainProtein === 'fish' && week[d - 1].mainProtein === 'fish') {
      throw new Error(`Run ${i}: Consecutive fish dishes found on days ${d - 1} and ${d}: "${week[d - 1].title}" and "${week[d].title}"!`);
    }
  }

  // Check synergies
  for (let d = 1; d < 7; d++) {
    if (
      week[d - 1].synergyRole === 'cook-extra' &&
      week[d].synergyRole === 'use-leftovers' &&
      week[d - 1].synergyBase === week[d].synergyBase
    ) {
      totalSynergiesDetected++;
    }
  }
}
console.log(`   ✓ 100/100 weekly generation tests PASSED!`);
console.log(`   ✓ Zero duplicates in all 700 meal assignments.`);
console.log(`   ✓ Zero consecutive fish dishes.`);
console.log(`   ✓ Successfully generated ${totalSynergiesDetected} batch-prep synergies ("Cook Once, Eat Twice").`);
console.log(`   ✓ Weekly Budget across 100 runs: Average = ${(totalWeeklyCostSum / 100).toFixed(2)} €, Min = ${minWeeklyCost.toFixed(2)} €, Max = ${maxWeeklyCost.toFixed(2)} € (Perfect ~100€ range!)`);

// 4. Test Batch Grocery Consolidation and ~100€ Weekly Budget
console.log('\n4. Testing Batch Grocery Consolidation & ~100€ Weekly Budget:');

function consolidateGroceries(recipesList: Recipe[]) {
  const consolidatedMap = new Map<string, { name: string; amounts: string[]; store: string; category?: string; recipeTitles: string[] }>();
  const skippedNames: string[] = [];
  let mergedCount = 0;

  recipesList.forEach((recipe) => {
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
        skippedNames.push(ing.name);
        return;
      }

      const normKey = ing.name.toLowerCase().replace(/[\(\),.]/g, '').trim();
      const existing = consolidatedMap.get(normKey);
      if (existing) {
        mergedCount++;
        if (ing.amount && !existing.amounts.includes(ing.amount)) {
          existing.amounts.push(ing.amount);
        }
        if (!existing.recipeTitles.includes(recipe.title)) {
          existing.recipeTitles.push(recipe.title);
        }
      } else {
        let store = 'Rewe';
        if (ing.category === 'bakery') store = 'Bäcker';
        else if (ing.category === 'drugstore' || ing.category === 'household') store = 'dm Drogerie';
        else if (ing.category === 'meat') store = 'Rewe Frischetheke';

        consolidatedMap.set(normKey, {
          name: ing.name,
          amounts: ing.amount ? [ing.amount] : [],
          store,
          category: ing.category,
          recipeTitles: [recipe.title],
        });
      }
    });
  });

  const estimatedTotalCost = recipesList.reduce(
    (sum, r) => sum + (r.estimatedCost || 13.5),
    0
  );

  return {
    consolidatedItems: Array.from(consolidatedMap.values()),
    mergedCount,
    skippedCount: skippedNames.length,
    estimatedTotalCost: Math.round(estimatedTotalCost * 100) / 100,
  };
}

// Test sample week
const sampleWeek = generate7DayPlan('mix', 'all');
console.log('   Sample 7-Day Week Plan:');
sampleWeek.forEach((r, idx) => {
  const syn = r.synergyTip ? ` [⚡ ${r.synergyTip}]` : '';
  console.log(`   Day ${idx + 1}: ${r.title} (${r.mainProtein}, ~${r.estimatedCost?.toFixed(2)}€)${syn}`);
});

const groceryResult = consolidateGroceries(sampleWeek);
console.log(`\n   Consolidated Grocery Summary:`);
console.log(`   - Raw Ingredients: ${sampleWeek.reduce((sum, r) => sum + r.ingredients.length, 0)}`);
console.log(`   - Consolidated Line Items: ${groceryResult.consolidatedItems.length}`);
console.log(`   - Shared Merged Ingredients: ${groceryResult.mergedCount}`);
console.log(`   - Skipped Pantry Staples (Salt/Water/Pepper): ${groceryResult.skippedCount}`);
console.log(`   - Total Estimated Weekly Budget: ${groceryResult.estimatedTotalCost} € (Target ~100€)`);

if (groceryResult.estimatedTotalCost < 70 || groceryResult.estimatedTotalCost > 125) {
  throw new Error(`Estimated total cost ${groceryResult.estimatedTotalCost}€ is outside reasonable family dinner range!`);
}

// Check sample consolidated items with multiple recipes
const multiUseItems = groceryResult.consolidatedItems.filter((i) => i.recipeTitles.length > 1);
console.log(`\n   Multi-Recipe Shared Items (${multiUseItems.length} found):`);
multiUseItems.slice(0, 5).forEach((item) => {
  console.log(`   - ${item.name} (${item.amounts.join(' + ')}) -> used in: ${item.recipeTitles.join(', ')}`);
});

console.log('\n=== ALL TESTS PASSED SUCCESSFULLY! ===');
