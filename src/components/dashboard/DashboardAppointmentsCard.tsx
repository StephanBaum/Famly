import React from 'react';
import { Calendar, Clock, MapPin, ChevronRight } from 'lucide-react';
import { Appointment, FamilyMember } from '../../types';
import { ActiveTab } from '../Header';

interface DashboardAppointmentsCardProps {
  todayAppointments: Appointment[];
  members: FamilyMember[];
  onNavigate: (tab: ActiveTab) => void;
  onOpenAddAppointment: () => void;
}

export const DashboardAppointmentsCard: React.FC<DashboardAppointmentsCardProps> = ({
  todayAppointments,
  members,
  onNavigate,
  onOpenAddAppointment,
}) => {
  return (
    <div className="duo-card p-4 sm:p-6 bg-white dark:bg-slate-900">
      <div className="flex items-center justify-between mb-4 gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 flex items-center justify-center font-black shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="font-black text-stone-900 dark:text-white text-base truncate">Termine heute</h3>
          </div>
        </div>
        <button
          onClick={() => onNavigate('calendar')}
          className="duo-btn duo-btn-white px-3 py-1.5 text-xs font-extrabold rounded-xl shrink-0 whitespace-nowrap"
        >
          <span>Kalender</span>
          <ChevronRight className="w-3.5 h-3.5 ml-1" />
        </button>
      </div>

      {todayAppointments.length === 0 ? (
        <div className="text-center py-8 bg-stone-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-stone-200 dark:border-slate-700">
          <span className="text-3xl mb-1 block">🏖️</span>
          <p className="text-sm font-extrabold text-stone-700 dark:text-slate-200">Heute alles frei!</p>
          <p className="text-xs font-semibold text-stone-400 dark:text-slate-400 mt-0.5">
            Keine Termine für heute eingetragen.
          </p>
          <button
            onClick={onOpenAddAppointment}
            className="mt-3 text-xs font-black text-rose-600 dark:text-rose-400 hover:underline"
          >
            + Termin für heute hinzufügen
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {todayAppointments.map((app) => {
            const assignedMembers = members.filter((m) => app.memberIds.includes(m.id));
            return (
              <div
                key={app.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border-2 border-b-4 border-stone-200 dark:border-slate-800 bg-stone-50/50 dark:bg-slate-800/60 hover:bg-stone-50 dark:hover:bg-slate-800 transition-all gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border-2 border-stone-200 dark:border-slate-700 shadow-2xs text-xs font-black text-stone-800 dark:text-slate-100 flex items-center gap-1.5 shrink-0">
                    <Clock className="w-3.5 h-3.5 text-blue-500" />
                    {app.time}
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-black text-stone-900 dark:text-white">
                      {app.title}
                    </h4>
                    {app.location && (
                      <p className="text-xs font-semibold text-stone-500 dark:text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-stone-400 dark:text-slate-500" />
                        <span>{app.location}</span>
                      </p>
                    )}
                    {app.notes && (
                      <p className="text-xs text-stone-600 dark:text-slate-300 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-lg border border-stone-200 dark:border-slate-700 inline-block mt-1 font-medium">
                        {app.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Attendee Avatars */}
                <div className="flex items-center gap-1.5 self-end sm:self-center">
                  <div className="flex -space-x-1.5">
                    {assignedMembers.map((m) => (
                      <div
                        key={m.id}
                        title={`${m.name} (${m.role})`}
                        className="w-8 h-8 rounded-full bg-white dark:bg-slate-900 border-2 border-stone-200 dark:border-slate-700 shadow-xs flex items-center justify-center text-sm"
                      >
                        <span>{m.avatar}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
