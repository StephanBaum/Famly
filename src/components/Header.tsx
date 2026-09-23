import React, { useState } from 'react';
import { useFamily } from '../context/FamilyContext';
import {
  Calendar as CalendarIcon,
  Utensils,
  Camera,
  Home,
  Users,
  Plus,
  Settings,
  Sparkles,
  QrCode,
  X,
  UserCheck,
  ShoppingCart,
} from 'lucide-react';

export type ActiveTab = 'dashboard' | 'calendar' | 'meals' | 'groceries' | 'photos' | 'members' | 'lists';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onQuickAdd: () => void;
  onOpenSettings: () => void;
  onToggleKidsMode?: () => void;
  onOpenDecision?: () => void;
  onOpenJoinQR?: () => void;
  onReturnToAmbient?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onQuickAdd,
  onOpenSettings,
  onToggleKidsMode,
  onOpenDecision,
  onOpenJoinQR,
  onReturnToAmbient,
}) => {
  const {
    loggedInMember,
    logout,
    currentMemberId,
    setCurrentMemberId,
    familyName,
  } = useFamily();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b-2 border-stone-200 dark:border-slate-800 shadow-xs transition-colors w-full">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-2.5">
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          
          {/* Brand */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-[#58CC02] border-b-4 border-[#46A302] flex items-center justify-center text-base sm:text-xl shadow-xs shrink-0 animate-pop-in">
              🏡
            </div>
            <h1 className="text-base sm:text-xl font-black text-stone-900 dark:text-white tracking-tight truncate">
              {familyName
                ? (familyName.toLowerCase().startsWith('familie') ? familyName : `Familie ${familyName}`)
                : 'Famly'}
            </h1>
          </div>

          {/* DESKTOP CONTROLS (Clean & Calm) */}
          <div className="hidden sm:flex items-center gap-2.5 shrink-0">
            {/* Ambient Station Return Button (Only shown in Kiosk mode) */}
            {onReturnToAmbient && (
              <button
                onClick={onReturnToAmbient}
                title="Zurück zur Küchen-Station"
                className="px-3 py-1.5 rounded-2xl bg-sky-100 dark:bg-sky-950/80 text-sky-900 dark:text-sky-200 border-2 border-sky-300 dark:border-sky-700 text-xs font-black flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all shadow-2xs"
              >
                <span>📺 Station</span>
              </button>
            )}

            {/* Famly Assistant Button */}
            {onOpenDecision && (
              <button
                onClick={onOpenDecision}
                title="Famly Assistent & Smart-Planer"
                className="px-3 py-1.5 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border-2 border-amber-300 dark:border-amber-700 text-xs font-black flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 stroke-[2.5]" />
                <span>Assistent</span>
              </button>
            )}

            {/* Quick Add Button */}
            <button
              onClick={onQuickAdd}
              className="duo-btn duo-btn-green px-3.5 py-1.5 text-xs font-black rounded-2xl shadow-xs whitespace-nowrap flex items-center gap-1"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Neu</span>
            </button>

            {/* Active Logged-in Member Pill (Opens Options) */}
            {loggedInMember && (
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
                title={`${loggedInMember.name} (${loggedInMember.role}) - Optionen & Profil`}
                className="flex items-center gap-2 px-2.5 py-1 rounded-2xl bg-stone-100 dark:bg-slate-800 border-2 border-stone-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 transition-all text-left shadow-2xs group cursor-pointer"
              >
                <div
                  className="w-7 h-7 rounded-xl flex items-center justify-center text-sm border shrink-0 group-hover:scale-105 transition-transform"
                  style={{
                    backgroundColor: `${loggedInMember.color}20`,
                    borderColor: `${loggedInMember.color}60`,
                  }}
                >
                  {loggedInMember.avatar}
                </div>
                <span className="text-xs font-black text-stone-900 dark:text-white truncate max-w-[100px]">
                  {loggedInMember.name}
                </span>
                <span className="text-stone-400 text-xs">▾</span>
              </button>
            )}
          </div>

          {/* MOBILE STREAMLINED CONTROLS (Only visible on < sm) */}
          <div className="flex sm:hidden items-center gap-1.5 shrink-0">
            {/* Ambient Station Return Button (Only shown in Kiosk mode) */}
            {onReturnToAmbient && (
              <button
                onClick={onReturnToAmbient}
                title="Zurück zur Küchen-Station"
                className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-950/80 text-sky-900 dark:text-sky-200 border-2 border-sky-300 dark:border-sky-700 flex items-center justify-center active:scale-95 transition-transform shadow-2xs text-xs font-black"
              >
                📺
              </button>
            )}

            {/* Famly AI Assistant Quick Button */}
            {onOpenDecision && (
              <button
                onClick={onOpenDecision}
                title="Famly Assistent"
                className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border-2 border-amber-300 dark:border-amber-700 flex items-center justify-center active:scale-95 transition-transform shadow-2xs"
              >
                <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 stroke-[2.5]" />
              </button>
            )}

            {/* Quick Add Button */}
            <button
              onClick={onQuickAdd}
              className="w-8 h-8 rounded-xl bg-[#58CC02] border-b-2 border-[#46A302] text-white flex items-center justify-center active:scale-95 transition-transform shadow-2xs"
              title="Neuer Eintrag"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
            </button>

            {/* Mobile Profile & Menu Trigger */}
            {loggedInMember && (
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-sm border-2 shadow-2xs transition-transform active:scale-95"
                style={{
                  backgroundColor: `${loggedInMember.color}25`,
                  borderColor: `${loggedInMember.color}70`,
                }}
                title="Profil & Optionen"
              >
                {loggedInMember.avatar}
              </button>
            )}
          </div>

        </div>
      </div>

      {/* OPTIONS MODAL / SHEET (Responsive for Mobile & Desktop) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
          <div
            className="fixed inset-0"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl border-t-2 sm:border-2 border-stone-200 dark:border-slate-800 p-5 shadow-2xl space-y-4 w-full sm:max-w-md max-h-[85vh] overflow-y-auto">
            {/* Sheet Handle and Close */}
            <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏡</span>
                <span className="text-sm font-black text-stone-900 dark:text-white">
                  Familien-Optionen
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-7 h-7 rounded-xl bg-stone-100 dark:bg-slate-800 flex items-center justify-center text-stone-500 hover:text-stone-800 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Logged in member badge */}
            {loggedInMember && (
              <div className="p-3 bg-stone-50 dark:bg-slate-800/80 rounded-2xl border-2 border-stone-200 dark:border-slate-700 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl border-2 shrink-0"
                    style={{
                      backgroundColor: `${loggedInMember.color}20`,
                      borderColor: `${loggedInMember.color}60`,
                    }}
                  >
                    {loggedInMember.avatar}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-stone-900 dark:text-white truncate">
                      {loggedInMember.name}
                    </p>
                    <p className="text-[10px] font-bold text-stone-400 dark:text-slate-400 truncate">
                      {loggedInMember.role}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    logout();
                  }}
                  className="duo-btn duo-btn-white px-2.5 py-1.5 text-[11px] font-black rounded-xl text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/60 shrink-0"
                >
                  Profil wechseln
                </button>
              </div>
            )}

            {/* View Filter: Alle vs Meine */}
            {loggedInMember && (
              <div>
                <p className="text-[10px] font-extrabold text-stone-400 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Dashboard & Aufgaben filtern
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentMemberId('all');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-black border-2 transition-all flex items-center justify-center gap-1.5 ${
                      currentMemberId === 'all'
                        ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs'
                        : 'bg-stone-50 dark:bg-slate-800 text-stone-700 dark:text-slate-300 border-stone-200 dark:border-slate-700'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Ganze Familie</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCurrentMemberId(loggedInMember.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-black border-2 transition-all flex items-center justify-center gap-1.5 ${
                      currentMemberId === loggedInMember.id
                        ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs'
                        : 'bg-stone-50 dark:bg-slate-800 text-stone-700 dark:text-slate-300 border-stone-200 dark:border-slate-700'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Nur ich ({loggedInMember.name})</span>
                  </button>
                </div>
              </div>
            )}

            {/* Navigation & Utilities */}
            <div className="space-y-1.5 pt-1">
              {onToggleKidsMode && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onToggleKidsMode();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border-2 border-amber-200 dark:border-amber-800 text-xs font-black"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">🚀</span>
                    <span>Kids-Modus (Punkte & Belohnung)</span>
                  </div>
                  <span>→</span>
                </button>
              )}

              {onOpenJoinQR && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenJoinQR();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 border-2 border-indigo-200 dark:border-indigo-800 text-xs font-black"
                >
                  <div className="flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Gerät verbinden (QR-Code teilen)</span>
                  </div>
                  <span>→</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenSettings();
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-stone-100 dark:bg-slate-800 text-stone-800 dark:text-slate-200 border-2 border-stone-200 dark:border-slate-700 text-xs font-black"
              >
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-stone-600 dark:text-slate-400" />
                  <span>Einstellungen & KI-Schlüssel</span>
                </div>
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Navigation Tabs (Hidden on small mobile screens where bottom nav is used) */}
      <div className="hidden sm:block border-t-2 border-stone-100 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-2 py-2 overflow-x-auto scrollbar-none">
            
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`duo-btn px-3.5 py-1.5 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-2 border-b-4 border-rose-300 dark:border-rose-700'
                  : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-50 dark:hover:bg-slate-800 border-2 border-transparent'
              }`}
            >
              <Home className="w-3.5 h-3.5 mr-1.5" />
              <span>Heute</span>
            </button>

            <button
              onClick={() => setActiveTab('calendar')}
              className={`duo-btn px-3.5 py-1.5 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all ${
                activeTab === 'calendar'
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-2 border-b-4 border-blue-300 dark:border-blue-700'
                  : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-50 dark:hover:bg-slate-800 border-2 border-transparent'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5 mr-1.5" />
              <span>Kalender & Aufgaben</span>
            </button>

            <button
              onClick={() => setActiveTab('meals')}
              className={`duo-btn px-3.5 py-1.5 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all ${
                activeTab === 'meals'
                  ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-2 border-b-4 border-teal-300 dark:border-teal-700'
                  : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-50 dark:hover:bg-slate-800 border-2 border-transparent'
              }`}
            >
              <Utensils className="w-3.5 h-3.5 mr-1.5" />
              <span>Essensplan</span>
            </button>

            <button
              onClick={() => setActiveTab('groceries')}
              className={`duo-btn px-3.5 py-1.5 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all ${
                activeTab === 'groceries' || activeTab === 'lists'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-2 border-b-4 border-emerald-300 dark:border-emerald-700'
                  : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-50 dark:hover:bg-slate-800 border-2 border-transparent'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
              <span>Einkaufsliste</span>
            </button>

            <button
              onClick={() => setActiveTab('photos')}
              className={`duo-btn px-3.5 py-1.5 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all ${
                activeTab === 'photos'
                  ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-2 border-b-4 border-amber-300 dark:border-amber-700'
                  : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-50 dark:hover:bg-slate-800 border-2 border-transparent'
              }`}
            >
              <Camera className="w-3.5 h-3.5 mr-1.5" />
              <span>Momente</span>
            </button>

            <button
              onClick={() => setActiveTab('members')}
              className={`duo-btn px-3.5 py-1.5 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all ${
                activeTab === 'members'
                  ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-2 border-b-4 border-purple-300 dark:border-purple-700'
                  : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-50 dark:hover:bg-slate-800 border-2 border-transparent'
              }`}
            >
              <Users className="w-3.5 h-3.5 mr-1.5" />
              <span>Familie & Kinder</span>
            </button>

          </nav>
        </div>
      </div>
    </header>
  );
};
