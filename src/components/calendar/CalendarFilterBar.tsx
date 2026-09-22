import React from 'react';
import { AppointmentCategory, FamilyMember } from '../../types';
import { CATEGORY_CONFIG } from './calendarConstants';
import { Tag } from 'lucide-react';

interface CalendarFilterBarProps {
  selectedCategory: AppointmentCategory | 'all' | 'chores_only';
  onSelectCategory: (category: AppointmentCategory | 'all' | 'chores_only') => void;
  currentMemberId: string | 'all';
  members: FamilyMember[];
}

export const CalendarFilterBar: React.FC<CalendarFilterBarProps> = ({
  selectedCategory,
  onSelectCategory,
  currentMemberId,
  members,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 bg-stone-50/80 dark:bg-slate-800/80 p-2.5 sm:p-3.5 rounded-2xl border border-stone-200/70 dark:border-slate-700 overflow-hidden">
      {/* Category Pills (Horizontal scroll on mobile, flex-wrap on desktop) */}
      <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none sm:flex-wrap">
        <span className="text-xs font-bold text-stone-500 dark:text-slate-400 flex items-center gap-1 shrink-0 mr-1">
          <Tag className="w-3 h-3" /> Filter:
        </span>
        <button
          onClick={() => onSelectCategory('all')}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
            selectedCategory === 'all'
              ? 'bg-stone-900 dark:bg-blue-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-700 border border-stone-200 dark:border-slate-700'
          }`}
        >
          Alle
        </button>
        <button
          onClick={() => onSelectCategory(selectedCategory === 'chores_only' ? 'all' : 'chores_only')}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 shrink-0 ${
            selectedCategory === 'chores_only'
              ? 'bg-amber-400 text-stone-900 font-extrabold shadow-xs'
              : 'bg-white dark:bg-slate-800 text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-700 border border-stone-200 dark:border-slate-700'
          }`}
        >
          <span>⭐</span>
          <span>Nur Aufgaben</span>
        </button>
        {Object.entries(CATEGORY_CONFIG).map(([catKey, conf]) => (
          <button
            key={catKey}
            onClick={() => onSelectCategory(catKey as AppointmentCategory)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 shrink-0 ${
              selectedCategory === catKey
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-700 border border-stone-200 dark:border-slate-700'
            }`}
          >
            <span>{conf.icon}</span>
            <span>{conf.label}</span>
          </button>
        ))}
      </div>

      {/* Member indicator notice */}
      <div className="text-xs text-stone-500 dark:text-slate-400 font-medium shrink-0">
        Ansicht:{' '}
        <strong className="text-stone-800 dark:text-white font-bold">
          {currentMemberId === 'all'
            ? 'Ganze Familie'
            : members.find((m) => m.id === currentMemberId)?.name}
        </strong>
      </div>
    </div>
  );
};
