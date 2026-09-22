import { Appointment } from '../types';

const NOTIFIED_STORAGE_KEY = 'famly_notified_appointments_v1';

/**
 * Checks if the browser / PWA supports native notifications.
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Current notification permission status.
 */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * Requests native permission to display notifications.
 * Triggered on user interaction (e.g. button click or reminder setup).
 */
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isNotificationSupported()) return 'unsupported';
  try {
    const perm = await Notification.requestPermission();
    return perm;
  } catch (err) {
    console.warn('Notification.requestPermission error:', err);
    return Notification.permission;
  }
}

/**
 * Synthesizes a gentle, pleasant 2-tone chime using Web Audio API
 * (no external audio file or internet required).
 */
export function playReminderChime(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Tone 1: 587.33 Hz (D5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Tone 2: 880 Hz (A5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.15);
    gain2.gain.setValueAtTime(0.25, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.6);
  } catch {
    // AudioContext blocked by browser policy until user interacts
  }
}

/**
 * Triggers a native system notification with sound, vibration, and badge.
 */
export async function sendDeviceNotification(
  title: string,
  options?: { body?: string; tag?: string }
): Promise<void> {
  // 1. Play chime
  playReminderChime();

  // 2. Vibrate on Android / Pixel
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([200, 100, 200]);
    } catch {
      // ignore
    }
  }

  // 3. Display system notification
  if (isNotificationSupported() && Notification.permission === 'granted') {
    try {
      // Try service worker registration first (preferred on Android PWA)
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg && reg.showNotification) {
          await reg.showNotification(title, {
            body: options?.body,
            icon: '/icon-192.svg',
            badge: '/icon-192.svg',
            tag: options?.tag,
            vibrate: [200, 100, 200],
          } as any);
          return;
        }
      }

      // Fallback to standard window Notification
      new Notification(title, {
        body: options?.body,
        icon: '/icon-192.svg',
        tag: options?.tag,
      });
    } catch (e) {
      console.warn('sendDeviceNotification failed:', e);
    }
  }
}

// Track notified appointments in localStorage to prevent repeat alerts
function getNotifiedRecord(): Record<string, number> {
  try {
    const raw = localStorage.getItem(NOTIFIED_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function markAppointmentNotified(id: string): void {
  try {
    const record = getNotifiedRecord();
    record[id] = Date.now();
    localStorage.setItem(NOTIFIED_STORAGE_KEY, JSON.stringify(record));
  } catch {
    // ignore
  }
}

/**
 * Checks upcoming appointments and triggers notifications for due reminders.
 */
export function checkUpcomingReminders(appointments: Appointment[]): void {
  if (!Array.isArray(appointments) || appointments.length === 0) return;

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const notified = getNotifiedRecord();

  for (const app of appointments) {
    if (app.date !== todayStr) continue;
    if (notified[app.id]) continue;

    const timeMatch = app.time.match(/^(\d{1,2}):(\d{2})$/);
    if (!timeMatch) continue;

    const appMinutes = parseInt(timeMatch[1], 10) * 60 + parseInt(timeMatch[2], 10);
    const diff = appMinutes - currentMinutes;

    // Alert if event is occurring in the next 10 minutes OR was due within the last 3 minutes
    if (diff >= -3 && diff <= 10) {
      markAppointmentNotified(app.id);

      const timeText = diff <= 0 ? 'Jetzt fällig!' : `In ${diff} Minuten (${app.time} Uhr)`;
      sendDeviceNotification(`🔔 Erinnerung: ${app.title}`, {
        body: `${timeText} • Famly Kalender`,
        tag: `famly_app_${app.id}`,
      });
    }
  }
}

/**
 * Starts a recurring background ticker in the browser session.
 * Checks reminders every 30 seconds and whenever the screen turns on / tab becomes active.
 */
export function initReminderScheduler(getAppointments: () => Appointment[]): () => void {
  if (typeof window === 'undefined') return () => {};

  const runCheck = () => {
    try {
      const appointments = getAppointments();
      checkUpcomingReminders(appointments);
    } catch (e) {
      console.warn('Reminder check failed:', e);
    }
  };

  // Run immediately
  runCheck();

  // Run on interval
  const intervalId = window.setInterval(runCheck, 30000);

  // Run on resume / tab visibility change (e.g. phone unlocked)
  const onVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      runCheck();
    }
  };
  document.addEventListener('visibilitychange', onVisibilityChange);

  return () => {
    window.clearInterval(intervalId);
    document.removeEventListener('visibilitychange', onVisibilityChange);
  };
}
