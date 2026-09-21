import { Recipe, FamilyMember, Chore, Appointment } from '../types';

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
 * Fast, objective decision for "Was kochen wir heute Abend?"
 */
export function decideMeal(
  candidateRecipes: Recipe[],
  pantryIngredients: string[],
  todaysAppointments: Appointment[] = [],
  maxTimeMinutes: number = 45
): DecisionResult {
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
 * Generic Free-Choice Decision Finder
 */
export function decideCustom(
  question: string,
  optionsList: string[]
): DecisionResult {
  const cleanOptions = optionsList.filter((o) => o.trim().length > 0);
  if (cleanOptions.length === 0) {
    cleanOptions.push('Option A', 'Option B');
  }

  const rawOptions = cleanOptions.map((opt, i) => {
    // Generate balanced baseline with slight pseudo-probabilistic differentiation
    const baseWeight = 1.0 + (Math.sin(i + 1) * 0.2);
    return {
      id: `custom-${i}`,
      title: opt.trim(),
      badge: `Option ${i + 1}`,
      rawWeight: Math.max(0.1, baseWeight),
      pros: ['Klar strukturierte Option'],
      cons: [],
    };
  });

  const calibrated = calibrateScores(rawOptions);
  const winner = calibrated[0];

  return {
    mode: 'custom',
    question: question || 'Entscheidungshilfe',
    winner,
    options: calibrated,
    summary: `${winner.title} hat die stärkste Empfehlung (${winner.percentage}%).`,
    timestamp: Date.now(),
  };
}
