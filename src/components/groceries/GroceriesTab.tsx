import React, { useState, useMemo } from 'react';
import { GroceryItem, StoreDefinition, FamilyMember } from '../../types';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  ShoppingCart,
  Check,
  Trash2,
  Mic,
  Home,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { triggerHaptic } from '../../utils/haptics';

interface GroceriesTabProps {
  groceries: GroceryItem[];
  stores: StoreDefinition[];
  members: FamilyMember[];
  alwaysInStock: string[];
  selectedStore: string;
  onSelectStore: (storeName: string) => void;
  onAddGrocery: (name: string, store: string, amount?: string) => void;
  onToggleGrocery: (id: string) => void;
  onDeleteGrocery: (id: string) => void;
  onClearChecked: (storeFilter?: string) => void;
  onMoveToStaples: (id: string, name: string) => void;
  onOpenStoreModal: () => void;
  onOpenFocusModal: () => void;
  onOpenVoiceModal: () => void;
  onToggleStaplesDrawer: () => void;
  showStaplesDrawer: boolean;
  onStoreChange: (itemId: string, itemName: string, newStore: string) => void;
  onDeduplicate?: () => void;
  onCleanPast?: () => void;
}

export const GroceriesTab: React.FC<GroceriesTabProps> = ({
  groceries,
  stores,
  members,
  alwaysInStock,
  selectedStore,
  onSelectStore,
  onAddGrocery,
  onToggleGrocery,
  onDeleteGrocery,
  onClearChecked,
  onMoveToStaples,
  onOpenStoreModal,
  onOpenFocusModal,
  onOpenVoiceModal,
  onToggleStaplesDrawer,
  showStaplesDrawer,
  onStoreChange,
  onDeduplicate,
  onCleanPast,
}) => {
  const [newItemName, setNewItemName] = useState('');
  const [newItemAmount, setNewItemAmount] = useState('');
  const [newItemStore, setNewItemStore] = useState('Rewe');
  const [lastToggledItem, setLastToggledItem] = useState<{ id: string; name: string } | null>(null);
  const [isCompletedOpen, setIsCompletedOpen] = useState(false);
  type TimeframeFilter = 'all' | 'soon' | 'later';
  const [timeframeFilter, setTimeframeFilter] = useState<TimeframeFilter>('all');

  const getDaysUntil = (targetDate?: string): number | null => {
    if (!targetDate) return null;
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    if (targetDate === todayStr) return 0;
    const today = new Date(todayStr);
    const target = new Date(targetDate);
    const diffTime = target.getTime() - today.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  };

  // Check if duplicate unchecked items exist
  const hasDuplicates = React.useMemo(() => {
    const seen = new Set<string>();
    for (const g of groceries) {
      if (!g.checked) {
        const key = `${g.store.toLowerCase().trim()}:::${g.name.toLowerCase().trim()}`;
        if (seen.has(key)) return true;
        seen.add(key);
      }
    }
    return false;
  }, [groceries]);

  // Count obsolete unbought groceries whose cooking targetDate is in the past
  const pastItemsCount = React.useMemo(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    return groceries.filter((g) => !g.checked && g.targetDate && g.targetDate < todayStr).length;
  }, [groceries]);

  // Automatically self-clean obsolete past meal groceries on mount / view
  React.useEffect(() => {
    if (pastItemsCount > 0 && onCleanPast) {
      onCleanPast();
    }
  }, [pastItemsCount, onCleanPast]);

  // Filter items by store (alias & case-insensitive aware)
  const isStoreMatch = (itemStore: string, filter: string): boolean => {
    if (filter === 'all') return true;
    const normFilter = filter.toLowerCase().trim();
    const normStore = itemStore.toLowerCase().trim();
    return normStore === normFilter || normStore.startsWith(normFilter) || normFilter.startsWith(normStore);
  };

  const matchesTimeframe = (item: GroceryItem): boolean => {
    if (timeframeFilter === 'all') return true;
    const daysUntil = getDaysUntil(item.targetDate);
    if (daysUntil === null) return timeframeFilter === 'soon'; // generic items belong to current trip

    if (timeframeFilter === 'soon') {
      // Within 3-4 days OR non-perishable staples
      return daysUntil <= 3 || !item.isPerishable;
    }
    if (timeframeFilter === 'later') {
      // Days further out (e.g. perishable items for late week)
      return daysUntil > 3;
    }
    return true;
  };

  const storeFilteredGroceries = groceries.filter((g) => isStoreMatch(g.store, selectedStore));
  const filteredGroceries = storeFilteredGroceries.filter(matchesTimeframe);
  const uncheckedGroceries = filteredGroceries.filter((g) => !g.checked);
  const checkedGroceries = filteredGroceries.filter((g) => g.checked);

  // Chronological Date Sorting:
  // 1. Manually added items (no targetDate) stay on top! (User: 'when we manually add things they should also stay on top')
  // 2. Upcoming meals sorted chronologically (today, tomorrow, day+2, day+3...)
  // 3. For items on the same day: perishable items first!
  const getSortScore = (item: GroceryItem): { priority: number; dateStr: string } => {
    if (!item.targetDate) {
      return { priority: 0, dateStr: '' };
    }
    const daysUntil = getDaysUntil(item.targetDate);
    if (daysUntil === null) {
      return { priority: 0, dateStr: '' };
    }
    if (daysUntil <= 0) {
      return { priority: 1, dateStr: item.targetDate };
    }
    return { priority: 10 + daysUntil, dateStr: item.targetDate };
  };

  const sortedUncheckedGroceries = useMemo(() => {
    return [...uncheckedGroceries].sort((a, b) => {
      const aScore = getSortScore(a);
      const bScore = getSortScore(b);

      if (aScore.priority !== bScore.priority) {
        return aScore.priority - bScore.priority;
      }

      if (aScore.dateStr !== bScore.dateStr) {
        return aScore.dateStr.localeCompare(bScore.dateStr);
      }

      if (a.isPerishable && !b.isPerishable) return -1;
      if (!a.isPerishable && b.isPerishable) return 1;

      return a.name.localeCompare(b.name, 'de');
    });
  }, [uncheckedGroceries]);

  // Section cues: immediate (manual + next 3 days) vs future (4+ days ahead)
  const immediateItems = useMemo(() => {
    return sortedUncheckedGroceries.filter((item: GroceryItem) => {
      const days = getDaysUntil(item.targetDate);
      return days === null || days <= 3;
    });
  }, [sortedUncheckedGroceries]);

  const futureItems = useMemo(() => {
    return sortedUncheckedGroceries.filter((item: GroceryItem) => {
      const days = getDaysUntil(item.targetDate);
      return days !== null && days > 3;
    });
  }, [sortedUncheckedGroceries]);

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const targetStore = selectedStore !== 'all' ? selectedStore : newItemStore;
    onAddGrocery(newItemName.trim(), targetStore, newItemAmount.trim() || undefined);
    setNewItemName('');
    setNewItemAmount('');
  };

  const handleCheckItem = (id: string, name: string) => {
    triggerHaptic('light');
    onToggleGrocery(id);
    setLastToggledItem({ id, name });
    setTimeout(() => {
      setLastToggledItem((curr) => (curr?.id === id ? null : curr));
    }, 4500);

    // If this completed the last open item in the view, trigger celebratory confetti!
    if (uncheckedGroceries.length === 1 && uncheckedGroceries[0].id === id) {
      triggerHaptic('celebration');
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.7 },
        });
      } catch (e) {
        // ignore
      }
    }
  };

  const handleUndo = () => {
    if (!lastToggledItem) return;
    onToggleGrocery(lastToggledItem.id);
    setLastToggledItem(null);
  };

  const formatDateBadge = (targetDate?: string) => {
    if (!targetDate) return null;
    try {
      const parts = targetDate.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return format(d, 'EEE d.M.', { locale: de });
      }
    } catch {
      // fallback
    }
    return targetDate;
  };

  const renderGroceryRow = (item: GroceryItem) => {
    const addedBy = members.find((m) => m.id === item.addedByMemberId);
    const daysUntil = getDaysUntil(item.targetDate);
    const dateFormatted = formatDateBadge(item.targetDate);

    return (
      <div
        key={item.id}
        onClick={() => handleCheckItem(item.id, item.name)}
        className="cursor-pointer group duo-card p-3 sm:p-3.5 bg-white dark:bg-slate-900 border-2 border-stone-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all flex items-center justify-between gap-3 shadow-xs active:scale-[0.99]"
      >
        {/* Left: Checkbox */}
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl border-2 border-stone-300 dark:border-slate-700 group-hover:border-emerald-500 bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 transition-colors shadow-2xs">
          <Check className="w-4 h-4 sm:w-5 sm:h-5 text-transparent group-hover:text-emerald-400 transition-colors" />
        </div>

        {/* Middle: Item Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm sm:text-base font-black text-stone-900 dark:text-white truncate">
              {item.name}
            </span>
            {item.amount && (
              <span className="text-[11px] sm:text-xs font-extrabold bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded-lg border border-amber-300 dark:border-amber-700 shrink-0">
                {item.amount}
              </span>
            )}

            {/* Freshness Alert or Planned Date Badge */}
            {(() => {
              if (!item.targetDate) {
                return (
                  <span
                    title="Manuell hinzugefügt (sofort einkaufen)"
                    className="text-[10px] sm:text-[11px] font-black bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300 px-1.5 py-0.5 rounded-md border border-stone-200 dark:border-slate-700 shrink-0 flex items-center gap-1"
                  >
                    <span>⚡ Sofort</span>
                  </span>
                );
              }

              if (item.isPerishable && daysUntil !== null && daysUntil > 3) {
                return (
                  <span
                    title={`Geplant für ${item.targetDate}: Leicht verderblich – erst kurz vor dem Kochen kaufen!`}
                    className="text-[10px] sm:text-[11px] font-black bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-200 px-2 py-0.5 rounded-md border border-rose-300 dark:border-rose-700 shrink-0 flex items-center gap-1"
                  >
                    <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                    <span>Erst {dateFormatted} (Frische!)</span>
                  </span>
                );
              }

              return (
                <span className="text-[10px] sm:text-[11px] font-bold bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-200 px-1.5 py-0.5 rounded-md border border-teal-200 dark:border-teal-800 shrink-0 flex items-center gap-1">
                  <Calendar className="w-2.5 h-2.5 text-teal-600" />
                  <span>
                    {daysUntil === 0
                      ? '🔥 Heute'
                      : daysUntil === 1
                      ? '🗓️ Morgen'
                      : dateFormatted}
                  </span>
                </span>
              );
            })()}
          </div>

          <div
            className="flex items-center gap-2 mt-1 flex-wrap"
            onClick={(e) => e.stopPropagation()}
          >
            <select
              value={item.store}
              onChange={(e) => onStoreChange(item.id, item.name, e.target.value)}
              title="Laden wechseln"
              className="text-[11px] sm:text-xs font-bold bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300 px-2 py-0.5 rounded-lg border border-stone-200 dark:border-slate-700 focus:outline-none cursor-pointer"
            >
              {stores.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.icon} {s.name}
                </option>
              ))}
            </select>

            {item.recipeTitle && (
              <span
                title={`Aus Rezept: ${item.recipeTitle}`}
                className="text-[11px] font-medium text-stone-400 dark:text-slate-500 truncate max-w-[130px] sm:max-w-[200px]"
              >
                🍽️ {item.recipeTitle}
              </span>
            )}

            {addedBy && (
              <span
                title={`Hinzugefügt von ${addedBy.name}`}
                className="text-[11px] font-semibold text-stone-400 dark:text-slate-500 flex items-center gap-1"
              >
                <span>{addedBy.avatar}</span>
                <span className="truncate max-w-[80px] sm:max-w-none">{addedBy.name}</span>
              </span>
            )}
          </div>
        </div>

        {/* Right Actions: Staple + Delete */}
        <div
          className="flex items-center gap-1 sm:gap-1.5 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => onMoveToStaples(item.id, item.name)}
            title="Als Vorrat zu Hause markieren"
            className="px-2 py-1.5 rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-stone-500 hover:text-amber-700 dark:hover:text-amber-300 text-xs font-bold flex items-center gap-1 transition-colors"
          >
            <span>🏠</span>
            <span className="hidden sm:inline text-[11px]">Vorrat</span>
          </button>

          <button
            type="button"
            onClick={() => onDeleteGrocery(item.id)}
            className="w-8 h-8 rounded-xl text-stone-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center transition-colors"
            title="Löschen"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Undo Toast when an item was just checked off */}
      {lastToggledItem && (
        <div className="duo-card p-3 bg-emerald-50 dark:bg-emerald-950/60 border-2 border-emerald-300 dark:border-emerald-700 text-xs font-black text-emerald-900 dark:text-emerald-200 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <span>✓</span>
            <span>
              <strong>"{lastToggledItem.name}"</strong> als erledigt markiert
            </span>
          </div>
          <button
            type="button"
            onClick={handleUndo}
            className="duo-btn duo-btn-white px-2.5 py-1 text-xs font-black flex items-center gap-1 rounded-lg text-emerald-800"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Rückgängig</span>
          </button>
        </div>
      )}

      {/* Duplicate Consolidation Banner */}
      {hasDuplicates && onDeduplicate && (
        <div className="duo-card p-3 sm:p-3.5 bg-amber-50 dark:bg-amber-950/60 border-2 border-amber-300 dark:border-amber-700 text-xs font-bold text-amber-950 dark:text-amber-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-in fade-in shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-base shrink-0">🧹</span>
            <span>
              Es wurden doppelte Einträge auf der Einkaufsliste gefunden.
            </span>
          </div>
          <button
            type="button"
            onClick={onDeduplicate}
            className="duo-btn duo-btn-amber px-3 py-1.5 text-xs font-black rounded-xl shrink-0 self-start sm:self-auto"
          >
            Duplikate zusammenführen
          </button>
        </div>
      )}


      {/* UNIFIED STREAMLINED FILTER & ACTIONS BAR */}
      <div className="duo-card p-2.5 sm:p-3 bg-white dark:bg-slate-900 border-2 border-stone-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5 shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto py-0.5">
          {/* All Stores button */}
          <button
            type="button"
            onClick={() => onSelectStore('all')}
            className={`duo-btn px-3 py-1.5 rounded-xl text-xs font-black transition-all whitespace-nowrap shrink-0 ${
              selectedStore === 'all' ? 'duo-btn-green' : 'duo-btn-white'
            }`}
          >
            <span>Alle Läden ({groceries.filter((g) => !g.checked).length})</span>
          </button>

          {/* Individual Store Pills */}
          {stores.map((store) => {
            const openCount = groceries.filter(
              (g) => !g.checked && isStoreMatch(g.store, store.name)
            ).length;
            const isSelected = selectedStore.toLowerCase() === store.name.toLowerCase();

            return (
              <button
                key={store.id}
                type="button"
                onClick={() => onSelectStore(store.name)}
                className={`duo-btn px-2.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 whitespace-nowrap shrink-0 ${
                  isSelected
                    ? store.name.toLowerCase().includes('rewe')
                      ? 'duo-btn-rose'
                      : store.name.toLowerCase().includes('dm')
                      ? 'duo-btn-blue'
                      : 'duo-btn-amber'
                    : 'duo-btn-white'
                }`}
              >
                <span>{store.icon}</span>
                <span>{store.name}</span>
                {openCount > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected
                        ? 'bg-white/30 text-white'
                        : 'bg-stone-200 dark:bg-slate-700 text-stone-700 dark:text-slate-200'
                    }`}
                  >
                    {openCount}
                  </span>
                )}
              </button>
            );
          })}

          <button
            type="button"
            onClick={onOpenStoreModal}
            className="duo-btn duo-btn-white px-2 py-1.5 text-xs font-bold rounded-xl text-stone-400 hover:text-stone-700 dark:text-slate-400 whitespace-nowrap shrink-0"
            title="Eigenen Laden hinzufügen"
          >
            + Laden
          </button>

          {/* Timeframe pill filters inside the same bar */}
          {groceries.some((g) => g.targetDate) && (
            <>
              <div className="h-4 w-px bg-stone-200 dark:bg-slate-700 mx-1 shrink-0" />
              <button
                type="button"
                onClick={() => setTimeframeFilter('all')}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ${
                  timeframeFilter === 'all'
                    ? 'bg-stone-800 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs'
                    : 'text-stone-500 hover:bg-stone-100 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                Alle
              </button>
              <button
                type="button"
                onClick={() => setTimeframeFilter('soon')}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ${
                  timeframeFilter === 'soon'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-stone-500 hover:bg-stone-100 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                ⚡ Demnächst
              </button>
              <button
                type="button"
                onClick={() => setTimeframeFilter('later')}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ${
                  timeframeFilter === 'later'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'text-stone-500 hover:bg-stone-100 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                🗓️ Später
              </button>
            </>
          )}
        </div>

        {/* Shopping Focus Mode & Staples Buttons */}
        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          <button
            type="button"
            onClick={onOpenFocusModal}
            className="duo-btn duo-btn-green px-3 py-1.5 rounded-xl text-xs font-black text-white flex items-center gap-1.5 shadow-2xs whitespace-nowrap"
            title="Supermarkt-Fokusmodus: Schnelles Abhaken im Laden"
          >
            <ShoppingCart className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">Einkaufs-Modus</span>
          </button>

          <button
            type="button"
            onClick={onToggleStaplesDrawer}
            className={`duo-btn px-2.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 whitespace-nowrap transition-all ${
              showStaplesDrawer
                ? 'duo-btn-amber ring-2 ring-amber-400 text-stone-900'
                : 'duo-btn-white text-stone-700 dark:text-slate-200'
            }`}
          >
            <Home className="w-3.5 h-3.5 text-amber-500" />
            <span>Vorräte ({alwaysInStock.length})</span>
          </button>
        </div>
      </div>

      {/* QUICK ADD BAR - SINGLE CLEAN LINE */}
      <form
        onSubmit={handleQuickAdd}
        className="duo-card p-2 sm:p-2.5 bg-white dark:bg-slate-900 border-2 border-stone-200 dark:border-slate-800 flex items-center gap-2 shadow-xs"
      >
        <input
          type="text"
          placeholder={
            selectedStore === 'all'
              ? 'Artikel hinzufügen (z.B. Milch, Äpfel, Brot)...'
              : `Artikel für ${selectedStore} hinzufügen...`
          }
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          className="flex-1 min-w-[110px] px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-bold rounded-xl border border-stone-200 dark:border-slate-700 focus:outline-none focus:border-emerald-500 bg-stone-50 dark:bg-slate-800 text-stone-900 dark:text-white placeholder-stone-400"
          required
        />

        <input
          type="text"
          placeholder="Menge"
          value={newItemAmount}
          onChange={(e) => setNewItemAmount(e.target.value)}
          className="w-16 sm:w-24 px-2.5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-xl border border-stone-200 dark:border-slate-700 focus:outline-none focus:border-emerald-500 bg-stone-50 dark:bg-slate-800 text-stone-900 dark:text-white placeholder-stone-400 shrink-0"
        />

        <select
          value={selectedStore === 'all' ? newItemStore : selectedStore}
          onChange={(e) => setNewItemStore(e.target.value)}
          disabled={selectedStore !== 'all'}
          className="w-24 sm:w-28 px-2 py-2 sm:py-2.5 text-xs font-black rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 text-stone-900 dark:text-white focus:outline-none focus:border-emerald-500 cursor-pointer shrink-0 truncate"
        >
          {stores.map((s) => (
            <option key={s.id} value={s.name}>
              {s.icon} {s.name}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={onOpenVoiceModal}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/80 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800 transition-colors"
          title="Per Spracheingabe diktieren"
        >
          <Mic className="w-4 h-4" />
        </button>

        <button
          type="submit"
          className="duo-btn duo-btn-green px-3.5 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-black rounded-xl shrink-0 shadow-2xs whitespace-nowrap"
        >
          + Neu
        </button>
      </form>

      {/* ACTIVE UNCHECKED GROCERY ITEMS */}
      <div className="space-y-3">
        {sortedUncheckedGroceries.length === 0 ? (
          <div className="duo-card p-8 sm:p-12 text-center bg-white dark:bg-slate-900 border-2 border-stone-200 dark:border-slate-800 space-y-2">
            <span className="text-4xl block">🎉</span>
            <h3 className="text-lg font-black text-stone-900 dark:text-white">
              {selectedStore === 'all' ? 'Alles eingekauft!' : `Bei ${selectedStore} alles erledigt!`}
            </h3>
            <p className="text-xs font-bold text-stone-400 dark:text-slate-400 max-w-sm mx-auto">
              {checkedGroceries.length > 0
                ? `${checkedGroceries.length} Artikel liegen bereits im Korb.`
                : 'Keine offenen Artikel auf der Liste. Genießt eure Familienzeit!'}
            </p>
          </div>
        ) : timeframeFilter === 'all' && futureItems.length > 0 && immediateItems.length > 0 ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1 pt-1">
                <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span>⚡</span> Demnächst ({immediateItems.length})
                </span>
              </div>
              {immediateItems.map(renderGroceryRow)}
            </div>

            <div className="pt-2 pb-1 space-y-2">
              <div className="flex items-center justify-between px-1 pt-1">
                <span className="text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span>🗓️</span> Später & Folgewoche ({futureItems.length})
                </span>
              </div>
              {futureItems.map(renderGroceryRow)}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedUncheckedGroceries.map(renderGroceryRow)}
          </div>
        )}
      </div>

      {/* CHECKED OFF / COMPLETED SECTION (Unobtrusive & Collapsed by default) */}
      {checkedGroceries.length > 0 && (
        <div className="pt-3 border-t border-stone-200/80 dark:border-slate-800/80 space-y-2 mt-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIsCompletedOpen(!isCompletedOpen)}
              className="flex items-center gap-1.5 text-xs font-bold text-stone-400 hover:text-stone-700 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
            >
              {isCompletedOpen ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
              <span>Erledigte Artikel ({checkedGroceries.length})</span>
            </button>

            {isCompletedOpen && (
              <button
                type="button"
                onClick={() => onClearChecked(selectedStore === 'all' ? undefined : selectedStore)}
                className="text-xs font-bold text-rose-500 hover:text-rose-700 dark:text-rose-400 underline"
              >
                Erledigte leeren
              </button>
            )}
          </div>

          {isCompletedOpen && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 animate-in fade-in">
              {checkedGroceries.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onToggleGrocery(item.id)}
                  className="cursor-pointer flex items-center justify-between p-2.5 rounded-xl border border-stone-200 dark:border-slate-800 bg-stone-50/80 dark:bg-slate-800/40 text-stone-400 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors text-xs"
                  title="Klicken zum Wiederherstellen in die Einkaufsliste"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="w-4 h-4 rounded-md bg-stone-300 dark:bg-slate-700 text-stone-600 dark:text-slate-200 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span className="line-through font-semibold text-stone-500 dark:text-slate-400 truncate">
                      {item.name}
                    </span>
                    {item.amount && (
                      <span className="text-[10px] text-stone-400 shrink-0">
                        ({item.amount})
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteGrocery(item.id);
                    }}
                    className="text-stone-300 hover:text-rose-600 p-1 ml-2"
                    title="Löschen"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
