import React from 'react';
import { Appointment, Chore } from '../../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { de } from 'date-fns/locale';

interface CalendarWeekStripProps {
  selectedDay: Date;
  onSelectDay: (day: Date) => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  getDayAppointments: (day: Date) => Appointment[];
  getDayChores: (day: Date) => Chore[];
}

export const CalendarWeekStrip: React.FC<CalendarWeekStripProps> = ({
  selectedDay,
  onSelectDay,
  onPrevWeek,
  onNextWeek,
  getDayAppointments,
  getDayChores,
}) => {
  const weekStart = startOfWeek(selectedDay, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  return (
    <div className="duo-card p-3 bg-white dark:bg-slate-900 border-2 border-stone-200 dark:border-slate-800 space-y-2">
      <div className="flex items-center justify-between text-xs px-1">
        <span className="font-extrabold text-stone-700 dark:text-slate-300">
          {format(weekStart, 'd. MMM', { locale: de })} – {format(weekEnd, 'd. MMM yyyy', { locale: de })}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={onPrevWeek}
            className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-600 dark:text-slate-300"
            title="Vorherige Woche"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={onNextWeek}
            className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-600 dark:text-slate-300"
            title="Nächste Woche"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 7 Day Buttons */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {weekDays.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const isSelected = isSameDay(day, selectedDay);
          const isToday = isSameDay(day, new Date());
          const dayApps = getDayAppointments(day);
          const dayChores = getDayChores(day);
          const pendingChores = dayChores.filter((c) => !c.completed);

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => onSelectDay(day)}
              className={`py-2 px-0.5 rounded-xl flex flex-col items-center justify-center transition-all ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-xs scale-105 font-black ring-2 ring-blue-400/50'
                  : isToday
                  ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700 font-bold'
                  : 'bg-stone-50 dark:bg-slate-800/80 hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-700 dark:text-slate-300 font-bold border border-stone-200 dark:border-slate-700'
              }`}
            >
              <span className="text-[10px] uppercase font-bold opacity-80">
                {format(day, 'EEE', { locale: de }).slice(0, 2)}
              </span>
              <span className="text-sm font-black mt-0.5">
                {format(day, 'd')}
              </span>
              {/* Dots indicator */}
              <div className="flex items-center justify-center gap-0.5 h-1.5 mt-1">
                {dayApps.slice(0, 2).map((_, i) => (
                  <span
                    key={`app-${i}`}
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSelected ? 'bg-white' : 'bg-blue-500 dark:bg-blue-400'
                    }`}
                  />
                ))}
                {pendingChores.length > 0 && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSelected ? 'bg-amber-200' : 'bg-amber-500 dark:bg-amber-400'
                    }`}
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
