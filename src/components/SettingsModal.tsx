import React, { useState, useRef, useEffect } from 'react';
import { useFamily } from '../context/FamilyContext';
import { ModalPortal } from './ModalPortal';
import {
  getAIConfig,
  saveAIConfig,
  clearAIConfig,
  testAIConnection,
  AIProvider,
} from '../services/aiRecipeService';
import {
  checkVercelStorageStatus,
  pullVercelFamilyState,
  VercelSyncStatus,
} from '../services/vercelSync';
import { InstallAppBanner } from './InstallAppBanner';
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
  Cloud,
  CloudOff,
  Eye,
  EyeOff,
  Sparkles,
  ExternalLink,
  RefreshCw,
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
    loadDemoData,
    resetToFreshStart,
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

  // AI BYOK State
  const [aiProvider, setAiProvider] = useState<AIProvider>('gemini');
  const [aiKeyInput, setAiKeyInput] = useState('');
  const [showAiKey, setShowAiKey] = useState(false);
  const [aiTesting, setAiTesting] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<{ success?: boolean; message?: string } | null>(null);

  // Vercel Storage State
  const [vercelStatus, setVercelStatus] = useState<VercelSyncStatus | null>(null);
  const [isCheckingVercel, setIsCheckingVercel] = useState(false);
  const [manualSyncStatus, setManualSyncStatus] = useState<string | null>(null);

  // Load existing credentials and check Vercel status on mount / open
  useEffect(() => {
    if (isOpen) {
      setIsCheckingVercel(true);
      checkVercelStorageStatus(true).then((st) => {
        setVercelStatus(st);
        setIsCheckingVercel(false);
      });

      const aiCfg = getAIConfig();
      if (aiCfg) {
        setAiProvider(aiCfg.provider);
        setAiKeyInput(aiCfg.apiKey);
      } else {
        setAiKeyInput('');
      }
    }
  }, [isOpen]);

  const handleManualVercelSync = async () => {
    setIsCheckingVercel(true);
    setManualSyncStatus('Synchronisiere mit Vercel Storage...');
    const res = await pullVercelFamilyState();
    setIsCheckingVercel(false);
    if (res.success) {
      setManualSyncStatus('✓ Daten erfolgreich mit Vercel Storage synchronisiert!');
    } else {
      setManualSyncStatus('ℹ️ Noch keine entfernten Daten in Vercel Storage vorhanden (oder offline).');
    }
    setTimeout(() => setManualSyncStatus(null), 4000);
  };

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
          setImportStatus({ success: true, message: 'Familiendaten erfolgreich wiederhergestellt!' });
          setTimeout(() => setImportStatus(null), 3500);
        } else {
          setImportStatus({ success: false, message: res.error || 'Import fehlgeschlagen' });
        }
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // AI Handlers
  const handleTestAndSaveAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiKeyInput.trim()) {
      setAiFeedback({ success: false, message: 'Bitte einen API-Key eingeben.' });
      return;
    }

    setAiTesting(true);
    setAiFeedback(null);

    const result = await testAIConnection(aiProvider, aiKeyInput.trim());
    setAiTesting(false);

    if (result.success) {
      saveAIConfig(aiProvider, aiKeyInput.trim());
      setAiFeedback({ success: true, message: result.message });
      setTimeout(() => setAiFeedback(null), 4000);
    } else {
      setAiFeedback({ success: false, message: result.message });
    }
  };

  const handleClearAI = () => {
    clearAIConfig();
    setAiKeyInput('');
    setAiFeedback({ success: true, message: 'KI-Key entfernt. Lokaler Heuristik-Modus aktiv.' });
    setTimeout(() => setAiFeedback(null), 3000);
  };

  const currentAiConfig = getAIConfig();

  return (
    <>
      <ModalPortal>
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto scrollbar-none animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full shadow-2xl border-2 border-stone-200 dark:border-slate-800 animate-in zoom-in-95 my-auto text-stone-900 dark:text-slate-100 max-h-[90vh] flex flex-col overflow-hidden">
            
            {/* Header (fixed at top, cleanly visible) */}
            <div className="flex items-center justify-between p-4 sm:p-6 pb-4 border-b border-stone-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-xl font-black shadow-xs">
                  ⚙️
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black tracking-tight">
                    Einstellungen & Cloud
                  </h2>
                  <p className="text-xs font-semibold text-stone-400 dark:text-slate-400">
                    Cloud-Sync, KI-Keys & Design anpassen
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

            {/* Scrollable Content Body (clipped by rounded-3xl) */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 scrollbar-thin">
              {/* Section 1: Appearance & Dark Mode Toggle */}
            <div className="duo-card p-4 sm:p-5 bg-stone-50 dark:bg-slate-800/60 border border-stone-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-indigo-950/70 text-amber-700 dark:text-indigo-400 flex items-center justify-center">
                    {isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-black">Erscheinungsbild</h4>
                    <p className="text-xs text-stone-500 dark:text-slate-400 font-semibold">
                      {isDarkMode ? 'Dunkelmodus (Augenschonendes Nacht-Design)' : 'Hellmodus (Frische Tagesfarben)'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={toggleDarkMode}
                  className={`duo-btn px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${
                    isDarkMode ? 'duo-btn-purple' : 'duo-btn-amber'
                  }`}
                >
                  {isDarkMode ? (
                    <>
                      <Sun className="w-3.5 h-3.5" />
                      <span>Hellmodus</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-3.5 h-3.5" />
                      <span>Dunkelmodus</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* PWA Homescreen App Installation */}
            <InstallAppBanner />

            {/* Section 2: Vercel Cloud Sync (Out of the Box) */}
            <div className="duo-card p-4 sm:p-5 bg-stone-50 dark:bg-slate-800/60 border border-stone-200 dark:border-slate-700 space-y-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${
                      vercelStatus?.isAvailable
                        ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400'
                        : 'bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-400'
                    }`}
                  >
                    {vercelStatus?.isAvailable ? <Cloud className="w-5 h-5" /> : <CloudOff className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-black text-stone-900 dark:text-white">
                        Vercel Cloud Sync (Out of the Box)
                      </h4>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          vercelStatus?.isAvailable
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                            : 'bg-stone-200 text-stone-700 dark:bg-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {vercelStatus?.isAvailable
                          ? '🟢 Vercel Storage (Upstash Redis) Aktiv'
                          : 'ℹ️ Lokaler Modus'}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {vercelStatus?.isAvailable
                        ? 'Vollautomatische Synchronisierung aktiv! Alle Änderungen (Einkäufe, Aufgaben, Termine) werden live zwischen allen Geräten der Familie geteilt.'
                        : 'Famly läuft lokal im Browser. Um die App ohne Keys auf allen Geräten zu synchronisieren, verbinde einfach Vercel Storage (Upstash Redis) im Vercel Dashboard.'}
                    </p>
                  </div>
                </div>
              </div>

              {manualSyncStatus && (
                <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-950/60 border border-blue-200 text-blue-900 dark:text-blue-200 text-xs font-bold animate-in fade-in">
                  {manualSyncStatus}
                </div>
              )}

              {/* Vercel Action Bar */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {vercelStatus?.isAvailable ? (
                  <button
                    type="button"
                    onClick={handleManualVercelSync}
                    disabled={isCheckingVercel}
                    className="duo-btn duo-btn-blue px-3.5 py-2 text-xs font-black rounded-xl flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isCheckingVercel ? 'animate-spin' : ''}`} />
                    <span>Jetzt synchronisieren</span>
                  </button>
                ) : (
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 text-xs space-y-2 w-full">
                    <p className="font-black text-stone-800 dark:text-white flex items-center justify-between">
                      <span>1-Klick Setup im Vercel Dashboard (100% Kostenlos):</span>
                      <a
                        href="https://vercel.com/dashboard"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-0.5 text-[11px]"
                      >
                        vercel.com <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-stone-600 dark:text-slate-300 text-[11px]">
                      <li>Öffne dein Famly-Projekt auf <strong>vercel.com</strong></li>
                      <li>Klicke auf den Tab <strong>Storage</strong> ➔ <strong>Create Database</strong></li>
                      <li>Wähle <strong>Upstash Redis</strong> (Free Tier) & klicke <strong>Connect</strong></li>
                      <li>Fertig! Vercel setzt alle Zugangsdaten automatisch.</li>
                    </ol>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCheckingVercel(true);
                        checkVercelStorageStatus(true).then((st) => {
                          setVercelStatus(st);
                          setIsCheckingVercel(false);
                        });
                      }}
                      className="duo-btn duo-btn-white px-3 py-1.5 text-xs font-bold rounded-xl mt-2 flex items-center gap-1.5"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isCheckingVercel ? 'animate-spin' : ''}`} />
                      <span>Verbindung prüfen</span>
                    </button>
                  </div>
                )}
              </div>
            </div>



            {/* Section 3: Smart AI Recipe Assistant (BYOK) */}
            <div className="duo-card p-4 sm:p-5 bg-stone-50 dark:bg-slate-800/60 border border-stone-200 dark:border-slate-700 space-y-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${
                      currentAiConfig
                        ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400'
                        : 'bg-stone-200 dark:bg-slate-700 text-stone-600 dark:text-slate-400'
                    }`}
                  >
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-black text-stone-900 dark:text-white">
                        Smarter KI-Rezept-Assistent
                      </h4>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          currentAiConfig
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
                            : 'bg-stone-200 text-stone-700 dark:bg-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {currentAiConfig
                          ? `🟢 ${currentAiConfig.provider === 'gemini' ? 'Google Gemini 1.5 Flash' : 'OpenAI GPT-4o'} aktiv`
                          : 'ℹ️ Lokaler Heuristik-Modus'}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Ermöglicht echte KI-Texterkennung für handgeschriebene Kochbücher, Fotos und Rezeptwünsche im Rezept-Scanner.
                    </p>
                  </div>
                </div>
              </div>

              {/* AI Feedback */}
              {aiFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs font-bold flex items-start gap-2 animate-in fade-in ${
                    aiFeedback.success
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'bg-rose-100 text-rose-900 border border-rose-300'
                  }`}
                >
                  <span>{aiFeedback.success ? '✓' : '⚠️'}</span>
                  <span>{aiFeedback.message}</span>
                </div>
              )}

              {/* AI BYOK Form */}
              <form onSubmit={handleTestAndSaveAI} className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 space-y-3">
                {/* Provider Selector Tabs */}
                <div>
                  <label className="block text-[11px] font-black uppercase text-stone-500 dark:text-slate-400 mb-1.5">
                    KI-Anbieter wählen
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAiProvider('gemini')}
                      className={`p-2.5 rounded-xl border-2 text-xs font-black flex items-center justify-center gap-2 transition-all ${
                        aiProvider === 'gemini'
                          ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300'
                          : 'border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 text-stone-600 dark:text-slate-300'
                      }`}
                    >
                      <span>✨ Google Gemini</span>
                      <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md font-extrabold">Kostenlos</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAiProvider('openai')}
                      className={`p-2.5 rounded-xl border-2 text-xs font-black flex items-center justify-center gap-2 transition-all ${
                        aiProvider === 'openai'
                          ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300'
                          : 'border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 text-stone-600 dark:text-slate-300'
                      }`}
                    >
                      <span>🤖 OpenAI</span>
                      <span className="text-[9px] bg-stone-200 dark:bg-slate-700 text-stone-700 dark:text-slate-300 px-1.5 py-0.5 rounded-md font-bold">GPT-4o</span>
                    </button>
                  </div>
                </div>

                {/* API Key Input */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-black uppercase text-stone-500 dark:text-slate-400">
                      {aiProvider === 'gemini' ? 'Google AI Studio Key' : 'OpenAI API Key'}
                    </label>
                    <a
                      href={aiProvider === 'gemini' ? 'https://aistudio.google.com/app/apikey' : 'https://platform.openai.com/api-keys'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-0.5"
                    >
                      {aiProvider === 'gemini' ? 'Kostenlosen Key holen (1 Min)' : 'OpenAI Key holen'}
                      <ExternalLink className="w-2.5 h-2.5 inline" />
                    </a>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      type={showAiKey ? 'text' : 'password'}
                      placeholder={aiProvider === 'gemini' ? 'AIzaSy...' : 'sk-proj-...'}
                      value={aiKeyInput}
                      onChange={(e) => setAiKeyInput(e.target.value)}
                      required
                      className="w-full px-3 py-2 pr-10 rounded-xl border border-stone-300 dark:border-slate-700 text-xs font-mono bg-stone-50 dark:bg-slate-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAiKey(!showAiKey)}
                      className="absolute right-2.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1"
                    >
                      {showAiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-stone-400 dark:text-slate-500 mt-1">
                    Der Key verbleibt ausschließlich in deinem Browser und wird direkt für die Anfragen an Google bzw. OpenAI genutzt.
                  </p>
                </div>

                {/* AI Action Buttons */}
                <div className="flex items-center justify-between pt-1">
                  {currentAiConfig ? (
                    <button
                      type="button"
                      onClick={handleClearAI}
                      className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-2.5 py-1.5 rounded-xl transition-colors"
                    >
                      Key entfernen
                    </button>
                  ) : <div />}

                  <button
                    type="submit"
                    disabled={aiTesting}
                    className="duo-btn duo-btn-amber px-4 py-2 text-xs font-black rounded-xl flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {aiTesting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>{aiTesting ? 'Teste Key...' : 'Key testen & speichern'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Section 4: Family Identity */}
            <form onSubmit={handleSaveFamilyName} className="space-y-2">
              <label className="block text-xs font-black uppercase text-stone-500 dark:text-slate-400 tracking-wider">
                Familienname
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputFamilyName}
                  onChange={(e) => setInputFamilyName(e.target.value)}
                  placeholder="z. B. Familie Baum"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  className="duo-btn duo-btn-green px-5 py-2.5 text-xs font-black rounded-xl shrink-0 flex items-center gap-1.5"
                >
                  {nameSaved ? <Check className="w-4 h-4 stroke-[3]" /> : null}
                  <span>{nameSaved ? 'Gespeichert!' : 'Speichern'}</span>
                </button>
              </div>
            </form>

            {/* Section 5: Where Data Is Stored (Architecture Explanation) */}
            <div className="bg-emerald-50/70 dark:bg-emerald-950/30 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/50 space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400">
                <ShieldCheck className="w-5 h-5 shrink-0 stroke-[2.5]" />
                <h4 className="text-xs sm:text-sm font-black">
                  Wo & wie deine Daten geschützt sind
                </h4>
              </div>
              <p className="text-xs text-emerald-900/90 dark:text-emerald-200/90 font-medium leading-relaxed">
                Famly ist <strong>privat by design</strong>. Deine Daten gehören euch: Entweder direkt im Browser oder auf eurer eigenen, kostenlosen Supabase-Postgres-Instanz mit Row Level Security. Keine fremden Tracker, keine Datenweitergabe.
              </p>
            </div>

            {/* Current Database Summary Chips */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="block text-xs font-black uppercase text-stone-500 dark:text-slate-400 tracking-wider">
                  Familien-Bereiche
                </span>
                <span className="text-[11px] font-bold text-stone-400 dark:text-slate-500">Tippen zum Öffnen</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
                <button
                  type="button"
                  onClick={() => onNavigateTab('members')}
                  className="p-2 rounded-xl bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 border border-stone-200 dark:border-slate-700 transition-all hover:scale-105 active:scale-95"
                >
                  <span className="block text-sm font-black text-emerald-600 dark:text-emerald-400">{members.length}</span>
                  <span className="text-[10px] font-extrabold text-stone-600 dark:text-slate-300 flex items-center justify-center gap-0.5">
                    Mitglieder <ChevronRight className="w-2.5 h-2.5 inline opacity-60" />
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateTab('meals')}
                  className="p-2 rounded-xl bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 border border-stone-200 dark:border-slate-700 transition-all hover:scale-105 active:scale-95"
                >
                  <span className="block text-sm font-black text-teal-600 dark:text-teal-400">{recipes.length}</span>
                  <span className="text-[10px] font-extrabold text-stone-600 dark:text-slate-300 flex items-center justify-center gap-0.5">
                    Rezepte <ChevronRight className="w-2.5 h-2.5 inline opacity-60" />
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateTab('calendar')}
                  className="p-2 rounded-xl bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 border border-stone-200 dark:border-slate-700 transition-all hover:scale-105 active:scale-95"
                >
                  <span className="block text-sm font-black text-blue-600 dark:text-blue-400">{appointments.length}</span>
                  <span className="text-[10px] font-extrabold text-stone-600 dark:text-slate-300 flex items-center justify-center gap-0.5">
                    Termine <ChevronRight className="w-2.5 h-2.5 inline opacity-60" />
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateTab('lists')}
                  className="p-2 rounded-xl bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 border border-stone-200 dark:border-slate-700 transition-all hover:scale-105 active:scale-95"
                >
                  <span className="block text-sm font-black text-amber-600 dark:text-amber-400">{groceries.length}</span>
                  <span className="text-[10px] font-extrabold text-stone-600 dark:text-slate-300 flex items-center justify-center gap-0.5">
                    Einkauf <ChevronRight className="w-2.5 h-2.5 inline opacity-60" />
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateTab('lists')}
                  className="p-2 rounded-xl bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 border border-stone-200 dark:border-slate-700 transition-all hover:scale-105 active:scale-95"
                >
                  <span className="block text-sm font-black text-purple-600 dark:text-purple-400">{chores.length}</span>
                  <span className="text-[10px] font-extrabold text-stone-600 dark:text-slate-300 flex items-center justify-center gap-0.5">
                    Aufgaben <ChevronRight className="w-2.5 h-2.5 inline opacity-60" />
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateTab('photos')}
                  className="p-2 rounded-xl bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 border border-stone-200 dark:border-slate-700 transition-all hover:scale-105 active:scale-95"
                >
                  <span className="block text-sm font-black text-rose-600 dark:text-rose-400">{galleries.length}</span>
                  <span className="text-[10px] font-extrabold text-stone-600 dark:text-slate-300 flex items-center justify-center gap-0.5">
                    Alben <ChevronRight className="w-2.5 h-2.5 inline opacity-60" />
                  </span>
                </button>
              </div>
            </div>

            {/* Section 6: Backup & Restore (JSON Export / Import) */}
            <div className="space-y-3 pt-2 border-t border-stone-100 dark:border-slate-800">
              <label className="block text-xs font-black uppercase text-stone-500 dark:text-slate-400 tracking-wider">
                Datensicherung & Übertragung
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
                <button
                  type="button"
                  onClick={handleExport}
                  className="duo-btn duo-btn-white p-3 rounded-2xl flex items-center justify-center gap-2 text-xs font-black text-stone-800 dark:text-slate-200"
                >
                  <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Sicherung herunterladen (JSON)</span>
                </button>

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
                    <span>Sicherung wiederherstellen (JSON)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Section 7: Reset & Demo Data Zone */}
            <div className="pt-3 border-t border-stone-100 dark:border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Möchtest du die Beispieldaten (Familie Baum mit Rezepten & Terminen) laden?')) {
                      loadDemoData();
                      onClose();
                    }
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 text-stone-700 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>✨ Beispieldaten laden (Demo-Modus)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Möchtest du Famly wirklich komplett zurücksetzen und das Onboarding neu starten? Alle lokalen Daten werden gelöscht.')) {
                      resetToFreshStart();
                      onClose();
                    }
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Zurücksetzen & Onboarding neu starten</span>
                </button>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-black bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-300 transition-colors"
                >
                  Fertig
                </button>
              </div>
            </div>

            </div>
          </div>
        </div>
      </ModalPortal>
    </>
  );
};
