import React, { useState, useEffect } from 'react';
import { ShoppingBag, ArrowRight, X, MapPin } from 'lucide-react';
import {
  subscribeToStoreProximity,
  getSavedSupermarket,
  getSimulatedStoreProximity,
} from '../../services/contextEngine';
import { useFamily } from '../../context/FamilyContext';

interface StoreArrivalBannerProps {
  onOpenShoppingFocus: () => void;
}

export const StoreArrivalBanner: React.FC<StoreArrivalBannerProps> = ({
  onOpenShoppingFocus,
}) => {
  const { groceries } = useFamily();
  const [isNear, setIsNear] = useState<boolean>(() => getSimulatedStoreProximity());
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [storeName, setStoreName] = useState<string>('Supermarkt');

  const uncheckedCount = groceries.filter((g) => !g.checked).length;

  useEffect(() => {
    const saved = getSavedSupermarket();
    if (saved?.name) setStoreName(saved.name);

    const unsubscribe = subscribeToStoreProximity((near) => {
      setIsNear(near);
      if (near) {
        setIsDismissed(false); // Re-open if entering store
      }
    });

    return unsubscribe;
  }, []);

  if (!isNear || isDismissed || uncheckedCount === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 inset-x-3 sm:inset-x-auto sm:right-6 sm:max-w-md z-50 animate-in slide-in-from-top duration-300">
      <div className="bg-emerald-600 text-white p-4 sm:p-5 rounded-3xl shadow-2xl border-2 border-emerald-400 flex items-center justify-between gap-4">
        
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-white text-emerald-600 flex items-center justify-center shrink-0 shadow-md">
            <ShoppingBag className="w-6 h-6 stroke-[2.5] animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-emerald-100 text-[11px] font-black uppercase tracking-wider">
              <MapPin className="w-3.5 h-3.5" />
              <span>Standort erkannt</span>
            </div>
            <h4 className="text-base sm:text-lg font-black truncate">
              Du bist bei {storeName}!
            </h4>
            <p className="text-xs text-emerald-100 font-bold">
              {uncheckedCount} offene Artikel auf deiner Einkaufsliste.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setIsDismissed(true);
              onOpenShoppingFocus();
            }}
            className="px-4 py-2.5 bg-white text-emerald-700 hover:bg-emerald-50 rounded-2xl text-xs font-black shadow-md active:scale-95 transition-all flex items-center gap-1.5"
          >
            <span>Öffnen</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>

          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="w-9 h-9 rounded-2xl bg-emerald-700/50 hover:bg-emerald-700 text-emerald-200 hover:text-white flex items-center justify-center transition-colors"
            title="Schließen"
          >
            <X className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

      </div>
    </div>
  );
};
