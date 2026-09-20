import React, { useState, useEffect } from 'react';
import { Smartphone, Download, Check, Share, PlusSquare } from 'lucide-react';

export const InstallAppBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Check if already installed / standalone
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleMobile = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isAppleMobile);

    // Listen for beforeinstallprompt (Android / Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  if (isInstalled) {
    return (
      <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
          <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
          <span>Famly ist als App auf deinem Homescreen installiert</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3.5 bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 dark:from-slate-800/80 dark:via-slate-800/80 dark:to-slate-800/80 rounded-2xl border border-emerald-200 dark:border-slate-700 space-y-2.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black text-stone-900 dark:text-white">
              Als App auf den Homescreen holen
            </h4>
            <p className="text-[11px] text-stone-500 dark:text-slate-400 font-semibold">
              Voller Bildschirm ohne Browserleisten & noch schnellerer Start
            </p>
          </div>
        </div>

        {deferredPrompt ? (
          <button
            type="button"
            onClick={handleInstallClick}
            className="duo-btn duo-btn-green px-3 py-1.5 text-xs font-black rounded-xl flex items-center gap-1.5 shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Installieren</span>
          </button>
        ) : isIOS ? (
          <button
            type="button"
            onClick={() => setShowIOSGuide(!showIOSGuide)}
            className="duo-btn duo-btn-white px-3 py-1.5 text-xs font-black rounded-xl flex items-center gap-1.5 shrink-0 text-stone-800 dark:text-white"
          >
            <span>Anleitung</span>
          </button>
        ) : (
          <span className="text-[10px] font-bold text-stone-400 bg-white/70 dark:bg-slate-800 px-2 py-1 rounded-lg">
            Im Browser-Menü: App installieren
          </span>
        )}
      </div>

      {showIOSGuide && (
        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-stone-200 dark:border-slate-700 text-xs space-y-2 animate-in fade-in">
          <p className="font-bold text-stone-800 dark:text-slate-200">
            Auf dem iPhone / iPad in 2 Schritten installieren:
          </p>
          <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-stone-600 dark:text-slate-300 font-medium">
            <li className="flex items-center gap-1.5">
              <span>1. Unten in Safari auf das Teilen-Symbol tippen:</span>
              <Share className="w-3.5 h-3.5 text-blue-500 inline" />
            </li>
            <li className="flex items-center gap-1.5">
              <span>2. Nach unten scrollen und wählen:</span>
              <span className="font-bold text-stone-800 dark:text-white flex items-center gap-1">
                <PlusSquare className="w-3.5 h-3.5 inline" /> „Zum Home-Bildschirm“
              </span>
            </li>
          </ol>
        </div>
      )}
    </div>
  );
};
