import { FamilyContextType } from '../context/FamilyContext';
import { saveCustomDailyBriefing } from './briefingService';
import { addFamilyMemory, deleteFamilyMemory } from './familyMemoryService';
import { ActiveTab } from '../components/Header';

export interface ActionExecutionContext {
  family: FamilyContextType;
  navigate?: (tab: ActiveTab) => void;
}

export interface ActionResult {
  success: boolean;
  message: string;
  undoPayload?: any;
}

export interface AppActionDefinition<TPayload = any> {
  type: string;
  domain: 'calendar' | 'groceries' | 'meals' | 'chores' | 'notes' | 'kids' | 'rewards' | 'memory' | 'system';
  title: string;
  description: string;
  promptDoc: string;
  execute: (payload: TPayload, ctx: ActionExecutionContext) => ActionResult;
  undo: (payload: TPayload, ctx: ActionExecutionContext) => ActionResult;
}

// Registry Map
const REGISTRY: Map<string, AppActionDefinition<any>> = new Map();

export function registerAppAction<T = any>(def: AppActionDefinition<T>) {
  REGISTRY.set(def.type, def);
}

export function getRegisteredAction(type: string): AppActionDefinition | undefined {
  return REGISTRY.get(type);
}

export function getAllRegisteredActions(): AppActionDefinition[] {
  return Array.from(REGISTRY.values());
}

/**
 * Dynamically builds the complete tool documentation for the AI model prompt.
 * As new features are registered in REGISTRY, the AI automatically learns them!
 */
export function buildDynamicAgentActionDocs(): string {
  const actions = getAllRegisteredActions();
  const grouped: Record<string, AppActionDefinition[]> = {};

  for (const act of actions) {
    if (!grouped[act.domain]) grouped[act.domain] = [];
    grouped[act.domain].push(act);
  }

  const sections: string[] = [];
  const domainTitles: Record<string, string> = {
    calendar: '1. KALENDER, TERMINE & ERINNERUNGEN',
    groceries: '2. EINKAUF, VORRÄTE & PANTRY',
    meals: '3. ESSENSPLAN & REZEPTE',
    chores: '4. AUFGABEN (CHORES) & STERNENVERGABE',
    notes: '5. SCHWARZES BRETT & NOTIZEN',
    kids: '6. KINDER-DETAILS, GRÖSSEN & ALLERGIEN',
    rewards: '7. BELOHNUNGEN & STERN-SHOP',
    memory: '8. LANGZEIT-GEDÄCHTNIS & FAMILIENFAKTEN',
    system: '9. ROUTINEN & NAVIGATION',
  };

  for (const [domain, items] of Object.entries(grouped)) {
    const title = domainTitles[domain] || domain.toUpperCase();
    const itemsDoc = items.map((i) => `• ${i.promptDoc}`).join('\n');
    sections.push(`${title}:\n${itemsDoc}`);
  }

  return sections.join('\n\n');
}

/**
 * Executes a registered action with full context.
 */
export function executeRegisteredAction(
  type: string,
  payload: any,
  ctx: ActionExecutionContext
): ActionResult {
  const def = REGISTRY.get(type);
  if (!def) {
    return {
      success: false,
      message: `Unbekannte Aktion "${type}".`,
    };
  }
  try {
    return def.execute(payload, ctx);
  } catch (err) {
    console.error(`Execution error for action ${type}:`, err);
    return {
      success: false,
      message: `Fehler beim Ausführen von ${type}: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * Undoes a registered action with full context.
 */
export function undoRegisteredAction(
  type: string,
  payload: any,
  ctx: ActionExecutionContext
): ActionResult {
  const def = REGISTRY.get(type);
  if (!def) {
    return {
      success: false,
      message: `Unbekannte Aktion zum Rückgängigmachen: "${type}".`,
    };
  }
  try {
    return def.undo(payload, ctx);
  } catch (err) {
    console.error(`Undo error for action ${type}:`, err);
    return {
      success: false,
      message: `Fehler beim Rückgängigmachen von ${type}: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

// ============================================================================
// REGISTER CORE FAMLY APP ACTIONS
// ============================================================================

// 1. ADD_APPOINTMENT
registerAppAction({
  type: 'ADD_APPOINTMENT',
  domain: 'calendar',
  title: 'Termin oder Erinnerung eintragen',
  description: 'Trägt einen Termin oder Reminder mit Datum und Uhrzeit in den Kalender ein',
  promptDoc: '[ACTION:ADD_APPOINTMENT:{"title":"...","date":"YYYY-MM-DD","time":"HH:mm","category":"school|family|medical|sport|personal|other","memberNames":["Name"]}]',
  execute: (p, { family }) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const targetDate = p.date || todayStr;
    const memberIds = Array.isArray(p.memberNames) && p.memberNames.length > 0
      ? family.members
          .filter((m) => p.memberNames.some((n: string) => m.name.toLowerCase().includes(n.toLowerCase())))
          .map((m) => m.id)
      : family.members.map((m) => m.id);

    family.addAppointment({
      title: p.title || 'Termin',
      date: targetDate,
      time: p.time || '10:00',
      category: p.category || 'family',
      memberIds: memberIds.length > 0 ? memberIds : family.members.map((m) => m.id),
      notes: p.notes,
      location: p.location,
    });
    return {
      success: true,
      message: `Termin "${p.title}" am ${targetDate} (${p.time || '10:00'}) eingetragen.`,
    };
  },
  undo: (p, { family }) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const targetDate = p.date || todayStr;
    const match = family.appointments.find(
      (a) => a.title.toLowerCase().includes((p.title || '').toLowerCase()) && a.date === targetDate
    );
    if (match) {
      family.deleteAppointment(match.id);
      return { success: true, message: `Termin "${p.title}" gelöscht.` };
    }
    return { success: false, message: `Termin "${p.title}" konnte nicht gefunden werden.` };
  },
});

// 2. DELETE_APPOINTMENT
registerAppAction({
  type: 'DELETE_APPOINTMENT',
  domain: 'calendar',
  title: 'Termin löschen',
  description: 'Löscht einen Termin anhand des Titels oder Datums',
  promptDoc: '[ACTION:DELETE_APPOINTMENT:{"title":"..."}]',
  execute: (p, { family }) => {
    const match = family.appointments.find((a) =>
      a.title.toLowerCase().includes((p.title || '').toLowerCase())
    );
    if (match) {
      family.deleteAppointment(match.id);
      return { success: true, message: `Termin "${match.title}" wurde gelöscht.` };
    }
    return { success: false, message: `Kein passender Termin "${p.title}" gefunden.` };
  },
  undo: () => {
    return { success: false, message: 'Gelöschter Termin kann nicht automatisch wiederhergestellt werden.' };
  },
});

// 3. SCHEDULE_CHORE
registerAppAction({
  type: 'SCHEDULE_CHORE',
  domain: 'calendar',
  title: 'Aufgabe im Kalender einplanen',
  description: 'Plant eine Haushaltsaufgabe in ein bestimmtes Kalender-Zeitfenster ein',
  promptDoc: '[ACTION:SCHEDULE_CHORE:{"title":"...","date":"YYYY-MM-DD","time":"HH:mm","stars":1}]',
  execute: (p, { family }) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const targetDate = p.date || todayStr;
    family.addAppointment({
      title: `🧹 ${p.title || 'Aufgabe'}`,
      date: targetDate,
      time: p.time || '16:00',
      category: 'family',
      memberIds: family.members.map((m) => m.id),
      notes: `${p.stars || 1} ⭐ Stern(e) Belohnung`,
    });
    return {
      success: true,
      message: `Aufgabe "${p.title}" für ${targetDate} (${p.time || '16:00'}) eingeplant.`,
    };
  },
  undo: (p, { family }) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const targetDate = p.date || todayStr;
    const match = family.appointments.find(
      (a) => a.title.includes(p.title) && a.date === targetDate
    );
    if (match) {
      family.deleteAppointment(match.id);
      return { success: true, message: `Aufgabe "${p.title}" aus Kalender entfernt.` };
    }
    return { success: false, message: 'Termin nicht gefunden.' };
  },
});

// 4. ADD_CHORE
registerAppAction({
  type: 'ADD_CHORE',
  domain: 'chores',
  title: 'Neue Aufgabe anlegen',
  description: 'Erstellt eine neue Aufgabe mit Sternen und Zuweisung',
  promptDoc: '[ACTION:ADD_CHORE:{"title":"...","stars":2,"frequency":"daily|weekly|once"}]',
  execute: (p, { family }) => {
    family.addChore(p.title || 'Aufgabe', 'all', p.frequency || 'once', p.stars || 1);
    return { success: true, message: `Aufgabe "${p.title}" angelegt (+${p.stars || 1} ⭐).` };
  },
  undo: (p, { family }) => {
    const match = family.chores.find((c) => c.title.toLowerCase().includes((p.title || '').toLowerCase()));
    if (match) {
      family.deleteChore(match.id);
      return { success: true, message: `Aufgabe "${p.title}" gelöscht.` };
    }
    return { success: false, message: 'Aufgabe nicht gefunden.' };
  },
});

// 5. COMPLETE_CHORE
registerAppAction({
  type: 'COMPLETE_CHORE',
  domain: 'chores',
  title: 'Aufgabe als erledigt markieren',
  description: 'Hakt eine Aufgabe ab und vergibt Sterne',
  promptDoc: '[ACTION:COMPLETE_CHORE:{"title":"...","completedByName":"..."}]',
  execute: (p, { family }) => {
    const match = family.chores.find((c) => c.title.toLowerCase().includes((p.title || '').toLowerCase()));
    if (match) {
      const member = p.completedByName
        ? family.members.find((m) => m.name.toLowerCase().includes(p.completedByName.toLowerCase()))
        : undefined;
      family.toggleChore(match.id, member?.id);
      return { success: true, message: `Aufgabe "${match.title}" erledigt (+${match.stars} ⭐).` };
    }
    return { success: false, message: `Aufgabe "${p.title}" nicht gefunden.` };
  },
  undo: (p, { family }) => {
    const match = family.chores.find((c) => c.title.toLowerCase().includes((p.title || '').toLowerCase()));
    if (match && match.completed) {
      family.toggleChore(match.id);
      return { success: true, message: `Aufgabe "${match.title}" wieder als offen markiert.` };
    }
    return { success: false, message: 'Aufgabe nicht gefunden.' };
  },
});

// 6. DELETE_CHORE
registerAppAction({
  type: 'DELETE_CHORE',
  domain: 'chores',
  title: 'Aufgabe löschen',
  description: 'Löscht eine Aufgabe aus der Aufgabenliste',
  promptDoc: '[ACTION:DELETE_CHORE:{"title":"..."}]',
  execute: (p, { family }) => {
    const match = family.chores.find((c) => c.title.toLowerCase().includes((p.title || '').toLowerCase()));
    if (match) {
      family.deleteChore(match.id);
      return { success: true, message: `Aufgabe "${match.title}" gelöscht.` };
    }
    return { success: false, message: `Aufgabe "${p.title}" nicht gefunden.` };
  },
  undo: () => ({ success: false, message: 'Gelöschte Aufgabe kann nicht wiederhergestellt werden.' }),
});

// 7. AWARD_STARS
registerAppAction({
  type: 'AWARD_STARS',
  domain: 'chores',
  title: 'Sterne an Familienmitglied vergeben',
  description: 'Vergibt Fleißsterne an ein Kind oder Elternteil',
  promptDoc: '[ACTION:AWARD_STARS:{"memberName":"Ida","stars":5,"reason":"..."}]',
  execute: (p, { family }) => {
    const member = family.members.find((m) => m.name.toLowerCase().includes((p.memberName || '').toLowerCase()));
    if (member) {
      const count = Number(p.stars) || 1;
      family.awardStars(member.id, count);
      return { success: true, message: `${count} ⭐ an ${member.name} vergeben!` };
    }
    return { success: false, message: `Familienmitglied "${p.memberName}" nicht gefunden.` };
  },
  undo: (p, { family }) => {
    const member = family.members.find((m) => m.name.toLowerCase().includes((p.memberName || '').toLowerCase()));
    if (member) {
      const count = Number(p.stars) || 1;
      family.awardStars(member.id, -count);
      return { success: true, message: `${count} ⭐ von ${member.name} abgezogen.` };
    }
    return { success: false, message: 'Mitglied nicht gefunden.' };
  },
});

// 8. ADD_GROCERY
registerAppAction({
  type: 'ADD_GROCERY',
  domain: 'groceries',
  title: 'Artikel auf Einkaufsliste setzen',
  description: 'Fügt Artikel mit Geschäft und Menge hinzu',
  promptDoc: '[ACTION:ADD_GROCERY:{"name":"...","store":"Supermarkt","amount":"..."}]',
  execute: (p, { family }) => {
    family.addGrocery(p.name, p.store || 'Supermarkt', p.amount);
    return { success: true, message: `"${p.name}" auf die Einkaufsliste gesetzt.` };
  },
  undo: (p, { family }) => {
    const match = family.groceries.find(
      (g) => g.name.toLowerCase().trim() === (p.name || '').toLowerCase().trim() && !g.checked
    );
    if (match) {
      family.deleteGrocery(match.id);
      return { success: true, message: `"${p.name}" von der Einkaufsliste entfernt.` };
    }
    return { success: false, message: 'Artikel nicht gefunden.' };
  },
});

// 9. CHECK_GROCERY
registerAppAction({
  type: 'CHECK_GROCERY',
  domain: 'groceries',
  title: 'Artikel im Laden abhaken',
  description: 'Markiert einen Artikel als gekauft/erledigt',
  promptDoc: '[ACTION:CHECK_GROCERY:{"name":"..."}]',
  execute: (p, { family }) => {
    const match = family.groceries.find((g) => g.name.toLowerCase().includes((p.name || '').toLowerCase()));
    if (match) {
      if (!match.checked) family.toggleGrocery(match.id);
      return { success: true, message: `"${match.name}" abgehakt 🛒` };
    }
    return { success: false, message: `Artikel "${p.name}" nicht gefunden.` };
  },
  undo: (p, { family }) => {
    const match = family.groceries.find((g) => g.name.toLowerCase().includes((p.name || '').toLowerCase()));
    if (match && match.checked) {
      family.toggleGrocery(match.id);
      return { success: true, message: `"${match.name}" wieder als offen markiert.` };
    }
    return { success: false, message: 'Artikel nicht gefunden.' };
  },
});

// 10. DELETE_GROCERY
registerAppAction({
  type: 'DELETE_GROCERY',
  domain: 'groceries',
  title: 'Artikel von Liste löschen',
  description: 'Entfernt einen Artikel von der Einkaufsliste',
  promptDoc: '[ACTION:DELETE_GROCERY:{"name":"..."}]',
  execute: (p, { family }) => {
    const match = family.groceries.find((g) => g.name.toLowerCase().includes((p.name || '').toLowerCase()));
    if (match) {
      family.deleteGrocery(match.id);
      return { success: true, message: `"${match.name}" von der Liste gelöscht.` };
    }
    return { success: false, message: `Artikel "${p.name}" nicht gefunden.` };
  },
  undo: () => ({ success: false, message: 'Gelöschter Artikel kann nicht wiederhergestellt werden.' }),
});

// 11. CLEAR_CHECKED_GROCERIES
registerAppAction({
  type: 'CLEAR_CHECKED_GROCERIES',
  domain: 'groceries',
  title: 'Abgehakte Einkäufe leeren',
  description: 'Entfernt alle erledigten Artikel aus dem Einkaufskorb',
  promptDoc: '[ACTION:CLEAR_CHECKED_GROCERIES:{}]',
  execute: (_p, { family }) => {
    family.clearCheckedGroceries();
    return { success: true, message: 'Erledigte Einkäufe aus dem Korb geleert.' };
  },
  undo: () => ({ success: false, message: 'Geleerte Artikel können nicht wiederhergestellt werden.' }),
});

// 12. ADD_ALWAYS_IN_STOCK
registerAppAction({
  type: 'ADD_ALWAYS_IN_STOCK',
  domain: 'groceries',
  title: 'Artikel zu Vorräten hinzufügen',
  description: 'Fügt Artikel zu "Immer daheim" hinzu',
  promptDoc: '[ACTION:ADD_ALWAYS_IN_STOCK:{"name":"..."}]',
  execute: (p, { family }) => {
    if (!family.isItemInStock(p.name)) {
      family.toggleAlwaysInStock(p.name);
    }
    return { success: true, message: `"${p.name}" zu ständigen Vorräten hinzugefügt 🏠` };
  },
  undo: (p, { family }) => {
    if (family.isItemInStock(p.name)) {
      family.toggleAlwaysInStock(p.name);
      return { success: true, message: `"${p.name}" aus Vorräten entfernt.` };
    }
    return { success: false, message: 'Artikel nicht in Vorräten.' };
  },
});

// 13. CLEAN_SHOPPING_LIST
registerAppAction({
  type: 'CLEAN_SHOPPING_LIST',
  domain: 'groceries',
  title: 'Einkaufsliste bereinigen',
  description: 'Löscht alte ungeshoppte Zutaten vergangener Kochtage',
  promptDoc: '[ACTION:CLEAN_SHOPPING_LIST:{}]',
  execute: (_p, { family }) => {
    const res = family.cleanPastMealGroceries();
    return {
      success: true,
      message: res.removedCount > 0
        ? `${res.removedCount} veraltete Zutat(en) vergangener Tage bereinigt.`
        : 'Einkaufsliste ist bereits aktuell.',
    };
  },
  undo: () => ({ success: false, message: 'Bereinigte Artikel können nicht wiederhergestellt werden.' }),
});

// 14. SET_MEAL
registerAppAction({
  type: 'SET_MEAL',
  domain: 'meals',
  title: 'Gericht in Essensplan eintragen',
  description: 'Plant ein Frühstück, Mittag- oder Abendessen für ein Datum',
  promptDoc: '[ACTION:SET_MEAL:{"title":"...","date":"YYYY-MM-DD","slot":"dinner|lunch|breakfast"}]',
  execute: (p, { family }) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const targetDate = p.date || todayStr;
    const slot = p.slot || 'dinner';
    family.setMealSlot(targetDate, slot, { title: p.title });
    return { success: true, message: `"${p.title}" für ${targetDate} (${slot}) eingeplant. 🍲` };
  },
  undo: (p, { family }) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const targetDate = p.date || todayStr;
    family.setMealSlot(targetDate, p.slot || 'dinner', { title: '' });
    return { success: true, message: `Essensplan für ${targetDate} geleert.` };
  },
});

// 15. CLEAR_MEAL
registerAppAction({
  type: 'CLEAR_MEAL',
  domain: 'meals',
  title: 'Essensplan für Tag leeren',
  description: 'Löscht die Mahlzeit an einem Tag',
  promptDoc: '[ACTION:CLEAR_MEAL:{"date":"YYYY-MM-DD","slot":"dinner"}]',
  execute: (p, { family }) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const targetDate = p.date || todayStr;
    family.setMealSlot(targetDate, p.slot || 'dinner', { title: '' });
    return { success: true, message: `Essensplan für ${targetDate} geleert.` };
  },
  undo: () => ({ success: false, message: 'Geleertes Essen kann nicht wiederhergestellt werden.' }),
});

// 16. ADD_RECIPE_TO_GROCERIES
registerAppAction({
  type: 'ADD_RECIPE_TO_GROCERIES',
  domain: 'meals',
  title: 'Rezept-Zutaten zur Einkaufsliste',
  description: 'Überträgt alle Zutaten eines Rezepts auf die Einkaufsliste',
  promptDoc: '[ACTION:ADD_RECIPE_TO_GROCERIES:{"title":"..."}]',
  execute: (p, { family }) => {
    const recipe = family.recipes.find((r) => r.title.toLowerCase().includes((p.title || '').toLowerCase()));
    if (recipe) {
      const res = family.addRecipeIngredientsToGrocery(recipe);
      return { success: true, message: `${res.addedCount} Zutat(en) für "${recipe.title}" zur Einkaufsliste hinzugefügt!` };
    }
    return { success: false, message: `Rezept "${p.title}" nicht gefunden.` };
  },
  undo: (p, { family }) => {
    const recipe = family.recipes.find((r) => r.title.toLowerCase().includes((p.title || '').toLowerCase()));
    if (recipe) {
      family.removeGroceriesForMeal(new Date().toISOString().split('T')[0], { recipeId: recipe.id });
      return { success: true, message: `Zutaten für "${recipe.title}" entfernt.` };
    }
    return { success: false, message: 'Rezept nicht gefunden.' };
  },
});

// 17. ADD_RECIPE
registerAppAction({
  type: 'ADD_RECIPE',
  domain: 'meals',
  title: 'Rezept in Rezeptbox speichern',
  description: 'Speichert ein neues Kochrezept ab',
  promptDoc: '[ACTION:ADD_RECIPE:{"title":"...","prepTime":"25 Min","ingredients":[{"name":"...","amount":"..."}]}]',
  execute: (p, { family }) => {
    family.addRecipe({
      title: p.title || 'Rezept',
      prepTime: p.prepTime || '25 Min',
      servings: p.servings || 4,
      category: p.category || 'family-favorite',
      imageUrl: p.imageUrl || 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=600&q=80',
      ingredients: p.ingredients || [],
      instructions: p.instructions || [],
      isFavorite: false,
      tags: p.tags || ['Familie'],
    });
    return { success: true, message: `Rezept "${p.title}" in Rezeptbox gespeichert! 🍲` };
  },
  undo: (p, { family }) => {
    const match = family.recipes.find((r) => r.title.toLowerCase().includes((p.title || '').toLowerCase()));
    if (match) {
      family.deleteRecipe(match.id);
      return { success: true, message: `Rezept "${match.title}" gelöscht.` };
    }
    return { success: false, message: 'Rezept nicht gefunden.' };
  },
});

// 18. FAVORITE_RECIPE
registerAppAction({
  type: 'FAVORITE_RECIPE',
  domain: 'meals',
  title: 'Rezept favorisieren',
  description: 'Setzt ein Rezept auf Favoriten-Status',
  promptDoc: '[ACTION:FAVORITE_RECIPE:{"title":"..."}]',
  execute: (p, { family }) => {
    const match = family.recipes.find((r) => r.title.toLowerCase().includes((p.title || '').toLowerCase()));
    if (match) {
      family.toggleFavoriteRecipe(match.id);
      return { success: true, message: `"${match.title}" als Favorit markiert ⭐` };
    }
    return { success: false, message: `Rezept "${p.title}" nicht gefunden.` };
  },
  undo: (p, { family }) => {
    const match = family.recipes.find((r) => r.title.toLowerCase().includes((p.title || '').toLowerCase()));
    if (match) {
      family.toggleFavoriteRecipe(match.id);
      return { success: true, message: `Favoritenstatus von "${match.title}" entfernt.` };
    }
    return { success: false, message: 'Rezept nicht gefunden.' };
  },
});

// 19. ADD_NOTE
registerAppAction({
  type: 'ADD_NOTE',
  domain: 'notes',
  title: 'Notiz ans Schwarze Brett pinnen',
  description: 'Pinnt eine Notiz (WLAN, Wichtig, Info, Spaß) an die Pinnwand',
  promptDoc: '[ACTION:ADD_NOTE:{"title":"...","content":"...","tag":"wifi|urgent|info|fun"}]',
  execute: (p, { family }) => {
    family.addNote(p.title || 'Notiz', p.content || p.title || '', p.tag || 'info', true);
    return { success: true, message: `Notiz "${p.title}" an die Pinnwand geheftet 📌` };
  },
  undo: (p, { family }) => {
    const match = family.notes.find((n) => n.title.toLowerCase().includes((p.title || '').toLowerCase()));
    if (match) {
      family.deleteNote(match.id);
      return { success: true, message: `Notiz "${match.title}" von Pinnwand entfernt.` };
    }
    return { success: false, message: 'Notiz nicht gefunden.' };
  },
});

// 20. DELETE_NOTE
registerAppAction({
  type: 'DELETE_NOTE',
  domain: 'notes',
  title: 'Notiz von Pinnwand entfernen',
  description: 'Löscht eine Notiz vom Schwarzen Brett',
  promptDoc: '[ACTION:DELETE_NOTE:{"title":"..."}]',
  execute: (p, { family }) => {
    const match = family.notes.find(
      (n) => (p.id && n.id === p.id) || n.title.toLowerCase().includes((p.title || '').toLowerCase())
    );
    if (match) {
      family.deleteNote(match.id);
      return { success: true, message: `Notiz "${match.title}" entfernt.` };
    }
    return { success: false, message: `Notiz "${p.title}" nicht gefunden.` };
  },
  undo: () => ({ success: false, message: 'Gelöschte Notiz kann nicht wiederhergestellt werden.' }),
});

// 21. UPDATE_CHILD_DETAILS
registerAppAction({
  type: 'UPDATE_CHILD_DETAILS',
  domain: 'kids',
  title: 'Kinder-Details aktualisieren',
  description: 'Aktualisiert Schuhgröße, Kleidergröße, Allergien oder Schule eines Kindes',
  promptDoc: '[ACTION:UPDATE_CHILD_DETAILS:{"childName":"Ida","clothingSize":"128","shoeSize":"31","allergies":"..."}]',
  execute: (p, { family }) => {
    const kid = family.members.find(
      (m) => m.name.toLowerCase().includes((p.childName || '').toLowerCase())
    );
    if (kid) {
      family.updateMember(kid.id, {
        childDetails: {
          clothingSize: p.clothingSize || kid.childDetails?.clothingSize,
          shoeSize: p.shoeSize || kid.childDetails?.shoeSize,
          allergies: p.allergies !== undefined ? p.allergies : kid.childDetails?.allergies,
          grade: p.grade || kid.childDetails?.grade,
          doctorName: p.doctorName || kid.childDetails?.doctorName,
          emergencyContact: p.emergencyContact || kid.childDetails?.emergencyContact,
        },
      });
      return { success: true, message: `Größen/Details für ${kid.name} aktualisiert 🧸` };
    }
    return { success: false, message: `Kind "${p.childName}" nicht gefunden.` };
  },
  undo: () => ({ success: false, message: 'Vorherige Maße wurden überschrieben.' }),
});

// 22. ADD_REWARD
registerAppAction({
  type: 'ADD_REWARD',
  domain: 'rewards',
  title: 'Neue Belohnung anlegen',
  description: 'Erstellt eine neue Belohnung mit Sternkosten im Belohnungs-Shop',
  promptDoc: '[ACTION:ADD_REWARD:{"title":"Großes Eis","starsCost":15,"icon":"🍦"}]',
  execute: (p, { family }) => {
    family.addReward(p.title || 'Belohnung', Number(p.starsCost) || 10, p.icon || '🎁', p.description);
    return { success: true, message: `Belohnung "${p.title}" angelegt 🎁` };
  },
  undo: (p, { family }) => {
    const match = family.rewards.find((r) => r.title.toLowerCase().includes((p.title || '').toLowerCase()));
    if (match) {
      family.deleteReward(match.id);
      return { success: true, message: `Belohnung "${match.title}" gelöscht.` };
    }
    return { success: false, message: 'Belohnung nicht gefunden.' };
  },
});

// 23. CLAIM_REWARD
registerAppAction({
  type: 'CLAIM_REWARD',
  domain: 'rewards',
  title: 'Belohnung für Kind einlösen',
  description: 'Löst eine Belohnung ein und zieht Sterne ab',
  promptDoc: '[ACTION:CLAIM_REWARD:{"title":"...","memberName":"..."}]',
  execute: (p, { family }) => {
    const reward = family.rewards.find((r) => r.title.toLowerCase().includes((p.title || '').toLowerCase()));
    const member = p.memberName
      ? family.members.find((m) => m.name.toLowerCase().includes(p.memberName.toLowerCase()))
      : family.currentMember;
    if (reward && member) {
      const ok = family.claimReward(reward.id, member.id);
      if (ok) {
        return { success: true, message: `Belohnung "${reward.title}" für ${member.name} eingelöst! 🎉` };
      }
      return { success: false, message: `Nicht genügend Sterne für "${reward.title}".` };
    }
    return { success: false, message: 'Belohnung oder Mitglied nicht gefunden.' };
  },
  undo: () => ({ success: false, message: 'Eingelöste Belohnung kann nicht rückabgewickelt werden.' }),
});

// 24. SET_MORNING_BRIEFING
registerAppAction({
  type: 'SET_MORNING_BRIEFING',
  domain: 'system',
  title: 'Morgengrüße speichern',
  description: 'Speichert persönliche Morgengrüße im Dashboard-Routine-Cache',
  promptDoc: '[ACTION:SET_MORNING_BRIEFING:{"headline":"...","summary":"...","highlights":["..."]}]',
  execute: (p) => {
    saveCustomDailyBriefing(p);
    return { success: true, message: 'Morgengrüße in Dashboard-Routine gespeichert ☀️' };
  },
  undo: () => ({ success: true, message: 'Morgengrüße zurückgesetzt.' }),
});

// 25. NAVIGATE
registerAppAction({
  type: 'NAVIGATE',
  domain: 'system',
  title: 'Zu Bereich navigieren',
  description: 'Navigiert zu einem App-Bereich',
  promptDoc: '[ACTION:NAVIGATE:{"tab":"dashboard|calendar|meals|lists|memories|members"}]',
  execute: (p, { navigate }) => {
    if (navigate && p.tab) {
      navigate(p.tab as ActiveTab);
      return { success: true, message: `Zu "${p.tab}" gewechselt.` };
    }
    return { success: false, message: 'Navigation nicht möglich.' };
  },
  undo: (_p, { navigate }) => {
    if (navigate) navigate('dashboard');
    return { success: true, message: 'Zurück zum Dashboard.' };
  },
});

// 26. SAVE_MEMORY
registerAppAction({
  type: 'SAVE_MEMORY',
  domain: 'memory',
  title: 'Fakt im Langzeit-Gedächtnis merken',
  description: 'Speichert wichtige Fakten, Vorlieben, Regeln oder Wissenswertes im persistenten Langzeitgedächtnis & Upstash Vector Store für alle Familienmitglieder',
  promptDoc: '[ACTION:SAVE_MEMORY:{"text":"...","category":"preference|allergy|schedule|rule|general"}]',
  execute: (p) => {
    if (!p.text || !p.text.trim()) {
      return { success: false, message: 'Kein Inhalt zum Merken angegeben.' };
    }
    const mem = addFamilyMemory(p.text, p.category || 'general', 4);
    return {
      success: true,
      message: `Fakt gemerkt: "${mem.text}" 🧠 (Für alle Geräte gespeichert)`,
      undoPayload: { id: mem.id },
    };
  },
  undo: (p) => {
    if (p.id) {
      deleteFamilyMemory(p.id);
      return { success: true, message: 'Fakt aus Gedächtnis entfernt.' };
    }
    return { success: false, message: 'Konnte nicht gelöscht werden.' };
  },
});

// 27. DELETE_MEMORY
registerAppAction({
  type: 'DELETE_MEMORY',
  domain: 'memory',
  title: 'Fakt aus Gedächtnis löschen',
  description: 'Entfernt einen Fakt aus dem Langzeit-Gedächtnis',
  promptDoc: '[ACTION:DELETE_MEMORY:{"id":"..."}]',
  execute: (p) => {
    if (p.id) {
      deleteFamilyMemory(p.id);
      return { success: true, message: 'Erinnerung gelöscht.' };
    }
    return { success: false, message: 'Keine ID angegeben.' };
  },
  undo: () => ({ success: false, message: 'Gelöschte Erinnerung kann nicht wiederhergestellt werden.' }),
});

