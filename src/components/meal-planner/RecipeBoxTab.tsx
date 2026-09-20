import React, { useState } from 'react';
import { Recipe } from '../../types';
import { Search, Heart, Pencil, Trash2, Clock, ShoppingCart } from 'lucide-react';
import { getRecipePhoto } from './mealUtils';

interface RecipeBoxTabProps {
  recipes: Recipe[];
  onSelectRecipeForModal: (recipe: Recipe) => void;
  onEditRecipe: (recipe: Recipe) => void;
  onDeleteRecipe: (recipe: Recipe) => void;
  onToggleFavorite: (recipeId: string) => void;
  onSyncRecipe: (recipe: Recipe) => void;
  onOpenImportModal: () => void;
}

export const RecipeBoxTab: React.FC<RecipeBoxTabProps> = ({
  recipes,
  onSelectRecipeForModal,
  onEditRecipe,
  onDeleteRecipe,
  onToggleFavorite,
  onSyncRecipe,
  onOpenImportModal,
}) => {
  const [filter, setFilter] = useState<'all' | 'favorites' | 'quick' | 'comfort' | 'healthy' | 'baking'>('all');
  const [search, setSearch] = useState('');

  const favoritesCount = recipes.filter((r) => r.isFavorite).length;

  const filteredRecipes = recipes.filter((recipe) => {
    if (filter === 'favorites' && !recipe.isFavorite) return false;
    if (filter === 'quick' && recipe.category !== 'quick') return false;
    if (filter === 'comfort' && recipe.category !== 'comfort') return false;
    if (filter === 'healthy' && recipe.category !== 'healthy') return false;
    if (filter === 'baking' && recipe.category !== 'baking') return false;

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const inTitle = recipe.title.toLowerCase().includes(q);
      const inNotes = recipe.notes ? recipe.notes.toLowerCase().includes(q) : false;
      const inIngredients = recipe.ingredients.some((i) => i.name.toLowerCase().includes(q));
      if (!inTitle && !inNotes && !inIngredients) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Search & Category Filter Pills */}
      <div className="duo-card p-3 sm:p-4 bg-white dark:bg-slate-900 border-2 border-stone-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
          {[
            { id: 'all', label: `Alle (${recipes.length})`, icon: '✨' },
            { id: 'favorites', label: `Favoriten (${favoritesCount})`, icon: '❤️' },
            { id: 'quick', label: 'Schnell (<30m)', icon: '⚡' },
            { id: 'comfort', label: 'Hausmannskost', icon: '🍲' },
            { id: 'healthy', label: 'Gesund', icon: '🥗' },
            { id: 'baking', label: 'Backen', icon: '🥐' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 border whitespace-nowrap shrink-0 ${
                filter === tab.id
                  ? tab.id === 'favorites'
                    ? 'bg-rose-500 text-white border-rose-600 shadow-xs'
                    : 'bg-teal-600 text-white border-teal-700 shadow-xs'
                  : 'bg-stone-50 dark:bg-slate-800 text-stone-600 dark:text-slate-300 border-stone-200 dark:border-slate-700 hover:bg-stone-100 dark:hover:bg-slate-750'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Search Field */}
        <div className="relative min-w-[200px] w-full sm:w-auto">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Rezepte oder Zutaten..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:border-teal-500 text-stone-900 dark:text-white"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-600 font-bold"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Recipes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredRecipes.map((recipe) => (
          <div
            key={recipe.id}
            className="duo-card bg-white dark:bg-slate-900 border-2 border-stone-200 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow group relative"
          >
            <div>
              <div className="relative h-44 overflow-hidden bg-stone-100 dark:bg-slate-800">
                <img
                  src={getRecipePhoto(recipe)}
                  alt={recipe.title}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
                  }}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                <div className="absolute top-3 left-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-stone-800 dark:text-white shadow-xs capitalize">
                  {recipe.category}
                </div>

                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(recipe.id);
                    }}
                    className={`p-1.5 rounded-xl shadow-sm backdrop-blur-xs transition-all active:scale-95 ${
                      recipe.isFavorite
                        ? 'bg-rose-500 text-white hover:bg-rose-600'
                        : 'bg-white/90 dark:bg-slate-800/90 hover:bg-white text-stone-600 dark:text-slate-300 hover:text-rose-500'
                    }`}
                    title={recipe.isFavorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen ❤️'}
                  >
                    <Heart className={`w-3.5 h-3.5 ${recipe.isFavorite ? 'fill-white' : ''}`} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditRecipe(recipe);
                    }}
                    className="p-1.5 rounded-xl bg-white/90 dark:bg-slate-800/90 hover:bg-white text-stone-700 dark:text-slate-200 hover:text-teal-700 shadow-sm backdrop-blur-xs transition-all active:scale-95"
                    title="Rezept bearbeiten"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteRecipe(recipe);
                    }}
                    className="p-1.5 rounded-xl bg-white/90 dark:bg-slate-800/90 hover:bg-white text-stone-700 dark:text-slate-200 hover:text-rose-600 shadow-sm backdrop-blur-xs transition-all active:scale-95"
                    title="Rezept löschen"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-white flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-300" />
                  <span>{recipe.prepTime}</span>
                </div>
              </div>

              <div className="p-4 sm:p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-black text-stone-900 dark:text-white text-base leading-snug">
                    {recipe.title}
                  </h3>
                  {recipe.isFavorite && (
                    <span className="text-rose-500 text-xs shrink-0" title="Favorit">
                      ❤️
                    </span>
                  )}
                </div>
                {recipe.notes && (
                  <p className="text-xs text-stone-600 dark:text-slate-300 line-clamp-2">{recipe.notes}</p>
                )}

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {recipe.ingredients.slice(0, 4).map((ing, i) => (
                    <span
                      key={i}
                      className="text-[11px] bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300 px-2 py-0.5 rounded-md font-medium"
                    >
                      {ing.name}
                    </span>
                  ))}
                  {recipe.ingredients.length > 4 && (
                    <span className="text-[11px] bg-stone-100 dark:bg-slate-800 text-stone-400 dark:text-slate-500 px-1.5 py-0.5 rounded-md font-medium">
                      +{recipe.ingredients.length - 4} weitere
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="px-4 sm:px-5 py-3 bg-stone-50/70 dark:bg-slate-800/80 border-t border-stone-100 dark:border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onSelectRecipeForModal(recipe)}
                  className="text-xs font-bold text-stone-700 dark:text-slate-300 hover:text-stone-900 dark:hover:text-white underline"
                >
                  Details ({recipe.ingredients.length})
                </button>
                <button
                  type="button"
                  onClick={() => onEditRecipe(recipe)}
                  className="text-xs font-bold text-teal-700 dark:text-teal-300 hover:text-teal-900 flex items-center gap-1 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-teal-200 dark:border-teal-700 shadow-2xs"
                >
                  <Pencil className="w-3 h-3" />
                  <span>Bearbeiten</span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => onSyncRecipe(recipe)}
                className="duo-btn duo-btn-green px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Einkaufsliste</span>
              </button>
            </div>
          </div>
        ))}

        {filteredRecipes.length === 0 && (
          <div className="col-span-full p-12 text-center duo-card bg-white dark:bg-slate-900 border-2 border-dashed border-stone-200 dark:border-slate-800 rounded-3xl">
            <span className="text-4xl block mb-2">
              {filter === 'favorites' ? '❤️' : '🍳'}
            </span>
            <h4 className="text-base font-black text-stone-900 dark:text-white">
              {filter === 'favorites'
                ? 'Noch keine Lieblingsrezepte markiert'
                : 'Keine passenden Rezepte gefunden'}
            </h4>
            <p className="text-xs text-stone-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              {filter === 'favorites'
                ? 'Klicke auf das Herz-Symbol bei einem beliebigen Rezept, um es als Familien-Favoriten zu speichern!'
                : 'Passe die Filter oder den Suchbegriff an oder erstelle ein neues Rezept.'}
            </p>
            <div className="flex items-center justify-center gap-3 mt-4">
              {filter !== 'all' && (
                <button
                  type="button"
                  onClick={() => {
                    setFilter('all');
                    setSearch('');
                  }}
                  className="duo-btn duo-btn-white px-4 py-2 text-xs font-bold rounded-xl"
                >
                  Filter zurücksetzen
                </button>
              )}
              <button
                type="button"
                onClick={onOpenImportModal}
                className="duo-btn duo-btn-green px-4 py-2 text-xs font-black rounded-xl"
              >
                + Neues Rezept hinzufügen
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
