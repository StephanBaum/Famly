import React, { createContext, useContext, useRef } from 'react';
import {
  FamilyContextType,
  RecipeSyncResult,
  BatchRecipeSyncResult,
} from './types';
import {
  detectIsPerishable,
  sanitizeAndDeduplicateGroceries,
} from '../utils/grocerySyncUtils';
import {
  STORAGE_KEYS,
  INITIAL_REWARDS,
  getStoredOrDefault,
} from './storageKeys';

import { useMembersSlice } from './slices/useMembersSlice';
import { useAppointmentsSlice } from './slices/useAppointmentsSlice';
import { useGroceriesStoresSlice } from './slices/useGroceriesStoresSlice';
import { useRecipesMealPlanSlice } from './slices/useRecipesMealPlanSlice';
import { usePhotosGalleriesSlice } from './slices/usePhotosGalleriesSlice';
import { useChoresRewardsSlice } from './slices/useChoresRewardsSlice';
import { useNotesSlice } from './slices/useNotesSlice';
import { useFamilyIdentitySlice } from './slices/useFamilyIdentitySlice';
import { useFamilySync } from './slices/useFamilySync';

// Re-exports for backward compatibility
export { detectIsPerishable, sanitizeAndDeduplicateGroceries };
export { STORAGE_KEYS, INITIAL_REWARDS, getStoredOrDefault };
export type { FamilyContextType, RecipeSyncResult, BatchRecipeSyncResult };

const FamilyContext = createContext<FamilyContextType | null>(null);

export const FamilyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Ref for bridging awardStars to earnedStars before chores slice is initialized
  const addMemberStarsRef = useRef<(memberId: string, delta: number) => void>(() => {});

  // 1. Members & Auth
  const membersSlice = useMembersSlice({
    onAwardStars: (memberId, delta) => addMemberStarsRef.current(memberId, delta),
  });

  const fallbackMemberId = membersSlice.members[0]?.id;

  // 2. Chores & Rewards
  const choresSlice = useChoresRewardsSlice({
    currentMemberId: membersSlice.currentMemberId,
    setMembers: membersSlice.setMembers,
  });
  addMemberStarsRef.current = choresSlice.addMemberStars;

  // 3. Appointments
  const appointmentsSlice = useAppointmentsSlice();

  // 4. Groceries & Stores
  const groceriesSlice = useGroceriesStoresSlice({
    currentMemberId: membersSlice.currentMemberId,
    fallbackMemberId,
  });

  // 5. Recipes & Meal Plan
  const recipesSlice = useRecipesMealPlanSlice({
    setGroceries: groceriesSlice.setGroceries,
    currentMemberId: membersSlice.currentMemberId,
    fallbackMemberId,
    storeLearningMap: groceriesSlice.storeLearningMap,
    isItemInStock: groceriesSlice.isItemInStock,
  });

  // 6. Photos & Galleries
  const photosSlice = usePhotosGalleriesSlice({
    currentMemberId: membersSlice.currentMemberId,
    fallbackMemberId,
  });

  // 7. Notes
  const notesSlice = useNotesSlice({
    currentMemberId: membersSlice.currentMemberId,
    fallbackMemberId,
  });

  // 8. Identity, Theme & Settings
  const identitySlice = useFamilyIdentitySlice();

  // 9. Cloud Sync & Lifecycle Data Management
  const syncSlice = useFamilySync({
    members: membersSlice.members,
    setMembers: membersSlice.setMembers,
    loggedInMemberId: membersSlice.loggedInMemberId,
    setLoggedInMemberId: membersSlice.setLoggedInMemberId,
    setCurrentMemberId: membersSlice.setCurrentMemberId,
    appointments: appointmentsSlice.appointments,
    setAppointments: appointmentsSlice.setAppointments,
    recipes: recipesSlice.recipes,
    setRecipes: recipesSlice.setRecipes,
    mealPlans: recipesSlice.mealPlans,
    setMealPlans: recipesSlice.setMealPlans,
    photos: photosSlice.photos,
    setPhotos: photosSlice.setPhotos,
    galleries: photosSlice.galleries,
    setGalleries: photosSlice.setGalleries,
    groceries: groceriesSlice.groceries,
    setGroceries: groceriesSlice.setGroceries,
    chores: choresSlice.chores,
    setChores: choresSlice.setChores,
    notes: notesSlice.notes,
    setNotes: notesSlice.setNotes,
    rewards: choresSlice.rewards,
    setRewards: choresSlice.setRewards,
    rewardClaims: choresSlice.rewardClaims,
    setRewardClaims: choresSlice.setRewardClaims,
    earnedStars: choresSlice.earnedStars,
    setEarnedStars: choresSlice.setEarnedStars,
    stores: groceriesSlice.stores,
    setStores: groceriesSlice.setStores,
    storeLearningMap: groceriesSlice.storeLearningMap,
    setStoreLearningMap: groceriesSlice.setStoreLearningMap,
    alwaysInStock: groceriesSlice.alwaysInStock,
    setAlwaysInStock: groceriesSlice.setAlwaysInStock,
    familyName: identitySlice.familyName,
    setFamilyName: identitySlice.setFamilyName,
    setFamilyNameState: identitySlice.setFamilyNameState,
    familyRegion: identitySlice.familyRegion,
    setFamilyRegion: identitySlice.setFamilyRegion,
    aiConfig: identitySlice.aiConfig,
    setAiConfigState: identitySlice.setAiConfigState,
    memories: identitySlice.memories,
    setMemories: identitySlice.setMemories,
    setIsOnboarded: identitySlice.setIsOnboarded,
  });

  const value: FamilyContextType = {
    // Members
    members: membersSlice.members,
    loggedInMemberId: membersSlice.loggedInMemberId,
    loggedInMember: membersSlice.loggedInMember,
    login: membersSlice.login,
    logout: membersSlice.logout,
    currentMemberId: membersSlice.currentMemberId,
    setCurrentMemberId: membersSlice.setCurrentMemberId,
    currentMember: membersSlice.currentMember,
    addMember: membersSlice.addMember,
    updateMember: membersSlice.updateMember,
    deleteMember: membersSlice.deleteMember,
    awardStars: membersSlice.awardStars,

    // Appointments
    appointments: appointmentsSlice.appointments,
    addAppointment: appointmentsSlice.addAppointment,
    updateAppointment: appointmentsSlice.updateAppointment,
    deleteAppointment: appointmentsSlice.deleteAppointment,

    // Recipes & Meal Planning
    recipes: recipesSlice.recipes,
    addRecipe: recipesSlice.addRecipe,
    updateRecipe: recipesSlice.updateRecipe,
    deleteRecipe: recipesSlice.deleteRecipe,
    toggleFavoriteRecipe: recipesSlice.toggleFavoriteRecipe,
    mealPlans: recipesSlice.mealPlans,
    setMealSlot: recipesSlice.setMealSlot,
    addRecipeIngredientsToGrocery: recipesSlice.addRecipeIngredientsToGrocery,
    addMultipleRecipesToGrocery: recipesSlice.addMultipleRecipesToGrocery,
    removeGroceriesForMeal: recipesSlice.removeGroceriesForMeal,
    clearGroceriesForDates: recipesSlice.clearGroceriesForDates,
    cleanPastMealGroceries: recipesSlice.cleanPastMealGroceries,

    // Photos & Galleries
    photos: photosSlice.photos,
    addPhoto: photosSlice.addPhoto,
    togglePhotoLike: photosSlice.togglePhotoLike,
    deletePhoto: photosSlice.deletePhoto,
    galleries: photosSlice.galleries,
    createGallery: photosSlice.createGallery,
    addPhotosToGallery: photosSlice.addPhotosToGallery,
    deleteGallery: photosSlice.deleteGallery,
    deletePhotoFromGallery: photosSlice.deletePhotoFromGallery,
    toggleGalleryPhotoLike: photosSlice.toggleGalleryPhotoLike,
    addGuestReaction: photosSlice.addGuestReaction,
    toggleGalleryShare: photosSlice.toggleGalleryShare,

    // Stores & Groceries
    stores: groceriesSlice.stores,
    addStore: groceriesSlice.addStore,
    groceries: groceriesSlice.groceries,
    addGrocery: groceriesSlice.addGrocery,
    toggleGrocery: groceriesSlice.toggleGrocery,
    deleteGrocery: groceriesSlice.deleteGrocery,
    clearCheckedGroceries: groceriesSlice.clearCheckedGroceries,
    setItemStore: groceriesSlice.setItemStore,
    deduplicateGroceries: groceriesSlice.deduplicateGroceries,
    storeLearningMap: groceriesSlice.storeLearningMap,
    alwaysInStock: groceriesSlice.alwaysInStock,
    toggleAlwaysInStock: groceriesSlice.toggleAlwaysInStock,
    isItemInStock: groceriesSlice.isItemInStock,

    // Chores & Rewards
    chores: choresSlice.chores,
    addChore: choresSlice.addChore,
    updateChore: choresSlice.updateChore,
    toggleChore: choresSlice.toggleChore,
    deleteChore: choresSlice.deleteChore,
    rewards: choresSlice.rewards,
    rewardClaims: choresSlice.rewardClaims,
    addReward: choresSlice.addReward,
    deleteReward: choresSlice.deleteReward,
    claimReward: choresSlice.claimReward,
    approveClaim: choresSlice.approveClaim,
    deleteClaim: choresSlice.deleteClaim,
    getMemberStarBalance: choresSlice.getMemberStarBalance,
    getMemberTotalEarnedStars: choresSlice.getMemberTotalEarnedStars,
    addMemberStars: choresSlice.addMemberStars,

    // Notes
    notes: notesSlice.notes,
    addNote: notesSlice.addNote,
    deleteNote: notesSlice.deleteNote,

    // Lifecycle & Settings
    resetToDefaults: syncSlice.resetToDefaults,
    isOnboarded: identitySlice.isOnboarded,
    completeOnboarding: syncSlice.completeOnboarding,
    loadDemoData: syncSlice.loadDemoData,
    resetToFreshStart: syncSlice.resetToFreshStart,
    isDarkMode: identitySlice.isDarkMode,
    toggleDarkMode: identitySlice.toggleDarkMode,
    familyName: identitySlice.familyName,
    setFamilyName: identitySlice.setFamilyName,
    familyRegion: identitySlice.familyRegion,
    setFamilyRegion: identitySlice.setFamilyRegion,
    joinFamilyFromCloud: syncSlice.joinFamilyFromCloud,
    exportAllData: syncSlice.exportAllData,
    importAllData: syncSlice.importAllData,
    aiConfig: identitySlice.aiConfig,
    saveAIConfig: identitySlice.saveAIConfig,
    clearAIConfig: identitySlice.clearAIConfig,
    memories: identitySlice.memories,
    addMemory: identitySlice.addMemory,
    deleteMemory: identitySlice.deleteMemory,
  };

  return (
    <FamilyContext.Provider value={value}>
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
