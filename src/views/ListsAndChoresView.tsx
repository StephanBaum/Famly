import React, { useState } from 'react';
import { useFamily } from '../context/FamilyContext';
import { Chore } from '../types';
import { ModalPortal } from '../components/ModalPortal';
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
    currentMemberId,
  } = useFamily();

  const [activeTab, setActiveTab] = useState<'groceries' | 'chores'>('groceries');
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [showStaplesDrawer, setShowStaplesDrawer] = useState(false);
  const [newStapleName, setNewStapleName] = useState('');
  const [newCustomStoreName, setNewCustomStoreName] = useState('');
  const [showAddStoreModal, setShowAddStoreModal] = useState(false);
  const [learnedNotification, setLearnedNotification] = useState<string | null>(null);

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
          <div className="duo-card p-4 bg-white dark:bg-slate-900 border-2 border-stone-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              <span className="text-xs font-black text-stone-400 dark:text-slate-400 uppercase tracking-wider mr-1">
                Laden:
              </span>

              {/* All Stores button */}
              <button
                onClick={() => setSelectedStore('all')}
                className={`duo-btn px-3.5 py-2 rounded-2xl text-xs font-black transition-all ${
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
                    className={`duo-btn px-3.5 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 ${
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
                className="duo-btn duo-btn-white px-3 py-2 text-xs font-extrabold rounded-2xl text-stone-500 dark:text-slate-300"
                title="Eigenen Laden hinzufügen (z.B. Aldi, Edeka, Bauhaus)"
              >
                + Laden
              </button>
            </div>

            {/* In-Stock Pantry Staples Drawer Button */}
            <button
              onClick={() => setShowStaplesDrawer(!showStaplesDrawer)}
              className="duo-btn duo-btn-white px-3.5 py-2 rounded-2xl text-xs font-black text-stone-700 dark:text-slate-200 flex items-center gap-1.5 self-start md:self-auto shrink-0"
            >
              <Home className="w-3.5 h-3.5 text-amber-500" />
              <span>Vorräte ({alwaysInStock.length} da)</span>
            </button>
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
            className="duo-card p-4 sm:p-5 bg-white dark:bg-slate-900 border-2 border-stone-200 dark:border-slate-800 space-y-3"
          >
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <input
                type="text"
                placeholder={
                  selectedStore === 'all'
                    ? 'Artikel hinzufügen (z.B. Milch, Äpfel, Brot, Waschmittel)...'
                    : `Artikel für ${selectedStore} hinzufügen...`
                }
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="flex-1 px-4 py-3 text-base font-bold rounded-2xl border-2 border-stone-200 dark:border-slate-700 focus:outline-none focus:border-emerald-500 bg-white dark:bg-slate-800 text-stone-900 dark:text-white placeholder-stone-400"
                required
              />
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Menge (z.B. 500g)"
                  value={newItemAmount}
                  onChange={(e) => setNewItemAmount(e.target.value)}
                  className="w-32 sm:w-36 px-3.5 py-3 text-base font-bold rounded-2xl border-2 border-stone-200 dark:border-slate-700 focus:outline-none focus:border-emerald-500 bg-white dark:bg-slate-800 text-stone-900 dark:text-white placeholder-stone-400"
                />
                
                {selectedStore === 'all' && (
                  <select
                    value={newItemStore}
                    onChange={(e) => setNewItemStore(e.target.value)}
                    className="w-28 sm:w-36 px-2.5 py-3 text-sm font-black rounded-2xl border-2 border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  >
                    {stores.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.icon} {s.name}
                      </option>
                    ))}
                  </select>
                )}

                <button
                  type="submit"
                  className="duo-btn duo-btn-green px-5 py-3 text-sm font-black rounded-2xl shrink-0 shadow-sm"
                >
                  + Neu
                </button>
              </div>
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
              <div className="space-y-2.5">
                {uncheckedGroceries.map((item) => {
                  const addedBy = members.find((m) => m.id === item.addedByMemberId);

                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleGrocery(item.id)}
                      className="cursor-pointer group duo-card p-3.5 sm:p-4 bg-white dark:bg-slate-900 border-2 border-stone-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all flex items-center justify-between gap-3 shadow-xs active:scale-[0.99]"
                    >
                      {/* Left: Big Checkbox + Name + Amount */}
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <div
                          className="w-9 h-9 rounded-2xl border-2 border-stone-300 dark:border-slate-700 group-hover:border-emerald-500 bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 transition-colors shadow-2xs"
                        >
                          <Check className="w-5 h-5 text-transparent group-hover:text-emerald-300 transition-colors" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-base sm:text-lg font-black text-stone-900 dark:text-white leading-snug">
                              {item.name}
                            </span>
                            {item.amount && (
                              <span className="text-xs font-extrabold bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded-lg border border-amber-300 dark:border-amber-700 shrink-0">
                                {item.amount}
                              </span>
                            )}
                          </div>

                          {/* Secondary tag line: Store pill + Added By */}
                          <div
                            className="flex items-center gap-2 mt-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <select
                              value={item.store}
                              onChange={(e) => handleStoreChange(item.id, item.name, e.target.value)}
                              title="Laden wechseln"
                              className="text-xs font-bold bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300 px-2 py-0.5 rounded-lg border border-stone-200 dark:border-slate-700 focus:outline-none"
                            >
                              {stores.map((s) => (
                                <option key={s.id} value={s.name}>
                                  {s.icon} {s.name}
                                </option>
                              ))}
                            </select>

                            <button
                              type="button"
                              onClick={() => handleMoveToStaples(item.id, item.name)}
                              title="Als Vorrat zu Hause markieren"
                              className="text-stone-400 hover:text-amber-600 text-xs font-bold flex items-center gap-0.5 hover:underline"
                            >
                              <span>🏠</span>
                              <span className="hidden sm:inline text-[11px]">Vorrat</span>
                            </button>

                            {addedBy && (
                              <span
                                title={`Hinzugefügt von ${addedBy.name}`}
                                className="text-xs font-bold text-stone-400 ml-auto hidden sm:inline-flex items-center gap-1"
                              >
                                <span>{addedBy.avatar}</span>
                                <span>{addedBy.name}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Quick Delete Button */}
                      <div
                        className="shrink-0 pl-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => deleteGrocery(item.id)}
                          className="w-9 h-9 rounded-xl text-stone-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center transition-colors"
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

      {/* CHORES TAB */}
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

              <button
                onClick={openAddChore}
                className="duo-btn duo-btn-amber px-4 py-2.5 text-xs font-black rounded-2xl shadow-sm"
              >
                <Plus className="w-4 h-4 mr-1 stroke-[3]" />
                <span>+ Aufgabe</span>
              </button>
            </div>

            {/* Member Star Counts */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4">
              {members.map((m) => {
                const memberStars = chores
                  .filter((c) => c.assignedMemberId === m.id && c.completed)
                  .reduce((sum, c) => sum + c.stars, 0);

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
                    <span className="text-xs font-black text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded-lg">
                      ⭐ {memberStars}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chores List */}
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
    </div>
  );
};
