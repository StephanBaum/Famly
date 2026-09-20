import React, { useState } from 'react';
import { useFamily } from '../context/FamilyContext';
import { Chore } from '../types';
import { ModalPortal } from '../components/ModalPortal';
import { ShoppingFocusModal } from '../components/ShoppingFocusModal';
import { VoiceInputModal } from '../components/VoiceInputModal';
import {
  Plus,
  ShoppingCart,
  Sparkles,
  Trash2,
  CheckCircle2,
  Circle,
  Check,
  Star,
  Home,
  Brain,
  Edit2,
  Mic,
  Gift,
  Trophy,
  CheckCheck,
  Clock,
} from 'lucide-react';

export const ListsAndChoresView: React.FC = () => {
  const {
    members,
    stores,
    addStore,
    groceries,
    addGrocery,
    toggleGrocery,
    deleteGrocery,
    clearCheckedGroceries,
    setItemStore,
    alwaysInStock,
    toggleAlwaysInStock,
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
    currentMemberId,
  } = useFamily();

  const [activeTab, setActiveTab] = useState<'groceries' | 'chores'>('groceries');
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [showStaplesDrawer, setShowStaplesDrawer] = useState(false);
  const [newStapleName, setNewStapleName] = useState('');
  const [newCustomStoreName, setNewCustomStoreName] = useState('');
  const [showAddStoreModal, setShowAddStoreModal] = useState(false);
  const [learnedNotification, setLearnedNotification] = useState<string | null>(null);

  // Focus & Voice Modals
  const [isShoppingFocusOpen, setIsShoppingFocusOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  // Chores vs Rewards Sub-tab
  const [choreSubTab, setChoreSubTab] = useState<'chores' | 'rewards'>('chores');

  // Rewards State
  const childrenMembers = members.filter((m) => m.isChild);
  const eligibleRewardMembers = childrenMembers.length > 0 ? childrenMembers : members;
  const [selectedChildForReward, setSelectedChildForReward] = useState<string>(
    eligibleRewardMembers[0]?.id || members[0]?.id || 'm1'
  );
  const [isAddRewardOpen, setIsAddRewardOpen] = useState(false);
  const [newRewardTitle, setNewRewardTitle] = useState('');
  const [newRewardDescription, setNewRewardDescription] = useState('');
  const [newRewardCost, setNewRewardCost] = useState(10);
  const [newRewardIcon, setNewRewardIcon] = useState('🎁');
  const [rewardError, setRewardError] = useState<string | null>(null);

  // Grocery Form
  const [newItemName, setNewItemName] = useState('');
  const [newItemAmount, setNewItemAmount] = useState('');
  const [newItemStore, setNewItemStore] = useState('Rewe');

  // Chore Form
  const [isAddChoreOpen, setIsAddChoreOpen] = useState(false);
  const [editingChoreId, setEditingChoreId] = useState<string | null>(null);
  const [choreTitle, setChoreTitle] = useState('');
  const [choreAssignee, setChoreAssignee] = useState(members[2]?.id || members[0]?.id || 'm1');
  const [choreFrequency, setChoreFrequency] = useState<Chore['frequency']>('daily');
  const [choreStars, setChoreStars] = useState(3);

  const openAddChore = () => {
    setEditingChoreId(null);
    setChoreTitle('');
    setChoreAssignee(members[2]?.id || members[0]?.id || 'm1');
    setChoreFrequency('daily');
    setChoreStars(3);
    setIsAddChoreOpen(true);
  };

  const openEditChore = (chore: Chore) => {
    setEditingChoreId(chore.id);
    setChoreTitle(chore.title);
    setChoreAssignee(chore.assignedMemberId);
    setChoreFrequency(chore.frequency);
    setChoreStars(chore.stars);
    setIsAddChoreOpen(true);
  };

  const handleAddGrocery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const targetStore = selectedStore !== 'all' ? selectedStore : newItemStore;
    addGrocery(newItemName.trim(), targetStore, newItemAmount.trim() || undefined);
    
    setLearnedNotification(`Zu ${targetStore} hinzugefügt • Famly merkt sich das Geschäft!`);
    setTimeout(() => setLearnedNotification(null), 3000);

    setNewItemName('');
    setNewItemAmount('');
  };

  const handleAddChore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!choreTitle.trim()) return;
    if (editingChoreId) {
      updateChore(editingChoreId, {
        title: choreTitle.trim(),
        assignedMemberId: choreAssignee,
        frequency: choreFrequency,
        stars: Number(choreStars),
      });
    } else {
      addChore(choreTitle.trim(), choreAssignee, choreFrequency, Number(choreStars));
    }
    setChoreTitle('');
    setEditingChoreId(null);
    setIsAddChoreOpen(false);
  };

  const handleAddCustomStore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomStoreName.trim()) return;
    addStore(newCustomStoreName.trim(), '🏬');
    setSelectedStore(newCustomStoreName.trim());
    setNewCustomStoreName('');
    setShowAddStoreModal(false);
  };

  const handleAddStaple = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStapleName.trim()) return;
    toggleAlwaysInStock(newStapleName.trim());
    setNewStapleName('');
  };

  const handleStoreChange = (itemId: string, itemName: string, newStore: string) => {
    setItemStore(itemId, newStore);
    setLearnedNotification(`Gelernt! "${itemName}" wird künftig ${newStore} zugeordnet 🧠`);
    setTimeout(() => setLearnedNotification(null), 3500);
  };

  const handleMoveToStaples = (itemId: string, itemName: string) => {
    toggleAlwaysInStock(itemName);
    deleteGrocery(itemId);
    setLearnedNotification(`"${itemName}" als Vorrat markiert 🏠 (Rezepte fügen es nicht doppelt hinzu)`);
    setTimeout(() => setLearnedNotification(null), 4000);
  };

  const handleVoiceAddItems = (items: Array<{ name: string; category: any }>) => {
    const targetStore = selectedStore !== 'all' ? selectedStore : undefined;
    items.forEach((item) => {
      addGrocery(item.name, targetStore, undefined, item.category);
    });
    setLearnedNotification(`${items.length} Artikel per Spracheingabe hinzugefügt! 🎙️`);
    setTimeout(() => setLearnedNotification(null), 3500);
  };

  const handleCreateReward = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRewardTitle.trim()) return;
    addReward(
      newRewardTitle.trim(),
      newRewardCost,
      newRewardIcon || '🎁',
      newRewardDescription.trim() || undefined
    );
    setNewRewardTitle('');
    setNewRewardDescription('');
    setNewRewardCost(10);
    setNewRewardIcon('🎁');
    setIsAddRewardOpen(false);
  };

  const handleClaimReward = (rewardId: string) => {
    setRewardError(null);
    const success = claimReward(rewardId, selectedChildForReward);
    if (!success) {
      setRewardError('Nicht genügend Sterne vorhanden!');
      setTimeout(() => setRewardError(null), 3000);
    }
  };

  // Filter groceries by selected store
  const filteredGroceries = groceries.filter((g) =>
    selectedStore === 'all' ? true : g.store.toLowerCase() === selectedStore.toLowerCase()
  );

  const uncheckedGroceries = filteredGroceries.filter((g) => !g.checked);
  const checkedGroceries = filteredGroceries.filter((g) => g.checked);

  // Filter chores for current active member
  const filteredChores = chores.filter((c) =>
    currentMemberId === 'all' ? true : c.assignedMemberId === currentMemberId
  );

  // Calculate stars earned
  const totalStarsEarned = chores
    .filter((c) => c.completed)
    .reduce((sum, c) => sum + c.stars, 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="duo-card p-6 bg-white dark:bg-slate-900 border-2 border-stone-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-black text-2xl shadow-sm">
            🛒
          </div>
          <div>
            <h2 className="text-xl font-black text-stone-900 dark:text-white">Einkauf & Aufgaben</h2>
            <p className="text-xs font-bold text-stone-400 dark:text-slate-400">
              Getrennte Einkäufe nach Geschäft mit Vorrats-Automatik & Aufgaben-Sternen
            </p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-stone-100 dark:bg-slate-800 p-1.5 rounded-2xl border-2 border-stone-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('groceries')}
              className={`duo-btn px-4 py-2 text-xs font-extrabold rounded-xl transition-all ${
                activeTab === 'groceries'
                  ? 'duo-btn-green'
                  : 'text-stone-600 dark:text-slate-300 hover:text-stone-900'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
              <span>Einkaufsliste ({groceries.filter((g) => !g.checked).length})</span>
            </button>
            <button
              onClick={() => setActiveTab('chores')}
              className={`duo-btn px-4 py-2 text-xs font-extrabold rounded-xl transition-all ${
                activeTab === 'chores'
                  ? 'duo-btn-amber'
                  : 'text-stone-600 dark:text-slate-300 hover:text-stone-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              <span>Aufgaben & Sterne ({chores.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* GROCERIES TAB */}
      {activeTab === 'groceries' && (
        <div className="space-y-6">
          
          {/* Smart Learning Notification Toast */}
          {learnedNotification && (
            <div className="duo-card bg-emerald-50 dark:bg-emerald-950/50 border-2 border-emerald-300 dark:border-emerald-700 p-3.5 flex items-center justify-between text-xs font-extrabold text-emerald-900 dark:text-emerald-200 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{learnedNotification}</span>
              </div>
              <button
                onClick={() => setLearnedNotification(null)}
                className="text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 font-black"
              >
                ✕
              </button>
            </div>
          )}

          {/* STORE RUN SELECTOR PILLS */}
          <div className="duo-card p-3 sm:p-4 bg-white dark:bg-slate-900 border-2 border-stone-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none flex-nowrap w-full md:w-auto">
              <span className="text-xs font-black text-stone-400 dark:text-slate-400 uppercase tracking-wider mr-1 shrink-0">
                Laden:
              </span>

              {/* All Stores button */}
              <button
                onClick={() => setSelectedStore('all')}
                className={`duo-btn px-3.5 py-2 rounded-2xl text-xs font-black transition-all whitespace-nowrap shrink-0 ${
                  selectedStore === 'all'
                    ? 'duo-btn-green'
                    : 'duo-btn-white'
                }`}
              >
                <span>Alle Läden ({groceries.filter((g) => !g.checked).length})</span>
              </button>

              {/* Individual Store Pills */}
              {stores.map((store) => {
                const count = groceries.filter(
                  (g) => !g.checked && g.store.toLowerCase() === store.name.toLowerCase()
                ).length;
                const isSelected = selectedStore.toLowerCase() === store.name.toLowerCase();

                return (
                  <button
                    key={store.id}
                    onClick={() => setSelectedStore(store.name)}
                    className={`duo-btn px-3 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                      isSelected
                        ? store.name.toLowerCase() === 'rewe'
                          ? 'duo-btn-rose'
                          : store.name.toLowerCase() === 'dm'
                          ? 'duo-btn-blue'
                          : 'duo-btn-amber'
                        : 'duo-btn-white'
                    }`}
                  >
                    <span>{store.icon}</span>
                    <span>{store.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        isSelected ? 'bg-white/30 text-white' : 'bg-stone-200 dark:bg-slate-700 text-stone-700 dark:text-slate-200'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}

              <button
                onClick={() => setShowAddStoreModal(true)}
                className="duo-btn duo-btn-white px-3 py-2 text-xs font-extrabold rounded-2xl text-stone-500 dark:text-slate-300 whitespace-nowrap shrink-0"
                title="Eigenen Laden hinzufügen (z.B. Aldi, Edeka, Bauhaus)"
              >
                + Laden
              </button>
            </div>

            {/* Shopping Focus Mode & Staples Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsShoppingFocusOpen(true)}
                className="duo-btn duo-btn-green px-3.5 py-2 rounded-2xl text-xs font-black text-white flex items-center gap-1.5 shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all whitespace-nowrap"
                title="Supermarkt-Fokusmodus: Schnelles, einhändiges Abhaken mit Vibrations-Feedback"
              >
                <ShoppingCart className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Einkaufs-Modus</span>
              </button>

              <button
                onClick={() => setShowStaplesDrawer(!showStaplesDrawer)}
                className="duo-btn duo-btn-white px-3.5 py-2 rounded-2xl text-xs font-black text-stone-700 dark:text-slate-200 flex items-center gap-1.5 whitespace-nowrap"
              >
                <Home className="w-3.5 h-3.5 text-amber-500" />
                <span>Vorräte ({alwaysInStock.length})</span>
              </button>
            </div>
          </div>

          {/* "ALWAYS IN STOCK AT HOME" DRAWER */}
          {showStaplesDrawer && (
            <div className="duo-card p-5 bg-amber-50/60 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-700 animate-in fade-in zoom-in-95 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🧂</span>
                    <h3 className="text-sm font-black text-stone-900 dark:text-white">
                      Standard-Vorräte (bei Rezepten übersprungen)
                    </h3>
                  </div>
                  <p className="text-xs font-semibold text-stone-600 dark:text-slate-300 mt-1">
                    Wenn Rezepte zur Einkaufsliste hinzugefügt werden, überspringt Famly diese Artikel automatisch (z.B. Salz, Pfeffer, Öl, Mehl).
                  </p>
                </div>
                <button
                  onClick={() => setShowStaplesDrawer(false)}
                  className="text-stone-400 hover:text-stone-700 dark:hover:text-white font-black text-sm"
                >
                  ✕
                </button>
              </div>

              {/* Add staple form */}
              <form onSubmit={handleAddStaple} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Artikel hinzufügen, den ihr immer im Haus habt (z.B. Sojasauce, Zucker)..."
                  value={newStapleName}
                  onChange={(e) => setNewStapleName(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-stone-300 dark:border-slate-700 focus:outline-none bg-white dark:bg-slate-800 text-stone-900 dark:text-white"
                />
                <button
                  type="submit"
                  className="duo-btn duo-btn-amber px-4 py-1.5 text-xs font-black rounded-xl"
                >
                  + Vorrat
                </button>
              </form>

              {/* Chips of currently active in-stock staples */}
              <div className="flex flex-wrap gap-2">
                {alwaysInStock.map((staple) => (
                  <span
                    key={staple}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-800 rounded-xl border-2 border-amber-200 dark:border-amber-700 text-xs font-bold text-stone-800 dark:text-slate-200 shadow-2xs"
                  >
                    <span>✓ {staple}</span>
                    <button
                      type="button"
                      onClick={() => toggleAlwaysInStock(staple)}
                      className="text-stone-300 hover:text-rose-600 ml-1 font-black text-xs"
                      title="Entfernen"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Quick Add Bar */}
          <form
            onSubmit={handleAddGrocery}
            className="duo-card p-3 sm:p-4 bg-white dark:bg-slate-900 border-2 border-stone-200 dark:border-slate-800 space-y-2.5"
          >
            {/* Row 1: Item Name input + Mic + Submit */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder={
                  selectedStore === 'all'
                    ? 'Artikel hinzufügen (z.B. Milch, Äpfel, Brot)...'
                    : `Artikel für ${selectedStore} hinzufügen...`
                }
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="flex-1 min-w-0 px-3.5 py-2.5 sm:py-3 text-sm sm:text-base font-bold rounded-2xl border-2 border-stone-200 dark:border-slate-700 focus:outline-none focus:border-emerald-500 bg-white dark:bg-slate-800 text-stone-900 dark:text-white placeholder-stone-400"
                required
              />

              <button
                type="button"
                onClick={() => setIsVoiceModalOpen(true)}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-blue-100 hover:bg-blue-200 dark:bg-blue-950/80 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0 border-2 border-blue-200 dark:border-blue-800 transition-colors shadow-2xs"
                title="Per Spracheingabe diktieren"
              >
                <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <button
                type="submit"
                className="duo-btn duo-btn-green px-4 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-black rounded-2xl shrink-0 shadow-sm whitespace-nowrap"
              >
                + Neu
              </button>
            </div>

            {/* Row 2: Quantity (Menge) and Store selection */}
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Menge (z.B. 500g, 2 Pck.)"
                value={newItemAmount}
                onChange={(e) => setNewItemAmount(e.target.value)}
                className="w-full px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-bold rounded-xl border-2 border-stone-200 dark:border-slate-700 focus:outline-none focus:border-emerald-500 bg-white dark:bg-slate-800 text-stone-900 dark:text-white placeholder-stone-400 min-w-0"
              />

              <select
                value={selectedStore === 'all' ? newItemStore : selectedStore}
                onChange={(e) => setNewItemStore(e.target.value)}
                className="w-full px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-black rounded-xl border-2 border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white focus:outline-none focus:border-emerald-500 cursor-pointer min-w-0"
              >
                {stores.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.icon} {s.name}
                  </option>
                ))}
              </select>
            </div>
          </form>

          {/* Cart Progress Bar */}
          {filteredGroceries.length > 0 && (
            <div className="duo-card bg-white dark:bg-slate-900 rounded-2xl p-3 border-2 border-stone-200 dark:border-slate-800 flex items-center justify-between gap-4">
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between text-xs font-black">
                  <span className="text-stone-700 dark:text-slate-300">
                    🛒 Im Korb: {checkedGroceries.length} von {filteredGroceries.length} Artikeln
                  </span>
                  <span className="text-emerald-700 dark:text-emerald-400">
                    {Math.round((checkedGroceries.length / filteredGroceries.length) * 100)}% Erledigt
                  </span>
                </div>
                <div className="w-full h-2.5 bg-stone-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                    style={{
                      width: `${(checkedGroceries.length / filteredGroceries.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {checkedGroceries.length > 0 && (
                <button
                  type="button"
                  onClick={() => clearCheckedGroceries(selectedStore === 'all' ? undefined : selectedStore)}
                  className="text-xs font-black text-rose-600 dark:text-rose-400 hover:text-rose-800 underline shrink-0 whitespace-nowrap"
                >
                  Erledigte leeren
                </button>
              )}
            </div>
          )}

          {/* GROCERY ITEMS LIST */}
          <div className="space-y-4">
            
            {uncheckedGroceries.length === 0 ? (
              <div className="duo-card p-8 sm:p-12 text-center bg-white dark:bg-slate-900 border-2 border-stone-200 dark:border-slate-800 space-y-2">
                <span className="text-4xl block">🎉</span>
                <h3 className="text-lg font-black text-stone-900 dark:text-white">
                  {selectedStore === 'all' ? 'Alles eingekauft!' : `Bei ${selectedStore} alles erledigt!`}
                </h3>
                <p className="text-xs font-bold text-stone-400 dark:text-slate-400 max-w-sm mx-auto">
                  Keine offenen Artikel auf der Liste. Genießt eure Familienzeit!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {uncheckedGroceries.map((item) => {
                  const addedBy = members.find((m) => m.id === item.addedByMemberId);

                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleGrocery(item.id)}
                      className="cursor-pointer group duo-card p-3 sm:p-3.5 bg-white dark:bg-slate-900 border-2 border-stone-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all flex items-center justify-between gap-3 shadow-xs active:scale-[0.99]"
                    >
                      {/* Left: Checkbox */}
                      <div
                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl border-2 border-stone-300 dark:border-slate-700 group-hover:border-emerald-500 bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 transition-colors shadow-2xs"
                      >
                        <Check className="w-4 h-4 sm:w-5 sm:h-5 text-transparent group-hover:text-emerald-400 transition-colors" />
                      </div>

                      {/* Middle: Name + Amount (Top) & Store Pill + Author (Bottom) */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm sm:text-base font-black text-stone-900 dark:text-white truncate">
                            {item.name}
                          </span>
                          {item.amount && (
                            <span className="text-[11px] sm:text-xs font-extrabold bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded-lg border border-amber-300 dark:border-amber-700 shrink-0">
                              {item.amount}
                            </span>
                          )}
                        </div>

                        {/* Store Pill selector & Author */}
                        <div
                          className="flex items-center gap-2 mt-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <select
                            value={item.store}
                            onChange={(e) => handleStoreChange(item.id, item.name, e.target.value)}
                            title="Laden wechseln"
                            className="text-[11px] sm:text-xs font-bold bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300 px-2 py-0.5 rounded-lg border border-stone-200 dark:border-slate-700 focus:outline-none cursor-pointer"
                          >
                            {stores.map((s) => (
                              <option key={s.id} value={s.name}>
                                {s.icon} {s.name}
                              </option>
                            ))}
                          </select>

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

                      {/* Right: Vorrat + Delete Buttons */}
                      <div
                        className="flex items-center gap-1 sm:gap-1.5 shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => handleMoveToStaples(item.id, item.name)}
                          title="Als Vorrat zu Hause markieren"
                          className="px-2 py-1.5 rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-stone-500 hover:text-amber-700 dark:hover:text-amber-300 text-xs font-bold flex items-center gap-1 transition-colors"
                        >
                          <span>🏠</span>
                          <span className="hidden sm:inline text-[11px]">Vorrat</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteGrocery(item.id)}
                          className="w-8 h-8 rounded-xl text-stone-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center transition-colors"
                          title="Löschen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* CHECKED OFF / IN BASKET ITEMS */}
            {checkedGroceries.length > 0 && (
              <div className="duo-card p-4 sm:p-5 bg-stone-50 dark:bg-slate-900 border-2 border-stone-200/90 dark:border-slate-800 space-y-3 mt-6">
                <div className="flex items-center justify-between border-b border-stone-200 dark:border-slate-800 pb-2">
                  <span className="text-xs font-black text-stone-500 dark:text-slate-400 uppercase tracking-wider">
                    ✓ Im Einkaufswagen ({checkedGroceries.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => clearCheckedGroceries(selectedStore === 'all' ? undefined : selectedStore)}
                    className="text-xs font-black text-rose-600 dark:text-rose-400 hover:text-rose-800 underline"
                  >
                    Alle erledigten leeren
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {checkedGroceries.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => toggleGrocery(item.id)}
                      className="cursor-pointer flex items-center justify-between p-3 rounded-xl border border-stone-200 dark:border-slate-800 bg-white/80 dark:bg-slate-800/60 text-stone-400 hover:bg-white dark:hover:bg-slate-800 transition-colors text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-5 h-5 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                        <span className="line-through font-bold text-stone-500 dark:text-slate-400 truncate text-sm">
                          {item.name}
                        </span>
                        {item.amount && (
                          <span className="text-[11px] text-stone-400 shrink-0">
                            ({item.amount})
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteGrocery(item.id);
                        }}
                        className="text-stone-300 hover:text-rose-600 p-1 ml-2"
                        title="Löschen"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* CHORES & REWARDS TAB */}
      {activeTab === 'chores' && (
        <div className="space-y-6">
          <div className="duo-card p-6 bg-gradient-to-r from-amber-50 via-rose-50 to-indigo-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 border-2 border-amber-200 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Star className="w-6 h-6 text-amber-500 fill-amber-400" />
                  <h3 className="text-lg font-black text-stone-900 dark:text-white">
                    Familien-Sterne & Belohnungen
                  </h3>
                </div>
                <p className="text-xs font-semibold text-stone-600 dark:text-slate-300 mt-0.5">
                  Aufgaben erledigen und Sterne sammeln! Gesamtstand der Familie:{' '}
                  <strong className="text-amber-600 dark:text-amber-400 font-extrabold">{totalStarsEarned} Sterne</strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                {choreSubTab === 'chores' ? (
                  <button
                    onClick={openAddChore}
                    className="duo-btn duo-btn-amber px-4 py-2.5 text-xs font-black rounded-2xl shadow-sm"
                  >
                    <Plus className="w-4 h-4 mr-1 stroke-[3]" />
                    <span>Aufgabe</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsAddRewardOpen(true)}
                    className="duo-btn duo-btn-purple px-4 py-2.5 text-xs font-black rounded-2xl shadow-sm"
                  >
                    <Plus className="w-4 h-4 mr-1 stroke-[3]" />
                    <span>Belohnung</span>
                  </button>
                )}
              </div>
            </div>

            {/* Member Star Counts */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4">
              {members.map((m) => {
                const memberStars = chores
                  .filter((c) => c.assignedMemberId === m.id && c.completed)
                  .reduce((sum, c) => sum + c.stars, 0);
                const available = getMemberStarBalance(m.id);

                return (
                  <div
                    key={m.id}
                    className="bg-white dark:bg-slate-800 p-3 rounded-2xl border-2 border-stone-200 dark:border-slate-700 shadow-2xs flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{m.avatar}</span>
                      <div>
                        <p className="text-xs font-black text-stone-800 dark:text-white">{m.name}</p>
                        <p className="text-[10px] text-stone-400 font-bold">{m.role}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded-lg block">
                        ⭐ {available}
                      </span>
                      {m.isChild && (
                        <span className="text-[9px] font-semibold text-stone-400 block mt-0.5">
                          ({memberStars} ges.)
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sub-tab switch: Aufgaben vs Belohnungs-Shop */}
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-amber-200/60 dark:border-slate-700/60">
              <button
                type="button"
                onClick={() => setChoreSubTab('chores')}
                className={`duo-btn px-4 py-2 text-xs font-black rounded-xl transition-all ${
                  choreSubTab === 'chores'
                    ? 'duo-btn-amber'
                    : 'duo-btn-white text-stone-600 dark:text-slate-300'
                }`}
              >
                <span>📋 Aufgaben ({filteredChores.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setChoreSubTab('rewards')}
                className={`duo-btn px-4 py-2 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 ${
                  choreSubTab === 'rewards'
                    ? 'duo-btn-purple'
                    : 'duo-btn-white text-stone-600 dark:text-slate-300'
                }`}
              >
                <span>⭐ Belohnungs-Shop ({rewards.length})</span>
                {rewardClaims.filter((c) => c.status === 'pending').length > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full animate-pulse">
                    {rewardClaims.filter((c) => c.status === 'pending').length} offen
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* CHORES LIST SUB-TAB */}
          {choreSubTab === 'chores' && (
            <div className="duo-card p-6 bg-white dark:bg-slate-900 border-2 border-stone-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-black text-stone-900 dark:text-white">
                  Aktive Aufgaben ({filteredChores.length})
                </h4>
                <span className="text-xs text-stone-400 dark:text-slate-400 font-bold">
                  Zeige für: {currentMemberId === 'all' ? 'Ganze Familie' : 'Ausgewähltes Mitglied'}
                </span>
              </div>

              <div className="space-y-2">
                {filteredChores.map((chore) => {
                  const assigned = members.find((m) => m.id === chore.assignedMemberId);
                  return (
                    <div
                      key={chore.id}
                      onClick={() => toggleChore(chore.id)}
                      className={`cursor-pointer flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all ${
                        chore.completed
                          ? 'bg-amber-50/20 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 opacity-65'
                          : 'bg-stone-50/40 dark:bg-slate-800/60 border-b-4 border-stone-200 dark:border-slate-700 hover:bg-stone-50 dark:hover:bg-slate-800 hover:border-amber-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {chore.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-amber-500 fill-amber-100 dark:fill-amber-950/50 shrink-0" />
                        ) : (
                          <Circle className="w-5 h-5 text-stone-300 dark:text-slate-600 hover:text-amber-500 shrink-0" />
                        )}

                        <div>
                          <p
                            className={`text-sm font-black ${
                              chore.completed
                                ? 'line-through text-stone-400 dark:text-slate-500'
                                : 'text-stone-800 dark:text-white'
                            }`}
                          >
                            {chore.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-stone-100 dark:bg-slate-700 text-stone-600 dark:text-slate-300">
                              {chore.frequency === 'daily' ? 'Täglich' : chore.frequency === 'weekly' ? 'Wöchentlich' : 'Einmalig'}
                            </span>
                            {assigned && (
                              <span className="text-xs text-stone-500 dark:text-slate-400 flex items-center gap-1 font-bold">
                                <span>Zugewiesen an:</span>
                                <span>{assigned.avatar}</span>
                                <span className="text-stone-700 dark:text-slate-200">{assigned.name}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 text-xs font-black border border-amber-300 dark:border-amber-700">
                          <span>⭐</span>
                          <span>+{chore.stars} Sterne</span>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditChore(chore);
                          }}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                          title="Aufgabe bearbeiten"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteChore(chore.id);
                          }}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Aufgabe löschen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* REWARDS SHOP SUB-TAB */}
          {choreSubTab === 'rewards' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Star Banks per Child / Member */}
              <div className="duo-card p-6 bg-white dark:bg-slate-900 border-2 border-stone-200 dark:border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-base font-black text-stone-900 dark:text-white flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-amber-500" />
                      <span>Sterne-Sparkonten der Kinder</span>
                    </h4>
                    <p className="text-xs font-semibold text-stone-500 dark:text-slate-400">
                      Erledigte Aufgaben bringen Sterne, die hier gegen tolle Familien-Belohnungen eingelöst werden können!
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsAddRewardOpen(true)}
                    className="duo-btn duo-btn-purple px-4 py-2.5 text-xs font-black rounded-2xl shadow-sm self-start sm:self-auto"
                  >
                    <Plus className="w-4 h-4 mr-1 stroke-[3]" />
                    <span>Eigene Belohnung</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                  {eligibleRewardMembers.map((m) => {
                    const balance = getMemberStarBalance(m.id);
                    const isSelected = selectedChildForReward === m.id;
                    const totalEarned = chores
                      .filter((c) => c.assignedMemberId === m.id && c.completed)
                      .reduce((sum, c) => sum + c.stars, 0);
                    const spent = rewardClaims
                      .filter((c) => c.memberId === m.id)
                      .reduce((sum, c) => sum + c.starsSpent, 0);

                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedChildForReward(m.id)}
                        className={`text-left p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-400 dark:border-amber-500 shadow-sm ring-2 ring-amber-400/20'
                            : 'bg-stone-50/60 dark:bg-slate-800/40 border-stone-200 dark:border-slate-700 hover:border-amber-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2.5">
                            <span className="text-2xl">{m.avatar}</span>
                            <div>
                              <p className="text-sm font-black text-stone-900 dark:text-white">{m.name}</p>
                              <p className="text-[10px] font-bold text-stone-400">{m.role}</p>
                            </div>
                          </div>
                          {isSelected && (
                            <span className="text-[10px] font-black uppercase bg-amber-500 text-white px-2 py-0.5 rounded-full shadow-2xs">
                              Aktiv
                            </span>
                          )}
                        </div>

                        <div className="flex items-baseline justify-between mt-3 pt-2 border-t border-stone-200/50 dark:border-slate-700/50">
                          <span className="text-xs font-bold text-stone-500 dark:text-slate-400">Verfügbar:</span>
                          <span className="text-lg font-black text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            ⭐ {balance} Sterne
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-semibold text-stone-400 mt-0.5">
                          <span>Gesamt: {totalEarned} ⭐</span>
                          <span>Eingelöst: {spent} ⭐</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Selected child notification / hint */}
                <div className="bg-amber-50/50 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-200 dark:border-amber-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-stone-700 dark:text-slate-200">
                    <span>💡</span>
                    <span>
                      Belohnungen werden eingelöst für:{' '}
                      <strong className="font-black text-amber-700 dark:text-amber-400">
                        {members.find((m) => m.id === selectedChildForReward)?.name || 'Ausgewähltes Kind'}
                      </strong>{' '}
                      (Guthaben: {getMemberStarBalance(selectedChildForReward)} Sterne)
                    </span>
                  </div>
                  {rewardError && (
                    <span className="font-black text-rose-600 dark:text-rose-400 animate-bounce">
                      {rewardError}
                    </span>
                  )}
                </div>
              </div>

              {/* Available Rewards Grid */}
              <div className="duo-card p-6 bg-white dark:bg-slate-900 border-2 border-stone-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-black text-stone-900 dark:text-white flex items-center gap-2">
                    <Gift className="w-5 h-5 text-purple-500" />
                    <span>Verfügbare Belohnungen</span>
                  </h4>
                  <span className="text-xs font-bold text-stone-400 dark:text-slate-400">
                    {rewards.length} Belohnungen im Katalog
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rewards.map((reward) => {
                    const currentChildBalance = getMemberStarBalance(selectedChildForReward);
                    const canAfford = currentChildBalance >= reward.starsCost;
                    const needed = reward.starsCost - currentChildBalance;

                    return (
                      <div
                        key={reward.id}
                        className={`p-4 rounded-2xl border-2 flex flex-col justify-between transition-all ${
                          canAfford
                            ? 'bg-gradient-to-b from-white to-amber-50/30 dark:from-slate-800 dark:to-slate-800/80 border-stone-200 dark:border-slate-700 hover:border-amber-400 shadow-2xs'
                            : 'bg-stone-50/50 dark:bg-slate-900/60 border-stone-200/60 dark:border-slate-800/80 opacity-75'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span className="text-3xl p-2 bg-stone-100 dark:bg-slate-700/60 rounded-2xl">
                              {reward.icon}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="px-2.5 py-1 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 text-xs font-black border border-amber-300 dark:border-amber-700">
                                ⭐ {reward.starsCost}
                              </span>
                              {reward.id.startsWith('r_custom') && (
                                <button
                                  type="button"
                                  onClick={() => deleteReward(reward.id)}
                                  className="text-stone-300 hover:text-rose-500 p-1"
                                  title="Belohnung löschen"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          <h5 className="text-sm font-black text-stone-900 dark:text-white mb-1">
                            {reward.title}
                          </h5>
                          {reward.description && (
                            <p className="text-xs text-stone-500 dark:text-slate-400 leading-relaxed mb-3">
                              {reward.description}
                            </p>
                          )}
                        </div>

                        <div className="pt-3 mt-2 border-t border-stone-100 dark:border-slate-800">
                          {canAfford ? (
                            <button
                              type="button"
                              onClick={() => handleClaimReward(reward.id)}
                              className="w-full duo-btn duo-btn-amber py-2 text-xs font-black rounded-xl flex items-center justify-center gap-1.5 shadow-2xs hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                              <span>⭐ Einlösen</span>
                            </button>
                          ) : (
                            <div className="w-full py-2 px-3 rounded-xl bg-stone-100 dark:bg-slate-800 text-center text-xs font-bold text-stone-400 dark:text-slate-500 border border-stone-200 dark:border-slate-700">
                              Noch {needed} ⭐ benötigt
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Claims & History Section */}
              <div className="duo-card p-6 bg-white dark:bg-slate-900 border-2 border-stone-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-black text-stone-900 dark:text-white flex items-center gap-2">
                      <Clock className="w-5 h-5 text-indigo-500" />
                      <span>Eingelöste Belohnungen & Gutscheine</span>
                    </h4>
                    <p className="text-xs font-semibold text-stone-500 dark:text-slate-400">
                      Von Kindern beantragte Belohnungen können hier von den Eltern genehmigt & abgehakt werden.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-stone-400 dark:text-slate-400">
                    {rewardClaims.length} gesamt
                  </span>
                </div>

                {rewardClaims.length === 0 ? (
                  <div className="text-center py-8 text-stone-400 dark:text-slate-500 space-y-2">
                    <span className="text-3xl block">🎟️</span>
                    <p className="text-xs font-bold">Noch keine Belohnungen beantragt.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {rewardClaims.map((claim) => {
                      const claimant = members.find((m) => m.id === claim.memberId);
                      const isPending = claim.status === 'pending';

                      return (
                        <div
                          key={claim.id}
                          className={`p-3.5 rounded-2xl border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                            isPending
                              ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60'
                              : 'bg-stone-50/40 dark:bg-slate-800/40 border-stone-200 dark:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl p-2 bg-white dark:bg-slate-800 rounded-xl border border-stone-200 dark:border-slate-700">
                              {claim.rewardIcon}
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <h5 className="text-sm font-black text-stone-900 dark:text-white">
                                  {claim.rewardTitle}
                                </h5>
                                <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                                  (-{claim.starsSpent} ⭐)
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-slate-400 mt-0.5">
                                <span>Eingelöst von:</span>
                                <span className="font-bold text-stone-700 dark:text-slate-200">
                                  {claimant?.avatar} {claimant?.name || 'Kind'}
                                </span>
                                <span>•</span>
                                <span>
                                  {new Date(claim.claimedAt).toLocaleDateString('de-DE', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            {isPending ? (
                              <>
                                <span className="text-[11px] font-black px-2.5 py-1 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                                  ⏳ Wartet auf OK
                                </span>

                                <button
                                  type="button"
                                  onClick={() => approveClaim(claim.id)}
                                  className="duo-btn duo-btn-green px-3 py-1.5 text-xs font-black rounded-xl flex items-center gap-1 shadow-2xs"
                                  title="Von Eltern genehmigen & einlösen"
                                >
                                  <CheckCheck className="w-3.5 h-3.5" />
                                  <span>Genehmigen</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => deleteClaim(claim.id)}
                                  className="text-stone-400 hover:text-rose-500 p-1.5"
                                  title="Einlösung stornieren (Sterne erstatten)"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <>
                                <span className="text-[11px] font-black px-2.5 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 flex items-center gap-1">
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  <span>Genehmigt & Eingelöst</span>
                                </span>

                                <button
                                  type="button"
                                  onClick={() => deleteClaim(claim.id)}
                                  className="text-stone-300 hover:text-rose-500 p-1.5"
                                  title="Eintrag entfernen"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Custom Store Modal */}
      {showAddStoreModal && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-xl border-2 border-stone-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
              <h3 className="text-lg font-black text-stone-900 dark:text-white mb-2">Laden hinzufügen</h3>
              <p className="text-xs font-semibold text-stone-500 dark:text-slate-400 mb-4">
                Füge ein Geschäft für eure Familie hinzu (z.B. Aldi, Edeka, Bauhaus, Wochenmarkt).
              </p>
              <form onSubmit={handleAddCustomStore} className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-stone-600 dark:text-slate-300 uppercase mb-1">Name des Geschäfts</label>
                  <input
                    type="text"
                    placeholder="z.B. Aldi, Edeka, Bauhaus"
                    value={newCustomStoreName}
                    onChange={(e) => setNewCustomStoreName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-sm focus:outline-none"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddStoreModal(false)}
                    className="duo-btn duo-btn-white px-4 py-2 text-xs font-bold rounded-xl"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    className="duo-btn duo-btn-green px-5 py-2 text-xs font-black rounded-xl"
                  >
                    Laden hinzufügen
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Add Chore Modal */}
      {isAddChoreOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-xl border-2 border-stone-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
              <h3 className="text-lg font-black text-stone-900 dark:text-white mb-1">
                {editingChoreId ? 'Aufgabe bearbeiten' : 'Aufgabe im Haushalt anlegen'}
              </h3>
              <form onSubmit={handleAddChore} className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-stone-600 dark:text-slate-300 uppercase mb-1">
                    Beschreibung
                  </label>
                  <input
                    type="text"
                    placeholder="z.B. Bett machen, Spülmaschine ausräumen, Tomaten gießen"
                    value={choreTitle}
                    onChange={(e) => setChoreTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-sm focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-stone-600 dark:text-slate-300 uppercase mb-1">
                    Zuweisen an
                  </label>
                  <select
                    value={choreAssignee}
                    onChange={(e) => setChoreAssignee(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 text-stone-900 dark:text-white focus:outline-none"
                  >
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.avatar} {m.name} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black text-stone-600 dark:text-slate-300 uppercase mb-1">
                      Häufigkeit
                    </label>
                    <select
                      value={choreFrequency}
                      onChange={(e) => setChoreFrequency(e.target.value as Chore['frequency'])}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 text-stone-900 dark:text-white focus:outline-none"
                    >
                      <option value="daily">Täglich</option>
                      <option value="weekly">Wöchentlich</option>
                      <option value="once">Einmalig</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-stone-600 dark:text-slate-300 uppercase mb-1">
                      Belohnung (Sterne)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={choreStars}
                      onChange={(e) => setChoreStars(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 text-stone-900 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddChoreOpen(false);
                      setEditingChoreId(null);
                    }}
                    className="duo-btn duo-btn-white px-4 py-2 text-xs font-bold rounded-xl"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    className="duo-btn duo-btn-amber px-5 py-2 text-xs font-black rounded-xl"
                  >
                    {editingChoreId ? 'Änderungen speichern' : 'Aufgabe anlegen'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Add Custom Reward Modal */}
      {isAddRewardOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-xl border-2 border-stone-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
              <h3 className="text-lg font-black text-stone-900 dark:text-white mb-1 flex items-center gap-2">
                <Gift className="w-5 h-5 text-purple-500" />
                <span>Eigene Familien-Belohnung erstellen</span>
              </h3>
              <p className="text-xs font-semibold text-stone-500 dark:text-slate-400 mb-4">
                Lege eine neue Belohnung fest, die sich eure Kinder mit ihren erledigten Haushaltsaufgaben verdienen können.
              </p>

              <form onSubmit={handleCreateReward} className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-stone-600 dark:text-slate-300 uppercase mb-1">
                    Titel der Belohnung
                  </label>
                  <input
                    type="text"
                    placeholder="z.B. Zoobesuch, Pizza-Abend, 45 Min Nintendo Switch"
                    value={newRewardTitle}
                    onChange={(e) => setNewRewardTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-sm focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-stone-600 dark:text-slate-300 uppercase mb-1">
                    Beschreibung (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="z.B. Ein Ausflug am Wochenende mit der ganzen Familie"
                    value={newRewardDescription}
                    onChange={(e) => setNewRewardDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-sm focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black text-stone-600 dark:text-slate-300 uppercase mb-1">
                      Kosten in Sternen
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={newRewardCost}
                      onChange={(e) => setNewRewardCost(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 text-stone-900 dark:text-white focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-stone-600 dark:text-slate-300 uppercase mb-1">
                      Icon / Emoji
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        maxLength={2}
                        value={newRewardIcon}
                        onChange={(e) => setNewRewardIcon(e.target.value)}
                        className="w-14 text-center px-2 py-2 rounded-xl border border-stone-300 dark:border-slate-700 text-lg bg-white dark:bg-slate-800 text-stone-900 dark:text-white focus:outline-none"
                        required
                      />
                      <div className="flex gap-1 overflow-x-auto text-base">
                        {['🍦', '🎮', '🎬', '🍕', '🎡', '⛺', '🛹', '🎳'].map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => setNewRewardIcon(emoji)}
                            className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-slate-800"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsAddRewardOpen(false)}
                    className="duo-btn duo-btn-white px-4 py-2 text-xs font-bold rounded-xl"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    className="duo-btn duo-btn-purple px-5 py-2 text-xs font-black rounded-xl"
                  >
                    Belohnung speichern
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Shopping Focus Mode Modal */}
      <ShoppingFocusModal
        isOpen={isShoppingFocusOpen}
        onClose={() => setIsShoppingFocusOpen(false)}
        groceries={groceries}
        stores={stores}
        onToggleItem={toggleGrocery}
        onClearChecked={clearCheckedGroceries}
      />

      {/* Voice Input Modal */}
      <VoiceInputModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onAddItems={handleVoiceAddItems}
      />
    </div>
  );
};
