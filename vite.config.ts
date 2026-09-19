import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import type { IncomingMessage, ServerResponse } from 'http';

// Helper to convert ISO 8601 duration (e.g. PT45M, PT1H30M) into readable minutes
function parseDuration(durationStr?: string): string {
  if (!durationStr || typeof durationStr !== 'string') return '30 mins';
  const matches = durationStr.match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/i);
  if (!matches) return '30 mins';
  const days = parseInt(matches[1] || '0', 10);
  const hours = parseInt(matches[2] || '0', 10);
  const minutes = parseInt(matches[3] || '0', 10);
  const totalMinutes = days * 1440 + hours * 60 + minutes;
  return totalMinutes > 0 ? `${totalMinutes} mins` : '30 mins';
}

// Helper to clean HTML entities and extra spaces
function cleanText(text?: string): string {
  if (!text) return '';
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Vite plugin providing the /api/scrape-recipe endpoint
function recipeScraperPlugin(): Plugin {
  return {
    name: 'recipe-scraper-plugin',
    configureServer(server) {
      server.middlewares.use('/api/scrape-recipe', async (req: IncomingMessage, res: ServerResponse) => {
        const parsedUrl = new URL(req.url || '', 'http://localhost:3000');
        let targetUrl = parsedUrl.searchParams.get('url');

        res.setHeader('Content-Type', 'application/json');

        if (!targetUrl) {
          res.statusCode = 400;
          res.end(JSON.stringify({ success: false, error: 'Missing url parameter' }));
          return;
        }

        // Normalize URL protocol
        if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
          targetUrl = 'https://' + targetUrl;
        }

        try {
          const response = await fetch(targetUrl, {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
              'Accept':
                'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
              'Accept-Language': 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7',
              'Sec-Fetch-Dest': 'document',
              'Sec-Fetch-Mode': 'navigate',
              'Sec-Fetch-Site': 'none',
              'Cache-Control': 'no-cache',
            },
          });

          if (!response.ok) {
            res.statusCode = 200;
            res.end(
              JSON.stringify({
                success: false,
                status: response.status,
                error: `Website returned HTTP ${response.status}`,
              })
            );
            return;
          }

          const html = await response.text();

          // Search for JSON-LD scripts
          const jsonLdRegex = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi;
          let match: RegExpExecArray | null;
          let recipeSchema: any = null;

          while ((match = jsonLdRegex.exec(html)) !== null) {
            try {
              const parsed = JSON.parse(match[1]);
              const items = Array.isArray(parsed)
                ? parsed
                : parsed['@graph']
                ? parsed['@graph']
                : [parsed];

              for (const item of items) {
                if (
                  item['@type'] === 'Recipe' ||
                  (Array.isArray(item['@type']) && item['@type'].includes('Recipe'))
                ) {
                  recipeSchema = item;
                  break;
                }
              }
              if (recipeSchema) break;
            } catch {
              // continue
            }
          }

          if (recipeSchema) {
            // 1. Title
            const title = cleanText(recipeSchema.name || recipeSchema.headline || 'Imported Recipe');

            // 2. Prep & Total Time
            const rawTime =
              recipeSchema.totalTime || recipeSchema.cookTime || recipeSchema.prepTime;
            const prepTime = parseDuration(rawTime);

            // 3. Servings / Yield
            let servings = 4;
            if (recipeSchema.recipeYield) {
              const yieldStr = Array.isArray(recipeSchema.recipeYield)
                ? recipeSchema.recipeYield.join(' ')
                : String(recipeSchema.recipeYield);
              const numMatch = yieldStr.match(/\d+/);
              if (numMatch) servings = parseInt(numMatch[0], 10);
            }

            // 4. Ingredients
            const rawIngredients: string[] = Array.isArray(recipeSchema.recipeIngredient)
              ? recipeSchema.recipeIngredient
              : [];

            const parsedIngredients = rawIngredients
              .map((ingStr) => cleanText(ingStr))
              .filter(Boolean)
              .map((line) => {
                // Regex to extract leading amounts (e.g. "500 g", "3", "2 EL", "1/2 cup", "etwas")
                const match = line.match(
                  /^([\d\/\.,\s]+(?:\s*(?:kg|g|ml|l|liter|el|tl|tbsp|tsp|cups?|tassen?|dosen?|cans?|zehen?|cloves?|scheiben?|slices?|bund|bunch|prise|pinch|pck|packung|pkg|stk|st\.?|stücke?))?)\s*(.*)$/i
                );
                if (match && match[1] && match[2]) {
                  return {
                    name: match[2].trim(),
                    amount: match[1].trim(),
                  };
                }
                return {
                  name: line,
                  amount: 'nach Bedarf',
                };
              });

            // 5. Instructions
            const instructions: string[] = [];
            const rawInstructions = recipeSchema.recipeInstructions;

            if (Array.isArray(rawInstructions)) {
              for (const step of rawInstructions) {
                if (typeof step === 'string') {
                  const c = cleanText(step);
                  if (c) instructions.push(c);
                } else if (step && step.text) {
                  const c = cleanText(step.text);
                  if (c) instructions.push(c);
                } else if (step && step['@type'] === 'HowToSection' && Array.isArray(step.itemListElement)) {
                  for (const subStep of step.itemListElement) {
                    const c = cleanText(subStep.text || subStep.name);
                    if (c) instructions.push(c);
                  }
                }
              }
            } else if (typeof rawInstructions === 'string') {
              instructions.push(cleanText(rawInstructions));
            }

            // 6. Image
            let imageUrl = '';
            if (typeof recipeSchema.image === 'string') {
              imageUrl = recipeSchema.image;
            } else if (Array.isArray(recipeSchema.image) && recipeSchema.image.length > 0) {
              imageUrl =
                typeof recipeSchema.image[0] === 'string'
                  ? recipeSchema.image[0]
                  : recipeSchema.image[0]?.url || '';
            } else if (recipeSchema.image && recipeSchema.image.url) {
              imageUrl = recipeSchema.image.url;
            }

            // 7. Category & Tags
            const category = recipeSchema.recipeCategory
              ? Array.isArray(recipeSchema.recipeCategory)
                ? recipeSchema.recipeCategory.join(', ')
                : recipeSchema.recipeCategory
              : 'Family Favorite';

            const description = cleanText(recipeSchema.description || '');

            res.end(
              JSON.stringify({
                success: true,
                recipe: {
                  title,
                  prepTime,
                  servings,
                  category,
                  description,
                  imageUrl: imageUrl || undefined,
                  ingredients: parsedIngredients,
                  instructions,
                  sourceUrl: targetUrl,
                },
              })
            );
            return;
          }

          // Fallback: OpenGraph tags extraction
          const ogTitleMatch = html.match(/<meta property="og:title" content="([^"]+)"/i);
          const ogImageMatch = html.match(/<meta property="og:image" content="([^"]+)"/i);
          const ogDescMatch = html.match(/<meta property="og:description" content="([^"]+)"/i);
          const pageTitleMatch = html.match(/<title>([^<]+)<\/title>/i);

          const title = cleanText(ogTitleMatch?.[1] || pageTitleMatch?.[1] || 'Imported Recipe');
          const imageUrl = ogImageMatch?.[1] || '';
          const description = cleanText(ogDescMatch?.[1] || '');

          res.end(
            JSON.stringify({
              success: true,
              recipe: {
                title,
                prepTime: '30 mins',
                servings: 4,
                category: 'family-favorite',
                description,
                imageUrl: imageUrl || undefined,
                ingredients: [],
                instructions: [],
                sourceUrl: targetUrl,
              },
            })
          );
        } catch (err: any) {
          res.statusCode = 500;
          res.end(JSON.stringify({ success: false, error: err?.message || 'Failed to fetch URL' }));
        }
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), recipeScraperPlugin()],
  server: {
    host: true,
    port: 3000,
    open: false,
  },
});
