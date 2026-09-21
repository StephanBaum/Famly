import { Recipe, FamilyMember, Chore, Appointment, MealPlanDay } from '../types';
import { getAIConfig, resolveGeminiFlashModel } from './aiRecipeService';
import { formatMemoriesForPrompt } from './familyMemoryService';

export interface DecisionOption {
  id: string;
  title: string;
  score: number; // 0..1 calibrated fit score
  percentage: number; // 0..100
  badge?: string;
  pros: string[];
  cons: string[];
  payload?: any;
}

export interface DecisionResult {
  mode: 'dinner' | 'chores' | 'activity' | 'custom';
  question: string;
  winner: DecisionOption;
  options: DecisionOption[];
  summary: string;
  timestamp: number;
}

/**
 * Normalizes an array of raw weights into calibrated probability scores (softmax-like)
 */
function calibrateScores(options: Array<{ rawWeight: number } & Omit<DecisionOption, 'score' | 'percentage'>>): DecisionOption[] {
  const minScore = 0.05;
  const weights = options.map((o) => Math.max(minScore, o.rawWeight));
  const sum = weights.reduce((acc, w) => acc + w, 0);

  const scored = options.map((opt, idx) => {
    const probability = sum > 0 ? weights[idx] / sum : 1 / options.length;
    return {
      id: opt.id,
      title: opt.title,
      score: Number(probability.toFixed(3)),
      percentage: Math.round(probability * 100),
      badge: opt.badge,
      pros: opt.pros,
      cons: opt.cons,
      payload: opt.payload,
    };
  });

  return scored.sort((a, b) => b.score - a.score);
}

/**
 * Open-Jev System 1 Dinner Decider
 * Checks weekly meal plan first to avoid conflicts, or proposes for open days.
 */
export function decideMeal(
  candidateRecipes: Recipe[],
  pantryIngredients: string[],
  todaysAppointments: Appointment[] = [],
  maxTimeMinutes: number = 45,
  mealPlans: MealPlanDay[] = [],
  targetDateStr?: string
): DecisionResult {
  const activeDate = targetDateStr || new Date().toISOString().split('T')[0];
  const existingPlan = mealPlans.find((mp) => mp.date === activeDate);

  // If a meal is already scheduled in the meal plan for this date, honor it!
  if (existingPlan?.dinner?.title) {
    const matchingRecipe = candidateRecipes.find(
      (r) => r.id === existingPlan.dinner?.recipeId || r.title.toLowerCase() === existingPlan.dinner?.title.toLowerCase()
    );

    const plannedOption: DecisionOption = {
      id: matchingRecipe?.id || 'planned_meal',
      title: existingPlan.dinner.title,
      score: 1.0,
      percentage: 100,
      badge: '🗓️ Laut Essensplan',
      pros: [
        'Bereits fest im Familien-Essensplan eingetragen',
        matchingRecipe ? `Zubereitungszeit: ${matchingRecipe.prepTime}` : 'Planmäßiges Gericht',
      ],
      cons: [],
      payload: matchingRecipe || { id: 'planned', title: existingPlan.dinner.title },
    };

    return {
      mode: 'dinner',
      question: `Was kochen wir heute (${activeDate})?`,
      winner: plannedOption,
      options: [plannedOption],
      summary: `Für heute ist laut Essensplan bereits "${existingPlan.dinner.title}" vorgesehen.`,
      timestamp: Date.now(),
    };
  }
  const hasLateAppt = todaysAppointments.some((a) => {
    const hour = parseInt(a.time.split(':')[0] || '12', 10);
    return hour >= 16;
  });

  const rawOptions = candidateRecipes.map((recipe) => {
    let weight = 1.0;
    const pros: string[] = [];
    const cons: string[] = [];

    // 1. Time evaluation
    const prepTime = parseInt(recipe.prepTime) || 25;
    if (prepTime <= 20) {
      weight += 0.8;
      pros.push(`⚡ Superschnell fertig (${recipe.prepTime || `${prepTime} Min.`})`);
    } else if (prepTime <= maxTimeMinutes) {
      weight += 0.3;
      pros.push(`⏱️ Passt ins Zeitfenster (${recipe.prepTime || `${prepTime} Min.`})`);
    } else {
      weight -= 0.5;
      cons.push(`⏳ Dauert etwas länger (${recipe.prepTime || `${prepTime} Min.`})`);
    }

    if (hasLateAppt && prepTime <= 25) {
      weight += 0.6;
      pros.push('📅 Ideal bei heutigen Nachmittagsterminen');
    }

    // 2. Pantry ingredients matching
    const matchingCount = recipe.ingredients.filter((ing) =>
      pantryIngredients.some((item) =>
        ing.name.toLowerCase().includes(item.toLowerCase()) ||
        item.toLowerCase().includes(ing.name.toLowerCase())
      )
    ).length;

    if (matchingCount > 0) {
      const boost = Math.min(matchingCount * 0.4, 1.2);
      weight += boost;
      pros.push(`🥕 Nutzt ${matchingCount} vorhandene Zutaten`);
    }

    // 3. Child friendliness / popularity
    if (recipe.isFavorite) {
      weight += 0.5;
      pros.push('⭐ Familien-Lieblingsgericht');
    }

    return {
      id: recipe.id,
      title: recipe.title,
      badge: recipe.prepTime || `${prepTime} Min.`,
      rawWeight: Math.max(0.1, weight),
      pros,
      cons,
      payload: recipe,
    };
  });

  const calibrated = calibrateScores(rawOptions);
  const winner = calibrated[0];

  return {
    mode: 'dinner',
    question: 'Was kochen wir heute Abend?',
    winner,
    options: calibrated,
    summary: `${winner.title} gewinnt mit ${winner.percentage}% Übereinstimmung (${winner.pros[0] || 'Optimale Wahl'}).`,
    timestamp: Date.now(),
  };
}

/**
 * Open-Jev System 1 Chore Arbitrator
 * Decides fairly who should do a task based on stars, schedule stress, and fairness
 */
export function decideChoreAssignee(
  chore: Chore,
  members: FamilyMember[],
  todaysAppointments: Appointment[] = []
): DecisionResult {
  const eligible = members.filter((m) => {
    if (chore.assignedMemberIds && chore.assignedMemberIds.length > 0) {
      return chore.assignedMemberIds.includes(m.id);
    }
    return true;
  });

  const candidates = eligible.length > 0 ? eligible : members;

  const rawOptions = candidates.map((member) => {
    let weight = 1.0;
    const pros: string[] = [];
    const cons: string[] = [];

    // 1. Star balance (give opportunities to members with fewer stars)
    const stars = member.stars || 0;
    if (stars < 15) {
      weight += 0.6;
      pros.push(`⭐ Kann Sterne gut gebrauchen (${stars} ★)`);
    } else {
      cons.push(`Hat bereits ${stars} Sterne`);
    }

    // 2. Schedule stress today
    const memberApps = todaysAppointments.filter((a) => a.memberIds.includes(member.id));
    if (memberApps.length === 0) {
      weight += 0.7;
      pros.push('🗓️ Heute keine Termine – freie Kapazität');
    } else {
      weight -= 0.4 * memberApps.length;
      cons.push(`Hat heute ${memberApps.length} Termin(e)`);
    }

    // 3. Child preference for chores
    if (member.isChild) {
      weight += 0.2;
      pros.push('👦 Kindgerechte Alltagsaufgabe');
    }

    return {
      id: member.id,
      title: `${member.avatar} ${member.name}`,
      badge: `${member.stars || 0} ★`,
      rawWeight: Math.max(0.1, weight),
      pros,
      cons,
      payload: member,
    };
  });

  const calibrated = calibrateScores(rawOptions);
  const winner = calibrated[0];

  return {
    mode: 'chores',
    question: `Wer übernimmt "${chore.title}"?`,
    winner,
    options: calibrated,
    summary: `${winner.title} ist an der Reihe (${winner.percentage}% Fairness-Score).`,
    timestamp: Date.now(),
  };
}

/**
 * Open-Jev System 1 Activity Decider
 * Selects weekend activities taking weather and family constraints into account
 */
export function decideActivity(
  activities: Array<{ title: string; isOutdoor: boolean; durationHours: number; costLevel: 'free' | 'low' | 'high' }>,
  weatherDesc: string = '',
  isRaining: boolean = false,
  tempCelsius: number = 18
): DecisionResult {
  const rawOptions = activities.map((act, index) => {
    let weight = 1.0;
    const pros: string[] = [];
    const cons: string[] = [];

    // Weather match
    if (act.isOutdoor) {
      if (isRaining) {
        weight -= 1.2;
        cons.push(`🌧️ Draußen bei Regen (${weatherDesc || 'Nass'}) ungemütlich`);
      } else if (tempCelsius >= 18) {
        weight += 0.9;
        pros.push(`☀️ Schönes Wetter für draußen (${tempCelsius}°C)`);
      } else {
        weight += 0.2;
        pros.push(`Frische Luft (${tempCelsius}°C)`);
      }
    } else {
      if (isRaining) {
        weight += 1.0;
        pros.push('🏠 Trocken & perfekt bei Regenwetter');
      } else {
        pros.push('Wetterunabhängig');
      }
    }

    // Cost match
    if (act.costLevel === 'free') {
      weight += 0.5;
      pros.push('💰 Kostenlos');
    } else if (act.costLevel === 'high') {
      weight -= 0.3;
      cons.push('Höheres Budget');
    }

    return {
      id: `act-${index}`,
      title: act.title,
      badge: act.isOutdoor ? '🌲 Outdoor' : '🏠 Indoor',
      rawWeight: Math.max(0.1, weight),
      pros,
      cons,
      payload: act,
    };
  });

  const calibrated = calibrateScores(rawOptions);
  const winner = calibrated[0];

  return {
    mode: 'activity',
    question: 'Was unternehmen wir heute / am Wochenende?',
    winner,
    options: calibrated,
    summary: `Empfehlung: ${winner.title} (${winner.percentage}% Match).`,
    timestamp: Date.now(),
  };
}

/**
 * Autonomous AI Deliberation Engine powered by Gemini 3+ Flash.
 * Takes a family dilemma, consults family members, schedules, and long-term memories,
 * formulates 3 tailored options itself, and computes genuine trade-offs.
 */
export async function decideAutonomous(
  question: string,
  familyData: {
    familyName: string;
    members: FamilyMember[];
    appointments: Appointment[];
    chores: Chore[];
    recipes: Recipe[];
    mealPlans: MealPlanDay[];
  }
): Promise<DecisionResult> {
  const cleanQuestion = question.trim() || 'Was unternehmen wir als Familie?';
  const aiConfig = getAIConfig();
  const memoriesContext = formatMemoriesForPrompt(cleanQuestion);

  const membersInfo = (familyData.members || [])
    .map((m) => `${m.name} (${m.role}${m.isChild ? ', Kind' : ''})`)
    .join(', ');

  const prompt = `
Du bist ein moderner, intelligenter Familienrat-Moderator für Familie ${familyData.familyName || 'Familie'}.
Die Familie hat folgendes Dilemma / folgende Frage eingereicht:
"${cleanQuestion}"

FAMILIENKONTEXT:
- Mitglieder: ${membersInfo || 'Familie'}
- Bekannte Vorlieben & Langzeit-Gedächtnis:
${memoriesContext}

DEINE AUFGABE:
1. Erfinde selbstständig genau 3 unterschiedliche, kreative und machbare Optionen (die Familie muss keine Optionen vorgeben).
2. Bewerte jede Option objektiv mit realistischen Vorteilen ("pros") und Nachteilen ("cons").
3. Vergib jeder Option einen passenden Eignungs-Score von 1 bis 100 (unterschiedlich gewichtet nach Machbarkeit, Familienfreude und Aufwand).
4. Bestimme die Gewinner-Option und begründe in 1-2 Sätzen ("summary"), warum diese Option für die Familie aktuell der beste Konsens ist.

Antworte AUSSCHLIESSLICH mit reinem JSON ohne Markdown-Code-Fences:
{
  "summary": "Begründung für die Familie...",
  "options": [
    {
      "id": "opt_1",
      "title": "Konkreter Titel von Option 1",
      "badge": "z.B. Größter Spaß / Wetterfest / Entspannt",
      "score": 88,
      "pros": ["Vorteil 1", "Vorteil 2"],
      "cons": ["Möglicher Nachteil"]
    },
    {
      "id": "opt_2",
      "title": "Konkreter Titel von Option 2",
      "badge": "z.B. Kreativ & Aktiv",
      "score": 76,
      "pros": ["Vorteil 1"],
      "cons": ["Nachteil"]
    },
    {
      "id": "opt_3",
      "title": "Konkreter Titel von Option 3",
      "badge": "z.B. Schnell & Sparsam",
      "score": 65,
      "pros": ["Vorteil 1"],
      "cons": ["Nachteil"]
    }
  ],
  "winnerId": "opt_1"
}
`.trim();

  if (aiConfig?.apiKey && aiConfig.provider === 'gemini') {
    try {
      const model = await resolveGeminiFlashModel(aiConfig.apiKey);
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${aiConfig.apiKey}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            response_mime_type: 'application/json',
            temperature: 0.4,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed.options) && parsed.options.length > 0) {
            const rawOpts = parsed.options.map((o: any, idx: number) => ({
              id: o.id || `opt_${idx}`,
              title: o.title || `Option ${idx + 1}`,
              badge: o.badge,
              rawWeight: typeof o.score === 'number' ? Math.max(1, o.score) : 50,
              pros: Array.isArray(o.pros) ? o.pros : [],
              cons: Array.isArray(o.cons) ? o.cons : [],
            }));

            const calibrated = calibrateScores(rawOpts);
            const winner =
              calibrated.find((c) => c.id === parsed.winnerId) || calibrated[0];

            return {
              mode: 'custom',
              question: cleanQuestion,
              winner,
              options: calibrated,
              summary: parsed.summary || `${winner.title} hat die höchste Übereinstimmung (${winner.percentage}%).`,
              timestamp: Date.now(),
            };
          }
        }
      }
    } catch (e) {
      console.warn('Autonomous AI decision failed, falling back to smart local deliberation:', e);
    }
  }

  // Smart Contextual Local Fallback Engine (Topic-aware, never blindly picking #2)
  const q = cleanQuestion.toLowerCase();
  let fallbackOptions: Array<{ title: string; badge: string; rawWeight: number; pros: string[]; cons: string[] }> = [];

  if (q.includes('film') || q.includes('kino') || q.includes('video') || q.includes('serie')) {
    fallbackOptions = [
      {
        title: 'Animationsfilm / Familienhit (z.B. Pixar oder Disney Klassiker)',
        badge: '🍿 Beliebt bei allen Altersgruppen',
        rawWeight: 88,
        pros: ['Gute Laune garantiert', 'Für jüngere Kinder bestens geeignet'],
        cons: ['Eventuell schon einmal gesehen'],
      },
      {
        title: 'Spannendes Familien-Naturabenteuer (z.B. BBC Erdmännchen / Unsere Erde)',
        badge: '🌍 Faszinierend & Lehrreich',
        rawWeight: 78,
        pros: ['Faszinierende Bilder', 'Gemeinsamer Gesprächsstoff'],
        cons: ['Braucht etwas mehr Aufmerksamkeit'],
      },
      {
        title: 'Humorvoller Comedy-Klassiker (z.B. Paddington oder Nachts im Museum)',
        badge: '😂 Viel zum Lachen',
        rawWeight: 82,
        pros: ['Sehr unterhaltsam für Eltern & Kids', 'Kurzweilig'],
        cons: ['Teilweise etwas temporeich'],
      },
    ];
  } else if (q.includes('regen') || q.includes('schlecht') || q.includes('wetter') || q.includes('drinnen')) {
    fallbackOptions = [
      {
        title: 'Großer Familien-Spielemarathon mit Snack-Buffet',
        badge: '🎲 Gemütlich & Wetterunabhängig',
        rawWeight: 86,
        pros: ['Kein Verlassen des Hauses nötig', 'Stärkt das Gemeinschaftsgefühl'],
        cons: ['Benötigt Einigung auf Spielregeln'],
      },
      {
        title: 'Kreatives Back- oder Kochprojekt (z.B. Waffeln oder Mini-Pizzen)',
        badge: '🍕 Lecker & Interaktiv',
        rawWeight: 84,
        pros: ['Kinder können aktiv mithelfen', 'Sofortiges leckeres Ergebnis'],
        cons: ['Etwas Aufräumarbeit in der Küche'],
      },
      {
        title: 'Ausflug in Hallenbad, Museum oder Indoor-Spielplatz',
        badge: '⚡ Viel Bewegung',
        rawWeight: 72,
        pros: ['Kinder powern sich aus', 'Besonderes Erlebnis'],
        cons: ['Eintrittskosten und Anfahrt'],
      },
    ];
  } else {
    fallbackOptions = [
      {
        title: 'Gemeinsame Aktivität mit klarem Zeitfenster (z.B. 1,5 Stunden)',
        badge: '⚖️ Ausgewogener Konsens',
        rawWeight: 85,
        pros: ['Verbindet die Familie ohne Überforderung', 'Lässt Raum für freie Zeit danach'],
        cons: ['Braucht feste Absprache'],
      },
      {
        title: 'Gezielte Aufteilung: Jeder wählt einen Teil des Nachmittags',
        badge: '🤝 Fair für alle',
        rawWeight: 79,
        pros: ['Niemand fühlt sich übergangen', 'Große Vielfalt'],
        cons: ['Erfordert Zeitmanagement'],
      },
      {
        title: 'Spontaner Ausflug ins Grüne mit Picknick',
        badge: '🌲 Frische Luft',
        rawWeight: 75,
        pros: ['Abschalten vom Alltag', 'Gut für Gesundheit & Bewegung'],
        cons: ['Abhängig vom aktuellen Wetter'],
      },
    ];
  }

  const calibrated = calibrateScores(
    fallbackOptions.map((o, idx) => ({
      id: `local_opt_${idx}`,
      title: o.title,
      badge: o.badge,
      rawWeight: o.rawWeight,
      pros: o.pros,
      cons: o.cons,
    }))
  );

  const winner = calibrated[0];
  return {
    mode: 'custom',
    question: cleanQuestion,
    winner,
    options: calibrated,
    summary: `${winner.title} bietet die beste Balance für die Familie (${winner.percentage}% Empfehlung).`,
    timestamp: Date.now(),
  };
}

/**
 * Generic Free-Choice Decision Finder (Legacy compat)
 */
export function decideCustom(
  question: string,
  optionsList: string[]
): DecisionResult {
  const cleanOptions = optionsList.filter((o) => o && o.trim().length > 0);
  if (cleanOptions.length === 0) {
    cleanOptions.push('Option A', 'Option B');
  }

  const rawOptions = cleanOptions.map((opt, i) => {
    return {
      id: `custom-${i}`,
      title: opt.trim(),
      badge: `Option ${i + 1}`,
      rawWeight: Math.max(0.1, 1.0 - i * 0.15),
      pros: ['Klar strukturierte Option'],
      cons: [],
    };
  });

  const calibrated = calibrateScores(rawOptions);
  const winner = calibrated[0] || {
    id: 'default',
    title: cleanOptions[0] || 'Empfehlung',
    score: 1.0,
    percentage: 100,
    pros: [],
    cons: [],
  };

  return {
    mode: 'custom',
    question: question || 'Entscheidungshilfe',
    winner,
    options: calibrated,
    summary: `${winner.title} hat die stärkste Empfehlung (${winner.percentage}%).`,
    timestamp: Date.now(),
  };
}

