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

export interface CalendarSticker {
  id: string;
  emoji: string;
  label: string;
  category: 'sports' | 'music' | 'school' | 'health' | 'celebration' | 'routine';
  bgGradient: string;
}

export type FamilySticker = CalendarSticker;

export const STICKER_CATEGORIES: Array<{
  id: CalendarSticker['category'];
  label: string;
  icon: string;
}> = [
  { id: 'sports', label: 'Sport & Action', icon: '🏆' },
  { id: 'music', label: 'Musik & Kunst', icon: '🎵' },
  { id: 'school', label: 'Schule & Bildung', icon: '🏫' },
  { id: 'health', label: 'Gesundheit', icon: '🩺' },
  { id: 'celebration', label: 'Feiern & Freizeit', icon: '🎉' },
  { id: 'routine', label: 'Alltag & Familie', icon: '🏡' },
];

export const CALENDAR_STICKERS: CalendarSticker[] = [
  // Sport & Action
  { id: 'football', emoji: '⚽', label: 'Fußball', category: 'sports', bgGradient: 'from-amber-400 to-orange-500' },
  { id: 'swim', emoji: '🏊', label: 'Schwimmen', category: 'sports', bgGradient: 'from-cyan-400 to-blue-500' },
  { id: 'ballet', emoji: '🩰', label: 'Ballett / Tanz', category: 'sports', bgGradient: 'from-pink-400 to-rose-500' },
  { id: 'martial_arts', emoji: '🥋', label: 'Karate / Kampfsport', category: 'sports', bgGradient: 'from-red-500 to-amber-600' },
  { id: 'tennis', emoji: '🎾', label: 'Tennis', category: 'sports', bgGradient: 'from-lime-400 to-emerald-500' },
  { id: 'bike', emoji: '🚲', label: 'Radfahren / Radtour', category: 'sports', bgGradient: 'from-emerald-400 to-teal-500' },
  { id: 'run', emoji: '🏃', label: 'Leichtathletik / Turnen', category: 'sports', bgGradient: 'from-orange-400 to-amber-500' },
  { id: 'skate', emoji: '🛹', label: 'Skateboard', category: 'sports', bgGradient: 'from-purple-400 to-indigo-500' },
  { id: 'ski', emoji: '🎿', label: 'Ski & Winter', category: 'sports', bgGradient: 'from-sky-300 to-blue-600' },
  { id: 'basketball', emoji: '🏀', label: 'Basketball', category: 'sports', bgGradient: 'from-amber-500 to-red-500' },
  { id: 'horse', emoji: '🏇', label: 'Reiten', category: 'sports', bgGradient: 'from-amber-600 to-stone-700' },

  // Musik & Kunst
  { id: 'piano', emoji: '🎹', label: 'Klavier', category: 'music', bgGradient: 'from-stone-700 to-stone-900' },
  { id: 'guitar', emoji: '🎸', label: 'Gitarre', category: 'music', bgGradient: 'from-amber-500 to-orange-600' },
  { id: 'drums', emoji: '🥁', label: 'Schlagzeug', category: 'music', bgGradient: 'from-rose-500 to-red-600' },
  { id: 'art', emoji: '🎨', label: 'Malen & Kunst', category: 'music', bgGradient: 'from-fuchsia-400 to-purple-600' },
  { id: 'theater', emoji: '🎭', label: 'Theater & Schauspiel', category: 'music', bgGradient: 'from-indigo-500 to-purple-600' },
  { id: 'sing', emoji: '🎤', label: 'Chor & Singen', category: 'music', bgGradient: 'from-rose-400 to-pink-600' },
  { id: 'trumpet', emoji: '🎺', label: 'Blasinstrument', category: 'music', bgGradient: 'from-yellow-400 to-amber-500' },
  { id: 'violin', emoji: '🎻', label: 'Geige', category: 'music', bgGradient: 'from-amber-700 to-stone-800' },

  // Schule & Bildung
  { id: 'schoolbag', emoji: '🎒', label: 'Schule & Kita', category: 'school', bgGradient: 'from-blue-400 to-indigo-600' },
  { id: 'homework', emoji: '📚', label: 'Lernen & Hausaufgaben', category: 'school', bgGradient: 'from-indigo-400 to-purple-500' },
  { id: 'science', emoji: '🧪', label: 'Forschen & Physik', category: 'school', bgGradient: 'from-emerald-400 to-teal-600' },
  { id: 'exam', emoji: '📝', label: 'Klausur & Prüfung', category: 'school', bgGradient: 'from-rose-400 to-red-500' },
  { id: 'computer', emoji: '💻', label: 'Computer & Coding', category: 'school', bgGradient: 'from-sky-400 to-blue-600' },
  { id: 'excursion', emoji: '🏫', label: 'Klassenfahrt & Wandertag', category: 'school', bgGradient: 'from-amber-400 to-yellow-500' },

  // Gesundheit
  { id: 'dentist', emoji: '🦷', label: 'Zahnarzt', category: 'health', bgGradient: 'from-cyan-400 to-blue-500' },
  { id: 'doctor', emoji: '🩺', label: 'Kinderarzt / Doktor', category: 'health', bgGradient: 'from-emerald-500 to-teal-600' },
  { id: 'vaccine', emoji: '💉', label: 'Impfung / Vorsorge', category: 'health', bgGradient: 'from-teal-400 to-emerald-600' },
  { id: 'medicine', emoji: '💊', label: 'Medikamente', category: 'health', bgGradient: 'from-rose-400 to-red-500' },
  { id: 'glasses', emoji: '👓', label: 'Augenarzt', category: 'health', bgGradient: 'from-blue-400 to-indigo-500' },
  { id: 'bandage', emoji: '🩹', label: 'Verband & Kontrolle', category: 'health', bgGradient: 'from-amber-400 to-orange-500' },

  // Feiern & Freizeit
  { id: 'birthday', emoji: '🎂', label: 'Geburtstag', category: 'celebration', bgGradient: 'from-pink-400 to-rose-500' },
  { id: 'party', emoji: '🎈', label: 'Party & Feier', category: 'celebration', bgGradient: 'from-purple-400 to-fuchsia-500' },
  { id: 'pizza', emoji: '🍕', label: 'Pizzaabend', category: 'celebration', bgGradient: 'from-amber-500 to-red-500' },
  { id: 'movie', emoji: '🎬', label: 'Filmabend & Kino', category: 'celebration', bgGradient: 'from-indigo-500 to-purple-700' },
  { id: 'camp', emoji: '🏕️', label: 'Ausflug & Zelten', category: 'celebration', bgGradient: 'from-emerald-500 to-teal-700' },
  { id: 'park', emoji: '🌳', label: 'Spielplatz & Park', category: 'celebration', bgGradient: 'from-green-400 to-emerald-600' },
  { id: 'beach', emoji: '🏖️', label: 'Urlaub & Strand', category: 'celebration', bgGradient: 'from-amber-300 to-yellow-500' },
  { id: 'icecream', emoji: '🍦', label: 'Eis essen gehen', category: 'celebration', bgGradient: 'from-pink-300 to-rose-400' },

  // Alltag & Familie
  { id: 'carpool', emoji: '🚗', label: 'Fahrgemeinschaft', category: 'routine', bgGradient: 'from-blue-500 to-indigo-600' },
  { id: 'shopping', emoji: '🛒', label: 'Großeinkauf', category: 'routine', bgGradient: 'from-emerald-500 to-green-600' },
  { id: 'pet', emoji: '🐕', label: 'Hund / Haustiere', category: 'routine', bgGradient: 'from-amber-500 to-orange-600' },
  { id: 'haircut', emoji: '💇', label: 'Friseur', category: 'routine', bgGradient: 'from-purple-400 to-pink-500' },
  { id: 'clean', emoji: '🧹', label: 'Großputz / Ordnung', category: 'routine', bgGradient: 'from-teal-400 to-cyan-600' },
  { id: 'sleepover', emoji: '😴', label: 'Übernachtungsparty', category: 'routine', bgGradient: 'from-indigo-400 to-purple-600' },
  { id: 'garden', emoji: '🌿', label: 'Garten & Pflanzen', category: 'routine', bgGradient: 'from-emerald-400 to-green-600' },
];

export const FAMILY_STICKERS = CALENDAR_STICKERS;

/**
 * Helper to detect or suggest a sticker icon from appointment title or category.
 */
export function detectStickerFromTitle(title: string, category?: string): string {
  const t = (title || '').toLowerCase();

  // Sports
  if (t.includes('fußball') || t.includes('fussball') || t.includes('bolzen') || t.includes('soccer')) return '⚽';
  if (t.includes('schwimm') || t.includes('pool') || t.includes('hallenbad') || t.includes('seepferdchen')) return '🏊';
  if (t.includes('ballett') || t.includes('tanz') || t.includes('dance')) return '🩰';
  if (t.includes('karate') || t.includes('judo') || t.includes('taekwondo') || t.includes('kampfsport') || t.includes('budo')) return '🥋';
  if (t.includes('tennis')) return '🎾';
  if (t.includes('fahrrad') || t.includes('radtour') || t.includes('bike')) return '🚲';
  if (t.includes('turnen') || t.includes('leichtathletik') || t.includes('joggen') || t.includes('lauf')) return '🏃';
  if (t.includes('skate') || t.includes('roller')) return '🛹';
  if (t.includes('ski') || t.includes('snowboard') || t.includes('schlitten')) return '🎿';
  if (t.includes('basketball')) return '🏀';
  if (t.includes('reiten') || t.includes('pferd') || t.includes('pony')) return '🏇';

  // Music
  if (t.includes('klavier') || t.includes('piano')) return '🎹';
  if (t.includes('gitarre') || t.includes('guitar')) return '🎸';
  if (t.includes('schlagzeug') || t.includes('drums')) return '🥁';
  if (t.includes('malen') || t.includes('kunst') || t.includes('töpfern') || t.includes('basteln')) return '🎨';
  if (t.includes('theater') || t.includes('schauspiel') || t.includes('musical')) return '🎭';
  if (t.includes('chor') || t.includes('gesang') || t.includes('singen')) return '🎤';
  if (t.includes('flöte') || t.includes('trompete') || t.includes('saxophon')) return '🎺';
  if (t.includes('geige') || t.includes('violine') || t.includes('cello')) return '🎻';

  // School
  if (t.includes('schule') || t.includes('unterricht') || t.includes('ranzen') || t.includes('kita') || t.includes('kindergarten')) return '🎒';
  if (t.includes('hausaufgabe') || t.includes('lernen') || t.includes('nachhilfe') || t.includes('bibliothek')) return '📚';
  if (t.includes('klausur') || t.includes('prüfung') || t.includes('test') || t.includes('arbeit')) return '📝';
  if (t.includes('coding') || t.includes('computer') || t.includes('programmieren')) return '💻';
  if (t.includes('wandertag') || t.includes('ausflug') || t.includes('schulfest')) return '🏫';

  // Health
  if (t.includes('zahn') || t.includes('dentist') || t.includes('spange') || t.includes('kiefer')) return '🦷';
  if (t.includes('arzt') || t.includes('doktor') || t.includes('kinderarzt') || t.includes('praxis') || t.includes('u-untersuchung') || t.includes('kontrolle')) return '🩺';
  if (t.includes('impf') || t.includes('blut')) return '💉';
  if (t.includes('medikament') || t.includes('apotheke')) return '💊';
  if (t.includes('augenarzt') || t.includes('brille') || t.includes('optiker')) return '👓';

  // Celebration & Fun
  if (t.includes('geburtstag') || t.includes('birthday') || t.includes('bday')) return '🎂';
  if (t.includes('party') || t.includes('feier') || t.includes('fest') || t.includes('grill') || t.includes('bbq')) return '🎈';
  if (t.includes('pizza') || t.includes('restaurant') || t.includes('döner') || t.includes('burger') || t.includes('essen gehen')) return '🍕';
  if (t.includes('kino') || t.includes('film') || t.includes('movie') || t.includes('netflix')) return '🎬';
  if (t.includes('camping') || t.includes('zelten') || t.includes('wandern')) return '🏕️';
  if (t.includes('spielplatz') || t.includes('park') || t.includes('zoo') || t.includes('tierpark')) return '🌳';
  if (t.includes('urlaub') || t.includes('strand') || t.includes('ferien') || t.includes('reise') || t.includes('flug')) return '🏖️';
  if (t.includes('eis') || t.includes('eisdiele')) return '🍦';

  // Routine
  if (t.includes('friseur') || t.includes('haare')) return '💇';
  if (t.includes('hund') || t.includes('katze') || t.includes('tierarzt') || t.includes('gassi') || t.includes('haustier')) return '🐕';
  if (t.includes('einkauf') || t.includes('supermarkt') || t.includes('rewe') || t.includes('aldi') || t.includes('edeka') || t.includes('dm')) return '🛒';
  if (t.includes('übernacht') || t.includes('pyjama') || t.includes('schlafen bei')) return '😴';
  if (t.includes('garten') || t.includes('rasen') || t.includes('beet')) return '🌿';
  if (t.includes('fahrt') || t.includes('abholen') || t.includes('bringen') || t.includes('carpool') || t.includes('mitfahr')) return '🚗';

  // Category fallback
  if (category && CATEGORY_CONFIG[category as AppointmentCategory]) {
    return CATEGORY_CONFIG[category as AppointmentCategory].icon;
  }

  return '⭐';
}
