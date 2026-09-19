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
  RotateCcw,
} from 'lucide-react';

export type ActiveTab = 'dashboard' | 'calendar' | 'meals' | 'photos' | 'lists' | 'members';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onQuickAdd: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, onQuickAdd }) => {
  const {
    loggedInMember,
    logout,
    currentMemberId,
    setCurrentMemberId,
    resetToDefaults,
  } = useFamily();

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b-2 border-stone-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex items-center justify-between gap-3">
          
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#58CC02] border-b-4 border-[#46A302] flex items-center justify-center text-xl shadow-sm">
              🏡
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-lg font-black text-stone-900 tracking-tight">Famly</h1>
                <span className="hidden sm:inline-block text-[10px] font-extrabold px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Miller Family
                </span>
              </div>
              <p className="text-[11px] font-bold text-stone-400 hidden sm:block">
                Happy household coordinator
              </p>
            </div>
          </div>

          {/* Right Side: Logged-in Profile Badge & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Active Logged-in Member Pill */}
            {loggedInMember && (
              <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-2xl border-2 border-stone-200">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-base border"
                  style={{
                    backgroundColor: `${loggedInMember.color}20`,
                    borderColor: `${loggedInMember.color}50`,
                  }}
                >
                  {loggedInMember.avatar}
                </div>

                <div className="hidden xs:block text-left px-1">
                  <span className="block text-xs font-black text-stone-900 leading-tight">
                    {loggedInMember.name}
                  </span>
                  <span className="block text-[10px] font-bold text-stone-400">
                    {loggedInMember.role}
                  </span>
                </div>

                {/* View toggle: My Tasks vs All Family */}
                <button
                  onClick={() =>
                    setCurrentMemberId(currentMemberId === 'all' ? loggedInMember.id : 'all')
                  }
                  title="Toggle between your personal items and whole family"
                  className={`duo-btn px-2 py-1 text-[11px] font-extrabold rounded-xl ${
                    currentMemberId === 'all'
                      ? 'duo-btn-white text-stone-700'
                      : 'bg-white text-emerald-700 border-emerald-300'
                  }`}
                >
                  {currentMemberId === 'all' ? 'All Family' : 'My View'}
                </button>

                {/* Switch Profile / Log Out */}
                <button
                  onClick={logout}
                  title="Switch family member / Log out"
                  className="p-1.5 text-stone-400 hover:text-rose-600 rounded-xl hover:bg-white transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Quick Add Button */}
            <button
              onClick={onQuickAdd}
              className="duo-btn duo-btn-green px-3 sm:px-4 py-2 text-xs font-black rounded-2xl shadow-sm whitespace-nowrap"
            >
              <Plus className="w-4 h-4 mr-1 stroke-[3]" />
              <span>Quick Add</span>
            </button>

            {/* Reset to sample data button */}
            <button
              onClick={() => {
                if (window.confirm('Reset family data back to demo sample?')) {
                  resetToDefaults();
                }
              }}
              title="Reset demo data"
              className="p-2 text-stone-300 hover:text-stone-600 rounded-xl hover:bg-stone-100 transition-colors hidden sm:block"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

          </div>
        </div>
      </div>

      {/* Desktop Navigation Tabs (Hidden on small mobile screens where bottom nav is used) */}
      <div className="hidden sm:block border-t-2 border-stone-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-2 py-2 overflow-x-auto scrollbar-none">
            
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`duo-btn px-3.5 py-1.5 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-rose-50 text-rose-700 border-2 border-b-4 border-rose-300'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50 border-2 border-transparent'
              }`}
            >
              <Home className="w-3.5 h-3.5 mr-1.5" />
              <span>Today Hub</span>
            </button>

            <button
              onClick={() => setActiveTab('calendar')}
              className={`duo-btn px-3.5 py-1.5 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all ${
                activeTab === 'calendar'
                  ? 'bg-blue-50 text-blue-700 border-2 border-b-4 border-blue-300'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50 border-2 border-transparent'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5 mr-1.5" />
              <span>Calendar</span>
            </button>

            <button
              onClick={() => setActiveTab('meals')}
              className={`duo-btn px-3.5 py-1.5 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all ${
                activeTab === 'meals'
                  ? 'bg-teal-50 text-teal-700 border-2 border-b-4 border-teal-300'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50 border-2 border-transparent'
              }`}
            >
              <Utensils className="w-3.5 h-3.5 mr-1.5" />
              <span>Meal Planner</span>
            </button>

            <button
              onClick={() => setActiveTab('photos')}
              className={`duo-btn px-3.5 py-1.5 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all ${
                activeTab === 'photos'
                  ? 'bg-amber-50 text-amber-800 border-2 border-b-4 border-amber-300'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50 border-2 border-transparent'
              }`}
            >
              <Camera className="w-3.5 h-3.5 mr-1.5" />
              <span>Moments</span>
            </button>

            <button
              onClick={() => setActiveTab('lists')}
              className={`duo-btn px-3.5 py-1.5 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all ${
                activeTab === 'lists'
                  ? 'bg-emerald-50 text-emerald-700 border-2 border-b-4 border-emerald-300'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50 border-2 border-transparent'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5 mr-1.5" />
              <span>Groceries & Chores</span>
            </button>

            <button
              onClick={() => setActiveTab('members')}
              className={`duo-btn px-3.5 py-1.5 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all ${
                activeTab === 'members'
                  ? 'bg-purple-50 text-purple-700 border-2 border-b-4 border-purple-300'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50 border-2 border-transparent'
              }`}
            >
              <Users className="w-3.5 h-3.5 mr-1.5" />
              <span>Kids & Family Info</span>
            </button>

          </nav>
        </div>
      </div>
    </header>
  );
};
