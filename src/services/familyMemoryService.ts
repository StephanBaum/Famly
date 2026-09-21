export interface FamilyMemory {
  id: string;
  text: string;
  category: 'preference' | 'allergy' | 'schedule' | 'rule' | 'general';
  importance: number; // 1 to 5
  createdAt: number;
}

const STORAGE_KEY_MEMORIES = 'famly_longterm_memories_v1';

const DEFAULT_MEMORIES: FamilyMemory[] = [
  {
    id: 'mem_1',
    text: 'Gemeinsames Abendessen findet meist gegen 18:30 bis 19:00 Uhr statt.',
    category: 'schedule',
    importance: 4,
    createdAt: Date.now() - 86400000 * 3,
  },
  {
    id: 'mem_2',
    text: 'Am Wochenende kochen wir gerne zusammen oder probieren neue Rezepte aus.',
    category: 'preference',
    importance: 3,
    createdAt: Date.now() - 86400000 * 2,
  },
];

/**
 * Retrieves all stored family memories from local/synced storage
 */
export function getFamilyMemories(): FamilyMemory[] {
  if (typeof window === 'undefined') return DEFAULT_MEMORIES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MEMORIES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load family memories:', e);
  }
  return DEFAULT_MEMORIES;
}

/**
 * Saves a new persistent fact to the family long-term memory
 */
export function addFamilyMemory(
  text: string,
  category: FamilyMemory['category'] = 'general',
  importance: number = 3
): FamilyMemory {
  const current = getFamilyMemories();
  const cleanText = text.trim();
  
  // Avoid exact duplicates
  const existing = current.find((m) => m.text.toLowerCase() === cleanText.toLowerCase());
  if (existing) return existing;

  const newMemory: FamilyMemory = {
    id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    text: cleanText,
    category,
    importance,
    createdAt: Date.now(),
  };

  const updated = [newMemory, ...current].slice(0, 100); // cap at 100 memories
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY_MEMORIES, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save family memory:', e);
    }
  }

  return newMemory;
}

/**
 * Deletes a memory item
 */
export function deleteFamilyMemory(id: string): void {
  const current = getFamilyMemories();
  const filtered = current.filter((m) => m.id !== id);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY_MEMORIES, JSON.stringify(filtered));
    } catch (e) {
      console.warn('Failed to delete family memory:', e);
    }
  }
}

/**
 * Performs fast semantic keyword scoring to find relevant memories for a prompt/question
 */
export function getRelevantMemories(query: string, maxItems: number = 6): FamilyMemory[] {
  const memories = getFamilyMemories();
  if (memories.length === 0) return [];

  const tokens = query
    .toLowerCase()
    .replace(/[^\w\säöüß]/gi, '')
    .split(/\s+/)
    .filter((t) => t.length > 2);

  if (tokens.length === 0) {
    return memories.slice(0, maxItems);
  }

  const scored = memories.map((mem) => {
    let score = mem.importance || 1;
    const lower = mem.text.toLowerCase();
    for (const token of tokens) {
      if (lower.includes(token)) {
        score += 3;
      }
    }
    return { mem, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, maxItems)
    .map((s) => s.mem);
}

/**
 * Formats memories into a concise text block for LLM prompting
 */
export function formatMemoriesForPrompt(query?: string): string {
  const list = query ? getRelevantMemories(query, 6) : getFamilyMemories().slice(0, 8);
  if (list.length === 0) return 'Keine besonderen Erinnerungen hinterlegt.';
  return list.map((m) => ` - [${m.category}] ${m.text}`).join('\n');
}
