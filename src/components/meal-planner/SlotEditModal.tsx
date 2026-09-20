import React, { useState } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Recipe, FamilyMember } from '../../types';
import {
  Calendar,
  X,
  BookOpen,
  Search,
  Heart,
  Clock,
  Users,
  Plus,
  ShoppingCart,
  ChefHat,
  Trash2,
} from 'lucide-react';
import { ModalPortal } from '../ModalPortal';
import { getRecipePhoto, getCategoryBadge } from './mealUtils';

export interface EditingSlotState {
  date: string;
  slot: 'breakfast' | 'lunch' | 'dinner';
  currentTitle: string;
  currentRecipeId?: string;
  currentChefId?: string;
}

interface SlotEditModalProps {
  editingSlot: EditingSlotState | null;
  recipes: Recipe[];
  members: FamilyMember[];
  onClose: () => void;
  onSave: (
    date: string,
    slot: 'breakfast' | 'lunch' | 'dinner',
    data: { title: string; recipeId?: string; chefId?: string },
    oldRecipeId?: string
  ) => void;
  onClearSlot: (
    date: string,
    slot: 'breakfast' | 'lunch' | 'dinner',
    oldRecipeId?: string
  ) => void;
  onToggleFavorite: (recipeId: string) => void;
  onOpenImportModal: () => void;
  onSyncRecipeDirect: (recipe: Recipe, targetDate: string) => void;
}

const CUSTOM_DISH_SUGGESTIONS = [
  { title: '🍽️ Auswärts essen / Restaurant', icon: '🍷', isRestaurant: true },
  { title: '🥡 Reste vom Vortag', icon: '🥡', isLeftovers: true },
  { title: 'Pizza vom Vortag & Salat', icon: '🍕' },
  { title: 'Asiatisch / Nudeln to-go', icon: '🍜' },
  { title: 'Warme Paninis & Suppe', icon: '🥪' },
  { title: 'Frischer bunter Familiensalat', icon: '🥗' },
  { title: 'Pasta mit Knoblauch & Olivenöl', icon: '🍝' },
  { title: 'Selbstgemachte Freitag-Burger', icon: '🍔' },
];

export const SlotEditModal: React.FC<SlotEditModalProps> = ({
  editingSlot,
  recipes,
  members,
  onClose,
  onSave,
  onClearSlot,
  onToggleFavorite,
  onOpenImportModal,
  onSyncRecipeDirect,
}) => {
  if (!editingSlot) return null;

  const [initialRecipeId] = useState<string | undefined>(editingSlot.currentRecipeId);
  const [slotPickerTab, setSlotPickerTab] = useState<'box' | 'custom'>(() =>
    editingSlot.currentRecipeId ? 'box' : 'box'
  );
  const [slotCategoryFilter, setSlotCategoryFilter] = useState<string>('all');
  const [slotSearchQuery, setSlotSearchQuery] = useState<string>('');

  const [title, setTitle] = useState(editingSlot.currentTitle);
  const [recipeId, setRecipeId] = useState<string | undefined>(editingSlot.currentRecipeId);
  const [chefId, setChefId] = useState<string | undefined>(editingSlot.currentChefId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave(
      editingSlot.date,
      editingSlot.slot,
      {
        title: title.trim(),
        recipeId: recipeId || undefined,
        chefId: chefId || undefined,
      },
      initialRecipeId
    );
  };

  const handleSelectQuickSuggestion = (item: (typeof CUSTOM_DISH_SUGGESTIONS)[number]) => {
    setTitle(item.title);
    setRecipeId(undefined);
  };

  const handleClear = () => {
    onClearSlot(editingSlot.date, editingSlot.slot, initialRecipeId);
    onClose();
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl border-2 border-stone-200 dark:border-slate-800 animate-in fade-in zoom-in-95 max-h-[92vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-stone-100 dark:border-slate-800 pb-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg ${
                  editingSlot.slot === 'breakfast'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-200'
                    : editingSlot.slot === 'lunch'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-200'
                    : 'bg-teal-100 text-teal-800 dark:bg-teal-950/80 dark:text-teal-200'
                }`}
              >
                {editingSlot.slot === 'breakfast' ? '🥐' : editingSlot.slot === 'lunch' ? '🥗' : '🍲'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                      editingSlot.slot === 'breakfast'
                        ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300'
                        : editingSlot.slot === 'lunch'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950 dark:text-teal-300'
                    }`}
                  >
                    {editingSlot.slot === 'breakfast' ? 'Frühstück' : editingSlot.slot === 'lunch' ? 'Mittagessen' : 'Abendessen'}
                  </span>
                  <span className="text-xs text-stone-500 dark:text-slate-400 font-semibold flex items-center gap-1 capitalize">
                    <Calendar className="w-3 h-3 text-stone-400" />
                    {format(new Date(editingSlot.date), 'EEEE, d. MMMM', { locale: de })}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-stone-900 dark:text-white leading-tight mt-0.5">
                  Was gibt es zu essen?
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

          {/* Mode Switcher Tabs */}
          <div className="flex items-center bg-stone-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-stone-200/80 dark:border-slate-700 my-3 shrink-0">
            <button
              type="button"
              onClick={() => setSlotPickerTab('box')}
              className={`flex-1 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all ${
                slotPickerTab === 'box'
                  ? 'bg-white dark:bg-slate-700 text-teal-800 dark:text-teal-200 shadow-xs border border-stone-200 dark:border-slate-600'
                  : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4 text-teal-600" />
              <span>Aus Rezeptbox wählen ({recipes.length})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSlotPickerTab('custom');
                setRecipeId(undefined);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all ${
                slotPickerTab === 'custom'
                  ? 'bg-white dark:bg-slate-700 text-teal-800 dark:text-teal-200 shadow-xs border border-stone-200 dark:border-slate-600'
                  : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <span>✏️ Eigenes Gericht / Auswärts</span>
            </button>
          </div>

          {/* Main Form Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pr-1 flex flex-col justify-between">
            <div className="space-y-4">
              {/* TAB 1: VISUAL RECIPE BOX PICKER */}
              {slotPickerTab === 'box' ? (
                <div className="space-y-3">
                  {/* Search and Category Filter Pills */}
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={slotSearchQuery}
                        onChange={(e) => setSlotSearchQuery(e.target.value)}
                        placeholder="Rezepttitel, Kategorie oder Zutaten suchen..."
                        className="w-full pl-9 pr-8 py-2 rounded-xl border border-stone-200 dark:border-slate-700 text-xs font-semibold focus:outline-none bg-stone-50/60 dark:bg-slate-800 text-stone-900 dark:text-white"
                      />
                      {slotSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setSlotSearchQuery('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Category Pills */}
                    <div className="flex items-center gap-1.5 flex-wrap pb-1 text-xs">
                      {[
                        { id: 'all', label: `Alle (${recipes.length})`, icon: '✨' },
                        { id: 'favorites', label: `Favoriten (${recipes.filter((r) => r.isFavorite).length})`, icon: '❤️' },
                        { id: 'quick', label: 'Schnell (<30m)', icon: '⚡' },
                        { id: 'comfort', label: 'Hausmannskost', icon: '🍲' },
                        { id: 'healthy', label: 'Gesund', icon: '🥗' },
                        { id: 'baking', label: 'Backen', icon: '🥐' },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setSlotCategoryFilter(tab.id)}
                          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap text-xs transition-all flex items-center gap-1.5 border ${
                            slotCategoryFilter === tab.id
                              ? tab.id === 'favorites'
                                ? 'bg-rose-500 text-white border-rose-600 shadow-xs'
                                : 'bg-teal-600 text-white border-teal-700 shadow-xs'
                              : 'bg-white dark:bg-slate-800 text-stone-600 dark:text-slate-300 border-stone-200 dark:border-slate-700 hover:bg-stone-100'
                          }`}
                        >
                          <span>{tab.icon}</span>
                          <span>{tab.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Visual Grid of Recipes */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[280px] overflow-y-auto p-1.5 border border-stone-200/90 dark:border-slate-700 rounded-2xl bg-stone-50/50 dark:bg-slate-800/40">
                    {recipes
                      .filter((r) => {
                        const matchesCat =
                          slotCategoryFilter === 'all'
                            ? true
                            : slotCategoryFilter === 'favorites'
                            ? Boolean(r.isFavorite)
                            : slotCategoryFilter === 'quick'
                            ? r.category === 'quick' || parseInt(r.prepTime || '30', 10) <= 25
                            : r.category === slotCategoryFilter;

                        const q = slotSearchQuery.toLowerCase().trim();
                        const matchesSearch =
                          !q ||
                          r.title.toLowerCase().includes(q) ||
                          (r.notes && r.notes.toLowerCase().includes(q)) ||
                          r.ingredients.some((ing) => ing.name.toLowerCase().includes(q));

                        return matchesCat && matchesSearch;
                      })
                      .map((r) => {
                        const isSelected = recipeId === r.id;
                        const cat = getCategoryBadge(r.category);
                        const photo = getRecipePhoto(r);
                        return (
                          <div
                            key={r.id}
                            onClick={() => {
                              setTitle(r.title);
                              setRecipeId(r.id);
                            }}
                            className={`group cursor-pointer text-left rounded-2xl border-2 transition-all overflow-hidden flex flex-col relative ${
                              isSelected
                                ? 'bg-teal-50/90 dark:bg-teal-950/60 border-teal-500 shadow-md ring-2 ring-teal-400/50 border-b-4 border-b-teal-600 scale-[1.01]'
                                : 'bg-white dark:bg-slate-900 border-stone-200 dark:border-slate-800 hover:border-teal-300 hover:shadow-md border-b-4 hover:-translate-y-0.5'
                            }`}
                          >
                            <div className="relative h-28 w-full overflow-hidden bg-stone-200 dark:bg-slate-800">
                              <img
                                src={photo}
                                alt={r.title}
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src =
                                    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
                                }}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                              <div className="absolute top-2 left-2">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shadow-xs backdrop-blur-xs flex items-center gap-1 ${cat.bg}`}
                                >
                                  <span>{cat.icon}</span>
                                  <span>{cat.label}</span>
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleFavorite(r.id);
                                }}
                                className={`absolute top-2 right-2 z-10 p-1.5 rounded-xl backdrop-blur-xs transition-all ${
                                  r.isFavorite
                                    ? 'bg-rose-500 text-white shadow-xs'
                                    : 'bg-black/50 hover:bg-black/70 text-white/80 hover:text-white'
                                }`}
                                title={r.isFavorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen ❤️'}
                              >
                                <Heart className={`w-3 h-3 ${r.isFavorite ? 'fill-white' : ''}`} />
                              </button>

                              <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between text-[10px] text-white font-bold">
                                <span className="flex items-center gap-1 bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded-full">
                                  <Clock className="w-2.5 h-2.5 text-teal-300" />
                                  {r.prepTime}
                                </span>
                                <span className="flex items-center gap-1 bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded-full">
                                  <Users className="w-2.5 h-2.5 text-amber-300" />
                                  {r.servings}P
                                </span>
                              </div>
                            </div>

                            <div className="p-2.5 flex-1 flex flex-col justify-between">
                              <div>
                                <h4 className="font-bold text-xs text-stone-900 dark:text-white line-clamp-2 leading-snug group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors">
                                  {r.title}
                                </h4>
                                <p className="text-[10px] text-stone-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                                  <span>🥕</span>
                                  <span>{r.ingredients.length} Zutaten</span>
                                </p>
                              </div>
                              {isSelected && (
                                <div className="mt-2 pt-1.5 border-t border-teal-200 dark:border-teal-800 flex items-center justify-between text-[10px] font-black text-teal-700 dark:text-teal-300">
                                  <span>Bereit zum Eintragen</span>
                                  <span>✓</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}

                    <button
                      type="button"
                      onClick={onOpenImportModal}
                      className="min-h-[140px] rounded-2xl border-2 border-dashed border-teal-300 dark:border-teal-700 hover:border-teal-500 bg-teal-50/40 dark:bg-teal-950/20 hover:bg-teal-50/80 p-4 flex flex-col items-center justify-center text-center transition-all group border-b-4"
                    >
                      <div className="w-10 h-10 rounded-2xl bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <Plus className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-teal-900 dark:text-teal-200">Rezept importieren</span>
                      <span className="text-[10px] text-teal-600 dark:text-teal-400 mt-0.5">Link, Foto oder Text</span>
                    </button>
                  </div>

                  {/* Spotlight on selected recipe */}
                  {(() => {
                    const sel = recipes.find((r) => r.id === recipeId);
                    if (!sel) return null;
                    return (
                      <div className="p-3 bg-gradient-to-r from-teal-50/90 to-emerald-50/80 dark:from-slate-800 dark:to-slate-800 border-2 border-teal-200 dark:border-teal-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs animate-in fade-in">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <img
                            src={getRecipePhoto(sel)}
                            alt={sel.title}
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
                            }}
                            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover shadow-2xs border border-teal-200 dark:border-teal-700 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] uppercase font-black text-teal-700 dark:text-teal-300 tracking-wider">
                              Ausgewählt:
                            </span>
                            <h4 className="text-sm font-black text-stone-900 dark:text-white truncate mt-0.5">
                              {sel.title}
                            </h4>
                            <p className="text-[10px] text-stone-500 dark:text-slate-400 font-medium">
                              ⏱️ {sel.prepTime} • 🏷️ ~{(sel.estimatedCost || 12).toFixed(0)} €
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => onSyncRecipeDirect(sel, editingSlot.date)}
                          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl duo-btn duo-btn-green text-xs font-bold w-full sm:w-auto justify-center"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>Zutaten zur Liste</span>
                        </button>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                /* TAB 2: CUSTOM DISH / SPONTANEOUS / OUT EATING */
                <div className="space-y-3 bg-stone-50/80 dark:bg-slate-800/80 p-4 rounded-2xl border border-stone-200 dark:border-slate-700">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-slate-300 uppercase mb-1">
                      Gerichtsname oder Idee
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => {
                        setTitle(e.target.value);
                        setRecipeId(undefined);
                      }}
                      placeholder="z.B. Lasagne-Reste, Freitagspizza, Paninis"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-slate-700 text-sm font-semibold focus:outline-none bg-white dark:bg-slate-900 text-stone-900 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <span className="block text-[11px] font-bold text-stone-500 dark:text-slate-400 uppercase mb-1.5">
                      Spontane Aktionen & Familien-Vorschläge
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {CUSTOM_DISH_SUGGESTIONS.map((s, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectQuickSuggestion(s)}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-black flex items-center gap-1.5 transition-all active:scale-95 ${
                            s.isRestaurant
                              ? 'bg-purple-100 dark:bg-purple-950/70 border-purple-300 dark:border-purple-700 text-purple-900 dark:text-purple-200 hover:bg-purple-200'
                              : s.isLeftovers
                              ? 'bg-amber-100 dark:bg-amber-950/70 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 hover:bg-amber-200'
                              : 'bg-white dark:bg-slate-900 border-stone-200 dark:border-slate-700 hover:border-teal-400 hover:bg-teal-50/50 text-stone-700 dark:text-slate-200'
                          }`}
                        >
                          <span>{s.icon}</span>
                          <span>{s.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Chef assignment */}
              <div className="pt-2 border-t border-stone-100 dark:border-slate-800">
                <label className="block text-xs font-bold text-stone-600 dark:text-slate-300 uppercase mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ChefHat className="w-4 h-4 text-amber-500" />
                    <span>Chefkoch / Kochdienst zuweisen</span>
                  </span>
                  {chefId && (
                    <button
                      type="button"
                      onClick={() => setChefId(undefined)}
                      className="text-[11px] text-stone-400 hover:text-stone-600 underline font-semibold"
                    >
                      Koch zurücksetzen
                    </button>
                  )}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {members.map((m) => {
                    const isChef = chefId === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setChefId(isChef ? undefined : m.id)}
                        className={`p-2 rounded-2xl flex items-center gap-2 border-2 transition-all text-left ${
                          isChef
                            ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-400 dark:border-amber-700 shadow-xs ring-2 ring-amber-300/60 border-b-4 translate-y-[-1px]'
                            : 'bg-white dark:bg-slate-900 border-stone-200 dark:border-slate-800 hover:border-stone-300 hover:bg-stone-50 border-b-2'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-slate-800 flex items-center justify-center text-base shrink-0 shadow-2xs">
                          {m.avatar}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="block text-xs font-bold text-stone-800 dark:text-white truncate">{m.name}</span>
                          <span className="text-[10px] text-stone-500 dark:text-slate-400 block truncate">
                            {isChef ? '👨‍🍳 Chefkoch' : 'Helfer'}
                          </span>
                        </div>
                        {isChef && (
                          <span className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer actions */}
            <div className="flex items-center justify-between pt-3 border-t border-stone-100 dark:border-slate-800 mt-3 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="duo-btn duo-btn-white px-3.5 py-2 text-xs font-bold rounded-xl"
                >
                  Abbrechen
                </button>
                {title && (
                  <button
                    type="button"
                    onClick={handleClear}
                    title="Mahlzeit für diesen Tag entfernen und Zutaten von der Einkaufsliste löschen"
                    className="px-3 py-2 text-xs font-bold rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Mahlzeit leeren</span>
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={!title.trim()}
                className="duo-btn duo-btn-green px-6 py-2.5 text-xs font-black rounded-xl disabled:opacity-50"
              >
                <span>Speichern</span>
                <span className="ml-1">✨</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
};
