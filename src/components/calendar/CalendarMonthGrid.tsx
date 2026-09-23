import React from 'react';
import { Appointment, Chore, FamilyMember } from '../../types';
import { CATEGORY_CONFIG, detectStickerFromTitle } from './calendarConstants';
import { Plus, Sparkles, Repeat } from 'lucide-react';
import { format, isSameMonth, isSameDay } from 'date-fns';

interface CalendarMonthGridProps {
  currentDate: Date;
  selectedDay: Date;
  calendarDays: Date[];
  members: FamilyMember[];
  getDayAppointments: (day: Date) => Appointment[];
  getDayChores: (day: Date) => Chore[];
  onSelectDay: (day: Date) => void;
  onOpenAddAppointment: (dateStr: string) => void;
  onOpenAddChore: (dateStr: string) => void;
  onOpenEditAppointment: (app: Appointment) => void;
  onToggleChore: (chore: Chore) => void;
}

export const CalendarMonthGrid: React.FC<CalendarMonthGridProps> = ({
  currentDate,
  selectedDay,
  calendarDays,
  members,
  getDayAppointments,
  getDayChores,
  onSelectDay,
  onOpenAddAppointment,
  onOpenAddChore,
  onOpenEditAppointment,
  onToggleChore,
}) => {
  return (
    <div className="duo-card bg-white dark:bg-slate-900 border-2 border-stone-200 dark:border-slate-800 overflow-hidden">
      {/* Day Headers (Mon - Sun) */}
      <div className="calendar-grid border-b border-stone-200 dark:border-slate-800 bg-stone-50/70 dark:bg-slate-800/60 text-center py-2 text-xs font-extrabold text-stone-600 dark:text-slate-300 uppercase tracking-wider">
        <div>Mo</div>
        <div>Di</div>
        <div>Mi</div>
        <div>Do</div>
        <div>Fr</div>
        <div>Sa</div>
        <div>So</div>
      </div>

      {/* Month Calendar Cells */}
      <div className="calendar-grid divide-x divide-y divide-stone-100 dark:divide-slate-800">
        {calendarDays.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isToday = isSameDay(day, new Date());
          const isSelected = isSameDay(day, selectedDay);
          const dayAppointments = getDayAppointments(day);
          const dayChores = getDayChores(day);

          return (
            <div
              key={dateStr}
              onClick={() => onSelectDay(day)}
              className={`min-h-[125px] p-2 flex flex-col justify-between transition-all group cursor-pointer hover:bg-stone-50/80 dark:hover:bg-slate-800/50 ${
                !isCurrentMonth
                  ? 'bg-stone-50/40 dark:bg-slate-950/40 text-stone-300 dark:text-slate-600'
                  : 'bg-white dark:bg-slate-900 text-stone-800 dark:text-slate-100'
              } ${isToday ? 'bg-blue-50/30 dark:bg-blue-950/30' : ''} ${
                isSelected ? 'ring-2 ring-blue-500 ring-inset bg-blue-50/15' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-xs font-black w-6 h-6 rounded-full flex items-center justify-center ${
                    isToday
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : isSelected
                      ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900 shadow-2xs'
                      : isCurrentMonth
                      ? 'text-stone-700 dark:text-slate-300'
                      : 'text-stone-300 dark:text-slate-600'
                  }`}
                >
                  {format(day, 'd')}
                </span>
                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectDay(day);
                      onOpenAddChore(dateStr);
                    }}
                    className="text-stone-400 hover:text-amber-600 p-0.5 rounded transition-colors"
                    title="Aufgabe eintragen"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectDay(day);
                      onOpenAddAppointment(dateStr);
                    }}
                    className="text-stone-400 hover:text-blue-600 p-0.5 rounded transition-colors"
                    title="Termin eintragen"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Appointments & Chores in this day */}
              <div className="space-y-1 flex-1 overflow-y-auto max-h-[85px] scrollbar-none">
                {/* Appointments */}
                {dayAppointments.map((app) => {
                  const conf = CATEGORY_CONFIG[app.category] || CATEGORY_CONFIG.family;
                  const assignedMembers = members.filter((m) => app.memberIds.includes(m.id));
                  const sticker = app.sticker || detectStickerFromTitle(app.title, app.category);
                  return (
                    <div
                      key={app.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectDay(day);
                        onOpenEditAppointment(app);
                      }}
                      title={`${app.title} (${app.time}) - ${assignedMembers.map((m) => m.name).join(', ')}`}
                      className={`px-1.5 py-0.5 rounded-lg border text-[11px] leading-tight font-bold flex items-center justify-between gap-1 shadow-2xs cursor-pointer hover:scale-102 transition-transform ${conf.bg} ${conf.border} ${conf.text}`}
                    >
                      <div className="truncate flex items-center gap-1">
                        <span className="text-xs shrink-0">{sticker}</span>
                        {app.recurrence && app.recurrence !== 'none' && (
                          <Repeat className="w-2.5 h-2.5 shrink-0 opacity-75" />
                        )}
                        <span className="font-extrabold text-[9px] opacity-75">{app.time}</span>
                        <span className="truncate">{app.title}</span>
                      </div>
                      <div className="flex -space-x-1 shrink-0">
                        {assignedMembers.slice(0, 2).map((m) => (
                          <span
                            key={m.id}
                            className="w-3.5 h-3.5 rounded-full text-[9px] flex items-center justify-center"
                          >
                            {m.avatar}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* Chores */}
                {dayChores.map((chore) => {
                  return (
                    <div
                      key={chore.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleChore(chore);
                      }}
                      title={`${chore.title} (${chore.stars}★) - Klick zum Abhaken`}
                      className={`px-1.5 py-0.5 rounded-lg border text-[11px] leading-tight font-bold flex items-center justify-between gap-1 shadow-2xs cursor-pointer hover:scale-102 transition-transform ${
                        chore.completed
                          ? 'bg-stone-100 dark:bg-slate-800 text-stone-400 dark:text-slate-500 border-stone-200 dark:border-slate-700 line-through'
                          : 'bg-amber-100/90 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-800/80 hover:bg-amber-200/90'
                      }`}
                    >
                      <div className="truncate flex items-center gap-1">
                        <span>{chore.completed ? '✅' : '⭐'}</span>
                        <span className="truncate">{chore.title}</span>
                      </div>
                      <span className="text-[9px] font-black shrink-0 px-1 py-0.2 rounded bg-amber-200/80 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200">
                        +{chore.stars}★
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
