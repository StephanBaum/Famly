import { CopilotFamilyData, CopilotResponse, CopilotAction, normalizeCopilotData } from './copilotTypes';
import { format, addDays } from 'date-fns';
import { isAppointmentOnDate, FamilyMember } from '../../types';
import { addFamilyMemory } from '../familyMemoryService';
import { decideMeal } from '../decisionService';

export function queryLocalFamilyAssistant(
  query: string,
  inputData: CopilotFamilyData
): CopilotResponse {
  const data = normalizeCopilotData(inputData);
  const q = query.toLowerCase().trim();
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const tomorrowStr = format(addDays(today, 1), 'yyyy-MM-dd');

  const defaultCreatorName = data.loggedInMember
    ? data.loggedInMember.name
    : data.currentMemberId && data.currentMemberId !== 'all'
    ? data.members.find((m) => m.id === data.currentMemberId)?.name || 'Familienmitglied'
    : data.members[0]?.name || 'Familienmitglied';

  // 1. Persistent Long-Term Memory Saving Intent
  const isMemorySaveIntent =
    (q.includes('merk dir') || q.includes('denk dran') || q.includes('speicher') || q.includes('behalt im kopf')) &&
    !q.includes('uhr') &&
    !q.includes('termin') &&
    !q.includes('kalender');

  if (isMemorySaveIntent) {
    let cleanFact = query
      .replace(/merk dir bitte/gi, '')
      .replace(/merk dir/gi, '')
      .replace(/denk dran dass/gi, '')
      .replace(/denk dran das/gi, '')
      .replace(/denk dran/gi, '')
      .replace(/speicher/gi, '')
      .replace(/dass/gi, '')
      .replace(/das/gi, '')
      .replace(/bitte/gi, '')
      .replace(/^[:,\s]+/, '')
      .trim();

    if (cleanFact.length > 2) {
      let category: 'preference' | 'allergy' | 'schedule' | 'rule' | 'general' = 'general';
      const lower = cleanFact.toLowerCase();
      if (lower.includes('allerg') || lower.includes('verträgt')) category = 'allergy';
      else if (lower.includes('mag') || lower.includes('liebt') || lower.includes('trinkt') || lower.includes('isst')) category = 'preference';
      else if (lower.includes('montag') || lower.includes('dienstag') || lower.includes('mittwoch') || lower.includes('donnerstag') || lower.includes('freitag') || lower.includes('homeoffice')) category = 'schedule';
      else if (lower.includes('regel') || lower.includes('immer') || lower.includes('nie')) category = 'rule';

      const mem = addFamilyMemory(cleanFact, category, 4);
      return {
        text: `Alles klar! Ich habe mir diesen Fakt im Familiengedächtnis gemerkt:\n\n🧠 **"${mem.text}"**\n\nEr ist nun dauerhaft gespeichert und für alle Familienmitglieder abrufbar!`,
        actions: [
          {
            type: 'SAVE_MEMORY',
            description: `Fakt "${mem.text}" im Langzeit-Gedächtnis gespeichert 🧠`,
            payload: { text: mem.text, category: mem.category },
            autoExecuted: true,
          },
        ],
        source: 'local',
      };
    }
  }

  // 2. Open-Jev System 1 Decision Fast-Path
  const isDecisionIntent =
    q.includes('entscheid') ||
    q.includes('was kochen wir heute') ||
    q.includes('was essen wir heute') ||
    (q.includes('wer') && (q.includes('müll') || q.includes('spül') || q.includes('putzt') || q.includes('saugt') || q.includes('aufräumen')));

  if (isDecisionIntent) {
    const todayApps = data.appointments.filter((a) => isAppointmentOnDate(a, todayStr));

    if (q.includes('koch') || q.includes('ess') || q.includes('gericht') || q.includes('abendessen') || q.includes('mittag')) {
      const mealDecision = decideMeal(data.recipes, [], todayApps, 45, data.mealPlans, todayStr);
      return {
        text: `⚡ **Open-Jev System 1 Empfehlung** (${mealDecision.winner.percentage}% Fit):\n\n🍲 **${mealDecision.winner.title}**\n${mealDecision.winner.pros.map((p) => `• ${p}`).join('\n')}\n\n*${mealDecision.summary}*`,
        actions: [
          {
            type: 'SET_MEAL',
            description: `"${mealDecision.winner.title}" für heute eintragen 🍲`,
            payload: {
              date: todayStr,
              slot: 'dinner',
              title: mealDecision.winner.title,
              recipeId: mealDecision.winner.id !== 'planned_meal' ? mealDecision.winner.id : undefined,
            },
          },
        ],
        source: 'local',
      };
    }
  }

  // 3. Proactive Reminders & Appointments
  const isAppointmentRequest =
    (q.includes('erinnere mich') || q.includes('reminder') || q.includes('termin') || q.includes('trag mir') || q.includes('stell mir')) &&
    !q.includes('lösch') &&
    !q.includes('entfern');

  if (isAppointmentRequest) {
    let date = todayStr;
    if (q.includes('morgen')) date = tomorrowStr;
    else if (q.includes('übermorgen')) date = format(addDays(today, 2), 'yyyy-MM-dd');

    let time = '07:30';
    const timeMatch = query.match(/(\d{1,2})(?::(\d{2})|\s*uhr(?:\s*(\d{2}))?)/i);
    if (timeMatch) {
      const h = String(timeMatch[1]).padStart(2, '0');
      const m = String(timeMatch[2] || timeMatch[3] || '00').padStart(2, '0');
      time = `${h}:${m}`;
    } else if (q.includes('nachmittag')) time = '15:00';
    else if (q.includes('abend')) time = '18:30';
    else if (q.includes('mittag')) time = '12:30';

    let title = query
      .replace(/(?:kannst du mir|kannst du bitte|erinnere mich|erinnere|trag mir|trag bitte|trag|bitte|einen|den|termin|reminder|reinstellen|eintragen|dass ich|das ich)\s*/gi, '')
      .replace(/(?:für morgen früh|morgen früh|für morgen|morgen|übermorgen|heute|vormittag|nachmittag|abend|früh)\s*/gi, '')
      .replace(/(?:um\s+\d{1,2}(?::\d{2}|\s*uhr)?)\s*/gi, '')
      .replace(/^(?:an|auf|dass|das|die|den)\s+/i, '')
      .replace(/[.?!]+$/, '')
      .trim();

    if (!title || title.length < 2) title = 'Erinnerung';
    title = title.charAt(0).toUpperCase() + title.slice(1);

    // Assign to loggedInMember or explicitly named person, NEVER blindly to someone else
    let targetMemberName = defaultCreatorName;
    for (const m of data.members) {
      if (q.includes(`für ${m.name.toLowerCase()}`) || q.includes(`an ${m.name.toLowerCase()}`)) {
        targetMemberName = m.name;
        break;
      }
    }

    const dateLabel = date === todayStr ? 'heute' : date === tomorrowStr ? 'morgen' : `am ${date}`;
    return {
      text: `Erledigt! Ich habe für **${targetMemberName}** ${dateLabel} um **${time} Uhr** die Erinnerung **"${title}"** in den Kalender eingetragen. 📅`,
      actions: [
        {
          type: 'ADD_APPOINTMENT',
          description: `Erinnerung "${title}" für ${dateLabel} um ${time} Uhr`,
          payload: {
            title,
            date,
            time,
            memberNames: [targetMemberName],
            notes: 'Erinnerung vom Famly-Assistenten',
          },
        },
      ],
      source: 'local',
    };
  }

  // 4. Shopping / Groceries & Multitasking Delegation
  const isGroceryQuery =
    q.includes('einkauf') ||
    q.includes('kaufen') ||
    q.includes('kauf') ||
    q.includes('fehlt') ||
    q.includes('liste') ||
    q.includes('supermarkt') ||
    q.includes('brauchen') ||
    q.includes('mitbring') ||
    (q.includes('mitnehm') && !q.includes('tasche') && !q.includes('termin'));

  if (isGroceryQuery) {
    const isAddGroceryIntent =
      q.includes('brauchen') ||
      q.includes('kauf') ||
      q.includes('besorg') ||
      q.includes('setze') ||
      q.includes('pack') ||
      q.includes('schreib') ||
      q.includes('auf die liste') ||
      q.includes('mitbringen') ||
      (q.includes('mitnehmen') && (q.includes('noch') || q.includes('und') || q.includes('kann') || q.includes('soll')));

    if (isAddGroceryIntent) {
      // Check for compound delegation clause like: ", Adriana kann das auf dem Heimweg mitnehmen"
      let delegatedMember: FamilyMember | undefined = undefined;
      let delegationClause = '';

      const delegationMatch = query.match(
        /[,;]?\s*(?:aber\s+)?(\w+)\s+(?:kann|soll|macht|übernimmt|holt)\s+das(?:\s+auf\s+dem\s+heimweg|\s+nachher|\s+später|\s+heute|\s+morgen)?(?:\s+mitnehmen|\s+besorgen|\s+holen|\s+kaufen)?/i
      );
      if (delegationMatch) {
        const potentialName = delegationMatch[1].toLowerCase();
        delegatedMember = data.members.find(
          (m) => m.name.toLowerCase() === potentialName || m.role.toLowerCase() === potentialName
        );
        if (delegatedMember) {
          delegationClause = delegationMatch[0];
        }
      }

      if (!delegatedMember) {
        for (const m of data.members) {
          const nameLower = m.name.toLowerCase();
          const regex = new RegExp(`(?:,\\s*|\\bund\\s+)?${nameLower}\\s+(?:kann|soll|macht|holt)\\s+(?:das|die|es|alles)?(?:\\s+auf\\s+dem\\s+heimweg|\\s+nachher|\\s+später)?\\s*(?:mitnehmen|besorgen|holen|kaufen|erledigen)`, 'i');
          const mMatch = query.match(regex);
          if (mMatch) {
            delegatedMember = m;
            delegationClause = mMatch[0];
            break;
          }
        }
      }

      let cleanGroceryText = query;
      if (delegationClause) {
        cleanGroceryText = cleanGroceryText.replace(delegationClause, '');
      }

      cleanGroceryText = cleanGroceryText
        .replace(/(?:kannst du|kannst du bitte|bitte)?\s*(?:wir\s+brauchen\s+(?:noch\s+)?)/gi, '')
        .replace(/(?:setze|schreib|pack|packe|tu|tue|kauf|kaufe|besorg|besorge)\s+(?:bitte\s+)?/gi, '')
        .replace(/(?:auf\s+die\s+einkaufsliste|auf\s+die\s+liste|zur\s+einkaufsliste|in\s+den\s+einkaufskorb)(?:\s+bei\s+\w+)?/gi, '')
        .replace(/^(?:noch|auch|bitte|und)\s+/i, '')
        .replace(/[.?!,]+$/, '')
        .trim();

      const items = cleanGroceryText
        .split(/(?:,|\bund\b)/i)
        .map((i) => i.trim().replace(/^(ein|eine|einen|etwas|noch|zwei|drei)\s+/i, ''))
        .filter((i) => i.length > 1 && !/^(kann|soll|das|die|es|mitnehmen|besorgen)$/i.test(i));

      if (items.length > 0) {
        const actions: CopilotAction[] = [];
        const capitalizedItems: string[] = [];

        items.forEach((item) => {
          const cap = item.charAt(0).toUpperCase() + item.slice(1);
          capitalizedItems.push(cap);
          actions.push({
            type: 'ADD_GROCERY',
            description: `"${cap}" auf die Einkaufsliste`,
            payload: { name: cap, store: 'Supermarkt' },
          });
        });

        let text = '';
        if (delegatedMember) {
          const taskTitle = `${capitalizedItems.join(' & ')} auf dem Heimweg mitnehmen`;
          actions.push({
            type: 'ADD_CHORE',
            description: `Aufgabe "${taskTitle}" für ${delegatedMember.name}`,
            payload: {
              title: taskTitle,
              assignedMemberName: delegatedMember.name,
              stars: 2,
            },
          });
          text = `Alles klar! Ich habe **${capitalizedItems.join('** und **')}** einzeln auf die Einkaufsliste gesetzt 🛒 und für **${delegatedMember.name}** die Aufgabe *"${taskTitle}"* (+2 ⭐) angelegt! 🧹`;
        } else {
          text = `Alles klar! Ich habe **${capitalizedItems.join('** und **')}** auf die Einkaufsliste gesetzt. 🛒`;
        }

        return {
          text,
          actions,
          source: 'local',
        };
      }
    }

    const unchecked = data.groceries.filter((g) => !g.checked);
    if (unchecked.length === 0) {
      return {
        text: 'Die Einkaufsliste ist aktuell komplett leer oder abgehakt! Braucht ihr noch etwas Besonderes?',
        source: 'local',
      };
    }

    const listStr = unchecked
      .slice(0, 8)
      .map((g) => `• ${g.name}${g.amount ? ` (${g.amount})` : ''} [${g.store}]`)
      .join('\n');

    return {
      text: `Auf der Einkaufsliste stehen aktuell **${unchecked.length} Artikel**:\n\n${listStr}${
        unchecked.length > 8 ? `\n...und ${unchecked.length - 8} weitere.` : ''
      }`,
      source: 'local',
    };
  }

  // 5. Meal planning query
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
      } else {
        text = `Für heute Abend ist im Essensplan noch nichts fest eingetragen.`;
        const favorite = data.recipes.find((r) => r.isFavorite) || data.recipes[0];
        if (favorite) {
          text += ` Ein schnelles Familienrezept: **${favorite.title}** (${favorite.prepTime}).`;
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

  // 6. Award stars
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

  // Default fallback response
  return {
    text: `Hallo Familie ${data.familyName}! 👋 Ich bin euer persönlicher Assistent.\n\nIch kann jede Aktion im System für dich ausführen:\n• 🛒 *"Wir brauchen noch Brot und Milch, Adriana kann das auf dem Heimweg mitnehmen"*\n• 📅 *"Erinnere mich morgen um 07:30 an die Tasche"*\n• 📌 *"Häng eine Notiz ans Schwarze Brett"*\n• ⭐ *"Gib Leo 3 Sterne fürs Aufräumen"*\n• 🍲 *"Plan Lachs-Bowl für heute Abend ein"*`,
    source: 'local',
  };
}
