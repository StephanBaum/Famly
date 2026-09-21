import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useFamily } from '../context/FamilyContext';
import { ModalPortal } from './ModalPortal';
import {
  generateChoreCalendarProposals,
  ChoreScheduleProposal,
} from '../services/choreSchedulerService';
import {
  queryFamilyAssistant,
  CopilotAction,
} from '../services/familyCopilotService';
import { decideAutonomous, DecisionResult } from '../services/decisionService';
import { getFamilyMemories } from '../services/familyMemoryService';
import { format, addDays } from 'date-fns';
import { de } from 'date-fns/locale';
import confetti from 'canvas-confetti';
import { ErrorBoundary } from './ErrorBoundary';
import { MarkdownMessage } from './MarkdownMessage';
import { getAIConfig } from '../services/aiRecipeService';
import {
  X,
  MessageSquare,
  Calendar,
  Utensils,
  Sparkles,
  Send,
  Check,
  Clock,
  Plus,
  Compass,
  RefreshCw,
  ShoppingCart,
  CalendarCheck,
  Key,
  Brain,
} from 'lucide-react';

interface FamilyAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'chat' | 'scheduler' | 'meals' | 'custom';
  onOpenSettings?: () => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  actions?: CopilotAction[];
  timestamp: number;
}

const FamilyAssistantModalContent: React.FC<FamilyAssistantModalProps> = ({
  onClose,
  initialTab = 'chat',
  onOpenSettings,
}) => {
  const {
    familyName,
    members,
    appointments,
    chores,
    recipes,
    mealPlans,
    groceries,
    addAppointment,
    setMealSlot,
    addGrocery,
  } = useFamily();

  // Defensively guard all data arrays against null/undefined
  const safeMembers = Array.isArray(members) ? members.filter(Boolean) : [];
  const safeAppointments = Array.isArray(appointments) ? appointments.filter(Boolean) : [];
  const safeChores = Array.isArray(chores) ? chores.filter(Boolean) : [];
  const safeRecipes = Array.isArray(recipes) ? recipes.filter(Boolean) : [];
  const safeMealPlans = Array.isArray(mealPlans) ? mealPlans.filter(Boolean) : [];
  const safeGroceries = Array.isArray(groceries) ? groceries.filter(Boolean) : [];

  const [activeTab, setActiveTab] = useState<'chat' | 'scheduler' | 'meals' | 'custom'>(initialTab);

  const aiConfig = getAIConfig();
  const hasApiKey = Boolean(aiConfig?.apiKey && aiConfig.apiKey.trim().length > 0);

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'm_welcome',
      role: 'assistant',
      text: `Hallo Familie ${familyName || ''}! 👋 Ich bin euer Famly-Assistent. Ich kenne all eure Termine, Aufgaben, den Essensplan und eure Einkaufsliste. Wie kann ich euch heute helfen?`,
      timestamp: Date.now(),
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Scheduled notification banners
  const [actionSuccessNotice, setActionSuccessNotice] = useState<string | null>(null);

  // Proactive Chore Scheduler State
  const [scheduledChoreIds, setScheduledChoreIds] = useState<Set<string>>(new Set());

  // Autonomous Decider State (AI formulates options itself!)
  const [customQuestion, setCustomQuestion] = useState('Was unternehmen wir heute als Familie?');
  const [isDeciding, setIsDeciding] = useState(false);
  const [decisionResult, setDecisionResult] = useState<DecisionResult | null>(null);

  const familyMemories = useMemo(() => getFamilyMemories(), []);

  const handleRunDecision = async (overrideQuestion?: string) => {
    const q = (overrideQuestion || customQuestion).trim();
    if (!q || isDeciding) return;
    if (overrideQuestion) {
      setCustomQuestion(overrideQuestion);
    }
    setIsDeciding(true);
    try {
      const res = await decideAutonomous(q, {
        familyName: familyName || 'Familie',
        members: safeMembers,
        appointments: safeAppointments,
        chores: safeChores,
        recipes: safeRecipes,
        mealPlans: safeMealPlans,
      });
      setDecisionResult(res);
    } catch (e) {
      console.warn('Autonomous decision failed:', e);
    } finally {
      setIsDeciding(false);
    }
  };

  // Run initial decision when opening custom tab
  useEffect(() => {
    if (activeTab === 'custom' && !decisionResult && !isDeciding) {
      handleRunDecision();
    }
  }, [activeTab]);

  // Compute chore schedule proposals dynamically
  const choreProposals: ChoreScheduleProposal[] = useMemo(() => {
    return generateChoreCalendarProposals(safeChores, safeAppointments, safeMembers, 7);
  }, [safeChores, safeAppointments, safeMembers]);

  // Today string
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayPlan = safeMealPlans.find((mp) => mp && mp.date === todayStr);

  // Auto-scroll chat
  useEffect(() => {
    if (activeTab === 'chat') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);

  // Handle Chat Submit
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
      const response = await queryFamilyAssistant(
        query,
        {
          familyName: familyName || 'Familie',
          members: safeMembers,
          appointments: safeAppointments,
          chores: safeChores,
          recipes: safeRecipes,
          mealPlans: safeMealPlans,
          groceries: safeGroceries,
        },
        history
      );

      const assistantMsg: ChatMessage = {
        id: `a_${Date.now()}`,
        role: 'assistant',
        text: response.text,
        actions: response.actions,
        timestamp: Date.now(),
      };

      setChatMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `a_${Date.now()}`,
          role: 'assistant',
          text: 'Entschuldigung, ich konnte die Anfrage gerade nicht verarbeiten. Bitte versuche es noch einmal.',
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Execute Action from Chat or Buttons
  const handleExecuteAction = (action: CopilotAction) => {
    if (action.type === 'ADD_GROCERY') {
      addGrocery(action.payload.name, action.payload.store || 'Supermarkt');
      setActionSuccessNotice(`✓ "${action.payload.name}" wurde auf die Einkaufsliste gesetzt! 🛒`);
    } else if (action.type === 'SET_MEAL') {
      setMealSlot(action.payload.date, action.payload.slot || 'dinner', {
        title: action.payload.title,
        recipeId: action.payload.recipeId,
      });
      setActionSuccessNotice(`✓ "${action.payload.title}" in den Essensplan eingetragen! 🍽️`);
    } else if (action.type === 'SCHEDULE_CHORE') {
      // switch to scheduler tab
      setActiveTab('scheduler');
      return;
    } else if (action.type === 'NAVIGATE') {
      onClose();
      onOpenSettings?.();
      return;
    }

    setTimeout(() => setActionSuccessNotice(null), 3500);
  };

  // Schedule a single chore proposal to the calendar
  const handleScheduleSingleProposal = (proposal: ChoreScheduleProposal) => {
    addAppointment({
      title: `🧹 ${proposal.chore.title}`,
      date: proposal.proposedDate,
      time: proposal.proposedTime,
      durationMinutes: proposal.durationMinutes,
      memberIds: [proposal.targetMember.id],
      category: 'family',
      notes: `Automatisch durch Famly-Assistent eingeplant (Aufgabe: ${proposal.chore.title}, ⭐ ${proposal.chore.stars} Sterne)`,
    });

    setScheduledChoreIds((prev) => new Set(prev).add(proposal.chore.id));
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
    });
    setActionSuccessNotice(`✓ "${proposal.chore.title}" für ${proposal.targetMember.name} am ${proposal.proposedDate} um ${proposal.proposedTime} Uhr eingetragen!`);
    setTimeout(() => setActionSuccessNotice(null), 3500);
  };

  // Bulk schedule all uncompleted chores to calendar
  const handleScheduleAllProposals = () => {
    const unscheduled = choreProposals.filter((p) => !scheduledChoreIds.has(p.chore.id));
    if (unscheduled.length === 0) return;

    for (const proposal of unscheduled) {
      addAppointment({
        title: `🧹 ${proposal.chore.title}`,
        date: proposal.proposedDate,
        time: proposal.proposedTime,
        durationMinutes: proposal.durationMinutes,
        memberIds: [proposal.targetMember.id],
        category: 'family',
        notes: `Automatisch durch Famly-Assistent eingeplant (Aufgabe: ${proposal.chore.title})`,
      });
      setScheduledChoreIds((prev) => new Set(prev).add(proposal.chore.id));
    }

    confetti({
      particleCount: 80,
      spread: 80,
      origin: { y: 0.6 },
    });
    setActionSuccessNotice(`✓ Alle ${unscheduled.length} Aufgaben erfolgreich ohne Terminkonflikte in den Kalender eingetragen! 📅`);
    setTimeout(() => setActionSuccessNotice(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto scrollbar-none animate-in fade-in">
        <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl border-2 border-stone-200 dark:border-slate-800 animate-in zoom-in-95 my-auto text-stone-900 dark:text-slate-100 max-h-[92vh] flex flex-col overflow-hidden">
          
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-stone-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center text-xl font-black shadow-xs">
                ✨
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black tracking-tight flex items-center gap-2">
                  <span>Famly Assistent</span>
                  <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                    Proaktiv & Live
                  </span>
                </h2>
                <p className="text-xs font-semibold text-stone-400 dark:text-slate-400">
                  Fragen stellen, Aufgaben in Kalender einplanen & Essensplan abstimmen
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 text-stone-500 dark:text-slate-400 flex items-center justify-center font-black transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1.5 p-2 px-4 sm:px-5 bg-stone-50 dark:bg-slate-800/60 border-b border-stone-200 dark:border-slate-800 shrink-0 overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab('chat')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shrink-0 ${
                activeTab === 'chat'
                  ? 'bg-amber-400 text-stone-900 shadow-xs'
                  : 'text-stone-600 dark:text-slate-300 hover:bg-stone-200 dark:hover:bg-slate-700'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Frag Famly (Chat)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('scheduler')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shrink-0 ${
                activeTab === 'scheduler'
                  ? 'bg-amber-400 text-stone-900 shadow-xs'
                  : 'text-stone-600 dark:text-slate-300 hover:bg-stone-200 dark:hover:bg-slate-700'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Aufgaben ➔ Kalender</span>
              {choreProposals.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-200 text-amber-900 text-[10px] flex items-center justify-center font-bold">
                  {choreProposals.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('meals')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shrink-0 ${
                activeTab === 'meals'
                  ? 'bg-amber-400 text-stone-900 shadow-xs'
                  : 'text-stone-600 dark:text-slate-300 hover:bg-stone-200 dark:hover:bg-slate-700'
              }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>Essensplan-Helfer</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('custom')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shrink-0 ${
                activeTab === 'custom'
                  ? 'bg-amber-400 text-stone-900 shadow-xs'
                  : 'text-stone-600 dark:text-slate-300 hover:bg-stone-200 dark:hover:bg-slate-700'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Freier Rat</span>
            </button>
          </div>

          {/* Feedback Banner */}
          {actionSuccessNotice && (
            <div className="bg-emerald-500 text-white p-2.5 px-4 text-xs font-bold flex items-center justify-between shrink-0 animate-in fade-in">
              <span>{actionSuccessNotice}</span>
              <button onClick={() => setActionSuccessNotice(null)} className="p-0.5 hover:opacity-80">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* TAB 1: FRAG FAMLY (CHAT) */}
          {activeTab === 'chat' && (
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

                      {/* Attached Action Cards */}
                      {msg.actions && msg.actions.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {msg.actions.map((act, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleExecuteAction(act)}
                              className="duo-btn duo-btn-green px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5"
                            >
                              {act.type === 'SCHEDULE_CHORE' && <CalendarCheck className="w-3.5 h-3.5" />}
                              {act.type === 'ADD_GROCERY' && <ShoppingCart className="w-3.5 h-3.5" />}
                              {act.type === 'SET_MEAL' && <Utensils className="w-3.5 h-3.5" />}
                              <span>{act.description}</span>
                            </button>
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
                  onClick={() => handleSendChat('Was steht heute an?')}
                  className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-stone-600 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-slate-700 shrink-0"
                >
                  📅 Was steht heute an?
                </button>
                <button
                  type="button"
                  onClick={() => handleSendChat('Was essen wir heute laut Essensplan?')}
                  className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-stone-600 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-slate-700 shrink-0"
                >
                  🍲 Was essen wir heute?
                </button>
                <button
                  type="button"
                  onClick={() => handleSendChat('Welche Aufgaben sind noch offen?')}
                  className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-stone-600 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-slate-700 shrink-0"
                >
                  🧹 Offene Aufgaben
                </button>
                <button
                  type="button"
                  onClick={() => handleSendChat('Wer hat die meisten Sterne?')}
                  className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-stone-600 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-slate-700 shrink-0"
                >
                  ⭐ Sternen-Rangliste
                </button>
              </div>

              {/* Chat Input Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendChat();
                }}
                className="p-3 sm:p-4 bg-white dark:bg-slate-900 border-t border-stone-100 dark:border-slate-800 flex items-center gap-2 shrink-0"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Frag etwas zu Terminen, Essensplan, Aufgaben..."
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
          )}

          {/* TAB 2: AUFGABEN ➔ KALENDER (SMART SCHEDULER) */}
          {activeTab === 'scheduler' && (
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 scrollbar-thin">
              <div className="duo-card p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    Proaktiver Aufgaben-Terminplaner
                  </h4>
                  <p className="text-xs text-amber-800 dark:text-amber-300">
                    Findet freie Zeitfenster ohne Terminkollisionen für alle offenen Aufgaben.
                  </p>
                </div>

                {choreProposals.filter((p) => !scheduledChoreIds.has(p.chore.id)).length > 0 && (
                  <button
                    type="button"
                    onClick={handleScheduleAllProposals}
                    className="duo-btn duo-btn-green px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shrink-0"
                  >
                    <CalendarCheck className="w-4 h-4" />
                    <span>Alle {choreProposals.filter((p) => !scheduledChoreIds.has(p.chore.id)).length} Aufgaben einplanen</span>
                  </button>
                )}
              </div>

              {choreProposals.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <span className="text-4xl">🎉</span>
                  <h3 className="text-base font-black">Keine offenen Aufgaben!</h3>
                  <p className="text-xs text-stone-500 dark:text-slate-400">
                    Alle Familienaufgaben sind bereits erledigt oder im Kalender eingeplant.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {choreProposals.map((proposal) => {
                    const isAlreadyScheduled = scheduledChoreIds.has(proposal.chore.id);

                    return (
                      <div
                        key={proposal.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          isAlreadyScheduled
                            ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 opacity-80'
                            : 'bg-white dark:bg-slate-800/80 border-stone-200 dark:border-slate-700 shadow-xs'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-black text-stone-900 dark:text-white">
                                🧹 {proposal.chore.title}
                              </span>
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                ⭐ {proposal.chore.stars} Sterne
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                                👤 {proposal.targetMember.name}
                              </span>
                            </div>

                            <p className="text-xs text-stone-500 dark:text-slate-400 flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-stone-400" />
                              <span>Vorschlag: <strong>{proposal.reason}</strong></span>
                            </p>
                          </div>

                          <div className="shrink-0">
                            {isAlreadyScheduled ? (
                              <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-xl bg-emerald-100/70 dark:bg-emerald-900/40">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                Im Kalender eingetragen
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleScheduleSingleProposal(proposal)}
                                className="duo-btn duo-btn-amber px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 w-full sm:w-auto justify-center"
                              >
                                <Calendar className="w-3.5 h-3.5" />
                                <span>In Kalender einplanen</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ESSENSPLAN-HELFER */}
          {activeTab === 'meals' && (
            <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 scrollbar-thin">
              {/* Today's Meal Plan Card */}
              <div className="duo-card p-4 sm:p-5 bg-stone-50 dark:bg-slate-800/60 border border-stone-200 dark:border-slate-700 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-stone-400 dark:text-slate-400">
                    Heute im Essensplan ({format(new Date(), 'EEEE, d. MMMM', { locale: de })})
                  </span>
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      todayPlan?.dinner?.title
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {todayPlan?.dinner?.title ? '✓ Bereits geplant (Kein Konflikt)' : 'Noch offen'}
                  </span>
                </div>

                {todayPlan?.dinner?.title ? (
                  <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-stone-200 dark:border-slate-700 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🍽️</span>
                      <div>
                        <h4 className="text-sm font-black text-stone-900 dark:text-white">
                          {todayPlan.dinner.title}
                        </h4>
                        <p className="text-xs text-stone-500 dark:text-slate-400">
                          Fest für das heutige Abendessen vorgesehen.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-900/50 space-y-2">
                    <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                      Für heute Abend ist noch kein Gericht im Essensplan eingetragen!
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {safeRecipes.slice(0, 3).map((rec) => (
                        <button
                          key={rec.id}
                          type="button"
                          onClick={() => {
                            setMealSlot(todayStr, 'dinner', {
                              title: rec.title,
                              recipeId: rec.id,
                            });
                            setActionSuccessNotice(`✓ "${rec.title}" wurde als heutiges Abendessen eingetragen!`);
                            setTimeout(() => setActionSuccessNotice(null), 3500);
                          }}
                          className="duo-btn duo-btn-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5 text-amber-600" />
                          <span>{rec.title} ({rec.prepTime})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Weekly Open Slot Overview */}
              <div className="space-y-3">
                <h4 className="text-sm font-black text-stone-900 dark:text-white flex items-center gap-2">
                  <span>Wochen-Essensplan Übersicht</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[0, 1, 2, 3, 4, 5, 6].map((dayOffset) => {
                    const targetDate = addDays(new Date(), dayOffset);
                    const dStr = format(targetDate, 'yyyy-MM-dd');
                    const dayName = format(targetDate, 'EEEE', { locale: de });
                    const plan = safeMealPlans.find((mp) => mp && mp.date === dStr);
                    const hasDinner = Boolean(plan?.dinner?.title);

                    return (
                      <div
                        key={dStr}
                        className={`p-3 rounded-2xl border flex items-center justify-between gap-2 ${
                          hasDinner
                            ? 'bg-white dark:bg-slate-800/80 border-stone-200 dark:border-slate-700'
                            : 'bg-stone-50 dark:bg-slate-800/40 border-dashed border-stone-300 dark:border-slate-700'
                        }`}
                      >
                        <div>
                          <span className="text-[11px] font-black uppercase text-stone-400 dark:text-slate-400 block">
                            {dayOffset === 0 ? 'Heute' : dayOffset === 1 ? 'Morgen' : dayName}
                          </span>
                          <span className="text-xs font-bold text-stone-800 dark:text-white">
                            {plan?.dinner?.title || '— Offener Tag —'}
                          </span>
                        </div>

                        {!hasDinner && (
                          <button
                            type="button"
                            onClick={() => {
                              const randomRecipe = safeRecipes[Math.floor(Math.random() * safeRecipes.length)] || safeRecipes[0];
                              if (randomRecipe) {
                                setMealSlot(dStr, 'dinner', {
                                  title: randomRecipe.title,
                                  recipeId: randomRecipe.id,
                                });
                                setActionSuccessNotice(`✓ "${randomRecipe.title}" für ${dayName} eingetragen!`);
                                setTimeout(() => setActionSuccessNotice(null), 3500);
                              }
                            }}
                            className="duo-btn duo-btn-amber px-2.5 py-1 text-[11px] font-bold rounded-lg flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Rezept vorschlagen</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: AUTONOMER KI-FAMILIENRAT */}
          {activeTab === 'custom' && (
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 scrollbar-thin">
              {/* Info Header */}
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 space-y-1.5">
                <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-black text-xs sm:text-sm">
                  <Brain className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Autonomer KI-Familienrat (Gemini 3+ Flash)</span>
                </div>
                <p className="text-xs text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                  Ihr müsst keine Optionen selbst eintippen! Nennt einfach euer Dilemma: Die KI recherchiert passende Vorschläge, gleicht sie mit eurem Familien-Gedächtnis & Kalender ab und berechnet Vor- und Nachteile.
                </p>
              </div>

              {/* Quick Topic Chips */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-black uppercase text-stone-500 dark:text-slate-400">
                  Schnelle Ideen / Häufige Familienfragen
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: '🌧️ Regentags-Plan', q: 'Was machen wir heute Nachmittag bei schlechtem Wetter / Regen mit den Kindern?' },
                    { label: '🍿 Familienfilm für heute', q: 'Welchen Familienfilm können wir heute Abend schauen, der allen Spaß macht?' },
                    { label: '🎯 Wochenend-Ausflug', q: 'Was ist ein schöner, stressfreier Familienausflug für das Wochenende?' },
                    { label: '🍕 Schnelles Abendessen', q: 'Was kochen wir heute Abend schnell und unkompliziert für die ganze Familie?' },
                    { label: '🧹 Aufgaben fair verteilen', q: 'Wie teilen wir die anstehenden Haushaltsaufgaben heute fair und motivierend auf?' },
                  ].map((chip) => (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => handleRunDecision(chip.q)}
                      className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-stone-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-slate-700 transition-colors shrink-0"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Input Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleRunDecision();
                }}
                className="space-y-2 pt-1"
              >
                <label className="block text-xs font-black uppercase text-stone-500 dark:text-slate-400">
                  Frage oder Dilemma an den Rat
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customQuestion}
                    onChange={(e) => setCustomQuestion(e.target.value)}
                    placeholder="z.B. Welches Spiel spielen wir heute oder wohin geht der Sonntagsausflug?"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-stone-300 dark:border-slate-700 text-xs sm:text-sm font-bold bg-stone-50 dark:bg-slate-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="submit"
                    disabled={!customQuestion.trim() || isDeciding}
                    className="duo-btn duo-btn-amber px-4 py-2.5 text-xs font-black rounded-xl flex items-center gap-1.5 disabled:opacity-50 shrink-0"
                  >
                    {isDeciding ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>{isDeciding ? 'Berät...' : 'Rat einholen'}</span>
                  </button>
                </div>
              </form>

              {/* Memory Indicator */}
              {familyMemories.length > 0 && (
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-stone-400 dark:text-slate-500 pt-0.5">
                  <span className="text-amber-500">🧠</span>
                  <span>Langzeit-Gedächtnis aktiv ({familyMemories.length} Familienfakten fließen in die Empfehlung ein)</span>
                </div>
              )}

              {/* Loading State */}
              {isDeciding && (
                <div className="text-center py-10 space-y-2">
                  <div className="w-10 h-10 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 flex items-center justify-center text-xl font-black">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  </div>
                  <h4 className="text-sm font-black text-stone-800 dark:text-slate-200">
                    Der Familienrat berät sich...
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-slate-400">
                    Gemini 3+ Flash wiegt Möglichkeiten, Wetter, Zeiten und Vorlieben ab.
                  </p>
                </div>
              )}

              {/* Decision Result Display */}
              {!isDeciding && decisionResult && (
                <div className="space-y-4 pt-2">
                  {/* Winner Card */}
                  <div className="p-4 sm:p-5 rounded-3xl bg-linear-to-br from-amber-50 via-orange-50 to-amber-100/60 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-amber-950/20 border-2 border-amber-300 dark:border-amber-700/60 shadow-xs space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-[11px] font-black uppercase text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                        <span>🏆</span>
                        <span>Empfehlung des Familienrats</span>
                      </span>
                      <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200">
                        {decisionResult.winner.percentage}% Übereinstimmung
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base sm:text-lg font-black text-amber-950 dark:text-white">
                          {decisionResult.winner.title}
                        </h3>
                        {decisionResult.winner.badge && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-slate-700">
                            {decisionResult.winner.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-amber-900/80 dark:text-amber-200/80 mt-1 leading-relaxed">
                        {decisionResult.summary}
                      </p>
                    </div>

                    {/* Pros & Cons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                      {decisionResult.winner.pros && decisionResult.winner.pros.length > 0 && (
                        <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/70 border border-amber-200 dark:border-slate-800 space-y-1">
                          <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400">
                            Vorteile:
                          </span>
                          <ul className="space-y-0.5 text-stone-700 dark:text-slate-300">
                            {decisionResult.winner.pros.map((pro, pIdx) => (
                              <li key={pIdx} className="flex items-start gap-1.5">
                                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                <span>{pro}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {decisionResult.winner.cons && decisionResult.winner.cons.length > 0 && (
                        <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/70 border border-amber-200 dark:border-slate-800 space-y-1">
                          <span className="text-[10px] font-black uppercase text-stone-500 dark:text-slate-400">
                            Zu bedenken:
                          </span>
                          <ul className="space-y-0.5 text-stone-600 dark:text-slate-400">
                            {decisionResult.winner.cons.map((con, cIdx) => (
                              <li key={cIdx} className="flex items-start gap-1.5">
                                <span className="text-stone-400 shrink-0">•</span>
                                <span>{con}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
                          setActionSuccessNotice(`Entscheidung "${decisionResult.winner.title}" angenommen! 🚀`);
                          setTimeout(() => setActionSuccessNotice(null), 3500);
                        }}
                        className="duo-btn duo-btn-green px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>Entscheidung annehmen</span>
                      </button>
                    </div>
                  </div>

                  {/* Alternative Options */}
                  {decisionResult.options && decisionResult.options.length > 1 && (
                    <div className="space-y-2 pt-1">
                      <h4 className="text-xs font-black uppercase text-stone-500 dark:text-slate-400">
                        Weitere abgewogene Optionen ({decisionResult.options.length - 1})
                      </h4>

                      <div className="space-y-2">
                        {decisionResult.options
                          .filter((opt) => opt.id !== decisionResult.winner.id)
                          .map((opt) => (
                            <div
                              key={opt.id}
                              className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-stone-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs sm:text-sm font-black text-stone-900 dark:text-white">
                                    {opt.title}
                                  </span>
                                  {opt.badge && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 dark:bg-slate-700 text-stone-600 dark:text-slate-300">
                                      {opt.badge}
                                    </span>
                                  )}
                                  <span className="text-[10px] font-black text-stone-400">
                                    {opt.percentage}% Eignung
                                  </span>
                                </div>
                                {opt.pros && opt.pros.length > 0 && (
                                  <p className="text-[11px] text-stone-500 dark:text-slate-400">
                                    Pluspunkt: {opt.pros[0]}
                                  </p>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
                                  setActionSuccessNotice(`Alternative "${opt.title}" gewählt! 🚀`);
                                  setTimeout(() => setActionSuccessNotice(null), 3500);
                                }}
                                className="duo-btn duo-btn-white px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 self-end sm:self-auto"
                              >
                                Stattdessen wählen
                              </button>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="p-3 sm:p-4 bg-stone-50 dark:bg-slate-900 border-t border-stone-100 dark:border-slate-800 flex items-center justify-between shrink-0">
            <span className="text-[11px] font-semibold text-stone-400 dark:text-slate-500">
              💡 Tipp: Frag den Assistenten nach offenen Aufgaben oder Essenswünschen
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-xs font-black bg-stone-200 dark:bg-slate-800 hover:bg-stone-300 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-300 transition-colors"
            >
              Schließen
            </button>
          </div>

        </div>
      </div>
  );
};

export const FamilyAssistantModal: React.FC<FamilyAssistantModalProps> = (props) => {
  if (!props.isOpen) return null;

  return (
    <ModalPortal>
      <ErrorBoundary fallbackTitle="Der Famly-Assistent konnte nicht geladen werden">
        <FamilyAssistantModalContent {...props} />
      </ErrorBoundary>
    </ModalPortal>
  );
};
