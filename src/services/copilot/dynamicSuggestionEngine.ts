import { CopilotFamilyData } from './copilotTypes';
import { format } from 'date-fns';
import { isAppointmentOnDate, detectAppointmentConflicts } from '../../types';

export interface DynamicSuggestion {
  id: string;
  icon: string;
  label: string;
  query: string;
  badge?: string;
  color: 'amber' | 'blue' | 'emerald' | 'rose' | 'purple';
}

/**
 * Inspects real-time household state and generates 3-4 context-aware dynamic suggestions.
 */
export function getSituationAwareSuggestions(data: CopilotFamilyData): DynamicSuggestion[] {
  const suggestions: DynamicSuggestion[] = [];
  const now = new Date();
  const currentHour = now.getHours();
  const todayStr = format(now, 'yyyy-MM-dd');

  const todayAppointments = data.appointments
    .filter((a) => isAppointmentOnDate(a, todayStr))
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  const conflicts = detectAppointmentConflicts(todayAppointments);
  const todayPlan = data.mealPlans.find((mp) => mp.date === todayStr);
  const openChores = data.chores.filter((c) => !c.completed);
  const uncheckedGroceries = data.groceries.filter((g) => !g.checked);
  const kids = data.members.filter((m) => m.isChild);

  // 1. Conflict Warning (Highest Priority)
  if (conflicts.size > 0) {
    const firstConflictAppId = Array.from(conflicts.keys())[0];
    const conflictingApp = todayAppointments.find((a) => a.id === firstConflictAppId);
    suggestions.push({
      id: 'conflict',
      icon: '⚠️',
      label: `Terminkonflikt bei "${conflictingApp?.title || 'heute'}" prüfen`,
      query: `Wir haben einen Terminkonflikt heute bei "${conflictingApp?.title}". Welche Termine überschneiden sich und wie können wir das lösen?`,
      badge: 'Dringend',
      color: 'rose',
    });
  }

  // 2. Upcoming Appointment in the Next 3 Hours
  const currentClockStr = format(now, 'HH:mm');
  const upcomingApp = todayAppointments.find((a) => a.time >= currentClockStr);
  if (upcomingApp) {
    suggestions.push({
      id: 'upcoming_app',
      icon: '🚗',
      label: `Fahrt zu "${upcomingApp.title}" (${upcomingApp.time} Uhr)`,
      query: `Wer fährt heute um ${upcomingApp.time} Uhr zu "${upcomingApp.title}"? Ist eine Fahrgemeinschaft organisiert?`,
      badge: 'Nächster Termin',
      color: 'blue',
    });
  }

  // 3. Time of Day & Meal Planning
  if (!todayPlan?.dinner?.title) {
    suggestions.push({
      id: 'dinner_missing',
      icon: '🍲',
      label: 'Was essen wir heute Abend?',
      query: 'Was essen wir heute Abend laut Essensplan? Bitte schlage ein passendes Rezept der Familie vor.',
      badge: 'Essensplan',
      color: 'amber',
    });
  } else if (currentHour >= 16 && currentHour <= 20) {
    suggestions.push({
      id: 'dinner_prep',
      icon: '👨‍🍳',
      label: `Rezept "${todayPlan.dinner.title}" anzeigen`,
      query: `Zeige mir die Zubereitung und Zutaten für das heutige Abendessen "${todayPlan.dinner.title}".`,
      badge: 'Abendessen',
      color: 'amber',
    });
  }

  // 4. Morning Rush Routine (06:00 - 10:00)
  if (currentHour >= 6 && currentHour < 10) {
    if (kids.length > 0) {
      const kidNames = kids.map((k) => k.name).join(' & ');
      suggestions.push({
        id: 'morning_routine',
        icon: '🎒',
        label: `Morgenroutine für ${kidNames} prüfen`,
        query: `Welche Aufgaben und Termine stehen heute für ${kidNames} an?`,
        badge: 'Schulstart',
        color: 'emerald',
      });
    }
  }

  // 5. Open Chores & Stars
  if (openChores.length > 0) {
    const topChore = openChores[0];
    suggestions.push({
      id: 'chore_check',
      icon: '⭐',
      label: `"${topChore.title}" erledigen (+${topChore.stars}★)`,
      query: `Wer ist zuständig für "${topChore.title}" und wie viele Sterne gibt es dafür?`,
      badge: 'Aufgabe',
      color: 'purple',
    });
  }

  // 6. Groceries
  if (uncheckedGroceries.length > 0 && suggestions.length < 4) {
    suggestions.push({
      id: 'groceries_check',
      icon: '🛒',
      label: `${uncheckedGroceries.length} Einkaufs-Artikel ansehen`,
      query: 'Welche Artikel stehen aktuell auf unserer Einkaufsliste?',
      badge: 'Einkauf',
      color: 'emerald',
    });
  }

  // 7. Weekend / Leisure Tips (Thursday - Sunday)
  const dayOfWeek = now.getDay();
  if ((dayOfWeek === 4 || dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0) && suggestions.length < 4) {
    suggestions.push({
      id: 'weekend_ideas',
      icon: '🎯',
      label: 'Ausflugsideen fürs Wochenende',
      query: 'Welche besonderen Familienausflüge oder Aktivitäten empfiehlst du uns für dieses Wochenende in unserer Region?',
      badge: 'Freizeit',
      color: 'blue',
    });
  }

  // Fallback defaults if list is too small
  if (suggestions.length < 3) {
    suggestions.push({
      id: 'today_overview',
      icon: '📅',
      label: 'Tagesübersicht & Termine',
      query: 'Was steht heute für die Familie an Terminen und Aufgaben an?',
      color: 'blue',
    });
    suggestions.push({
      id: 'star_ranking',
      icon: '🏆',
      label: 'Sternen-Rangliste der Kinder',
      query: 'Wer hat aktuell die meisten Sterne gesammelt und welche Belohnungen gibt es?',
      color: 'purple',
    });
  }

  return suggestions.slice(0, 4);
}
