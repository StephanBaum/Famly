import { Appointment, CarpoolDetails, CarpoolRider } from '../types';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

/**
 * Generates a clean, friendly share code for a carpool (e.g. c_7x92)
 */
export function generateCarpoolShareCode(appointmentId: string): string {
  const shortId = appointmentId.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toLowerCase();
  const randomSuffix = Math.random().toString(36).substring(2, 5);
  return `c_${shortId || 'ride'}_${randomSuffix}`;
}

/**
 * Builds the WhatsApp share message and zero-login URL
 */
export function buildCarpoolShareDetails(
  appointment: Appointment,
  familyName: string = 'Baum'
): { message: string; shareUrl: string; whatsAppUrl: string } {
  const shareCode = appointment.carpool?.shareCode || appointment.id;
  const baseUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}`
    : 'https://famly.app/';

  const shareUrl = `${baseUrl}#carpool=${shareCode}`;

  let formattedDate = appointment.date;
  try {
    formattedDate = format(new Date(appointment.date + 'T00:00:00'), 'EEEE, d. MMMM', { locale: de });
  } catch {}

  const driver = appointment.carpool?.driverName || 'Wir';
  const total = appointment.carpool?.totalSeats || 3;
  const taken = appointment.carpool?.riders.length || 0;
  const openSeats = Math.max(0, total - taken);

  const lines = [
    `🚗 *Fahrgemeinschaft mit Familie ${familyName}!*`,
    ``,
    `*${appointment.title}*`,
    `📅 ${formattedDate}`,
    `⏰ ${appointment.time} Uhr`,
    appointment.location ? `📍 Ort: ${appointment.location}` : '',
    appointment.carpool?.meetingPoint ? `📍 Treffpunkt: ${appointment.carpool.meetingPoint}` : '',
    ``,
    `Fahrer: *${driver}* • *${openSeats} ${openSeats === 1 ? 'Platz' : 'Plätze'} frei*`,
    ``,
    `Möchte dein Kind mitfahren? Tippe hier, um einen Platz zu reservieren (ohne App-Download / kein Login nötig):`,
    shareUrl,
  ].filter(Boolean);

  const message = lines.join('\n');
  const whatsAppUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;

  return { message, shareUrl, whatsAppUrl };
}

/**
 * Adds a rider to an appointment's carpool
 */
export function claimCarpoolSeat(
  appointment: Appointment,
  riderInput: { childName: string; parentName?: string; phone?: string; notes?: string }
): { updatedAppointment: Appointment; error?: string } {
  if (!appointment.carpool || !appointment.carpool.enabled) {
    return { updatedAppointment: appointment, error: 'Fahrgemeinschaft ist für diesen Termin nicht aktiv.' };
  }

  const currentRiders = appointment.carpool.riders || [];
  if (currentRiders.length >= appointment.carpool.totalSeats) {
    return { updatedAppointment: appointment, error: 'Leider sind bereits alle Plätze belegt!' };
  }

  const newRider: CarpoolRider = {
    id: `rider_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    childName: riderInput.childName.trim(),
    parentName: riderInput.parentName?.trim() || undefined,
    phone: riderInput.phone?.trim() || undefined,
    notes: riderInput.notes?.trim() || undefined,
    confirmedAt: Date.now(),
  };

  const updatedAppointment: Appointment = {
    ...appointment,
    carpool: {
      ...appointment.carpool,
      riders: [...currentRiders, newRider],
    },
  };

  return { updatedAppointment };
}

/**
 * Removes a rider from a carpool
 */
export function removeCarpoolRider(
  appointment: Appointment,
  riderId: string
): Appointment {
  if (!appointment.carpool) return appointment;

  return {
    ...appointment,
    carpool: {
      ...appointment.carpool,
      riders: appointment.carpool.riders.filter((r) => r.id !== riderId),
    },
  };
}

/**
 * Initializes or updates carpool configuration on an appointment
 */
export function configureCarpool(
  appointment: Appointment,
  config: {
    enabled: boolean;
    driverMemberId?: string;
    driverName: string;
    totalSeats: number;
    meetingPoint?: string;
    notes?: string;
  }
): Appointment {
  const existingCarpool = appointment.carpool;
  const shareCode = existingCarpool?.shareCode || generateCarpoolShareCode(appointment.id);
  const riders = existingCarpool?.riders || [];

  const updatedCarpool: CarpoolDetails = {
    enabled: config.enabled,
    driverMemberId: config.driverMemberId,
    driverName: config.driverName,
    totalSeats: Math.max(1, config.totalSeats),
    riders: config.enabled ? riders : [],
    shareCode,
    meetingPoint: config.meetingPoint,
    notes: config.notes,
  };

  return {
    ...appointment,
    carpool: updatedCarpool,
  };
}
