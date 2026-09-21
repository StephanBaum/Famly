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
import { decideCustom } from '../services/decisionService';
import { format, addDays } from 'date-fns';
import { de } from 'date-fns/locale';
import confetti from 'canvas-confetti';
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
} from 'lucide-react';

interface FamilyAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'chat' | 'scheduler' | 'meals' | 'custom';
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  actions?: CopilotAction[];
  timestamp: number;
}

export const FamilyAssistantModal: React.FC<FamilyAssistantModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'chat',
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

  const [activeTab, setActiveTab] = useState<'chat' | 'scheduler' | 'meals' | 'custom'>(initialTab);

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'm_welcome',
      role: 'assistant',
      text: `Hallo Familie ${familyName}! 👋 Ich bin euer Famly-Assistent. Ich kenne all eure Termine, Aufgaben, den Essensplan und eure Einkaufsliste. Wie kann ich euch heute helfen?`,
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

  // Custom Decider State
  const [customQuestion, setCustomQuestion] = useState('Welchen Film schauen wir heute Abend?');
  const [customOptionsText, setCustomOptionsText] = useState('Der König der Löwen\nPaddington 2\nFindet Nemo');

  // Compute chore schedule proposals dynamically
  const choreProposals: ChoreScheduleProposal[] = useMemo(() => {
    return generateChoreCalendarProposals(chores, appointments, members, 7);
  }, [chores, appointments, members]);

  // Today string
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayPlan = mealPlans.find((mp) => mp.date === todayStr);

  // Auto-scroll chat
  useEffect(() => {
    if (activeTab === 'chat') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);

  if (!isOpen) return null;

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
          familyName,
          members,
          appointments,
          chores,
          recipes,
          mealPlans,
          groceries,
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

  // Custom Decider computation
  const customDecision = useMemo(() => {
    const lines = customOptionsText.split('\n').map((s) => s.trim()).filter(Boolean);
    return decideCustom(customQuestion, lines);
  }, [customQuestion, customOptionsText]);

  return (
    <ModalPortal>
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
                  ? 'bg-amber-500 text-white shadow-xs'
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
                  ? 'bg-amber-500 text-white shadow-xs'
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
                  ? 'bg-amber-500 text-white shadow-xs'
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
                  ? 'bg-amber-500 text-white shadow-xs'
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
                        className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-line ${
                          msg.role === 'user'
                            ? 'bg-amber-500 text-white font-medium rounded-tr-xs'
                            : 'bg-stone-100 dark:bg-slate-800 text-stone-800 dark:text-slate-100 rounded-tl-xs border border-stone-200/60 dark:border-slate-700'
                        }`}
                      >
                        {msg.text}
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
                      {recipes.slice(0, 3).map((rec) => (
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
                    const plan = mealPlans.find((mp) => mp.date === dStr);
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
                              const randomRecipe = recipes[Math.floor(Math.random() * recipes.length)] || recipes[0];
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

          {/* TAB 4: FREIER RAT (OPEN-JEV DECIDER) */}
          {activeTab === 'custom' && (
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 scrollbar-thin">
              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase text-stone-500 dark:text-slate-400">
                  Frage an den Familienrat
                </label>
                <input
                  type="text"
                  value={customQuestion}
                  onChange={(e) => setCustomQuestion(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-slate-700 text-xs sm:text-sm font-bold bg-stone-50 dark:bg-slate-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase text-stone-500 dark:text-slate-400">
                  Optionen (eine pro Zeile)
                </label>
                <textarea
                  rows={3}
                  value={customOptionsText}
                  onChange={(e) => setCustomOptionsText(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-slate-700 text-xs sm:text-sm font-mono bg-stone-50 dark:bg-slate-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Decision Winner Card */}
              {customDecision.winner && (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase text-amber-800 dark:text-amber-300">
                      🏆 Empfehlung des Familienrats
                    </span>
                    <span className="text-xs font-black text-amber-900 dark:text-amber-200">
                      {customDecision.winner.percentage}% Übereinstimmung
                    </span>
                  </div>

                  <h3 className="text-base font-black text-amber-950 dark:text-white">
                    {customDecision.winner.title}
                  </h3>

                  <button
                    type="button"
                    onClick={() => {
                      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
                      setActionSuccessNotice(`Entscheidung "${customDecision.winner.title}" angenommen! 🚀`);
                      setTimeout(() => setActionSuccessNotice(null), 3500);
                    }}
                    className="duo-btn duo-btn-green px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Entscheidung annehmen</span>
                  </button>
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
    </ModalPortal>
  );
};
