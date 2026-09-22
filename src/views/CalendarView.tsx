import React, { useState, useMemo } from 'react';
import { useFamily } from '../context/FamilyContext';
import {
  Appointment,
  AppointmentCategory,
  Chore,
  FamilyMember,
  isChoreRelevantForMember,
  isChoreOnDate,
  isAppointmentOnDate,
  detectAppointmentConflicts,
} from '../types';
import { downloadICalendarFile } from '../utils/icalExport';
import {
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  addDays,
  subDays,
  format,
} from 'date-fns';

// Modular Calendar Components
import { CalendarHeader } from '../components/calendar/CalendarHeader';
import { CalendarFilterBar } from '../components/calendar/CalendarFilterBar';
import { CalendarWeekStrip } from '../components/calendar/CalendarWeekStrip';
import { CalendarMonthGrid } from '../components/calendar/CalendarMonthGrid';
import { CalendarDayDetails } from '../components/calendar/CalendarDayDetails';
import { CalendarAgendaView } from '../components/calendar/CalendarAgendaView';
import { AppointmentModal } from '../components/calendar/AppointmentModal';
import { CalendarChoreModal } from '../components/calendar/CalendarChoreModal';
import { CalendarClaimModal } from '../components/calendar/CalendarClaimModal';

export const CalendarView: React.FC = () => {
  const {
    members,
    appointments,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    chores,
    addChore,
    updateChore,
    toggleChore,
    deleteChore,
    currentMemberId,
    loggedInMemberId,
  } = useFamily();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'agenda'>('month');
  const [selectedCategory, setSelectedCategory] = useState<AppointmentCategory | 'all' | 'chores_only'>('all');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [defaultModalDate, setDefaultModalDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  const [isChoreModalOpen, setIsChoreModalOpen] = useState(false);
  const [editingChore, setEditingChore] = useState<Chore | null>(null);
  const [defaultChoreDate, setDefaultChoreDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  const [claimingChore, setClaimingChore] = useState<Chore | null>(null);
  const [icalExportToast, setIcalExportToast] = useState<string | null>(null);

  // Period Navigation
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

  // Filtered Appointments
  const filteredAppointments = appointments.filter((app) => {
    if (selectedCategory === 'chores_only') return false;
    const matchesMember =
      currentMemberId === 'all' ? true : app.memberIds.includes(currentMemberId);
    const matchesCategory =
      selectedCategory === 'all' ? true : app.category === selectedCategory;
    return matchesMember && matchesCategory;
  });

  // Filtered Chores
  const relevantChores = chores.filter((c) => isChoreRelevantForMember(c, currentMemberId));

  // Date-specific queries
  const getDayChores = (dayDate: Date): Chore[] => {
    if (selectedCategory !== 'all' && selectedCategory !== 'chores_only') {
      return [];
    }
    return relevantChores.filter((c) => isChoreOnDate(c, dayDate));
  };

  const getDayAppointments = (dayDate: Date): Appointment[] => {
    if (selectedCategory === 'chores_only') {
      return [];
    }
    return filteredAppointments
      .filter((a) => isAppointmentOnDate(a, dayDate))
      .sort((a, b) => a.time.localeCompare(b.time));
  };

  // Conflicts on selectedDay
  const selectedDayAppointments = getDayAppointments(selectedDay);
  const selectedDayConflicts = useMemo(() => {
    return detectAppointmentConflicts(selectedDayAppointments);
  }, [selectedDayAppointments]);

  // Export iCal (.ics)
  const handleExportICal = () => {
    const appsToExport = currentMemberId === 'all'
      ? appointments
      : appointments.filter((a) => a.memberIds.includes(currentMemberId));
    downloadICalendarFile(appsToExport, members, 'Famly Kalender', 'famly-kalender.ics');
    setIcalExportToast('📅 Kalenderdatei (.ics) heruntergeladen! Bereit zum Import in Apple & Google Calendar.');
    setTimeout(() => setIcalExportToast(null), 5000);
  };

  // Chore completion / claiming
  const handleChoreToggle = (chore: Chore) => {
    if (chore.completed) {
      toggleChore(chore.id);
      return;
    }

    if (currentMemberId !== 'all') {
      toggleChore(chore.id, currentMemberId);
      return;
    }

    const assignees =
      chore.assignedMemberIds && chore.assignedMemberIds.length > 0
        ? members.filter((m) => chore.assignedMemberIds!.includes(m.id))
        : chore.assignedMemberId
        ? members.filter((m) => m.id === chore.assignedMemberId)
        : [];

    if (assignees.length === 1) {
      toggleChore(chore.id, assignees[0].id);
    } else {
      setClaimingChore(chore);
    }
  };

  const getEligibleClaimants = (chore: Chore): FamilyMember[] => {
    if (chore.assignedMemberIds && chore.assignedMemberIds.length > 0) {
      const matched = members.filter((m) => chore.assignedMemberIds!.includes(m.id));
      if (matched.length > 0) return matched;
    }
    const kids = members.filter((m) => m.isChild);
    return kids.length > 0 ? kids : members;
  };

  // Modal handlers - Appointments
  const openAddAppointmentModal = (dateStr?: string) => {
    setEditingAppointment(null);
    setDefaultModalDate(dateStr || format(selectedDay, 'yyyy-MM-dd'));
    setIsModalOpen(true);
  };

  const openEditAppointmentModal = (app: Appointment) => {
    setEditingAppointment(app);
    setIsModalOpen(true);
  };

  const handleSaveAppointment = (payload: Omit<Appointment, 'id'>) => {
    if (editingAppointment) {
      updateAppointment(editingAppointment.id, payload);
    } else {
      addAppointment(payload);
    }
  };

  const handleDeleteAppointment = (app: Appointment) => {
    if (window.confirm(`Termin "${app.title}" wirklich löschen?`)) {
      deleteAppointment(app.id);
    }
  };

  // Modal handlers - Chores
  const openAddChoreModal = (dateStr?: string) => {
    setEditingChore(null);
    setDefaultChoreDate(dateStr || format(selectedDay, 'yyyy-MM-dd'));
    setIsChoreModalOpen(true);
  };

  const openEditChoreModal = (chore: Chore) => {
    setEditingChore(chore);
    setIsChoreModalOpen(true);
  };

  const handleSaveChore = (data: {
    title: string;
    assignedMemberId: string;
    frequency: Chore['frequency'];
    stars: number;
    assignedMemberIds: string[];
    dueDate?: string;
  }) => {
    if (editingChore) {
      updateChore(editingChore.id, data);
    } else {
      addChore(
        data.title,
        data.assignedMemberId,
        data.frequency,
        data.stars,
        data.assignedMemberIds,
        data.dueDate
      );
    }
  };

  const handleDeleteChore = (chore: Chore) => {
    if (window.confirm(`Aufgabe "${chore.title}" wirklich löschen?`)) {
      deleteChore(chore.id);
    }
  };

  // Month Grid Interval Calculation
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header & Controls */}
      <CalendarHeader
        currentDate={currentDate}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onPrevPeriod={prevPeriod}
        onNextPeriod={nextPeriod}
        onGoToToday={goToToday}
        onExportICal={handleExportICal}
        onOpenAddAppointment={() => openAddAppointmentModal()}
        onOpenAddChore={() => openAddChoreModal()}
        appointmentCount={filteredAppointments.length}
        choreCount={relevantChores.length}
        selectedCategory={selectedCategory}
        icalExportToast={icalExportToast}
        onDismissToast={() => setIcalExportToast(null)}
      />

      {/* Filter Bar */}
      <CalendarFilterBar
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        currentMemberId={currentMemberId}
        members={members}
      />

      {/* View Mode: Month */}
      {viewMode === 'month' && (
        <>
          {/* Mobile View: Week Strip + Selected Day Schedule */}
          <div className="sm:hidden space-y-4">
            <CalendarWeekStrip
              selectedDay={selectedDay}
              onSelectDay={(day) => {
                setSelectedDay(day);
                if (!isSameMonth(day, currentDate)) setCurrentDate(day);
              }}
              onPrevWeek={prevWeek}
              onNextWeek={nextWeek}
              getDayAppointments={getDayAppointments}
              getDayChores={getDayChores}
            />
            <CalendarDayDetails
              selectedDay={selectedDay}
              selectedCategory={selectedCategory}
              appointments={selectedDayAppointments}
              chores={getDayChores(selectedDay)}
              members={members}
              conflicts={selectedDayConflicts}
              onOpenAddAppointment={openAddAppointmentModal}
              onOpenAddChore={openAddChoreModal}
              onEditAppointment={openEditAppointmentModal}
              onToggleChore={handleChoreToggle}
              onEditChore={openEditChoreModal}
              onDeleteChore={handleDeleteChore}
              isMobile={true}
            />
          </div>

          {/* Desktop View: Month Grid + Selected Day Details */}
          <div className="hidden sm:block space-y-4">
            <CalendarMonthGrid
              currentDate={currentDate}
              selectedDay={selectedDay}
              calendarDays={calendarDays}
              members={members}
              getDayAppointments={getDayAppointments}
              getDayChores={getDayChores}
              onSelectDay={setSelectedDay}
              onOpenAddAppointment={openAddAppointmentModal}
              onOpenAddChore={openAddChoreModal}
              onOpenEditAppointment={openEditAppointmentModal}
              onToggleChore={handleChoreToggle}
            />
            <CalendarDayDetails
              selectedDay={selectedDay}
              selectedCategory={selectedCategory}
              appointments={selectedDayAppointments}
              chores={getDayChores(selectedDay)}
              members={members}
              conflicts={selectedDayConflicts}
              onOpenAddAppointment={openAddAppointmentModal}
              onOpenAddChore={openAddChoreModal}
              onEditAppointment={openEditAppointmentModal}
              onToggleChore={handleChoreToggle}
              onEditChore={openEditChoreModal}
              onDeleteChore={handleDeleteChore}
              isMobile={false}
            />
          </div>
        </>
      )}

      {/* View Mode: Agenda */}
      {viewMode === 'agenda' && (
        <CalendarAgendaView
          selectedCategory={selectedCategory}
          filteredAppointments={filteredAppointments}
          relevantChores={relevantChores}
          members={members}
          onOpenAddChore={() => openAddChoreModal()}
          onEditAppointment={openEditAppointmentModal}
          onDeleteAppointment={handleDeleteAppointment}
          onToggleChore={handleChoreToggle}
          onEditChore={openEditChoreModal}
          onDeleteChore={handleDeleteChore}
        />
      )}

      {/* Appointment Modal */}
      <AppointmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingAppointment={editingAppointment}
        defaultDate={defaultModalDate}
        members={members}
        currentMemberId={currentMemberId}
        loggedInMemberId={loggedInMemberId}
        onSave={handleSaveAppointment}
      />

      {/* Chore Modal */}
      <CalendarChoreModal
        isOpen={isChoreModalOpen}
        onClose={() => setIsChoreModalOpen(false)}
        editingChore={editingChore}
        defaultDate={defaultChoreDate}
        members={members}
        onSave={handleSaveChore}
      />

      {/* Claim Chore Modal */}
      {claimingChore && (
        <CalendarClaimModal
          claimingChore={claimingChore}
          onClose={() => setClaimingChore(null)}
          onClaim={(choreId, memberId) => toggleChore(choreId, memberId)}
          eligibleClaimants={getEligibleClaimants(claimingChore)}
        />
      )}
    </div>
  );
};
