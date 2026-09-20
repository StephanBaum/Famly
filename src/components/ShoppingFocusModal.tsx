import React, { useState } from 'react';
import { ModalPortal } from './ModalPortal';
import { GroceryItem, StoreDefinition } from '../types';
import confetti from 'canvas-confetti';
import {
  X,
  CheckCircle2,
  Circle,
  ShoppingBag,
  Store,
  CheckCheck,
} from 'lucide-react';

interface ShoppingFocusModalProps {
  isOpen: boolean;
  onClose: () => void;
  groceries: GroceryItem[];
  stores: StoreDefinition[];
  onToggleItem: (id: string) => void;
  onClearChecked: (store?: string) => void;
}

export const ShoppingFocusModal: React.FC<ShoppingFocusModalProps> = ({
  isOpen,
  onClose,
  groceries,
  stores,
  onToggleItem,
  onClearChecked,
}) => {
  const [activeStore, setActiveStore] = useState<string>('all');

  if (!isOpen) return null;

  // Filter items by store if selected
  const visibleItems = groceries.filter((item) => {
    if (activeStore === 'all') return true;
    return item.store === activeStore;
  });

  const uncheckedItems = visibleItems.filter((i) => !i.checked);
  const checkedItems = visibleItems.filter((i) => i.checked);
  const totalCount = visibleItems.length;
  const checkedCount = checkedItems.length;
  const percentComplete = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  const handleItemClick = (id: string) => {
    // Haptic vibration feedback on supported smartphones
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(40);
      } catch (e) {
        // ignore if not supported
      }
    }
    onToggleItem(id);
  };

  const handleFinishShopping = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10B981', '#F59E0B', '#6366F1'],
    });

    onClearChecked(activeStore !== 'all' ? activeStore : undefined);
    onClose();
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 bg-white dark:bg-[#0c1222] flex flex-col animate-in fade-in overflow-hidden">
        
        {/* Top Floating App Bar */}
        <header className="p-4 sm:p-5 border-b border-stone-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shrink-0">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md">
                <ShoppingBag className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-stone-900 dark:text-white flex items-center gap-1.5">
                  <span>Einkaufs-Fokus</span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {activeStore !== 'all' ? `• ${activeStore}` : ''}
                  </span>
                </h2>
                <p className="text-xs text-stone-500 dark:text-slate-400 font-semibold">
                  {checkedCount} von {totalCount} Artikeln im Einkaufswagen
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-2xl bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 text-stone-600 dark:text-slate-300 flex items-center justify-center font-black transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="max-w-2xl mx-auto mt-3">
            <div className="w-full h-2.5 bg-stone-100 dark:bg-slate-800 rounded-full overflow-hidden border border-stone-200 dark:border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${percentComplete}%` }}
              />
            </div>
          </div>

          {/* Store Filter Tabs (wraps cleanly) */}
          <div className="max-w-2xl mx-auto mt-3 flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveStore('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 transition-all ${
                activeStore === 'all'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300'
              }`}
            >
              Alle Geschäfte
            </button>
            {stores.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveStore(s.name)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 flex items-center gap-1 transition-all ${
                  activeStore === s.name
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300'
                }`}
              >
                <span>{s.icon}</span>
                <span>{s.name}</span>
              </button>
            ))}
          </div>
        </header>

        {/* Big Checklist Scrollable Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-2xl mx-auto space-y-4">
            {visibleItems.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <span className="text-4xl">🛒</span>
                <h3 className="text-base font-black text-stone-800 dark:text-white">
                  Alles eingekauft!
                </h3>
                <p className="text-xs text-stone-500 dark:text-slate-400 max-w-xs mx-auto">
                  Für {activeStore === 'all' ? 'alle Geschäfte' : activeStore} stehen aktuell keine offenen Artikel auf der Liste.
                </p>
              </div>
            ) : (
              <>
                {/* Unchecked Items (Need to buy) */}
                <div className="space-y-2.5">
                  {uncheckedItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleItemClick(item.id)}
                      className="w-full text-left p-4 rounded-2xl bg-stone-50 dark:bg-slate-850 hover:bg-stone-100 dark:hover:bg-slate-800 border-2 border-stone-200 dark:border-slate-700 active:scale-[0.98] transition-all flex items-center gap-3.5 shadow-xs"
                    >
                      <Circle className="w-7 h-7 text-stone-300 dark:text-slate-600 hover:text-emerald-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-black text-stone-900 dark:text-white truncate">
                          {item.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {item.amount && (
                            <span className="text-xs font-extrabold text-stone-500 dark:text-slate-400 bg-stone-200/80 dark:bg-slate-700 px-2 py-0.5 rounded-md">
                              {item.amount}
                            </span>
                          )}
                          <span className="text-xs font-bold text-stone-400 dark:text-slate-500 flex items-center gap-1">
                            <Store className="w-3 h-3" />
                            {item.store}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Checked Items (In Cart) */}
                {checkedItems.length > 0 && (
                  <div className="pt-4 border-t border-stone-200 dark:border-slate-800 space-y-2">
                    <span className="block text-xs font-black uppercase text-stone-400 dark:text-slate-500 tracking-wider">
                      Im Einkaufswagen ({checkedItems.length})
                    </span>

                    <div className="space-y-2 opacity-60">
                      {checkedItems.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleItemClick(item.id)}
                          className="w-full text-left p-3.5 rounded-2xl bg-stone-100/60 dark:bg-slate-900 border border-stone-200 dark:border-slate-800 flex items-center gap-3.5 transition-all"
                        >
                          <CheckCircle2 className="w-6 h-6 text-emerald-500 fill-emerald-100 dark:fill-emerald-950 shrink-0" />
                          <p className="text-sm font-bold text-stone-500 dark:text-slate-400 line-through truncate">
                            {item.name} {item.amount ? `(${item.amount})` : ''}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>

        {/* Bottom Bar: Finish Shopping Button */}
        <footer className="p-4 sm:p-5 border-t border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="duo-btn duo-btn-white px-4 py-3 rounded-2xl text-xs font-bold text-stone-700 dark:text-slate-300"
            >
              Schließen
            </button>

            {checkedCount > 0 ? (
              <button
                type="button"
                onClick={handleFinishShopping}
                className="flex-1 duo-btn duo-btn-green py-3 px-4 rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center gap-2"
              >
                <CheckCheck className="w-4 h-4 stroke-[3]" />
                <span>Einkauf abschließen ({checkedCount} erledigt)</span>
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="flex-1 py-3 px-4 rounded-2xl text-xs font-bold text-stone-400 bg-stone-100 dark:bg-slate-800 cursor-not-allowed text-center"
              >
                Tippe Artikel an, um sie einzupacken
              </button>
            )}
          </div>
        </footer>

      </div>
    </ModalPortal>
  );
};
