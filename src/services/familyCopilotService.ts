import { getAIConfig, resolveGeminiFlashModel } from './aiRecipeService';
import { formatMemoriesForPromptAsync } from './familyMemoryService';
import {
  CopilotFamilyData,
  CopilotAction,
  CopilotResponse,
} from './copilot/copilotTypes';
import { buildCopilotSystemPrompt } from './copilot/copilotPromptBuilder';
import { queryLocalFamilyAssistant } from './copilot/copilotLocalEngine';

// Re-export all types and helper functions for backward compatibility
export * from './copilot/copilotTypes';
export { buildFamilyContextSummary, buildCopilotSystemPrompt } from './copilot/copilotPromptBuilder';
export { queryLocalFamilyAssistant } from './copilot/copilotLocalEngine';

/**
 * Parses action tags formatted as [ACTION:TYPE:{...}] from LLM responses.
 */
function parseActionsFromLLM(rawResponse: string): { actions: CopilotAction[]; cleanText: string } {
  const actions: CopilotAction[] = [];
  let cleanText = rawResponse;

  const actionRegex = /\[ACTION:([A-Z_]+):(.*?)\]/g;
  let match;
  while ((match = actionRegex.exec(rawResponse)) !== null) {
    const actionType = match[1] as CopilotAction['type'];
    try {
      const payload = JSON.parse(match[2]);
      let description = 'Aktion ausführen';
      if (actionType === 'ADD_GROCERY') description = `"${payload.name}" auf die Einkaufsliste`;
      else if (actionType === 'CHECK_GROCERY') description = `"${payload.name}" als erledigt markiert 🛒`;
      else if (actionType === 'DELETE_GROCERY') description = `"${payload.name}" von der Einkaufsliste gelöscht`;
      else if (actionType === 'CLEAR_CHECKED_GROCERIES') description = `Erledigte Einkäufe aus Korb geleert`;
      else if (actionType === 'ADD_ALWAYS_IN_STOCK') description = `"${payload.name}" zu Vorräten hinzugefügt 🏠`;
      else if (actionType === 'SET_MEAL') description = `"${payload.title}" in den Essensplan (${payload.date || 'Heute'})`;
      else if (actionType === 'CLEAR_MEAL') description = `Essensplan für ${payload.date || 'Heute'} geleert`;
      else if (actionType === 'ADD_RECIPE_TO_GROCERIES') description = `Zutaten für "${payload.title}" zur Einkaufsliste`;
      else if (actionType === 'ADD_RECIPE') description = `Rezept "${payload.title}" gespeichert 🍲`;
      else if (actionType === 'FAVORITE_RECIPE') description = `Rezept "${payload.title}" als Favorit ⭐ markiert`;
      else if (actionType === 'ADD_APPOINTMENT') description = `Termin "${payload.title}" in Kalender (${payload.date || 'Heute'} ${payload.time || ''})`;
      else if (actionType === 'DELETE_APPOINTMENT') description = `Termin "${payload.title}" gelöscht / abgesagt 📅`;
      else if (actionType === 'SCHEDULE_CHORE') description = `"${payload.title || 'Aufgabe'}" in den Kalender (${payload.date || 'Heute'} ${payload.time || ''})`;
      else if (actionType === 'ADD_CHORE') description = `Aufgabe "${payload.title}" anlegen`;
      else if (actionType === 'COMPLETE_CHORE') description = `Aufgabe "${payload.title}" als erledigt markiert ⭐`;
      else if (actionType === 'DELETE_CHORE') description = `Aufgabe "${payload.title}" gelöscht`;
      else if (actionType === 'ADD_NOTE') description = `Notiz "${payload.title}" an Pinnwand geheftet 📌`;
      else if (actionType === 'DELETE_NOTE') description = `Notiz "${payload.title}" von Pinnwand entfernt`;
      else if (actionType === 'UPDATE_CHILD_DETAILS') description = `Details für ${payload.childName || 'Kind'} aktualisiert 🧸`;
      else if (actionType === 'AWARD_STARS') description = `${payload.stars} Sterne an ${payload.memberName} vergeben ⭐`;
      else if (actionType === 'ADD_REWARD') description = `Belohnung "${payload.title}" angelegt 🎁`;
      else if (actionType === 'CLAIM_REWARD') description = `Belohnung "${payload.title}" eingelöst 🎁`;
      else if (actionType === 'CLEAN_SHOPPING_LIST') description = `Einkaufsliste bereinigt`;
      else if (actionType === 'SET_MORNING_BRIEFING') description = `Morgengrüße in Dashboard-Routine gespeichert`;
      else if (actionType === 'NAVIGATE') description = `Zu "${payload.tab}" navigiert`;
      else if (actionType === 'SAVE_MEMORY') description = `Fakt "${payload.text}" im Familiengedächtnis gespeichert 🧠`;
      else if (actionType === 'DELETE_MEMORY') description = `Erinnerung aus Familiengedächtnis gelöscht`;

      actions.push({ type: actionType, payload, description });
    } catch {
      // ignore malformed JSON payload
    }
  }

  cleanText = cleanText.replace(actionRegex, '').trim();
  return { actions, cleanText };
}

/**
 * Executes a query through the configured LLM (Gemini / OpenAI) or falls back to local heuristics.
 */
export async function queryFamilyAssistant(
  userQuery: string,
  data: CopilotFamilyData,
  chatHistory: Array<{ role: 'user' | 'assistant'; text: string }> = []
): Promise<CopilotResponse> {
  const aiConfig = getAIConfig();

  if (!aiConfig || !aiConfig.apiKey) {
    return queryLocalFamilyAssistant(userQuery, data);
  }

  try {
    // 1. Semantic Memory Retrieval from Vector Store / Synced Cache
    const semanticMemoriesText = await formatMemoriesForPromptAsync(userQuery);

    // 2. Build Comprehensive Prompt
    const systemPrompt = buildCopilotSystemPrompt(data, chatHistory, semanticMemoriesText);

    let rawResponse = '';

    if (aiConfig.provider === 'gemini') {
      const model = await resolveGeminiFlashModel(aiConfig.apiKey);
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${aiConfig.apiKey}`;

      // Build proper multi-turn Gemini conversation history
      const geminiContents: Array<{ role: 'user' | 'model'; parts: [{ text: string }] }> = [];
      const recentHistory = chatHistory.slice(-8);

      for (const turn of recentHistory) {
        if (!turn.text || !turn.text.trim()) continue;
        const role = turn.role === 'assistant' ? 'model' : 'user';
        if (geminiContents.length > 0 && geminiContents[geminiContents.length - 1].role === role) {
          geminiContents[geminiContents.length - 1].parts[0].text += `\n\n${turn.text}`;
        } else {
          geminiContents.push({ role, parts: [{ text: turn.text }] });
        }
      }

      if (geminiContents.length > 0 && geminiContents[geminiContents.length - 1].role === 'user') {
        geminiContents[geminiContents.length - 1].parts[0].text += `\n\n${userQuery}`;
      } else {
        geminiContents.push({ role: 'user', parts: [{ text: userQuery }] });
      }

      // First turn must have role 'user'
      if (geminiContents.length > 0 && geminiContents[0].role === 'model') {
        geminiContents.unshift({ role: 'user', parts: [{ text: 'Hallo Famly Assistent!' }] });
      }

      const requestBody: any = {
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: geminiContents,
        generationConfig: {
          temperature: 0.6,
        },
      };

      let res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        // Fallback: embed systemPrompt directly in contents if systemInstruction is rejected
        const fallbackContents = [
          {
            role: 'user',
            parts: [{
              text: `${systemPrompt}\n\n--- UNTERHALTUNGSVERLAUF ---\n${chatHistory.slice(-6).map((h) => `${h.role === 'user' ? 'Nutzer' : 'Assistent'}: ${h.text}`).join('\n\n')}\n\nAktuelle Nutzeranfrage: ${userQuery}`,
            }],
          },
        ];
        res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: fallbackContents }),
        });
      }

      if (!res.ok) {
        return queryLocalFamilyAssistant(userQuery, data);
      }

      const json = await res.json();
      rawResponse = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } else {
      // OpenAI
      const endpoint = 'https://api.openai.com/v1/chat/completions';
      const messages = [
        { role: 'system', content: systemPrompt },
        ...chatHistory.slice(-6).map((h) => ({ role: h.role, content: h.text })),
        { role: 'user', content: userQuery },
      ];

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${aiConfig.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages,
          temperature: 0.6,
        }),
      });

      if (!res.ok) {
        return queryLocalFamilyAssistant(userQuery, data);
      }

      const json = await res.json();
      rawResponse = json.choices?.[0]?.message?.content || '';
    }

    if (!rawResponse) {
      return queryLocalFamilyAssistant(userQuery, data);
    }

    const { actions, cleanText } = parseActionsFromLLM(rawResponse);

    return {
      text: cleanText,
      actions: actions.length > 0 ? actions : undefined,
      source: 'ai',
    };
  } catch (err) {
    console.error('AI assistant query failed, falling back to local heuristics:', err);
    return queryLocalFamilyAssistant(userQuery, data);
  }
}
