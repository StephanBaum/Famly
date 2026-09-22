import { useState, useEffect } from 'react';
import { STORAGE_KEYS, getStoredOrDefault } from '../storageKeys';
import {
  AIConfig,
  AIProvider,
  getAIConfig,
  saveAIConfig as saveLocalAIConfig,
  clearAIConfig as clearLocalAIConfig,
} from '../../services/aiRecipeService';
import {
  FamilyMemory,
  getFamilyMemories,
  addFamilyMemory,
  deleteFamilyMemory,
} from '../../services/familyMemoryService';

export function useFamilyIdentitySlice() {
  const [isOnboarded, setIsOnboarded] = useState<boolean>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.IS_ONBOARDED);
    if (stored !== null) {
      return stored === 'true';
    }
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

  const [aiConfig, setAiConfigState] = useState<AIConfig | null>(() => getAIConfig());

  const saveAIConfig = (provider: AIProvider, apiKey: string) => {
    saveLocalAIConfig(provider, apiKey);
    setAiConfigState({ provider, apiKey });
  };

  const clearAIConfig = () => {
    clearLocalAIConfig();
    setAiConfigState(null);
  };

  // Long-Term Family Memories State (Cross-Device Vector & Redis Sync)
  const [memories, setMemories] = useState<FamilyMemory[]>(() => getFamilyMemories());

  useEffect(() => {
    const handleMemoryChange = () => {
      setMemories(getFamilyMemories());
    };
    window.addEventListener('famly_memory_changed', handleMemoryChange);
    return () => window.removeEventListener('famly_memory_changed', handleMemoryChange);
  }, []);

  const addMemory = (text: string, category: FamilyMemory['category'] = 'general', importance = 3) => {
    const newMem = addFamilyMemory(text, category, importance);
    setMemories(getFamilyMemories());
    return newMem;
  };

  const deleteMemory = (id: string) => {
    deleteFamilyMemory(id);
    setMemories(getFamilyMemories());
  };

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

  const [familyRegion, setFamilyRegionState] = useState<string>(() => {
    const stored = getStoredOrDefault<string | null>(STORAGE_KEYS.FAMILY_REGION, null);
    if (stored !== null && typeof stored === 'string') return stored;
    return 'München & Umland';
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

  const setFamilyRegion = (region: string) => {
    const clean = region.trim() || 'München & Umland';
    setFamilyRegionState(clean);
    localStorage.setItem(STORAGE_KEYS.FAMILY_REGION, JSON.stringify(clean));
  };

  return {
    isOnboarded,
    setIsOnboarded,
    aiConfig,
    setAiConfigState,
    saveAIConfig,
    clearAIConfig,
    memories,
    setMemories,
    addMemory,
    deleteMemory,
    isDarkMode,
    toggleDarkMode,
    familyName,
    setFamilyName,
    setFamilyNameState,
    familyRegion,
    setFamilyRegion,
    setFamilyRegionState,
  };
}
