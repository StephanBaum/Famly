import { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { GroceryItem, StoreDefinition } from '../../types';
import {
  INITIAL_STORES,
  INITIAL_STORE_LEARNING_MAP,
  INITIAL_ALWAYS_IN_STOCK,
} from '../../utils/initialData';
import {
  predictStoreForItem,
  sanitizeAndDeduplicateGroceries,
  cleanPastMealGroceries as cleanPastMealGroceriesUtil,
} from '../../utils/grocerySyncUtils';
import { STORAGE_KEYS, getStoredOrDefault } from '../storageKeys';

interface UseGroceriesStoresSliceOptions {
  currentMemberId: string | 'all';
  fallbackMemberId?: string;
}

export function useGroceriesStoresSlice({
  currentMemberId,
  fallbackMemberId,
}: UseGroceriesStoresSliceOptions) {
  const [groceries, setGroceries] = useState<GroceryItem[]>(() => {
    const stored = getStoredOrDefault<GroceryItem[] | null>(STORAGE_KEYS.GROCERIES, null);
    if (stored !== null) {
      const sanitized = sanitizeAndDeduplicateGroceries(stored);
      const { updatedGroceries } = cleanPastMealGroceriesUtil(sanitized);
      return updatedGroceries;
    }
    return [];
  });

  const [stores, setStores] = useState<StoreDefinition[]>(() =>
    getStoredOrDefault(STORAGE_KEYS.STORES, INITIAL_STORES)
  );

  const [storeLearningMap, setStoreLearningMap] = useState<Record<string, string>>(() =>
    getStoredOrDefault(STORAGE_KEYS.STORE_MAP, INITIAL_STORE_LEARNING_MAP)
  );

  const [alwaysInStock, setAlwaysInStock] = useState<string[]>(() =>
    getStoredOrDefault(STORAGE_KEYS.ALWAYS_IN_STOCK, INITIAL_ALWAYS_IN_STOCK)
  );

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.GROCERIES, JSON.stringify(groceries));
  }, [groceries]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STORES, JSON.stringify(stores));
  }, [stores]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STORE_MAP, JSON.stringify(storeLearningMap));
  }, [storeLearningMap]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ALWAYS_IN_STOCK, JSON.stringify(alwaysInStock));
  }, [alwaysInStock]);

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
      setStoreLearningMap((prev) => ({
        ...prev,
        [cleanName]: newStore,
      }));
    }
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

  // Helper to check if an ingredient is in the "Always in stock" list
  const isItemInStock = useCallback(
    (name: string): boolean => {
      const clean = name.toLowerCase().trim();
      return alwaysInStock.some((staple) => {
        const s = staple.toLowerCase().trim();
        return clean === s || clean.startsWith(s + ' ') || clean.endsWith(' ' + s) || clean.includes(` ${s} `);
      });
    },
    [alwaysInStock]
  );

  // Groceries
  const addGrocery = (
    name: string,
    store?: string,
    amount?: string,
    category?: GroceryItem['category']
  ) => {
    const assignedStore = store && store.trim() ? store.trim() : predictStoreForItem(name);

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
        return updated;
      }

      const newItem: GroceryItem = {
        id: `g_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        name: cleanName,
        store: assignedStore,
        category: category || 'produce',
        amount: cleanAmount,
        checked: false,
        addedByMemberId: currentMemberId === 'all' ? fallbackMemberId : currentMemberId,
      };
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
          return { ...item, checked: !item.checked };
        }
        return item;
      })
    );
  };

  const deleteGrocery = (id: string) => {
    setGroceries((prev) => prev.filter((item) => item.id !== id));
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
        return false;
      })
    );
  };

  return {
    groceries,
    setGroceries,
    stores,
    setStores,
    storeLearningMap,
    setStoreLearningMap,
    alwaysInStock,
    setAlwaysInStock,
    addStore,
    setItemStore,
    toggleAlwaysInStock,
    isItemInStock,
    addGrocery,
    deduplicateGroceries,
    toggleGrocery,
    deleteGrocery,
    clearCheckedGroceries,
  };
}
