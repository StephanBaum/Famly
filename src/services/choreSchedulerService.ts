import { Chore, Appointment, FamilyMember, isAppointmentOnDate } from '../types';
import { format, addDays } from 'date-fns';

export interface ChoreScheduleProposal {
  id: string; // unique proposal id
  chore: Chore;
  targetMember: FamilyMember;
  proposedDate: string; // YYYY-MM-DD
  proposedTime: string; // HH:mm
  durationMinutes: number;
  reason: string;
}

// Preferred standard time slots for chores
const PREFERRED_WEEKDAY_SLOTS = ['16:30', '17:15', '18:00', '15:45'];
const PREFERRED_WEEKEND_SLOTS = ['10:00', '11:00', '14:30', '16:00'];

/**
 * Checks if a member is free at a specific date and time for a given duration.
 */
function isMemberFreeAtSlot(
  memberId: string,
  dateStr: string,
  timeStr: string,
  durationMinutes: number,
  appointments: Appointment[]
): boolean {
  if (!timeStr || !timeStr.includes(':')) return true;
  const [slotH, slotM] = timeStr.split(':').map(Number);
  const slotStartMin = (slotH || 0) * 60 + (slotM || 0);
  const slotEndMin = slotStartMin + durationMinutes;

  const dayAppointments = (appointments || []).filter((a) => a && isAppointmentOnDate(a, dateStr));

  for (const app of dayAppointments) {
    if (!app) continue;
    if (app.memberIds && app.memberIds.length > 0 && !app.memberIds.includes(memberId)) {
      continue;
    }

    if (!app.time || app.time === 'All Day' || !app.time.includes(':')) {
      continue;
    }

    const [appH, appM] = app.time.split(':').map(Number);
    const appStartMin = (appH || 0) * 60 + (appM || 0);
    const appEndMin = appStartMin + (app.durationMinutes || 60);

    // Overlap condition
    if (slotStartMin < appEndMin && slotEndMin > appStartMin) {
      return false;
    }
  }

  return true;
}

/**
 * Generates proactive calendar scheduling proposals for uncompleted chores.
 */
export function generateChoreCalendarProposals(
  chores: Chore[] = [],
  appointments: Appointment[] = [],
  members: FamilyMember[] = [],
  daysAhead: number = 7
): ChoreScheduleProposal[] {
  const safeChores = Array.isArray(chores) ? chores : [];
  const safeAppointments = Array.isArray(appointments) ? appointments : [];
  const safeMembers = Array.isArray(members) ? members : [];

  const pendingChores = safeChores.filter((c) => c && !c.completed);
  if (pendingChores.length === 0 || safeMembers.length === 0) return [];

  // Check which chores already have a calendar appointment scheduled
  const existingChoreAppointmentTitles = new Set(
    safeAppointments
      .filter((a) => a && typeof a.title === 'string')
      .map((a) => a.title.toLowerCase())
  );

  const unscheduledChores = pendingChores.filter((chore) => {
    if (!chore || typeof chore.title !== 'string') return false;
    const norm = chore.title.toLowerCase();
    const hasExisting = Array.from(existingChoreAppointmentTitles).some(
      (t) => t.includes(norm) || norm.includes(t.replace('🧹', '').trim())
    );
    return !hasExisting;
  });

  const proposals: ChoreScheduleProposal[] = [];
  const today = new Date();

  // Track scheduled slots during this run to avoid proposing overlapping times
  const reservedSlots = new Set<string>();

  for (const chore of unscheduledChores) {
    // Determine assigned member or pick member with lowest chores / open
    let targetMember: FamilyMember | undefined;
    if (chore.assignedMemberId) {
      targetMember = safeMembers.find((m) => m && m.id === chore.assignedMemberId);
    } else if (chore.assignedMemberIds && chore.assignedMemberIds.length > 0) {
      targetMember = safeMembers.find((m) => chore.assignedMemberIds?.includes(m.id));
    }

    if (!targetMember) {
      // Pick first member or child if available
      targetMember = safeMembers.find((m) => m && m.isChild) || safeMembers[0];
    }

    if (!targetMember) continue;

    // Search upcoming days for a free slot
    let foundSlot: { dateStr: string; timeStr: string; reason: string } | null = null;

    for (let dayOffset = 0; dayOffset < daysAhead; dayOffset++) {
      const targetDate = addDays(today, dayOffset);
      const dateStr = format(targetDate, 'yyyy-MM-dd');
      const dayOfWeek = targetDate.getDay(); // 0 = Sun, 6 = Sat
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      const candidateTimes = isWeekend ? PREFERRED_WEEKEND_SLOTS : PREFERRED_WEEKDAY_SLOTS;

      for (const timeStr of candidateTimes) {
        const slotKey = `${targetMember.id}_${dateStr}_${timeStr}`;
        if (reservedSlots.has(slotKey)) continue;

        if (isMemberFreeAtSlot(targetMember.id, dateStr, timeStr, 30, safeAppointments)) {
          const dayName = dayOffset === 0 ? 'Heute' : dayOffset === 1 ? 'Morgen' : format(targetDate, 'EEEE');
          foundSlot = {
            dateStr,
            timeStr,
            reason: `${dayName} um ${timeStr} Uhr (kein Terminkonflikt für ${targetMember.name || 'Familie'})`,
          };
          reservedSlots.add(slotKey);
          break;
        }
      }

      if (foundSlot) break;
    }

    // Fallback if all preferred slots are occupied: next day 17:00
    if (!foundSlot) {
      const fallbackDate = format(addDays(today, 1), 'yyyy-MM-dd');
      foundSlot = {
        dateStr: fallbackDate,
        timeStr: '17:00',
        reason: `Morgen um 17:00 Uhr (Standard-Zeitfenster)`,
      };
    }

    proposals.push({
      id: `prop_${chore.id}_${foundSlot.dateStr}`,
      chore,
      targetMember,
      proposedDate: foundSlot.dateStr,
      proposedTime: foundSlot.timeStr,
      durationMinutes: 30,
      reason: foundSlot.reason,
    });
  }

  return proposals;
}
