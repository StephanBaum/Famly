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
} from '../types';
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

export interface RecipeSyncResult {
  addedCount: number;
  skippedCount: number;
  skippedNames: string[];
}

interface FamilyContextType {
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
  
  appointments: Appointment[];
  addAppointment: (app: Omit<Appointment, 'id'>) => void;
  updateAppointment: (id: string, updates: Partial<Appointment>) => void;
  deleteAppointment: (id: string) => void;

  recipes: Recipe[];
  addRecipe: (recipe: Omit<Recipe, 'id'>) => Recipe;
  updateRecipe: (id: string, updates: Partial<Recipe>) => void;
  deleteRecipe: (id: string) => void;

  mealPlans: MealPlanDay[];
  setMealSlot: (
    date: string,
    slot: 'breakfast' | 'lunch' | 'dinner',
    data: { title: string; recipeId?: string; chefId?: string }
  ) => void;
  addRecipeIngredientsToGrocery: (recipe: Recipe) => RecipeSyncResult;

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

  // Store & Pantry Staples Learning
  storeLearningMap: Record<string, string>;
  alwaysInStock: string[];
  toggleAlwaysInStock: (name: string) => void;
  isItemInStock: (name: string) => boolean;

  chores: Chore[];
  addChore: (title: string, assignedMemberId: string, frequency: Chore['frequency'], stars: number) => void;
  toggleChore: (id: string) => void;
  deleteChore: (id: string) => void;

  notes: PinnedNote[];
  addNote: (title: string, content: string, tag: PinnedNote['tag'], isPinned?: boolean) => void;
  deleteNote: (id: string) => void;

  resetToDefaults: () => void;
}

const FamilyContext = createContext<FamilyContextType | null>(null);

const STORAGE_KEYS = {
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
};

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
  const [loggedInMemberId, setLoggedInMemberId] = useState<string | null>(() =>
    getStoredOrDefault<string | null>(STORAGE_KEYS.LOGGED_IN_MEMBER, null)
  );
  const [members, setMembers] = useState<FamilyMember[]>(() =>
    getStoredOrDefault(STORAGE_KEYS.MEMBERS, INITIAL_MEMBERS)
  );
  const [currentMemberId, setCurrentMemberId] = useState<string | 'all'>(() =>
    getStoredOrDefault(STORAGE_KEYS.ACTIVE_MEMBER, 'all')
  );
  const [appointments, setAppointments] = useState<Appointment[]>(() =>
    getStoredOrDefault(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS)
  );
  const [recipes, setRecipes] = useState<Recipe[]>(() =>
    getStoredOrDefault(STORAGE_KEYS.RECIPES, INITIAL_RECIPES)
  );
  const [mealPlans, setMealPlans] = useState<MealPlanDay[]>(() =>
    getStoredOrDefault(STORAGE_KEYS.MEAL_PLANS, INITIAL_MEAL_PLANS)
  );
  const [photos, setPhotos] = useState<PhotoMemory[]>(() =>
    getStoredOrDefault(STORAGE_KEYS.PHOTOS, INITIAL_PHOTOS)
  );
  const [galleries, setGalleries] = useState<GalleryAlbum[]>(() =>
    getStoredOrDefault(STORAGE_KEYS.GALLERIES, INITIAL_GALLERIES)
  );
  const [groceries, setGroceries] = useState<GroceryItem[]>(() =>
    getStoredOrDefault(STORAGE_KEYS.GROCERIES, INITIAL_GROCERIES)
  );
  const [chores, setChores] = useState<Chore[]>(() =>
    getStoredOrDefault(STORAGE_KEYS.CHORES, INITIAL_CHORES)
  );
  const [notes, setNotes] = useState<PinnedNote[]>(() =>
    getStoredOrDefault(STORAGE_KEYS.NOTES, INITIAL_NOTES)
  );

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

  // Appointments
  const addAppointment = (app: Omit<Appointment, 'id'>) => {
    const newApp: Appointment = {
      ...app,
      id: `a_${Date.now()}`,
    };
    setAppointments((prev) => [...prev, newApp]);
  };

  const updateAppointment = (id: string, updates: Partial<Appointment>) => {
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
  };

  const deleteAppointment = (id: string) => {
    setAppointments((prev) => prev.filter((a) => a.id !== id));
  };

  // Recipes & Meal planning
  const addRecipe = (rec: Omit<Recipe, 'id'>): Recipe => {
    const newRec: Recipe = {
      ...rec,
      id: `r_${Date.now()}`,
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

  // Helper to predict store from learned preferences or keywords
  const predictStoreForItem = (name: string): string => {
    const clean = name.toLowerCase().trim();
    // Check direct learned mapping
    if (storeLearningMap[clean]) {
      return storeLearningMap[clean];
    }
    // Check partial learned mapping
    for (const [key, storeName] of Object.entries(storeLearningMap)) {
      if (clean.includes(key) || key.includes(clean)) {
        return storeName;
      }
    }
    // Keyword heuristics for typical German/European household runs
    if (
      clean.includes('pod') ||
      clean.includes('detergent') ||
      clean.includes('shampoo') ||
      clean.includes('soap') ||
      clean.includes('toothpaste') ||
      clean.includes('paper towel') ||
      clean.includes('toilet') ||
      clean.includes('cleaning') ||
      clean.includes('sponge') ||
      clean.includes('wipes')
    ) {
      return 'dm';
    }
    if (clean.includes('bread') || clean.includes('loaf') || clean.includes('croissant') || clean.includes('baguette')) {
      return 'Bakery';
    }
    if (clean.includes('vitamin') || clean.includes('bandage') || clean.includes('aspirin') || clean.includes('medicine')) {
      return 'Pharmacy';
    }
    return 'Rewe'; // Default supermarket
  };

  const addRecipeIngredientsToGrocery = (recipe: Recipe): RecipeSyncResult => {
    const toAdd: GroceryItem[] = [];
    const skippedNames: string[] = [];

    recipe.ingredients.forEach((ing: Ingredient, idx) => {
      if (isItemInStock(ing.name)) {
        skippedNames.push(ing.name);
      } else {
        const assignedStore = predictStoreForItem(ing.name);
        toAdd.push({
          id: `g_${Date.now()}_${idx}`,
          name: ing.name,
          amount: ing.amount,
          store: assignedStore,
          category: ing.category,
          checked: false,
          addedByMemberId: currentMemberId === 'all' ? members[0]?.id : currentMemberId,
        });
      }
    });

    if (toAdd.length > 0) {
      setGroceries((prev) => [...toAdd, ...prev]);
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

    const newItem: GroceryItem = {
      id: `g_${Date.now()}`,
      name: name.trim(),
      store: assignedStore,
      category: category || 'produce',
      amount: amount || '',
      checked: false,
      addedByMemberId: currentMemberId === 'all' ? members[0]?.id : currentMemberId,
    };
    setGroceries((prev) => [newItem, ...prev]);
  };

  const toggleGrocery = (id: string) => {
    setGroceries((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const deleteGrocery = (id: string) => {
    setGroceries((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCheckedGroceries = (storeFilter?: string) => {
    setGroceries((prev) =>
      prev.filter((item) => {
        if (!item.checked) return true;
        if (storeFilter && item.store !== storeFilter) return true;
        return false;
      })
    );
  };

  // Chores
  const addChore = (
    title: string,
    assignedMemberId: string,
    frequency: Chore['frequency'],
    stars: number
  ) => {
    const newChore: Chore = {
      id: `c_${Date.now()}`,
      title,
      assignedMemberId,
      frequency,
      completed: false,
      stars,
    };
    setChores((prev) => [newChore, ...prev]);
  };

  const toggleChore = (id: string) => {
    setChores((prev) =>
      prev.map((chore) => {
        if (chore.id === id) {
          const newCompleted = !chore.completed;
          if (newCompleted) {
            confetti({
              particleCount: 60,
              spread: 60,
              origin: { y: 0.6 },
              colors: ['#F59E0B', '#10B981', '#6366F1', '#EC4899'],
            });
          }
          return { ...chore, completed: newCompleted };
        }
        return chore;
      })
    );
  };

  const deleteChore = (id: string) => {
    setChores((prev) => prev.filter((chore) => chore.id !== id));
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
    setMembers(INITIAL_MEMBERS);
    setCurrentMemberId('all');
    setAppointments(INITIAL_APPOINTMENTS);
    setRecipes(INITIAL_RECIPES);
    setMealPlans(INITIAL_MEAL_PLANS);
    setPhotos(INITIAL_PHOTOS);
    setGalleries(INITIAL_GALLERIES);
    setGroceries(INITIAL_GROCERIES);
    setChores(INITIAL_CHORES);
    setNotes(INITIAL_NOTES);
    setStores(INITIAL_STORES);
    setStoreLearningMap(INITIAL_STORE_LEARNING_MAP);
    setAlwaysInStock(INITIAL_ALWAYS_IN_STOCK);
    setLoggedInMemberId(null);
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
        appointments,
        addAppointment,
        updateAppointment,
        deleteAppointment,
        recipes,
        addRecipe,
        updateRecipe,
        deleteRecipe,
        mealPlans,
        setMealSlot,
        addRecipeIngredientsToGrocery,
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
        storeLearningMap,
        alwaysInStock,
        toggleAlwaysInStock,
        isItemInStock,
        chores,
        addChore,
        toggleChore,
        deleteChore,
        notes,
        addNote,
        deleteNote,
        resetToDefaults,
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
