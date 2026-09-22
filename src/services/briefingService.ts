import { getAIConfig, resolveGeminiFlashModel } from './aiRecipeService';
import { formatMemoriesForPrompt } from './familyMemoryService';

export interface DailyBriefing {
  headline: string;
  summary: string;
  highlights: string[];
  tipOfTheDay?: string;
  generatedAt: number;
  date: string;
  source?: string;
}

const STORAGE_KEY_BRIEFING = 'famly_daily_briefing_cache';

export async function getCachedDailyBriefing(): Promise<DailyBriefing | null> {
  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Check local storage
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_BRIEFING);
      if (raw) {
        const parsed: DailyBriefing = JSON.parse(raw);
        if (parsed.date === todayStr) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
  }

  // 2. Check server Redis cache (/api/briefing)
  try {
    const res = await fetch('/api/briefing', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.briefing && data.briefing.date === todayStr) {
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY_BRIEFING, JSON.stringify(data.briefing));
        }
        return data.briefing;
      }
    }
  } catch {
    // offline or local dev
  }

  return null;
}

export async function generateDailyBriefing(context: {
  familyName?: string;
  events?: any[];
  chores?: any[];
  meals?: any;
  members?: any[];
}): Promise<DailyBriefing> {
  const todayStr = new Date().toISOString().split('T')[0];
  const aiConfig = getAIConfig();

  // Try server generation first if available
  try {
    const serverRes = await fetch('/api/briefing?generate=true');
    if (serverRes.ok) {
      const serverData = await serverRes.json();
      if (serverData.success && serverData.briefing) {
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY_BRIEFING, JSON.stringify(serverData.briefing));
        }
        return serverData.briefing;
      }
    }
  } catch {
    // fallback to client-side generation
  }

  // Client-side generation using Gemini 3+ Flash if configured
  if (aiConfig && aiConfig.apiKey) {
    try {
      const model = await resolveGeminiFlashModel(aiConfig.apiKey);
      const weekday = new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });

      const prompt = `Du bist der persönliche KI-Familienassistent für Familie ${context.familyName || 'Baum'}.
Heute ist ${weekday}.

Heutige Termine:
${context.events && context.events.length > 0 ? context.events.map((e) => `- ${e.title} (${e.time || 'ganztägig'})`).join('\n') : 'Keine anstehenden Termine.'}

Offene Aufgaben für heute:
${context.chores && context.chores.length > 0 ? context.chores.slice(0, 5).map((c) => `- ${c.title}`).join('\n') : 'Keine dringenden Aufgaben.'}

Essensplan heute:
${context.meals?.lunch ? `Mittag: ${context.meals.lunch}` : ''}
${context.meals?.dinner ? `Abend: ${context.meals.dinner}` : 'Noch nichts geplant.'}

Familiengedächtnis / Vorlieben:
${formatMemoriesForPrompt()}

Erstelle ein charmantes, positives und kompaktes Morgenbriefing für die Familie.
Antworte AUSSCHLIESSLICH als valides JSON ohne Markdown-Backticks:
{
  "headline": "Guten Morgen Familie ${context.familyName || 'Baum'}! ☀️",
  "summary": "1-2 herzliche Sätze zum heutigen Tag und der Stimmung.",
  "highlights": [
    "📌 Wichtigster Termin oder Vorhaben",
    "🍽️ Was es heute zu essen gibt oder gekocht werden könnte",
    "✨ Motivierender Fokus für Groß und Klein"
  ],
  "tipOfTheDay": "Ein kurzer, nützlicher oder witziger Familientipp für den heutigen Tag."
}`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${aiConfig.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 600,
              responseMimeType: 'application/json',
            },
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const cleaned = text.replace(/```json\s*|```/g, '').trim();
          const parsed = JSON.parse(cleaned);

          const briefing: DailyBriefing = {
            headline: parsed.headline || `Guten Morgen Familie ${context.familyName || 'Baum'}! ☀️`,
            summary: parsed.summary || 'Hier ist euer Überblick für den heutigen Tag.',
            highlights: Array.isArray(parsed.highlights) ? parsed.highlights : ['Habt einen wunderbaren Tag!'],
            tipOfTheDay: parsed.tipOfTheDay || 'Zusammenhalt macht jeden Tag schöner.',
            generatedAt: Date.now(),
            date: todayStr,
            source: 'gemini_client',
          };

          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY_BRIEFING, JSON.stringify(briefing));
          }

          // Sync to Redis cache
          fetch('/api/briefing', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ briefing }),
          }).catch(() => {});

          return briefing;
        }
      }
    } catch (err) {
      console.warn('Gemini briefing generation failed:', err);
    }
  }

  // Graceful fallback briefing
  const weekday = new Date().toLocaleDateString('de-DE', { weekday: 'long' });
  const fallbackBriefing: DailyBriefing = {
    headline: `Guten Morgen Familie ${context.familyName || 'Baum'}! ☀️`,
    summary: `Einen wunderschönen ${weekday} für euch alle!`,
    highlights: [
      context.events && context.events.length > 0
        ? `📅 ${context.events.length} Termin(e) heute im Kalender`
        : '📅 Heute stehen keine festen Termine an – Zeit für euch!',
      context.meals?.dinner
        ? `🍽️ Abendessen: ${context.meals.dinner}`
        : '🍽️ Essensplan für heute noch offen – Zeit für eine gemeinsame Idee!',
      context.chores && context.chores.length > 0
        ? `🧹 ${context.chores.length} offene Aufgabe(n) im Plan`
        : '🧹 Keine dringenden Hausarbeiten – super gemacht!',
    ],
    tipOfTheDay: 'Ein Lächeln am Morgen schenkt Energie für den ganzen Tag.',
    generatedAt: Date.now(),
    date: todayStr,
    source: 'template_fallback',
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_BRIEFING, JSON.stringify(fallbackBriefing));
  }

  return fallbackBriefing;
}

/**
 * Saves a custom morning briefing (e.g. created by Famly Copilot workflow / greeting prompt)
 * and dispatches a window event so DailyBriefingCard updates in real-time.
 */
export function saveCustomDailyBriefing(briefing: Partial<DailyBriefing>): DailyBriefing {
  const todayStr = new Date().toISOString().split('T')[0];
  const fullBriefing: DailyBriefing = {
    headline: briefing.headline || 'Guten Morgen Familie! ☀️',
    summary: briefing.summary || 'Hier sind eure persönlichen Tagesgrüße.',
    highlights: Array.isArray(briefing.highlights) && briefing.highlights.length > 0
      ? briefing.highlights
      : ['Personalisiertes Morgen-Briefing aktiv'],
    tipOfTheDay: briefing.tipOfTheDay || 'Einen wunderbaren Start in den Tag!',
    generatedAt: Date.now(),
    date: todayStr,
    source: 'assistant_workflow',
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_BRIEFING, JSON.stringify(fullBriefing));
    window.dispatchEvent(new CustomEvent('famly_daily_briefing_updated', { detail: fullBriefing }));
  }

  // Also sync to Redis if available
  fetch('/api/briefing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ briefing: fullBriefing }),
  }).catch(() => {});

  return fullBriefing;
}
