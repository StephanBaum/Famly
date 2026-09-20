import React, { useState, useEffect } from 'react';
import { Recipe, Ingredient } from '../types';
import { ModalPortal } from './ModalPortal';
import {
  X,
  Trash2,
  Save,
  Clock,
  Users,
  Image as ImageIcon,
  Tag,
  AlertTriangle,
} from 'lucide-react';

interface RecipeEditModalProps {
  recipe: Recipe | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: Recipe) => void;
  onDelete?: (recipeId: string) => void;
}

const FOOD_PHOTO_PRESETS = [
  { label: 'Pasta & Nudeln', url: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281057?auto=format&fit=crop&w=800&q=80' },
  { label: 'Pizza & Flammkuchen', url: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=800&q=80' },
  { label: 'Curry & Asia-Pfanne', url: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=800&q=80' },
  { label: 'Lachs & Fisch', url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80' },
  { label: 'Knusprige Tacos', url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80' },
  { label: 'Auflauf & Herzhaftes', url: 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?auto=format&fit=crop&w=800&q=80' },
  { label: 'Pfannkuchen & Waffeln', url: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=800&q=80' },
  { label: 'Allgäuer Kässpatzen', url: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=800&q=80' },
];

export const RecipeEditModal: React.FC<RecipeEditModalProps> = ({
  recipe,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  if (!isOpen || !recipe) return null;

  const [title, setTitle] = useState(recipe.title);
  const [prepTime, setPrepTime] = useState(recipe.prepTime);
  const [servings, setServings] = useState(recipe.servings || 4);
  const [category, setCategory] = useState<Recipe['category']>(recipe.category || 'family-favorite');
  const [imageUrl, setImageUrl] = useState(recipe.imageUrl || '');
  const [notes, setNotes] = useState(recipe.notes || '');
  const [tags, setTags] = useState<string[]>(recipe.tags || []);
  const [newTag, setNewTag] = useState('');

  const [ingredients, setIngredients] = useState<Ingredient[]>(recipe.ingredients || []);
  const [newIngName, setNewIngName] = useState('');
  const [newIngAmount, setNewIngAmount] = useState('');
  const [newIngCategory, setNewIngCategory] = useState<Ingredient['category']>('produce');

  const [instructions, setInstructions] = useState<string[]>(recipe.instructions || []);
  const [newStepText, setNewStepText] = useState('');

  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  // Sync state when incoming recipe changes
  useEffect(() => {
    if (recipe) {
      setTitle(recipe.title);
      setPrepTime(recipe.prepTime);
      setServings(recipe.servings || 4);
      setCategory(recipe.category || 'family-favorite');
      setImageUrl(recipe.imageUrl || '');
      setNotes(recipe.notes || '');
      setTags(recipe.tags || []);
      setIngredients(recipe.ingredients || []);
      setInstructions(recipe.instructions || []);
      setIsConfirmingDelete(false);
    }
  }, [recipe]);

  const handleAddIngredient = () => {
    if (!newIngName.trim()) return;
    setIngredients([
      ...ingredients,
      {
        name: newIngName.trim(),
        amount: newIngAmount.trim() || 'as needed',
        category: newIngCategory,
      },
    ]);
    setNewIngName('');
    setNewIngAmount('');
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleUpdateIngredient = (index: number, field: keyof Ingredient, value: string) => {
    setIngredients(
      ingredients.map((ing, i) => (i === index ? { ...ing, [field]: value } : ing))
    );
  };

  const handleAddStep = () => {
    if (!newStepText.trim()) return;
    setInstructions([...instructions, newStepText.trim()]);
    setNewStepText('');
  };

  const handleRemoveStep = (index: number) => {
    setInstructions(instructions.filter((_, i) => i !== index));
  };

  const handleUpdateStep = (index: number, text: string) => {
    setInstructions(instructions.map((step, i) => (i === index ? text : step)));
  };

  const handleAddTag = () => {
    const clean = newTag.trim().replace(/^#/, '');
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
    }
    setNewTag('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      ...recipe,
      title: title.trim(),
      prepTime: prepTime.trim() || '25 mins',
      servings: Math.max(1, servings),
      category,
      imageUrl:
        imageUrl.trim() ||
        recipe.imageUrl ||
        'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=800&q=80',
      notes: notes.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
      ingredients,
      instructions: instructions.length > 0 ? instructions : undefined,
    });
    onClose();
  };

  if (!isOpen || !recipe) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl border-2 border-stone-200 dark:border-slate-800 animate-in fade-in zoom-in-95 max-h-[92vh] flex flex-col my-auto text-stone-900 dark:text-slate-100 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 pb-3 border-b border-stone-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-400 flex items-center justify-center font-black text-lg shadow-xs">
              ✏️
            </div>
            <div>
              <h3 className="text-lg font-black text-stone-900 dark:text-white leading-tight">Rezept bearbeiten</h3>
              <p className="text-xs text-stone-500 dark:text-slate-400 font-medium">
                Zutaten, Zubereitungsschritte, Kochzeit oder Foto anpassen
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-2xl bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 text-stone-500 dark:text-slate-400 flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto scrollbar-thin space-y-5 p-4 sm:p-6 pt-4">
          
          {/* Cover Photo Preview & Selector */}
          <div className="space-y-2">
            <div className="relative h-36 sm:h-44 rounded-2xl overflow-hidden bg-stone-100 dark:bg-slate-800 border-2 border-stone-200 dark:border-slate-700 group">
              <img
                src={imageUrl || 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=800&q=80'}
                alt={title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end justify-between p-3.5 text-white">
                <span className="text-xs font-bold bg-black/50 backdrop-blur-xs px-2.5 py-1 rounded-xl">
                  {category.toUpperCase()}
                </span>
                <button
                  type="button"
                  onClick={() => setShowPhotoPicker(!showPhotoPicker)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 text-stone-900 dark:text-white text-xs font-bold shadow-md transition-all active:scale-95"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span>{showPhotoPicker ? 'Galerie schließen' : 'Foto ändern'}</span>
                </button>
              </div>
            </div>

            {/* Photo Preset Gallery (Expandable) */}
            {showPhotoPicker && (
              <div className="p-3 bg-stone-50 dark:bg-slate-800/80 rounded-2xl border border-stone-200 dark:border-slate-700 space-y-2 animate-in fade-in">
                <span className="block text-[11px] font-bold text-stone-600 dark:text-slate-300 uppercase">
                  Foto-Vorlage auswählen:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {FOOD_PHOTO_PRESETS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setImageUrl(p.url);
                        setShowPhotoPicker(false);
                      }}
                      className="group/p text-left rounded-xl overflow-hidden border border-stone-200 dark:border-slate-700 hover:border-teal-400 relative"
                    >
                      <img src={p.url} alt={p.label} className="w-full h-16 object-cover group-hover/p:scale-105 transition-transform" />
                      <span className="block text-[10px] font-bold text-stone-800 dark:text-slate-200 p-1 truncate bg-white dark:bg-slate-800">
                        {p.label}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="pt-1">
                  <label className="block text-[10px] font-bold text-stone-500 dark:text-slate-400 uppercase mb-1">
                    Oder Bild-URL einfügen:
                  </label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-2.5 py-1.5 rounded-xl border border-stone-300 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-slate-800 text-stone-900 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-black text-stone-700 dark:text-slate-300 uppercase mb-1">
              Rezepttitel *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z. B. Cremige Zitronen-Pasta"
              className="w-full px-3.5 py-2.5 rounded-2xl border-2 border-stone-300 dark:border-slate-700 font-black text-base text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-slate-800"
              required
            />
          </div>

          {/* Metrics (Prep Time, Servings, Category) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-stone-50/80 dark:bg-slate-800/60 rounded-2xl border border-stone-200 dark:border-slate-700">
            {/* Prep Time */}
            <div>
              <label className="block text-[11px] font-bold text-stone-600 dark:text-slate-400 uppercase mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-500" />
                <span>Zubereitungszeit</span>
              </label>
              <input
                type="text"
                value={prepTime}
                onChange={(e) => setPrepTime(e.target.value)}
                placeholder="25 Min."
                className="w-full px-3 py-1.5 rounded-xl border border-stone-300 dark:border-slate-700 font-bold text-xs bg-white dark:bg-slate-800 text-stone-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            {/* Servings Counter */}
            <div>
              <label className="block text-[11px] font-bold text-stone-600 dark:text-slate-400 uppercase mb-1 flex items-center gap-1">
                <Users className="w-3 h-3 text-blue-500" />
                <span>Portionen</span>
              </label>
              <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-2 py-1 rounded-xl border border-stone-300 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setServings((s) => Math.max(1, s - 1))}
                  className="w-6 h-6 rounded-lg bg-stone-100 dark:bg-slate-700 hover:bg-stone-200 dark:hover:bg-slate-600 font-black text-stone-700 dark:text-white text-xs"
                >
                  -
                </button>
                <span className="font-black text-xs text-stone-900 dark:text-white flex-1 text-center">
                  {servings} {servings === 1 ? 'Portion' : 'Portionen'}
                </span>
                <button
                  type="button"
                  onClick={() => setServings((s) => s + 1)}
                  className="w-6 h-6 rounded-lg bg-stone-100 dark:bg-slate-700 hover:bg-stone-200 dark:hover:bg-slate-600 font-black text-stone-700 dark:text-white text-xs"
                >
                  +
                </button>
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-[11px] font-bold text-stone-600 dark:text-slate-400 uppercase mb-1">
                Kategorie
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Recipe['category'])}
                className="w-full px-2.5 py-1.5 rounded-xl border border-stone-300 dark:border-slate-700 font-bold text-xs bg-white dark:bg-slate-800 text-stone-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="quick">⚡ Schnelles Abendessen</option>
                <option value="comfort">🍲 Wohlfühlessen</option>
                <option value="healthy">🥗 Frisch & Gesund</option>
                <option value="baking">🥐 Backen & Brunch</option>
                <option value="family-favorite">🌟 Familien-Favorit</option>
              </select>
            </div>
          </div>

          {/* Notes & Family Tips */}
          <div>
            <label className="block text-xs font-black text-stone-700 dark:text-slate-300 uppercase mb-1">
              Familien-Notizen & Koch-Tipps
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="z. B. Omas Geheimtipp: Butter zuerst leicht anbräunen. Leo mag es mit weniger Pfeffer."
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 text-xs font-medium text-stone-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-slate-800"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-black text-stone-700 dark:text-slate-300 uppercase mb-1 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-stone-400" />
              <span>Schlagwörter / Tags</span>
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((t, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-xs font-bold text-stone-700 dark:text-slate-200"
                >
                  <span>#{t}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="text-stone-400 hover:text-stone-700 dark:hover:text-white font-black ml-0.5"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Tag hinzufügen (z. B. Unter 30 Min, Pasta, Leos Wunsch)..."
                className="flex-1 px-3 py-1.5 rounded-xl border border-stone-300 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-slate-800 text-stone-900 dark:text-white"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-200 text-xs font-bold transition-colors"
              >
                + Tag
              </button>
            </div>
          </div>

          {/* Ingredients Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-black text-stone-800 dark:text-slate-200 uppercase tracking-wider">
                🛒 Zutaten ({ingredients.length})
              </label>
              <span className="text-[10px] text-stone-400 dark:text-slate-400 font-bold">
                Wird auf Einkaufslisten aufgeteilt
              </span>
            </div>

            <div className="divide-y divide-stone-100 dark:divide-slate-800 border-2 border-stone-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 max-h-56 overflow-y-auto">
              {ingredients.map((ing, idx) => (
                <div
                  key={idx}
                  className="p-2 sm:px-3 flex items-center justify-between gap-2 text-xs hover:bg-stone-50 dark:hover:bg-slate-800/60"
                >
                  <input
                    type="text"
                    value={ing.name}
                    onChange={(e) => handleUpdateIngredient(idx, 'name', e.target.value)}
                    className="flex-1 font-bold text-stone-800 dark:text-white border-b border-transparent hover:border-stone-300 dark:hover:border-slate-600 focus:border-teal-500 focus:outline-none px-1 py-0.5 bg-transparent"
                  />
                  <input
                    type="text"
                    value={ing.amount}
                    onChange={(e) => handleUpdateIngredient(idx, 'amount', e.target.value)}
                    className="w-24 text-right font-medium text-stone-600 dark:text-slate-300 border-b border-transparent hover:border-stone-300 dark:hover:border-slate-600 focus:border-teal-500 focus:outline-none px-1 py-0.5 bg-transparent"
                  />
                  <select
                    value={ing.category}
                    onChange={(e) => handleUpdateIngredient(idx, 'category', e.target.value)}
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-md border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 text-stone-600 dark:text-slate-300"
                  >
                    <option value="produce">Obst & Gemüse</option>
                    <option value="dairy">Kühlregal</option>
                    <option value="meat">Fleisch & Fisch</option>
                    <option value="pantry">Vorrat</option>
                    <option value="bakery">Bäckerei</option>
                    <option value="frozen">Tiefkühl</option>
                    <option value="household">Haushalt</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => handleRemoveIngredient(idx)}
                    className="text-stone-400 hover:text-rose-600 p-1"
                    title="Zutat entfernen"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Ingredient Row */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 pt-1">
              <input
                type="text"
                value={newIngName}
                onChange={(e) => setNewIngName(e.target.value)}
                placeholder="Neue Zutat (z. B. Geriebener Parmesan)..."
                className="flex-1 px-3 py-1.5 rounded-xl border border-stone-300 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-slate-800 text-stone-900 dark:text-white"
              />
              <input
                type="text"
                value={newIngAmount}
                onChange={(e) => setNewIngAmount(e.target.value)}
                placeholder="Menge (z. B. 50g)"
                className="w-28 px-3 py-1.5 rounded-xl border border-stone-300 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-slate-800 text-stone-900 dark:text-white"
              />
              <select
                value={newIngCategory}
                onChange={(e) => setNewIngCategory(e.target.value as Ingredient['category'])}
                className="px-2 py-1.5 rounded-xl border border-stone-300 dark:border-slate-700 text-xs font-bold bg-white dark:bg-slate-800 text-stone-700 dark:text-slate-200"
              >
                <option value="produce">Obst & Gemüse</option>
                <option value="dairy">Kühlregal</option>
                <option value="meat">Fleisch & Fisch</option>
                <option value="pantry">Vorrat</option>
                <option value="bakery">Bäckerei</option>
                <option value="frozen">Tiefkühl</option>
                <option value="household">Haushalt</option>
              </select>
              <button
                type="button"
                onClick={handleAddIngredient}
                className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors shrink-0"
              >
                + Hinzufügen
              </button>
            </div>
          </div>

          {/* Instructions Section */}
          <div className="space-y-2">
            <label className="block text-xs font-black text-stone-800 dark:text-slate-200 uppercase tracking-wider">
              👩‍🍳 Zubereitungsschritte ({instructions.length})
            </label>

            <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-thin pr-1">
              {instructions.map((step, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-2.5 bg-stone-50 dark:bg-slate-800/70 rounded-2xl border border-stone-200 dark:border-slate-700 text-xs shadow-2xs"
                >
                  <span className="w-6 h-6 rounded-full bg-amber-400 text-stone-900 font-black flex items-center justify-center shrink-0 text-xs mt-1 shadow-2xs">
                    {idx + 1}
                  </span>
                  <textarea
                    value={step}
                    onChange={(e) => handleUpdateStep(idx, e.target.value)}
                    rows={3}
                    className="flex-1 font-medium text-stone-800 dark:text-slate-200 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 rounded-xl p-2.5 text-xs leading-relaxed resize-none scrollbar-none"
                    placeholder={`Schritt ${idx + 1} beschreiben...`}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveStep(idx)}
                    className="w-7 h-7 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 flex items-center justify-center shrink-0 mt-1 transition-colors"
                    title="Schritt entfernen"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Step Input */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newStepText}
                onChange={(e) => setNewStepText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddStep();
                  }
                }}
                placeholder="Nächster Zubereitungsschritt..."
                className="flex-1 px-3 py-1.5 rounded-xl border border-stone-300 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-slate-800 text-stone-900 dark:text-white"
              />
              <button
                type="button"
                onClick={handleAddStep}
                className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors shrink-0"
              >
                + Schritt
              </button>
            </div>
          </div>

          {/* Delete Danger Zone */}
          {onDelete && (
            <div className="pt-3 border-t border-rose-100 dark:border-rose-900/40">
              {!isConfirmingDelete ? (
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(true)}
                  className="text-xs font-bold text-rose-600 hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-300 flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Dieses Rezept aus dem Rezeptbuch löschen...</span>
                </button>
              ) : (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
                  <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 text-xs font-bold">
                    <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                    <span>Dauerhaft löschen? Wird auch aus dem Essensplan entfernt.</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsConfirmingDelete(false)}
                      className="px-3 py-1 rounded-xl bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-xs font-bold text-stone-600 dark:text-slate-300 hover:bg-stone-50 dark:hover:bg-slate-700"
                    >
                      Behalten
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onDelete(recipe.id);
                        onClose();
                      }}
                      className="px-3.5 py-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-xs transition-colors"
                    >
                      Ja, Rezept löschen
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-stone-100 dark:border-slate-800 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-stone-500 dark:text-slate-400 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-2xl text-xs font-black bg-teal-600 hover:bg-teal-700 text-white shadow-md active:translate-y-0.5 border-b-4 border-teal-800 transition-all flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Änderungen speichern</span>
            </button>
          </div>
        </form>
      </div>
    </div>
    </ModalPortal>
  );
};
