import { Recipe, FamilyMember, Chore, Appointment, MealPlanDay } from '../types';
import { getAIConfig, resolveGeminiFlashModel } from './aiRecipeService';
import { formatMemoriesForPrompt } from './familyMemoryService';

export interface DecisionOption {
  id: string;
  title: string;
  score: number; // 0..1 calibrated fit score
  percentage: number; // 0..100
  badge?: string;
  fitReason?: string;
  estimatedCost?: string;
  duration?: string;
  isIndoor?: boolean;
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
 * Normalizes an array of raw weights into realistic, intuitive fit percentages (60..98%)
 */
function calibrateScores(
  options: Array<
    {
      rawWeight: number;
      fitReason?: string;
      estimatedCost?: string;
      duration?: string;
      isIndoor?: boolean;
    } & Omit<DecisionOption, 'score' | 'percentage'>
  >
): DecisionOption[] {
  const sorted = [...options].sort((a, b) => b.rawWeight - a.rawWeight);

  return sorted.map((opt, idx) => {
    let pct: number;
    if (opt.rawWeight >= 10) {
      // Direct percentage score (e.g. 94, 86, 78)
      pct = Math.min(98, Math.max(50, Math.round(opt.rawWeight)));
    } else {
      // Relative weight score (e.g. 1.2, 0.8), mapped to realistic natural scores
      pct = Math.max(50, Math.min(96, Math.round(92 - idx * 7)));
    }

    return {
      id: opt.id,
      title: opt.title,
      score: Number((pct / 100).toFixed(2)),
      percentage: pct,
      badge: opt.badge,
      fitReason: opt.fitReason,
      estimatedCost: opt.estimatedCost,
      duration: opt.duration,
      isIndoor: opt.isIndoor,
      pros: opt.pros,
      cons: opt.cons,
      payload: opt.payload,
    };
  });
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

function extractJsonFromText(raw: string): any {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {}
  const match = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (match) {
    try {
      return JSON.parse(match[1].trim());
    } catch {}
  }
  const firstBrace = raw.indexOf('{');
  const lastBrace = raw.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(raw.slice(firstBrace, lastBrace + 1));
    } catch {}
  }
  return null;
}

/**
 * Autonomous AI Deliberation Engine powered by Gemini 3+ Flash.
 * Takes a family dilemma, consults family members, schedules, interests and region,
 * formulates 3 tailored options with Google Search grounding, and computes genuine trade-offs.
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
    region?: string;
  }
): Promise<DecisionResult> {
  const cleanQuestion = question.trim() || 'Was unternehmen wir als Familie?';
  const aiConfig = getAIConfig();
  const memoriesContext = formatMemoriesForPrompt(cleanQuestion);
  const targetRegion = familyData.region?.trim() || 'München & Umland';

  const membersInfo = (familyData.members || [])
    .map((m) => {
      let info = `${m.name} (${m.role}${m.isChild ? ', Kind' : ''}`;
      if (m.birthday) {
        try {
          const birthYear = new Date(m.birthday).getFullYear();
          const currentYear = new Date().getFullYear();
          if (!isNaN(birthYear) && birthYear > 1920 && birthYear <= currentYear) {
            info += `, ca. ${currentYear - birthYear} Jahre`;
          }
        } catch {}
      }
      if (m.notes) info += `, Hobbys/Interessen: "${m.notes}"`;
      if (m.childDetails?.allergies) info += `, Allergien: "${m.childDetails.allergies}"`;
      return `${info})`;
    })
    .join('\n- ');

  const prompt = `
Du bist der kluge, inspirierende Familienrats-Moderator für Familie ${familyData.familyName || 'Familie'}.
Die Familie hat folgendes Dilemma oder folgende Frage eingereicht:
"${cleanQuestion}"

FAMILIENKONTEXT & INTERESSEN:
- Heimatregion / Wohnort: ${targetRegion}
- Mitglieder & deren Hobbys/Vorlieben:
- ${membersInfo || 'Familienmitglieder'}
- Bekannte Fakten & Familiengedächtnis:
${memoriesContext}

WICHTIGE VERHALTENSREGELN FÜR DIE ENTSCHEIDUNG:
1. KEIN KOCH-TUNNELBLICK:
   - Wenn die Frage um Freizeit, Wochenende, Ausflüge, Aktivitäten oder Regentage geht, schlage NIEMALS Kochen, Backen oder Rezepte in der Küche vor (außer die Frage lautet explizit "Was sollen wir kochen/essen?").
2. REGIONALE RECHERCHE & ECHTE AUSFLUGSZIELE:
   - Nenne echte, konkrete Ausflugsziele, Museen, Hallenbäder, Boulder-/Kletterhallen, Indoor-Spielplätze, Erlebniswelten, Planetarien oder Naturparks in oder um "${targetRegion}".
3. DREI DIVERSE, HOCHWERTIGE OPTIONEN:
   Generiere exakt 3 abwechslungsreiche Optionen:
   • Option 1: Action, Abenteuer & Auspowern (z.B. Indoor-Erlebniswelt, Trampolinhalle, Bouldern, Klettern, Erlebnisbad)
   • Option 2: Entdecken, Kultur & Staunen (z.B. interaktives Science-Museum, Planetarium, Detektiv-Trail / Escape-Room, Botanischer Garten)
   • Option 3: Kreativ, Spiele & Gemütlich (z.B. Keramik-Malstudio, Brettspiel-Café, Familien-Kinoerlebnis oder spannende DIY-Rätsel-Rallye)
4. ABGLEICH MIT GEMEINSAMEN INTERESSEN:
   - Erkläre in "fitReason" in 1 prägnanten Satz, warum die jeweilige Option die Interessen von Kindern UND Erwachsenen optimal verbindet (z.B. "Perfekt für Idas Bewegungsdrang und Stephans Technikbegeisterung").
   - Gib zu jeder Option realistische "pros" (2-3 Vorteile) und "cons" (1-2 ehrliche Punkte zu bedenken) an.
   - Gib "duration" (z.B. "ca. 2-3 Stunden") und "estimatedCost" (z.B. "Günstig", "Mittel", "Kostenlos") an.
5. REALISTISCHE MATCH-SCORES:
   - Vergib jeder Option einen natürlichen Passungs-Score von 65 bis 96 (z.B. Option 1: 94, Option 2: 86, Option 3: 78).
6. KEIN BELEHRENDER ODER STEIFER TON:
   - Formuliere lebendig, herzlich und auf den Punkt. Keine geschwollenen Manager-Floskeln ("ist der ideale Konsens").

Antworte strukturiert im folgenden JSON-Format:
\`\`\`json
{
  "summary": "1-2 Sätze Kern-Empfehlung für die Familie...",
  "winnerId": "opt_1",
  "options": [
    {
      "id": "opt_1",
      "title": "Konkreter Name des Ausflugsziels oder der Aktivität",
      "badge": "⚡ Action & Auspowern",
      "score": 94,
      "fitReason": "Warum es zu den Interessen der Familie passt",
      "duration": "ca. 2-3 Stunden",
      "estimatedCost": "Mittel (ca. 12-15€ p.P.)",
      "isIndoor": true,
      "pros": ["Vorteil 1", "Vorteil 2"],
      "cons": ["Zu bedenken"]
    },
    {
      "id": "opt_2",
      "title": "Zweite Option (z.B. Kultur / Museum / Entdecken)",
      "badge": "🏛️ Kultur & Entdecken",
      "score": 86,
      "fitReason": "Warum es zu den Interessen passt",
      "duration": "ca. 2 Stunden",
      "estimatedCost": "Günstig",
      "isIndoor": true,
      "pros": ["Vorteil 1", "Vorteil 2"],
      "cons": ["Zu bedenken"]
    },
    {
      "id": "opt_3",
      "title": "Dritte Option (z.B. Gemütlich / Kreativ / Spiele)",
      "badge": "🎲 Gemütlich & Kreativ",
      "score": 78,
      "fitReason": "Warum es zu den Interessen passt",
      "duration": "ca. 1,5 Stunden",
      "estimatedCost": "Kostenlos",
      "isIndoor": true,
      "pros": ["Vorteil 1"],
      "cons": ["Zu bedenken"]
    }
  ]
}
\`\`\`
`.trim();

  if (aiConfig?.apiKey && aiConfig.provider === 'gemini') {
    try {
      const model = await resolveGeminiFlashModel(aiConfig.apiKey);
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${aiConfig.apiKey}`;

      // 1. First attempt: with Google Search grounding tool enabled
      let res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          tools: [{ googleSearch: {} }],
          generationConfig: {
            temperature: 0.5,
          },
        }),
      });

      // 2. Fallback attempt: standard call without tools if search tool is rejected
      if (!res.ok) {
        res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.5,
            },
          }),
        });
      }

      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsed = extractJsonFromText(text);
          if (parsed && Array.isArray(parsed.options) && parsed.options.length > 0) {
            const rawOpts = parsed.options.map((o: any, idx: number) => ({
              id: o.id || `opt_${idx}`,
              title: o.title || `Option ${idx + 1}`,
              badge: o.badge,
              fitReason: o.fitReason,
              estimatedCost: o.estimatedCost,
              duration: o.duration,
              isIndoor: typeof o.isIndoor === 'boolean' ? o.isIndoor : true,
              rawWeight: typeof o.score === 'number' ? Math.max(1, o.score) : Math.max(60, 92 - idx * 8),
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
              summary: parsed.summary || `${winner.title} passt mit ${winner.percentage}% Match am besten zu euren Interessen!`,
              timestamp: Date.now(),
            };
          }
        }
      }
    } catch (e) {
      console.warn('Autonomous AI decision failed, falling back to smart local deliberation:', e);
    }
  }

  // Smart Contextual Local Fallback Engine (Topic-aware, never proposing cooking for leisure questions)
  const q = cleanQuestion.toLowerCase();
  let fallbackOptions: Array<{
    title: string;
    badge: string;
    rawWeight: number;
    fitReason: string;
    duration: string;
    estimatedCost: string;
    isIndoor: boolean;
    pros: string[];
    cons: string[];
  }> = [];

  if (q.includes('film') || q.includes('kino') || q.includes('video') || q.includes('serie')) {
    fallbackOptions = [
      {
        title: 'Animationsfilm / Familienhit (z.B. Pixar oder Disney Klassiker)',
        badge: '🍿 Beliebt bei Groß & Klein',
        rawWeight: 92,
        fitReason: 'Perfekt abgestimmt auf die Kinder mit viel Witz für Erwachsene',
        duration: 'ca. 1,5 Stunden',
        estimatedCost: 'Streaming-Abo',
        isIndoor: true,
        pros: ['Gute Laune garantiert', 'Für jüngere Kinder bestens geeignet'],
        cons: ['Eventuell schon einmal gesehen'],
      },
      {
        title: 'Humorvoller Comedy-Klassiker (z.B. Paddington oder Nachts im Museum)',
        badge: '😂 Viel zum Lachen',
        rawWeight: 85,
        fitReason: 'Großartige Unterhaltung für alle Generationen',
        duration: 'ca. 1,5 - 2 Stunden',
        estimatedCost: 'Streaming-Abo',
        isIndoor: true,
        pros: ['Sehr unterhaltsam für Eltern & Kids', 'Kurzweilig'],
        cons: ['Teilweise etwas temporeich'],
      },
      {
        title: 'Spannendes Familien-Naturabenteuer (z.B. Unsere Erde / Erdmännchen)',
        badge: '🌍 Faszinierend & Lehrreich',
        rawWeight: 78,
        fitReason: 'Faszinierende Bilder und spannender Gesprächsstoff',
        duration: 'ca. 1,5 Stunden',
        estimatedCost: 'Kostenlos / Mediathek',
        isIndoor: true,
        pros: ['Atemberaubende Naturaufnahmen', 'Lehrreich'],
        cons: ['Erfordert etwas mehr Aufmerksamkeit'],
      },
    ];
  } else if (q.includes('regen') || q.includes('schlecht') || q.includes('wetter') || q.includes('drinnen') || q.includes('ausflug') || q.includes('wochenende') || q.includes('unternehmen')) {
    fallbackOptions = [
      {
        title: `Indoor-Action & Auspowern (Erlebnisbad / Therme oder Trampolinpark in ${targetRegion})`,
        badge: '⚡ Viel Bewegung & Spaß',
        rawWeight: 94,
        fitReason: 'Gibt den Kindern die nötige Bewegung bei Schmuddelwetter und lässt alle am Abend selig schlafen',
        duration: 'ca. 3 Stunden',
        estimatedCost: 'Mittel (ca. 12-18€ p.P.)',
        isIndoor: true,
        pros: ['100% wetterunabhängig', 'Großer Spaßfaktor für die ganze Familie'],
        cons: ['Eintrittskosten und etwas Anfahrtszeit'],
      },
      {
        title: `Mitmach-Museum, Science-Center oder Planetarium in ${targetRegion}`,
        badge: '🏛️ Entdecken & Staunen',
        rawWeight: 86,
        fitReason: 'Verbindet Neugier, Technik und spielerisches Lernen für Kinder und Erwachsene',
        duration: 'ca. 2-3 Stunden',
        estimatedCost: 'Günstig bis Mittel',
        isIndoor: true,
        pros: ['Interaktive Stationen zum Anfassen', 'Spannend & trocken'],
        cons: ['Am Wochenende eventuell gut besucht'],
      },
      {
        title: 'Großer Familien-Spielemarathon mit Deckenburg & DIY-Snack-Buffet',
        badge: '🎲 Gemütlich & Kostenlos',
        rawWeight: 80,
        fitReason: 'Gemütliche Quality-Time zu Hause ohne jeden Reise- oder Packstress',
        duration: 'ca. 2 Stunden',
        estimatedCost: 'Kostenlos',
        isIndoor: true,
        pros: ['Kein Verlassen des Hauses bei Sauwetter', 'Stärkt das Gemeinschaftsgefühl'],
        cons: ['Benötigt Einigung auf gemeinsame Spielregeln'],
      },
    ];
  } else {
    fallbackOptions = [
      {
        title: `Spannender Familienausflug in der Region ${targetRegion}`,
        badge: '🌲 Ausflug & Erlebnis',
        rawWeight: 92,
        fitReason: 'Perfekt ausgewogene Aktivität für die ganze Familie mit viel Abwechslung',
        duration: 'ca. 2-3 Stunden',
        estimatedCost: 'Günstig',
        isIndoor: false,
        pros: ['Gemeinsame Erlebnisse schaffen Erinnerungen', 'Für jedes Alter attraktiv'],
        cons: ['Erfordert etwas Vorbereitung'],
      },
      {
        title: 'Mitmach-Erlebnis oder interaktive Ausstellung',
        badge: '🏛️ Kultur & Entdecken',
        rawWeight: 85,
        fitReason: 'Weckt Neugier und bietet spannende Mitmach-Stationen für die Kids',
        duration: 'ca. 2 Stunden',
        estimatedCost: 'Mittel',
        isIndoor: true,
        pros: ['Wetterunabhängig', 'Interaktiv'],
        cons: ['Feste Öffnungszeiten'],
      },
      {
        title: 'Gemeinsamer Spieletag oder Picknick-Tour',
        badge: '🧺 Entspannt & Flexibel',
        rawWeight: 78,
        fitReason: 'Entspannte Zeit ohne Zeitdruck oder Terminstress',
        duration: 'ca. 2 Stunden',
        estimatedCost: 'Kostenlos',
        isIndoor: false,
        pros: ['Keine Eintrittskosten', 'Völlig stressfrei'],
        cons: ['Wetterabhängig'],
      },
    ];
  }

  const calibrated = calibrateScores(
    fallbackOptions.map((o, idx) => ({
      id: `local_opt_${idx}`,
      title: o.title,
      badge: o.badge,
      fitReason: o.fitReason,
      estimatedCost: o.estimatedCost,
      duration: o.duration,
      isIndoor: o.isIndoor,
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
    summary: `${winner.title} passt mit ${winner.percentage}% Match am besten zu euren Interessen!`,
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

