import React from 'react';
import { Appointment, FamilyMember, AppointmentConflict } from '../../types';
import { CATEGORY_CONFIG } from './calendarConstants';
import { Repeat, AlertTriangle, MapPin, Clock, Edit2, Trash2 } from 'lucide-react';

interface CalendarAppointmentCardProps {
  appointment: Appointment;
  members: FamilyMember[];
  conflicts?: AppointmentConflict[];
  hasConflict?: boolean;
  onEdit?: (appointment: Appointment) => void;
  onDelete?: (appointment: Appointment) => void;
  onManageCarpool?: (appointment: Appointment) => void;
  variant?: 'compact' | 'full' | 'agenda';
}

export const CalendarAppointmentCard: React.FC<CalendarAppointmentCardProps> = ({
  appointment,
  members,
  conflicts,
  hasConflict = false,
  onEdit,
  onDelete,
  onManageCarpool,
  variant = 'full',
}) => {
  const conf = CATEGORY_CONFIG[appointment.category] || CATEGORY_CONFIG.family;
  const assignedMembers = members.filter((m) => appointment.memberIds.includes(m.id));

  // Agenda view variant
  if (variant === 'agenda') {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border-2 border-stone-200 dark:border-slate-800 bg-stone-50/40 dark:bg-slate-800/60 hover:bg-stone-50 dark:hover:bg-slate-800 transition-all gap-4">
        <div className="flex items-start gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${conf.bg} ${conf.border} ${conf.text}`}>
                {conf.icon} {conf.label}
              </span>
              <span className="text-xs font-bold text-stone-700 dark:text-slate-300 flex items-center gap-1">
                <Clock className="w-3 h-3 text-stone-400" />
                {appointment.time} ({appointment.durationMinutes || 60} Min.)
              </span>
              {appointment.recurrence && appointment.recurrence !== 'none' && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 flex items-center gap-1">
                  <Repeat className="w-2.5 h-2.5" />
                  <span>
                    {appointment.recurrence === 'weekly'
                      ? 'Wöchentlich'
                      : appointment.recurrence === 'biweekly'
                      ? 'Alle 2 Wo.'
                      : appointment.recurrence === 'daily'
                      ? 'Täglich'
                      : 'Monatlich'}
                  </span>
                </span>
              )}
            </div>

            <h4 className="text-base font-black text-stone-900 dark:text-white">{appointment.title}</h4>

            {appointment.location && (
              <p className="text-xs text-stone-500 dark:text-slate-400 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-stone-400" />
                <span>{appointment.location}</span>
              </p>
            )}

            {appointment.notes && (
              <p className="text-xs text-stone-600 dark:text-slate-300 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-stone-200 dark:border-slate-700 inline-block mt-1">
                {appointment.notes}
              </p>
            )}

            {/* Carpool Logistics Pill */}
            {appointment.carpool?.enabled ? (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onManageCarpool?.(appointment);
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-100 dark:bg-blue-950/60 border-2 border-blue-300 dark:border-blue-700 text-xs font-black text-blue-900 dark:text-blue-200 hover:scale-102 active:scale-98 transition-transform"
                >
                  <span>🚗</span>
                  <span>{appointment.carpool.driverName}: {appointment.carpool.riders.length}/{appointment.carpool.totalSeats} Plätze belegt</span>
                </button>
              </div>
            ) : onManageCarpool && (appointment.category === 'sports' || appointment.category === 'school' || assignedMembers.some((m) => m.isChild)) ? (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onManageCarpool(appointment);
                  }}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border border-dashed border-stone-300 dark:border-slate-700 text-[11px] font-bold text-stone-500 hover:text-blue-600 hover:border-blue-400 transition-colors"
                >
                  <span>🚗</span>
                  <span>+ Fahrgemeinschaft</span>
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-200 dark:border-slate-800">
          <div className="flex items-center gap-1.5">
            {assignedMembers.map((m) => (
              <span
                key={m.id}
                title={`${m.name} (${m.role})`}
                className="px-2 py-1 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 shadow-2xs flex items-center gap-1"
              >
                <span>{m.avatar}</span>
                <span className="text-stone-700 dark:text-slate-200">{m.name}</span>
              </span>
            ))}
          </div>

          <div className="flex items-center gap-1">
            {onEdit && (
              <button
                onClick={() => onEdit(appointment)}
                className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-white hover:bg-stone-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                title="Bearbeiten"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(appointment)}
                className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                title="Löschen"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Compact variant for mobile day schedule
  const isCompact = variant === 'compact';

  return (
    <div
      onClick={() => onEdit?.(appointment)}
      className={`${
        isCompact ? 'p-2.5 rounded-2xl' : 'p-3 rounded-2xl'
      } border-2 cursor-pointer transition-all hover:shadow-xs ${conf.bg} ${conf.border} space-y-1.5`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`${isCompact ? 'text-[11px]' : 'text-xs'} font-extrabold px-1.5 py-0.5 rounded-md bg-white/90 dark:bg-slate-900/90 text-stone-800 dark:text-slate-200`}>
            ⏰ {appointment.time} {isCompact ? '' : `(${appointment.durationMinutes || 60} Min.)`}
          </span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${conf.text} bg-white/60 dark:bg-slate-900/60`}>
            {conf.icon} {conf.label}
          </span>
          {appointment.recurrence && appointment.recurrence !== 'none' && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 flex items-center gap-1">
              <Repeat className="w-2.5 h-2.5" />
              <span>
                {appointment.recurrence === 'weekly'
                  ? 'Wöchentlich'
                  : appointment.recurrence === 'biweekly'
                  ? 'Alle 2 Wo.'
                  : appointment.recurrence === 'daily'
                  ? 'Täglich'
                  : 'Monatlich'}
              </span>
            </span>
          )}
        </div>
        <div className="flex -space-x-1 shrink-0">
          {assignedMembers.map((m) => (
            <span
              key={m.id}
              title={m.name}
              className="w-5 h-5 rounded-full text-xs flex items-center justify-center bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 shadow-2xs"
            >
              {m.avatar}
            </span>
          ))}
        </div>
      </div>

      {hasConflict && (
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-500 text-white font-black text-[10px] animate-pulse">
          <AlertTriangle className="w-3 h-3 shrink-0" />
          <span>
            Zeitkonflikt mit {conflicts?.[0]?.appointmentA.id === appointment.id ? conflicts?.[0]?.appointmentB.title : conflicts?.[0]?.appointmentA.title}
          </span>
        </div>
      )}

      <h4 className={`${isCompact ? 'text-xs' : 'text-sm'} font-black text-stone-900 dark:text-white leading-snug`}>
        {appointment.title}
      </h4>

      {appointment.location && (
        <p className="text-[10px] text-stone-600 dark:text-slate-300 flex items-center gap-1">
          <MapPin className="w-3 h-3 text-stone-400" />
          <span>{appointment.location}</span>
        </p>
      )}

      {!isCompact && appointment.notes && (
        <p className="text-xs text-stone-500 dark:text-slate-400 italic">
          {appointment.notes}
        </p>
      )}

      {/* Carpool Logistics Pill */}
      {appointment.carpool?.enabled ? (
        <div className="pt-0.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onManageCarpool?.(appointment);
            }}
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-blue-100 dark:bg-blue-950/70 border border-blue-300 dark:border-blue-700 text-[10px] font-black text-blue-900 dark:text-blue-200 hover:scale-102 active:scale-98 transition-transform"
          >
            <span>🚗</span>
            <span>{appointment.carpool.driverName}: {appointment.carpool.riders.length}/{appointment.carpool.totalSeats} Plätze</span>
          </button>
        </div>
      ) : onManageCarpool && (appointment.category === 'sports' || appointment.category === 'school' || assignedMembers.some((m) => m.isChild)) ? (
        <div className="pt-0.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onManageCarpool(appointment);
            }}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border border-dashed border-stone-300 dark:border-slate-700 text-[10px] font-bold text-stone-500 hover:text-blue-600 hover:border-blue-400 transition-colors"
          >
            <span>🚗</span>
            <span>+ Fahrgemeinschaft</span>
          </button>
        </div>
      ) : null}
    </div>
  );
};
