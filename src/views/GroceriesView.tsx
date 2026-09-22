import React, { useState } from 'react';
import { useFamily } from '../context/FamilyContext';
import { ModalPortal } from '../components/ModalPortal';
import { ShoppingFocusModal } from '../components/ShoppingFocusModal';
import { VoiceInputModal } from '../components/VoiceInputModal';
import { GroceriesTab } from '../components/groceries/GroceriesTab';
import { StaplesDrawer } from '../components/groceries/StaplesDrawer';
import { ShoppingCart } from 'lucide-react';

export const GroceriesView: React.FC = () => {
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
    deduplicateGroceries,
    cleanPastMealGroceries,
    alwaysInStock,
    toggleAlwaysInStock,
  } = useFamily();

  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [showStaplesDrawer, setShowStaplesDrawer] = useState(false);
  const [newCustomStoreName, setNewCustomStoreName] = useState('');
  const [showAddStoreModal, setShowAddStoreModal] = useState(false);
  const [learnedNotification, setLearnedNotification] = useState<string | null>(null);

  // Focus & Voice Modals
  const [isShoppingFocusOpen, setIsShoppingFocusOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  const handleAddCustomStore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomStoreName.trim()) return;
    addStore(newCustomStoreName.trim(), '🏬');
    setSelectedStore(newCustomStoreName.trim());
    setNewCustomStoreName('');
    setShowAddStoreModal(false);
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

  return (
    <div className="space-y-4 animate-in fade-in">
      {/* Top Header */}
      <div className="duo-card p-4 sm:p-5 bg-white dark:bg-slate-900 border-2 border-stone-200 dark:border-slate-800 flex items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-black text-xl shadow-2xs shrink-0">
            <ShoppingCart className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-stone-900 dark:text-white">
              Einkaufsliste
            </h2>
            <p className="text-xs font-semibold text-stone-500 dark:text-slate-400">
              Schnell planen, abhaken und Vorräte im Blick behalten.
            </p>
          </div>
        </div>

        {learnedNotification && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-xs font-bold text-emerald-800 dark:text-emerald-300 animate-in fade-in">
            <span>✨</span>
            <span>{learnedNotification}</span>
          </div>
        )}
      </div>

      {/* Staples Drawer */}
      <StaplesDrawer
        isOpen={showStaplesDrawer}
        onClose={() => setShowStaplesDrawer(false)}
        staples={alwaysInStock}
        onToggleStaple={toggleAlwaysInStock}
      />

      {/* Groceries Tab Component */}
      <GroceriesTab
        groceries={groceries}
        stores={stores}
        selectedStore={selectedStore}
        alwaysInStock={alwaysInStock}
        members={members}
        onSelectStore={setSelectedStore}
        onAddGrocery={addGrocery}
        onToggleGrocery={toggleGrocery}
        onDeleteGrocery={deleteGrocery}
        onClearChecked={clearCheckedGroceries}
        onMoveToStaples={handleMoveToStaples}
        onOpenStoreModal={() => setShowAddStoreModal(true)}
        onOpenFocusModal={() => setIsShoppingFocusOpen(true)}
        onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
        onToggleStaplesDrawer={() => setShowStaplesDrawer(!showStaplesDrawer)}
        showStaplesDrawer={showStaplesDrawer}
        onStoreChange={handleStoreChange}
        onDeduplicate={deduplicateGroceries}
        onCleanPast={cleanPastMealGroceries}
      />

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
                  <label className="block text-xs font-black text-stone-600 dark:text-slate-300 uppercase mb-1">
                    Name des Geschäfts
                  </label>
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
