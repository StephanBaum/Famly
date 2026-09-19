import React, { useState, useRef } from 'react';
import { useFamily } from '../context/FamilyContext';
import {
  X,
  Moon,
  Sun,
  Download,
  Upload,
  ShieldCheck,
  Check,
  RotateCcw,
  ChevronRight,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: any) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
}) => {
  const {
    isDarkMode,
    toggleDarkMode,
    familyName,
    setFamilyName,
    exportAllData,
    importAllData,
    resetToDefaults,
    members,
    recipes,
    groceries,
    appointments,
    chores,
    galleries,
  } = useFamily();

  const [inputFamilyName, setInputFamilyName] = useState(familyName);
  const [nameSaved, setNameSaved] = useState(false);
  const [importStatus, setImportStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleSaveFamilyName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputFamilyName.trim()) return;
    setFamilyName(inputFamilyName.trim());
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2000);
  };

  const handleExport = () => {
    const jsonStr = exportAllData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `famly-backup-${inputFamilyName.toLowerCase().replace(/\s+/g, '-')}-${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        const res = importAllData(content);
        if (res.success) {
          setImportStatus({ success: true, message: 'Family data successfully restored!' });
          setTimeout(() => setImportStatus(null), 3500);
        } else {
          setImportStatus({ success: false, message: res.error || 'Failed to import backup' });
        }
      }
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border-2 border-stone-200 dark:border-slate-800 animate-in zoom-in-95 my-auto space-y-6 text-stone-900 dark:text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-xl font-black shadow-xs">
              ⚙️
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight">
                Settings & Data Management
              </h2>
              <p className="text-xs font-semibold text-stone-400 dark:text-slate-400">
                Customize Famly, manage storage, and switch themes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 text-stone-500 dark:text-slate-400 flex items-center justify-center font-black transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section 1: Appearance & Dark Mode Toggle */}
        <div className="duo-card p-4 sm:p-5 bg-stone-50 dark:bg-slate-800/60 border border-stone-200 dark:border-slate-700 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-indigo-950/70 text-amber-700 dark:text-indigo-400 flex items-center justify-center">
                {isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </div>
              <div>
                <h4 className="text-sm font-black">Color Theme</h4>
                <p className="text-xs text-stone-500 dark:text-slate-400 font-semibold">
                  {isDarkMode ? 'Dark Mode (Night-friendly slate)' : 'Light Mode (Fresh daytime colors)'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleDarkMode}
              className={`duo-btn px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${
                isDarkMode
                  ? 'duo-btn-purple'
                  : 'duo-btn-amber'
              }`}
            >
              {isDarkMode ? (
                <>
                  <Sun className="w-3.5 h-3.5" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Section 2: Family Identity */}
        <form onSubmit={handleSaveFamilyName} className="space-y-2">
          <label className="block text-xs font-black uppercase text-stone-500 dark:text-slate-400 tracking-wider">
            Family Name
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputFamilyName}
              onChange={(e) => setInputFamilyName(e.target.value)}
              placeholder="e.g. Baum Family, Miller Family"
              className="flex-1 px-4 py-2.5 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="submit"
              className="duo-btn duo-btn-green px-5 py-2.5 text-xs font-black rounded-xl shrink-0 flex items-center gap-1.5"
            >
              {nameSaved ? <Check className="w-4 h-4 stroke-[3]" /> : null}
              <span>{nameSaved ? 'Saved!' : 'Save'}</span>
            </button>
          </div>
        </form>

        {/* Section 3: How Data Is Stored (Architecture Explanation) */}
        <div className="bg-emerald-50/70 dark:bg-emerald-950/30 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/50 space-y-2">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400">
            <ShieldCheck className="w-5 h-5 shrink-0 stroke-[2.5]" />
            <h4 className="text-xs sm:text-sm font-black">
              How & Where Your Data Is Stored
            </h4>
          </div>
          <p className="text-xs text-emerald-900/90 dark:text-emerald-200/90 font-medium leading-relaxed">
            Famly is <strong>Local-First and 100% Private</strong>. All recipes, grocery items, appointments, chores, and albums are stored directly in your browser's persistent <code className="bg-white/80 dark:bg-slate-900 px-1 py-0.5 rounded font-mono text-[11px]">localStorage</code>.
          </p>
          <ul className="text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold space-y-1 list-disc list-inside">
            <li>Zero external tracking or third-party servers reading your household data.</li>
            <li>Instant offline performance — works even without internet connection.</li>
            <li>Default starting data is defined in <code className="bg-white/80 dark:bg-slate-900 px-1 py-0.5 rounded font-mono">src/utils/initialData.ts</code>.</li>
          </ul>
        </div>

        {/* Current Database Summary Chips (Clickable to customize) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="block text-xs font-black uppercase text-stone-500 dark:text-slate-400 tracking-wider">
              Where to Customize Your Data
            </span>
            <span className="text-[11px] font-bold text-stone-400 dark:text-slate-500">Tap to edit</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
            <button
              type="button"
              onClick={() => onNavigateTab('members')}
              className="p-2 rounded-xl bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 border border-stone-200 dark:border-slate-700 transition-all hover:scale-105 active:scale-95"
            >
              <span className="block text-sm font-black text-emerald-600 dark:text-emerald-400">{members.length}</span>
              <span className="text-[10px] font-extrabold text-stone-600 dark:text-slate-300 flex items-center justify-center gap-0.5">
                Members <ChevronRight className="w-2.5 h-2.5 inline opacity-60" />
              </span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('meals')}
              className="p-2 rounded-xl bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 border border-stone-200 dark:border-slate-700 transition-all hover:scale-105 active:scale-95"
            >
              <span className="block text-sm font-black text-teal-600 dark:text-teal-400">{recipes.length}</span>
              <span className="text-[10px] font-extrabold text-stone-600 dark:text-slate-300 flex items-center justify-center gap-0.5">
                Recipes <ChevronRight className="w-2.5 h-2.5 inline opacity-60" />
              </span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('calendar')}
              className="p-2 rounded-xl bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 border border-stone-200 dark:border-slate-700 transition-all hover:scale-105 active:scale-95"
            >
              <span className="block text-sm font-black text-blue-600 dark:text-blue-400">{appointments.length}</span>
              <span className="text-[10px] font-extrabold text-stone-600 dark:text-slate-300 flex items-center justify-center gap-0.5">
                Events <ChevronRight className="w-2.5 h-2.5 inline opacity-60" />
              </span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('lists')}
              className="p-2 rounded-xl bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 border border-stone-200 dark:border-slate-700 transition-all hover:scale-105 active:scale-95"
            >
              <span className="block text-sm font-black text-amber-600 dark:text-amber-400">{groceries.length}</span>
              <span className="text-[10px] font-extrabold text-stone-600 dark:text-slate-300 flex items-center justify-center gap-0.5">
                Groceries <ChevronRight className="w-2.5 h-2.5 inline opacity-60" />
              </span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('lists')}
              className="p-2 rounded-xl bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 border border-stone-200 dark:border-slate-700 transition-all hover:scale-105 active:scale-95"
            >
              <span className="block text-sm font-black text-purple-600 dark:text-purple-400">{chores.length}</span>
              <span className="text-[10px] font-extrabold text-stone-600 dark:text-slate-300 flex items-center justify-center gap-0.5">
                Chores <ChevronRight className="w-2.5 h-2.5 inline opacity-60" />
              </span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('photos')}
              className="p-2 rounded-xl bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 border border-stone-200 dark:border-slate-700 transition-all hover:scale-105 active:scale-95"
            >
              <span className="block text-sm font-black text-rose-600 dark:text-rose-400">{galleries.length}</span>
              <span className="text-[10px] font-extrabold text-stone-600 dark:text-slate-300 flex items-center justify-center gap-0.5">
                Albums <ChevronRight className="w-2.5 h-2.5 inline opacity-60" />
              </span>
            </button>
          </div>
        </div>

        {/* Section 4: Backup & Restore (JSON Export / Import) */}
        <div className="space-y-3 pt-2 border-t border-stone-100 dark:border-slate-800">
          <label className="block text-xs font-black uppercase text-stone-500 dark:text-slate-400 tracking-wider">
            Backup & Transfer Data
          </label>

          {importStatus && (
            <div
              className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                importStatus.success
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  : 'bg-rose-100 text-rose-900 border border-rose-300'
              }`}
            >
              <span>{importStatus.success ? '✓' : '⚠️'}</span>
              <span>{importStatus.message}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Export JSON Button */}
            <button
              type="button"
              onClick={handleExport}
              className="duo-btn duo-btn-white p-3 rounded-2xl flex items-center justify-center gap-2 text-xs font-black text-stone-800 dark:text-slate-200"
            >
              <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Download Backup (JSON)</span>
            </button>

            {/* Import JSON Button */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileImport}
                className="hidden"
                id="famly-json-import-input"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full duo-btn duo-btn-white p-3 rounded-2xl flex items-center justify-center gap-2 text-xs font-black text-stone-800 dark:text-slate-200"
              >
                <Upload className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Restore Backup (JSON)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Section 5: Reset Data / Danger Zone */}
        <div className="pt-2 border-t border-stone-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Reset all family data back to the demo sample? Any custom changes not backed up will be reset.')) {
                resetToDefaults();
                onClose();
              }
            }}
            className="text-xs font-bold text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Demo Sample Data</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-black bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-300 transition-colors"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
