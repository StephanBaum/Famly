import {
  FamilyMember,
  Appointment,
  Chore,
  Recipe,
  MealPlanDay,
  GroceryItem,
  isAppointmentOnDate,
} from '../types';
import { getAIConfig } from './aiRecipeService';
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
}

export interface CopilotAction {
  type: 'SCHEDULE_CHORE' | 'ADD_GROCERY' | 'SET_MEAL' | 'NAVIGATE';
  payload: any;
  description: string;
}

export interface CopilotResponse {
  text: string;
  actions?: CopilotAction[];
  source: 'ai' | 'local';
}

/**
 * Builds a structured text snapshot of current family data for LLM context.
 */
function buildFamilyContextSummary(data: CopilotFamilyData): string {
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

  // Meal plans for this week
  const upcomingMealPlans = data.mealPlans
    .slice(0, 7)
    .map((mp) => {
      const meals: string[] = [];
      if (mp.dinner?.title) meals.push(`Abendessen: ${mp.dinner.title}`);
      if (mp.lunch?.title) meals.push(`Mittagessen: ${mp.lunch.title}`);
      if (mp.breakfast?.title) meals.push(`Frühstück: ${mp.breakfast.title}`);
      return ` - ${mp.date}: ${meals.length > 0 ? meals.join(' | ') : 'Noch nichts eingetragen (Frei)'}`;
    })
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

  return `
HEUTIGES DATUM: ${todayGerman} (${todayStr})
FAMILIE: ${data.familyName}

MITGLIEDER:
${membersSummary || 'Keine Mitglieder'}

TERMINE DIESE WOCHE:
${upcomingAppointments || 'Keine anstehenden Termine'}

ESSENSPLAN DIESE WOCHE:
${upcomingMealPlans || 'Keine Mahlzeiten geplant'}

OFFENE AUFGABEN:
${openChores || 'Alle Aufgaben erledigt!'}

EINKAUFSLISTE (OFFEN):
${uncheckedGroceries || 'Einkaufsliste ist leer'}
`.trim();
}

/**
 * Intelligent Local Fallback Engine
 * Answers queries instantly without requiring API keys or internet.
 */
export function queryLocalFamilyAssistant(
  query: string,
  data: CopilotFamilyData
): CopilotResponse {
  const q = query.toLowerCase().trim();
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const tomorrowStr = format(addDays(today, 1), 'yyyy-MM-dd');

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
  }

  // Default fallback response
  return {
    text: `Hallo Familie ${data.familyName}! 👋 Ich habe Zugriff auf euren Kalender, Essensplan, Aufgaben und die Einkaufsliste.\n\nDu kannst mich zum Beispiel fragen:\n• *"Was essen wir heute laut Essensplan?"*\n• *"Was steht morgen an?"*\n• *"Welche Aufgaben sind noch offen?"*\n• *"Plane Aufgaben in freie Kalender-Slots ein"*\n• *"Setze Milch auf die Einkaufsliste"*`,
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
  const systemPrompt = `
Du bist Famly Copilot, der persönliche, warme, kluge Familien-Assistent für Familie ${data.familyName}.
Du kennst alle Termine, Essenspläne, Rezepte, Aufgaben und Einkaufszettel der Familie ganz genau.

WICHTIGE REGELN:
1. Antworte stets auf Deutsch, freundlich, präzise und lösungsorientiert.
2. Wenn nach dem Essen gefragt wird, beziehe dich IMMER ZUERST auf den hinterlegten Essensplan (nicht erfinden). Wenn ein Tag noch frei ist, schlage passende Rezepte der Familie vor.
3. Wenn der Nutzer bittet, Aufgaben einzuplanen, schlage konkrete freie Zeitfenster vor und erzeuge eine Aktion.
4. Wenn der Nutzer bittet, etwas einzukaufen, bestätige es und gib eine Aktion aus.
5. Um Aktionen im System auszulösen, hänge am Ende deiner Antwort einen oder mehrere Aktions-Tags an:
   - [ACTION:ADD_GROCERY:{"name":"Milch","store":"Rewe"}]
   - [ACTION:SCHEDULE_CHORE:{"choreId":"ID","title":"Titel"}]
   - [ACTION:SET_MEAL:{"date":"YYYY-MM-DD","slot":"dinner","title":"Titel","recipeId":"r1"}]

AKTUELLE FAMILIENDATEN:
${systemContext}
`.trim();

  try {
    let rawResponse = '';

    if (aiConfig.provider === 'gemini') {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${aiConfig.apiKey}`;

      const contents = [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\nNutzerfrage: ${userQuery}` }],
        },
      ];

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents }),
      });

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
        ...chatHistory.slice(-4).map((h) => ({ role: h.role, content: h.text })),
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
          temperature: 0.7,
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

    const actionRegex = /\[ACTION:(SCHEDULE_CHORE|ADD_GROCERY|SET_MEAL):(.*?)\]/g;
    let match;
    while ((match = actionRegex.exec(rawResponse)) !== null) {
      const actionType = match[1] as CopilotAction['type'];
      try {
        const payload = JSON.parse(match[2]);
        let description = 'Aktion ausführen';
        if (actionType === 'ADD_GROCERY') description = `"${payload.name}" zur Einkaufsliste`;
        if (actionType === 'SCHEDULE_CHORE') description = `Aufgabe in Kalender einplanen`;
        if (actionType === 'SET_MEAL') description = `"${payload.title}" in Essensplan (${payload.date})`;

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
