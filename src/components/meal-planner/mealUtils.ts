import { Recipe } from '../../types';

// Robust food photo fallback helper
export const getRecipePhoto = (recipe: Recipe): string => {
  if (
    recipe.imageUrl &&
    recipe.imageUrl.startsWith('http') &&
    !recipe.imageUrl.includes('photo-1621996346565-e3d5d6281057')
  ) {
    return recipe.imageUrl;
  }
  const t = (recipe.title || '').toLowerCase();
  if (t.includes('pasta') || t.includes('spaghetti') || t.includes('fettuccine') || t.includes('zitronen')) {
    return 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=600&q=80';
  }
  if (t.includes('pizza')) {
    return 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=600&q=80';
  }
  if (t.includes('curry') || t.includes('thai') || t.includes('noodle')) {
    return 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=600&q=80';
  }
  if (t.includes('salmon') || t.includes('fish') || t.includes('lachs')) {
    return 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80';
  }
  if (t.includes('pancake') || t.includes('cake') || t.includes('strudel') || t.includes('baking') || t.includes('kuchen')) {
    return 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=600&q=80';
  }
  if (t.includes('taco') || t.includes('burrito') || t.includes('mexican')) {
    return 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=600&q=80';
  }
  if (t.includes('spätzle') || t.includes('kaesspatzen')) {
    return 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=600&q=80';
  }
  return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
};

// Duolingo-styled category pill badge styling
export const getCategoryBadge = (category?: Recipe['category']) => {
  switch (category) {
    case 'quick':
      return { label: 'Schnell', icon: '⚡', bg: 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700' };
    case 'comfort':
      return { label: 'Hausmannskost', icon: '🍲', bg: 'bg-orange-100 dark:bg-orange-950/60 text-orange-900 dark:text-orange-200 border-orange-300 dark:border-orange-700' };
    case 'healthy':
      return { label: 'Gesund', icon: '🥗', bg: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700' };
    case 'baking':
      return { label: 'Backen', icon: '🥐', bg: 'bg-pink-100 dark:bg-pink-950/60 text-pink-900 dark:text-pink-200 border-pink-300 dark:border-pink-700' };
    default:
      return { label: 'Favorit', icon: '🌟', bg: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 border-indigo-300 dark:border-indigo-700' };
  }
};
