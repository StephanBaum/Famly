import React from 'react';
import { useFamily } from '../context/FamilyContext';
import {
  Calendar as CalendarIcon,
  Utensils,
  Camera,
  CheckSquare,
  Home,
  Users,
  Plus,
  LogOut,
  Settings,
  Sparkles,
  QrCode,
} from 'lucide-react';

export type ActiveTab = 'dashboard' | 'calendar' | 'meals' | 'photos' | 'lists' | 'members';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onQuickAdd: () => void;
  onOpenSettings: () => void;
  onToggleKidsMode?: () => void;
  onOpenDecision?: () => void;
  onOpenJoinQR?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onQuickAdd,
  onOpenSettings,
  onToggleKidsMode,
  onOpenDecision,
  onOpenJoinQR,
}) => {
  const {
    loggedInMember,
    logout,
    currentMemberId,
    setCurrentMemberId,
    familyName,
  } = useFamily();

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b-2 border-stone-200 dark:border-slate-800 shadow-xs transition-colors w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 py-2 sm:py-2.5">
        <div className="flex items-center justify-between gap-1.5 sm:gap-3">
          
          {/* Brand */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-[#58CC02] border-b-4 border-[#46A302] flex items-center justify-center text-base sm:text-xl shadow-xs shrink-0 animate-pop-in">
                🏡
              </div>
              <h1 className="text-base sm:text-xl font-black text-stone-900 dark:text-white tracking-tight truncate">
                {familyName
                  ? (familyName.toLowerCase().startsWith('familie') ? familyName : `Familie ${familyName}`)
                  : 'Famly'}
              </h1>
            </div>

          {/* Right Side: Logged-in Profile Badge & Actions */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            
            {/* Active Logged-in Member Pill */}
            {loggedInMember && (
              <div className="flex items-center gap-1 bg-stone-100 dark:bg-slate-800 p-0.5 sm:p-1 rounded-2xl border-2 border-stone-200 dark:border-slate-700 shrink-0">
                <button
                  type="button"
                  onClick={logout}
                  title={`${loggedInMember.name} (${loggedInMember.role}) - Tippen zum Profilwechsel`}
                  className="flex items-center gap-1.5 px-1.5 py-1 rounded-xl hover:bg-white dark:hover:bg-slate-700 transition-all text-left group"
                >
                  <div
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-sm sm:text-base border shrink-0 group-hover:scale-105 transition-transform"
                    style={{
                      backgroundColor: `${loggedInMember.color}20`,
                      borderColor: `${loggedInMember.color}50`,
                    }}
                  >
                    {loggedInMember.avatar}
                  </div>

                  <div className="text-left leading-none max-w-[70px] sm:max-w-none">
                    <span className="block text-xs font-black text-stone-900 dark:text-white truncate">
                      {loggedInMember.name}
                    </span>
                    <span className="text-[9px] font-bold text-stone-400 dark:text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 flex items-center gap-0.5">
                      Wechseln
                    </span>
                  </div>
                </button>

                {/* View toggle: My Tasks vs All Family */}
                <button
                  onClick={() =>
                    setCurrentMemberId(currentMemberId === 'all' ? loggedInMember.id : 'all')
                  }
                  title="Zwischen persönlicher Ansicht und der ganzen Familie wechseln"
                  className={`duo-btn px-1.5 sm:px-2 py-1 text-[10px] sm:text-[11px] font-extrabold rounded-xl ${
                    currentMemberId === 'all'
                      ? 'duo-btn-white text-stone-700 dark:text-slate-200'
                      : 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-600'
                  }`}
                >
                  {currentMemberId === 'all' ? 'Alle' : 'Ich'}
                </button>

                {/* Switch Profile / Log Out */}
                <button
                  onClick={logout}
                  title="Profil wechseln / Abmelden"
                  className="flex p-1.5 text-stone-400 hover:text-rose-600 rounded-xl hover:bg-white dark:hover:bg-slate-700 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Kids Mode Toggle Button */}
            {onToggleKidsMode && (
              <button
                onClick={onToggleKidsMode}
                title="Kindgerechte Spiel- & Belohnungsansicht"
                className="px-2.5 py-1.5 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border-2 border-amber-300 dark:border-amber-700 text-xs font-black flex items-center gap-1 hover:scale-105 transition-transform shrink-0"
              >
                <span>🚀</span>
                <span className="hidden sm:inline">Kids</span>
              </button>
            )}

            {/* Famly Assistant & Smart-Planer Button */}
            {onOpenDecision && (
              <button
                onClick={onOpenDecision}
                title="Famly Assistent & Smart-Planer (Chat & Aufgaben einplanen)"
                className="px-2.5 py-1.5 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border-2 border-amber-300 dark:border-amber-700 text-xs font-black flex items-center gap-1 hover:scale-105 transition-transform shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 stroke-[2.5]" />
                <span className="hidden sm:inline">Assistent</span>
              </button>
            )}

            {/* Join Family / Connect Device QR Button */}
            {onOpenJoinQR && (
              <button
                type="button"
                onClick={onOpenJoinQR}
                title="Gerät verbinden & Familie per QR-Code beitreten"
                className="px-2.5 py-1.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-900 dark:text-indigo-200 border-2 border-indigo-200 dark:border-indigo-800 text-xs font-black flex items-center gap-1 hover:scale-105 transition-transform shrink-0"
              >
                <QrCode className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 stroke-[2.5]" />
                <span className="hidden sm:inline">QR-Code</span>
              </button>
            )}

            {/* Settings & Data Button */}
            <button
              onClick={onOpenSettings}
              title="Einstellungen & Datenverwaltung"
              aria-label="Einstellungen"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl border-2 border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-600 dark:text-slate-300 hover:scale-105 active:scale-95 transition-all shadow-2xs flex items-center justify-center shrink-0"
            >
              <Settings className="w-4 h-4 text-stone-700 dark:text-slate-300" />
            </button>

            {/* Quick Add Button */}
            <button
              onClick={onQuickAdd}
              className="duo-btn duo-btn-green px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs font-black rounded-2xl shadow-xs whitespace-nowrap flex items-center gap-1 shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span className="hidden xs:inline">Neu</span>
            </button>

          </div>
        </div>
      </div>

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
              <span>Kalender</span>
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
              onClick={() => setActiveTab('lists')}
              className={`duo-btn px-3.5 py-1.5 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all ${
                activeTab === 'lists'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-2 border-b-4 border-emerald-300 dark:border-emerald-700'
                  : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-50 dark:hover:bg-slate-800 border-2 border-transparent'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5 mr-1.5" />
              <span>Einkauf & Aufgaben</span>
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
