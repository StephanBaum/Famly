import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  FamilyMember,
  Appointment,
  Recipe,
  MealPlanDay,
  PhotoMemory,
  GalleryAlbum,
  GroceryItem,
  Chore,
  PinnedNote,
  StoreDefinition,
  Reward,
  RewardClaim,
} from '../../types';
import {
  checkVercelStorageStatus,
  pullVercelFamilyState,
  pushVercelFamilyStateDebounced,
  startVercelSyncListener,
} from '../../services/vercelSync';
import { AIConfig, setSharedAIConfig } from '../../services/aiRecipeService';
import {
  FamilyMemory,
  saveRemoteMemoriesToLocal,
} from '../../services/familyMemoryService';
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
} from '../../utils/initialData';
import {
  sanitizeAndDeduplicateGroceries,
  cleanPastMealGroceries as cleanPastMealGroceriesUtil,
} from '../../utils/grocerySyncUtils';
import { STORAGE_KEYS, INITIAL_REWARDS } from '../storageKeys';

interface UseFamilySyncProps {
  members: FamilyMember[];
  setMembers: React.Dispatch<React.SetStateAction<FamilyMember[]>>;
  loggedInMemberId: string | null;
  setLoggedInMemberId: React.Dispatch<React.SetStateAction<string | null>>;
  setCurrentMemberId: React.Dispatch<React.SetStateAction<string | 'all'>>;
  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  recipes: Recipe[];
  setRecipes: React.Dispatch<React.SetStateAction<Recipe[]>>;
  mealPlans: MealPlanDay[];
  setMealPlans: React.Dispatch<React.SetStateAction<MealPlanDay[]>>;
  photos: PhotoMemory[];
  setPhotos: React.Dispatch<React.SetStateAction<PhotoMemory[]>>;
  galleries: GalleryAlbum[];
  setGalleries: React.Dispatch<React.SetStateAction<GalleryAlbum[]>>;
  groceries: GroceryItem[];
  setGroceries: React.Dispatch<React.SetStateAction<GroceryItem[]>>;
  chores: Chore[];
  setChores: React.Dispatch<React.SetStateAction<Chore[]>>;
  notes: PinnedNote[];
  setNotes: React.Dispatch<React.SetStateAction<PinnedNote[]>>;
  rewards: Reward[];
  setRewards: React.Dispatch<React.SetStateAction<Reward[]>>;
  rewardClaims: RewardClaim[];
  setRewardClaims: React.Dispatch<React.SetStateAction<RewardClaim[]>>;
  earnedStars: Record<string, number>;
  setEarnedStars: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  stores: StoreDefinition[];
  setStores: React.Dispatch<React.SetStateAction<StoreDefinition[]>>;
  storeLearningMap: Record<string, string>;
  setStoreLearningMap: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  alwaysInStock: string[];
  setAlwaysInStock: React.Dispatch<React.SetStateAction<string[]>>;
  familyName: string;
  setFamilyName: (name: string) => void;
  setFamilyNameState: React.Dispatch<React.SetStateAction<string>>;
  familyRegion: string;
  setFamilyRegion: (region: string) => void;
  aiConfig: AIConfig | null;
  setAiConfigState: React.Dispatch<React.SetStateAction<AIConfig | null>>;
  memories: FamilyMemory[];
  setMemories: React.Dispatch<React.SetStateAction<FamilyMemory[]>>;
  setIsOnboarded: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useFamilySync(props: UseFamilySyncProps) {
  const {
    members,
    setMembers,
    setLoggedInMemberId,
    setCurrentMemberId,
    appointments,
    setAppointments,
    recipes,
    setRecipes,
    mealPlans,
    setMealPlans,
    photos,
    setPhotos,
    galleries,
    setGalleries,
    groceries,
    setGroceries,
    chores,
    setChores,
    notes,
    setNotes,
    rewards,
    setRewards,
    rewardClaims,
    setRewardClaims,
    earnedStars,
    setEarnedStars,
    stores,
    setStores,
    storeLearningMap,
    setStoreLearningMap,
    alwaysInStock,
    setAlwaysInStock,
    familyName,
    setFamilyName,
    setFamilyNameState,
    familyRegion,
    setFamilyRegion,
    aiConfig,
    setAiConfigState,
    memories,
    setMemories,
    setIsOnboarded,
  } = props;

  // Vercel Storage (Upstash Redis) Out-of-the-Box Sync
  useEffect(() => {
    let isMounted = true;

    // Initial check & pull
    checkVercelStorageStatus().then((status) => {
      if (status.isAvailable && isMounted) {
        pullVercelFamilyState().then((res) => {
          if (res.success && res.data && isMounted) {
            if (res.data.familyName && typeof res.data.familyName === 'string') {
              setFamilyName(res.data.familyName);
            }
            if (Array.isArray(res.data.members) && res.data.members.length > 0) {
              setMembers(res.data.members);
              setIsOnboarded(true);
              localStorage.setItem(STORAGE_KEYS.IS_ONBOARDED, 'true');
            }
            if (Array.isArray(res.data.galleries) && res.data.galleries.length > 0) setGalleries(res.data.galleries);
            if (Array.isArray(res.data.photos)) setPhotos(res.data.photos);
            if (Array.isArray(res.data.appointments)) setAppointments(res.data.appointments);
            if (Array.isArray(res.data.recipes) && res.data.recipes.length > 0) setRecipes(res.data.recipes);
            if (Array.isArray(res.data.mealPlans)) setMealPlans(res.data.mealPlans);
            if (Array.isArray(res.data.groceries)) {
              const sanitized = sanitizeAndDeduplicateGroceries(res.data.groceries);
              const { updatedGroceries } = cleanPastMealGroceriesUtil(sanitized);
              setGroceries(updatedGroceries);
            }
            if (Array.isArray(res.data.chores)) setChores(res.data.chores);
            if (Array.isArray(res.data.notes)) setNotes(res.data.notes);
            if (Array.isArray(res.data.rewards)) setRewards(res.data.rewards);
            if (Array.isArray(res.data.memories) && res.data.memories.length > 0) {
              const merged = saveRemoteMemoriesToLocal(res.data.memories);
              setMemories(merged);
            }
            if (res.data.aiConfig && typeof res.data.aiConfig === 'object' && res.data.aiConfig.apiKey) {
              setSharedAIConfig(res.data.aiConfig);
              setAiConfigState(res.data.aiConfig);
            }
          }
        });
      }
    });

    // Background listener across tabs / devices
    const unsubscribe = startVercelSyncListener((remoteData) => {
      if (!isMounted || !remoteData) return;
      if (remoteData.familyName && typeof remoteData.familyName === 'string') {
        setFamilyName(remoteData.familyName);
      }
      if (remoteData.familyRegion && typeof remoteData.familyRegion === 'string') {
        setFamilyRegion(remoteData.familyRegion);
      }
      if (Array.isArray(remoteData.members) && remoteData.members.length > 0) {
        setMembers(remoteData.members);
        setIsOnboarded(true);
        localStorage.setItem(STORAGE_KEYS.IS_ONBOARDED, 'true');
      }
      if (Array.isArray(remoteData.galleries)) setGalleries(remoteData.galleries);
      if (Array.isArray(remoteData.photos)) setPhotos(remoteData.photos);
      if (Array.isArray(remoteData.appointments)) setAppointments(remoteData.appointments);
      if (Array.isArray(remoteData.recipes) && remoteData.recipes.length > 0) setRecipes(remoteData.recipes);
      if (Array.isArray(remoteData.mealPlans)) setMealPlans(remoteData.mealPlans);
      if (Array.isArray(remoteData.groceries)) {
        const sanitized = sanitizeAndDeduplicateGroceries(remoteData.groceries);
        const { updatedGroceries } = cleanPastMealGroceriesUtil(sanitized);
        setGroceries(updatedGroceries);
      }
      if (Array.isArray(remoteData.chores)) setChores(remoteData.chores);
      if (Array.isArray(remoteData.notes)) setNotes(remoteData.notes);
      if (Array.isArray(remoteData.rewards)) setRewards(remoteData.rewards);
      if (Array.isArray(remoteData.memories) && remoteData.memories.length > 0) {
        const merged = saveRemoteMemoriesToLocal(remoteData.memories);
        setMemories(merged);
      }
      if (remoteData.aiConfig && typeof remoteData.aiConfig === 'object' && remoteData.aiConfig.apiKey) {
        setSharedAIConfig(remoteData.aiConfig);
        setAiConfigState(remoteData.aiConfig);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Auto-push state to Vercel Storage on changes (debounced)
  useEffect(() => {
    if (members.length === 0) return;
    pushVercelFamilyStateDebounced({
      familyName,
      familyRegion,
      members,
      appointments,
      recipes,
      mealPlans,
      photos,
      galleries,
      groceries,
      chores,
      notes,
      rewards,
      earnedStars,
      aiConfig,
      memories,
    });
  }, [familyName, familyRegion, members, appointments, recipes, mealPlans, photos, galleries, groceries, chores, notes, rewards, earnedStars, aiConfig, memories]);

  const joinFamilyFromCloud = async (): Promise<boolean> => {
    try {
      const res = await pullVercelFamilyState();
      if (res.success && res.data && Array.isArray(res.data.members) && res.data.members.length > 0) {
        if (res.data.familyName) setFamilyName(res.data.familyName);
        setMembers(res.data.members);
        if (Array.isArray(res.data.galleries)) setGalleries(res.data.galleries);
        if (Array.isArray(res.data.photos)) setPhotos(res.data.photos);
        if (Array.isArray(res.data.appointments)) setAppointments(res.data.appointments);
        if (Array.isArray(res.data.recipes)) setRecipes(res.data.recipes);
        if (Array.isArray(res.data.mealPlans)) setMealPlans(res.data.mealPlans);
        if (Array.isArray(res.data.groceries)) {
          const sanitized = sanitizeAndDeduplicateGroceries(res.data.groceries);
          const { updatedGroceries } = cleanPastMealGroceriesUtil(sanitized);
          setGroceries(updatedGroceries);
        }
        if (Array.isArray(res.data.chores)) setChores(res.data.chores);
        if (Array.isArray(res.data.notes)) setNotes(res.data.notes);
        if (Array.isArray(res.data.rewards)) setRewards(res.data.rewards);
        if (Array.isArray(res.data.memories) && res.data.memories.length > 0) {
          const merged = saveRemoteMemoriesToLocal(res.data.memories);
          setMemories(merged);
        }
        if (res.data.aiConfig && typeof res.data.aiConfig === 'object' && res.data.aiConfig.apiKey) {
          setSharedAIConfig(res.data.aiConfig);
          setAiConfigState(res.data.aiConfig);
        }
        setIsOnboarded(true);
        localStorage.setItem(STORAGE_KEYS.IS_ONBOARDED, 'true');
        return true;
      }
    } catch (e) {
      console.warn('joinFamilyFromCloud error:', e);
    }
    return false;
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

  const resetToDefaults = () => {
    loadDemoData();
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
      familyRegion,
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

  return {
    joinFamilyFromCloud,
    loadDemoData,
    resetToDefaults,
    completeOnboarding,
    resetToFreshStart,
    exportAllData,
    importAllData,
  };
}
