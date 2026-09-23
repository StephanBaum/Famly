import { CopilotFamilyData, normalizeCopilotData } from './copilotTypes';
import { format, addDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { isAppointmentOnDate } from '../../types';
import { buildDynamicAgentActionDocs } from '../appActionRegistry';
import { decideMeal, decideChoreAssignee } from '../decisionService';

export function buildFamilyContextSummary(inputData: CopilotFamilyData): string {
  const data = normalizeCopilotData(inputData);
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const todayGerman = format(today, 'EEEE, d. MMMM yyyy', { locale: de });

  // Members overview with role, interests and hobbies
  const membersSummary = data.members
    .map((m) => {
      const details = [];
      if (m.interests && m.interests.length > 0) details.push(`Hobbys: ${m.interests.join(', ')}`);
      if (m.allergies) details.push(`Allergien: ${Array.isArray(m.allergies) ? (m.allergies as string[]).join(', ') : m.allergies}`);
      if (m.notes) details.push(`Notizen: ${m.notes}`);
      return ` - ${m.name} (${m.role}${m.isChild ? ', Kind' : ''})${details.length > 0 ? ` [${details.join(' | ')}]` : ''}`;
    })
    .join('\n');

  // Today's Meals
  const todayPlan = data.mealPlans.find((mp) => mp.date === todayStr);
  const todayMealsSummary = todayPlan
    ? [
        todayPlan.breakfast?.title ? ` - Frühstück: ${todayPlan.breakfast.title}` : null,
        todayPlan.lunch?.title ? ` - Mittagessen: ${todayPlan.lunch.title}` : null,
        todayPlan.dinner?.title ? ` - Abendessen: ${todayPlan.dinner.title}` : null,
      ]
        .filter(Boolean)
        .join('\n') || ' - Keine Mahlzeit eingetragen'
    : ' - Keine Mahlzeit eingetragen';

  // All recorded meals across whole week
  const allRecordedMeals = (data.mealPlans || [])
    .filter((mp) => mp.dinner?.title || mp.lunch?.title || mp.breakfast?.title)
    .map((mp) => {
      const meals = [
        mp.breakfast?.title ? `Frühstück: ${mp.breakfast.title}` : null,
        mp.lunch?.title ? `Mittag: ${mp.lunch.title}` : null,
        mp.dinner?.title ? `Abendessen: ${mp.dinner.title}` : null,
      ].filter(Boolean).join(', ');
      return ` - ${mp.date}: ${meals}`;
    })
    .join('\n');

  // Appointments today
  const todayAppointments = data.appointments
    .filter((a) => isAppointmentOnDate(a, todayStr))
    .map((a) => {
      const who = a.memberIds
        .map((id) => data.members.find((m) => m.id === id)?.name)
        .filter(Boolean)
        .join(', ');
      return ` - ${a.time} Uhr: ${a.title} (Zuständig: ${who || 'Alle'}${a.location ? `, Ort: ${a.location}` : ''})`;
    })
    .join('\n');

  // Upcoming appointments (next 7 days)
  const upcomingAppointments = data.appointments
    .filter((a) => {
      if (isAppointmentOnDate(a, todayStr)) return false;
      const appDate = new Date(a.date);
      const diffDays = (appDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays > 0 && diffDays <= 7;
    })
    .slice(0, 10)
    .map((a) => {
      const who = a.memberIds
        .map((id) => data.members.find((m) => m.id === id)?.name)
        .filter(Boolean)
        .join(', ');
      return ` - ${a.date} um ${a.time} Uhr: ${a.title} (${who || 'Alle'})`;
    })
    .join('\n');

  // Meal plan next 7 days
  const upcomingMealPlans = data.mealPlans
    .filter((mp) => {
      const diff = (new Date(mp.date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 7;
    })
    .map((mp) => ` - ${mp.date}: ${mp.dinner?.title || 'Noch nichts geplant'}`)
    .join('\n');

  // Saved recipes catalog
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

  // Unchecked groceries
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

  // Notes & Notice board
  const notesSummary = (data.notes || [])
    .map((n) => ` - [${n.tag.toUpperCase()}] "${n.title}": ${n.content}`)
    .join('\n');

  // Rewards catalog
  const rewardsSummary = (data.rewards || [])
    .map((r) => ` - ${r.icon} "${r.title}" (${r.starsCost} ⭐)`)
    .join('\n');

  const activeUserName = data.loggedInMember
    ? `${data.loggedInMember.name} (${data.loggedInMember.role})`
    : data.currentMemberId && data.currentMemberId !== 'all'
    ? `${data.members.find((m) => m.id === data.currentMemberId)?.name || 'Familienmitglied'}`
    : 'Familienmitglied';

  return `
HEUTIGES DATUM: ${todayGerman} (${todayStr})
MORGEN IST: ${tomorrowGerman} (${tomorrowStr})
ÜBERMORGEN IST: ${dayAfterTomorrowStr}
FAMILIE: ${data.familyName}
AKTUELL EINGELOGGTER NUTZER (DER GERADE MIT DIR SPRICHT): ${activeUserName}
WICHTIGSTE ZUWEISUNGSREGEL: Wenn der Nutzer "ich", "mich", "mir" oder "für mich" sagt, bezieht er sich IMMER auf ${data.loggedInMember ? data.loggedInMember.name : activeUserName}! Ordne solche Termine oder Aufgaben NIEMALS anderen Familienmitgliedern (wie Adriana) zu!

MITGLIEDER & INTERESSEN:
${membersSummary || 'Keine Mitglieder'}

HEUTIGER ESSENSPLAN:
${todayMealsSummary}

ALLE IM SYSTEM HINTERLEGTEN MAHLZEITEN:
${allRecordedMeals || 'Noch keine Mahlzeiten im System eingetragen'}

HEUTIGE TERMINE:
${todayAppointments || 'Keine Termine heute eingetragen'}

ESSENSPLAN DER NÄCHSTEN 7 TAGE:
${upcomingMealPlans}

BELIEBTE REZEPTE DER FAMILIE:
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

export function buildCopilotSystemPrompt(
  data: CopilotFamilyData,
  chatHistory: Array<{ role: 'user' | 'assistant'; text: string }>,
  semanticMemoriesText: string
): string {
  const systemContext = buildFamilyContextSummary(data);

  // Inspect previous turn for conversation continuity
  const lastAssistantTurn = [...chatHistory].reverse().find((h) => h.role === 'assistant');
  let continuityDirective = '';
  if (lastAssistantTurn && lastAssistantTurn.text) {
    continuityDirective = `
WICHTIGE GESPRÄCHSKONTINUITÄT:
Deine letzte Nachricht an den Nutzer lautete:
"""
${lastAssistantTurn.text}
"""
Wenn der Nutzer nun mit einer kurzen Bestätigung antwortet (z.B. "plan das ein", "ja bitte", "mach das", "trage das für heute ein" etc.):
1. Beziehe dich 100% EXAKT auf das Gericht oder die Aufgabe, die DU in dieser letzten Nachricht vorgeschlagen hast!
2. WECHSLE NIEMALS zu einem anderen Gericht!
3. Erzeuge die passende [ACTION:SET_MEAL:{"date":"...","slot":"dinner","title":"..."}] für GENAU dieses Gericht.
`;
  }

  // Pre-calculated heuristics (Open-Jev System 1)
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  let system1DecisionInsight = '';
  try {
    const todayApps = data.appointments.filter((a) => isAppointmentOnDate(a, todayStr));
    const openChores = data.chores.filter((c) => !c.completed);
    const topMealDecision = decideMeal(data.recipes, [], todayApps, 45, data.mealPlans, todayStr);
    const topChoreDecision =
      openChores.length > 0 && data.members.length > 0
        ? decideChoreAssignee(openChores[0], data.members, todayApps)
        : null;

    system1DecisionInsight = `
OPEN-JEV SYSTEM 1 SCHNELL-DECISION-INSIGHTS:
- Heutige Essens-Empfehlung: "${topMealDecision.winner.title}" (${topMealDecision.winner.percentage}% Fit | Vorzüge: ${topMealDecision.winner.pros.join(', ') || 'Ausgewogen'})
${topChoreDecision ? `- Aufgaben-Fairness ("${openChores[0].title}"): "${topChoreDecision.winner.title}" (${topChoreDecision.winner.percentage}% Fairness-Score)` : ''}
`;
  } catch {
    // fallback silently
  }

  const activeUserName = data.loggedInMember ? data.loggedInMember.name : 'der aktuell angemeldete Nutzer';

  return `
Du bist Famly Copilot, der persönliche, herzliche, kluge Familien-Assistent für Familie ${data.familyName}.
Du kennst alle Termine, Essenspläne, Rezepte, Aufgaben und Einkaufszettel der Familie ganz genau.

WICHTIGE VERHALTENSREGELN:
1. Antworte stets auf Deutsch, herzlich, präzise, kurz und lösungsorientiert.
2. ESSENSPLAN BEFOLGEN: Beziehe dich IMMER ZUERST auf den Abschnitt "HEUTIGER ESSENSPLAN".
   - Wenn dort bereits ein Gericht hinterlegt ist, bestätige dieses Gericht und behaupte NIEMALS, dass noch nichts geplant sei!
   - Nur wenn der Tag tatsächlich frei ist, schlage passende Rezepte der Familie oder aus dem Vorrat vor.
3. GESPRÄCHSKONTINUITÄT:
   - Wenn du in der vorherigen Nachricht ein Gericht vorgeschlagen hast und der Nutzer sagt "plan das bitte ein", trage GENAU dieses Gericht ein!
4. REMINDER & TERMINE SOFORT EINTRAGEN (KEINE RÜCKFRAGEN):
   - Wenn der Nutzer um einen Reminder, eine Erinnerung oder einen Kalendereintrag bittet (z.B. "erinnere mich morgen früh an die Tasche", "trag termin Y ein"):
     1. Stelle KEINE Rückfragen und führe die Aktion SOFORT aus!
     2. Hänge IMMER [ACTION:ADD_APPOINTMENT:{"title":"...","date":"YYYY-MM-DD","time":"HH:MM","memberNames":["${activeUserName}"]}] an.
     3. Bestimme das genaue Datum anhand von "MORGEN IST: ..." aus dem Kontext und die passende Uhrzeit ("morgen früh" = 07:30, "vormittags" = 09:30).
5. BENUTZERIDENTITÄT & ZUWEISUNG:
   - Der aktuell sprechende Nutzer ist: ${activeUserName}.
   - Wenn der Nutzer "ich", "mich", "mir" oder "für mich" sagt:
     Trage den Termin mit memberNames: ["${activeUserName}"] ein!
     Weise persönliche Erinnerungen NIEMALS ungefragt anderen Personen zu!
6. MULTITASKING & MEHRTEILIGE KOMBINATIONSAUFTRÄGE:
   - Wenn der Nutzer mehrere Anliegen in einem Satz nennt (z.B. Einkäufe + Aufgabendelegation):
     Beispiel: "wir brauchen noch brot und milch, adriana kann das auf dem heimweg mitnehmen"
     1. Trenne alle genannten Einkaufsartikel sauber einzeln auf:
        [ACTION:ADD_GROCERY:{"name":"Brot","store":"Supermarkt"}]
        [ACTION:ADD_GROCERY:{"name":"Milch","store":"Supermarkt"}]
        (Niemals "brot und milch..." als einen einzigen Artikel speichern!)
     2. Erstelle sofort parallel die passende Aufgabe für die genannte Person:
        [ACTION:ADD_CHORE:{"title":"Brot & Milch auf dem Heimweg mitnehmen","assignedMemberName":"Adriana","stars":2}]
     3. Bestätige in deiner Antwort herzlich und präzise sowohl das Eintragen der einzelnen Artikel auf die Einkaufsliste als auch das Anlegen der Aufgabe!
7. REGIONALE FREIZEIT & GEHEIMTIPPS (KEIN MAINSTREAM!):
   - Wenn nach Freizeit, Wochenende oder Ausflügen gefragt wird:
     Vermeide langweilige 08/15-Mainstream-Vorschläge (Multiplex-Kino, Standard-Mall, gewöhnlicher Spielplatz).
     Schlage echte regionale Besonderheiten und Geheimtipps vor, die zu den konkreten Hobbys der Familie passen!
8. LANGZEIT-GEDÄCHTNIS & FAKTEN (CROSS-DEVICE):
   - Wenn der Nutzer dir einen neuen Fakt oder Vorliebe anvertraut ("Merk dir...", "Denk dran dass...", "Leo mag keine Pilze"):
     Speichere diesen Fakt mit [ACTION:SAVE_MEMORY:{"text":"...","category":"preference|allergy|schedule|rule|general"}].
9. SYSTEM-AKTIONEN:
   Hänge am Ende deiner Antwort einen oder mehrere Aktions-Tags an:
${buildDynamicAgentActionDocs()}
${continuityDirective}
${system1DecisionInsight}
GESPEICHERTES LANGZEIT-GEDÄCHTNIS & FAKTEN DER FAMILIE (UPSTASH VECTOR STORE):
${semanticMemoriesText}

AKTUELLE FAMILIENDATEN:
${systemContext}
`.trim();
}
