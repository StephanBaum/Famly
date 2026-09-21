import { Redis } from '@upstash/redis';

function getRedisClient(): Redis | null {
  const url =
    process.env.KV_REST_API_URL ||
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.REDIS_URL;
  const token =
    process.env.KV_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.REDIS_TOKEN;
  if (!url || !token) return null;
  try {
    return new Redis({ url, token });
  } catch {
    return null;
  }
}

const REDIS_KEY_BRIEFING = 'famly:daily_briefing:v1';
const REDIS_KEY_STATE = 'famly:state:v1';

export default async function handler(req: any, res: any) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const redis = getRedisClient();

  try {
    // GET: Return current cached briefing
    if (req.method === 'GET') {
      const forceGenerate = req.query?.generate === 'true';

      if (redis && !forceGenerate) {
        const cached = await redis.get(REDIS_KEY_BRIEFING);
        if (cached) {
          const briefing = typeof cached === 'string' ? JSON.parse(cached) : cached;
          return res.status(200).json({
            success: true,
            briefing,
            source: 'cache',
          });
        }
      }

      // If force generation is requested or no cache, check if server-side Gemini key is available
      const geminiApiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

      if (!geminiApiKey) {
        // Return whatever cache exists or indicator to client to generate
        const cached = redis ? await redis.get(REDIS_KEY_BRIEFING) : null;
        return res.status(200).json({
          success: true,
          briefing: cached ? (typeof cached === 'string' ? JSON.parse(cached) : cached) : null,
          needsClientGeneration: !cached,
          message: 'Kein serverseitiger GEMINI_API_KEY hinterlegt. Client-Generierung aktiv.',
        });
      }

      // Server-side autonomous generation with Gemini 3+ Flash
      let stateData: any = null;
      if (redis) {
        const rawState = await redis.get(REDIS_KEY_STATE);
        if (rawState) {
          stateData = typeof rawState === 'string' ? JSON.parse(rawState) : rawState;
        }
      }

      const todayStr = new Date().toLocaleDateString('de-DE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const prompt = `Du bist der Famly-Hub KI-Assistent. Erstelle ein kompaktes, freundliches und motivierendes Tagesbriefing für den heutigen Tag (${todayStr}).
Familien-Daten (falls vorhanden):
- Termine: ${JSON.stringify(stateData?.calendarEvents?.slice(0, 8) || [])}
- Aufgaben: ${JSON.stringify(stateData?.chores?.slice(0, 8) || [])}
- Essensplan: ${JSON.stringify(stateData?.mealPlan || {})}

Antworte ausschließlich im folgenden JSON-Format ohne Markdown-Codeblöcke:
{
  "headline": "Guten Morgen Familie! ☀️",
  "summary": "Ein Satz über die Stimmung oder das Wichtigste heute.",
  "highlights": ["Punkt 1", "Punkt 2", "Punkt 3"],
  "tipOfTheDay": "Ein praktischer oder humorvoller Familientipp für heute"
}`;

      const modelsToTry = [
        'gemini-2.5-flash',
        'gemini-1.5-flash',
        'gemini-2.0-flash',
      ];

      let generatedJson: any = null;

      for (const model of modelsToTry) {
        try {
          const apiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`,
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

          if (apiRes.ok) {
            const data = await apiRes.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              const cleaned = text.replace(/```json\s*|```/g, '').trim();
              generatedJson = JSON.parse(cleaned);
              break;
            }
          }
        } catch (e) {
          // Continue to next model
        }
      }

      if (generatedJson) {
        const briefingPayload = {
          ...generatedJson,
          generatedAt: Date.now(),
          date: new Date().toISOString().split('T')[0],
          source: 'server_qstash',
        };

        if (redis) {
          // Cache for 24 hours
          await redis.set(REDIS_KEY_BRIEFING, JSON.stringify(briefingPayload), { ex: 86400 });
        }

        return res.status(200).json({
          success: true,
          briefing: briefingPayload,
          source: 'gemini_generated',
        });
      }

      return res.status(200).json({
        success: false,
        message: 'Briefing konnte nicht generiert werden.',
      });
    }

    // POST: Save briefing from client (when client generates it with their local Gemini Key)
    if (req.method === 'POST') {
      const { briefing } = req.body || {};
      if (!briefing) {
        return res.status(400).json({ success: false, error: 'Briefing data required' });
      }

      const payload = {
        ...briefing,
        generatedAt: Date.now(),
        date: new Date().toISOString().split('T')[0],
        source: 'client_saved',
      };

      if (redis) {
        await redis.set(REDIS_KEY_BRIEFING, JSON.stringify(payload), { ex: 86400 });
      }

      return res.status(200).json({
        success: true,
        briefing: payload,
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('Error in /api/briefing:', err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'Server error',
    });
  }
}
