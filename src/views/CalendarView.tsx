import React, { useState } from 'react';
import { useFamily } from '../context/FamilyContext';
import { Appointment, AppointmentCategory } from '../types';
import { ModalPortal } from '../components/ModalPortal';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  Trash2,
  Edit2,
  Tag,
} from 'lucide-react';
import {
  format,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addDays,
  subDays,
} from 'date-fns';
import { de } from 'date-fns/locale';

const CATEGORY_CONFIG: Record<
  AppointmentCategory,
  { label: string; bg: string; text: string; border: string; icon: string }
> = {
  sports: { label: 'Sport & Vereine', bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800', icon: '⚽' },
  school: { label: 'Schule & Kita', bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800', icon: '🎒' },
  health: { label: 'Arzt & Zahnarzt', bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800', icon: '🩺' },
  family: { label: 'Familienausflug', bg: 'bg-rose-50 dark:bg-rose-950/40', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-800', icon: '🎉' },
  work: { label: 'Arbeit & Erledigung', bg: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800', icon: '💼' },
  social: { label: 'Freunde & Treffen', bg: 'bg-teal-50 dark:bg-teal-950/40', text: 'text-teal-700 dark:text-teal-300', border: 'border-teal-200 dark:border-teal-800', icon: '☕' },
};

export const CalendarView: React.FC = () => {
  const {
    members,
    appointments,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    currentMemberId,
  } = useFamily();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'agenda'>('month');
  const [selectedCategory, setSelectedCategory] = useState<AppointmentCategory | 'all'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppId, setEditingAppId] = useState<string | null>(null);

  // Form state for add/edit modal
  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [formTime, setFormTime] = useState('14:00');
  const [formDuration, setFormDuration] = useState(60);
  const [formLocation, setFormLocation] = useState('');
  const [formCategory, setFormCategory] = useState<AppointmentCategory>('family');
  const [formMembers, setFormMembers] = useState<string[]>([]);
  const [formNotes, setFormNotes] = useState('');

  // Date navigation
  const nextPeriod = () => {
    if (viewMode === 'month') setCurrentDate((d) => addMonths(d, 1));
    else setCurrentDate((d) => addDays(d, 7));
  };

  const prevPeriod = () => {
    if (viewMode === 'month') setCurrentDate((d) => subMonths(d, 1));
    else setCurrentDate((d) => subDays(d, 7));
  };

  const prevWeek = () => {
    setSelectedDay((d) => {
      const next = subDays(d, 7);
      if (!isSameMonth(next, currentDate)) setCurrentDate(next);
      return next;
    });
  };

  const nextWeek = () => {
    setSelectedDay((d) => {
      const next = addDays(d, 7);
      if (!isSameMonth(next, currentDate)) setCurrentDate(next);
      return next;
    });
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDay(now);
  };

  // Filtered appointments
  const filteredAppointments = appointments.filter((app) => {
    const matchesMember =
      currentMemberId === 'all' ? true : app.memberIds.includes(currentMemberId);
    const matchesCategory =
      selectedCategory === 'all' ? true : app.category === selectedCategory;
    return matchesMember && matchesCategory;
  });

  const openAddModal = (dateStr?: string) => {
    setEditingAppId(null);
    setFormTitle('');
    setFormDate(dateStr || format(new Date(), 'yyyy-MM-dd'));
    setFormTime('15:00');
    setFormDuration(60);
    setFormLocation('');
    setFormCategory('family');
    setFormMembers(currentMemberId === 'all' ? [members[0]?.id || 'm1'] : [currentMemberId]);
    setFormNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (app: Appointment) => {
    setEditingAppId(app.id);
    setFormTitle(app.title);
    setFormDate(app.date);
    setFormTime(app.time);
    setFormDuration(app.durationMinutes || 60);
    setFormLocation(app.location || '');
    setFormCategory(app.category);
    setFormMembers(app.memberIds);
    setFormNotes(app.notes || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || formMembers.length === 0) return;

    if (editingAppId) {
      updateAppointment(editingAppId, {
        title: formTitle.trim(),
        date: formDate,
        time: formTime,
        durationMinutes: Number(formDuration),
        location: formLocation.trim() || undefined,
        category: formCategory,
        memberIds: formMembers,
        notes: formNotes.trim() || undefined,
      });
    } else {
      addAppointment({
        title: formTitle.trim(),
        date: formDate,
        time: formTime,
        durationMinutes: Number(formDuration),
        location: formLocation.trim() || undefined,
        category: formCategory,
        memberIds: formMembers,
        notes: formNotes.trim() || undefined,
      });
    }
    setIsModalOpen(false);
  };

  const toggleMemberInForm = (id: string) => {
    setFormMembers((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  // Month grid calculations
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  // Mobile Week calculations
  const weekStart = startOfWeek(selectedDay, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const selectedDayStr = format(selectedDay, 'yyyy-MM-dd');
  const selectedDayAppointments = filteredAppointments
    .filter((a) => a.date === selectedDayStr)
    .sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Header & Controls */}
      <div className="duo-card flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 bg-white dark:bg-slate-900 p-3.5 sm:p-5 border-2 border-stone-200 dark:border-slate-800">
        
        {/* Navigation title & Quick Add */}
        <div className="flex items-center justify-between sm:justify-start gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold shrink-0">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h2 className="text-base sm:text-xl font-black text-stone-900 dark:text-white capitalize">
                  {format(currentDate, 'MMMM yyyy', { locale: de })}
                </h2>
                <button
                  onClick={goToToday}
                  className="px-2 py-0.5 text-[11px] sm:text-xs font-bold rounded-lg bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-200 transition-colors"
                >
                  Heute
                </button>
              </div>
              <p className="text-[11px] sm:text-xs font-semibold text-stone-500 dark:text-slate-400">
                {filteredAppointments.length} Termine {selectedCategory !== 'all' ? 'gefiltert' : 'geplant'}
              </p>
            </div>
          </div>

          {/* Quick Add on mobile right top */}
          <button
            onClick={() => openAddModal(selectedDayStr)}
            className="sm:hidden duo-btn duo-btn-blue px-3 py-1.5 text-xs font-black rounded-xl shadow-xs shrink-0 flex items-center gap-1 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>+ Termin</span>
          </button>
        </div>

        {/* Date controls & View toggles */}
        <div className="flex items-center justify-between sm:justify-end flex-wrap gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100 dark:border-slate-800">
          {/* Previous / Next */}
          <div className="flex items-center bg-stone-100 dark:bg-slate-800 p-1 rounded-xl border border-stone-200/60 dark:border-slate-700">
            <button
              onClick={prevPeriod}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-stone-700 dark:text-slate-200 transition-colors"
              title="Vorheriger Monat"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextPeriod}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-stone-700 dark:text-slate-200 transition-colors"
              title="Nächster Monat"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* View Mode */}
          <div className="flex items-center bg-stone-100 dark:bg-slate-800 p-1 rounded-xl border border-stone-200/60 dark:border-slate-700">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'month'
                  ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs'
                  : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <span className="sm:hidden">Kalender</span>
              <span className="hidden sm:inline">Monatsansicht</span>
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'agenda'
                  ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs'
                  : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              Terminliste
            </button>
          </div>

          {/* Add appointment button (desktop) */}
          <button
            onClick={() => openAddModal()}
            className="hidden sm:flex duo-btn duo-btn-blue px-3.5 py-2 text-xs font-black rounded-xl shadow-xs items-center whitespace-nowrap"
          >
            <Plus className="w-4 h-4 mr-1 stroke-[3]" />
            <span>+ Termin</span>
          </button>
        </div>
      </div>

      {/* Filter Bar: Member & Category */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 bg-stone-50/80 dark:bg-slate-800/80 p-2.5 sm:p-3.5 rounded-2xl border border-stone-200/70 dark:border-slate-700 overflow-hidden">
        
        {/* Category Pills (horizontally scrollable without overflow) */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none pb-0.5">
          <span className="text-xs font-bold text-stone-500 dark:text-slate-400 flex items-center gap-1 shrink-0 mr-1">
            <Tag className="w-3 h-3" /> Filter:
          </span>
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-stone-900 dark:bg-blue-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-700 border border-stone-200 dark:border-slate-700'
            }`}
          >
            Alle
          </button>
          {Object.entries(CATEGORY_CONFIG).map(([catKey, conf]) => (
            <button
              key={catKey}
              onClick={() => setSelectedCategory(catKey as AppointmentCategory)}
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

      {/* MOBILE VIEW: Week Strip + Selected Day Schedule (sm:hidden) */}
      {viewMode === 'month' && (
        <div className="sm:hidden space-y-4">
          
          {/* Week Strip Card */}
          <div className="duo-card p-3 bg-white dark:bg-slate-900 border-2 border-stone-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs px-1">
              <span className="font-extrabold text-stone-700 dark:text-slate-300">
                {format(weekStart, 'd. MMM', { locale: de })} – {format(weekEnd, 'd. MMM yyyy', { locale: de })}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={prevWeek}
                  className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-600 dark:text-slate-300"
                  title="Vorherige Woche"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={nextWeek}
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
                const dayApps = filteredAppointments.filter((a) => a.date === dateStr);

                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => {
                      setSelectedDay(day);
                      if (!isSameMonth(day, currentDate)) {
                        setCurrentDate(day);
                      }
                    }}
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
                      {dayApps.slice(0, 3).map((_, i) => (
                        <span
                          key={i}
                          className={`w-1.5 h-1.5 rounded-full ${
                            isSelected ? 'bg-white' : 'bg-blue-500 dark:bg-blue-400'
                          }`}
                        />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Day Appointments Card */}
          <div className="duo-card p-4 bg-white dark:bg-slate-900 border-2 border-stone-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-slate-800 pb-2.5">
              <div>
                <h3 className="font-black text-stone-900 dark:text-white text-sm">
                  {format(selectedDay, 'EEEE, d. MMMM', { locale: de })}
                </h3>
                <span className="text-[11px] font-bold text-stone-400 dark:text-slate-400">
                  {selectedDayAppointments.length === 0
                    ? 'Keine Termine'
                    : `${selectedDayAppointments.length} ${
                        selectedDayAppointments.length === 1 ? 'Termin' : 'Termine'
                      }`}
                </span>
              </div>
              <button
                onClick={() => openAddModal(selectedDayStr)}
                className="duo-btn duo-btn-blue px-3 py-1.5 text-xs font-black rounded-xl shadow-xs"
              >
                + Neuer Termin
              </button>
            </div>

            {selectedDayAppointments.length === 0 ? (
              <div className="py-6 text-center text-stone-400 dark:text-slate-500 space-y-2">
                <span className="text-2xl block">🎉</span>
                <p className="text-xs font-bold text-stone-600 dark:text-slate-300">
                  Keine Termine für diesen Tag geplant.
                </p>
                <button
                  onClick={() => openAddModal(selectedDayStr)}
                  className="duo-btn duo-btn-white px-3.5 py-1.5 text-xs font-bold rounded-xl"
                >
                  + Termin für {format(selectedDay, 'dd.MM.')} planen
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {selectedDayAppointments.map((app) => {
                  const conf = CATEGORY_CONFIG[app.category];
                  const assignedMembers = members.filter((m) =>
                    app.memberIds.includes(m.id)
                  );

                  return (
                    <div
                      key={app.id}
                      onClick={() => openEditModal(app)}
                      className={`p-3 rounded-2xl border-2 cursor-pointer transition-all hover:shadow-xs ${conf.bg} ${conf.border} space-y-1.5`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-extrabold px-2 py-0.5 rounded-md bg-white/90 dark:bg-slate-900/90 text-stone-800 dark:text-slate-200">
                            ⏰ {app.time}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${conf.text} bg-white/60 dark:bg-slate-900/60`}>
                            {conf.icon} {conf.label}
                          </span>
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

                      <h4 className="text-sm font-black text-stone-900 dark:text-white leading-snug">
                        {app.title}
                      </h4>

                      {app.location && (
                        <p className="text-[11px] text-stone-600 dark:text-slate-300 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-stone-400" />
                          <span>{app.location}</span>
                        </p>
                      )}

                      {app.notes && (
                        <p className="text-[11px] text-stone-500 dark:text-slate-400 italic">
                          {app.notes}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* DESKTOP MONTH VIEW (hidden sm:block) */}
      {viewMode === 'month' && (
        <div className="hidden sm:block duo-card bg-white dark:bg-slate-900 border-2 border-stone-200 dark:border-slate-800 overflow-hidden">
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
              const dayAppointments = filteredAppointments
                .filter((a) => a.date === dateStr)
                .sort((a, b) => a.time.localeCompare(b.time));

              return (
                <div
                  key={dateStr}
                  onClick={() => openAddModal(dateStr)}
                  className={`min-h-[115px] p-2 flex flex-col justify-between transition-colors group cursor-pointer hover:bg-stone-50/80 dark:hover:bg-slate-800/50 ${
                    !isCurrentMonth ? 'bg-stone-50/40 dark:bg-slate-950/40 text-stone-300 dark:text-slate-600' : 'bg-white dark:bg-slate-900 text-stone-800 dark:text-slate-100'
                  } ${isToday ? 'bg-blue-50/30 dark:bg-blue-950/30' : ''}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-black w-6 h-6 rounded-full flex items-center justify-center ${
                        isToday
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : isCurrentMonth
                          ? 'text-stone-700 dark:text-slate-300'
                          : 'text-stone-300 dark:text-slate-600'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openAddModal(dateStr);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-blue-600 p-0.5 rounded transition-opacity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Appointments in this day */}
                  <div className="space-y-1 flex-1 overflow-y-auto max-h-[80px] scrollbar-none">
                    {dayAppointments.map((app) => {
                      const conf = CATEGORY_CONFIG[app.category];
                      const assignedMembers = members.filter((m) => app.memberIds.includes(m.id));
                      return (
                        <div
                          key={app.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(app);
                          }}
                          title={`${app.title} (${app.time}) - ${assignedMembers.map((m) => m.name).join(', ')}`}
                          className={`px-1.5 py-1 rounded-lg border text-[11px] leading-tight font-bold flex items-center justify-between gap-1 shadow-2xs cursor-pointer hover:scale-102 transition-transform ${conf.bg} ${conf.border} ${conf.text}`}
                        >
                          <div className="truncate flex items-center gap-1">
                            <span className="font-extrabold text-[9px] opacity-75">{app.time}</span>
                            <span className="truncate">{app.title}</span>
                          </div>
                          {/* Attendees preview */}
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
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AGENDA LIST VIEW */}
      {viewMode === 'agenda' && (
        <div className="duo-card bg-white dark:bg-slate-900 border-2 border-stone-200 dark:border-slate-800 p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-stone-200 dark:border-slate-800 pb-3">
            <h3 className="font-black text-stone-900 dark:text-white text-base">Anstehende Termine & Events</h3>
            <span className="text-xs text-stone-500 dark:text-slate-400 font-bold">
              {filteredAppointments.length} Termine geplant
            </span>
          </div>

          {filteredAppointments.length === 0 ? (
            <div className="text-center py-12 text-stone-400 dark:text-slate-500">
              <CalendarIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-bold">Keine Termine für die gewählten Filter vorhanden.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAppointments
                .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
                .map((app) => {
                  const conf = CATEGORY_CONFIG[app.category];
                  const assignedMembers = members.filter((m) => app.memberIds.includes(m.id));
                  return (
                    <div
                      key={app.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border-2 border-stone-200 dark:border-slate-800 bg-stone-50/40 dark:bg-slate-800/60 hover:bg-stone-50 dark:hover:bg-slate-800 transition-all gap-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 shadow-2xs text-center shrink-0">
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

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${conf.bg} ${conf.border} ${conf.text}`}
                            >
                              {conf.icon} {conf.label}
                            </span>
                            <span className="text-xs font-bold text-stone-700 dark:text-slate-300 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-stone-400" />
                              {app.time} ({app.durationMinutes || 60} Min.)
                            </span>
                          </div>

                          <h4 className="text-base font-black text-stone-900 dark:text-white">{app.title}</h4>

                          {app.location && (
                            <p className="text-xs text-stone-500 dark:text-slate-400 flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-stone-400" />
                              <span>{app.location}</span>
                            </p>
                          )}

                          {app.notes && (
                            <p className="text-xs text-stone-600 dark:text-slate-300 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-stone-200 dark:border-slate-700 inline-block mt-1">
                              {app.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right side: Attendees & Actions */}
                      <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-200 dark:border-slate-800">
                        {/* Member badges */}
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

                        {/* Action buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditModal(app)}
                            className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-white hover:bg-stone-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            title="Bearbeiten"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Termin "${app.title}" wirklich löschen?`)) {
                                deleteAppointment(app.id);
                              }
                            }}
                            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                            title="Löschen"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Appointment Modal */}
      {isModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-xl border-2 border-stone-200 dark:border-slate-800 animate-in fade-in zoom-in-95 max-h-[92vh] flex flex-col my-auto overflow-hidden">
            <div className="flex items-center justify-between p-5 sm:p-6 pb-3 border-b border-stone-100 dark:border-slate-800 shrink-0">
              <h3 className="text-lg font-black text-stone-900 dark:text-white">
                {editingAppId ? 'Termin bearbeiten' : 'Neuer Termin'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-slate-800 text-stone-400 hover:text-stone-600 dark:hover:text-white flex items-center justify-center text-sm font-bold transition-colors shrink-0"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-5 sm:p-6 pt-4 flex-1 overflow-y-auto scrollbar-thin">
              <div>
                <label className="block text-xs font-bold text-stone-600 dark:text-slate-300 uppercase mb-1">
                  Titel
                </label>
                <input
                  type="text"
                  placeholder="z.B. Leo Fußballturnier, Zahnarztkontrolle, Klavier"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-sm focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-600 dark:text-slate-300 uppercase mb-1">
                    Datum
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-sm focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-600 dark:text-slate-300 uppercase mb-1">
                    Uhrzeit
                  </label>
                  <input
                    type="time"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-sm focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-600 dark:text-slate-300 uppercase mb-1">
                    Dauer (Minuten)
                  </label>
                  <input
                    type="number"
                    min="15"
                    step="15"
                    value={formDuration}
                    onChange={(e) => setFormDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-600 dark:text-slate-300 uppercase mb-1">
                    Kategorie
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as AppointmentCategory)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-sm focus:outline-none"
                  >
                    {Object.entries(CATEGORY_CONFIG).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.icon} {v.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-600 dark:text-slate-300 uppercase mb-1">
                  Ort (optional)
                </label>
                <input
                  type="text"
                  placeholder="z.B. Sportplatz West, Zahnarztpraxis Dr. Schmidt"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-sm focus:outline-none"
                />
              </div>

              {/* Multi-member Selection */}
              <div>
                <label className="block text-xs font-bold text-stone-600 dark:text-slate-300 uppercase mb-1.5">
                  Teilnehmende Personen (Mehrfachauswahl)
                </label>
                <div className="flex flex-wrap gap-2">
                  {members.map((m) => {
                    const isSelected = formMembers.includes(m.id);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => toggleMemberInForm(m.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-950 border-blue-500 text-blue-700 dark:text-blue-300 shadow-2xs'
                            : 'bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700 text-stone-600 dark:text-slate-300 hover:bg-stone-50'
                        }`}
                      >
                        <span>{m.avatar}</span>
                        <span>{m.name}</span>
                        {isSelected && <span className="font-bold">✓</span>}
                      </button>
                    );
                  })}
                </div>
                {formMembers.length === 0 && (
                  <p className="text-[11px] text-rose-500 mt-1">Bitte mindestens ein Familienmitglied auswählen.</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-600 dark:text-slate-300 uppercase mb-1">
                  Notizen & Details (optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="z.B. Trinkflasche mitnehmen, Papa holt ab..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-sm focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="duo-btn duo-btn-white px-4 py-2 text-xs font-bold rounded-xl"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={formMembers.length === 0}
                  className="duo-btn duo-btn-blue px-5 py-2 text-xs font-black rounded-xl disabled:opacity-50"
                >
                  {editingAppId ? 'Änderungen speichern' : 'Termin anlegen'}
                </button>
              </div>
            </form>
          </div>
        </div>
        </ModalPortal>
      )}
    </div>
  );
};
