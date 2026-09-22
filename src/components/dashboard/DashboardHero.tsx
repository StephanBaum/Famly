import React from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Plus } from 'lucide-react';
import { FamilyMember } from '../../types';
import { FamilyWeather } from '../../services/weatherService';

interface DashboardHeroProps {
  currentMember: FamilyMember | null | undefined;
  familyName: string;
  weather: FamilyWeather | null;
  onOpenAddAppointment: () => void;
}

export const DashboardHero: React.FC<DashboardHeroProps> = ({
  currentMember,
  familyName,
  weather,
  onOpenAddAppointment,
}) => {
  const displayGreetingName = currentMember
    ? currentMember.name
    : familyName.toLowerCase().startsWith('familie')
      ? familyName
      : `Familie ${familyName}`;

  return (
    <div className="duo-card p-4 sm:p-5 bg-white dark:bg-slate-900 border-2 border-stone-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-xs">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-amber-100 dark:bg-slate-800 border-2 border-amber-300 dark:border-slate-700 flex items-center justify-center text-2xl sm:text-3xl shrink-0">
            {currentMember ? currentMember.avatar : '🏡'}
          </div>
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-black text-stone-900 dark:text-white tracking-tight truncate">
              Hallo {displayGreetingName}! 👋
            </h2>
            <div className="flex items-center gap-2 text-xs font-semibold text-stone-500 dark:text-slate-400 mt-0.5 flex-wrap">
              <span className="font-bold text-stone-800 dark:text-stone-200">
                {format(new Date(), 'EEEE, d. MMMM', { locale: de })}
              </span>
              {weather && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-bold text-amber-700 dark:text-amber-400">
                    <span>{weather.icon}</span>
                    <span>{weather.temperature}°C</span>
                  </span>
                  {weather.familyTip && (
                    <>
                      <span className="hidden sm:inline">•</span>
                      <span className="hidden sm:inline truncate text-stone-600 dark:text-slate-300">
                        {weather.familyTip}
                      </span>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={onOpenAddAppointment}
          className="duo-btn duo-btn-green px-3.5 sm:px-4 py-2 text-xs font-black rounded-xl sm:rounded-2xl shrink-0 flex items-center gap-1 shadow-xs"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span className="hidden sm:inline">Termin planen</span>
          <span className="sm:hidden">Termin</span>
        </button>
      </div>
    </div>
  );
};
