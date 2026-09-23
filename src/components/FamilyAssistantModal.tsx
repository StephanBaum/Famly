import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useFamily } from '../context/FamilyContext';
import { ModalPortal } from './ModalPortal';
import { queryFamilyAssistant, CopilotAction } from '../services/familyCopilotService';
import { executeRegisteredAction, undoRegisteredAction } from '../services/appActionRegistry';
import { getSituationAwareSuggestions } from '../services/copilot/dynamicSuggestionEngine';
import { AssistantVisualResultCard } from './assistant/AssistantVisualResultCard';
import { MarkdownMessage } from './MarkdownMessage';
import { startVoiceRecognition, VoiceSession } from '../services/voiceRecognitionService';
import { triggerHaptic } from '../utils/haptics';
import { ErrorBoundary } from './ErrorBoundary';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  Send,
  Mic,
  RotateCcw,
  Sparkles,
  X,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  actions?: CopilotAction[];
  timestamp: number;
}

interface FamilyAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings?: () => void;
  onNavigateTab?: (tab: string) => void;
}

const FamilyAssistantModalContent: React.FC<FamilyAssistantModalProps> = ({
  onClose,
  onOpenSettings,
  onNavigateTab,
}) => {
  const family = useFamily();
  const {
    familyName,
    members,
    appointments,
    chores,
    recipes,
    mealPlans,
    groceries,
    notes,
    rewards,
    loggedInMember,
    currentMemberId,
  } = family;

  // Defensively guard data arrays
  const safeMembers = Array.isArray(members) ? members.filter(Boolean) : [];
  const safeAppointments = Array.isArray(appointments) ? appointments.filter(Boolean) : [];
  const safeChores = Array.isArray(chores) ? chores.filter(Boolean) : [];
  const safeRecipes = Array.isArray(recipes) ? recipes.filter(Boolean) : [];
  const safeMealPlans = Array.isArray(mealPlans) ? mealPlans.filter(Boolean) : [];
  const safeGroceries = Array.isArray(groceries) ? groceries.filter(Boolean) : [];
  const safeNotes = Array.isArray(notes) ? notes.filter(Boolean) : [];
  const safeRewards = Array.isArray(rewards) ? rewards.filter(Boolean) : [];

  const copilotData = useMemo(() => ({
    familyName: familyName || 'Familie',
    members: safeMembers,
    appointments: safeAppointments,
    chores: safeChores,
    recipes: safeRecipes,
    mealPlans: safeMealPlans,
    groceries: safeGroceries,
    notes: safeNotes,
    rewards: safeRewards,
    loggedInMember,
    currentMemberId,
  }), [familyName, safeMembers, safeAppointments, safeChores, safeRecipes, safeMealPlans, safeGroceries, safeNotes, safeRewards, loggedInMember, currentMemberId]);

  // Real-time Dynamic Situation-Aware Suggestions
  const dynamicSuggestions = useMemo(() => {
    return getSituationAwareSuggestions(copilotData);
  }, [copilotData]);

  // Greeting by time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    const activeName = loggedInMember ? loggedInMember.name : (members[0]?.name || 'Familie');
    if (hour >= 5 && hour < 11) return { title: `Guten Morgen, ${activeName}! ☀️`, sub: 'Alles bereit für den Start in den Tag?' };
    if (hour >= 11 && hour < 14) return { title: `Mahlzeit, ${activeName}! 🍲`, sub: 'Wie kann ich beim Mittagessen oder bei Terminen helfen?' };
    if (hour >= 14 && hour < 18) return { title: `Guten Nachmittag, ${activeName}! 🌿`, sub: 'Schule, Freizeit und Abendessen im Blick.' };
    return { title: `Guten Abend, ${activeName}! 🌙`, sub: 'Tag abschließen und Pläne für morgen prüfen.' };
  }, [loggedInMember, members]);

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [actionSuccessNotice, setActionSuccessNotice] = useState<string | null>(null);

  // Voice State
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const sessionRef = useRef<VoiceSession | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isAiLoading]);

  // Clean up voice session on unmount
  useEffect(() => {
    return () => {
      if (sessionRef.current) {
        sessionRef.current.stop();
        sessionRef.current = null;
      }
    };
  }, []);

  const toggleVoice = async () => {
    setVoiceError(null);
    if (isListening && sessionRef.current) {
      sessionRef.current.stop();
      sessionRef.current = null;
      setIsListening(false);
      return;
    }

    const session = await startVoiceRecognition({
      onStart: () => {
        setIsListening(true);
        setVoiceError(null);
      },
      onTranscriptChange: (text) => {
        setChatInput(text);
      },
      onError: (msg) => {
        setVoiceError(msg);
        setIsListening(false);
        sessionRef.current = null;
      },
      onEnd: () => {
        setIsListening(false);
        sessionRef.current = null;
      },
    });

    if (session) {
      sessionRef.current = session;
    }
  };

  // Universal Action Execution Engine
  const handleExecuteAction = (action: CopilotAction): boolean => {
    try {
      const res = executeRegisteredAction(action.type, action.payload, {
        family,
        navigate: (tab) => {
          onClose();
          if ((tab as string) === 'settings') onOpenSettings?.();
          else onNavigateTab?.(tab);
        },
      });
      if (res.success) {
        setActionSuccessNotice(`✓ ${res.message}`);
        return true;
      }
      return false;
    } catch (e) {
      console.warn('handleExecuteAction failed:', e);
      return false;
    }
  };

  // Undo Action
  const handleUndoAction = (action: CopilotAction) => {
    try {
      const res = undoRegisteredAction(action.type, action.payload, {
        family,
        navigate: (tab) => onNavigateTab?.(tab),
      });
      if (res.success) {
        setActionSuccessNotice(`✓ ${res.message}`);
        setTimeout(() => setActionSuccessNotice(null), 3500);
      }
    } catch (e) {
      console.warn('handleUndoAction error:', e);
    }
  };

  // Send Chat message
  const handleSendChat = async (textToSend?: string) => {
    const query = (textToSend || chatInput).trim();
    if (!query || isAiLoading) return;

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      text: query,
      timestamp: Date.now(),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setIsAiLoading(true);

    try {
      const history = chatMessages.map((m) => ({ role: m.role, text: m.text }));
      const response = await queryFamilyAssistant(query, copilotData, history);

      // Auto-execute actions immediately
      const executedActions = (response.actions || []).map((act) => {
        const ok = handleExecuteAction(act);
        return { ...act, autoExecuted: ok };
      });

      if (executedActions.length > 0) {
        triggerHaptic('success');
        try {
          confetti({ particleCount: 35, spread: 50, origin: { y: 0.6 } });
        } catch {}
      }

      const assistantMsg: ChatMessage = {
        id: `a_${Date.now()}`,
        role: 'assistant',
        text: response.text,
        actions: executedActions,
        timestamp: Date.now(),
      };

      setChatMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `a_${Date.now()}`,
          role: 'assistant',
          text: 'Entschuldigung, ich konnte das gerade nicht verarbeiten. Bitte versuche es kurz noch einmal.',
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleResetConversation = () => {
    setChatMessages([]);
    setChatInput('');
    setActionSuccessNotice(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#F4F6F9] dark:bg-[#0c1222] text-stone-900 dark:text-white flex flex-col justify-between overflow-hidden animate-in fade-in select-none">
      
      {/* Top Bar: Clean Appliance Navigation */}
      <header className="p-4 sm:p-6 border-b border-stone-200/80 dark:border-slate-800/80 flex items-center justify-between gap-4 shrink-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="duo-btn duo-btn-white dark:bg-slate-800 dark:text-white px-4 py-2 rounded-2xl text-xs font-black flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 stroke-[3]" />
            <span>Zurück</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
              <span>Famly Assistent</span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                Proaktiv & Live
              </span>
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {chatMessages.length > 0 && (
            <button
              onClick={handleResetConversation}
              className="p-2 sm:px-3 sm:py-2 rounded-2xl bg-stone-100 dark:bg-slate-800 text-stone-500 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Unterhaltung zurücksetzen"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Zurücksetzen</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-2xl bg-stone-100 dark:bg-slate-800 text-stone-400 hover:text-stone-700 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Schließen"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </header>

      {/* Feedback Banner */}
      {actionSuccessNotice && (
        <div className="bg-emerald-500 text-white p-2.5 px-6 text-xs font-bold flex items-center justify-between shrink-0 animate-in fade-in">
          <span>{actionSuccessNotice}</span>
          <button onClick={() => setActionSuccessNotice(null)} className="p-0.5 hover:opacity-80">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Conversation Stage */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-8 flex flex-col justify-start max-w-4xl w-full mx-auto scrollbar-thin">
        {chatMessages.length === 0 ? (
          /* Serene Waiting State with Real-Time Dynamic Suggestions */
          <div className="my-auto py-8 text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-amber-100 dark:bg-amber-950/80 border-2 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 flex items-center justify-center text-3xl mx-auto shadow-sm animate-bounce">
                ✨
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-stone-900 dark:text-white">
                {greeting.title}
              </h1>
              <p className="text-sm sm:text-base font-bold text-stone-500 dark:text-slate-400 max-w-md mx-auto">
                {greeting.sub}
              </p>
            </div>

            {/* Dynamic Situation-Aware Cards */}
            <div className="space-y-3 max-w-2xl mx-auto text-left">
              <div className="text-xs font-black uppercase tracking-wider text-stone-400 dark:text-slate-500 px-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Situation für heute</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {dynamicSuggestions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSendChat(item.query)}
                    className="p-4 rounded-3xl bg-white dark:bg-slate-900 border-2 border-stone-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500 p-4 shadow-xs flex items-start gap-3.5 text-left transition-all hover:scale-102 active:scale-98 cursor-pointer group"
                  >
                    <span className="w-10 h-10 rounded-2xl bg-stone-100 dark:bg-slate-800 flex items-center justify-center text-2xl shrink-0 group-hover:scale-110 transition-transform">
                      {item.icon}
                    </span>
                    <div className="min-w-0">
                      {item.badge && (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300 block w-fit mb-1">
                          {item.badge}
                        </span>
                      )}
                      <h4 className="text-sm font-black text-stone-900 dark:text-white leading-tight">
                        {item.label}
                      </h4>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Active Chat Stream */
          <div className="space-y-4 pb-4">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[90%] sm:max-w-[80%] ${
                  msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-2xl flex items-center justify-center shrink-0 text-sm font-black shadow-xs ${
                    msg.role === 'user'
                      ? 'bg-stone-900 dark:bg-slate-700 text-white'
                      : 'bg-amber-400 text-stone-950 font-black'
                  }`}
                >
                  {msg.role === 'user' ? '👤' : '✨'}
                </div>

                <div className="space-y-2.5 min-w-0 flex-1">
                  <div
                    className={`p-4 rounded-3xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-amber-400 text-stone-950 font-bold rounded-tr-xs shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-stone-900 dark:text-slate-100 rounded-tl-xs border-2 border-stone-200/80 dark:border-slate-700 shadow-xs'
                    }`}
                  >
                    <MarkdownMessage text={msg.text} isUser={msg.role === 'user'} />
                  </div>

                  {/* Rich Visual Result Presentation Cards */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="space-y-2 pt-1">
                      {msg.actions.map((act, idx) => (
                        <AssistantVisualResultCard
                          key={idx}
                          action={act}
                          onUndo={handleUndoAction}
                          onExecute={handleExecuteAction}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isAiLoading && (
              <div className="flex gap-3 max-w-[80%] mr-auto items-center animate-in fade-in">
                <div className="w-8 h-8 rounded-2xl bg-amber-400 text-stone-950 flex items-center justify-center shrink-0 text-sm font-black shadow-xs">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                </div>
                <div className="p-4 rounded-3xl bg-white dark:bg-slate-800 border-2 border-stone-200 dark:border-slate-700 text-sm text-stone-500 dark:text-slate-400 font-bold animate-pulse">
                  Famly Butler denkt nach...
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>
        )}
      </main>

      {/* Voice Error Notice */}
      {voiceError && (
        <div className="max-w-2xl w-full mx-auto px-4 py-2 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-200 rounded-2xl flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 truncate">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="truncate">{voiceError}</span>
          </div>
          <button
            type="button"
            onClick={() => setVoiceError(null)}
            className="text-rose-500 hover:text-rose-700 font-bold text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Bottom Bar: Touch-Friendly Input & Microphone */}
      <footer className="p-4 sm:p-6 border-t border-stone-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendChat();
          }}
          className="max-w-3xl w-full mx-auto flex items-center gap-2.5"
        >
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder={
              isListening
                ? 'Famly hört zu... sprich jetzt...'
                : 'Frag etwas oder gib eine Anweisung (Termin, Notiz, Einkauf)...'
            }
            className={`flex-1 px-5 py-3.5 rounded-2xl bg-stone-100 dark:bg-slate-800 border-2 text-sm sm:text-base text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none transition-all shadow-inner ${
              isListening
                ? 'border-rose-500 ring-4 ring-rose-200 dark:ring-rose-950/60'
                : 'border-transparent focus:border-amber-400'
            }`}
          />

          {/* Big Tactile Microphone Button */}
          <button
            type="button"
            onClick={toggleVoice}
            title={isListening ? 'Zuhören beenden' : 'Sprach-Diktat starten (Mikrofon)'}
            className={`w-12 h-12 rounded-2xl border-2 transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-xs ${
              isListening
                ? 'bg-rose-500 text-white border-rose-600 animate-pulse ring-4 ring-rose-200 dark:ring-rose-950/60'
                : 'bg-white dark:bg-slate-800 text-stone-700 dark:text-slate-300 border-stone-200 dark:border-slate-700 hover:text-amber-500 active:scale-95'
            }`}
          >
            <Mic className={`w-5 h-5 ${isListening ? 'stroke-[3]' : 'stroke-[2.5]'}`} />
          </button>

          {/* Senden Button */}
          <button
            type="submit"
            disabled={!chatInput.trim() || isAiLoading}
            className="duo-btn duo-btn-amber px-6 py-3.5 rounded-2xl text-sm font-black flex items-center gap-2 disabled:opacity-40 shadow-xs cursor-pointer"
          >
            <Send className="w-4 h-4 stroke-[3]" />
            <span className="hidden sm:inline">Senden</span>
          </button>
        </form>
      </footer>

    </div>
  );
};

export const FamilyAssistantModal: React.FC<FamilyAssistantModalProps> = (props) => {
  if (!props.isOpen) return null;
  return (
    <ModalPortal>
      <ErrorBoundary>
        <FamilyAssistantModalContent {...props} />
      </ErrorBoundary>
    </ModalPortal>
  );
};
