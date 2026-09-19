import React, { useState } from 'react';
import { useFamily } from '../context/FamilyContext';
import { Appointment, AppointmentCategory } from '../types';
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

const CATEGORY_CONFIG: Record<
  AppointmentCategory,
  { label: string; bg: string; text: string; border: string; icon: string }
> = {
  sports: { label: 'Sports & Clubs', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: '⚽' },
  school: { label: 'School & Classes', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: '🎒' },
  health: { label: 'Doctor & Dental', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: '🩺' },
  family: { label: 'Family Outing', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: '🎉' },
  work: { label: 'Work & Errands', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', icon: '💼' },
  social: { label: 'Friends & Social', bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', icon: '☕' },
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

  const goToToday = () => setCurrentDate(new Date());

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

  return (
    <div className="space-y-6">
      {/* Top Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-stone-200/80 shadow-xs">
        
        {/* Navigation title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-stone-900">
                {format(currentDate, 'MMMM yyyy')}
              </h2>
              <button
                onClick={goToToday}
                className="px-2.5 py-0.5 text-xs font-semibold rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
              >
                Today
              </button>
            </div>
            <p className="text-xs text-stone-500">
              Coordinating {members.length} family members
            </p>
          </div>
        </div>

        {/* Date controls & View toggles */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Previous / Next */}
          <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200/60">
            <button
              onClick={prevPeriod}
              className="p-1.5 rounded-lg hover:bg-white text-stone-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextPeriod}
              className="p-1.5 rounded-lg hover:bg-white text-stone-700 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* View Mode */}
          <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200/60">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'month'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Month View
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'agenda'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Agenda List
            </button>
          </div>

          {/* Add appointment button */}
          <button
            onClick={() => openAddModal()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-all active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>Add Appointment</span>
          </button>
        </div>
      </div>

      {/* Filter Bar: Member & Category */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-stone-50/80 p-3.5 rounded-2xl border border-stone-200/70">
        
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none">
          <span className="text-xs font-bold text-stone-500 flex items-center gap-1 shrink-0 mr-1">
            <Tag className="w-3 h-3" /> Filter:
          </span>
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            All Types
          </button>
          {Object.entries(CATEGORY_CONFIG).map(([catKey, conf]) => (
            <button
              key={catKey}
              onClick={() => setSelectedCategory(catKey as AppointmentCategory)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1 ${
                selectedCategory === catKey
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              <span>{conf.icon}</span>
              <span>{conf.label}</span>
            </button>
          ))}
        </div>

        {/* Member indicator notice */}
        <div className="text-xs text-stone-500 font-medium shrink-0">
          Showing:{' '}
          <strong className="text-stone-800">
            {currentMemberId === 'all'
              ? 'All Family Members'
              : members.find((m) => m.id === currentMemberId)?.name}
          </strong>
        </div>
      </div>

      {/* MONTH VIEW */}
      {viewMode === 'month' && (
        <div className="bg-white rounded-3xl border border-stone-200/80 shadow-xs overflow-hidden">
          {/* Day Headers (Mon - Sun) */}
          <div className="calendar-grid border-b border-stone-200 bg-stone-50/70 text-center py-2 text-xs font-bold text-stone-600 uppercase tracking-wider">
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
            <div>Sun</div>
          </div>

          {/* Month Calendar Cells */}
          <div className="calendar-grid divide-x divide-y divide-stone-100">
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
                  className={`min-h-[115px] p-2 flex flex-col justify-between transition-colors group cursor-pointer hover:bg-stone-50/80 ${
                    !isCurrentMonth ? 'bg-stone-50/40 text-stone-300' : 'bg-white text-stone-800'
                  } ${isToday ? 'bg-indigo-50/20' : ''}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                        isToday
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : isCurrentMonth
                          ? 'text-stone-700'
                          : 'text-stone-300'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openAddModal(dateStr);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-indigo-600 p-0.5 rounded transition-opacity"
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
                          className={`px-1.5 py-1 rounded-lg border text-[11px] leading-tight font-semibold flex items-center justify-between gap-1 shadow-2xs cursor-pointer hover:scale-102 transition-transform ${conf.bg} ${conf.border} ${conf.text}`}
                        >
                          <div className="truncate flex items-center gap-1">
                            <span className="font-bold text-[9px] opacity-75">{app.time}</span>
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
        <div className="bg-white rounded-3xl border border-stone-200/80 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-stone-200 pb-3">
            <h3 className="font-bold text-stone-900 text-base">Upcoming Appointments & Events</h3>
            <span className="text-xs text-stone-500 font-semibold">
              {filteredAppointments.length} total scheduled
            </span>
          </div>

          {filteredAppointments.length === 0 ? (
            <div className="text-center py-12 text-stone-400">
              <CalendarIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">No appointments match the selected filters.</p>
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
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-stone-200/80 bg-stone-50/40 hover:bg-stone-50 transition-all gap-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-xl bg-white border border-stone-200 shadow-2xs text-center shrink-0">
                          <span className="block text-[10px] uppercase font-bold text-stone-400">
                            {format(new Date(app.date), 'MMM')}
                          </span>
                          <span className="block text-lg font-extrabold text-stone-800">
                            {format(new Date(app.date), 'dd')}
                          </span>
                          <span className="block text-[10px] text-stone-500 font-semibold">
                            {format(new Date(app.date), 'EEE')}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${conf.bg} ${conf.border} ${conf.text}`}
                            >
                              {conf.icon} {conf.label}
                            </span>
                            <span className="text-xs font-bold text-stone-700 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-stone-400" />
                              {app.time} ({app.durationMinutes || 60}m)
                            </span>
                          </div>

                          <h4 className="text-base font-bold text-stone-900">{app.title}</h4>

                          {app.location && (
                            <p className="text-xs text-stone-500 flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-stone-400" />
                              <span>{app.location}</span>
                            </p>
                          )}

                          {app.notes && (
                            <p className="text-xs text-stone-600 bg-white/80 px-2.5 py-1 rounded-lg border border-stone-200/60 inline-block mt-1">
                              {app.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right side: Attendees & Actions */}
                      <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-200">
                        {/* Member badges */}
                        <div className="flex items-center gap-1.5">
                          {assignedMembers.map((m) => (
                            <span
                              key={m.id}
                              title={`${m.name} (${m.role})`}
                              className="px-2 py-1 rounded-xl text-xs font-semibold bg-white border border-stone-200 shadow-2xs flex items-center gap-1"
                            >
                              <span>{m.avatar}</span>
                              <span className="text-stone-700">{m.name}</span>
                            </span>
                          ))}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditModal(app)}
                            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete appointment "${app.title}"?`)) {
                                deleteAppointment(app.id);
                              }
                            }}
                            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete"
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
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-stone-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 border-b border-stone-100 pb-3">
              <h3 className="text-lg font-bold text-stone-900">
                {editingAppId ? 'Edit Appointment' : 'New Appointment'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-600 uppercase mb-1">
                  Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Leo Soccer Tournament, Doctor Checkup, Piano Class"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-600 uppercase mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-600 uppercase mb-1">
                    Time
                  </label>
                  <input
                    type="time"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-600 uppercase mb-1">
                    Duration (mins)
                  </label>
                  <input
                    type="number"
                    min="15"
                    step="15"
                    value={formDuration}
                    onChange={(e) => setFormDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-600 uppercase mb-1">
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as AppointmentCategory)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
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
                <label className="block text-xs font-bold text-stone-600 uppercase mb-1">
                  Location (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Westside Sports Park, Children's Dental Clinic"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Multi-member Selection */}
              <div>
                <label className="block text-xs font-bold text-stone-600 uppercase mb-1.5">
                  Attending Family Members (Multi-Select)
                </label>
                <div className="flex flex-wrap gap-2">
                  {members.map((m) => {
                    const isSelected = formMembers.includes(m.id);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => toggleMemberInForm(m.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-2xs'
                            : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
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
                  <p className="text-[11px] text-rose-500 mt-1">Please select at least one family member.</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-600 uppercase mb-1">
                  Notes & Details (optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Bring water bottle, Alex doing drop-off..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formMembers.length === 0}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs disabled:opacity-50"
                >
                  {editingAppId ? 'Save Changes' : 'Create Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
