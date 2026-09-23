import React from 'react';
import { Appointment, Chore, FamilyMember, AppointmentCategory, AppointmentConflict } from '../../types';
import { CalendarAppointmentCard } from './CalendarAppointmentCard';
import { CalendarChoreItem } from './CalendarChoreItem';
import { Plus, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface CalendarDayDetailsProps {
  selectedDay: Date;
  selectedCategory: AppointmentCategory | 'all' | 'chores_only';
  appointments: Appointment[];
  chores: Chore[];
  members: FamilyMember[];
  conflicts: Map<string, AppointmentConflict[]>;
  onOpenAddAppointment: (dateStr: string) => void;
  onOpenAddChore: (dateStr: string) => void;
  onEditAppointment: (app: Appointment) => void;
  onToggleChore: (chore: Chore) => void;
  onEditChore: (chore: Chore) => void;
  onDeleteChore: (chore: Chore) => void;
  onManageCarpool?: (app: Appointment) => void;
  isMobile?: boolean;
}

export const CalendarDayDetails: React.FC<CalendarDayDetailsProps> = ({
  selectedDay,
  selectedCategory,
  appointments,
  chores,
  members,
  conflicts,
  onOpenAddAppointment,
  onOpenAddChore,
  onEditAppointment,
  onToggleChore,
  onEditChore,
  onDeleteChore,
  onManageCarpool,
  isMobile = false,
}) => {
  const selectedDayStr = format(selectedDay, 'yyyy-MM-dd');
  const completedChoresCount = chores.filter((c) => c.completed).length;

  if (isMobile) {
    return (
      <div className="duo-card p-4 bg-white dark:bg-slate-900 border-2 border-stone-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between border-b border-stone-100 dark:border-slate-800 pb-2.5">
          <div>
            <h3 className="font-black text-stone-900 dark:text-white text-sm">
              {format(selectedDay, 'EEEE, d. MMMM', { locale: de })}
            </h3>
            <span className="text-[11px] font-bold text-stone-400 dark:text-slate-400">
              {selectedCategory === 'chores_only'
                ? `${chores.length} Aufgaben`
                : `${appointments.length} Termine • ${chores.length} Aufgaben`}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onOpenAddChore(selectedDayStr)}
              className="duo-btn duo-btn-amber px-2.5 py-1.5 text-xs font-black rounded-xl shadow-xs flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5 stroke-[3]" />
              <span>Aufgabe</span>
            </button>
            <button
              onClick={() => onOpenAddAppointment(selectedDayStr)}
              className="duo-btn duo-btn-blue px-2.5 py-1.5 text-xs font-black rounded-xl shadow-xs flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Termin</span>
            </button>
          </div>
        </div>

        {/* Termine Section */}
        {selectedCategory !== 'chores_only' && (
          <div className="space-y-2">
            <div className="text-[11px] font-black text-stone-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <span>📅</span>
              <span>Termine ({appointments.length})</span>
            </div>
            {appointments.length === 0 ? (
              <p className="text-xs text-stone-400 dark:text-slate-500 italic py-1">
                Keine Termine für diesen Tag geplant.
              </p>
            ) : (
              <div className="space-y-2">
                {appointments.map((app) => (
                  <CalendarAppointmentCard
                    key={app.id}
                    appointment={app}
                    members={members}
                    conflicts={conflicts.get(app.id)}
                    hasConflict={conflicts.has(app.id)}
                    onEdit={onEditAppointment}
                    onManageCarpool={onManageCarpool}
                    variant="compact"
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Aufgaben Section */}
        {(selectedCategory === 'all' || selectedCategory === 'chores_only') && (
          <div className="space-y-2 pt-2 border-t border-stone-100 dark:border-slate-800">
            <div className="text-[11px] font-black text-amber-700 dark:text-amber-300 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1">
                <span>⭐</span>
                <span>Aufgaben ({chores.length})</span>
              </span>
              {chores.length > 0 && (
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                  {completedChoresCount} / {chores.length} erledigt
                </span>
              )}
            </div>

            {chores.length === 0 ? (
              <p className="text-xs text-stone-400 dark:text-slate-500 italic py-1">
                Keine Aufgaben für diesen Tag eingetragen.
              </p>
            ) : (
              <div className="space-y-2">
                {chores.map((chore) => (
                  <CalendarChoreItem
                    key={chore.id}
                    chore={chore}
                    members={members}
                    onToggle={onToggleChore}
                    onEdit={onEditChore}
                    onDelete={onDeleteChore}
                    variant="compact"
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="duo-card bg-white dark:bg-slate-900 border-2 border-stone-200 dark:border-slate-800 p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-stone-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="px-3 py-1 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-black text-sm">
            📅 Tagesansicht: {format(selectedDay, 'EEEE, d. MMMM yyyy', { locale: de })}
          </span>
          <span className="text-xs font-bold text-stone-400 dark:text-slate-400">
            {selectedCategory === 'chores_only'
              ? `${chores.length} Aufgaben`
              : `${appointments.length} Termine • ${chores.length} Aufgaben`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenAddChore(selectedDayStr)}
            className="duo-btn duo-btn-amber px-3 py-1.5 text-xs font-black rounded-xl shadow-xs flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 stroke-[3]" />
            <span>+ Aufgabe für {format(selectedDay, 'dd.MM.')}</span>
          </button>
          <button
            onClick={() => onOpenAddAppointment(selectedDayStr)}
            className="duo-btn duo-btn-blue px-3.5 py-1.5 text-xs font-black rounded-xl shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>+ Termin für {format(selectedDay, 'dd.MM.')}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left: Termine */}
        {selectedCategory !== 'chores_only' && (
          <div className="space-y-2.5">
            <div className="text-xs font-black text-stone-600 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span>📅</span>
                <span>Termine ({appointments.length})</span>
              </span>
            </div>

            {appointments.length === 0 ? (
              <div className="py-8 text-center bg-stone-50/50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-stone-200 dark:border-slate-700 text-stone-400">
                <p className="text-xs font-bold">Keine Termine für diesen Tag geplant.</p>
                <button
                  onClick={() => onOpenAddAppointment(selectedDayStr)}
                  className="mt-2 text-xs font-black text-blue-600 hover:text-blue-700 underline"
                >
                  + Termin eintragen
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {appointments.map((app) => (
                  <CalendarAppointmentCard
                    key={app.id}
                    appointment={app}
                    members={members}
                    conflicts={conflicts.get(app.id)}
                    hasConflict={conflicts.has(app.id)}
                    onEdit={onEditAppointment}
                    onManageCarpool={onManageCarpool}
                    variant="full"
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Right: Aufgaben */}
        {(selectedCategory === 'all' || selectedCategory === 'chores_only') && (
          <div className="space-y-2.5">
            <div className="text-xs font-black text-amber-800 dark:text-amber-300 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span>⭐</span>
                <span>Aufgaben ({chores.length})</span>
              </span>
              {chores.length > 0 && (
                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                  {completedChoresCount} / {chores.length} erledigt
                </span>
              )}
            </div>

            {chores.length === 0 ? (
              <div className="py-8 text-center bg-stone-50/50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-stone-200 dark:border-slate-700 text-stone-400">
                <p className="text-xs font-bold">Keine Aufgaben für diesen Tag eingetragen.</p>
                <button
                  onClick={() => onOpenAddChore(selectedDayStr)}
                  className="mt-2 text-xs font-black text-amber-600 hover:text-amber-700 underline"
                >
                  + Aufgabe eintragen
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {chores.map((chore) => (
                  <CalendarChoreItem
                    key={chore.id}
                    chore={chore}
                    members={members}
                    onToggle={onToggleChore}
                    onEdit={onEditChore}
                    onDelete={onDeleteChore}
                    variant="full"
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
