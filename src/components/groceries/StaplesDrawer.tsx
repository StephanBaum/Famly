import React, { useState } from 'react';

interface StaplesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  staples: string[];
  onToggleStaple: (name: string) => void;
}

export const StaplesDrawer: React.FC<StaplesDrawerProps> = ({
  isOpen,
  onClose,
  staples,
  onToggleStaple,
}) => {
  const [newStapleName, setNewStapleName] = useState('');

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStapleName.trim()) return;
    onToggleStaple(newStapleName.trim());
    setNewStapleName('');
  };

  return (
    <div className="duo-card p-4 sm:p-5 bg-amber-50/70 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-700 animate-in fade-in zoom-in-95 space-y-4">
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
          type="button"
          onClick={onClose}
          className="text-stone-400 hover:text-stone-700 dark:hover:text-white font-black text-sm p-1"
        >
          ✕
        </button>
      </div>

      {/* Add staple form */}
      <form onSubmit={handleAdd} className="flex gap-2">
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
        {staples.map((staple) => (
          <span
            key={staple}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-800 rounded-xl border-2 border-amber-200 dark:border-amber-700 text-xs font-bold text-stone-800 dark:text-slate-200 shadow-2xs"
          >
            <span>✓ {staple}</span>
            <button
              type="button"
              onClick={() => onToggleStaple(staple)}
              className="text-stone-300 hover:text-rose-600 ml-1 font-black text-xs"
              title="Entfernen"
            >
              ✕
            </button>
          </span>
        ))}
      </div>
    </div>
  );
};
