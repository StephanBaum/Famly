import React, { useState, useMemo } from 'react';
import { format, addDays, subDays, isSameDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { useFamily } from '../../context/FamilyContext';
import { Appointment, FamilyMember, isAppointmentOnDate, detectAppointmentConflicts } from '../../types';
import { CATEGORY_CONFIG, detectStickerFromTitle } from './calendarConstants';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  Home,
  AlertTriangle,
  Car,
} from 'lucide-react';

export interface FamilyBoardCalendarViewProps {
  initialDate?: Date;
  onOpenAddAppointment?: (dateStr?: string, prefillMemberId?: string) => void;
  onEditAppointment?: (app: Appointment) => void;
  onManageCarpool?: (app: Appointment) => void;
  onReturnToStation?: () => void;
  isKioskMode?: boolean;
}

export const FamilyBoardCalendarView: React.FC<FamilyBoardCalendarViewProps> = ({
  initialDate = new Date(),
  onOpenAddAppointment,
  onEditAppointment,
  onManageCarpool,
  onReturnToStation,
  isKioskMode = false,
}) => {
  const { members, appointments, chores } = useFamily();
  const [selectedDay, setSelectedDay] = useState<Date>(initialDate);

  const selectedDayStr = useMemo(() => format(selectedDay, 'yyyy-MM-dd'), [selectedDay]);

  // Navigate days
  const handlePrevDay = () => setSelectedDay((d) => subDays(d, 1));
  const handleNextDay = () => setSelectedDay((d) => addDays(d, 1));
  const handleGoToToday = () => setSelectedDay(new Date());

  // 7-day ribbon around selected date (from -2 days to +4 days)
  const ribbonDays = useMemo(() => {
    return [-2, -1, 0, 1, 2, 3, 4].map((offset) => addDays(selectedDay, offset));
  }, [selectedDay]);

  // Appointments on selected day
  const dayAppointments = useMemo(() => {
    return appointments
      .filter((a) => isAppointmentOnDate(a, selectedDayStr))
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  }, [appointments, selectedDayStr]);

  // Conflict detection
  const conflicts = useMemo(() => {
    return detectAppointmentConflicts(dayAppointments);
  }, [dayAppointments]);

  // Separate family members + Shared "Family / Alle" track
  const activeMembers = useMemo(() => {
    return members.filter(Boolean);
  }, [members]);

  // Events that apply to all members or have 2+ members assigned
  const sharedFamilyAppointments = useMemo(() => {
    return dayAppointments.filter(
      (a) => a.memberIds.length === 0 || a.memberIds.length >= Math.max(2, activeMembers.length - 1)
    );
  }, [dayAppointments, activeMembers.length]);

  // Get appointments for a specific member
  const getMemberAppointments = (memberId: string): Appointment[] => {
    return dayAppointments.filter((a) => a.memberIds.includes(memberId));
  };

  // Get count of open chores for member today
  const getMemberOpenChoresCount = (memberId: string): number => {
    return chores.filter((c) => !c.completed && (c.assignedMemberIds?.includes(memberId) || c.assignedMemberId === memberId)).length;
  };

  const isToday = isSameDay(selectedDay, new Date());

  return (
    <div className={`flex flex-col h-full w-full select-none ${
      isKioskMode ? 'p-4 sm:p-6 min-h-[90vh]' : 'space-y-4'
    }`}>
      {/* Top Board Navigation Bar */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-200/80 dark:border-slate-800">
        <div className="flex items-center gap-3">
          {onReturnToStation && (
            <button
              onClick={onReturnToStation}
              className="duo-btn duo-btn-white dark:bg-slate-800 dark:text-white px-3.5 py-2 rounded-2xl text-xs font-black flex items-center gap-1.5 shadow-xs"
              title="Zurück zur Station"
            >
              <Home className="w-4 h-4" />
              <span>Station</span>
            </button>
          )}

          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-stone-900 dark:text-white">
                {format(selectedDay, 'EEEE, d. MMMM yyyy', { locale: de })}
              </h2>
            </div>
            <p className="text-xs font-bold text-stone-500 dark:text-slate-400 mt-0.5">
              Familien-Kalender • {dayAppointments.length} Termine heute
            </p>
          </div>
        </div>

        {/* Day Navigation Controls & 7-Day Ribbon */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Day Stepper */}
          <div className="flex items-center bg-white dark:bg-slate-800/90 border-2 border-stone-200 dark:border-slate-700 rounded-2xl p-1 shadow-2xs">
            <button
              onClick={handlePrevDay}
              className="p-1.5 hover:bg-stone-100 dark:hover:bg-slate-700 text-stone-600 dark:text-slate-300 rounded-xl transition-colors"
              title="Vorheriger Tag"
            >
              <ChevronLeft className="w-4 h-4 stroke-[3]" />
            </button>
            <button
              onClick={handleGoToToday}
              className={`px-3 py-1 rounded-xl text-xs font-black transition-all ${
                isToday
                  ? 'bg-amber-400 text-stone-950 shadow-2xs'
                  : 'text-stone-700 dark:text-slate-200 hover:bg-stone-100 dark:hover:bg-slate-700'
              }`}
            >
              Heute
            </button>
            <button
              onClick={handleNextDay}
              className="p-1.5 hover:bg-stone-100 dark:hover:bg-slate-700 text-stone-600 dark:text-slate-300 rounded-xl transition-colors"
              title="Nächster Tag"
            >
              <ChevronRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>

          {/* Quick 7-Day Date Ribbon */}
          <div className="hidden lg:flex items-center gap-1 bg-stone-100 dark:bg-slate-800/60 p-1 rounded-2xl border border-stone-200 dark:border-slate-700">
            {ribbonDays.map((day) => {
              const dayStr = format(day, 'yyyy-MM-dd');
              const isSelected = isSameDay(day, selectedDay);
              const isTodayRibbon = isSameDay(day, new Date());
              const count = appointments.filter((a) => isAppointmentOnDate(a, dayStr)).length;

              return (
                <button
                  key={dayStr}
                  onClick={() => setSelectedDay(day)}
                  className={`px-2.5 py-1.5 rounded-xl text-center transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white font-black shadow-xs scale-105'
                      : isTodayRibbon
                      ? 'bg-amber-100/70 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200 font-bold'
                      : 'hover:bg-white/80 dark:hover:bg-slate-700 text-stone-600 dark:text-slate-300'
                  }`}
                >
                  <div className="text-[10px] uppercase font-bold opacity-80">
                    {format(day, 'EEE', { locale: de })}
                  </div>
                  <div className="text-xs font-black flex items-center justify-center gap-0.5">
                    <span>{format(day, 'd')}</span>
                    {count > 0 && (
                      <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-amber-300' : 'bg-blue-500'}`} />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* New Appointment Button */}
          {onOpenAddAppointment && (
            <button
              onClick={() => onOpenAddAppointment(selectedDayStr)}
              className="duo-btn duo-btn-blue px-3.5 py-2 rounded-2xl text-xs font-black flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Termin eintragen</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Multi-Member Board Columns */}
      <main className="flex-1 mt-4 overflow-x-auto pb-4 scrollbar-thin">
        <div className="flex gap-4 min-w-[700px] h-full items-start">
          
          {/* Column 1: Shared "🏡 Ganze Familie" Events */}
          <div className="flex-1 min-w-[220px] max-w-[340px] flex flex-col bg-stone-100/70 dark:bg-slate-900/60 rounded-3xl border-2 border-stone-200/90 dark:border-slate-800 p-3.5 shadow-xs h-full">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-slate-800 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-400 text-stone-900 flex items-center justify-center text-xl shadow-xs font-black">
                  🏡
                </div>
                <div>
                  <h3 className="text-sm font-black text-stone-900 dark:text-white">
                    Ganze Familie
                  </h3>
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                    {sharedFamilyAppointments.length} Termine
                  </span>
                </div>
              </div>

              {onOpenAddAppointment && (
                <button
                  onClick={() => onOpenAddAppointment(selectedDayStr)}
                  className="w-7 h-7 rounded-xl bg-stone-200 dark:bg-slate-800 hover:bg-amber-400 hover:text-stone-950 text-stone-600 dark:text-slate-300 flex items-center justify-center transition-colors"
                  title="Termin für ganze Familie eintragen"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                </button>
              )}
            </div>

            {/* List of Shared Events */}
            <div className="space-y-3 flex-1 overflow-y-auto pr-1 scrollbar-none">
              {sharedFamilyAppointments.map((app) => (
                <BoardEventCard
                  key={app.id}
                  appointment={app}
                  members={members}
                  conflicts={conflicts.get(app.id)}
                  onEdit={onEditAppointment}
                  onManageCarpool={onManageCarpool}
                />
              ))}

              {sharedFamilyAppointments.length === 0 && (
                <div
                  onClick={() => onOpenAddAppointment?.(selectedDayStr)}
                  className="p-5 border-2 border-dashed border-stone-200 dark:border-slate-800 rounded-2xl text-center cursor-pointer hover:border-amber-400 transition-colors group"
                >
                  <p className="text-xs font-bold text-stone-400 dark:text-slate-500 group-hover:text-amber-600">
                    + Gemeinsamer Ausflug / Familienzeit
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Member Columns */}
          {activeMembers.map((member) => {
            const memberApps = getMemberAppointments(member.id);
            const openChores = getMemberOpenChoresCount(member.id);

            return (
              <div
                key={member.id}
                className="flex-1 min-w-[220px] max-w-[340px] flex flex-col bg-white dark:bg-slate-900 rounded-3xl border-2 border-stone-200 dark:border-slate-800 p-3.5 shadow-xs h-full"
              >
                {/* Member Header */}
                <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-slate-800 mb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-stone-100 dark:bg-slate-800 border-2 border-stone-200 dark:border-slate-700 flex items-center justify-center text-2xl shadow-2xs shrink-0">
                      {member.avatar}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-black text-stone-900 dark:text-white truncate">
                        {member.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-stone-400">
                        <span>{member.role}</span>
                        {openChores > 0 && (
                          <span className="text-amber-500 font-extrabold">
                            • {openChores} ⭐
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {onOpenAddAppointment && (
                    <button
                      onClick={() => onOpenAddAppointment(selectedDayStr, member.id)}
                      className="w-7 h-7 rounded-xl bg-stone-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white text-stone-500 dark:text-slate-300 flex items-center justify-center transition-colors shrink-0"
                      title={`Termin für ${member.name} eintragen`}
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  )}
                </div>

                {/* Member Appointments List */}
                <div className="space-y-3 flex-1 overflow-y-auto pr-1 scrollbar-none">
                  {memberApps.map((app) => (
                    <BoardEventCard
                      key={app.id}
                      appointment={app}
                      members={members}
                      conflicts={conflicts.get(app.id)}
                      onEdit={onEditAppointment}
                      onManageCarpool={onManageCarpool}
                    />
                  ))}

                  {memberApps.length === 0 && (
                    <div
                      onClick={() => onOpenAddAppointment?.(selectedDayStr, member.id)}
                      className="p-5 border-2 border-dashed border-stone-200 dark:border-slate-800 rounded-2xl text-center cursor-pointer hover:border-blue-400 transition-colors group"
                    >
                      <p className="text-xs font-bold text-stone-400 dark:text-slate-500 group-hover:text-blue-600">
                        + Termin für {member.name}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

        </div>
      </main>
    </div>
  );
};

// =========================================================================
// Dedicated Board Event Card with Tactile Sticker Badge
// =========================================================================
interface BoardEventCardProps {
  appointment: Appointment;
  members: FamilyMember[];
  conflicts?: any[];
  onEdit?: (app: Appointment) => void;
  onManageCarpool?: (app: Appointment) => void;
}

const BoardEventCard: React.FC<BoardEventCardProps> = ({
  appointment,
  members,
  conflicts,
  onEdit,
  onManageCarpool,
}) => {
  const conf = CATEGORY_CONFIG[appointment.category] || CATEGORY_CONFIG.family;
  const sticker = appointment.sticker || detectStickerFromTitle(appointment.title, appointment.category);
  const assignedMembers = members.filter((m) => appointment.memberIds.includes(m.id));

  return (
    <div
      onClick={() => onEdit?.(appointment)}
      className="p-3.5 rounded-2xl border-2 border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-800/90 hover:border-amber-400 dark:hover:border-amber-500 shadow-2xs transition-all hover:scale-101 active:scale-99 cursor-pointer space-y-2.5"
    >
      {/* Top: Sticker + Time Badge + Carpool Status */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {/* Big Tactile Sticker Badge */}
          <div className="w-10 h-10 rounded-2xl bg-stone-100 dark:bg-slate-700/80 border border-stone-200 dark:border-slate-600 flex items-center justify-center text-2xl shadow-xs shrink-0">
            {sticker}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1 text-xs font-black text-stone-900 dark:text-white">
              <Clock className="w-3 h-3 text-stone-400 shrink-0" />
              <span>{appointment.time}</span>
              {appointment.durationMinutes && (
                <span className="text-[10px] font-bold text-stone-400">
                  ({appointment.durationMinutes} Min.)
                </span>
              )}
            </div>
            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${conf.text} bg-stone-100 dark:bg-slate-900 inline-block`}>
              {conf.label}
            </span>
          </div>
        </div>

        {/* Member Avatars Tagged */}
        <div className="flex -space-x-1.5 shrink-0">
          {assignedMembers.map((m) => (
            <span
              key={m.id}
              title={m.name}
              className="w-6 h-6 rounded-full bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-xs flex items-center justify-center shadow-xs"
            >
              {m.avatar}
            </span>
          ))}
        </div>
      </div>

      {/* Title */}
      <h4 className="text-sm font-black text-stone-900 dark:text-white leading-snug">
        {appointment.title}
      </h4>

      {/* Location */}
      {appointment.location && (
        <p className="text-[11px] font-bold text-stone-500 dark:text-slate-400 flex items-center gap-1">
          <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
          <span className="truncate">{appointment.location}</span>
        </p>
      )}

      {/* Carpool Logistics Pill */}
      {appointment.carpool?.enabled ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onManageCarpool?.(appointment);
          }}
          className="w-full flex items-center justify-between p-1.5 px-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-[11px] font-black text-blue-900 dark:text-blue-200 hover:scale-101 active:scale-99 transition-transform"
        >
          <div className="flex items-center gap-1.5">
            <Car className="w-3.5 h-3.5 text-blue-600" />
            <span>Fahrgemeinschaft</span>
          </div>
          <span>{appointment.carpool.riders.length}/{appointment.carpool.totalSeats} Plätze</span>
        </button>
      ) : onManageCarpool && (appointment.category === 'sports' || appointment.category === 'school' || assignedMembers.some((m) => m.isChild)) ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onManageCarpool(appointment);
          }}
          className="text-[10px] font-bold text-stone-400 hover:text-blue-600 flex items-center gap-1"
        >
          <span>🚗</span>
          <span>+ Fahrgemeinschaft planen</span>
        </button>
      ) : null}

      {/* Conflict Alert */}
      {conflicts && conflicts.length > 0 && (
        <div className="flex items-center gap-1.5 p-1.5 px-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-[10px] font-bold text-rose-800 dark:text-rose-200">
          <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />
          <span className="truncate">Überschneidung mit anderem Termin</span>
        </div>
      )}
    </div>
  );
};
