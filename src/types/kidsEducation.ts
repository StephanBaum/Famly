export type KidAgeGroup = 'ages_3_5' | 'ages_6_8' | 'ages_9_12';

export type EducationalCategory = 'animals' | 'math' | 'nature' | 'words';

export interface EducationalQuestion {
  id: string;
  category: EducationalCategory;
  question: string;
  emoji: string;
  visualPrompt?: string; // e.g. "🍎 🍎 🍎" for counting
  options: string[]; // 2 to 4 choices
  correctIndex: number;
  funFact: string; // Encouraging explanation shown after answering
  ageGroup: KidAgeGroup;
  isCustom?: boolean;
}

export interface KidModuleSettings {
  ageGroup: KidAgeGroup;
  activeCategories: EducationalCategory[];
  customQuestions: EducationalQuestion[];
}

export interface KidLessonNode {
  id: string;
  levelNumber: number;
  title: string;
  category: EducationalCategory;
  emoji: string;
  colorClass: string;
  borderColorClass: string;
  isCompleted: boolean;
  isLocked: boolean;
  xpReward: number;
}
