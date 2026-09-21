import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  FamilyMember,
  Appointment,
  Recipe,
  MealPlanDay,
  PhotoMemory,
  GalleryAlbum,
  PhotoItem,
  GuestReaction,
  GroceryItem,
  Chore,
  PinnedNote,
  Ingredient,
  StoreDefinition,
  Reward,
  RewardClaim,
  GroceryCategory,
} from '../types';
import {
  subscribeToFamilyRealtime,
  syncGroceryToCloud,
  deleteGroceryFromCloud,
  syncChoreToCloud,
  deleteChoreFromCloud,
  syncAppointmentToCloud,
  deleteAppointmentFromCloud,
} from '../services/supabaseSync';
import {
  INITIAL_MEMBERS,
  INITIAL_RECIPES,
  INITIAL_MEAL_PLANS,
  INITIAL_APPOINTMENTS,
  INITIAL_PHOTOS,
  INITIAL_GALLERIES,
  INITIAL_GROCERIES,
  INITIAL_CHORES,
  INITIAL_NOTES,
  INITIAL_STORES,
  INITIAL_STORE_LEARNING_MAP,
  INITIAL_ALWAYS_IN_STOCK,
} from '../utils/initialData';
import {
  detectIsPerishable,
  getHorizonBucket,
  predictStoreForItem,
  sanitizeAndDeduplicateGroceries,
  removeGroceriesForMeal as removeMealGroceriesUtil,
  clearGroceriesForDates as clearDatesGroceriesUtil,
  cleanPastMealGroceries as cleanPastMealGroceriesUtil,
} from '../utils/grocerySyncUtils';

export { detectIsPerishable, sanitizeAndDeduplicateGroceries };

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

export interface FamilyContextType {
  members: FamilyMember[];
  loggedInMemberId: string | null;
  loggedInMember: FamilyMember | undefined;
  login: (memberId: string, pin?: string) => { success: boolean; message?: string };
  logout: () => void;

  currentMemberId: string | 'all';
  setCurrentMemberId: (id: string | 'all') => void;
  currentMember: FamilyMember | undefined;
  addMember: (member: Omit<FamilyMember, 'id'>) => void;
  updateMember: (id: string, updates: Partial<FamilyMember>) => void;
  deleteMember: (id: string) => void;

  appointments: Appointment[];
  addAppointment: (app: Omit<Appointment, 'id'>) => void;
  updateAppointment: (id: string, updates: Partial<Appointment>) => void;
  deleteAppointment: (id: string) => void;

  recipes: Recipe[];
  addRecipe: (recipe: Omit<Recipe, 'id'> | Recipe) => Recipe;
  updateRecipe: (id: string, updates: Partial<Recipe>) => void;
  deleteRecipe: (id: string) => void;
  toggleFavoriteRecipe: (id: string) => void;

  mealPlans: MealPlanDay[];
  setMealSlot: (
    date: string,
    slot: 'breakfast' | 'lunch' | 'dinner',
    data: { title: string; recipeId?: string; chefId?: string }
  ) => void;
  addRecipeIngredientsToGrocery: (recipe: Recipe, targetDate?: string) => RecipeSyncResult;
  addMultipleRecipesToGrocery: (
    recipes: Recipe[] | Array<{ recipe: Recipe; date?: string }>
  ) => BatchRecipeSyncResult;
  removeGroceriesForMeal: (
    date: string,
    options?: { recipeTitle?: string; recipeId?: string; slot?: string }
  ) => number;
  clearGroceriesForDates: (dates: string[]) => number;
  cleanPastMealGroceries: () => { removedCount: number; removedItems: GroceryItem[] };

  photos: PhotoMemory[];
  addPhoto: (photo: Omit<PhotoMemory, 'id' | 'likes'>) => void;
  togglePhotoLike: (photoId: string) => void;
  deletePhoto: (photoId: string) => void;

  // Multi-Photo Collaborative Galleries & Relative Sharing
  galleries: GalleryAlbum[];
  createGallery: (
    gallery: Omit<GalleryAlbum, 'id' | 'photos' | 'shareCode' | 'guestReactions'>,
    initialPhotos?: Omit<PhotoItem, 'id' | 'likes'>[]
  ) => GalleryAlbum;
  addPhotosToGallery: (galleryId: string, newPhotos: Omit<PhotoItem, 'id' | 'likes'>[]) => void;
  deleteGallery: (galleryId: string) => void;
  deletePhotoFromGallery: (galleryId: string, photoId: string) => void;
  toggleGalleryPhotoLike: (galleryId: string, photoId: string) => void;
  addGuestReaction: (galleryId: string, author: string, message: string, emoji: string) => void;
  toggleGalleryShare: (galleryId: string, isShared: boolean) => void;

  // Stores & Shopping
  stores: StoreDefinition[];
  addStore: (name: string, icon?: string) => void;
  groceries: GroceryItem[];
  addGrocery: (name: string, store?: string, amount?: string, category?: GroceryItem['category']) => void;
  toggleGrocery: (id: string) => void;
  deleteGrocery: (id: string) => void;
  clearCheckedGroceries: (storeFilter?: string) => void;
  setItemStore: (itemId: string, newStore: string) => void;
  deduplicateGroceries: () => void;

  // Store & Pantry Staples Learning
  storeLearningMap: Record<string, string>;
  alwaysInStock: string[];
  toggleAlwaysInStock: (name: string) => void;
  isItemInStock: (name: string) => boolean;

  chores: Chore[];
  addChore: (title: string, assignedMemberId: string, frequency: Chore['frequency'], stars: number, assignedMemberIds?: string[], dueDate?: string) => void;
  updateChore: (id: string, updates: Partial<Omit<Chore, 'id'>>) => void;
  toggleChore: (id: string, completingMemberId?: string) => void;
  deleteChore: (id: string) => void;

  // Rewards & Gamification
  rewards: Reward[];
  rewardClaims: RewardClaim[];
  addReward: (title: string, starsCost: number, icon?: string, description?: string, targetMemberId?: string) => void;
  deleteReward: (id: string) => void;
  claimReward: (rewardId: string, memberId: string) => boolean;
  approveClaim: (claimId: string) => void;
  deleteClaim: (claimId: string) => void;
  getMemberStarBalance: (memberId: string) => number;
  getMemberTotalEarnedStars: (memberId: string) => number;
  addMemberStars: (memberId: string, amount: number) => void;

  notes: PinnedNote[];
  addNote: (title: string, content: string, tag: PinnedNote['tag'], isPinned?: boolean) => void;
  deleteNote: (id: string) => void;

  resetToDefaults: () => void;

  // Onboarding & Customization
  isOnboarded: boolean;
  completeOnboarding: (config: {
    familyName: string;
    members: Array<Omit<FamilyMember, 'id'>>;
    loadSampleRecipes?: boolean;
    loadSampleStores?: boolean;
  }) => void;
  loadDemoData: () => void;
  resetToFreshStart: () => void;

  // Theme & Identity
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  familyName: string;
  setFamilyName: (name: string) => void;

  // Data Management
  exportAllData: () => string;
  importAllData: (jsonData: string) => { success: boolean; error?: string };
}

const FamilyContext = createContext<FamilyContextType | null>(null);

const STORAGE_KEYS = {
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

function getStoredOrDefault<T>(key: string, defaultValue: T): T {
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



export const FamilyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnboarded, setIsOnboarded] = useState<boolean>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.IS_ONBOARDED);
    if (stored !== null) {
      return stored === 'true';
    }
    // Backward compatibility: If the user had already customized their family in localStorage, keep them onboarded:
    const hasCustomMembers = localStorage.getItem(STORAGE_KEYS.MEMBERS);
    if (hasCustomMembers) {
      try {
        const parsed = JSON.parse(hasCustomMembers);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return true;
        }
      } catch (e) {
        // ignore
      }
    }
    return false;
  });

  const [loggedInMemberId, setLoggedInMemberId] = useState<string | null>(() =>
    getStoredOrDefault<string | null>(STORAGE_KEYS.LOGGED_IN_MEMBER, null)
  );

  const [members, setMembers] = useState<FamilyMember[]>(() => {
    const stored = getStoredOrDefault<FamilyMember[] | null>(STORAGE_KEYS.MEMBERS, null);
    if (stored !== null) return stored;
    return [];
  });

  const [currentMemberId, setCurrentMemberId] = useState<string | 'all'>(() =>
    getStoredOrDefault(STORAGE_KEYS.ACTIVE_MEMBER, 'all')
  );

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const stored = getStoredOrDefault<Appointment[] | null>(STORAGE_KEYS.APPOINTMENTS, null);
    if (stored !== null) return stored;
    return [];
  });

  const [recipes, setRecipes] = useState<Recipe[]>(() => {
    const stored = getStoredOrDefault<Recipe[] | null>(STORAGE_KEYS.RECIPES, null);
    if (stored !== null) return stored;
    return [];
  });

  const [mealPlans, setMealPlans] = useState<MealPlanDay[]>(() => {
    const stored = getStoredOrDefault<MealPlanDay[] | null>(STORAGE_KEYS.MEAL_PLANS, null);
    if (stored !== null) return stored;
    return [];
  });

  const [photos, setPhotos] = useState<PhotoMemory[]>(() => {
    const stored = getStoredOrDefault<PhotoMemory[] | null>(STORAGE_KEYS.PHOTOS, null);
    if (stored !== null) return stored;
    return [];
  });

  const [galleries, setGalleries] = useState<GalleryAlbum[]>(() => {
    const stored = getStoredOrDefault<GalleryAlbum[] | null>(STORAGE_KEYS.GALLERIES, null);
    if (stored !== null) return stored;
    return [];
  });

  const [groceries, setGroceries] = useState<GroceryItem[]>(() => {
    const stored = getStoredOrDefault<GroceryItem[] | null>(STORAGE_KEYS.GROCERIES, null);
    if (stored !== null) return sanitizeAndDeduplicateGroceries(stored);
    return [];
  });

  const [chores, setChores] = useState<Chore[]>(() => {
    const stored = getStoredOrDefault<Chore[] | null>(STORAGE_KEYS.CHORES, null);
    if (stored !== null) return stored;
    return [];
  });

  const [notes, setNotes] = useState<PinnedNote[]>(() => {
    const stored = getStoredOrDefault<PinnedNote[] | null>(STORAGE_KEYS.NOTES, null);
    if (stored !== null) return stored;
    return [];
  });

  // Rewards & Gamification
  const [rewards, setRewards] = useState<Reward[]>(() =>
    getStoredOrDefault(STORAGE_KEYS.REWARDS, INITIAL_REWARDS)
  );
  const [rewardClaims, setRewardClaims] = useState<RewardClaim[]>(() =>
    getStoredOrDefault(STORAGE_KEYS.REWARD_CLAIMS, [])
  );

  // Permanent Star Bank / Ledger - stars earned by children are NEVER wiped on chore deletion!
  const [earnedStars, setEarnedStars] = useState<Record<string, number>>(() => {
    const stored = getStoredOrDefault<Record<string, number> | null>(STORAGE_KEYS.EARNED_STARS, null);
    if (stored !== null) return stored;

    // Backward compatibility & migration: seed from completed chores
    const initialMap: Record<string, number> = {};
    const existingChores = getStoredOrDefault<Chore[] | null>(STORAGE_KEYS.CHORES, null) || INITIAL_CHORES;
    existingChores.forEach((c) => {
      if (c.completed) {
        const who = c.completedByMemberId || c.assignedMemberId || (c.assignedMemberIds && c.assignedMemberIds[0]);
        if (who && who !== 'all') {
          initialMap[who] = (initialMap[who] || 0) + (c.stars || 0);
        }
      }
    });
    return initialMap;
  });

  // Stores & Learning states
  const [stores, setStores] = useState<StoreDefinition[]>(() =>
    getStoredOrDefault(STORAGE_KEYS.STORES, INITIAL_STORES)
  );
  const [storeLearningMap, setStoreLearningMap] = useState<Record<string, string>>(() =>
    getStoredOrDefault(STORAGE_KEYS.STORE_MAP, INITIAL_STORE_LEARNING_MAP)
  );
  const [alwaysInStock, setAlwaysInStock] = useState<string[]>(() =>
    getStoredOrDefault(STORAGE_KEYS.ALWAYS_IN_STOCK, INITIAL_ALWAYS_IN_STOCK)
  );

  // Theme (Dark Mode)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    if (saved !== null) {
      return saved === 'dark';
    }
    return typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false;
  });

  // Family Identity
  const [familyName, setFamilyNameState] = useState<string>(() => {
    const stored = getStoredOrDefault<string | null>(STORAGE_KEYS.FAMILY_NAME, null);
    if (stored !== null) return stored;
    return '';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.THEME, isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);

  const setFamilyName = (name: string) => {
    const clean = name.trim() || 'Familie';
    setFamilyNameState(clean);
    localStorage.setItem(STORAGE_KEYS.FAMILY_NAME, JSON.stringify(clean));
  };

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_MEMBER, JSON.stringify(currentMemberId));
  }, [currentMemberId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(recipes));
  }, [recipes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MEAL_PLANS, JSON.stringify(mealPlans));
  }, [mealPlans]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PHOTOS, JSON.stringify(photos));
  }, [photos]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.GALLERIES, JSON.stringify(galleries));
  }, [galleries]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.GROCERIES, JSON.stringify(groceries));
  }, [groceries]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CHORES, JSON.stringify(chores));
  }, [chores]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.REWARDS, JSON.stringify(rewards));
  }, [rewards]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.REWARD_CLAIMS, JSON.stringify(rewardClaims));
  }, [rewardClaims]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EARNED_STARS, JSON.stringify(earnedStars));
  }, [earnedStars]);

  // Supabase Realtime Live-Sync Subscription
  useEffect(() => {
    const unsubscribe = subscribeToFamilyRealtime({
      onGroceryChange: (eventType, item) => {
        if (!item || !item.id) return;
        if (eventType === 'DELETE') {
          setGroceries((prev) => prev.filter((g) => g.id !== item.id));
        } else {
          setGroceries((prev) => {
            const exists = prev.some((g) => g.id === item.id);
            if (exists) {
              return prev.map((g) => (g.id === item.id ? { ...g, ...item } : g));
            } else {
              return [item, ...prev];
            }
          });
        }
      },
      onChoreChange: (eventType, chore) => {
        if (!chore || !chore.id) return;
        if (eventType === 'DELETE') {
          setChores((prev) => prev.filter((c) => c.id !== chore.id));
        } else {
          setChores((prev) => {
            const exists = prev.some((c) => c.id === chore.id);
            if (exists) {
              return prev.map((c) => (c.id === chore.id ? { ...c, ...chore } : c));
            } else {
              return [chore, ...prev];
            }
          });
        }
      },
      onAppointmentChange: (eventType, appt) => {
        if (!appt || !appt.id) return;
        if (eventType === 'DELETE') {
          setAppointments((prev) => prev.filter((a) => a.id !== appt.id));
        } else {
          setAppointments((prev) => {
            const exists = prev.some((a) => a.id === appt.id);
            if (exists) {
              return prev.map((a) => (a.id === appt.id ? { ...a, ...appt } : a));
            } else {
              return [appt, ...prev];
            }
          });
        }
      },
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STORES, JSON.stringify(stores));
  }, [stores]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STORE_MAP, JSON.stringify(storeLearningMap));
  }, [storeLearningMap]);

  useEffect(() => {
    if (loggedInMemberId) {
      localStorage.setItem(STORAGE_KEYS.LOGGED_IN_MEMBER, JSON.stringify(loggedInMemberId));
    } else {
      localStorage.removeItem(STORAGE_KEYS.LOGGED_IN_MEMBER);
    }
  }, [loggedInMemberId]);

  const loggedInMember = members.find((m) => m.id === loggedInMemberId);
  const currentMember = members.find((m) => m.id === currentMemberId);

  const login = (memberId: string, pinInput?: string): { success: boolean; message?: string } => {
    const member = members.find((m) => m.id === memberId);
    if (!member) {
      return { success: false, message: 'Member profile not found' };
    }
    if (member.pin && member.pin !== pinInput) {
      return { success: false, message: 'Incorrect 4-digit PIN' };
    }
    setLoggedInMemberId(member.id);
    setCurrentMemberId(member.id);
    confetti({
      particleCount: 70,
      spread: 70,
      origin: { y: 0.6 },
    });
    return { success: true };
  };

  const logout = () => {
    setLoggedInMemberId(null);
    setCurrentMemberId('all');
  };

  // Members
  const addMember = (m: Omit<FamilyMember, 'id'>) => {
    const newMember: FamilyMember = {
      ...m,
      id: `m_${Date.now()}`,
    };
    setMembers((prev) => [...prev, newMember]);
  };

  const updateMember = (id: string, updates: Partial<FamilyMember>) => {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)));
  };

  const deleteMember = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  // Appointments
  const addAppointment = (app: Omit<Appointment, 'id'>) => {
    const newApp: Appointment = {
      ...app,
      id: `a_${Date.now()}`,
    };
    setAppointments((prev) => [...prev, newApp]);
    syncAppointmentToCloud(newApp);
  };

  const updateAppointment = (id: string, updates: Partial<Appointment>) => {
    setAppointments((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          const updated = { ...a, ...updates };
          syncAppointmentToCloud(updated);
          return updated;
        }
        return a;
      })
    );
  };

  const deleteAppointment = (id: string) => {
    setAppointments((prev) => prev.filter((a) => a.id !== id));
    deleteAppointmentFromCloud(id);
  };

  // Recipes & Meal planning
  const addRecipe = (rec: Omit<Recipe, 'id'> | Recipe): Recipe => {
    const newRec: Recipe = {
      ...rec,
      id: 'id' in rec && rec.id ? rec.id : `r_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    };
    setRecipes((prev) => [newRec, ...prev]);
    return newRec;
  };

  const updateRecipe = (id: string, updates: Partial<Recipe>) => {
    setRecipes((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
  };

  const deleteRecipe = (id: string) => {
    setRecipes((prev) => prev.filter((r) => r.id !== id));
    // Also clean up any meal plans referencing this deleted recipe
    setMealPlans((prev) =>
      prev.map((day) => {
        let modified = false;
        const newDay = { ...day };
        (['breakfast', 'lunch', 'dinner'] as const).forEach((slot) => {
          if (newDay[slot]?.recipeId === id) {
            newDay[slot] = {
              ...newDay[slot]!,
              recipeId: undefined,
            };
            modified = true;
          }
        });
        return modified ? newDay : day;
      })
    );
  };

  const toggleFavoriteRecipe = (id: string) => {
    setRecipes((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isFavorite: !r.isFavorite } : r))
    );
  };

  const setMealSlot = (
    date: string,
    slot: 'breakfast' | 'lunch' | 'dinner',
    data: { title: string; recipeId?: string; chefId?: string }
  ) => {
    setMealPlans((prev) => {
      const existingIdx = prev.findIndex((p) => p.date === date);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          [slot]: data,
        };
        return updated;
      } else {
        return [...prev, { date, [slot]: data }];
      }
    });
  };

  // Helper to check if an ingredient is in the "Always in stock" list
  const isItemInStock = (name: string): boolean => {
    const clean = name.toLowerCase().trim();
    return alwaysInStock.some((staple) => {
      const s = staple.toLowerCase().trim();
      return clean === s || clean.startsWith(s + ' ') || clean.endsWith(' ' + s) || clean.includes(` ${s} `);
    });
  };

  const addRecipeIngredientsToGrocery = (recipe: Recipe, targetDate?: string): RecipeSyncResult => {
    const toAdd: GroceryItem[] = [];
    const skippedNames: string[] = [];

    recipe.ingredients.forEach((ing: Ingredient, idx) => {
      if (isItemInStock(ing.name)) {
        skippedNames.push(ing.name);
      } else {
        const assignedStore = predictStoreForItem(ing.name, storeLearningMap);
        toAdd.push({
          id: `g_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 9)}`,
          name: ing.name.trim(),
          amount: ing.amount ? ing.amount.trim() : undefined,
          store: assignedStore,
          category: ing.category,
          checked: false,
          addedByMemberId: currentMemberId === 'all' ? members[0]?.id : currentMemberId,
          targetDate,
          recipeTitle: recipe.title,
          recipeId: recipe.id,
          mealSlot: 'dinner',
          isPerishable: detectIsPerishable(ing.name, ing.category),
        });
      }
    });

    if (toAdd.length > 0) {
      setGroceries((prev) => {
        const next = [...prev];
        toAdd.forEach((newItem) => {
          const existingIdx = next.findIndex(
            (g) =>
              !g.checked &&
              g.store.toLowerCase().trim() === newItem.store.toLowerCase().trim() &&
              g.name.toLowerCase().trim() === newItem.name.toLowerCase().trim() &&
              getHorizonBucket(g.targetDate, g.isPerishable) === getHorizonBucket(newItem.targetDate, newItem.isPerishable)
          );
          if (existingIdx >= 0) {
            const existing = next[existingIdx];
            const newAmount = newItem.amount?.trim();
            let mergedAmount = existing.amount;
            if (newAmount && (!existing.amount || !existing.amount.includes(newAmount))) {
              mergedAmount = existing.amount ? `${existing.amount} + ${newAmount}` : newAmount;
            }
            const earliestDate =
              newItem.targetDate && (!existing.targetDate || newItem.targetDate < existing.targetDate)
                ? newItem.targetDate
                : existing.targetDate;

            next[existingIdx] = {
              ...existing,
              amount: mergedAmount,
              targetDate: earliestDate,
              recipeTitle: existing.recipeTitle || newItem.recipeTitle,
              recipeId: existing.recipeId || newItem.recipeId,
              isPerishable: existing.isPerishable || newItem.isPerishable,
            };
          } else {
            next.unshift(newItem);
          }
        });
        return next;
      });

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
    }

    return {
      addedCount: toAdd.length,
      skippedCount: skippedNames.length,
      skippedNames,
    };
  };

  const addMultipleRecipesToGrocery = (
    recipesListOrAssignments: Recipe[] | Array<{ recipe: Recipe; date?: string }>
  ): BatchRecipeSyncResult => {
    // Normalize into array of { recipe, date }
    const normalized: Array<{ recipe: Recipe; date?: string }> = recipesListOrAssignments.map((item) => {
      if ('ingredients' in item) {
        return { recipe: item, date: undefined };
      }
      return item;
    });

    const consolidatedMap = new Map<
      string,
      {
        name: string;
        amounts: string[];
        store: string;
        category?: GroceryCategory;
        recipeTitles: string[];
        recipeIds: string[];
        targetDates: string[];
        isPerishable: boolean;
      }
    >();
    const skippedNames: string[] = [];
    let mergedCount = 0;

    normalized.forEach(({ recipe, date }) => {
      recipe.ingredients.forEach((ing) => {
        const stapleCheck = ing.name.toLowerCase().trim();
        // True non-perishable basic seasonings & water
        if (
          stapleCheck === 'salz' ||
          stapleCheck === 'meersalz' ||
          stapleCheck === 'speisesalz' ||
          stapleCheck === 'pfeffer' ||
          stapleCheck === 'schwarzer pfeffer' ||
          stapleCheck === 'wasser' ||
          stapleCheck === 'leitungswasser'
        ) {
          if (!skippedNames.includes(ing.name)) {
            skippedNames.push(ing.name);
          }
          return;
        }

        const isPerishable = detectIsPerishable(ing.name, ing.category);
        const horizonBucket = getHorizonBucket(date, isPerishable);
        const assignedStore = predictStoreForItem(ing.name, storeLearningMap);

        // Normalize base name
        const cleanBase = ing.name
          .toLowerCase()
          .replace(/^(frische[rsn]?|bio-|reife[rsn]?|gekochtes?|festkochende)\s+/i, '')
          .replace(/\s*\([^)]*\)/g, '')
          .trim();

        // Key incorporates horizonBucket:
        // - Pantry non-perishables share 'pantry_all' and combine across all weeks
        // - Fresh perishables have distinct horizon buckets per week and stay separate!
        const key = `${cleanBase}:::${assignedStore.toLowerCase()}:::${horizonBucket}`;

        if (consolidatedMap.has(key)) {
          mergedCount++;
          const existing = consolidatedMap.get(key)!;
          if (ing.amount && !existing.amounts.includes(ing.amount)) {
            existing.amounts.push(ing.amount);
          }
          if (!existing.recipeTitles.includes(recipe.title)) {
            existing.recipeTitles.push(recipe.title);
          }
          if (!existing.recipeIds.includes(recipe.id)) {
            existing.recipeIds.push(recipe.id);
          }
          if (date && !existing.targetDates.includes(date)) {
            existing.targetDates.push(date);
          }
          if (isPerishable) {
            existing.isPerishable = true;
          }
        } else {
          consolidatedMap.set(key, {
            name: ing.name,
            amounts: ing.amount ? [ing.amount] : [],
            store: assignedStore,
            category: ing.category,
            recipeTitles: [recipe.title],
            recipeIds: [recipe.id],
            targetDates: date ? [date] : [],
            isPerishable,
          });
        }
      });
    });

    const activeMember = currentMemberId === 'all' ? members[0]?.id : currentMemberId;
    const toAdd: GroceryItem[] = Array.from(consolidatedMap.entries()).map(([_, val], idx) => {
      let combinedAmount = val.amounts.join(' + ');
      if (val.amounts.length > 1) {
        combinedAmount = `${val.amounts.join(' + ')} (für ${val.recipeTitles.length} Gerichte)`;
      }

      const earliestDate = val.targetDates.length > 0 ? [...val.targetDates].sort()[0] : undefined;

      return {
        id: `g_batch_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 9)}`,
        name: val.name.trim(),
        amount: combinedAmount || undefined,
        store: val.store,
        category: val.category,
        checked: false,
        addedByMemberId: activeMember,
        targetDate: earliestDate,
        recipeTitle: val.recipeTitles.join(', '),
        recipeId: val.recipeIds[0],
        mealSlot: 'dinner',
        isPerishable: val.isPerishable,
      };
    });

    if (toAdd.length > 0) {
      setGroceries((prev) => {
        const next = [...prev];
        toAdd.forEach((newItem) => {
          const existingIdx = next.findIndex(
            (g) =>
              !g.checked &&
              g.store.toLowerCase().trim() === newItem.store.toLowerCase().trim() &&
              g.name.toLowerCase().trim() === newItem.name.toLowerCase().trim() &&
              getHorizonBucket(g.targetDate, g.isPerishable) === getHorizonBucket(newItem.targetDate, newItem.isPerishable)
          );
          if (existingIdx >= 0) {
            const existing = next[existingIdx];
            const newAmount = newItem.amount?.trim();
            let mergedAmount = existing.amount;
            if (newAmount && (!existing.amount || !existing.amount.includes(newAmount))) {
              mergedAmount = existing.amount ? `${existing.amount} + ${newAmount}` : newAmount;
            }
            const earliestDate =
              newItem.targetDate && (!existing.targetDate || newItem.targetDate < existing.targetDate)
                ? newItem.targetDate
                : existing.targetDate;

            next[existingIdx] = {
              ...existing,
              amount: mergedAmount,
              targetDate: earliestDate,
              recipeTitle: existing.recipeTitle || newItem.recipeTitle,
              recipeId: existing.recipeId || newItem.recipeId,
              isPerishable: existing.isPerishable || newItem.isPerishable,
            };
          } else {
            next.unshift(newItem);
          }
        });
        return next;
      });

      confetti({
        particleCount: 75,
        spread: 75,
        origin: { y: 0.8 },
      });
    }

    const recipesList = normalized.map((n) => n.recipe);
    const estimatedTotalCost = Math.round(
      recipesList.reduce((sum, r) => sum + (r.estimatedCost || 13.5), 0) * 10
    ) / 10;

    return {
      addedCount: toAdd.length,
      mergedCount,
      estimatedTotalCost,
      skippedCount: skippedNames.length,
      skippedNames,
    };
  };

  // Self-Cleaning: Remove unbought items when a meal is swapped or cancelled
  const removeGroceriesForMeal = (
    date: string,
    options?: { recipeTitle?: string; recipeId?: string; slot?: string }
  ): number => {
    let count = 0;
    setGroceries((prev) => {
      const { updatedGroceries, removedCount } = removeMealGroceriesUtil(prev, date, options);
      count = removedCount;
      return updatedGroceries;
    });
    return count;
  };

  // Self-Cleaning: Clear old unbought ingredients for specific dates when re-planning a week
  const clearGroceriesForDates = (dates: string[]): number => {
    let count = 0;
    setGroceries((prev) => {
      const { updatedGroceries, removedCount } = clearDatesGroceriesUtil(prev, dates);
      count = removedCount;
      return updatedGroceries;
    });
    return count;
  };

  // Self-Cleaning: Auto-clean obsolete unbought ingredients from past days
  const cleanPastMealGroceries = (): { removedCount: number; removedItems: GroceryItem[] } => {
    let count = 0;
    let items: GroceryItem[] = [];
    setGroceries((prev) => {
      const { updatedGroceries, removedCount, removedItems } = cleanPastMealGroceriesUtil(prev);
      count = removedCount;
      items = removedItems;
      return updatedGroceries;
    });
    return { removedCount: count, removedItems: items };
  };

  // Photos
  const addPhoto = (photo: Omit<PhotoMemory, 'id' | 'likes'>) => {
    const newPhoto: PhotoMemory = {
      ...photo,
      id: `p_${Date.now()}`,
      likes: [],
    };
    setPhotos((prev) => [newPhoto, ...prev]);
    confetti({
      particleCount: 70,
      spread: 70,
      origin: { y: 0.7 },
    });
  };

  const togglePhotoLike = (photoId: string) => {
    const activeId = currentMemberId === 'all' ? members[0]?.id || 'm1' : currentMemberId;
    setPhotos((prev) =>
      prev.map((photo) => {
        if (photo.id !== photoId) return photo;
        const hasLiked = photo.likes.includes(activeId);
        return {
          ...photo,
          likes: hasLiked
            ? photo.likes.filter((id) => id !== activeId)
            : [...photo.likes, activeId],
        };
      })
    );
  };

  const deletePhoto = (photoId: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
  };

  // Multi-Photo Collaborative Galleries & Relative Sharing
  const createGallery = (
    galleryData: Omit<GalleryAlbum, 'id' | 'photos' | 'shareCode' | 'guestReactions'>,
    initialPhotos: Omit<PhotoItem, 'id' | 'likes'>[] = []
  ): GalleryAlbum => {
    const slug = galleryData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const newGallery: GalleryAlbum = {
      ...galleryData,
      id: `gal_${Date.now()}`,
      shareCode: `${slug || 'album'}-${Math.floor(1000 + Math.random() * 9000)}`,
      photos: initialPhotos.map((p, idx) => ({
        ...p,
        id: `p_${Date.now()}_${idx}`,
        likes: [],
      })),
      guestReactions: [],
    };
    setGalleries((prev) => [newGallery, ...prev]);
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
    });
    return newGallery;
  };

  const addPhotosToGallery = (
    galleryId: string,
    newPhotos: Omit<PhotoItem, 'id' | 'likes'>[]
  ) => {
    if (newPhotos.length === 0) return;
    const mapped: PhotoItem[] = newPhotos.map((p, idx) => ({
      ...p,
      id: `p_${Date.now()}_${idx}`,
      likes: [],
    }));

    setGalleries((prev) =>
      prev.map((gal) => {
        if (gal.id !== galleryId) return gal;
        return {
          ...gal,
          photos: [...gal.photos, ...mapped],
        };
      })
    );
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
    });
  };

  const deleteGallery = (galleryId: string) => {
    setGalleries((prev) => prev.filter((g) => g.id !== galleryId));
  };

  const deletePhotoFromGallery = (galleryId: string, photoId: string) => {
    setGalleries((prev) =>
      prev.map((gal) => {
        if (gal.id !== galleryId) return gal;
        return {
          ...gal,
          photos: gal.photos.filter((p) => p.id !== photoId),
        };
      })
    );
  };

  const toggleGalleryPhotoLike = (galleryId: string, photoId: string) => {
    const activeId = currentMemberId === 'all' ? members[0]?.id || 'm1' : currentMemberId;
    setGalleries((prev) =>
      prev.map((gal) => {
        if (gal.id !== galleryId) return gal;
        return {
          ...gal,
          photos: gal.photos.map((p) => {
            if (p.id !== photoId) return p;
            const hasLiked = p.likes.includes(activeId);
            return {
              ...p,
              likes: hasLiked
                ? p.likes.filter((id) => id !== activeId)
                : [...p.likes, activeId],
            };
          }),
        };
      })
    );
  };

  const addGuestReaction = (
    galleryId: string,
    author: string,
    message: string,
    emoji: string
  ) => {
    const reaction: GuestReaction = {
      id: `gr_${Date.now()}`,
      author: author.trim() || 'Relative',
      message: message.trim(),
      emoji: emoji || '❤️',
      timestamp: 'Just now',
    };

    setGalleries((prev) =>
      prev.map((gal) => {
        if (gal.id !== galleryId) return gal;
        return {
          ...gal,
          guestReactions: [reaction, ...(gal.guestReactions || [])],
        };
      })
    );
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const toggleGalleryShare = (galleryId: string, isShared: boolean) => {
    setGalleries((prev) =>
      prev.map((gal) => (gal.id === galleryId ? { ...gal, isPublicShared: isShared } : gal))
    );
  };

  // STORES
  const addStore = (name: string, icon = '🏬') => {
    const cleanName = name.trim();
    if (!cleanName || stores.some((s) => s.name.toLowerCase() === cleanName.toLowerCase())) return;
    const newStore: StoreDefinition = {
      id: `store_${Date.now()}`,
      name: cleanName,
      icon,
      badgeColor: 'bg-purple-100 text-purple-700',
      borderColor: 'border-purple-300',
    };
    setStores((prev) => [...prev, newStore]);
  };

  // Learn and change store for an item
  const setItemStore = (itemId: string, newStore: string) => {
    const item = groceries.find((g) => g.id === itemId);
    if (item) {
      const cleanName = item.name.toLowerCase().trim();
      // Learn mapping for future items with this name
      setStoreLearningMap((prev) => ({
        ...prev,
        [cleanName]: newStore,
      }));
    }
    // Update active grocery item
    setGroceries((prev) =>
      prev.map((g) => (g.id === itemId ? { ...g, store: newStore } : g))
    );
  };

  // Toggle Always in stock / Pantry staple
  const toggleAlwaysInStock = (name: string) => {
    const clean = name.toLowerCase().trim();
    setAlwaysInStock((prev) => {
      const exists = prev.some((s) => s.toLowerCase() === clean);
      if (exists) {
        return prev.filter((s) => s.toLowerCase() !== clean);
      } else {
        return [...prev, clean];
      }
    });
  };

  // Groceries
  const addGrocery = (
    name: string,
    store?: string,
    amount?: string,
    category?: GroceryItem['category']
  ) => {
    const assignedStore = store && store.trim() ? store.trim() : predictStoreForItem(name);

    // Save learning if explicit store was given
    if (store && store.trim()) {
      setStoreLearningMap((prev) => ({
        ...prev,
        [name.toLowerCase().trim()]: store.trim(),
      }));
    }

    const cleanName = name.trim();
    const cleanAmount = amount ? amount.trim() : '';

    setGroceries((prev) => {
      const existingIdx = prev.findIndex(
        (g) =>
          !g.checked &&
          g.store.toLowerCase().trim() === assignedStore.toLowerCase().trim() &&
          g.name.toLowerCase().trim() === cleanName.toLowerCase()
      );

      if (existingIdx >= 0) {
        const updated = [...prev];
        const existing = updated[existingIdx];
        let mergedAmount = existing.amount;
        if (cleanAmount && (!existing.amount || !existing.amount.includes(cleanAmount))) {
          mergedAmount = existing.amount ? `${existing.amount} + ${cleanAmount}` : cleanAmount;
        }
        const updatedItem = { ...existing, amount: mergedAmount };
        updated[existingIdx] = updatedItem;
        syncGroceryToCloud(updatedItem);
        return updated;
      }

      const newItem: GroceryItem = {
        id: `g_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        name: cleanName,
        store: assignedStore,
        category: category || 'produce',
        amount: cleanAmount,
        checked: false,
        addedByMemberId: currentMemberId === 'all' ? members[0]?.id : currentMemberId,
      };
      syncGroceryToCloud(newItem);
      return [newItem, ...prev];
    });
  };

  const deduplicateGroceries = () => {
    setGroceries((prev) => sanitizeAndDeduplicateGroceries(prev));
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.7 },
    });
  };

  const toggleGrocery = (id: string) => {
    setGroceries((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, checked: !item.checked };
          syncGroceryToCloud(updated);
          return updated;
        }
        return item;
      })
    );
  };

  const deleteGrocery = (id: string) => {
    setGroceries((prev) => prev.filter((item) => item.id !== id));
    deleteGroceryFromCloud(id);
  };

  const clearCheckedGroceries = (storeFilter?: string) => {
    setGroceries((prev) =>
      prev.filter((item) => {
        if (!item.checked) return true;
        if (storeFilter && storeFilter !== 'all') {
          const normFilter = storeFilter.toLowerCase().trim();
          const normStore = item.store.toLowerCase().trim();
          if (normStore !== normFilter && !normStore.startsWith(normFilter)) {
            return true;
          }
        }
        deleteGroceryFromCloud(item.id);
        return false;
      })
    );
  };

  // Chores
  const addChore = (
    title: string,
    assignedMemberId: string,
    frequency: Chore['frequency'],
    stars: number,
    assignedMemberIds?: string[],
    dueDate?: string
  ) => {
    const ids = assignedMemberIds && assignedMemberIds.length > 0
      ? assignedMemberIds
      : (assignedMemberId && assignedMemberId !== 'all' && assignedMemberId !== 'anyone' ? [assignedMemberId] : []);

    const newChore: Chore = {
      id: `c_${Date.now()}`,
      title: title.trim(),
      assignedMemberId: ids[0] || '',
      assignedMemberIds: ids,
      frequency,
      completed: false,
      stars: Math.max(1, Number(stars) || 1),
      dueDate: dueDate ? dueDate.trim() : undefined,
    };
    setChores((prev) => [newChore, ...prev]);
    syncChoreToCloud(newChore);
  };

  const updateChore = (id: string, updates: Partial<Omit<Chore, 'id'>>) => {
    setChores((prev) =>
      prev.map((chore) => {
        if (chore.id === id) {
          const updated = { ...chore, ...updates };
          if (updates.assignedMemberIds !== undefined && updates.assignedMemberId === undefined) {
            updated.assignedMemberId = updates.assignedMemberIds[0] || '';
          }
          syncChoreToCloud(updated);
          return updated;
        }
        return chore;
      })
    );
  };

  const toggleChore = (id: string, completingMemberId?: string) => {
    setChores((prev) =>
      prev.map((chore) => {
        if (chore.id === id) {
          const newCompleted = !chore.completed;
          const assignedId = chore.assignedMemberId || (chore.assignedMemberIds && chore.assignedMemberIds.length === 1 ? chore.assignedMemberIds[0] : undefined);
          const activeOrProvided = completingMemberId || (currentMemberId !== 'all' ? currentMemberId : undefined);
          const beneficiaryId = newCompleted
            ? (activeOrProvided || chore.completedByMemberId || assignedId)
            : (chore.completedByMemberId || assignedId);

          if (newCompleted) {
            confetti({
              particleCount: 60,
              spread: 60,
              origin: { y: 0.6 },
              colors: ['#F59E0B', '#10B981', '#6366F1', '#EC4899'],
            });
            if (beneficiaryId) {
              setEarnedStars((s) => ({
                ...s,
                [beneficiaryId]: (s[beneficiaryId] || 0) + (chore.stars || 0),
              }));

              const todayStr = new Date().toISOString().split('T')[0];
              const yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);
              const yesterdayStr = yesterday.toISOString().split('T')[0];

              setMembers((prevMembers) =>
                prevMembers.map((m) => {
                  if (m.id !== beneficiaryId) return m;

                  let streak = m.choreStreak || 0;
                  if (m.lastStreakDate === yesterdayStr) {
                    streak += 1;
                  } else if (m.lastStreakDate !== todayStr) {
                    streak = 1;
                  }

                  const existingBadges = m.earnedBadges || [];
                  const newBadges = [...existingBadges];
                  if (streak >= 3 && !newBadges.includes('🔥 3-Tage-Serie')) {
                    newBadges.push('🔥 3-Tage-Serie');
                  }
                  if (streak >= 7 && !newBadges.includes('⚡ 7-Tage-Champion')) {
                    newBadges.push('⚡ 7-Tage-Champion');
                  }
                  const totalStars = (earnedStars[m.id] || 0) + (chore.stars || 0);
                  if (totalStars >= 15 && !newBadges.includes('⭐ Sternen-Profi')) {
                    newBadges.push('⭐ Sternen-Profi');
                  }
                  if (totalStars >= 50 && !newBadges.includes('👑 Alltags-Held')) {
                    newBadges.push('👑 Alltags-Held');
                  }

                  return {
                    ...m,
                    choreStreak: streak,
                    lastStreakDate: todayStr,
                    earnedBadges: newBadges,
                  };
                })
              );
            }
          } else {
            // Uncompleting a chore reverts the earned stars for whoever completed it
            if (beneficiaryId) {
              setEarnedStars((s) => ({
                ...s,
                [beneficiaryId]: Math.max(0, (s[beneficiaryId] || 0) - (chore.stars || 0)),
              }));
            }
          }

          const updated: Chore = {
            ...chore,
            completed: newCompleted,
            completedByMemberId: newCompleted ? beneficiaryId : undefined,
            completedAt: newCompleted ? new Date().toISOString() : undefined,
          };
          syncChoreToCloud(updated);
          return updated;
        }
        return chore;
      })
    );
  };

  const deleteChore = (id: string) => {
    setChores((prev) => prev.filter((chore) => chore.id !== id));
    deleteChoreFromCloud(id);
    // Important: Earned stars are NEVER deleted! Once banked, stars belong to the child permanently.
  };

  // Rewards & Gamification
  const addReward = (
    title: string,
    starsCost: number,
    icon = '🎁',
    description?: string,
    targetMemberId?: string
  ) => {
    const newRew: Reward = {
      id: `rew_${Date.now()}`,
      title: title.trim(),
      starsCost: Math.max(1, Number(starsCost)),
      icon: icon || '🎁',
      description: description?.trim() || undefined,
      targetMemberId: targetMemberId || undefined,
    };
    setRewards((prev) => [...prev, newRew]);
  };

  const deleteReward = (id: string) => {
    setRewards((prev) => prev.filter((r) => r.id !== id));
  };

  const getMemberTotalEarnedStars = (memberId: string): number => {
    return earnedStars[memberId] || 0;
  };

  const getMemberStarBalance = (memberId: string): number => {
    const totalEarned = getMemberTotalEarnedStars(memberId);

    const totalSpent = rewardClaims
      .filter((cl) => cl.memberId === memberId && cl.status !== 'rejected')
      .reduce((acc, cl) => acc + (cl.starsSpent || 0), 0);

    return Math.max(0, totalEarned - totalSpent);
  };

  const addMemberStars = (memberId: string, amount: number) => {
    setEarnedStars((prev) => ({
      ...prev,
      [memberId]: Math.max(0, (prev[memberId] || 0) + amount),
    }));
  };

  const claimReward = (rewardId: string, memberId: string): boolean => {
    const reward = rewards.find((r) => r.id === rewardId);
    if (!reward) return false;

    const balance = getMemberStarBalance(memberId);
    if (balance < reward.starsCost) return false;

    const newClaim: RewardClaim = {
      id: `claim_${Date.now()}`,
      rewardId: reward.id,
      rewardTitle: reward.title,
      rewardIcon: reward.icon,
      memberId,
      starsSpent: reward.starsCost,
      claimedAt: new Date().toISOString(),
      status: 'pending',
    };

    setRewardClaims((prev) => [newClaim, ...prev]);

    confetti({
      particleCount: 75,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#F59E0B', '#10B981', '#EC4899', '#6366F1'],
    });

    return true;
  };

  const approveClaim = (claimId: string) => {
    setRewardClaims((prev) =>
      prev.map((c) => (c.id === claimId ? { ...c, status: 'approved' } : c))
    );
  };

  const deleteClaim = (claimId: string) => {
    setRewardClaims((prev) => prev.filter((c) => c.id !== claimId));
  };

  // Notes
  const addNote = (title: string, content: string, tag: PinnedNote['tag'], isPinned = false) => {
    const newNote: PinnedNote = {
      id: `n_${Date.now()}`,
      title,
      content,
      tag,
      isPinned,
      authorMemberId: currentMemberId === 'all' ? members[0]?.id : currentMemberId,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setNotes((prev) => [newNote, ...prev]);
  };

  const deleteNote = (id: string) => {
    setNotes((prev) => prev.filter((note) => note.id !== id));
  };

  const resetToDefaults = () => {
    loadDemoData();
  };

  const loadDemoData = () => {
    setMembers(INITIAL_MEMBERS);
    setCurrentMemberId('all');
    setAppointments(INITIAL_APPOINTMENTS);
    setRecipes(INITIAL_RECIPES);
    setMealPlans(INITIAL_MEAL_PLANS);
    setPhotos(INITIAL_PHOTOS);
    setGalleries(INITIAL_GALLERIES);
    setGroceries(INITIAL_GROCERIES);
    setChores(INITIAL_CHORES);
    const demoStars: Record<string, number> = {};
    INITIAL_CHORES.forEach((c) => {
      if (c.completed) {
        const who = c.completedByMemberId || c.assignedMemberId || (c.assignedMemberIds && c.assignedMemberIds[0]);
        if (who) {
          demoStars[who] = (demoStars[who] || 0) + (c.stars || 0);
        }
      }
    });
    setEarnedStars(demoStars);
    setNotes(INITIAL_NOTES);
    setStores(INITIAL_STORES);
    setStoreLearningMap(INITIAL_STORE_LEARNING_MAP);
    setAlwaysInStock(INITIAL_ALWAYS_IN_STOCK);
    setRewards(INITIAL_REWARDS);
    setRewardClaims([]);
    setFamilyNameState('Familie Baum');
    setLoggedInMemberId('m2'); // Alex logged in by default
    setIsOnboarded(true);
    localStorage.setItem(STORAGE_KEYS.IS_ONBOARDED, 'true');

    try {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (e) {
      // ignore
    }
  };

  const completeOnboarding = (config: {
    familyName: string;
    members: Array<Omit<FamilyMember, 'id'>>;
    loadSampleRecipes?: boolean;
    loadSampleStores?: boolean;
  }) => {
    const cleanFamilyName = config.familyName.trim() || 'Familie';
    const createdMembers: FamilyMember[] = config.members.map((m, idx) => ({
      ...m,
      id: `m_${Date.now()}_${idx + 1}`,
    }));

    setFamilyNameState(cleanFamilyName);
    setMembers(createdMembers);

    // Auto-login first parent or member
    const firstAdult = createdMembers.find((m) => !m.isChild) || createdMembers[0];
    if (firstAdult) {
      setLoggedInMemberId(firstAdult.id);
    }
    setCurrentMemberId('all');

    setAppointments([]);
    setRecipes(config.loadSampleRecipes ? INITIAL_RECIPES : []);
    setMealPlans([]);
    setPhotos([]);
    setGalleries([]);
    setGroceries([]);
    setChores([]);
    setEarnedStars({});
    setNotes([]);
    setRewards(INITIAL_REWARDS);
    setRewardClaims([]);
    setStores(config.loadSampleStores !== false ? INITIAL_STORES : []);
    setStoreLearningMap(INITIAL_STORE_LEARNING_MAP);
    setAlwaysInStock(INITIAL_ALWAYS_IN_STOCK);

    setIsOnboarded(true);
    localStorage.setItem(STORAGE_KEYS.IS_ONBOARDED, 'true');

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) {
      // ignore
    }
  };

  const resetToFreshStart = () => {
    setIsOnboarded(false);
    localStorage.removeItem(STORAGE_KEYS.IS_ONBOARDED);
    setLoggedInMemberId(null);
    setCurrentMemberId('all');
    setMembers([]);
    setFamilyNameState('');
    setAppointments([]);
    setRecipes([]);
    setMealPlans([]);
    setPhotos([]);
    setGalleries([]);
    setGroceries([]);
    setChores([]);
    setEarnedStars({});
    setNotes([]);
    setRewards(INITIAL_REWARDS);
    setRewardClaims([]);
  };

  const exportAllData = (): string => {
    const dump = {
      app: 'Famly',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      familyName,
      members,
      appointments,
      recipes,
      mealPlans,
      photos,
      galleries,
      groceries,
      chores,
      earnedStars,
      notes,
      stores,
      storeLearningMap,
      alwaysInStock,
      rewards,
      rewardClaims,
    };
    return JSON.stringify(dump, null, 2);
  };

  const importAllData = (jsonData: string): { success: boolean; error?: string } => {
    try {
      const data = JSON.parse(jsonData);
      if (!data || typeof data !== 'object') {
        return { success: false, error: 'File is not a valid JSON object.' };
      }
      if (Array.isArray(data.members) && data.members.length > 0) {
        setMembers(data.members);
      }
      if (typeof data.familyName === 'string' && data.familyName.trim()) {
        setFamilyName(data.familyName.trim());
      }
      if (Array.isArray(data.appointments)) {
        setAppointments(data.appointments);
      }
      if (Array.isArray(data.recipes)) {
        setRecipes(data.recipes);
      }
      if (Array.isArray(data.mealPlans)) {
        setMealPlans(data.mealPlans);
      }
      if (Array.isArray(data.photos)) {
        setPhotos(data.photos);
      }
      if (Array.isArray(data.galleries)) {
        setGalleries(data.galleries);
      }
      if (Array.isArray(data.groceries)) {
        setGroceries(sanitizeAndDeduplicateGroceries(data.groceries));
      }
      if (Array.isArray(data.chores)) {
        setChores(data.chores);
      }
      if (data.earnedStars && typeof data.earnedStars === 'object') {
        setEarnedStars(data.earnedStars);
      }
      if (Array.isArray(data.notes)) {
        setNotes(data.notes);
      }
      if (Array.isArray(data.stores)) {
        setStores(data.stores);
      }
      if (data.storeLearningMap && typeof data.storeLearningMap === 'object') {
        setStoreLearningMap(data.storeLearningMap);
      }
      if (Array.isArray(data.alwaysInStock)) {
        setAlwaysInStock(data.alwaysInStock);
      }
      if (Array.isArray(data.rewards)) {
        setRewards(data.rewards);
      }
      if (Array.isArray(data.rewardClaims)) {
        setRewardClaims(data.rewardClaims);
      }
      setIsOnboarded(true);
      localStorage.setItem(STORAGE_KEYS.IS_ONBOARDED, 'true');
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Invalid JSON file format' };
    }
  };

  return (
    <FamilyContext.Provider
      value={{
        members,
        loggedInMemberId,
        loggedInMember,
        login,
        logout,
        currentMemberId,
        setCurrentMemberId,
        currentMember,
        addMember,
        updateMember,
        deleteMember,
        appointments,
        addAppointment,
        updateAppointment,
        deleteAppointment,
        recipes,
        addRecipe,
        updateRecipe,
        deleteRecipe,
        toggleFavoriteRecipe,
        mealPlans,
        setMealSlot,
        addRecipeIngredientsToGrocery,
        addMultipleRecipesToGrocery,
        removeGroceriesForMeal,
        clearGroceriesForDates,
        cleanPastMealGroceries,
        photos,
        addPhoto,
        togglePhotoLike,
        deletePhoto,
        galleries,
        createGallery,
        addPhotosToGallery,
        deleteGallery,
        deletePhotoFromGallery,
        toggleGalleryPhotoLike,
        addGuestReaction,
        toggleGalleryShare,
        stores,
        addStore,
        groceries,
        addGrocery,
        toggleGrocery,
        deleteGrocery,
        clearCheckedGroceries,
        setItemStore,
        deduplicateGroceries,
        storeLearningMap,
        alwaysInStock,
        toggleAlwaysInStock,
        isItemInStock,
        chores,
        addChore,
        updateChore,
        toggleChore,
        deleteChore,
        rewards,
        rewardClaims,
        addReward,
        deleteReward,
        claimReward,
        approveClaim,
        deleteClaim,
        getMemberStarBalance,
        getMemberTotalEarnedStars,
        addMemberStars,
        notes,
        addNote,
        deleteNote,
        resetToDefaults,
        isOnboarded,
        completeOnboarding,
        loadDemoData,
        resetToFreshStart,
        isDarkMode,
        toggleDarkMode,
        familyName,
        setFamilyName,
        exportAllData,
        importAllData,
      }}
    >
      {children}
    </FamilyContext.Provider>
  );
};

export const useFamily = () => {
  const context = useContext(FamilyContext);
  if (!context) {
    throw new Error('useFamily must be used within a FamilyProvider');
  }
  return context;
};
