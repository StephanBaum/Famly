import {
  FamilyMember,
  Appointment,
  Recipe,
  MealPlanDay,
  PhotoMemory,
  GalleryAlbum,
  PhotoItem,
  GroceryItem,
  Chore,
  PinnedNote,
  StoreDefinition,
  Reward,
  RewardClaim,
} from '../types';
import { AIConfig, AIProvider } from '../services/aiRecipeService';
import { FamilyMemory } from '../services/familyMemoryService';
import { RecipeSyncResult, BatchRecipeSyncResult } from './storageKeys';

export type { RecipeSyncResult, BatchRecipeSyncResult };

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
  awardStars: (memberId: string, count: number) => void;

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
  familyRegion: string;
  setFamilyRegion: (region: string) => void;
  joinFamilyFromCloud: () => Promise<boolean>;

  // Data Management
  exportAllData: () => string;
  importAllData: (jsonData: string) => { success: boolean; error?: string };

  // Shared Family AI Config
  aiConfig: AIConfig | null;
  saveAIConfig: (provider: AIProvider, apiKey: string) => void;
  clearAIConfig: () => void;

  // Long-Term Family Memories (Cross-Device Vector & Redis Sync)
  memories: FamilyMemory[];
  addMemory: (text: string, category?: FamilyMemory['category'], importance?: number) => FamilyMemory;
  deleteMemory: (id: string) => void;
}
