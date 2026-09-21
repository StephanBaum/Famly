import {
  EducationalCategory,
  EducationalQuestion,
  KidModuleSettings,
  KidLessonNode,
} from '../types/kidsEducation';

export const CURATED_QUESTIONS: EducationalQuestion[] = [
  // --- AGES 3-5 ---
  {
    id: 'q_a1',
    category: 'animals',
    ageGroup: 'ages_3_5',
    emoji: '🐶',
    question: 'Welches Tier macht „Wuff, Wuff“?',
    options: ['Katze', 'Hund', 'Kuh'],
    correctIndex: 1,
    funFact: 'Hunde haben einen fantastischen Geruchssinn und können Gerüche bis zu 100.000 Mal besser riechen als wir!',
  },
  {
    id: 'q_a2',
    category: 'animals',
    ageGroup: 'ages_3_5',
    emoji: '🐸',
    question: 'Wer hüpft im Teich und quakt fröhlich?',
    options: ['Frosch', 'Löwe', 'Pferd'],
    correctIndex: 0,
    funFact: 'Frösche trinken nicht mit dem Mund, sondern nehmen Wasser direkt über ihre Haut auf!',
  },
  {
    id: 'q_m1',
    category: 'math',
    ageGroup: 'ages_3_5',
    emoji: '🍎',
    question: 'Wie viele Äpfel siehst du hier?',
    visualPrompt: '🍎 🍎 🍎',
    options: ['2', '3', '4'],
    correctIndex: 1,
    funFact: 'Toll gezählt! Äpfel schwimmen im Wasser, weil sie zu 25 % aus Luft bestehen.',
  },
  {
    id: 'q_m2',
    category: 'math',
    ageGroup: 'ages_3_5',
    emoji: '⭐',
    question: 'Zähle die Zaubersterne:',
    visualPrompt: '⭐ ⭐',
    options: ['1', '2', '5'],
    correctIndex: 1,
    funFact: 'Genau zwei Sterne! Am Nachthimmel leuchten Milliarden von Sternen.',
  },
  {
    id: 'q_w1',
    category: 'words',
    ageGroup: 'ages_3_5',
    emoji: '🍌',
    question: 'Welche Farbe hat eine reife Banane?',
    options: ['Blau', 'Gelb', 'Lila'],
    correctIndex: 1,
    funFact: 'Gelb! Bananen wachsen krumm, weil sie sich beim Wachsen nach oben zum Sonnenlicht strecken.',
  },

  // --- AGES 6-8 ---
  {
    id: 'q_a10',
    category: 'animals',
    ageGroup: 'ages_6_8',
    emoji: '🦩',
    question: 'Warum haben Flamingos ein rosafarbenes Federkleid?',
    options: ['Sie sonnen sich oft', 'Durch ihre Nahrung (winzige Krebse)', 'Sie baden in Blütensaft'],
    correctIndex: 1,
    funFact: 'Flamingos fressen Krebstiere und Algen, die natürliche rote Farbstoffe enthalten. Dadurch färben sich ihre Federn rosa!',
  },
  {
    id: 'q_a11',
    category: 'animals',
    ageGroup: 'ages_6_8',
    emoji: '🐴',
    question: 'Können Pferde im Stehen schlafen?',
    options: ['Ja, dank einer Sehnensperre', 'Nein, sie fallen um', 'Nur kleine Ponys'],
    correctIndex: 0,
    funFact: 'Pferde können ihre Beinknochen und Sehnen im Stehen verriegeln, sodass sie ohne Muskelanstrengung dösen können!',
  },
  {
    id: 'q_a12',
    category: 'animals',
    ageGroup: 'ages_6_8',
    emoji: '🐙',
    question: 'Wie viele Herzen hat ein Krake (Oktopus)?',
    options: ['1 Herz', '3 Herzen', 'keins'],
    correctIndex: 1,
    funFact: 'Ein Oktopus hat wirklich drei Herzen und blaues Blut! Zwei pumpen Blut in die Kiemen, eins in den Körper.',
  },
  {
    id: 'q_m10',
    category: 'math',
    ageGroup: 'ages_6_8',
    emoji: '🍓',
    question: 'Rechne aus: 4 Erdbeeren + 3 Erdbeeren = ?',
    visualPrompt: '🍓🍓🍓🍓 + 🍓🍓🍓',
    options: ['6', '7', '8'],
    correctIndex: 1,
    funFact: 'Richtig, 7! Wusstest du, dass die Erdbeere botanisch gar keine Beere, sondern eine Sammelnussfrucht ist?',
  },
  {
    id: 'q_m11',
    category: 'math',
    ageGroup: 'ages_6_8',
    emoji: '🎈',
    question: 'Du hast 8 Luftballons. 3 fliegen in den Himmel. Wie viele hast du noch?',
    options: ['4', '5', '6'],
    correctIndex: 1,
    funFact: '8 minus 3 ist 5! Perfekt gerechnet.',
  },
  {
    id: 'q_n10',
    category: 'nature',
    ageGroup: 'ages_6_8',
    emoji: '🌈',
    question: 'Wann kann man einen Regenbogen am Himmel sehen?',
    options: ['Bei Regen und Sonnenschein gleichzeitig', 'Mitten in der Nacht', 'Nur im Winter bei Schnee'],
    correctIndex: 0,
    funFact: 'Die Wassertropfen in der Luft brechen das weiße Sonnenlicht wie winzige Prismen in all seine bunten Einzelfarben!',
  },
  {
    id: 'q_w10',
    category: 'words',
    ageGroup: 'ages_6_8',
    emoji: '🦁',
    question: 'Mit welchem Buchstaben fängt das Wort „LÖWE“ an?',
    options: ['M', 'L', 'S'],
    correctIndex: 1,
    funFact: 'Mit L! Das Brüllen eines Löwen kann man bis zu 8 Kilometer weit hören.',
  },

  // --- AGES 9-12 ---
  {
    id: 'q_a20',
    category: 'animals',
    ageGroup: 'ages_9_12',
    emoji: '🐋',
    question: 'Welches ist das größte Tier, das jemals auf der Erde gelebt hat?',
    options: ['Tyrannosaurus Rex', 'Blauwal', 'Mammut', 'Afrikanischer Elefant'],
    correctIndex: 1,
    funFact: 'Der Blauwal ist sogar größer als alle Dinosaurier! Seine Zunge allein wiegt so viel wie ein ganzer Elefant.',
  },
  {
    id: 'q_a21',
    category: 'animals',
    ageGroup: 'ages_9_12',
    emoji: '🐆',
    question: 'Wie schnell kann ein Gepard beim Sprinten werden?',
    options: ['ca. 45 km/h', 'ca. 100–120 km/h', 'über 200 km/h'],
    correctIndex: 1,
    funFact: 'Geparden beschleunigen in nur 3 Sekunden von 0 auf 100 km/h – schneller als die allermeisten Sportwagen!',
  },
  {
    id: 'q_m20',
    category: 'math',
    ageGroup: 'ages_9_12',
    emoji: '🧠',
    question: 'Blitz-Kopfrechnen: 7 x 8 = ?',
    options: ['54', '56', '58', '64'],
    correctIndex: 1,
    funFact: 'Klasse! 7 mal 8 ist 56. Eine der Zahlen, die man sich am besten mit dem Reim „5, 6, 7, 8“ merken kann!',
  },
  {
    id: 'q_n20',
    category: 'nature',
    ageGroup: 'ages_9_12',
    emoji: '🪐',
    question: 'Welcher Planet in unserem Sonnensystem ist für seine riesigen Ringe bekannt?',
    options: ['Mars', 'Saturn', 'Jupiter', 'Venus'],
    correctIndex: 1,
    funFact: 'Saturn! Seine Ringe bestehen aus Milliarden Eisbrocken, Staub und Gestein, die um den Planeten kreisen.',
  },
];

const STORAGE_PREFIX_PROGRESS = 'famly_kid_progress_';
const STORAGE_PREFIX_SETTINGS = 'famly_kid_settings_';

export interface KidProgressData {
  xp: number;
  level: number;
  completedQuestionIds: string[];
  streakDays: number;
  lastPlayedDate: string;
}

export function getKidProgress(memberId: string): KidProgressData {
  if (typeof window === 'undefined') {
    return { xp: 0, level: 1, completedQuestionIds: [], streakDays: 1, lastPlayedDate: '' };
  }
  const raw = localStorage.getItem(`${STORAGE_PREFIX_PROGRESS}${memberId}`);
  if (!raw) {
    return { xp: 30, level: 1, completedQuestionIds: [], streakDays: 1, lastPlayedDate: '' };
  }
  try {
    return JSON.parse(raw);
  } catch {
    return { xp: 30, level: 1, completedQuestionIds: [], streakDays: 1, lastPlayedDate: '' };
  }
}

export function saveKidProgress(memberId: string, progress: KidProgressData): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`${STORAGE_PREFIX_PROGRESS}${memberId}`, JSON.stringify(progress));
  }
}

export function getKidModuleSettings(memberId: string): KidModuleSettings {
  if (typeof window === 'undefined') {
    return {
      ageGroup: 'ages_6_8',
      activeCategories: ['animals', 'math', 'nature', 'words'],
      customQuestions: [],
    };
  }
  const raw = localStorage.getItem(`${STORAGE_PREFIX_SETTINGS}${memberId}`);
  if (!raw) {
    return {
      ageGroup: 'ages_6_8',
      activeCategories: ['animals', 'math', 'nature', 'words'],
      customQuestions: [],
    };
  }
  try {
    return JSON.parse(raw);
  } catch {
    return {
      ageGroup: 'ages_6_8',
      activeCategories: ['animals', 'math', 'nature', 'words'],
      customQuestions: [],
    };
  }
}

export function saveKidModuleSettings(memberId: string, settings: KidModuleSettings): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`${STORAGE_PREFIX_SETTINGS}${memberId}`, JSON.stringify(settings));
  }
}

/**
 * Builds the 6-step Duolingo learning path for a child
 */
export function buildKidLessonPath(memberId: string): KidLessonNode[] {
  const progress = getKidProgress(memberId);
  const settings = getKidModuleSettings(memberId);

  const allModules: Array<{
    title: string;
    category: EducationalCategory;
    emoji: string;
    color: string;
    border: string;
  }> = [
    { title: 'Tier-Safari', category: 'animals', emoji: '🦁', color: 'bg-emerald-500', border: 'border-emerald-600' },
    { title: 'Zahlen-Zauber', category: 'math', emoji: '🔢', color: 'bg-amber-500', border: 'border-amber-600' },
    { title: 'Natur-Entdecker', category: 'nature', emoji: '🌿', color: 'bg-sky-500', border: 'border-sky-600' },
    { title: 'Wörter-Spaß', category: 'words', emoji: '🔤', color: 'bg-indigo-500', border: 'border-indigo-600' },
    { title: 'Tier-Detektiv', category: 'animals', emoji: '🦊', color: 'bg-orange-500', border: 'border-orange-600' },
    { title: 'Wissens-Champion', category: 'math', emoji: '🏆', color: 'bg-rose-500', border: 'border-rose-600' },
  ];

  const modules = allModules.filter((m) =>
    settings.activeCategories.includes(m.category)
  );
  const activeModules = modules.length > 0 ? modules : allModules;

  // Completed levels based on XP (every 50 XP unlocks next level)
  const currentUnlockedLevel = Math.floor(progress.xp / 50) + 1;

  return activeModules.map((m, idx) => {
    const levelNumber = idx + 1;
    const isCompleted = currentUnlockedLevel > levelNumber;
    const isLocked = currentUnlockedLevel < levelNumber;

    return {
      id: `lesson_${memberId}_${levelNumber}`,
      levelNumber,
      title: m.title,
      category: m.category,
      emoji: m.emoji,
      colorClass: m.color,
      borderColorClass: m.border,
      isCompleted,
      isLocked,
      xpReward: 25,
    };
  });
}

/**
 * Returns available questions for a lesson node, combining curated questions and custom parent questions
 */
export function getQuestionsForLesson(
  memberId: string,
  category: EducationalCategory
): EducationalQuestion[] {
  const settings = getKidModuleSettings(memberId);
  const progress = getKidProgress(memberId);

  // Filter curated
  const matchingCurated = CURATED_QUESTIONS.filter(
    (q) => q.category === category && q.ageGroup === settings.ageGroup
  );

  // Fallback to other age groups if no exact match
  const fallback = CURATED_QUESTIONS.filter((q) => q.category === category);

  // Add custom parent questions for this category
  const custom = settings.customQuestions.filter((q) => q.category === category);

  const combined = [...custom, ...(matchingCurated.length > 0 ? matchingCurated : fallback)];

  // Prioritize uncompleted questions
  const uncompleted = combined.filter((q) => !progress.completedQuestionIds.includes(q.id));
  return uncompleted.length > 0 ? uncompleted : combined;
}
