import React from 'react';
import { Home, Calendar, Utensils, ShoppingCart, Camera, Users } from 'lucide-react';
import { ActiveTab } from './Header';
import { useFamily } from '../context/FamilyContext';

interface MobileBottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ activeTab, setActiveTab }) => {
  const { groceries } = useFamily();
  const uncheckedGroceriesCount = groceries.filter((g) => !g.checked).length;

  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dashboard', label: 'Today', icon: <Home className="w-5 h-5" /> },
    { id: 'calendar', label: 'Calendar', icon: <Calendar className="w-5 h-5" /> },
    { id: 'meals', label: 'Meals', icon: <Utensils className="w-5 h-5" /> },
    { id: 'lists', label: 'Shopping', icon: <ShoppingCart className="w-5 h-5" />, badge: uncheckedGroceriesCount },
    { id: 'photos', label: 'Moments', icon: <Camera className="w-5 h-5" /> },
    { id: 'members', label: 'Family', icon: <Users className="w-5 h-5" /> },
  ];

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t-2 border-stone-200 px-1 py-1.5 flex items-center justify-around shadow-lg">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-2xl transition-all relative ${
              isActive
                ? 'text-emerald-600 font-black'
                : 'text-stone-400 hover:text-stone-700 font-bold'
            }`}
          >
            <div className="relative">
              {tab.icon}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-emerald-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {tab.badge > 9 ? '9+' : tab.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">{tab.label}</span>
            {isActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-0.5" />
            )}
          </button>
        );
      })}
    </nav>
  );
};
