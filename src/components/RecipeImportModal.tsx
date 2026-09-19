import React, { useState } from 'react';
import { Recipe, Ingredient, GroceryCategory } from '../types';
import { useFamily } from '../context/FamilyContext';
import {
  Link as LinkIcon,
  Camera,
  MessageSquareQuote,
  Edit3,
  Wand2,
  Clock,
  Users,
  Plus,
  Trash2,
  ShoppingCart,
  Check,
  Sparkles,
  ChevronRight,
  UploadCloud,
  AlertCircle,
} from 'lucide-react';
import {
  parseRecipeFromDescription,
  parseRecipeFromLink,
  parseRecipeFromPhoto,
  DEMO_RECIPE_LINKS,
  DEMO_PHOTO_SCANS,
  inferGroceryCategory,
} from '../utils/recipeParser';

interface RecipeImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecipeSaved?: (recipe: Recipe) => void;
}

export const RecipeImportModal: React.FC<RecipeImportModalProps> = ({
  isOpen,
  onClose,
  onRecipeSaved,
}) => {
  const { addRecipe, addRecipeIngredientsToGrocery } = useFamily();

  const [activeTab, setActiveTab] = useState<'link' | 'photo' | 'describe' | 'manual'>('link');

  // Link state
  const [urlInput, setUrlInput] = useState('');

  // Photo state
  const [selectedPhotoPreview, setSelectedPhotoPreview] = useState<string | null>(null);
  const [selectedDemoPhotoId, setSelectedDemoPhotoId] = useState<string | null>(null);

  // Describe state
  const [descriptionInput, setDescriptionInput] = useState('');

  // Manual state
  const [manualTitle, setManualTitle] = useState('');
  const [manualPrepTime, setManualPrepTime] = useState('25 mins');
  const [manualServings, setManualServings] = useState(4);
  const [manualCategory, setManualCategory] = useState<Recipe['category']>('family-favorite');
  const [manualIngredientsText, setManualIngredientsText] = useState('');
  const [manualNotes, setManualNotes] = useState('');

  // Analysis / Scanning animation state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState('');

  // Refinement / Preview state
  const [draftRecipe, setDraftRecipe] = useState<Omit<Recipe, 'id'> | null>(null);

  // New ingredient adder within refinement view
  const [newIngName, setNewIngName] = useState('');
  const [newIngAmount, setNewIngAmount] = useState('');
  const [newIngCategory, setNewIngCategory] = useState<GroceryCategory>('produce');

  // Success toast
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  // Run simulated intelligent parsing with staged step updates
  const runAnalysis = async (parserFn: () => Promise<Omit<Recipe, 'id'>>) => {
    setIsAnalyzing(true);
    setAnalysisStep('Reading recipe source & content...');

    setTimeout(() => {
      setAnalysisStep('Detecting ingredients, quantities & time estimates...');
    }, 600);

    setTimeout(() => {
      setAnalysisStep('Organizing grocery aisles (produce, dairy, pantry)...');
    }, 1200);

    setTimeout(async () => {
      try {
        const recipe = await parserFn();
        setDraftRecipe(recipe);
      } catch (err) {
        console.error(err);
      } finally {
        setIsAnalyzing(false);
      }
    }, 1800);
  };

  const handleImportLink = (linkToUse?: string) => {
    const targetUrl = linkToUse || urlInput;
    if (!targetUrl.trim()) return;
    runAnalysis(() => parseRecipeFromLink(targetUrl.trim()));
  };

  const handleImportPhoto = (demoId?: string, imageSrc?: string) => {
    const idToUse = demoId || selectedDemoPhotoId || undefined;
    const previewToUse = imageSrc || selectedPhotoPreview || 'sample';
    runAnalysis(() => parseRecipeFromPhoto(previewToUse, idToUse));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedPhotoPreview(reader.result as string);
        setSelectedDemoPhotoId(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImportDescription = (textToUse?: string) => {
    const text = textToUse || descriptionInput;
    if (!text.trim()) return;
    runAnalysis(async () => parseRecipeFromDescription(text.trim()));
  };

  const handleSaveManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim()) return;

    const parsedIngs: Ingredient[] = manualIngredientsText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const parts = line.split(',').map((p) => p.trim());
        return {
          name: parts[0],
          amount: parts[1] || 'As needed',
          category: (parts[2] as GroceryCategory) || inferGroceryCategory(parts[0]),
        };
      });

    const newRecipeData: Omit<Recipe, 'id'> = {
      title: manualTitle.trim(),
      prepTime: manualPrepTime.trim(),
      servings: manualServings,
      category: manualCategory,
      imageUrl: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=800&q=80',
      ingredients:
        parsedIngs.length > 0
          ? parsedIngs
          : [{ name: 'Assorted ingredients', amount: 'as needed', category: 'pantry' }],
      notes: manualNotes.trim() || undefined,
      sourceType: 'manual',
    };

    setDraftRecipe(newRecipeData);
  };

  // Actions on Draft Recipe
  const handleUpdateServings = (delta: number) => {
    if (!draftRecipe) return;
    const next = Math.max(1, draftRecipe.servings + delta);
    setDraftRecipe({ ...draftRecipe, servings: next });
  };

  const handleDeleteIngredient = (index: number) => {
    if (!draftRecipe) return;
    const updated = draftRecipe.ingredients.filter((_, idx) => idx !== index);
    setDraftRecipe({ ...draftRecipe, ingredients: updated });
  };

  const handleAddIngredient = () => {
    if (!draftRecipe || !newIngName.trim()) return;
    const newIng: Ingredient = {
      name: newIngName.trim(),
      amount: newIngAmount.trim() || 'To taste',
      category: newIngCategory,
    };
    setDraftRecipe({
      ...draftRecipe,
      ingredients: [...draftRecipe.ingredients, newIng],
    });
    setNewIngName('');
    setNewIngAmount('');
  };

  const handleSaveToRecipeBox = (addToGroceryList: boolean = false) => {
    if (!draftRecipe) return;

    const savedRecipe = addRecipe(draftRecipe);

    if (addToGroceryList) {
      const groceryResult = addRecipeIngredientsToGrocery(savedRecipe);
      if (groceryResult.skippedCount > 0) {
        setSaveFeedback(
          `Saved "${savedRecipe.title}"! Added ${groceryResult.addedCount} items to store lists; skipped ${groceryResult.skippedCount} staples already at home (${groceryResult.skippedNames.join(', ')}) 🧂`
        );
      } else {
        setSaveFeedback(`Saved "${savedRecipe.title}" & added ${groceryResult.addedCount} ingredients to store lists! 🛒`);
      }
    } else {
      setSaveFeedback(`"${savedRecipe.title}" added to your Family Recipe Box! 📖`);
    }

    if (onRecipeSaved) {
      onRecipeSaved(savedRecipe);
    }

    setTimeout(() => {
      onClose();
      setDraftRecipe(null);
      setSaveFeedback(null);
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border-2 border-stone-200 animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b-2 border-stone-100 pb-3.5 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center text-xl shadow-xs">
              <Sparkles className="w-6 h-6 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black text-stone-900">
                  {draftRecipe ? 'Review & Refine Recipe' : 'Smart Recipe Importer'}
                </h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  AI Magic ✨
                </span>
              </div>
              <p className="text-xs font-semibold text-stone-500">
                {draftRecipe
                  ? 'Verify ingredients, cooking time, and save to family collection'
                  : 'Describe, snap a photo, or paste a link to convert instantly'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-stone-100 text-stone-500 hover:bg-stone-200 hover:text-stone-800 flex items-center justify-center font-black transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Success Feedback Banner */}
        {saveFeedback && (
          <div className="mb-4 p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-emerald-900 font-bold text-xs flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600 shrink-0 stroke-[3]" />
            <span>{saveFeedback}</span>
          </div>
        )}

        {/* LOADING / SCANNING ANIMATION STATE */}
        {isAnalyzing && (
          <div className="py-12 px-6 flex flex-col items-center justify-center text-center space-y-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-3xl bg-amber-100 border-4 border-amber-400 flex items-center justify-center text-3xl animate-bounce shadow-md">
                🍳
              </div>
              <Sparkles className="w-6 h-6 text-amber-500 absolute -top-2 -right-2 animate-spin" />
            </div>

            <div className="space-y-1 max-w-sm">
              <h4 className="text-base font-black text-stone-900">Famly Recipe Scanner</h4>
              <p className="text-xs font-bold text-amber-700 animate-pulse">{analysisStep}</p>
            </div>

            <div className="w-48 h-2 bg-stone-100 rounded-full overflow-hidden border border-stone-200">
              <div className="h-full bg-gradient-to-r from-amber-400 via-orange-400 to-emerald-400 animate-pulse rounded-full w-3/4"></div>
            </div>
          </div>
        )}

        {/* REVIEW & REFINE STATE */}
        {!isAnalyzing && draftRecipe && (
          <div className="space-y-5 animate-in fade-in">
            {/* Top Recipe Card Overview */}
            <div className="relative rounded-2xl overflow-hidden border-2 border-stone-200 shadow-sm bg-stone-50">
              <div className="h-44 sm:h-48 w-full overflow-hidden relative">
                <img
                  src={draftRecipe.imageUrl}
                  alt={draftRecipe.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent flex flex-col justify-end p-4 text-white">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full bg-amber-400 text-stone-950">
                      {draftRecipe.category}
                    </span>
                    {draftRecipe.sourceType && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-white">
                        via {draftRecipe.sourceType}
                      </span>
                    )}
                  </div>
                  <h4 className="text-lg sm:text-xl font-black drop-shadow-sm leading-tight">
                    {draftRecipe.title}
                  </h4>
                </div>
              </div>

              {/* Quick Metrics Bar (Prep Time, Servings, Category) */}
              <div className="p-4 bg-white border-t border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                {/* Time Estimate */}
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-stone-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    Time:
                  </span>
                  <input
                    type="text"
                    value={draftRecipe.prepTime}
                    onChange={(e) => setDraftRecipe({ ...draftRecipe, prepTime: e.target.value })}
                    className="w-24 px-2 py-1 rounded-lg border border-stone-300 font-black text-stone-800 text-center"
                  />
                </div>

                {/* Servings Counter */}
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-stone-500 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-blue-500" />
                    Servings:
                  </span>
                  <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-xl border border-stone-200">
                    <button
                      type="button"
                      onClick={() => handleUpdateServings(-1)}
                      className="w-6 h-6 rounded-lg bg-white font-black text-stone-700 hover:bg-stone-200 flex items-center justify-center text-xs"
                    >
                      -
                    </button>
                    <span className="font-black text-xs px-2 text-stone-900">
                      {draftRecipe.servings}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleUpdateServings(1)}
                      className="w-6 h-6 rounded-lg bg-white font-black text-stone-700 hover:bg-stone-200 flex items-center justify-center text-xs"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Category Pill */}
                <div className="flex items-center gap-1">
                  <select
                    value={draftRecipe.category}
                    onChange={(e) =>
                      setDraftRecipe({
                        ...draftRecipe,
                        category: e.target.value as Recipe['category'],
                      })
                    }
                    className="px-2 py-1 rounded-lg border border-stone-300 font-bold text-stone-700 text-xs bg-white"
                  >
                    <option value="quick">Quick Dinner (under 30m)</option>
                    <option value="comfort">Comfort Food</option>
                    <option value="healthy">Healthy & Fresh</option>
                    <option value="baking">Baking & Sweet</option>
                    <option value="family-favorite">Family Favorite</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Ingredients Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-black text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                  <span>🛒 Extracted Ingredients ({draftRecipe.ingredients.length})</span>
                </h5>
                <span className="text-[10px] text-stone-400 font-bold">
                  Auto-categorized by grocery aisle
                </span>
              </div>

              {/* Ingredients List Table */}
              <div className="divide-y divide-stone-100 border-2 border-stone-200 rounded-2xl overflow-hidden bg-white">
                {draftRecipe.ingredients.map((ing, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 sm:px-3.5 flex items-center justify-between gap-2 text-xs hover:bg-stone-50"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span
                        className={`text-[9px] uppercase font-black px-1.5 py-0.5 rounded-md shrink-0 ${
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
                      <span className="font-extrabold text-stone-800 truncate">{ing.name}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md text-[11px]">
                        {ing.amount}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteIngredient(idx)}
                        className="text-stone-300 hover:text-rose-600 p-1 transition-colors"
                        title="Remove ingredient"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Extra Ingredient Row */}
              <div className="p-2.5 bg-stone-50 rounded-2xl border border-stone-200 flex flex-wrap items-center gap-2 text-xs">
                <input
                  type="text"
                  placeholder="Ingredient name (e.g. Garlic)..."
                  value={newIngName}
                  onChange={(e) => setNewIngName(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-stone-300 flex-1 min-w-[120px] focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Amount (e.g. 2 cloves)..."
                  value={newIngAmount}
                  onChange={(e) => setNewIngAmount(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-stone-300 w-28 focus:outline-none"
                />
                <select
                  value={newIngCategory}
                  onChange={(e) => setNewIngCategory(e.target.value as GroceryCategory)}
                  className="px-2 py-1.5 rounded-xl border border-stone-300 bg-white font-semibold text-stone-700"
                >
                  <option value="produce">Produce</option>
                  <option value="dairy">Dairy</option>
                  <option value="meat">Meat</option>
                  <option value="bakery">Bakery</option>
                  <option value="pantry">Pantry</option>
                </select>
                <button
                  type="button"
                  onClick={handleAddIngredient}
                  disabled={!newIngName.trim()}
                  className="duo-btn duo-btn-white px-3 py-1.5 text-xs font-black rounded-xl disabled:opacity-40"
                >
                  <Plus className="w-3.5 h-3.5 mr-0.5 inline" /> Add
                </button>
              </div>
            </div>

            {/* Step-by-Step Instructions Preview */}
            {draftRecipe.instructions && draftRecipe.instructions.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-xs font-black text-stone-800 uppercase tracking-wider">
                  Cooking Instructions ({draftRecipe.instructions.length} steps)
                </h5>
                <div className="space-y-2">
                  {draftRecipe.instructions.map((step, idx) => (
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

            {/* Modal Bottom Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t-2 border-stone-100">
              <button
                type="button"
                onClick={() => setDraftRecipe(null)}
                className="duo-btn duo-btn-white px-4 py-2 text-xs font-black rounded-2xl w-full sm:w-auto"
              >
                ← Back to Importer
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => handleSaveToRecipeBox(false)}
                  className="duo-btn duo-btn-white px-4 py-2 text-xs font-black rounded-2xl flex-1 sm:flex-initial"
                >
                  💾 Save to Recipe Box
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveToRecipeBox(true)}
                  className="duo-btn duo-btn-green px-4 py-2 text-xs font-black rounded-2xl flex-1 sm:flex-initial"
                >
                  <ShoppingCart className="w-4 h-4 mr-1.5 inline stroke-[2.5]" />
                  Save & Add to Shopping List
                </button>
              </div>
            </div>
          </div>
        )}

        {/* INITIAL IMPORT TABS STATE (When not refining) */}
        {!isAnalyzing && !draftRecipe && (
          <div className="space-y-5">
            {/* Chunky Duolingo-styled Mode Switcher */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('link')}
                className={`duo-btn p-3 rounded-2xl flex flex-col items-center gap-1.5 transition-all ${
                  activeTab === 'link'
                    ? 'duo-btn-green'
                    : 'duo-btn-white text-stone-700'
                }`}
              >
                <LinkIcon className="w-5 h-5" />
                <span className="text-xs font-black">Paste Link</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('photo')}
                className={`duo-btn p-3 rounded-2xl flex flex-col items-center gap-1.5 transition-all ${
                  activeTab === 'photo'
                    ? 'duo-btn-purple'
                    : 'duo-btn-white text-stone-700'
                }`}
              >
                <Camera className="w-5 h-5" />
                <span className="text-xs font-black">Photo / Scan</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('describe')}
                className={`duo-btn p-3 rounded-2xl flex flex-col items-center gap-1.5 transition-all ${
                  activeTab === 'describe'
                    ? 'duo-btn-rose'
                    : 'duo-btn-white text-stone-700'
                }`}
              >
                <MessageSquareQuote className="w-5 h-5" />
                <span className="text-xs font-black">Describe / Dictate</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('manual')}
                className={`duo-btn p-3 rounded-2xl flex flex-col items-center gap-1.5 transition-all ${
                  activeTab === 'manual'
                    ? 'bg-stone-900 text-white'
                    : 'duo-btn-white text-stone-700'
                }`}
              >
                <Edit3 className="w-5 h-5" />
                <span className="text-xs font-black">Manual Form</span>
              </button>
            </div>

            {/* TAB 1: PASTE A LINK */}
            {activeTab === 'link' && (() => {
              const trimmed = urlInput.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
              const isRootDomain =
                trimmed === 'www.chefkoch.de' ||
                trimmed === 'chefkoch.de' ||
                trimmed === 'www.bbcgoodfood.com' ||
                trimmed === 'bbcgoodfood.com' ||
                trimmed === 'cooking.nytimes.com';

              return (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50/60 rounded-2xl border-2 border-emerald-200 space-y-2.5">
                    <label className="block text-xs font-black text-emerald-950 uppercase tracking-wider">
                      Recipe Web Address (URL)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="e.g. https://www.chefkoch.de/rezepte/... or https://bbcgoodfood.com/..."
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        className="flex-1 px-3.5 py-2.5 rounded-xl border border-emerald-300 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => handleImportLink()}
                        disabled={!urlInput.trim()}
                        className="duo-btn duo-btn-green px-4 py-2 text-xs font-black rounded-xl disabled:opacity-50 shrink-0"
                      >
                        <Wand2 className="w-4 h-4 mr-1 inline stroke-[2.5]" />
                        Extract
                      </button>
                    </div>

                    {isRootDomain && (
                      <div className="p-3 bg-amber-50 rounded-xl border-2 border-amber-300 text-amber-950 text-xs flex items-start gap-2 animate-in fade-in">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="block font-black text-amber-900">
                            Website Homepage Detected ({trimmed})
                          </strong>
                          <span>
                            You entered the main portal address. Please paste a specific recipe link (like <em>https://www.chefkoch.de/rezepte/1279831233330574/Allgaeuer-Kaesspatzen.html</em>) or click one of the verified recipes below:
                          </span>
                        </div>
                      </div>
                    )}

                    <p className="text-[11px] text-emerald-800/80 font-bold">
                      Works with Chefkoch, BBC Good Food, NYT Cooking, Allrecipes, and most cooking blogs.
                    </p>
                  </div>

                  {/* Quick-Paste Raw Recipe Text Box */}
                  <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-stone-700">
                        📋 Or Paste Recipe Text / Ingredients Directly:
                      </span>
                      <span className="text-[10px] text-stone-400 font-bold">No typing needed</span>
                    </div>
                    <textarea
                      rows={2}
                      placeholder="Paste ingredients or recipe text copied from any website or note..."
                      value={descriptionInput}
                      onChange={(e) => setDescriptionInput(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-stone-300 text-xs bg-white font-medium focus:outline-none"
                    />
                    {descriptionInput.trim() && (
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleImportDescription()}
                          className="duo-btn duo-btn-rose px-3.5 py-1.5 text-xs font-black rounded-xl"
                        >
                          <Wand2 className="w-3.5 h-3.5 mr-1 inline stroke-[2.5]" /> Convert Pasted Text
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 1-Tap Demo Links */}
                  <div>
                    <span className="block text-[11px] font-black text-stone-400 uppercase tracking-wider mb-2">
                      Or Try a Verified Live Recipe Link:
                    </span>
                  <div className="space-y-2">
                    {DEMO_RECIPE_LINKS.map((demo) => (
                      <div
                        key={demo.id}
                        onClick={() => {
                          setUrlInput(demo.url);
                          handleImportLink(demo.url);
                        }}
                        className="cursor-pointer p-3 rounded-2xl border-2 border-stone-200 bg-stone-50 hover:bg-emerald-50/50 hover:border-emerald-300 transition-all flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">🍲</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <strong className="text-xs font-black text-stone-900 group-hover:text-emerald-900">
                                {demo.name}
                              </strong>
                              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-white border border-stone-200 text-stone-600">
                                {demo.source}
                              </span>
                            </div>
                            <span className="text-[11px] text-stone-400 font-semibold truncate block max-w-xs sm:max-w-md">
                              {demo.url}
                            </span>
                          </div>
                        </div>

                        <button className="duo-btn duo-btn-white px-3 py-1.5 text-xs font-black rounded-xl group-hover:duo-btn-green">
                          <span>Import</span>
                          <ChevronRight className="w-3.5 h-3.5 ml-1 inline" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );})()}

            {/* TAB 2: PHOTO / SCAN */}
            {activeTab === 'photo' && (
              <div className="space-y-4">
                <div className="p-4 bg-purple-50/60 rounded-2xl border-2 border-purple-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black text-purple-950 uppercase tracking-wider">
                        Scan Cookbook Page or Handwritten Card
                      </h4>
                      <p className="text-[11px] font-semibold text-purple-800/80">
                        Snap a photo with your phone camera or upload an image file
                      </p>
                    </div>
                  </div>

                  {/* File Upload / Camera Input */}
                  <label className="border-2 border-dashed border-purple-300 rounded-2xl p-4 bg-white flex flex-col items-center justify-center cursor-pointer hover:bg-purple-50/40 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <UploadCloud className="w-8 h-8 text-purple-500 mb-1" />
                    <span className="text-xs font-black text-purple-900">
                      Take Photo or Upload Image
                    </span>
                    <span className="text-[10px] text-stone-400 font-semibold mt-0.5">
                      JPG, PNG, WebP supported
                    </span>
                  </label>

                  {selectedPhotoPreview && (
                    <div className="p-3 bg-white rounded-xl border border-purple-200 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={selectedPhotoPreview}
                          alt="Preview"
                          className="w-12 h-12 rounded-lg object-cover border"
                        />
                        <span className="text-xs font-black text-stone-800">
                          Photo ready for OCR scanning
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleImportPhoto(undefined, selectedPhotoPreview)}
                        className="duo-btn duo-btn-purple px-4 py-2 text-xs font-black rounded-xl"
                      >
                        <Wand2 className="w-3.5 h-3.5 mr-1 inline" /> Scan & Extract
                      </button>
                    </div>
                  )}
                </div>

                {/* 1-Tap Demo Scans */}
                <div>
                  <span className="block text-[11px] font-black text-stone-400 uppercase tracking-wider mb-2">
                    Or Try Sample Scanned Recipe Cards:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {DEMO_PHOTO_SCANS.map((scan) => (
                      <div
                        key={scan.id}
                        onClick={() => {
                          setSelectedDemoPhotoId(scan.id);
                          setSelectedPhotoPreview(scan.previewImage);
                          handleImportPhoto(scan.id, scan.previewImage);
                        }}
                        className="cursor-pointer p-3 rounded-2xl border-2 border-stone-200 bg-stone-50 hover:bg-purple-50/50 hover:border-purple-300 transition-all flex items-center gap-3 group"
                      >
                        <img
                          src={scan.previewImage}
                          alt={scan.name}
                          className="w-14 h-14 rounded-xl object-cover border border-stone-200 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <strong className="text-xs font-black text-stone-900 group-hover:text-purple-900 block truncate">
                            {scan.name}
                          </strong>
                          <span className="text-[11px] font-bold text-purple-700 flex items-center gap-1 mt-1">
                            <span>Scan Card →</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: DESCRIBE / DICTATE */}
            {activeTab === 'describe' && (
              <div className="space-y-4">
                <div className="p-4 bg-rose-50/60 rounded-2xl border-2 border-rose-200 space-y-2">
                  <label className="block text-xs font-black text-rose-950 uppercase tracking-wider">
                    Describe Recipe in Plain Words or Dictate
                  </label>
                  <p className="text-[11px] font-semibold text-rose-800/80">
                    Mention ingredients, rough time, or family tweaks. Our AI extracts measurements, steps, and shopping lists!
                  </p>
                  <textarea
                    rows={4}
                    placeholder="e.g. Grandma's potato salad with 1kg waxy potatoes, 1 red onion, 200ml hot broth, 3 tbsp vinegar, oil, salt, pepper, and chives. Takes 25 mins for 5 people..."
                    value={descriptionInput}
                    onChange={(e) => setDescriptionInput(e.target.value)}
                    className="w-full p-3 rounded-xl border border-rose-300 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-rose-400 font-medium"
                  />
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => handleImportDescription()}
                      disabled={!descriptionInput.trim()}
                      className="duo-btn duo-btn-rose px-4 py-2 text-xs font-black rounded-xl disabled:opacity-50"
                    >
                      <Wand2 className="w-4 h-4 mr-1 inline stroke-[2.5]" />
                      Convert to Recipe
                    </button>
                  </div>
                </div>

                {/* 1-Tap Sample Prompts */}
                <div>
                  <span className="block text-[11px] font-black text-stone-400 uppercase tracking-wider mb-2">
                    Click to Try a Sample Description:
                  </span>
                  <div className="space-y-2">
                    {[
                      {
                        title: 'Quick 20-min Thai Coconut Noodles',
                        desc: 'Thai coconut noodle bowl with 300g rice noodles, 1 can coconut milk, 200g broccoli, 200g tofu cubes, 1 lime, soy sauce, and cilantro. Ready in 20 minutes for 4 people.',
                      },
                      {
                        title: 'Grandma’s Bavarian Potato Salad',
                        desc: 'Bavarian warm potato salad with 1kg waxy potatoes, 1 chopped red onion, 250ml hot beef broth, 3 tbsp white vinegar, 4 tbsp sunflower oil, 1 tbsp mustard, salt, pepper, and fresh chives. Takes 25 mins, serves 5.',
                      },
                      {
                        title: 'Saturday Fluffy Blueberry Pancakes',
                        desc: 'Fluffy Saturday breakfast pancakes with 250g flour, 2 eggs, 300ml milk, 50g melted butter, 1 tsp baking powder, 1 cup fresh blueberries, and maple syrup. Takes 15 mins for 4 people.',
                      },
                    ].map((sample, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          setDescriptionInput(sample.desc);
                          handleImportDescription(sample.desc);
                        }}
                        className="cursor-pointer p-3 rounded-2xl border-2 border-stone-200 bg-stone-50 hover:bg-rose-50/50 hover:border-rose-300 transition-all flex items-center justify-between group"
                      >
                        <div className="pr-3">
                          <strong className="text-xs font-black text-stone-900 group-hover:text-rose-900 block">
                            {sample.title}
                          </strong>
                          <p className="text-[11px] text-stone-500 font-medium line-clamp-1 mt-0.5">
                            {sample.desc}
                          </p>
                        </div>
                        <button className="duo-btn duo-btn-white px-3 py-1.5 text-xs font-black rounded-xl group-hover:duo-btn-rose shrink-0">
                          Try Prompt →
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: MANUAL FORM */}
            {activeTab === 'manual' && (
              <form onSubmit={handleSaveManual} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-extrabold text-stone-600 mb-1">
                      Recipe Title *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Grandma's Sunday Roast"
                      value={manualTitle}
                      onChange={(e) => setManualTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-stone-600 mb-1">
                      Category
                    </label>
                    <select
                      value={manualCategory}
                      onChange={(e) =>
                        setManualCategory(e.target.value as Recipe['category'])
                      }
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white font-semibold"
                    >
                      <option value="quick">Quick (under 30m)</option>
                      <option value="comfort">Comfort Food</option>
                      <option value="healthy">Healthy & Fresh</option>
                      <option value="baking">Baking & Desserts</option>
                      <option value="family-favorite">Family Favorite</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-extrabold text-stone-600 mb-1">
                      Total Time
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 30 mins"
                      value={manualPrepTime}
                      onChange={(e) => setManualPrepTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-stone-600 mb-1">
                      Servings
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={manualServings}
                      onChange={(e) => setManualServings(parseInt(e.target.value, 10) || 4)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-stone-600 mb-1">
                    Ingredients (one per line: Name, Amount, Category)
                  </label>
                  <textarea
                    rows={4}
                    placeholder={"Potatoes, 1kg, produce\nMilk, 200ml, dairy\nButter, 50g, dairy\nNutmeg, 1 pinch, pantry"}
                    value={manualIngredientsText}
                    onChange={(e) => setManualIngredientsText(e.target.value)}
                    className="w-full p-3 rounded-xl border border-stone-300 text-xs font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-stone-600 mb-1">
                    Notes or Secret Tips
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Add extra crispy onions before serving"
                    value={manualNotes}
                    onChange={(e) => setManualNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="duo-btn duo-btn-green px-5 py-2.5 text-xs font-black rounded-xl"
                  >
                    Review & Save Recipe →
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
