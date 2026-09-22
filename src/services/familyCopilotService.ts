import {
  FamilyMember,
  Appointment,
  Chore,
  Recipe,
  MealPlanDay,
  GroceryItem,
  PinnedNote,
  Reward,
  isAppointmentOnDate,
} from '../types';
import { getAIConfig, resolveGeminiFlashModel } from './aiRecipeService';
import { format, addDays } from 'date-fns';
import { de } from 'date-fns/locale';

export interface CopilotFamilyData {
  familyName: string;
  members: FamilyMember[];
  appointments: Appointment[];
  chores: Chore[];
  recipes: Recipe[];
  mealPlans: MealPlanDay[];
  groceries: GroceryItem[];
  notes?: PinnedNote[];
  rewards?: Reward[];
}

export function normalizeCopilotData(data?: Partial<CopilotFamilyData>): CopilotFamilyData {
  return {
    familyName: data?.familyName || 'Familie',
    members: Array.isArray(data?.members) ? data.members.filter(Boolean) : [],
    appointments: Array.isArray(data?.appointments) ? data.appointments.filter(Boolean) : [],
    chores: Array.isArray(data?.chores) ? data.chores.filter(Boolean) : [],
    recipes: Array.isArray(data?.recipes) ? data.recipes.filter(Boolean) : [],
    mealPlans: Array.isArray(data?.mealPlans) ? data.mealPlans.filter(Boolean) : [],
    groceries: Array.isArray(data?.groceries) ? data.groceries.filter(Boolean) : [],
    notes: Array.isArray(data?.notes) ? data.notes.filter(Boolean) : [],
    rewards: Array.isArray(data?.rewards) ? data.rewards.filter(Boolean) : [],
  };
}

export interface CopilotAction {
  type:
    | 'SCHEDULE_CHORE'
    | 'ADD_CHORE'
    | 'COMPLETE_CHORE'
    | 'DELETE_CHORE'
    | 'ADD_GROCERY'
    | 'CHECK_GROCERY'
    | 'DELETE_GROCERY'
    | 'CLEAR_CHECKED_GROCERIES'
    | 'ADD_ALWAYS_IN_STOCK'
    | 'SET_MEAL'
    | 'CLEAR_MEAL'
    | 'ADD_RECIPE_TO_GROCERIES'
    | 'ADD_RECIPE'
    | 'FAVORITE_RECIPE'
    | 'ADD_APPOINTMENT'
    | 'DELETE_APPOINTMENT'
    | 'ADD_NOTE'
    | 'DELETE_NOTE'
    | 'UPDATE_CHILD_DETAILS'
    | 'AWARD_STARS'
    | 'ADD_REWARD'
    | 'CLAIM_REWARD'
    | 'CLEAN_SHOPPING_LIST'
    | 'SET_MORNING_BRIEFING'
    | 'NAVIGATE';
  payload: any;
  description: string;
  autoExecuted?: boolean;
}

export interface CopilotResponse {
  text: string;
  actions?: CopilotAction[];
  source: 'ai' | 'local';
}

function normalizeDateStr(d?: string): string {
  if (!d) return '';
  return d.trim().split('T')[0];
}

function isSameDay(d1?: string, d2?: string): boolean {
  if (!d1 || !d2) return false;
  return normalizeDateStr(d1) === normalizeDateStr(d2);
}

/**
 * Builds a structured text snapshot of current family data for LLM context.
 */
function buildFamilyContextSummary(inputData: CopilotFamilyData): string {
  const data = normalizeCopilotData(inputData);
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const todayGerman = format(today, 'EEEE, d. MMMM yyyy', { locale: de });

  const membersSummary = data.members
    .map((m) => {
      let details = `${m.name} (${m.role}, ${m.stars || 0} Sterne, Serie: ${m.choreStreak || 0} Tage)`;
      if (m.childDetails?.allergies) details += `, Allergien: ${m.childDetails.allergies}`;
      if (m.childDetails?.clothingSize) details += `, Kleidergröße: ${m.childDetails.clothingSize}`;
      if (m.childDetails?.shoeSize) details += `, Schuhgröße: ${m.childDetails.shoeSize}`;
      if (m.birthday) details += `, Geburtstag: ${m.birthday}`;
      return ` - ${details}`;
    })
    .join('\n');

  // Today's appointments specifically
  const todayAppointments = data.appointments
    .filter((a) => isAppointmentOnDate(a, todayStr))
    .map((a) => {
      const memberNames = (a.memberIds || [])
        .map((id) => data.members.find((m) => m.id === id)?.name)
        .filter(Boolean)
        .join(', ');
      return ` - ${a.time || 'Ganztägig'}: ${a.title} (${memberNames || 'Alle'})`;
    })
    .join('\n');

  // Next 7 days appointments
  const upcomingAppointments = data.appointments
    .filter((a) => {
      for (let i = 0; i < 7; i++) {
        const dStr = format(addDays(today, i), 'yyyy-MM-dd');
        if (isAppointmentOnDate(a, dStr)) return true;
      }
      return false;
    })
    .slice(0, 15)
    .map((a) => {
      const memberNames = (a.memberIds || [])
        .map((id) => data.members.find((m) => m.id === id)?.name)
        .filter(Boolean)
        .join(', ');
      return ` - ${a.date} ${a.time}: ${a.title} (${memberNames || 'Alle'})`;
    })
    .join('\n');

  // Today's meal plan specifically
  const todayPlan = data.mealPlans.find((mp) => mp && isSameDay(mp.date, todayStr));
  const todayMealsList: string[] = [];
  if (todayPlan?.dinner?.title) todayMealsList.push(`Abendessen: "${todayPlan.dinner.title}"`);
  if (todayPlan?.lunch?.title) todayMealsList.push(`Mittagessen: "${todayPlan.lunch.title}"`);
  if (todayPlan?.breakfast?.title) todayMealsList.push(`Frühstück: "${todayPlan.breakfast.title}"`);

  const todayMealsSummary = todayMealsList.length > 0
    ? `BEREITS EINGETRAGEN FÜR HEUTE: ${todayMealsList.join(' | ')} (Bestätige dieses Gericht und behaupte keinesfalls, dass noch nichts geplant sei!)`
    : 'Noch kein Gericht eingetragen (Tag ist frei)';

  // All recorded meals in the entire system so the model has 100% full visibility
  const allRecordedMeals = data.mealPlans
    .filter((mp) => mp && (mp.breakfast?.title || mp.lunch?.title || mp.dinner?.title))
    .map((mp) => {
      const parts: string[] = [];
      if (mp.dinner?.title) parts.push(`Abendessen: "${mp.dinner.title}"`);
      if (mp.lunch?.title) parts.push(`Mittagessen: "${mp.lunch.title}"`);
      if (mp.breakfast?.title) parts.push(`Frühstück: "${mp.breakfast.title}"`);
      const isToday = isSameDay(mp.date, todayStr);
      return ` - Datum ${normalizeDateStr(mp.date)}${isToday ? ' (HEUTE!)' : ''}: ${parts.join(' | ')}`;
    })
    .join('\n');

  // Meal plans for the next 7 days anchored strictly on TODAY
  const upcomingMealPlans = Array.from({ length: 7 }, (_, i) => {
    const targetDate = addDays(today, i);
    const dStr = format(targetDate, 'yyyy-MM-dd');
    const dayLabel = i === 0
      ? `Heute (${format(targetDate, 'EEEE', { locale: de })})`
      : i === 1
        ? `Morgen (${format(targetDate, 'EEEE', { locale: de })})`
        : format(targetDate, 'EEEE, d. MMM', { locale: de });
    const mp = data.mealPlans.find((p) => p && isSameDay(p.date, dStr));
    const meals: string[] = [];
    if (mp?.dinner?.title) meals.push(`Abendessen: "${mp.dinner.title}"`);
    if (mp?.lunch?.title) meals.push(`Mittagessen: "${mp.lunch.title}"`);
    if (mp?.breakfast?.title) meals.push(`Frühstück: "${mp.breakfast.title}"`);
    return ` - ${dayLabel} [${dStr}]: ${meals.length > 0 ? meals.join(' | ') : 'Noch nichts eingetragen (Frei)'}`;
  }).join('\n');

  // Available recipes from family cookbook
  const recipesSummary = (data.recipes || [])
    .slice(0, 15)
    .map((r) => ` - ID "${r.id}": "${r.title}" (${r.prepTime || '25 Min'}${r.isFavorite ? ', Beliebt ⭐' : ''})`)
    .join('\n');

  // Open chores
  const openChores = data.chores
    .filter((c) => !c.completed)
    .map((c) => {
      const assigned = data.members.find((m) => m.id === c.assignedMemberId)?.name || 'Offen für alle';
      return ` - ${c.title} (${c.stars} Sterne, Zuständig: ${assigned}${c.dueDate ? `, Fällig: ${c.dueDate}` : ''})`;
    })
    .join('\n');

  // Groceries needing purchase
  const uncheckedGroceries = data.groceries
    .filter((g) => !g.checked)
    .slice(0, 15)
    .map((g) => ` - ${g.name}${g.amount ? ` (${g.amount})` : ''} [${g.store}]`)
    .join('\n');

  const tomorrow = addDays(today, 1);
  const tomorrowStr = format(tomorrow, 'yyyy-MM-dd');
  const tomorrowGerman = format(tomorrow, 'EEEE, d. MMMM yyyy', { locale: de });
  const dayAfterTomorrow = addDays(today, 2);
  const dayAfterTomorrowStr = format(dayAfterTomorrow, 'yyyy-MM-dd');

  // Pinned Notes & Notice board
  const notesSummary = (data.notes || [])
    .map((n) => ` - [${n.tag.toUpperCase()}] "${n.title}": ${n.content}`)
    .join('\n');

  // Rewards catalog
  const rewardsSummary = (data.rewards || [])
    .map((r) => ` - ${r.icon} "${r.title}" (${r.starsCost} ⭐)`)
    .join('\n');

  return `
HEUTIGES DATUM: ${todayGerman} (${todayStr})
MORGEN IST: ${tomorrowGerman} (${tomorrowStr})
ÜBERMORGEN IST: ${dayAfterTomorrowStr}
FAMILIE: ${data.familyName}

MITGLIEDER:
${membersSummary || 'Keine Mitglieder'}

HEUTIGER ESSENSPLAN (SEHR WICHTIG - BEREITS EINGETRAGENES GERICHT BEACHTEN!):
${todayMealsSummary}

ALLE IM SYSTEM HINTERLEGTEN MAHLZEITEN:
${allRecordedMeals || 'Noch keine Mahlzeiten im System eingetragen'}

HEUTIGE TERMINE:
${todayAppointments || 'Keine Termine heute eingetragen'}

ESSENSPLAN DER NÄCHSTEN 7 TAGE:
${upcomingMealPlans}

BELIEBTE REZEPTE DER FAMILIE (FÜR NEUE VORSCHLÄGE):
${recipesSummary || 'Keine Rezepte hinterlegt'}

TERMINE DIESE WOCHE:
${upcomingAppointments || 'Keine anstehenden Termine'}

OFFENE AUFGABEN:
${openChores || 'Alle Aufgaben erledigt!'}

EINKAUFSLISTE (OFFEN):
${uncheckedGroceries || 'Einkaufsliste ist leer'}

SCHWARZES BRETT & NOTIZEN:
${notesSummary || 'Keine Notizen angeheftet'}

BELOHNUNGS-KATALOG:
${rewardsSummary || 'Keine Belohnungen hinterlegt'}
`.trim();
}

/**
 * Intelligent Local Fallback Engine
 * Answers queries instantly without requiring API keys or internet.
 */
export function queryLocalFamilyAssistant(
  query: string,
  inputData: CopilotFamilyData
): CopilotResponse {
  const data = normalizeCopilotData(inputData);
  const q = query.toLowerCase().trim();
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const tomorrowStr = format(addDays(today, 1), 'yyyy-MM-dd');

  // 0. Reminder & Appointment Creation Intent
  const isReminderIntent =
    q.includes('reminder') ||
    q.includes('erinner') ||
    q.includes('reinstellen') ||
    q.includes('merk dir') ||
    q.includes('nicht vergessen') ||
    (q.includes('termin') && (q.includes('eintragen') || q.includes('anlegen') || q.includes('erstellen') || q.includes('planen') || q.includes('reinstellen') || q.includes('setzen') || q.includes('mach'))) ||
    (q.includes('mitnehm') && (q.includes('tasche') || q.includes('morgen') || q.includes('denk')));

  if (isReminderIntent) {
    const targetDate = q.includes('übermorgen')
      ? format(addDays(today, 2), 'yyyy-MM-dd')
      : q.includes('morgen')
      ? tomorrowStr
      : todayStr;

    const timeMatch = q.match(/(\d{1,2})[:.](\d{2})/);
    const hourMatch = q.match(/(\d{1,2})\s*uhr/);
    let time = '08:00';
    if (timeMatch) {
      time = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
    } else if (hourMatch) {
      time = `${hourMatch[1].padStart(2, '0')}:00`;
    } else if (q.includes('früh') || q.includes('morgens')) {
      time = '07:30';
    } else if (q.includes('vormittag')) {
      time = '10:00';
    } else if (q.includes('mittag')) {
      time = '12:30';
    } else if (q.includes('nachmittag')) {
      time = '15:00';
    } else if (q.includes('abend')) {
      time = '18:30';
    }

    let cleanTitle = query
      .replace(/kannst du mir/gi, '')
      .replace(/kannst du/gi, '')
      .replace(/bitte/gi, '')
      .replace(/für übermorgen früh/gi, '')
      .replace(/für übermorgen/gi, '')
      .replace(/für morgen früh/gi, '')
      .replace(/für morgen/gi, '')
      .replace(/für heute früh/gi, '')
      .replace(/für heute/gi, '')
      .replace(/morgen früh/gi, '')
      .replace(/morgen abend/gi, '')
      .replace(/morgen/gi, '')
      .replace(/heute früh/gi, '')
      .replace(/heute/gi, '')
      .replace(/einen reminder/gi, '')
      .replace(/nen reminder/gi, '')
      .replace(/einen termin/gi, '')
      .replace(/nen termin/gi, '')
      .replace(/termin/gi, '')
      .replace(/reminder/gi, '')
      .replace(/reinstellen/gi, '')
      .replace(/einstellen/gi, '')
      .replace(/anlegen/gi, '')
      .replace(/eintragen/gi, '')
      .replace(/erinnere mich/gi, '')
      .replace(/erinner mich/gi, '')
      .replace(/daran dass ich/gi, '')
      .replace(/daran das ich/gi, '')
      .replace(/dass ich/gi, '')
      .replace(/das ich/gi, '')
      .replace(/daran/gi, '')
      .replace(/an/gi, '')
      .replace(/um \d{1,2}([:.]\d{2})?(\s*uhr)?/gi, '')
      .replace(/[?!.]/g, '')
      .trim();

    if (cleanTitle.toLowerCase().includes('tasche') && cleanTitle.toLowerCase().includes('mitnehm')) {
      cleanTitle = 'Tasche mitnehmen';
    }

    if (!cleanTitle || cleanTitle.length < 2) {
      cleanTitle = 'Erinnerung';
    } else {
      cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);
    }

    const dateLabel = targetDate === tomorrowStr ? 'morgen' : targetDate === todayStr ? 'heute' : targetDate;
    return {
      text: `Alles klar! Ich habe dir für ${dateLabel} um ${time} Uhr die Erinnerung **"${cleanTitle}"** direkt in den Kalender eingetragen! 📅`,
      actions: [
        {
          type: 'ADD_APPOINTMENT',
          description: `Erinnerung "${cleanTitle}" (${dateLabel === 'morgen' ? 'Morgen' : dateLabel === 'heute' ? 'Heute' : dateLabel}, ${time} Uhr)`,
          payload: {
            title: cleanTitle,
            date: targetDate,
            time,
            notes: 'Erinnerung vom Famly-Assistenten',
          },
        },
      ],
      source: 'local',
    };
  }

  // 1. Meal planning query
  if (
    q.includes('essen') ||
    q.includes('kochen') ||
    q.includes('abendessen') ||
    q.includes('mittagessen') ||
    q.includes('speiseplan') ||
    q.includes('essensplan')
  ) {
    const todayPlan = data.mealPlans.find((mp) => mp.date === todayStr);
    const tomorrowPlan = data.mealPlans.find((mp) => mp.date === tomorrowStr);

    let text = '';
    const actions: CopilotAction[] = [];

    if (q.includes('morgen')) {
      if (tomorrowPlan?.dinner?.title) {
        text = `Morgen steht laut Essensplan **${tomorrowPlan.dinner.title}** für das Abendessen an! 🍽️`;
      } else {
        text = `Für morgen ist im Essensplan noch kein Abendessen eingetragen.`;
        const candidate = data.recipes[0];
        if (candidate) {
          text += ` Wie wäre es mit **${candidate.title}** (${candidate.prepTime})?`;
          actions.push({
            type: 'SET_MEAL',
            description: `"${candidate.title}" für morgen eintragen`,
            payload: { date: tomorrowStr, slot: 'dinner', title: candidate.title, recipeId: candidate.id },
          });
        }
      }
    } else {
      if (todayPlan?.dinner?.title) {
        text = `Heute steht laut eurem Essensplan **${todayPlan.dinner.title}** auf dem Tisch! 🍲`;
        if (todayPlan.lunch?.title) {
          text += ` Mittags gibt es außerdem: *${todayPlan.lunch.title}*.`;
        }
      } else {
        text = `Für heute Abend ist im Essensplan noch nichts fest eingetragen.`;
        const favorite = data.recipes.find((r) => r.isFavorite) || data.recipes[0];
        if (favorite) {
          text += ` Ein schnelles Familienrezept: **${favorite.title}** (Zubereitung: ${favorite.prepTime}).`;
          actions.push({
            type: 'SET_MEAL',
            description: `"${favorite.title}" als heutiges Abendessen eintragen`,
            payload: { date: todayStr, slot: 'dinner', title: favorite.title, recipeId: favorite.id },
          });
        }
      }
    }

    return { text, actions: actions.length > 0 ? actions : undefined, source: 'local' };
  }

  // 2. Chores to calendar query or open chores
  if (
    q.includes('aufgabe') ||
    q.includes('chore') ||
    q.includes('planen') ||
    q.includes('putzen') ||
    q.includes('aufräumen') ||
    q.includes('kalender') && (q.includes('eintragen') || q.includes('plan'))
  ) {
    const openChores = data.chores.filter((c) => !c.completed);
    if (openChores.length === 0) {
      return {
        text: 'Super Nachricht: Aktuell sind alle Aufgaben erledigt! Niemand muss heute putzen oder aufräumen. 🎉',
        source: 'local',
      };
    }

    const firstChore = openChores[0];
    const actions: CopilotAction[] = [
      {
        type: 'SCHEDULE_CHORE',
        description: `Aufgabe "${firstChore.title}" in freien Kalender-Slot einplanen`,
        payload: { choreId: firstChore.id },
      },
    ];

    const choreListStr = openChores
      .slice(0, 4)
      .map((c) => {
        const assigned = data.members.find((m) => m.id === c.assignedMemberId)?.name || 'Offen';
        return `• **${c.title}** (⭐ ${c.stars}, ${assigned})`;
      })
      .join('\n');

    return {
      text: `Es gibt aktuell **${openChores.length} offene Aufgaben**:\n\n${choreListStr}\n\n💡 Ich kann sie automatisch in freie Zeitfenster in euren Kalender einplanen!`,
      actions,
      source: 'local',
    };
  }

  // 3. Appointments & Schedule query
  if (
    q.includes('termin') ||
    q.includes('heute') ||
    q.includes('morgen') ||
    q.includes('woche') ||
    q.includes('ansteht') ||
    q.includes('plan')
  ) {
    const targetDate = q.includes('morgen') ? tomorrowStr : todayStr;
    const targetLabel = q.includes('morgen') ? 'Morgen' : 'Heute';

    const dayApps = data.appointments.filter((a) => isAppointmentOnDate(a, targetDate));

    if (dayApps.length === 0) {
      return {
        text: `${targetLabel} stehen **keine Termine** im Kalender – ein herrlich entspannter Familientag! ☀️`,
        source: 'local',
      };
    }

    const appList = dayApps
      .map((a) => {
        const who = (a.memberIds || [])
          .map((id) => data.members.find((m) => m.id === id)?.name)
          .filter(Boolean)
          .join(', ');
        return `• **${a.time} Uhr**: ${a.title} (${who || 'Alle'})`;
      })
      .join('\n');

    return {
      text: `${targetLabel} im Familienkalender (${dayApps.length} Termine):\n\n${appList}`,
      source: 'local',
    };
  }

  // 4. Shopping / Groceries query
  if (
    q.includes('einkauf') ||
    q.includes('kaufen') ||
    q.includes('fehlt') ||
    q.includes('liste') ||
    q.includes('supermarkt')
  ) {
    const unchecked = data.groceries.filter((g) => !g.checked);

    if (q.startsWith('setze') || q.startsWith('kauf') || q.includes('auf die einkaufsliste')) {
      // extract item name
      const cleanItem = query
        .replace(/setze/i, '')
        .replace(/auf die einkaufsliste/i, '')
        .replace(/bitte/i, '')
        .replace(/kauf/i, '')
        .trim();

      if (cleanItem.length > 1) {
        return {
          text: `Alles klar! Ich setze **"${cleanItem}"** auf die Einkaufsliste. 🛒`,
          actions: [
            {
              type: 'ADD_GROCERY',
              description: `"${cleanItem}" zur Einkaufsliste hinzufügen`,
              payload: { name: cleanItem, store: 'Rewe' },
            },
          ],
          source: 'local',
        };
      }
    }

    if (unchecked.length === 0) {
      return {
        text: 'Die Einkaufsliste ist aktuell komplett abgehakt! Braucht ihr noch etwas Besonderes?',
        source: 'local',
      };
    }

    const listStr = unchecked
      .slice(0, 6)
      .map((g) => `• ${g.name}${g.amount ? ` (${g.amount})` : ''} [${g.store}]`)
      .join('\n');

    return {
      text: `Aktuell stehen **${unchecked.length} Artikel** auf der Einkaufsliste:\n\n${listStr}${
        unchecked.length > 6 ? `\n...und ${unchecked.length - 6} weitere.` : ''
      }`,
      source: 'local',
    };
  }

  // 5. Member details (stars, sizes, allergies)
  if (
    q.includes('sterne') ||
    q.includes('größe') ||
    q.includes('allergie') ||
    q.includes('wer hat')
  ) {
    if (q.includes('sterne')) {
      const ranking = [...data.members].sort((a, b) => (b.stars || 0) - (a.stars || 0));
      const rankStr = ranking
        .map((m, idx) => `${idx + 1}. **${m.name}**: ${m.stars || 0} ⭐ (Streak: ${m.choreStreak || 0} Tage 🔥)`)
        .join('\n');
      return {
        text: `Hier ist der aktuelle Sternen-Stand eurer Familie:\n\n${rankStr}`,
        source: 'local',
      };
    }

    const allergies = data.members.filter((m) => m.childDetails?.allergies);
    if (allergies.length > 0) {
      const allStr = allergies.map((m) => `• **${m.name}**: ${m.childDetails?.allergies}`).join('\n');
      return {
        text: `Hinterlegte Allergien & Unverträglichkeiten:\n\n${allStr}`,
        source: 'local',
      };
    }

    const sizes = data.members.filter((m) => m.childDetails?.clothingSize || m.childDetails?.shoeSize);
    if (sizes.length > 0) {
      const sizeStr = sizes.map((m) => `• **${m.name}**: Kleidung ${m.childDetails?.clothingSize || '-'}, Schuhe ${m.childDetails?.shoeSize || '-'}`).join('\n');
      return {
        text: `Hinterlegte Größen der Kinder:\n\n${sizeStr}`,
        source: 'local',
      };
    }
  }

  // 6. Notes & Notice Board (Schwarzes Brett)
  if (q.includes('notiz') || q.includes('pinnwand') || q.includes('schwarzes brett') || q.includes('zettel')) {
    if (q.includes('lösch') || q.includes('entfern') || q.includes('streich') || q.includes('abnehmen')) {
      const matchNote = (data.notes || []).find((n) => q.includes(n.title.toLowerCase()) || q.includes(n.content.toLowerCase()));
      const noteTitle = matchNote ? matchNote.title : 'Notiz';
      return {
        text: `Ich habe die Notiz **"${noteTitle}"** vom Schwarzen Brett entfernt. 📌`,
        actions: [
          {
            type: 'DELETE_NOTE',
            description: `Notiz "${noteTitle}" löschen`,
            payload: { id: matchNote?.id, title: noteTitle },
          },
        ],
        source: 'local',
      };
    } else {
      let tag: 'info' | 'urgent' | 'fun' | 'wifi' = 'info';
      if (q.includes('wifi') || q.includes('wlan')) tag = 'wifi';
      else if (q.includes('wichtig') || q.includes('dringend')) tag = 'urgent';
      else if (q.includes('lustig') || q.includes('spaß')) tag = 'fun';

      let content = query
        .replace(/häng(e)? (eine )?notiz ans schwarze brett/gi, '')
        .replace(/notiz (anheften|erstellen|schreiben)/gi, '')
        .replace(/schwarzes brett/gi, '')
        .replace(/notiz/gi, '')
        .replace(/mit dem inhalt/gi, '')
        .replace(/mit/gi, '')
        .trim();
      if (!content || content.length < 2) content = 'Neue Notiz';
      const title = content.length > 25 ? content.slice(0, 22) + '...' : content;
      return {
        text: `Ich habe die Notiz **"${title}"** direkt ans Schwarze Brett geheftet! 📌`,
        actions: [
          {
            type: 'ADD_NOTE',
            description: `Notiz "${title}" anheften`,
            payload: { title, content, tag },
          },
        ],
        source: 'local',
      };
    }
  }

  // 7. Child details update (sizes, allergies, notes)
  if (
    (q.includes('schuhgröße') || q.includes('kleidergröße') || q.includes('allergie') || q.includes('größe')) &&
    (data.members || []).some((m) => q.includes(m.name.toLowerCase()))
  ) {
    const member = data.members.find((m) => q.includes(m.name.toLowerCase()));
    if (member) {
      const updates: any = { childName: member.name, memberId: member.id };
      let infoText = '';

      const shoeMatch = q.match(/schuhgröße\s*(\d{2})/i) || q.match(/schuhe\s*(\d{2})/i) || q.match(/(\d{2})\s*schuh/i);
      if (shoeMatch) {
        updates.shoeSize = shoeMatch[1];
        infoText += `Schuhgröße: ${shoeMatch[1]}`;
      }

      const clothingMatch = q.match(/kleidergröße\s*(\d{2,3})/i) || q.match(/größe\s*(\d{2,3})/i);
      if (clothingMatch && !shoeMatch) {
        updates.clothingSize = clothingMatch[1];
        infoText += `Kleidergröße: ${clothingMatch[1]}`;
      }

      if (q.includes('allergie') || q.includes('allergisch')) {
        const allergyText = query.split(/allergie|allergisch/i)[1]?.replace(/gegen|auf/i, '')?.trim() || 'Hinterlegt';
        updates.allergies = allergyText;
        infoText += `Allergie: ${allergyText}`;
      }

      return {
        text: `Alles klar! Ich habe die Daten für **${member.name}** aktualisiert (${infoText || 'Angaben gespeichert'}). 🧸`,
        actions: [
          {
            type: 'UPDATE_CHILD_DETAILS',
            description: `Details für ${member.name} aktualisieren`,
            payload: updates,
          },
        ],
        source: 'local',
      };
    }
  }

  // 8. Award stars
  if (
    (q.includes('stern') || q.includes('sterne')) &&
    (q.includes('gib') || q.includes('schenk') || q.includes('belohn') || q.includes('plus') || q.includes('gutschreib'))
  ) {
    const member = (data.members || []).find((m) => q.includes(m.name.toLowerCase()));
    const starNumMatch = q.match(/(\d+)\s*stern/i);
    const starsCount = starNumMatch ? parseInt(starNumMatch[1], 10) : 3;
    const targetMember = member || data.members.find((m) => m.isChild) || data.members[0];

    if (targetMember) {
      return {
        text: `Klasse! Ich habe **${targetMember.name}** gerade **${starsCount} Sterne** gutgeschrieben! ⭐🎉`,
        actions: [
          {
            type: 'AWARD_STARS',
            description: `${starsCount} Sterne an ${targetMember.name} vergeben`,
            payload: {
              memberId: targetMember.id,
              memberName: targetMember.name,
              stars: starsCount,
              reason: 'Vom Assistenten vergeben',
            },
          },
        ],
        source: 'local',
      };
    }
  }

  // 9. Groceries check off or remove
  if (
    (q.includes('gekauft') || q.includes('im korb') || q.includes('streich') || q.includes('abgehakt') || q.includes('lösch')) &&
    (data.groceries || []).some((g) => q.includes(g.name.toLowerCase()))
  ) {
    const matched = (data.groceries || []).find((g) => q.includes(g.name.toLowerCase()));
    if (matched) {
      const isDelete = q.includes('lösch') || q.includes('entfern') || q.includes('streich');
      if (isDelete) {
        return {
          text: `Ich habe **"${matched.name}"** von der Einkaufsliste gelöscht. 🛒`,
          actions: [
            {
              type: 'DELETE_GROCERY',
              description: `"${matched.name}" von Einkaufsliste löschen`,
              payload: { id: matched.id, name: matched.name },
            },
          ],
          source: 'local',
        };
      } else {
        return {
          text: `Super! Ich habe **"${matched.name}"** als erledigt abgehakt. ✓🛒`,
          actions: [
            {
              type: 'CHECK_GROCERY',
              description: `"${matched.name}" als erledigt markieren`,
              payload: { id: matched.id, name: matched.name },
            },
          ],
          source: 'local',
        };
      }
    }
  }

  // 10. Delete Appointment
  if (
    (q.includes('termin') || q.includes('reminder') || q.includes('erinnerung')) &&
    (q.includes('lösch') || q.includes('absag') || q.includes('entfern') || q.includes('streich') || q.includes('stornier'))
  ) {
    const matchApp = (data.appointments || []).find((a) => q.includes(a.title.toLowerCase()));
    const title = matchApp ? matchApp.title : 'Termin';
    return {
      text: `Alles klar, ich habe den Termin **"${title}"** aus dem Kalender gelöscht. 📅`,
      actions: [
        {
          type: 'DELETE_APPOINTMENT',
          description: `Termin "${title}" löschen`,
          payload: { id: matchApp?.id, title },
        },
      ],
      source: 'local',
    };
  }

  // 11. Complete or delete chore
  if (
    (q.includes('aufgabe') || q.includes('chore')) &&
    (q.includes('erledigt') || q.includes('gemacht') || q.includes('fertig') || q.includes('lösch') || q.includes('entfern'))
  ) {
    const matchChore = (data.chores || []).find((c) => q.includes(c.title.toLowerCase()));
    const choreTitle = matchChore ? matchChore.title : 'Aufgabe';
    if (q.includes('lösch') || q.includes('entfern')) {
      return {
        text: `Ich habe die Aufgabe **"${choreTitle}"** gelöscht. 🧹`,
        actions: [
          {
            type: 'DELETE_CHORE',
            description: `Aufgabe "${choreTitle}" löschen`,
            payload: { id: matchChore?.id, title: choreTitle },
          },
        ],
        source: 'local',
      };
    } else {
      return {
        text: `Klasse gemacht! Ich habe die Aufgabe **"${choreTitle}"** als erledigt markiert! ⭐`,
        actions: [
          {
            type: 'COMPLETE_CHORE',
            description: `Aufgabe "${choreTitle}" abhaken`,
            payload: { id: matchChore?.id, title: choreTitle },
          },
        ],
        source: 'local',
      };
    }
  }

  // Default fallback response
  return {
    text: `Hallo Familie ${data.familyName}! 👋 Ich bin euer intelligenter Familien-Assistent.\n\nIch kann jede Aktion im System für dich ausführen:\n• 📅 *"Erinnere mich morgen um 07:30 an die Tasche"*\n• 📌 *"Häng eine Notiz ans Schwarze Brett mit dem WLAN-Passwort 'Sommer2026'"*\n• 🧸 *"Ida hat jetzt Schuhgröße 31"*\n• ⭐ *"Gib Leo 3 Sterne fürs Zimmer aufräumen"*\n• 🛒 *"Milch ist gekauft"* oder *"Streiche Eier von der Liste"*\n• 🍲 *"Plan Lachs-Bowl für heute Abend ein"*`,
    source: 'local',
  };
}

/**
 * Executes a query through the configured LLM (Gemini / OpenAI) or falls back to local heuristics.
 */
export async function queryFamilyAssistant(
  userQuery: string,
  data: CopilotFamilyData,
  chatHistory: Array<{ role: 'user' | 'assistant'; text: string }> = []
): Promise<CopilotResponse> {
  const aiConfig = getAIConfig();

  if (!aiConfig || !aiConfig.apiKey) {
    return queryLocalFamilyAssistant(userQuery, data);
  }

  const systemContext = buildFamilyContextSummary(data);

  // Inspect previous turn for conversation continuity
  const lastAssistantTurn = [...chatHistory].reverse().find((h) => h.role === 'assistant');
  let continuityDirective = '';
  if (lastAssistantTurn && lastAssistantTurn.text) {
    continuityDirective = `
WICHTIGE GESPRÄCHSKONTINUITÄT (EXTREM WICHTIG):
Deine letzte Nachricht an den Nutzer lautete:
"""
${lastAssistantTurn.text}
"""
Wenn der Nutzer nun mit einer kurzen Bestätigung antwortet (z.B. "plan das ein", "ja bitte", "mach das", "trage das für heute ein" etc.):
1. Beziehe dich 100% EXAKT auf das Gericht oder die Aufgabe, die DU in dieser letzten Nachricht vorgeschlagen hast!
2. WECHSLE NIEMALS zu einem anderen Gericht! Wenn du vorhin Käsespätzle vorgeschlagen hast, MUSST du Käsespätzle einplanen!
3. Erzeuge die passende [ACTION:SET_MEAL:{"date":"...","slot":"dinner","title":"..."}] für GENAU dieses zuvor vorgeschlagene Gericht.
`;
  }

  const systemPrompt = `
Du bist Famly Copilot, der persönliche, herzliche, kluge Familien-Assistent für Familie ${data.familyName}.
Du kennst alle Termine, Essenspläne, Rezepte, Aufgaben und Einkaufszettel der Familie ganz genau.

WICHTIGE VERHALTENSREGELN:
1. Antworte stets auf Deutsch, herzlich, präzise, kurz und lösungsorientiert.
2. ESSENSPLAN BEFOLGEN: Beziehe dich IMMER ZUERST auf den Abschnitt "HEUTIGER ESSENSPLAN".
   - Wenn dort bereits ein Gericht (z.B. "Frische Lachs-Sashimi-Bowl mit Edamame & Duftreis" o.ä.) hinterlegt ist, bestätige dieses Gericht und behaupte NIEMALS, dass noch nichts geplant sei!
   - Nur wenn der Tag tatsächlich frei ist, schlage passende Rezepte der Familie oder aus dem Vorrat vor.
3. GESPRÄCHSKONTINUITÄT:
   - Wenn du in der vorherigen Nachricht ein Gericht vorgeschlagen hast und der Nutzer sagt "plan das bitte ein", trage GENAU dieses Gericht ein! Wechsle niemals zu einem anderen!
4. MORGENGRÜSSE & TÄGLICHE ROUTINE (WORKFLOW):
   - Wenn der Nutzer nach Morgengrüßen für jedes Familienmitglied fragt (z.B. "kannst du allen einen netten spruch zum morgen schicken", "morgen routine", "spruch zum montag"):
     1. Formuliere für JEDES Familienmitglied (Mama, Papa, Kinder etc.) einen liebevollen, persönlichen Spruch passend zu deren Rolle und Tag.
     2. Hänge den Tag [ACTION:SET_MORNING_BRIEFING:{"headline":"Guten Morgen Familie ${data.familyName}! ☀️","summary":"Eure persönlichen Tagesgrüße","highlights":["Für Mama: ...","Für Papa: ...","Für die Kids: ..."],"tipOfTheDay":"..."}] an.
     3. Erwähne kurz, dass diese Grüße nun auch direkt auf dem Dashboard gespeichert sind!
5. REMINDER & TERMINE SOFORT EINTRAGEN (KEINE RÜCKFRAGEN):
   - Wenn der Nutzer um einen Reminder, eine Erinnerung oder einen Kalendereintrag bittet (z.B. "kannst du mir für morgen früh nen reminder reinstellen das ich die tasche mitnehme", "erinnere mich morgen früh an X", "trag termin Y ein"):
     1. Stelle KEINE Rückfragen (wie "Wäre das ein passendes Zeitfenster für dich?") und mache keine bloßen Vorschläge!
     2. Führe die Aktion SOFORT aus: Hänge IMMER [ACTION:ADD_APPOINTMENT:{"title":"...","date":"YYYY-MM-DD","time":"HH:MM","notes":"Erinnerung"}] an.
     3. Bestimme das genaue Datum anhand von "MORGEN IST: ..." aus dem Kontext und die passende Uhrzeit ("morgen früh" = 07:30, "vormittags" = 09:30 oder die genannte Uhrzeit).
     4. Formuliere einen prägnanten Titel im Infinitiv (z.B. "Tasche mitnehmen").
     5. Bestätige dem Nutzer kurz und herzlich, dass der Reminder direkt im Kalender eingetragen wurde (z.B. "Erledigt! Ich habe dir für morgen um 07:30 Uhr die Erinnerung '**Tasche mitnehmen**' direkt in den Kalender eingetragen. 📅").
6. AUTOMATISCHE AKTIONEN IM SYSTEM (DER ASSISTENT KANN JEDE AKTION DIREKT AUSFÜHREN!):
   Um Aktionen im System direkt auszulösen, hänge am Ende deiner Antwort einen oder mehrere Aktions-Tags an:
   * Termine & Kalender:
     - [ACTION:ADD_APPOINTMENT:{"title":"Titel","date":"YYYY-MM-DD","time":"HH:MM","notes":"Notiz"}]
     - [ACTION:DELETE_APPOINTMENT:{"title":"Titel","date":"YYYY-MM-DD"}]
     - [ACTION:SCHEDULE_CHORE:{"title":"Aufgabe","date":"YYYY-MM-DD","time":"HH:MM","durationMinutes":15}]
   * Einkaufsliste & Vorräte:
     - [ACTION:ADD_GROCERY:{"name":"Artikel","store":"Rewe","amount":"Menge"}]
     - [ACTION:CHECK_GROCERY:{"name":"Artikel"}]
     - [ACTION:DELETE_GROCERY:{"name":"Artikel"}]
     - [ACTION:CLEAR_CHECKED_GROCERIES:{}]
     - [ACTION:ADD_ALWAYS_IN_STOCK:{"name":"Artikel"}]
     - [ACTION:CLEAN_SHOPPING_LIST:{}]
   * Essensplan & Rezepte:
     - [ACTION:SET_MEAL:{"date":"YYYY-MM-DD","slot":"dinner","title":"Gerichtname"}]
     - [ACTION:CLEAR_MEAL:{"date":"YYYY-MM-DD","slot":"dinner"}]
     - [ACTION:ADD_RECIPE_TO_GROCERIES:{"title":"Rezeptname"}]
     - [ACTION:ADD_RECIPE:{"title":"Rezeptname","prepTime":"25 Min"}]
     - [ACTION:FAVORITE_RECIPE:{"title":"Rezeptname"}]
   * Aufgaben & Sterne:
     - [ACTION:ADD_CHORE:{"title":"Aufgabe","stars":3}]
     - [ACTION:COMPLETE_CHORE:{"title":"Aufgabe"}]
     - [ACTION:DELETE_CHORE:{"title":"Aufgabe"}]
     - [ACTION:AWARD_STARS:{"memberName":"Name","stars":3,"reason":"Grund"}]
   * Schwarzes Brett & Notizen:
     - [ACTION:ADD_NOTE:{"title":"Titel","content":"Text","tag":"info"}] (Tags: info, urgent, fun, wifi)
     - [ACTION:DELETE_NOTE:{"title":"Titel"}]
   * Kinder & Profile:
     - [ACTION:UPDATE_CHILD_DETAILS:{"childName":"Name","clothingSize":"116","shoeSize":"31","allergies":"Erdnüsse"}]
   * Belohnungen:
     - [ACTION:ADD_REWARD:{"title":"Titel","starsCost":15,"icon":"🍦"}]
     - [ACTION:CLAIM_REWARD:{"title":"Titel","childName":"Name"}]
   * Routinen & Navigation:
     - [ACTION:SET_MORNING_BRIEFING:{"headline":"Titel","summary":"Text","highlights":["Spruch 1","Spruch 2"]}]
     - [ACTION:NAVIGATE:{"tab":"dashboard"|"calendar"|"meals"|"lists"|"members"|"photos"|"settings"}]
   Das System führt diese Aktionen sofort automatisch live im Familien-Hub aus.
${continuityDirective}
AKTUELLE FAMILIENDATEN:
${systemContext}
`.trim();

  try {
    let rawResponse = '';

    if (aiConfig.provider === 'gemini') {
      const model = await resolveGeminiFlashModel(aiConfig.apiKey);
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${aiConfig.apiKey}`;

      // Build proper multi-turn Gemini conversation history
      const geminiContents: Array<{ role: 'user' | 'model'; parts: [{ text: string }] }> = [];
      const recentHistory = chatHistory.slice(-8);

      for (const turn of recentHistory) {
        if (!turn.text || !turn.text.trim()) continue;
        const role = turn.role === 'assistant' ? 'model' : 'user';
        if (geminiContents.length > 0 && geminiContents[geminiContents.length - 1].role === role) {
          geminiContents[geminiContents.length - 1].parts[0].text += `\n\n${turn.text}`;
        } else {
          geminiContents.push({ role, parts: [{ text: turn.text }] });
        }
      }

      if (geminiContents.length > 0 && geminiContents[geminiContents.length - 1].role === 'user') {
        geminiContents[geminiContents.length - 1].parts[0].text += `\n\n${userQuery}`;
      } else {
        geminiContents.push({ role: 'user', parts: [{ text: userQuery }] });
      }

      // First turn must have role 'user'
      if (geminiContents.length > 0 && geminiContents[0].role === 'model') {
        geminiContents.unshift({ role: 'user', parts: [{ text: 'Hallo Famly Assistent!' }] });
      }

      const requestBody: any = {
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: geminiContents,
        generationConfig: {
          temperature: 0.6,
        },
      };

      let res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        // Fallback: embed systemPrompt directly in contents if systemInstruction is rejected
        const fallbackContents = [
          {
            role: 'user',
            parts: [{
              text: `${systemPrompt}\n\n--- UNTERHALTUNGSVERLAUF ---\n${chatHistory.slice(-6).map((h) => `${h.role === 'user' ? 'Nutzer' : 'Assistent'}: ${h.text}`).join('\n\n')}\n\nAktuelle Nutzeranfrage: ${userQuery}`,
            }],
          },
        ];
        res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: fallbackContents }),
        });
      }

      if (!res.ok) {
        return queryLocalFamilyAssistant(userQuery, data);
      }

      const json = await res.json();
      rawResponse = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } else {
      // OpenAI
      const endpoint = 'https://api.openai.com/v1/chat/completions';
      const messages = [
        { role: 'system', content: systemPrompt },
        ...chatHistory.slice(-6).map((h) => ({ role: h.role, content: h.text })),
        { role: 'user', content: userQuery },
      ];

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${aiConfig.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages,
          temperature: 0.6,
        }),
      });

      if (!res.ok) {
        return queryLocalFamilyAssistant(userQuery, data);
      }

      const json = await res.json();
      rawResponse = json.choices?.[0]?.message?.content || '';
    }

    if (!rawResponse) {
      return queryLocalFamilyAssistant(userQuery, data);
    }

    // Parse Actions from LLM response
    const actions: CopilotAction[] = [];
    let cleanText = rawResponse;

    const actionRegex = /\[ACTION:([A-Z_]+):(.*?)\]/g;
    let match;
    while ((match = actionRegex.exec(rawResponse)) !== null) {
      const actionType = match[1] as CopilotAction['type'];
      try {
        const payload = JSON.parse(match[2]);
        let description = 'Aktion ausführen';
        if (actionType === 'ADD_GROCERY') description = `"${payload.name}" auf die Einkaufsliste`;
        else if (actionType === 'CHECK_GROCERY') description = `"${payload.name}" als erledigt markiert 🛒`;
        else if (actionType === 'DELETE_GROCERY') description = `"${payload.name}" von der Einkaufsliste gelöscht`;
        else if (actionType === 'CLEAR_CHECKED_GROCERIES') description = `Erledigte Einkäufe aus Korb geleert`;
        else if (actionType === 'ADD_ALWAYS_IN_STOCK') description = `"${payload.name}" zu Vorräten hinzugefügt 🏠`;
        else if (actionType === 'SET_MEAL') description = `"${payload.title}" in den Essensplan (${payload.date || 'Heute'})`;
        else if (actionType === 'CLEAR_MEAL') description = `Essensplan für ${payload.date || 'Heute'} geleert`;
        else if (actionType === 'ADD_RECIPE_TO_GROCERIES') description = `Zutaten für "${payload.title}" zur Einkaufsliste`;
        else if (actionType === 'ADD_RECIPE') description = `Rezept "${payload.title}" gespeichert 🍲`;
        else if (actionType === 'FAVORITE_RECIPE') description = `Rezept "${payload.title}" als Favorit ⭐ markiert`;
        else if (actionType === 'ADD_APPOINTMENT') description = `Termin "${payload.title}" in Kalender (${payload.date || 'Heute'} ${payload.time || ''})`;
        else if (actionType === 'DELETE_APPOINTMENT') description = `Termin "${payload.title}" gelöscht / abgesagt 📅`;
        else if (actionType === 'SCHEDULE_CHORE') description = `"${payload.title || 'Aufgabe'}" in den Kalender (${payload.date || 'Heute'} ${payload.time || ''})`;
        else if (actionType === 'ADD_CHORE') description = `Aufgabe "${payload.title}" anlegen`;
        else if (actionType === 'COMPLETE_CHORE') description = `Aufgabe "${payload.title}" als erledigt markiert ⭐`;
        else if (actionType === 'DELETE_CHORE') description = `Aufgabe "${payload.title}" gelöscht`;
        else if (actionType === 'ADD_NOTE') description = `Notiz "${payload.title}" an Pinnwand geheftet 📌`;
        else if (actionType === 'DELETE_NOTE') description = `Notiz "${payload.title}" von Pinnwand entfernt`;
        else if (actionType === 'UPDATE_CHILD_DETAILS') description = `Details für ${payload.childName || 'Kind'} aktualisiert 🧸`;
        else if (actionType === 'AWARD_STARS') description = `${payload.stars} Sterne an ${payload.memberName} vergeben ⭐`;
        else if (actionType === 'ADD_REWARD') description = `Belohnung "${payload.title}" angelegt 🎁`;
        else if (actionType === 'CLAIM_REWARD') description = `Belohnung "${payload.title}" eingelöst 🎁`;
        else if (actionType === 'CLEAN_SHOPPING_LIST') description = `Einkaufsliste bereinigt`;
        else if (actionType === 'SET_MORNING_BRIEFING') description = `Morgengrüße in Dashboard-Routine gespeichert`;
        else if (actionType === 'NAVIGATE') description = `Zu "${payload.tab}" navigiert`;

        actions.push({ type: actionType, payload, description });
      } catch (e) {
        // ignore malformed JSON
      }
    }

    cleanText = cleanText.replace(actionRegex, '').trim();

    return {
      text: cleanText,
      actions: actions.length > 0 ? actions : undefined,
      source: 'ai',
    };
  } catch (err) {
    console.error('AI assistant query failed, falling back to local heuristics:', err);
    return queryLocalFamilyAssistant(userQuery, data);
  }
}
