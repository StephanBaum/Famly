import React from 'react';
import { Recipe } from '../../types';
import { Clock, Users, ExternalLink, Heart, Pencil, Trash2, ShoppingCart } from 'lucide-react';
import { ModalPortal } from '../ModalPortal';
import { getRecipePhoto } from './mealUtils';

interface RecipeDetailModalProps {
  recipe: Recipe | null;
  onClose: () => void;
  onToggleFavorite: (recipeId: string) => void;
  onEditRecipe: (recipe: Recipe) => void;
  onDeleteRecipe: (recipe: Recipe) => void;
  onSyncRecipe: (recipe: Recipe) => void;
}

export const RecipeDetailModal: React.FC<RecipeDetailModalProps> = ({
  recipe,
  onClose,
  onToggleFavorite,
  onEditRecipe,
  onDeleteRecipe,
  onSyncRecipe,
}) => {
  if (!recipe) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-xl border-2 border-stone-200 dark:border-slate-800 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
          <div className="relative h-48 rounded-2xl overflow-hidden mb-4">
            <img
              src={getRecipePhoto(recipe)}
              alt={recipe.title}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
              }}
              className="w-full h-full object-cover"
            />
            <button
              onClick={onClose}
              className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200 capitalize">
                  {recipe.category}
                </span>
                <span className="text-xs text-stone-500 dark:text-slate-400 font-semibold flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-500" />
                  {recipe.prepTime}
                </span>
                <span className="text-xs text-stone-500 dark:text-slate-400 font-semibold flex items-center gap-1">
                  <Users className="w-3 h-3 text-blue-500" />
                  {recipe.servings} Portionen
                </span>
                {recipe.sourceUrl && (
                  <a
                    href={recipe.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-0.5 ml-auto"
                  >
                    <span>Original-Link</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <div className="flex items-start justify-between gap-3">
                <h3 className="text-xl font-black text-stone-900 dark:text-white leading-tight">
                  {recipe.title}
                </h3>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onToggleFavorite(recipe.id)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all active:scale-95 shadow-2xs ${
                      recipe.isFavorite
                        ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-700 text-rose-600 dark:text-rose-300'
                        : 'bg-stone-50 dark:bg-slate-800 border-stone-200 dark:border-slate-700 text-stone-600 dark:text-slate-300 hover:text-rose-500'
                    }`}
                    title={recipe.isFavorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen ❤️'}
                  >
                    <Heart
                      className={`w-3.5 h-3.5 ${
                        recipe.isFavorite ? 'fill-rose-500 text-rose-500' : ''
                      }`}
                    />
                    <span className="hidden sm:inline">
                      {recipe.isFavorite ? 'Favorit' : 'Merken'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onEditRecipe(recipe)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-700 text-xs font-bold transition-all active:scale-95 shadow-2xs"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Bearbeiten</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteRecipe(recipe)}
                    className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-700 transition-all active:scale-95 shadow-2xs"
                    title="Rezept löschen"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {recipe.tags && recipe.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {recipe.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="text-[10px] font-extrabold bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300 px-2 py-0.5 rounded-md border border-stone-200 dark:border-slate-700"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {recipe.notes && (
                <p className="text-xs text-stone-600 dark:text-slate-300 mt-2 bg-stone-50 dark:bg-slate-800/80 p-2.5 rounded-xl border border-stone-200 dark:border-slate-700 font-medium">
                  {recipe.notes}
                </p>
              )}
            </div>

            {/* Ingredients List */}
            <div>
              <h4 className="text-xs font-black text-stone-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Zutaten ({recipe.ingredients.length})
              </h4>
              <div className="divide-y divide-stone-100 dark:divide-slate-800 border border-stone-200 dark:border-slate-700 rounded-2xl overflow-hidden">
                {recipe.ingredients.map((ing, idx) => (
                  <div
                    key={idx}
                    className="px-3.5 py-2 flex items-center justify-between text-xs bg-stone-50/40 dark:bg-slate-800/60"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md ${
                          ing.category === 'produce'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                            : ing.category === 'dairy'
                            ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
                            : ing.category === 'meat'
                            ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                            : ing.category === 'bakery'
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                            : 'bg-stone-100 dark:bg-slate-700 text-stone-700 dark:text-slate-200'
                        }`}
                      >
                        {ing.category}
                      </span>
                      <span className="font-extrabold text-stone-800 dark:text-white">{ing.name}</span>
                    </div>
                    <span className="text-stone-500 dark:text-slate-400 font-bold bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-stone-200 dark:border-slate-700">
                      {ing.amount}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Instructions List (if present) */}
            {recipe.instructions && recipe.instructions.length > 0 && (
              <div>
                <h4 className="text-xs font-black text-stone-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Zubereitung ({recipe.instructions.length} Schritte)
                </h4>
                <div className="space-y-2">
                  {recipe.instructions.map((step, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 p-2.5 bg-stone-50 dark:bg-slate-800/70 rounded-xl border border-stone-200 dark:border-slate-700 text-xs"
                    >
                      <span className="w-5 h-5 rounded-full bg-amber-400 text-stone-900 font-black flex items-center justify-center shrink-0 text-[11px]">
                        {idx + 1}
                      </span>
                      <p className="text-stone-700 dark:text-slate-300 font-medium leading-relaxed">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between">
              <button
                onClick={() => {
                  onSyncRecipe(recipe);
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl duo-btn duo-btn-green text-xs font-black shadow-xs transition-colors"
              >
                <ShoppingCart className="w-4 h-4 stroke-[2.5]" />
                <span>Zutaten zur Einkaufsliste senden</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
