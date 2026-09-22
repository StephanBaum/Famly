import { AppointmentCategory, ChoreFrequency, FamilyMember, GroceryCategory, StoreDefinition } from '../types';
import { inferGroceryCategory } from './recipeParser';
import { format, addDays } from 'date-fns';

export interface ParsedAppointmentItem {
  id: string;
  title: string;
  date: string;
  time: string;
  category: AppointmentCategory;
  memberIds: string[];
}

export interface ParsedChoreItem {
  id: string;
  title: string;
  assignedMemberId: string;
  assignedMemberIds: string[];
  frequency: ChoreFrequency;
  stars: number;
  dueDate?: string;
}

export interface ParsedGroceryItem {
  id: string;
  name: string;
  amount?: string;
  store: string;
  category: GroceryCategory;
}

export interface UniversalParseResult {
  appointments: ParsedAppointmentItem[];
  chores: ParsedChoreItem[];
  groceries: ParsedGroceryItem[];
}

const WEEKDAY_MAP: Record<string, number> = {
  sonntag: 0,
  so: 0,
  montag: 1,
  mo: 1,
  dienstag: 2,
  di: 2,
  mittwoch: 3,
  mi: 3,
  donnerstag: 4,
  do: 4,
  freitag: 5,
  fr: 5,
  samstag: 6,
  sa: 6,
};

function getNextWeekdayDate(dayIndex: number): string {
  const now = new Date();
  const currentDay = now.getDay();
  let diff = dayIndex - currentDay;
  if (diff <= 0) diff += 7;
  const target = addDays(now, diff);
  return format(target, 'yyyy-MM-dd');
}

export function parseUniversalInput(
  rawInput: string,
  members: FamilyMember[],
  stores: StoreDefinition[],
  defaultMemberId?: string | null
): UniversalParseResult {
  const result: UniversalParseResult = {
    appointments: [],
    chores: [],
    groceries: [],
  };

  if (!rawInput || !rawInput.trim()) return result;

  // Split into chunks by sentence terminators or strong separators
  const chunks = rawInput
    .split(/(?:\n|\.|\bund dann\b|\baußerdem\b|\bsowie\b|;)+/i)
    .map((c) => c.trim())
    .filter((c) => c.length > 0);

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const tomorrowStr = format(addDays(new Date(), 1), 'yyyy-MM-dd');
  const dayAfterTomorrowStr = format(addDays(new Date(), 2), 'yyyy-MM-dd');

  chunks.forEach((chunk, chunkIndex) => {
    const lower = chunk.toLowerCase();

    // 1. Detect target date
    let detectedDate = todayStr;
    if (lower.includes('übermorgen')) {
      detectedDate = dayAfterTomorrowStr;
    } else if (lower.includes('morgen')) {
      detectedDate = tomorrowStr;
    } else if (lower.includes('heute')) {
      detectedDate = todayStr;
    } else {
      for (const [dayName, dayIdx] of Object.entries(WEEKDAY_MAP)) {
        const regex = new RegExp(`\\b(am\\s+)?${dayName}\\b`, 'i');
        if (regex.test(lower)) {
          detectedDate = getNextWeekdayDate(dayIdx);
          break;
        }
      }
    }

    // 2. Detect target time
    let detectedTime = '14:00';
    const timeMatch = lower.match(/(?:um\s+)?(\d{1,2})(?::(\d{2})|\s*uhr(?:\s*(\d{2}))?)/i);
    if (timeMatch) {
      const hours = String(timeMatch[1]).padStart(2, '0');
      const minutes = String(timeMatch[2] || timeMatch[3] || '00').padStart(2, '0');
      detectedTime = `${hours}:${minutes}`;
    }

    // 3. Detect associated family members
    const matchedMembers: FamilyMember[] = [];
    members.forEach((m) => {
      const nameLower = m.name.toLowerCase();
      const roleLower = m.role.toLowerCase();
      if (lower.includes(nameLower) || (roleLower && lower.includes(roleLower))) {
        if (!matchedMembers.some((existing) => existing.id === m.id)) {
          matchedMembers.push(m);
        }
      }
    });

    // 4. Detect store if grocery related
    let targetStore = stores[0]?.name || 'Supermarkt';
    stores.forEach((s) => {
      if (lower.includes(s.name.toLowerCase())) {
        targetStore = s.name;
      }
    });

    // 5. Categorize the intent of the chunk
    const isAppointmentCue = /(arzt|zahnarzt|praxis|kinderarzt|training|fußball|tennis|ballett|schwimmen|termin|treffen|geburtstag|konzert|theater|elternabend|kita|schule|uhr|abholen|bringen|meeting)/i.test(
      lower
    );
    const isChoreCue = /(aufräumen|spülmaschine|saugen|staubsaugen|wischen|müll|altglas|spülen|abwasch|putzen|wäsche|aufhängen|zimmer|hasenstall|katzenklo|füttern|gießen|gassi|aufgabe)/i.test(
      lower
    );
    const isGroceryCue = /(kaufen|einkaufen|besorgen|mitbringen|einkaufsliste|supermarkt|drogerie|apotheke|milch|brot|butter|käse|eier|bananen|obst|gemüse)/i.test(
      lower
    );

    // If chunk contains multiple groceries separated by "und" or commas
    if (isGroceryCue && !isAppointmentCue && !isChoreCue) {
      // Check for compound delegation clause like: ", Adriana kann das auf dem Heimweg mitnehmen"
      let delegatedMember: FamilyMember | undefined = undefined;
      let delegationActionText = '';

      const delegationMatch = chunk.match(/[,;]?\s*(?:aber\s+)?(\w+)\s+(?:kann|soll|macht|übernimmt|holt)\s+das(?:\s+auf\s+dem\s+heimweg|\s+nachher|\s+später)?(?:\s+mitnehmen|\s+besorgen|\s+holen)?/i);
      if (delegationMatch) {
        const potentialName = delegationMatch[1].toLowerCase();
        delegatedMember = members.find(
          (m) => m.name.toLowerCase() === potentialName || m.role.toLowerCase() === potentialName
        );
        if (delegatedMember) {
          delegationActionText = delegationMatch[0];
        }
      }

      // Clean grocery phrases and remove delegation clause from grocery text
      let cleanGroceryText = chunk;
      if (delegationActionText) {
        cleanGroceryText = cleanGroceryText.replace(delegationActionText, '');
      }

      cleanGroceryText = cleanGroceryText
        .replace(/(?:wir\s+brauchen\s+(?:noch\s+)?|bitte\s+)?(?:noch\s+)?(?:kauf|kaufen|einkaufen|besorgen|mitbringen|auf\s+die\s+liste|einkaufsliste)(?:\s+bei\s+\w+)?/gi, '')
        .replace(/^wir\s+brauchen\s+(?:noch\s+)?/gi, '')
        .replace(/^(?:und|auch|dann)\s+/i, '')
        .trim();

      const items = cleanGroceryText
        .split(/(?:,|\bund\b)/i)
        .map((i) => i.trim())
        .filter((i) => i.length > 1 && !/^(kann|soll|das|mitnehmen)$/i.test(i));

      const addedGroceryNames: string[] = [];
      items.forEach((item, itemIdx) => {
        // extract quantity if present (e.g. "2x Milch", "500g Mehl")
        let amount: string | undefined = undefined;
        let itemName = item;

        const amountMatch = item.match(/^(\d+x|\d+\s*(?:g|kg|ml|l|liter|flaschen|packung|becher|stück|stk))\s+(.+)$/i);
        if (amountMatch) {
          amount = amountMatch[1];
          itemName = amountMatch[2];
        }

        const cleanName = itemName.replace(/^(ein|eine|einen|etwas)\s+/i, '').trim();
        if (cleanName) {
          const capitalized = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
          addedGroceryNames.push(capitalized);
          result.groceries.push({
            id: `gen_g_${chunkIndex}_${itemIdx}_${Date.now()}`,
            name: capitalized,
            amount,
            store: targetStore,
            category: inferGroceryCategory(cleanName),
          });
        }
      });

      // If a family member was delegated to pick these up, create a dedicated chore/task!
      if (delegatedMember && addedGroceryNames.length > 0) {
        result.chores.push({
          id: `gen_c_delegated_${chunkIndex}_${Date.now()}`,
          title: `${addedGroceryNames.join(' & ')} auf dem Heimweg mitnehmen`,
          assignedMemberId: delegatedMember.id,
          assignedMemberIds: [delegatedMember.id],
          frequency: 'once',
          stars: 2,
          dueDate: todayStr,
        });
      }

      return;
    }

    // Is it a Chore?
    if (isChoreCue && (!isAppointmentCue || lower.includes('spülmaschine') || lower.includes('müll') || lower.includes('aufräumen'))) {
      let choreTitle = chunk
        .replace(/(?:für\s+\w+|bitte|morgen|heute|übermorgen)/gi, '')
        .replace(/^(?:und|dann|auch)\s+/i, '')
        .trim();

      choreTitle = choreTitle.charAt(0).toUpperCase() + choreTitle.slice(1);
      const fallbackId = (defaultMemberId && members.some((m) => m.id === defaultMemberId))
        ? defaultMemberId
        : (members.find((m) => m.isChild)?.id || members[0]?.id || 'm1');
      const assignedId = matchedMembers[0]?.id || fallbackId;
      const assignedIds = matchedMembers.length > 0 ? matchedMembers.map((m) => m.id) : [assignedId];

      result.chores.push({
        id: `gen_c_${chunkIndex}_${Date.now()}`,
        title: choreTitle,
        assignedMemberId: assignedId,
        assignedMemberIds: assignedIds,
        frequency: 'once',
        stars: 3,
        dueDate: detectedDate,
      });
      return;
    }

    // Default to Appointment if time/cue detected or as fallback
    let category: AppointmentCategory = 'family';
    if (/(training|fußball|tennis|sport|turnen|schwimmen|yoga)/i.test(lower)) category = 'sports';
    else if (/(arzt|zahnarzt|praxis|impfen|therapie|krankenhaus)/i.test(lower)) category = 'health';
    else if (/(schule|kita|elternabend|hort|zeugnis)/i.test(lower)) category = 'school';
    else if (/(meeting|arbeit|büro|work|tüv)/i.test(lower)) category = 'work';
    else if (/(party|freunde|treffen|kaffee|grillen)/i.test(lower)) category = 'social';

    let appTitle = chunk
      .replace(/(?:um\s+\d{1,2}(?::\d{2}|\s*uhr(?:\s*\d{2})?)|heute|morgen|übermorgen|montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag)/gi, '')
      .replace(/^(?:und|dann|auch)\s+/i, '')
      .trim();

    appTitle = appTitle.charAt(0).toUpperCase() + appTitle.slice(1);
    // Assign to matched members or creator (defaultMemberId), never blindly to members[0]
    const fallbackAppMember = (defaultMemberId && members.some((m) => m.id === defaultMemberId))
      ? defaultMemberId
      : (members[0]?.id || 'm1');
    const memberIds = matchedMembers.length > 0 ? matchedMembers.map((m) => m.id) : [fallbackAppMember];

    result.appointments.push({
      id: `gen_a_${chunkIndex}_${Date.now()}`,
      title: appTitle || 'Termin',
      date: detectedDate,
      time: detectedTime,
      category,
      memberIds,
    });
  });

  return result;
}
