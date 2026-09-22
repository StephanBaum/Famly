import { Reward } from '../types';

export const STORAGE_KEYS = {
  IS_ONBOARDED: 'famly_is_onboarded_v2',
  MEMBERS: 'famly_members_v2',
  ACTIVE_MEMBER: 'famly_active_member_v2',
  APPOINTMENTS: 'famly_appointments_v2',
  RECIPES: 'famly_recipes_v2',
  MEAL_PLANS: 'famly_mealplans_v2',
  PHOTOS: 'famly_photos_v2',
  GALLERIES: 'famly_galleries_v2',
  GROCERIES: 'famly_groceries_v2',
  CHORES: 'famly_chores_v2',
  NOTES: 'famly_notes_v2',
  STORES: 'famly_stores_v2',
  STORE_MAP: 'famly_store_map_v2',
  ALWAYS_IN_STOCK: 'famly_always_in_stock_v2',
  LOGGED_IN_MEMBER: 'famly_logged_in_member_v3',
  REWARDS: 'famly_rewards_v2',
  REWARD_CLAIMS: 'famly_reward_claims_v2',
  THEME: 'famly_theme_mode',
  FAMILY_NAME: 'famly_family_name',
  EARNED_STARS: 'famly_earned_stars_v2',
};

export const INITIAL_REWARDS: Reward[] = [
  { id: 'rew_1', title: 'Großes Eisbecher-Essen', icon: '🍦', starsCost: 15, description: 'Beliebige Eisdiele mit 3 Kugeln & Sahne' },
  { id: 'rew_2', title: '45 Min extra Medien-/Spielzeit', icon: '🎮', starsCost: 20, description: 'Für Konsole, Tablet oder Lieblingsserie' },
  { id: 'rew_3', title: 'Wunsch-Abendessen bestimmen', icon: '🍕', starsCost: 25, description: 'Du suchst aus, was die Familie kocht oder bestellt' },
  { id: 'rew_4', title: 'Filmabend mit Wunschfilm & Popcorn', icon: '🎬', starsCost: 30, description: 'Großer Familien-Kinoabend auf dem Sofa' },
  { id: 'rew_5', title: 'Ausflug in den Freizeitpark oder Zoo', icon: '🎡', starsCost: 50, description: 'Gemeinsamer Wochenend-Erlebnisausflug' },
];

export function getStoredOrDefault<T>(key: string, defaultValue: T): T {
  try {
    let saved = localStorage.getItem(key);
    // Backward compatibility fallback from fampulse_ keys
    if (!saved && key.startsWith('famly_')) {
      const legacyKey = key.replace('famly_', 'fampulse_');
      saved = localStorage.getItem(legacyKey);
    }
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn(`Failed to parse stored ${key}`, e);
  }
  return defaultValue;
}

export interface RecipeSyncResult {
  addedCount: number;
  skippedCount: number;
  skippedNames: string[];
}

export interface BatchRecipeSyncResult {
  addedCount: number;
  mergedCount: number;
  skippedCount: number;
  skippedNames: string[];
  estimatedTotalCost: number;
}
