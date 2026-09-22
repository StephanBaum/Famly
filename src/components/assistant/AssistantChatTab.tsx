import React, { useRef, useEffect } from 'react';
import { Send, Key, RefreshCw, Undo2 } from 'lucide-react';
import { MarkdownMessage } from '../MarkdownMessage';
import { CopilotAction } from '../../services/familyCopilotService';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  actions?: CopilotAction[];
  timestamp: number;
}

interface AssistantChatTabProps {
  chatMessages: ChatMessage[];
  chatInput: string;
  setChatInput: (val: string) => void;
  isAiLoading: boolean;
  onSendChat: (textToSend?: string) => void;
  onUndoAction: (action: CopilotAction) => void;
  onExecuteAction: (action: CopilotAction) => boolean;
  hasApiKey: boolean;
  onOpenSettings?: () => void;
  onClose: () => void;
}

export const AssistantChatTab: React.FC<AssistantChatTabProps> = ({
  chatMessages,
  chatInput,
  setChatInput,
  isAiLoading,
  onSendChat,
  onUndoAction,
  onExecuteAction,
  hasApiKey,
  onOpenSettings,
  onClose,
}) => {
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isAiLoading]);

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Notice when API key is missing */}
      {!hasApiKey && (
        <div className="mx-4 sm:mx-5 mt-3 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 flex items-center justify-between gap-2.5 shrink-0 animate-in fade-in">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 flex items-center justify-center text-sm font-black shrink-0">
              <Key className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h5 className="text-xs font-black text-stone-900 dark:text-white truncate">
                Google Gemini 3+ Flash Key einrichten
              </h5>
              <p className="text-[11px] text-stone-600 dark:text-slate-300">
                Aktuell im lokalen Modus. Verbinde deinen kostenlosen Key für smarte KI-Antworten.
              </p>
            </div>
          </div>
          {onOpenSettings && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSettings();
              }}
              className="duo-btn duo-btn-amber px-3 py-1.5 text-xs font-black rounded-xl whitespace-nowrap shrink-0"
            >
              Key eingeben ➔
            </button>
          )}
        </div>
      )}

      {/* Message Stream */}
      <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-3.5 scrollbar-thin">
        {chatMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2.5 max-w-[85%] ${
              msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs font-black ${
                msg.role === 'user'
                  ? 'bg-stone-800 dark:bg-stone-700 text-white'
                  : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
              }`}
            >
              {msg.role === 'user' ? '👤' : '✨'}
            </div>

            <div className="space-y-2">
              <div
                className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-amber-400 text-stone-950 font-semibold rounded-tr-xs shadow-xs'
                    : 'bg-stone-100 dark:bg-slate-800 text-stone-800 dark:text-slate-100 rounded-tl-xs border border-stone-200/60 dark:border-slate-700'
                }`}
              >
                <MarkdownMessage text={msg.text} isUser={msg.role === 'user'} />
              </div>

              {/* Attached Action Cards (Auto-Executed with 1-click Undo) */}
              {msg.actions && msg.actions.length > 0 && (
                <div className="flex flex-col gap-1.5 pt-1">
                  {msg.actions.map((act, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700/60 text-xs font-bold text-emerald-900 dark:text-emerald-200 shadow-2xs animate-in fade-in"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-emerald-600 dark:text-emerald-400 font-black">✓</span>
                        <span className="truncate">{act.description}</span>
                      </div>
                      {act.autoExecuted ? (
                        <button
                          type="button"
                          onClick={() => onUndoAction(act)}
                          className="text-[11px] font-black underline text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 shrink-0 cursor-pointer flex items-center gap-1"
                        >
                          <Undo2 className="w-3 h-3" />
                          <span>Rückgängig</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            const ok = onExecuteAction(act);
                            if (ok) act.autoExecuted = true;
                          }}
                          className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white text-[11px] font-black hover:bg-emerald-700 shrink-0"
                        >
                          Jetzt eintragen
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isAiLoading && (
          <div className="flex gap-2.5 max-w-[85%] mr-auto items-center">
            <div className="w-7 h-7 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center justify-center shrink-0 text-xs">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            </div>
            <div className="p-3 rounded-2xl bg-stone-100 dark:bg-slate-800 text-xs text-stone-500 dark:text-slate-400 font-semibold animate-pulse">
              Famly denkt nach...
            </div>
          </div>
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Quick Prompt Chips */}
      <div className="p-2.5 px-4 bg-stone-50/80 dark:bg-slate-800/40 border-t border-stone-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0">
        <button
          type="button"
          onClick={() => onSendChat('Was steht heute an?')}
          className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-stone-600 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-slate-700 shrink-0"
        >
          📅 Was steht heute an?
        </button>
        <button
          type="button"
          onClick={() => onSendChat('Was essen wir heute laut Essensplan?')}
          className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-stone-600 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-slate-700 shrink-0"
        >
          🍲 Was essen wir heute?
        </button>
        <button
          type="button"
          onClick={() => onSendChat('Welche Aufgaben sind noch offen?')}
          className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-stone-600 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-slate-700 shrink-0"
        >
          🧹 Offene Aufgaben
        </button>
        <button
          type="button"
          onClick={() => onSendChat('Häng eine Notiz ans schwarze Brett mit...')}
          className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-stone-600 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-slate-700 shrink-0"
        >
          📌 Notiz anpinnen
        </button>
        <button
          type="button"
          onClick={() => onSendChat('Wer hat die meisten Sterne?')}
          className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-stone-600 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-slate-700 shrink-0"
        >
          ⭐ Sternen-Rangliste
        </button>
      </div>

      {/* Chat Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSendChat();
        }}
        className="p-3 sm:p-4 bg-white dark:bg-slate-900 border-t border-stone-100 dark:border-slate-800 flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder="Frag etwas oder gib eine Anweisung (Termin, Notiz, Sterne, Einkauf)..."
          className="flex-1 px-4 py-2.5 rounded-2xl bg-stone-100 dark:bg-slate-800 border border-transparent focus:border-amber-500 text-xs sm:text-sm text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!chatInput.trim() || isAiLoading}
          className="duo-btn duo-btn-amber px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-1.5 disabled:opacity-40"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Senden</span>
        </button>
      </form>
    </div>
  );
};
