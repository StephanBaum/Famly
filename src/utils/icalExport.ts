import { Appointment, FamilyMember, RecurrenceFrequency } from '../types';

/**
 * Maps JS getDay() number (0=Sun, 1=Mon, ..., 6=Sat) to iCal 2-letter code
 */
const DAY_MAP: Record<number, string> = {
  0: 'SU',
  1: 'MO',
  2: 'TU',
  3: 'WE',
  4: 'TH',
  5: 'FR',
  6: 'SA',
};

/**
 * Format Date to iCal UTC timestamp: YYYYMMDDTHHMMSSZ
 */
function formatICalDateTime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    date.getUTCFullYear() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    'T' +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    'Z'
  );
}

/**
 * Format local date and time string (YYYY-MM-DD + HH:MM) to iCal local string YYYYMMDDTHHMMSS
 */
function formatLocalICalDateTime(dateStr: string, timeStr: string): string {
  const cleanDate = dateStr.replace(/-/g, '');
  const [h, m] = (timeStr && timeStr.includes(':')) ? timeStr.split(':') : ['09', '00'];
  return `${cleanDate}T${h.padStart(2, '0')}${m.padStart(2, '0')}00`;
}

/**
 * Build recurrence RRULE string
 */
function buildRRule(recurrence?: RecurrenceFrequency, days?: number[], untilDate?: string): string | null {
  if (!recurrence || recurrence === 'none') return null;

  const parts: string[] = [];

  switch (recurrence) {
    case 'daily':
      parts.push('FREQ=DAILY');
      break;
    case 'weekly':
      parts.push('FREQ=WEEKLY');
      break;
    case 'biweekly':
      parts.push('FREQ=WEEKLY;INTERVAL=2');
      break;
    case 'monthly':
      parts.push('FREQ=MONTHLY');
      break;
  }

  if ((recurrence === 'weekly' || recurrence === 'biweekly') && days && days.length > 0) {
    const byDays = days.map((d) => DAY_MAP[d]).filter(Boolean).join(',');
    if (byDays) parts.push(`BYDAY=${byDays}`);
  }

  if (untilDate) {
    const cleanUntil = untilDate.replace(/-/g, '');
    parts.push(`UNTIL=${cleanUntil}T235959Z`);
  }

  return parts.join(';');
}

/**
 * Escapes characters for iCal text fields
 */
function escapeICalText(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Generates an RFC 5545 valid .ics calendar string
 */
export function generateICalendar(
  appointments: Appointment[],
  members: FamilyMember[],
  calendarName: string = 'Famly Kalender'
): string {
  const now = new Date();
  const dtstamp = formatICalDateTime(now);

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Famly Household//Famly Calendar v1.0//DE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeICalText(calendarName)}`,
    'X-WR-TIMEZONE:Europe/Berlin',
  ];

  for (const app of appointments) {
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${app.id}@famly.app`);
    lines.push(`DTSTAMP:${dtstamp}`);

    const isAllDay = !app.time || app.time === 'All Day' || !app.time.includes(':');

    if (isAllDay) {
      const cleanDate = app.date.replace(/-/g, '');
      lines.push(`DTSTART;VALUE=DATE:${cleanDate}`);
      // End date for all-day events in iCal is exclusive (next day)
      const startDate = new Date(app.date + 'T00:00:00');
      startDate.setDate(startDate.getDate() + 1);
      const pad = (n: number) => String(n).padStart(2, '0');
      const endDateStr = `${startDate.getFullYear()}${pad(startDate.getMonth() + 1)}${pad(startDate.getDate())}`;
      lines.push(`DTEND;VALUE=DATE:${endDateStr}`);
    } else {
      const startLocal = formatLocalICalDateTime(app.date, app.time);
      lines.push(`DTSTART:${startLocal}`);

      const [h, m] = app.time.split(':').map(Number);
      const durationMin = app.durationMinutes || 60;
      const startDateTime = new Date(`${app.date}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`);
      const endDateTime = new Date(startDateTime.getTime() + durationMin * 60 * 1000);
      const pad = (n: number) => String(n).padStart(2, '0');
      const endLocal = `${endDateTime.getFullYear()}${pad(endDateTime.getMonth() + 1)}${pad(endDateTime.getDate())}T${pad(endDateTime.getHours())}${pad(endDateTime.getMinutes())}00`;
      lines.push(`DTEND:${endLocal}`);
    }

    lines.push(`SUMMARY:${escapeICalText(app.title)}`);

    if (app.location) {
      lines.push(`LOCATION:${escapeICalText(app.location)}`);
    }

    // Attendees names
    const attendees = members
      .filter((m) => app.memberIds.includes(m.id))
      .map((m) => m.name)
      .join(', ');

    let description = '';
    if (attendees) description += `Familie: ${attendees}\n`;
    if (app.notes) description += `Notizen: ${app.notes}\n`;
    if (description) {
      lines.push(`DESCRIPTION:${escapeICalText(description.trim())}`);
    }

    if (app.category) {
      lines.push(`CATEGORIES:${escapeICalText(app.category.toUpperCase())}`);
    }

    // Recurrence Rule
    const rrule = buildRRule(app.recurrence, app.recurrenceDays, app.recurrenceEndDate);
    if (rrule) {
      lines.push(`RRULE:${rrule}`);
    }

    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');

  return lines.join('\r\n');
}

/**
 * Triggers a browser download of the generated .ics file
 */
export function downloadICalendarFile(
  appointments: Appointment[],
  members: FamilyMember[],
  calendarName: string = 'Famly Kalender',
  fileName: string = 'famly-kalender.ics'
): void {
  const icsContent = generateICalendar(appointments, members, calendarName);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
