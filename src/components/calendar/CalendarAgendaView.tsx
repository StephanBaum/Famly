import React from 'react';
import { Appointment, Chore, FamilyMember, AppointmentCategory } from '../../types';
import { CalendarAppointmentCard } from './CalendarAppointmentCard';
import { CalendarChoreItem } from './CalendarChoreItem';
import { Calendar as CalendarIcon, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface CalendarAgendaViewProps {
  selectedCategory: AppointmentCategory | 'all' | 'chores_only';
  filteredAppointments: Appointment[];
  relevantChores: Chore[];
  members: FamilyMember[];
  onOpenAddChore: () => void;
  onEditAppointment: (app: Appointment) => void;
  onDeleteAppointment: (app: Appointment) => void;
  onToggleChore: (chore: Chore) => void;
  onEditChore: (chore: Chore) => void;
  onDeleteChore: (chore: Chore) => void;
}

export const CalendarAgendaView: React.FC<CalendarAgendaViewProps> = ({
  selectedCategory,
  filteredAppointments,
  relevantChores,
  members,
  onOpenAddChore,
  onEditAppointment,
  onDeleteAppointment,
  onToggleChore,
  onEditChore,
  onDeleteChore,
}) => {
  const sortedAppointments = [...filteredAppointments].sort(
    (a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)
  );

  return (
    <div className="space-y-6">
      {/* Termine Section in Agenda */}
      {selectedCategory !== 'chores_only' && (
        <div className="duo-card bg-white dark:bg-slate-900 border-2 border-stone-200 dark:border-slate-800 p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-stone-200 dark:border-slate-800 pb-3">
            <h3 className="font-black text-stone-900 dark:text-white text-base flex items-center gap-2">
              <span>📅</span>
              <span>Anstehende Termine & Events</span>
            </h3>
            <span className="text-xs text-stone-500 dark:text-slate-400 font-bold">
              {filteredAppointments.length} Termine geplant
            </span>
          </div>

          {sortedAppointments.length === 0 ? (
            <div className="text-center py-10 text-stone-400 dark:text-slate-500">
              <CalendarIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-bold">Keine Termine für die gewählten Filter vorhanden.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedAppointments.map((app) => (
                <div key={app.id} className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 shadow-2xs text-center shrink-0 hidden sm:block">
                    <span className="block text-[10px] uppercase font-bold text-stone-400 dark:text-slate-500">
                      {format(new Date(app.date), 'MMM', { locale: de })}
                    </span>
                    <span className="block text-lg font-black text-stone-800 dark:text-white">
                      {format(new Date(app.date), 'dd')}
                    </span>
                    <span className="block text-[10px] text-stone-500 dark:text-slate-400 font-bold">
                      {format(new Date(app.date), 'EEE', { locale: de })}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <CalendarAppointmentCard
                      appointment={app}
                      members={members}
                      onEdit={onEditAppointment}
                      onDelete={onDeleteAppointment}
                      variant="agenda"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Aufgaben Section in Agenda */}
      {(selectedCategory === 'all' || selectedCategory === 'chores_only') && (
        <div className="duo-card bg-white dark:bg-slate-900 border-2 border-stone-200 dark:border-slate-800 p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-stone-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">⭐</span>
              <h3 className="font-black text-stone-900 dark:text-white text-base">
                Haushalts-Aufgaben & To-Dos
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-500 dark:text-slate-400 font-bold">
                {relevantChores.filter((c) => c.completed).length} / {relevantChores.length} erledigt
              </span>
              <button
                onClick={onOpenAddChore}
                className="duo-btn duo-btn-amber px-3 py-1.5 text-xs font-black rounded-xl shadow-xs flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5 stroke-[3]" />
                <span>+ Aufgabe</span>
              </button>
            </div>
          </div>

          {relevantChores.length === 0 ? (
            <div className="text-center py-10 text-stone-400 dark:text-slate-500">
              <p className="text-sm font-bold">Keine Aufgaben für diese Ansicht vorhanden.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {relevantChores.map((chore) => (
                <CalendarChoreItem
                  key={chore.id}
                  chore={chore}
                  members={members}
                  onToggle={onToggleChore}
                  onEdit={onEditChore}
                  onDelete={onDeleteChore}
                  variant="agenda"
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
