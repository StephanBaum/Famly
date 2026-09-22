import { Recipe, Ingredient, GroceryCategory } from '../types';
import { getMatchingFoodPhoto, inferGroceryCategory } from '../utils/recipeParser';

export type AIProvider = 'gemini' | 'openai';

export const STORAGE_KEY_AI_PROVIDER = 'famly_ai_provider';
export const STORAGE_KEY_AI_KEY = 'famly_ai_key';

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
}

let sharedAIConfig: AIConfig | null = null;

export const setSharedAIConfig = (config: AIConfig | null): void => {
  sharedAIConfig = config;
  if (typeof window !== 'undefined') {
    if (config && config.apiKey && config.apiKey.length >= 5) {
      localStorage.setItem(STORAGE_KEY_AI_PROVIDER, config.provider || 'gemini');
      localStorage.setItem(STORAGE_KEY_AI_KEY, config.apiKey.trim());
    } else if (config === null) {
      localStorage.removeItem(STORAGE_KEY_AI_KEY);
    }
  }
};

export const getAIConfig = (): AIConfig | null => {
  // 1. In-memory synced family config
  if (sharedAIConfig && sharedAIConfig.apiKey && sharedAIConfig.apiKey.length >= 5) {
    return sharedAIConfig;
  }

  // 2. Local storage config
  if (typeof window !== 'undefined') {
    const provider = (localStorage.getItem(STORAGE_KEY_AI_PROVIDER) as AIProvider) || 'gemini';
    const apiKey = (localStorage.getItem(STORAGE_KEY_AI_KEY) || '').trim();
    if (apiKey && apiKey.length >= 5) {
      return { provider, apiKey };
    }
  }

  // 3. Optional Vite env fallback (e.g. VITE_GEMINI_API_KEY set on Vercel)
  const envKey = (import.meta.env?.VITE_GEMINI_API_KEY as string | undefined)?.trim();
  if (envKey && envKey.length >= 5) {
    return { provider: 'gemini', apiKey: envKey };
  }

  return null;
};

export const isAIConfigured = (): boolean => {
  return getAIConfig() !== null;
};

export const saveAIConfig = (provider: AIProvider, apiKey: string): void => {
  const cleanKey = apiKey.trim();
  sharedAIConfig = { provider, apiKey: cleanKey };
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_AI_PROVIDER, provider);
    localStorage.setItem(STORAGE_KEY_AI_KEY, cleanKey);
  }
};

export const clearAIConfig = (): void => {
  sharedAIConfig = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY_AI_KEY);
    localStorage.setItem(STORAGE_KEY_AI_PROVIDER, 'gemini');
  }
};

export const GEMINI_FLASH_CANDIDATES = [
  'gemini-3.8-flash',
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-3.0-flash',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-1.5-flash-latest',
  'gemini-1.5-flash',
];

let cachedGeminiModel: string | null = null;

/**
 * Dynamically resolves the latest, cheapest available Gemini Flash model supported by the API key,
 * prioritizing Gemini 3+ Flash series.
 */
export const resolveGeminiFlashModel = async (apiKey: string): Promise<string> => {
  const cleanKey = apiKey.trim();
  if (cachedGeminiModel) return cachedGeminiModel;

  try {
    const listRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${cleanKey}`
    );
    if (listRes.ok) {
      const data = await listRes.json();
      const models: Array<{ name: string; supportedGenerationMethods?: string[] }> =
        data.models || [];

      // Filter for models supporting generateContent
      const supported = models
        .filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
        .map((m) => m.name.replace(/^models\//, ''));

      // 1. Prioritize any Gemini 3+ Flash model available on the user's key
      const gemini3Flash = supported.find(
        (name) => name.toLowerCase().includes('gemini-3') && name.toLowerCase().includes('flash')
      );
      if (gemini3Flash) {
        cachedGeminiModel = gemini3Flash;
        return gemini3Flash;
      }

      // 2. Pick from ordered priority list (latest cheapest flash first)
      for (const candidate of GEMINI_FLASH_CANDIDATES) {
        if (supported.includes(candidate)) {
          cachedGeminiModel = candidate;
          return candidate;
        }
      }

      // 3. Fallback: Any supported flash model
      const anyFlash = supported.find((name) => name.toLowerCase().includes('flash'));
      if (anyFlash) {
        cachedGeminiModel = anyFlash;
        return anyFlash;
      }
    }
  } catch (e) {
    console.warn('Could not query Gemini ListModels endpoint:', e);
  }

  // Default to Gemini 3.8 Flash (the latest cheapest flash model)
  cachedGeminiModel = 'gemini-3.8-flash';
  return cachedGeminiModel;
};

/**
 * Live test of the AI API key with a fast ping request
 */
export const testAIConnection = async (
  provider: AIProvider,
  apiKey: string
): Promise<{ success: boolean; message: string }> => {
  const cleanKey = apiKey.trim();
  if (!cleanKey) {
    return { success: false, message: 'Bitte gib einen API-Key ein.' };
  }

  try {
    if (provider === 'gemini') {
      const model = await resolveGeminiFlashModel(cleanKey);
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cleanKey}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Ping. Antworte kurz mit OK' }] }],
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errMsg = errorData?.error?.message || `HTTP ${res.status}`;

        // If the resolved model returned 404 or unsupported, cycle through remaining flash candidates
        let workingModel: string | null = null;
        for (const candidate of GEMINI_FLASH_CANDIDATES) {
          if (candidate === model) continue;
          try {
            const altEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${candidate}:generateContent?key=${cleanKey}`;
            const altRes = await fetch(altEndpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: 'Ping' }] }],
              }),
            });
            if (altRes.ok) {
              workingModel = candidate;
              cachedGeminiModel = candidate;
              break;
            }
          } catch {}
        }

        if (workingModel) {
          return {
            success: true,
            message: `✓ Verbindung erfolgreich! Google Gemini (${workingModel}) ist einsatzbereit.`,
          };
        }

        return {
          success: false,
          message: `Gemini API-Fehler: ${errMsg}. Prüfe deinen Google AI Studio Key.`,
        };
      }

      return {
        success: true,
        message: `✓ Verbindung erfolgreich! Google Gemini (${model}) ist einsatzbereit.`,
      };
    } else {
      // OpenAI
      const endpoint = 'https://api.openai.com/v1/chat/completions';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cleanKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Ping' }],
          max_tokens: 5,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errMsg = errorData?.error?.message || `HTTP ${res.status}`;
        return {
          success: false,
          message: `OpenAI API-Fehler: ${errMsg}. Prüfe deinen OpenAI Key.`,
        };
      }

      return {
        success: true,
        message: '✓ Verbindung erfolgreich! OpenAI GPT-4o-mini ist einsatzbereit.',
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: `Netzwerkfehler beim Verbinden: ${err?.message || 'Unbekannt'}`,
    };
  }
};

const RECIPE_JSON_PROMPT = `
Du bist ein erstklassiger kulinarischer Assistent für die Familien-App "Famly".
Analysiere die Rezeptanfrage / das Foto / den Link und erstelle ein vollständiges Rezept auf Deutsch im exakten JSON-Format.
Verwende präzise Mengenangaben und weise jeder Zutat die passende Supermarkt-Kategorie zu:
- "produce": Obst, Gemüse, frische Kräuter, Knoblauch, Kartoffeln, Zwiebeln
- "dairy": Milchprodukte, Sahne, Butter, Käse, Eier, Joghurt, Schmand
- "meat": Fleisch, Geflügel, Fisch, Meeresfrüchte, Speck, Wurst
- "bakery": Brot, Brötchen, Toast, Tortillas, Croissants
- "pantry": Gewürze, Nudeln, Reis, Mehl, Öle, Dosen, Essig, Zucker, Backpulver
- "household": Drogerie / Haushalt

Antworte AUSSCHLIESSLICH mit gültigem JSON ohne Markdown-Backticks:
{
  "title": "Titel des Rezepts",
  "prepTime": "z.B. 25 Min.",
  "servings": 4,
  "category": "quick" | "comfort" | "healthy" | "baking" | "family-favorite",
  "ingredients": [
    { "name": "Zutat", "amount": "z.B. 250g", "category": "produce" | "dairy" | "meat" | "bakery" | "pantry" }
  ],
  "instructions": [
    "Schritt 1: ...",
    "Schritt 2: ..."
  ],
  "notes": "Tipp für Familien...",
  "tags": ["Tag1", "Tag2"]
}
`;

/**
 * Generate structured recipe using user's configured AI (Gemini or OpenAI)
 */
export const generateRecipeWithAI = async (params: {
  prompt?: string;
  imageBase64?: string;
  linkUrl?: string;
  mode: 'describe' | 'photo' | 'link';
}): Promise<Omit<Recipe, 'id'>> => {
  const config = getAIConfig();
  if (!config) {
    throw new Error('Kein KI-Key konfiguriert');
  }

  const { provider, apiKey } = config;

  let rawJsonText = '';

  if (provider === 'gemini') {
    const model = await resolveGeminiFlashModel(apiKey);
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const parts: any[] = [{ text: RECIPE_JSON_PROMPT }];

    if (params.mode === 'photo' && params.imageBase64 && params.imageBase64.startsWith('data:')) {
      const match = params.imageBase64.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
      if (match) {
        const mimeType = match[1];
        const data = match[2];
        parts.push({
          inline_data: {
            mime_type: mimeType,
            data: data,
          },
        });
        parts.push({
          text: 'Lies dieses Foto (Kochbuchseite oder handgeschriebene Rezeptkarte) sorgfältig aus und erstelle das strukturierte Rezept.',
        });
      }
    } else if (params.mode === 'link') {
      parts.push({
        text: `Extrahiere oder rekonstruiere das Rezept für folgende Webadresse: ${params.linkUrl || params.prompt}`,
      });
    } else {
      parts.push({
        text: `Erstelle das Rezept für folgende Beschreibung/Wünsche der Familie: "${params.prompt}"`,
      });
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          response_mime_type: 'application/json',
          temperature: 0.3,
        },
      }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson?.error?.message || `Gemini API Fehler ${res.status}`);
    }

    const data = await res.json();
    rawJsonText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } else {
    // OpenAI GPT-4o-mini
    const endpoint = 'https://api.openai.com/v1/chat/completions';

    const userContent: any[] = [];

    if (params.mode === 'photo' && params.imageBase64) {
      userContent.push({
        type: 'text',
        text: 'Lies dieses Foto (Kochbuchseite oder handgeschriebenes Rezept) aus und erstelle das Rezept.',
      });
      userContent.push({
        type: 'image_url',
        image_url: { url: params.imageBase64 },
      });
    } else if (params.mode === 'link') {
      userContent.push({
        type: 'text',
        text: `Extrahiere das Rezept von diesem Link / Titel: ${params.linkUrl || params.prompt}`,
      });
    } else {
      userContent.push({
        type: 'text',
        text: `Erstelle das Rezept für folgende Beschreibung: "${params.prompt}"`,
      });
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: RECIPE_JSON_PROMPT },
          { role: 'user', content: userContent },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson?.error?.message || `OpenAI API Fehler ${res.status}`);
    }

    const data = await res.json();
    rawJsonText = data?.choices?.[0]?.message?.content || '';
  }

  // Parse structured JSON
  const cleanJson = rawJsonText.trim().replace(/^```json\s*/i, '').replace(/\s*```$/, '');
  const parsed = JSON.parse(cleanJson);

  const title = (parsed.title || 'Familien-Rezept').trim();
  const prepTime = (parsed.prepTime || '25 Min.').trim();
  const servings = Number(parsed.servings) || 4;
  const category: Recipe['category'] = ['quick', 'comfort', 'healthy', 'baking', 'family-favorite'].includes(parsed.category)
    ? parsed.category
    : 'family-favorite';

  const ingredients: Ingredient[] = Array.isArray(parsed.ingredients)
    ? parsed.ingredients.map((ing: any) => ({
        name: (ing.name || 'Zutat').trim(),
        amount: (ing.amount || 'nach Geschmack').trim(),
        category: (['produce', 'dairy', 'meat', 'bakery', 'pantry', 'household'].includes(ing.category)
          ? ing.category
          : inferGroceryCategory(ing.name)) as GroceryCategory,
      }))
    : [{ name: 'Zutaten nach Wahl', amount: 'nach Bedarf', category: 'pantry' }];

  const instructions: string[] = Array.isArray(parsed.instructions)
    ? parsed.instructions.map((step: any) => String(step).trim()).filter(Boolean)
    : ['Zutaten vorbereiten und nach Rezept zubereiten.'];

  const imageUrl = getMatchingFoodPhoto(title, parsed.notes || '');

  return {
    title,
    prepTime,
    servings,
    category,
    imageUrl,
    ingredients,
    instructions,
    notes: parsed.notes || `Mit Famly KI (${provider === 'gemini' ? 'Gemini 1.5 Flash' : 'GPT-4o-mini'}) generiert.`,
    tags: Array.isArray(parsed.tags) ? parsed.tags : ['KI-Rezept', 'Familie'],
    sourceType: params.mode,
  };
};
