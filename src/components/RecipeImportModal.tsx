import React, { useState } from 'react';
import { Recipe, Ingredient, GroceryCategory } from '../types';
import { useFamily } from '../context/FamilyContext';
import { ModalPortal } from './ModalPortal';
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
import { isAIConfigured, getAIConfig, generateRecipeWithAI } from '../services/aiRecipeService';

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

  // Run intelligent parsing (Real AI or smart heuristic fallback)
  const runAnalysis = async (parserFn: () => Promise<Omit<Recipe, 'id'>>) => {
    setIsAnalyzing(true);
    const aiConfig = getAIConfig();
    const isAi = isAIConfigured();

    setAnalysisStep(
      isAi
        ? `Verbinde mit ${aiConfig?.provider === 'gemini' ? 'Google Gemini' : 'OpenAI'}...`
        : 'Lese Rezeptquelle & Inhalt ein...'
    );

    const stepTimer1 = setTimeout(() => {
      setAnalysisStep(
        isAi
          ? 'KI erkennt Zutaten, Maßeinheiten & Zubereitung...'
          : 'Erkenne Zutaten, Mengenangaben & Zubereitungszeit...'
      );
    }, 500);

    const stepTimer2 = setTimeout(() => {
      setAnalysisStep('Ordne Einkaufsregale zu (Obst/Gemüse, Kühlregal, Vorrat)...');
    }, 1100);

    try {
      const recipe = await parserFn();
      setDraftRecipe(recipe);
    } catch (err: any) {
      console.warn('AI Parsing failed, falling back to local heuristic:', err);
      try {
        const fallback = parseRecipeFromDescription(descriptionInput || urlInput || 'Familien-Rezept');
        setDraftRecipe(fallback);
      } catch (fallbackErr) {
        console.error('Total parsing error:', fallbackErr);
      }
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setIsAnalyzing(false);
    }
  };

  const handleImportLink = (linkToUse?: string) => {
    const targetUrl = linkToUse || urlInput;
    if (!targetUrl.trim()) return;

    if (isAIConfigured()) {
      runAnalysis(() => generateRecipeWithAI({ linkUrl: targetUrl.trim(), mode: 'link' }));
    } else {
      runAnalysis(() => parseRecipeFromLink(targetUrl.trim()));
    }
  };

  const handleImportPhoto = (demoId?: string, imageSrc?: string) => {
    const idToUse = demoId || selectedDemoPhotoId || undefined;
    const previewToUse = imageSrc || selectedPhotoPreview || 'sample';

    if (isAIConfigured() && selectedPhotoPreview && selectedPhotoPreview.startsWith('data:')) {
      // Real Multimodal AI Vision on the user's uploaded photo!
      runAnalysis(() => generateRecipeWithAI({ imageBase64: selectedPhotoPreview, mode: 'photo' }));
    } else {
      runAnalysis(() => parseRecipeFromPhoto(previewToUse, idToUse));
    }
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

    if (isAIConfigured()) {
      runAnalysis(() => generateRecipeWithAI({ prompt: text.trim(), mode: 'describe' }));
    } else {
      runAnalysis(async () => parseRecipeFromDescription(text.trim()));
    }
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
          `"${savedRecipe.title}" gespeichert! ${groceryResult.addedCount} Zutaten zur Einkaufsliste hinzugefügt; ${groceryResult.skippedCount} Vorräte übersprungen (${groceryResult.skippedNames.join(', ')}) 🧂`
        );
      } else {
        setSaveFeedback(`"${savedRecipe.title}" gespeichert & ${groceryResult.addedCount} Zutaten auf die Einkaufsliste gesetzt! 🛒`);
      }
    } else {
      setSaveFeedback(`"${savedRecipe.title}" wurde im Familien-Rezeptbuch gespeichert! 📖`);
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

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border-2 border-stone-200 dark:border-slate-800 animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto text-stone-900 dark:text-slate-100">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b-2 border-stone-100 dark:border-slate-800 pb-3.5 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center text-xl shadow-xs">
              <Sparkles className="w-6 h-6 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg sm:text-xl font-black text-stone-900 dark:text-white">
                  {draftRecipe ? 'Rezept überprüfen & verfeinern' : 'Smarter Rezept-Import'}
                </h3>
                <span
                  className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                    isAIConfigured()
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                      : 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                  }`}
                >
                  {isAIConfigured()
                    ? `✨ ${getAIConfig()?.provider === 'gemini' ? 'Gemini 1.5 Flash' : 'OpenAI'} aktiv`
                    : '✨ Lokaler Modus'}
                </span>
              </div>
              <p className="text-xs font-semibold text-stone-500 dark:text-slate-400">
                {draftRecipe
                  ? 'Zutaten und Kochzeit prüfen und zur Familiensammlung hinzufügen'
                  : 'Beschreiben, Foto knipsen oder Link einfügen – sekundenschnell umgewandelt'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-stone-100 dark:bg-slate-800 text-stone-500 dark:text-slate-400 hover:bg-stone-200 dark:hover:bg-slate-700 hover:text-stone-800 dark:hover:text-white flex items-center justify-center font-black transition-colors"
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
              <h4 className="text-base font-black text-stone-900 dark:text-white">Famly Rezept-Scanner</h4>
              <p className="text-xs font-bold text-amber-700 dark:text-amber-400 animate-pulse">{analysisStep}</p>
            </div>

            <div className="w-48 h-2 bg-stone-100 dark:bg-slate-800 rounded-full overflow-hidden border border-stone-200 dark:border-slate-700">
              <div className="h-full bg-gradient-to-r from-amber-400 via-orange-400 to-emerald-400 animate-pulse rounded-full w-3/4"></div>
            </div>
          </div>
        )}

        {/* REVIEW & REFINE STATE */}
        {!isAnalyzing && draftRecipe && (
          <div className="space-y-5 animate-in fade-in">
            {/* Top Recipe Card Overview */}
            <div className="relative rounded-2xl overflow-hidden border-2 border-stone-200 dark:border-slate-800 shadow-sm bg-stone-50 dark:bg-slate-850">
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
              <div className="p-4 bg-white dark:bg-slate-800/80 border-t border-stone-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
                {/* Time Estimate */}
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-stone-500 dark:text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    Zeit:
                  </span>
                  <input
                    type="text"
                    value={draftRecipe.prepTime}
                    onChange={(e) => setDraftRecipe({ ...draftRecipe, prepTime: e.target.value })}
                    className="w-24 px-2 py-1 rounded-lg border border-stone-300 dark:border-slate-700 font-black text-stone-800 dark:text-white bg-white dark:bg-slate-800 text-center"
                  />
                </div>

                {/* Servings Counter */}
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-stone-500 dark:text-slate-400 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-blue-500" />
                    Portionen:
                  </span>
                  <div className="flex items-center gap-1 bg-stone-100 dark:bg-slate-700 p-0.5 rounded-xl border border-stone-200 dark:border-slate-600">
                    <button
                      type="button"
                      onClick={() => handleUpdateServings(-1)}
                      className="w-6 h-6 rounded-lg bg-white dark:bg-slate-800 font-black text-stone-700 dark:text-slate-200 hover:bg-stone-200 dark:hover:bg-slate-600 flex items-center justify-center text-xs"
                    >
                      -
                    </button>
                    <span className="font-black text-xs px-2 text-stone-900 dark:text-white">
                      {draftRecipe.servings}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleUpdateServings(1)}
                      className="w-6 h-6 rounded-lg bg-white dark:bg-slate-800 font-black text-stone-700 dark:text-slate-200 hover:bg-stone-200 dark:hover:bg-slate-600 flex items-center justify-center text-xs"
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
                    className="px-2 py-1 rounded-lg border border-stone-300 dark:border-slate-700 font-bold text-stone-700 dark:text-slate-200 text-xs bg-white dark:bg-slate-800"
                  >
                    <option value="quick">⚡ Schnelles Abendessen (unter 30m)</option>
                    <option value="comfort">🍲 Wohlfühlessen</option>
                    <option value="healthy">🥗 Frisch & Gesund</option>
                    <option value="baking">🥐 Backen & Süßes</option>
                    <option value="family-favorite">🌟 Familien-Favorit</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Ingredients Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-black text-stone-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <span>🛒 Erkannte Zutaten ({draftRecipe.ingredients.length})</span>
                </h5>
                <span className="text-[10px] text-stone-400 dark:text-slate-400 font-bold">
                  Automatisch nach Einkaufsregal sortiert
                </span>
              </div>

              {/* Ingredients List Table */}
              <div className="divide-y divide-stone-100 dark:divide-slate-800 border-2 border-stone-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
                {draftRecipe.ingredients.map((ing, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 sm:px-3.5 flex items-center justify-between gap-2 text-xs hover:bg-stone-50 dark:hover:bg-slate-800/60"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span
                        className={`text-[9px] uppercase font-black px-1.5 py-0.5 rounded-md shrink-0 ${
                          ing.category === 'produce'
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                            : ing.category === 'dairy'
                            ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                            : ing.category === 'meat'
                            ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                            : ing.category === 'bakery'
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                            : 'bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300'
                        }`}
                      >
                        {ing.category}
                      </span>
                      <span className="font-extrabold text-stone-800 dark:text-white truncate">{ing.name}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-bold text-stone-500 dark:text-slate-400 bg-stone-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-[11px]">
                        {ing.amount}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteIngredient(idx)}
                        className="text-stone-300 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 p-1 transition-colors"
                        title="Zutat entfernen"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Extra Ingredient Row */}
              <div className="p-2.5 bg-stone-50 dark:bg-slate-800/60 rounded-2xl border border-stone-200 dark:border-slate-700 flex flex-wrap items-center gap-2 text-xs">
                <input
                  type="text"
                  placeholder="Zutat (z. B. Knoblauch)..."
                  value={newIngName}
                  onChange={(e) => setNewIngName(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-stone-300 dark:border-slate-700 flex-1 min-w-[120px] focus:outline-none bg-white dark:bg-slate-800 text-stone-900 dark:text-white"
                />
                <input
                  type="text"
                  placeholder="Menge (z. B. 2 Zehen)..."
                  value={newIngAmount}
                  onChange={(e) => setNewIngAmount(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-stone-300 dark:border-slate-700 w-28 focus:outline-none bg-white dark:bg-slate-800 text-stone-900 dark:text-white"
                />
                <select
                  value={newIngCategory}
                  onChange={(e) => setNewIngCategory(e.target.value as GroceryCategory)}
                  className="px-2 py-1.5 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold text-stone-700 dark:text-slate-200"
                >
                  <option value="produce">Obst & Gemüse</option>
                  <option value="dairy">Kühlregal</option>
                  <option value="meat">Fleisch & Fisch</option>
                  <option value="bakery">Bäckerei</option>
                  <option value="pantry">Vorrat</option>
                </select>
                <button
                  type="button"
                  onClick={handleAddIngredient}
                  disabled={!newIngName.trim()}
                  className="duo-btn duo-btn-white px-3 py-1.5 text-xs font-black rounded-xl disabled:opacity-40"
                >
                  <Plus className="w-3.5 h-3.5 mr-0.5 inline" /> Hinzufügen
                </button>
              </div>
            </div>

            {/* Step-by-Step Instructions Preview */}
            {draftRecipe.instructions && draftRecipe.instructions.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-xs font-black text-stone-800 dark:text-slate-200 uppercase tracking-wider">
                  Zubereitung ({draftRecipe.instructions.length} Schritte)
                </h5>
                <div className="space-y-2">
                  {draftRecipe.instructions.map((step, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 p-2.5 bg-stone-50 dark:bg-slate-850 rounded-xl border border-stone-200 dark:border-slate-700 text-xs"
                    >
                      <span className="w-5 h-5 rounded-full bg-amber-400 text-stone-900 font-black flex items-center justify-center shrink-0 text-[11px]">
                        {idx + 1}
                      </span>
                      <p className="text-stone-700 dark:text-slate-200 font-medium leading-relaxed">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Bottom Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t-2 border-stone-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDraftRecipe(null)}
                className="duo-btn duo-btn-white px-4 py-2 text-xs font-black rounded-2xl w-full sm:w-auto"
              >
                ← Zurück zum Import
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => handleSaveToRecipeBox(false)}
                  className="duo-btn duo-btn-white px-4 py-2 text-xs font-black rounded-2xl flex-1 sm:flex-initial"
                >
                  💾 In Rezeptbox speichern
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveToRecipeBox(true)}
                  className="duo-btn duo-btn-green px-4 py-2 text-xs font-black rounded-2xl flex-1 sm:flex-initial"
                >
                  <ShoppingCart className="w-4 h-4 mr-1.5 inline stroke-[2.5]" />
                  Speichern & auf Einkaufsliste
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
                    : 'duo-btn-white text-stone-700 dark:text-slate-200'
                }`}
              >
                <LinkIcon className="w-5 h-5" />
                <span className="text-xs font-black">Web-Link</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('photo')}
                className={`duo-btn p-3 rounded-2xl flex flex-col items-center gap-1.5 transition-all ${
                  activeTab === 'photo'
                    ? 'duo-btn-purple'
                    : 'duo-btn-white text-stone-700 dark:text-slate-200'
                }`}
              >
                <Camera className="w-5 h-5" />
                <span className="text-xs font-black">Foto / Scan</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('describe')}
                className={`duo-btn p-3 rounded-2xl flex flex-col items-center gap-1.5 transition-all ${
                  activeTab === 'describe'
                    ? 'duo-btn-rose'
                    : 'duo-btn-white text-stone-700 dark:text-slate-200'
                }`}
              >
                <MessageSquareQuote className="w-5 h-5" />
                <span className="text-xs font-black">Beschreiben</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('manual')}
                className={`duo-btn p-3 rounded-2xl flex flex-col items-center gap-1.5 transition-all ${
                  activeTab === 'manual'
                    ? 'bg-stone-900 dark:bg-emerald-600 text-white'
                    : 'duo-btn-white text-stone-700 dark:text-slate-200'
                }`}
              >
                <Edit3 className="w-5 h-5" />
                <span className="text-xs font-black">Manuell</span>
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
                  <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-2xl border-2 border-emerald-200 dark:border-emerald-800 space-y-2.5">
                    <label className="block text-xs font-black text-emerald-950 dark:text-emerald-300 uppercase tracking-wider">
                      Rezept-Webadresse (URL)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="z. B. https://www.chefkoch.de/rezepte/... oder https://bbcgoodfood.com/..."
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        className="flex-1 px-3.5 py-2.5 rounded-xl border border-emerald-300 dark:border-emerald-700 text-xs sm:text-sm bg-white dark:bg-slate-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-400 font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => handleImportLink()}
                        disabled={!urlInput.trim()}
                        className="duo-btn duo-btn-green px-4 py-2 text-xs font-black rounded-xl disabled:opacity-50 shrink-0"
                      >
                        <Wand2 className="w-4 h-4 mr-1 inline stroke-[2.5]" />
                        Auslesen
                      </button>
                    </div>

                    {isRootDomain && (
                      <div className="p-3 bg-amber-50 dark:bg-amber-950/50 rounded-xl border-2 border-amber-300 dark:border-amber-700 text-amber-950 dark:text-amber-200 text-xs flex items-start gap-2 animate-in fade-in">
                        <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="block font-black text-amber-900 dark:text-amber-300">
                            Hauptseite erkannt ({trimmed})
                          </strong>
                          <span>
                            Du hast die Hauptseite des Portals eingegeben. Bitte füge einen Link zu einem konkreten Rezept ein (wie <em>https://www.chefkoch.de/rezepte/1279831233330574/Allgaeuer-Kaesspatzen.html</em>) oder wähle eines der geprüften Rezepte unten:
                          </span>
                        </div>
                      </div>
                    )}

                    <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 font-bold">
                      Funktioniert mit Chefkoch, BBC Good Food, NYT Cooking, Allrecipes und den meisten Food-Blogs.
                    </p>
                  </div>

                  {/* Quick-Paste Raw Recipe Text Box */}
                  <div className="p-3.5 bg-stone-50 dark:bg-slate-800/60 rounded-2xl border border-stone-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-stone-700 dark:text-slate-300">
                        📋 Oder Rezepttext / Zutaten direkt einfügen:
                      </span>
                      <span className="text-[10px] text-stone-400 dark:text-slate-500 font-bold">Kein Tippen nötig</span>
                    </div>
                    <textarea
                      rows={2}
                      placeholder="Zutaten oder Text von einer Website, WhatsApp oder Notiz hier einfügen..."
                      value={descriptionInput}
                      onChange={(e) => setDescriptionInput(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-stone-900 dark:text-white font-medium focus:outline-none"
                    />
                    {descriptionInput.trim() && (
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleImportDescription()}
                          className="duo-btn duo-btn-rose px-3.5 py-1.5 text-xs font-black rounded-xl"
                        >
                          <Wand2 className="w-3.5 h-3.5 mr-1 inline stroke-[2.5]" /> Eingefügten Text umwandeln
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 1-Tap Demo Links */}
                  <div>
                    <span className="block text-[11px] font-black text-stone-400 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Oder probiere ein geprüftes Live-Rezept:
                    </span>
                  <div className="space-y-2">
                    {DEMO_RECIPE_LINKS.map((demo) => (
                      <div
                        key={demo.id}
                        onClick={() => {
                          setUrlInput(demo.url);
                          handleImportLink(demo.url);
                        }}
                        className="cursor-pointer p-3 rounded-2xl border-2 border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 hover:bg-emerald-50/50 dark:hover:bg-slate-700 hover:border-emerald-300 dark:hover:border-emerald-600 transition-all flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">🍲</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <strong className="text-xs font-black text-stone-900 dark:text-white group-hover:text-emerald-900 dark:group-hover:text-emerald-300">
                                {demo.name}
                              </strong>
                              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-700 border border-stone-200 dark:border-slate-600 text-stone-600 dark:text-slate-300">
                                {demo.source}
                              </span>
                            </div>
                            <span className="text-[11px] text-stone-400 dark:text-slate-400 font-semibold truncate block max-w-xs sm:max-w-md">
                              {demo.url}
                            </span>
                          </div>
                        </div>

                        <button className="duo-btn duo-btn-white px-3 py-1.5 text-xs font-black rounded-xl group-hover:duo-btn-green">
                          <span>Importieren</span>
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
                <div className="p-4 bg-purple-50/60 dark:bg-purple-950/30 rounded-2xl border-2 border-purple-200 dark:border-purple-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black text-purple-950 dark:text-purple-300 uppercase tracking-wider">
                        Kochbuch-Seite oder handgeschriebene Karte scannen
                      </h4>
                      <p className="text-[11px] font-semibold text-purple-800/80 dark:text-purple-300/80">
                        Foto mit dem Smartphone aufnehmen oder Bilddatei hochladen
                      </p>
                    </div>
                  </div>

                  {/* File Upload / Camera Input */}
                  <label className="border-2 border-dashed border-purple-300 dark:border-purple-700 rounded-2xl p-4 bg-white dark:bg-slate-800 flex flex-col items-center justify-center cursor-pointer hover:bg-purple-50/40 dark:hover:bg-slate-700/50 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <UploadCloud className="w-8 h-8 text-purple-500 mb-1" />
                    <span className="text-xs font-black text-purple-900 dark:text-purple-300">
                      Foto aufnehmen oder Bild hochladen
                    </span>
                    <span className="text-[10px] text-stone-400 dark:text-slate-400 font-semibold mt-0.5">
                      JPG, PNG, WebP unterstützt
                    </span>
                  </label>

                  {selectedPhotoPreview && (
                    <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-purple-200 dark:border-purple-700 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={selectedPhotoPreview}
                          alt="Vorschau"
                          className="w-12 h-12 rounded-lg object-cover border"
                        />
                        <span className="text-xs font-black text-stone-800 dark:text-white">
                          Foto bereit zur Texterkennung
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleImportPhoto(undefined, selectedPhotoPreview)}
                        className="duo-btn duo-btn-purple px-4 py-2 text-xs font-black rounded-xl"
                      >
                        <Wand2 className="w-3.5 h-3.5 mr-1 inline" /> Scannen & Auslesen
                      </button>
                    </div>
                  )}
                </div>

                {/* 1-Tap Demo Scans */}
                <div>
                  <span className="block text-[11px] font-black text-stone-400 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Oder probiere eine gescannte Beispielkarte:
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
                        className="cursor-pointer p-3 rounded-2xl border-2 border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 hover:bg-purple-50/50 dark:hover:bg-slate-700 hover:border-purple-300 dark:hover:border-purple-600 transition-all flex items-center gap-3 group"
                      >
                        <img
                          src={scan.previewImage}
                          alt={scan.name}
                          className="w-14 h-14 rounded-xl object-cover border border-stone-200 dark:border-slate-700 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <strong className="text-xs font-black text-stone-900 dark:text-white group-hover:text-purple-900 dark:group-hover:text-purple-300 block truncate">
                            {scan.name}
                          </strong>
                          <span className="text-[11px] font-bold text-purple-700 dark:text-purple-400 flex items-center gap-1 mt-1">
                            <span>Karte scannen →</span>
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
                <div className="p-4 bg-rose-50/60 dark:bg-rose-950/30 rounded-2xl border-2 border-rose-200 dark:border-rose-800 space-y-2">
                  <label className="block text-xs font-black text-rose-950 dark:text-rose-300 uppercase tracking-wider">
                    Rezept frei beschreiben oder diktieren
                  </label>
                  <p className="text-[11px] font-semibold text-rose-800/80 dark:text-rose-300/80">
                    Nenne Zutaten, ungefähre Zeit oder Notizen. Famly erkennt Mengenangaben, Zubereitungsschritte und Einkaufslisten!
                  </p>
                  <textarea
                    rows={4}
                    placeholder="z. B. Omas Kartoffelsalat mit 1kg festkochenden Kartoffeln, 1 roten Zwiebel, 200ml heißer Brühe, 3 EL Essig, Öl, Salz, Pfeffer und Schnittlauch. Dauert 25 Minuten für 5 Personen..."
                    value={descriptionInput}
                    onChange={(e) => setDescriptionInput(e.target.value)}
                    className="w-full p-3 rounded-xl border border-rose-300 dark:border-rose-700 text-xs sm:text-sm bg-white dark:bg-slate-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-400 font-medium"
                  />
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => handleImportDescription()}
                      disabled={!descriptionInput.trim()}
                      className="duo-btn duo-btn-rose px-4 py-2 text-xs font-black rounded-xl disabled:opacity-50"
                    >
                      <Wand2 className="w-4 h-4 mr-1 inline stroke-[2.5]" />
                      In Rezept umwandeln
                    </button>
                  </div>
                </div>

                {/* 1-Tap Sample Prompts */}
                <div>
                  <span className="block text-[11px] font-black text-stone-400 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Klicken, um ein Beispiel auszuprobieren:
                  </span>
                  <div className="space-y-2">
                    {[
                      {
                        title: 'Schnelle 20-Minuten Thai Kokos-Nudeln',
                        desc: 'Thai Kokos-Nudelpfanne mit 300g Reisnudeln, 1 Dose Kokosmilch, 200g Brokkoli, 200g Tofu-Würfel, 1 Limette, Sojasauce und frischem Koriander. Fertig in 20 Minuten für 4 Personen.',
                      },
                      {
                        title: 'Omas Bayerischer Kartoffelsalat',
                        desc: 'Bayerischer warmer Kartoffelsalat mit 1kg festkochenden Kartoffeln, 1 gewürfelten roten Zwiebel, 250ml heißer Rinderbrühe, 3 EL weißem Essig, 4 EL Sonnenblumenöl, 1 EL Senf, Salz, Pfeffer und frischem Schnittlauch. Braucht 25 Minuten für 5 Personen.',
                      },
                      {
                        title: 'Samstags-Blaubeer-Pancakes',
                        desc: 'Fluffige Frühstücks-Pancakes mit 250g Mehl, 2 Eiern, 300ml Milch, 50g geschmolzener Butter, 1 TL Backpulver, 1 Tasse frischen Blaubeeren und Ahornsirup. Braucht 15 Minuten für 4 Personen.',
                      },
                    ].map((sample, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          setDescriptionInput(sample.desc);
                          handleImportDescription(sample.desc);
                        }}
                        className="cursor-pointer p-3 rounded-2xl border-2 border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 hover:bg-rose-50/50 dark:hover:bg-slate-700 hover:border-rose-300 dark:hover:border-rose-600 transition-all flex items-center justify-between group"
                      >
                        <div className="pr-3">
                          <strong className="text-xs font-black text-stone-900 dark:text-white group-hover:text-rose-900 dark:group-hover:text-rose-300 block">
                            {sample.title}
                          </strong>
                          <p className="text-[11px] text-stone-500 dark:text-slate-400 font-medium line-clamp-1 mt-0.5">
                            {sample.desc}
                          </p>
                        </div>
                        <button className="duo-btn duo-btn-white px-3 py-1.5 text-xs font-black rounded-xl group-hover:duo-btn-rose shrink-0">
                          Ausprobieren →
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
                    <label className="block text-xs font-extrabold text-stone-600 dark:text-slate-300 mb-1">
                      Rezepttitel *
                    </label>
                    <input
                      type="text"
                      placeholder="z. B. Omas Sonntagsbraten"
                      value={manualTitle}
                      onChange={(e) => setManualTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-xs focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-stone-600 dark:text-slate-300 mb-1">
                      Kategorie
                    </label>
                    <select
                      value={manualCategory}
                      onChange={(e) =>
                        setManualCategory(e.target.value as Recipe['category'])
                      }
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-stone-900 dark:text-white font-semibold"
                    >
                      <option value="quick">⚡ Schnelles Essen (unter 30m)</option>
                      <option value="comfort">🍲 Wohlfühlessen</option>
                      <option value="healthy">🥗 Frisch & Gesund</option>
                      <option value="baking">🥐 Backen & Süßes</option>
                      <option value="family-favorite">🌟 Familien-Favorit</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-extrabold text-stone-600 dark:text-slate-300 mb-1">
                      Gesamtzeit
                    </label>
                    <input
                      type="text"
                      placeholder="z. B. 30 Min."
                      value={manualPrepTime}
                      onChange={(e) => setManualPrepTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-stone-600 dark:text-slate-300 mb-1">
                      Portionen
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={manualServings}
                      onChange={(e) => setManualServings(parseInt(e.target.value, 10) || 4)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-stone-600 dark:text-slate-300 mb-1">
                    Zutaten (eine pro Zeile: Name, Menge, Kategorie)
                  </label>
                  <textarea
                    rows={4}
                    placeholder={"Kartoffeln, 1kg, produce\nMilch, 200ml, dairy\nButter, 50g, dairy\nMuskatnuss, 1 Prise, pantry"}
                    value={manualIngredientsText}
                    onChange={(e) => setManualIngredientsText(e.target.value)}
                    className="w-full p-3 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-xs font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-stone-600 dark:text-slate-300 mb-1">
                    Notizen oder Geheimtipps
                  </label>
                  <input
                    type="text"
                    placeholder="z. B. Vor dem Servieren extra Röstzwiebeln darüberstreuen"
                    value={manualNotes}
                    onChange={(e) => setManualNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-xs focus:outline-none"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="duo-btn duo-btn-green px-5 py-2.5 text-xs font-black rounded-xl"
                  >
                    Rezept prüfen & speichern →
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
    </ModalPortal>
  );
};
