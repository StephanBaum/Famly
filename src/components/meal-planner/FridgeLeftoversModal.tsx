import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Recipe } from '../../types';
import { ModalPortal } from '../ModalPortal';
import { Sparkles, Check, Plus, ArrowRight } from 'lucide-react';
import { getMatchingFoodPhoto } from '../../utils/recipeParser';

interface FridgeLeftoversModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipes: Recipe[];
  onSelectForDinner: (recipe: Recipe) => void;
  onAddCustomRecipe: (recipe: Recipe) => void;
}

const COMMON_PANTRY_ITEMS = [
  { name: 'Nudeln', icon: '🍝' },
  { name: 'Reis', icon: '🍚' },
  { name: 'Kartoffeln', icon: '🥔' },
  { name: 'Eier', icon: '🥚' },
  { name: 'Zwiebeln & Knoblauch', icon: '🧅' },
  { name: 'Tomaten / Passata', icon: '🍅' },
  { name: 'Paprika', icon: '🫑' },
  { name: 'Brokkoli', icon: '🥦' },
  { name: 'Zucchini', icon: '🥒' },
  { name: 'Sahne / Schmand', icon: '🥛' },
  { name: 'Käse / Parmesan', icon: '🧀' },
  { name: 'Hähnchen', icon: '🍗' },
  { name: 'Hackfleisch', icon: '🥩' },
  { name: 'Feta', icon: '🧀' },
];

export const FridgeLeftoversModal: React.FC<FridgeLeftoversModalProps> = ({
  isOpen,
  onClose,
  recipes,
  onSelectForDinner,
  onAddCustomRecipe,
}) => {
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>(['Nudeln', 'Käse / Parmesan']);
  const [customInput, setCustomInput] = useState('');

  if (!isOpen) return null;

  const toggleIngredient = (name: string) => {
    setSelectedIngredients((prev) =>
      prev.includes(name) ? prev.filter((i) => i !== name) : [...prev, name]
    );
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    const clean = customInput.trim();
    if (!selectedIngredients.includes(clean)) {
      setSelectedIngredients((prev) => [...prev, clean]);
    }
    setCustomInput('');
  };

  // Rank existing recipes by how many selected ingredients match
  const rankedRecipes = recipes
    .map((recipe) => {
      let matchCount = 0;
      const matchedNames: string[] = [];
      const recipeText = (
        recipe.title +
        ' ' +
        recipe.ingredients.map((i) => i.name).join(' ')
      ).toLowerCase();

      selectedIngredients.forEach((ing) => {
        const words = ing.toLowerCase().split(/[ /&]+/);
        const hit = words.some((w) => w.length > 2 && recipeText.includes(w));
        if (hit) {
          matchCount++;
          matchedNames.push(ing);
        }
      });

      return {
        recipe,
        matchCount,
        matchedNames,
      };
    })
    .filter((item) => item.matchCount > 0)
    .sort((a, b) => b.matchCount - a.matchCount);

  const handlePickRecipe = (recipe: Recipe) => {
    onSelectForDinner(recipe);
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
    });
    onClose();
  };

  // Quick fallback generator if user wants an instant tailor-made recipe
  const handleGenerateInstantDish = () => {
    const mainIng = selectedIngredients.slice(0, 3).join(', ') || 'Vorräten';
    const instantRecipe: Recipe = {
      id: `ai_leftover_${Date.now()}`,
      title: `Schnelle ${selectedIngredients[0] || 'Pfanne'} mit ${selectedIngredients[1] || 'Gemüse'}`,
      prepTime: '20 Min',
      servings: 4,
      category: 'quick',
      imageUrl: getMatchingFoodPhoto(`Schnelle Pfanne mit ${mainIng}`, 'quick'),
      ingredients: selectedIngredients.map((ing) => ({
        name: ing,
        amount: 'nach Gefühl',
        category: 'pantry',
      })),
      instructions: [
        'Zutaten waschen und mundgerecht schneiden.',
        'In einer Pfanne mit etwas Olivenöl anbraten und gut abschmecken.',
        'Mit Kräutern und Käse verfeinern und heiß servieren.',
      ],
      notes: 'Kreiert aus deinen Kühlschrank-Vorräten.',
      theme: 'quick',
      isFavorite: false,
    };

    onAddCustomRecipe(instantRecipe);
    onSelectForDinner(instantRecipe);
    confetti({
      particleCount: 60,
      spread: 80,
      origin: { y: 0.6 },
    });
    onClose();
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-xl border-2 border-stone-200 dark:border-slate-800 animate-in fade-in zoom-in-95 my-auto max-h-[92vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-slate-800 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl shrink-0">
                🥕
              </div>
              <div>
                <h3 className="text-lg font-black text-stone-900 dark:text-white leading-tight">
                  Kühlschrank-Resteverwerter
                </h3>
                <p className="text-xs text-stone-500 dark:text-slate-400 font-semibold">
                  Was hast du zuhause? Finde das passende Familienessen für heute Abend.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-stone-600 dark:hover:text-white text-sm font-bold"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4 py-4 flex-1 overflow-y-auto scrollbar-thin pr-1">
            {/* Ingredient Pills Picker */}
            <div>
              <label className="block text-xs font-bold text-stone-600 dark:text-slate-300 uppercase mb-2">
                Vorräte auswählen ({selectedIngredients.length} gewählt)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_PANTRY_ITEMS.map((item) => {
                  const isSelected = selectedIngredients.includes(item.name);
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => toggleIngredient(item.name)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
                        isSelected
                          ? 'bg-amber-400 text-stone-900 border-amber-500 shadow-2xs scale-102 font-black'
                          : 'bg-stone-50 dark:bg-slate-800 text-stone-700 dark:text-slate-300 border-stone-200 dark:border-slate-700 hover:bg-stone-100'
                      }`}
                    >
                      <span>{item.icon}</span>
                      <span>{item.name}</span>
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Add custom ingredient input */}
            <form onSubmit={handleAddCustom} className="flex gap-2">
              <input
                type="text"
                placeholder="Weiteres hinzufügen (z.B. Champignons, Linsen)..."
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-xs focus:outline-none"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-stone-100 dark:bg-slate-700 hover:bg-stone-200 text-stone-700 dark:text-white text-xs font-bold rounded-xl flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Dazu</span>
              </button>
            </form>

            {/* Results Section */}
            <div className="space-y-3 pt-2 border-t border-stone-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-stone-700 dark:text-slate-300 uppercase tracking-wider">
                  Passende Gerichte ({rankedRecipes.length})
                </span>
                <button
                  type="button"
                  onClick={handleGenerateInstantDish}
                  className="text-xs font-black text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Neues KI-Gericht erfinden</span>
                </button>
              </div>

              {rankedRecipes.length === 0 ? (
                <div className="p-6 text-center bg-stone-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-stone-200 dark:border-slate-700">
                  <p className="text-xs text-stone-500 dark:text-slate-400 font-semibold mb-3">
                    Kein exakt passendes Standardrezept gefunden.
                  </p>
                  <button
                    type="button"
                    onClick={handleGenerateInstantDish}
                    className="duo-btn duo-btn-amber px-4 py-2 text-xs font-black rounded-xl inline-flex items-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Instant-Rezept aus Vorräten erstellen</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-[220px] overflow-y-auto scrollbar-none">
                  {rankedRecipes.slice(0, 5).map(({ recipe, matchCount, matchedNames }) => (
                    <div
                      key={recipe.id}
                      className="p-3 rounded-2xl border-2 border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:border-amber-400 transition-all flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-stone-900 dark:text-white truncate">
                            {recipe.title}
                          </h4>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-black shrink-0">
                            {matchCount} {matchCount === 1 ? 'Zutat' : 'Zutaten'} da ✓
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-400 dark:text-slate-400 truncate mt-0.5">
                          Nutzt: {matchedNames.join(', ')} • {recipe.prepTime}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handlePickRecipe(recipe)}
                        className="duo-btn duo-btn-blue px-3 py-1.5 text-xs font-black rounded-xl shrink-0 flex items-center gap-1"
                      >
                        <span>Kochen</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-stone-100 dark:border-slate-800 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="duo-btn duo-btn-white px-4 py-2 text-xs font-bold rounded-xl"
            >
              Schließen
            </button>
            <button
              type="button"
              onClick={handleGenerateInstantDish}
              className="duo-btn duo-btn-amber px-4 py-2 text-xs font-black rounded-xl flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>Restegericht für Heute</span>
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
