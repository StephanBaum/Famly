import {
  EducationalCategory,
  EducationalQuestion,
  KidModuleSettings,
  KidLessonNode,
  KidAgeGroup,
} from '../types/kidsEducation';

export const CURATED_QUESTIONS: EducationalQuestion[] = [
  // --- ANIMALS ---
  {
    id: 'q_a1',
    category: 'animals',
    ageGroup: 'ages_3_5',
    emoji: '🐶',
    question: 'Welches Tier bellt „Wuff, Wuff“?',
    options: ['Katze 🐱', 'Hund 🐶', 'Kuh 🐮'],
    correctIndex: 1,
    funFact: 'Hunde können 100.000 Mal besser riechen als wir!',
  },
  {
    id: 'q_a2',
    category: 'animals',
    ageGroup: 'ages_3_5',
    emoji: '🐱',
    question: 'Wer schleicht leise und schnurrt gern?',
    options: ['Katze 🐱', 'Bär 🐻', 'Frosch 🐸'],
    correctIndex: 0,
    funFact: 'Katzen können im Dunkeln 6 Mal besser sehen als Menschen.',
  },
  {
    id: 'q_a3',
    category: 'animals',
    ageGroup: 'ages_3_5',
    emoji: '🐸',
    question: 'Wer hüpft im Teich und quakt fröhlich?',
    options: ['Frosch 🐸', 'Löwe 🦁', 'Pferd 🐴'],
    correctIndex: 0,
    funFact: 'Frösche trinken Wasser direkt über ihre Haut!',
  },
  {
    id: 'q_a4',
    category: 'animals',
    ageGroup: 'ages_3_5',
    emoji: '🐘',
    question: 'Wer hat einen riesigen Rüssel und große Ohren?',
    options: ['Elefant 🐘', 'Maus 🐭', 'Affe 🐵'],
    correctIndex: 0,
    funFact: 'Elefanten können mit ihren Füßen Töne im Boden spüren.',
  },
  {
    id: 'q_a10',
    category: 'animals',
    ageGroup: 'ages_6_8',
    emoji: '🦩',
    question: 'Warum sind Flamingos rosa?',
    options: ['Viel Sonne ☀️', 'Durch Krebschen 🦐', 'Bunte Federn 🎨'],
    correctIndex: 1,
    funFact: 'Flamingos fressen Algen und kleine Krebse mit rotem Farbstoff.',
  },
  {
    id: 'q_a11',
    category: 'animals',
    ageGroup: 'ages_6_8',
    emoji: '🐴',
    question: 'Können Pferde im Stehen schlafen?',
    options: ['Ja, dank Knie-Sperre 🐴', 'Nein, fallen um 😴', 'Nur Ponys 🐎'],
    correctIndex: 0,
    funFact: 'Pferde können ihre Kniegelenke einrasten lassen.',
  },
  {
    id: 'q_a12',
    category: 'animals',
    ageGroup: 'ages_6_8',
    emoji: '🐙',
    question: 'Wie viele Herzen hat ein Krake (Oktopus)?',
    options: ['1 Herz ❤️', '3 Herzen 🫀', 'Keins 🫧'],
    correctIndex: 1,
    funFact: 'Ein Krake hat drei Herzen und blaues Blut!',
  },
  {
    id: 'q_a20',
    category: 'animals',
    ageGroup: 'ages_9_12',
    emoji: '🐋',
    question: 'Was ist das größte Tier der Erde?',
    options: ['T-Rex 🦖', 'Blauwal 🐋', 'Elefant 🐘'],
    correctIndex: 1,
    funFact: 'Die Zunge eines Blauwals wiegt so viel wie ein ganzer Elefant!',
  },
  {
    id: 'q_a21',
    category: 'animals',
    ageGroup: 'ages_9_12',
    emoji: '🐆',
    question: 'Wie schnell sprintet ein Gepard?',
    options: ['ca. 50 km/h 🚲', 'ca. 110 km/h 🏎️', '200 km/h 🚀'],
    correctIndex: 1,
    funFact: 'Geparden beschleunigen in 3 Sekunden auf 100 km/h!',
  },

  // --- NATURE ---
  {
    id: 'q_n1',
    category: 'nature',
    ageGroup: 'ages_3_5',
    emoji: '☀️',
    question: 'Was wärmt uns am Tag am Himmel?',
    options: ['Die Sonne ☀️', 'Der Mond 🌙', 'Die Wolke ☁️'],
    correctIndex: 0,
    funFact: 'Das Sonnenlicht braucht nur 8 Minuten bis zur Erde!',
  },
  {
    id: 'q_n2',
    category: 'nature',
    ageGroup: 'ages_3_5',
    emoji: '🌳',
    question: 'Wo wachsen leckere Äpfel?',
    options: ['Am Baum 🌳', 'Unter Wasser 🌊', 'Im Stein 🪨'],
    correctIndex: 0,
    funFact: 'Ein einziger Apfelbaum kann Hunderte Äpfel tragen!',
  },
  {
    id: 'q_n3',
    category: 'nature',
    ageGroup: 'ages_3_5',
    emoji: '❄️',
    question: 'Was rieselt im kalten Winter weiß vom Himmel?',
    options: ['Schnee ❄️', 'Blumen 🌸', 'Wasser 💦'],
    correctIndex: 0,
    funFact: 'Keine zwei Schneeflocken auf der Welt sehen genau gleich aus!',
  },
  {
    id: 'q_n10',
    category: 'nature',
    ageGroup: 'ages_6_8',
    emoji: '🌈',
    question: 'Wann sieht man einen bunten Regenbogen?',
    options: ['Sonne & Regen 🌦️', 'Mitten in Nacht 🌑', 'Nur bei Schnee ❄️'],
    correctIndex: 0,
    funFact: 'Regentropfen teilen das Sonnenlicht in alle Farben auf!',
  },
  {
    id: 'q_n20',
    category: 'nature',
    ageGroup: 'ages_9_12',
    emoji: '🪐',
    question: 'Welcher Planet hat berühmte riesige Ringe?',
    options: ['Mars 🔴', 'Saturn 🪐', 'Jupiter 🟡'],
    correctIndex: 1,
    funFact: 'Die Ringe des Saturns bestehen aus Milliarden Eisbrocken!',
  },

  // --- WORDS & SHAPES ---
  {
    id: 'q_w1',
    category: 'words',
    ageGroup: 'ages_3_5',
    emoji: '🍌',
    question: 'Welche Farbe hat eine reife Banane?',
    options: ['Gelb 🟡', 'Blau 🔵', 'Rot 🔴'],
    correctIndex: 0,
    funFact: 'Bananen wachsen krumm nach oben zum Sonnenlicht!',
  },
  {
    id: 'q_w2',
    category: 'words',
    ageGroup: 'ages_3_5',
    emoji: '🦁',
    question: 'Welches Wort fängt mit L an?',
    options: ['Löwe 🦁', 'Maus 🐭', 'Hund 🐶'],
    correctIndex: 0,
    funFact: 'Das Brüllen eines Löwen hört man 8 Kilometer weit!',
  },
  {
    id: 'q_w3',
    category: 'words',
    ageGroup: 'ages_3_5',
    emoji: '🍎',
    question: 'Welches Wort fängt mit A an?',
    options: ['Apfel 🍎', 'Banane 🍌', 'Kirsche 🍒'],
    correctIndex: 0,
    funFact: 'Äpfel schwimmen im Wasser, weil sie Luft enthalten.',
  },
  {
    id: 'q_w4',
    category: 'words',
    ageGroup: 'ages_6_8',
    emoji: '🦉',
    question: 'Was ist das Gegenteil von GROSS?',
    options: ['Klein 🐭', 'Bunt 🌈', 'Laut 🔊'],
    correctIndex: 0,
    funFact: 'Elefanten sind groß, Kolibris winzig klein!',
  },
  {
    id: 'q_w5',
    category: 'words',
    ageGroup: 'ages_6_8',
    emoji: '☀️',
    question: 'Was ist das Gegenteil von TAG?',
    options: ['Nacht 🌙', 'Sonne ☀️', 'Sommer 🏖️'],
    correctIndex: 0,
    funFact: 'Wenn bei uns Nacht ist, scheint auf der anderen Erdseite die Sonne!',
  },
];

/**
 * Generates dynamic interactive counting and math questions
 */
export function generateDynamicMathQuestions(ageGroup: KidAgeGroup, count: number = 4): EducationalQuestion[] {
  const emojis = ['🍎', '⭐', '🚗', '🍓', '🐶', '🎈', '🍕', '🚀', '🐱', '🍪'];
  const results: EducationalQuestion[] = [];

  for (let i = 0; i < count; i++) {
    const symbol = emojis[Math.floor(Math.random() * emojis.length)];

    if (ageGroup === 'ages_3_5') {
      // Simple counting 1 to 5
      const targetCount = Math.floor(Math.random() * 4) + 2; // 2 to 5
      const visual = Array(targetCount).fill(symbol).join(' ');
      const options = [
        String(targetCount),
        String(Math.max(1, targetCount - 1)),
        String(targetCount + 1),
      ].sort(() => Math.random() - 0.5);

      results.push({
        id: `dyn_math_${Date.now()}_${i}`,
        category: 'math',
        ageGroup,
        emoji: symbol,
        visualPrompt: visual,
        question: `Tippe und zähle: Wie viele ${symbol}?`,
        options,
        correctIndex: options.indexOf(String(targetCount)),
        funFact: `Genau ${targetCount} ${symbol}! Fantastisch gezählt!`,
      });
    } else if (ageGroup === 'ages_6_8') {
      // Addition or subtraction up to 10
      const a = Math.floor(Math.random() * 5) + 1;
      const b = Math.floor(Math.random() * 4) + 1;
      const sum = a + b;

      const visualA = Array(a).fill(symbol).join('');
      const visualB = Array(b).fill(symbol).join('');

      const options = [
        String(sum),
        String(Math.max(1, sum - 1)),
        String(sum + 1),
      ].sort(() => Math.random() - 0.5);

      results.push({
        id: `dyn_math_${Date.now()}_${i}`,
        category: 'math',
        ageGroup,
        emoji: '➕',
        visualPrompt: `${visualA} + ${visualB}`,
        question: `${a} + ${b} = ?`,
        options,
        correctIndex: options.indexOf(String(sum)),
        funFact: `Richtig, ${a} + ${b} = ${sum}! Du bist ein Mathe-Profi!`,
      });
    } else {
      // 9-12 Multiplication
      const a = Math.floor(Math.random() * 7) + 3; // 3 to 9
      const b = Math.floor(Math.random() * 7) + 2; // 2 to 8
      const product = a * b;

      const wrong1 = product + (Math.random() > 0.5 ? 2 : -2);
      const wrong2 = product + 10;
      const options = [String(product), String(wrong1), String(wrong2)].sort(() => Math.random() - 0.5);

      results.push({
        id: `dyn_math_${Date.now()}_${i}`,
        category: 'math',
        ageGroup,
        emoji: '🧠',
        question: `Blitz-Kopfrechnen: ${a} × ${b} = ?`,
        options,
        correctIndex: options.indexOf(String(product)),
        funFact: `Super! ${a} mal ${b} ergibt ${product}.`,
      });
    }
  }

  return results;
}

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
    return { xp: 40, level: 1, completedQuestionIds: [], streakDays: 1, lastPlayedDate: '' };
  }
  const raw = localStorage.getItem(`${STORAGE_PREFIX_PROGRESS}${memberId}`);
  if (!raw) {
    return { xp: 40, level: 1, completedQuestionIds: [], streakDays: 1, lastPlayedDate: '' };
  }
  try {
    return JSON.parse(raw);
  } catch {
    return { xp: 40, level: 1, completedQuestionIds: [], streakDays: 1, lastPlayedDate: '' };
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
 * Builds the colorful field of circular game bubbles for the child
 * (Free choice, not strictly locked, high visual engagement!)
 */
export function buildKidGameBubbles(memberId: string): KidLessonNode[] {
  const settings = getKidModuleSettings(memberId);

  const allBubbles: Array<{
    title: string;
    category: EducationalCategory;
    emoji: string;
    color: string;
    border: string;
  }> = [
    { title: 'Zahlen-Spaß', category: 'math', emoji: '🍎', color: 'bg-amber-400 text-stone-900', border: 'border-amber-500' },
    { title: 'Tier-Welt', category: 'animals', emoji: '🦁', color: 'bg-emerald-500 text-white', border: 'border-emerald-600' },
    { title: 'Natur-Rätsel', category: 'nature', emoji: '🌿', color: 'bg-sky-500 text-white', border: 'border-sky-600' },
    { title: 'Wörter & Töne', category: 'words', emoji: '🔤', color: 'bg-indigo-500 text-white', border: 'border-indigo-600' },
    { title: 'Dino & Zoo', category: 'animals', emoji: '🦕', color: 'bg-teal-500 text-white', border: 'border-teal-600' },
    { title: 'Zahlen-Zauber', category: 'math', emoji: '⭐', color: 'bg-rose-500 text-white', border: 'border-rose-600' },
    { title: 'Planeten & Welt', category: 'nature', emoji: '🚀', color: 'bg-purple-500 text-white', border: 'border-purple-600' },
    { title: 'Tier-Stimmen', category: 'animals', emoji: '🐶', color: 'bg-orange-500 text-white', border: 'border-orange-600' },
  ];

  // Filter by parents active categories
  const filtered = allBubbles.filter((b) => settings.activeCategories.includes(b.category));
  const activeBubbles = filtered.length > 0 ? filtered : allBubbles;

  return activeBubbles.map((b, idx) => ({
    id: `bubble_${memberId}_${idx + 1}`,
    levelNumber: idx + 1,
    title: b.title,
    category: b.category,
    emoji: b.emoji,
    colorClass: b.color,
    borderColorClass: b.border,
    isCompleted: false,
    isLocked: false, // ALL PLAYABLE! No rigid lock!
    xpReward: 30,
  }));
}

/**
 * Returns a guaranteed set of 4 fun questions for any lesson
 */
export function getQuestionsForLesson(
  memberId: string,
  category: EducationalCategory
): EducationalQuestion[] {
  const settings = getKidModuleSettings(memberId);

  // If math, always generate fresh dynamic visual questions
  if (category === 'math') {
    return generateDynamicMathQuestions(settings.ageGroup, 4);
  }

  // Include custom parent questions first!
  const custom = settings.customQuestions.filter((q) => q.category === category);

  // Matching curated
  const matching = CURATED_QUESTIONS.filter((q) => q.category === category);

  // Shuffle and pick 4
  const pool = [...custom, ...matching.sort(() => Math.random() - 0.5)];

  if (pool.length >= 4) {
    return pool.slice(0, 4);
  }

  // Fallback with dynamic math or other questions to ensure at least 4 questions
  const fillers = generateDynamicMathQuestions(settings.ageGroup, 4 - pool.length);
  return [...pool, ...fillers];
}
