import React from 'react';
import { FamilyMember } from '../../types';
import { ActiveTab } from '../Header';

interface DashboardKidsStripProps {
  kids: FamilyMember[];
  onSelectChild: (kid: FamilyMember) => void;
  onNavigate: (tab: ActiveTab) => void;
}

export const DashboardKidsStrip: React.FC<DashboardKidsStripProps> = ({
  kids,
  onSelectChild,
  onNavigate,
}) => {
  if (kids.length === 0) return null;

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
      <span className="text-xs font-extrabold text-stone-400 dark:text-slate-500 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
        <span>🧸</span> Kinder:
      </span>
      {kids.map((kid) => (
        <button
          key={kid.id}
          onClick={() => onSelectChild(kid)}
          className="px-3 py-1.5 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-white dark:bg-slate-900 hover:border-purple-400 text-xs font-bold flex items-center gap-2 shadow-2xs shrink-0 transition-all cursor-pointer"
        >
          <span>{kid.avatar}</span>
          <span className="font-extrabold text-stone-900 dark:text-white">{kid.name}</span>
          <span className="text-stone-300 dark:text-slate-600">•</span>
          <span className="text-purple-700 dark:text-purple-300 font-semibold">
            Gr. {kid.childDetails?.clothingSize || '–'} / 👟 {kid.childDetails?.shoeSize || '–'}
          </span>
        </button>
      ))}
      <button
        onClick={() => onNavigate('members')}
        className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline shrink-0 px-2 py-1"
      >
        Alle Details →
      </button>
    </div>
  );
};
