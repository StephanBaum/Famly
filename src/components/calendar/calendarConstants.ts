import { AppointmentCategory } from '../../types';

export const CATEGORY_CONFIG: Record<
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
