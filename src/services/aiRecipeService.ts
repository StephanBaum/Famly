import { Recipe, Ingredient, GroceryCategory } from '../types';
import { getMatchingFoodPhoto, inferGroceryCategory } from '../utils/recipeParser';

export type AIProvider = 'gemini' | 'openai';

export const STORAGE_KEY_AI_PROVIDER = 'famly_ai_provider';
export const STORAGE_KEY_AI_KEY = 'famly_ai_key';

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
}

export const getAIConfig = (): AIConfig | null => {
  if (typeof window === 'undefined') return null;
  const provider = (localStorage.getItem(STORAGE_KEY_AI_PROVIDER) as AIProvider) || 'gemini';
  const apiKey = (localStorage.getItem(STORAGE_KEY_AI_KEY) || '').trim();

  if (!apiKey || apiKey.length < 5) return null;
  return { provider, apiKey };
};

export const isAIConfigured = (): boolean => {
  return getAIConfig() !== null;
};

export const saveAIConfig = (provider: AIProvider, apiKey: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_AI_PROVIDER, provider);
    localStorage.setItem(STORAGE_KEY_AI_KEY, apiKey.trim());
  }
};

export const clearAIConfig = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY_AI_KEY);
    // keep default provider as gemini
    localStorage.setItem(STORAGE_KEY_AI_PROVIDER, 'gemini');
  }
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
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${cleanKey}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Ping. Antworte mit: OK' }] }],
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errMsg = errorData?.error?.message || `HTTP ${res.status}`;
        return {
          success: false,
          message: `Gemini API-Fehler: ${errMsg}. Prüfe deinen Google AI Studio Key.`,
        };
      }

      return {
        success: true,
        message: '✓ Verbindung erfolgreich! Google Gemini 1.5 Flash ist einsatzbereit.',
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
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

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
