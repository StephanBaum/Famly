import React, { useState, useMemo } from 'react';
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
import { format } from 'date-fns';
import confetti from 'canvas-confetti';
import { triggerHaptic } from '../utils/haptics';
import { ErrorBoundary } from './ErrorBoundary';
import { getAIConfig } from '../services/aiRecipeService';
import {
  X,
  MessageSquare,
  Calendar,
  Utensils,
  Compass,
} from 'lucide-react';
import { AssistantChatTab, ChatMessage } from './assistant/AssistantChatTab';
import { AssistantSchedulerTab } from './assistant/AssistantSchedulerTab';
import { AssistantMealsTab } from './assistant/AssistantMealsTab';
import { AssistantAdviceTab } from './assistant/AssistantAdviceTab';

interface FamilyAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'chat' | 'scheduler' | 'meals' | 'custom';
  onOpenSettings?: () => void;
  onNavigateTab?: (tab: string) => void;
}

const FamilyAssistantModalContent: React.FC<FamilyAssistantModalProps> = ({
  onClose,
  initialTab = 'chat',
  onOpenSettings,
  onNavigateTab,
}) => {
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
    addAppointment,
    deleteAppointment,
    setMealSlot,
    addRecipe,
    toggleFavoriteRecipe,
    addRecipeIngredientsToGrocery,
    addGrocery,
    toggleGrocery,
    deleteGrocery,
    clearCheckedGroceries,
    toggleAlwaysInStock,
    cleanPastMealGroceries,
    addChore,
    toggleChore,
    deleteChore,
    awardStars,
    updateMember,
    addNote,
    deleteNote,
    addReward,
    claimReward,
  } = useFamily();

  // Defensively guard all data arrays
  const safeMembers = Array.isArray(members) ? members.filter(Boolean) : [];
  const safeAppointments = Array.isArray(appointments) ? appointments.filter(Boolean) : [];
  const safeChores = Array.isArray(chores) ? chores.filter(Boolean) : [];
  const safeRecipes = Array.isArray(recipes) ? recipes.filter(Boolean) : [];
  const safeMealPlans = Array.isArray(mealPlans) ? mealPlans.filter(Boolean) : [];
  const safeGroceries = Array.isArray(groceries) ? groceries.filter(Boolean) : [];
  const safeNotes = Array.isArray(notes) ? notes.filter(Boolean) : [];
  const safeRewards = Array.isArray(rewards) ? rewards.filter(Boolean) : [];

  const [activeTab, setActiveTab] = useState<'chat' | 'scheduler' | 'meals' | 'custom'>(initialTab);

  const aiConfig = getAIConfig();
  const hasApiKey = Boolean(aiConfig?.apiKey && aiConfig.apiKey.trim().length > 0);

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'm_welcome',
      role: 'assistant',
      text: `Hallo Familie ${familyName || ''}! 👋 Ich bin euer Famly-Assistent. Ich kann jede Aktion im System für euch erledigen – vom Kalender über Aufgaben, Einkaufsliste und Essensplan bis hin zum Schwarzen Brett und Belohnungen!`,
      timestamp: Date.now(),
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [actionSuccessNotice, setActionSuccessNotice] = useState<string | null>(null);

  // Proactive Chore Scheduler State
  const [scheduledChoreIds, setScheduledChoreIds] = useState<Set<string>>(new Set());

  // Autonomous Decider State
  const [customQuestion, setCustomQuestion] = useState('Was unternehmen wir heute als Familie?');
  const [isDeciding, setIsDeciding] = useState(false);
  const [decisionResult, setDecisionResult] = useState<DecisionResult | null>(null);

  const familyMemories = useMemo(() => getFamilyMemories(), []);

  const handleRunDecision = async (overrideQuestion?: string) => {
    const q = (overrideQuestion || customQuestion).trim();
    if (!q || isDeciding) return;
    if (overrideQuestion) setCustomQuestion(overrideQuestion);
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

  const choreProposals: ChoreScheduleProposal[] = useMemo(() => {
    return generateChoreCalendarProposals(safeChores, safeAppointments, safeMembers, 7);
  }, [safeChores, safeAppointments, safeMembers]);

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayPlan = safeMealPlans.find((mp) => mp && mp.date === todayStr);

  // Universal Action Execution Engine
  const handleExecuteAction = (action: CopilotAction): boolean => {
    try {
      const p = action.payload || {};

      switch (action.type) {
        case 'ADD_APPOINTMENT': {
          const targetDate = p.date || todayStr;
          addAppointment({
            title: p.title || 'Termin',
            date: targetDate,
            time: p.time || '10:00',
            memberIds: p.memberIds || (safeMembers[0] ? [safeMembers[0].id] : ['m1']),
            category: p.category || 'family',
            notes: p.notes || 'Vom Famly-Assistenten eingetragen',
          });
          setActionSuccessNotice(`✓ Termin "${p.title}" eingetragen (${targetDate})! 📅`);
          return true;
        }

        case 'DELETE_APPOINTMENT': {
          const match = safeAppointments.find(
            (a) => (p.id && a.id === p.id) || (p.title && a.title.toLowerCase().includes(p.title.toLowerCase()))
          );
          if (match) {
            deleteAppointment(match.id);
            setActionSuccessNotice(`✓ Termin "${match.title}" gelöscht.`);
            return true;
          }
          return false;
        }

        case 'SCHEDULE_CHORE': {
          const choreObj = safeChores.find((c) => c.id === p.choreId);
          const proposal = choreProposals.find((pr) => pr.chore.id === p.choreId);
          const choreTitle = p.title || choreObj?.title || 'Aufgabe';
          const targetDate = p.date || proposal?.proposedDate || todayStr;
          const targetTime = p.time || proposal?.proposedTime || '18:00';
          const targetMemberId = p.memberId || proposal?.targetMember?.id || choreObj?.assignedMemberId || (safeMembers[0] ? safeMembers[0].id : 'm1');

          addAppointment({
            title: `🧹 ${choreTitle}`,
            date: targetDate,
            time: targetTime,
            durationMinutes: p.durationMinutes || proposal?.durationMinutes || 20,
            memberIds: [targetMemberId],
            category: 'family',
            notes: `Aufgabe automatisch eingeplant`,
          });
          if (p.choreId) {
            setScheduledChoreIds((prev) => new Set([...prev, p.choreId]));
          }
          setActionSuccessNotice(`✓ "${choreTitle}" für ${targetTime} Uhr (${targetDate}) im Kalender eingetragen! 📅`);
          return true;
        }

        case 'ADD_CHORE': {
          addChore(
            p.title || 'Aufgabe',
            p.assignedMemberId || '',
            'once',
            Number(p.stars) || 3,
            p.assignedMemberId ? [p.assignedMemberId] : [],
            p.dueDate
          );
          setActionSuccessNotice(`✓ Aufgabe "${p.title}" angelegt! ⭐`);
          return true;
        }

        case 'COMPLETE_CHORE': {
          const match = safeChores.find(
            (c) => (p.id && c.id === p.id) || (p.title && c.title.toLowerCase().includes(p.title.toLowerCase()))
          );
          if (match) {
            toggleChore(match.id, p.completingMemberId || safeMembers[0]?.id);
            setActionSuccessNotice(`✓ Aufgabe "${match.title}" als erledigt markiert! ⭐`);
            return true;
          }
          return false;
        }

        case 'DELETE_CHORE': {
          const match = safeChores.find(
            (c) => (p.id && c.id === p.id) || (p.title && c.title.toLowerCase().includes(p.title.toLowerCase()))
          );
          if (match) {
            deleteChore(match.id);
            setActionSuccessNotice(`✓ Aufgabe "${match.title}" gelöscht.`);
            return true;
          }
          return false;
        }

        case 'ADD_GROCERY': {
          addGrocery(p.name, p.store || 'Rewe', p.amount, p.category);
          setActionSuccessNotice(`✓ "${p.name}" auf die Einkaufsliste gesetzt! 🛒`);
          return true;
        }

        case 'CHECK_GROCERY': {
          const match = safeGroceries.find(
            (g) => (p.id && g.id === p.id) || (p.name && g.name.toLowerCase().includes(p.name.toLowerCase()))
          );
          if (match) {
            toggleGrocery(match.id);
            setActionSuccessNotice(`✓ "${match.name}" als erledigt abgehakt! 🛒`);
            return true;
          }
          return false;
        }

        case 'DELETE_GROCERY': {
          const match = safeGroceries.find(
            (g) => (p.id && g.id === p.id) || (p.name && g.name.toLowerCase().includes(p.name.toLowerCase()))
          );
          if (match) {
            deleteGrocery(match.id);
            setActionSuccessNotice(`✓ "${match.name}" von der Einkaufsliste entfernt.`);
            return true;
          }
          return false;
        }

        case 'CLEAR_CHECKED_GROCERIES': {
          clearCheckedGroceries();
          setActionSuccessNotice(`✓ Erledigte Artikel aus dem Korb geleert.`);
          return true;
        }

        case 'ADD_ALWAYS_IN_STOCK': {
          if (p.name) {
            toggleAlwaysInStock(p.name);
            setActionSuccessNotice(`✓ "${p.name}" zu den Vorräten hinzugefügt 🏠`);
            return true;
          }
          return false;
        }

        case 'CLEAN_SHOPPING_LIST': {
          const { removedCount } = cleanPastMealGroceries();
          setActionSuccessNotice(`✓ Einkaufsliste bereinigt (${removedCount} alte Zutaten entfernt) 🧹`);
          return true;
        }

        case 'SET_MEAL': {
          const targetDate = p.date || todayStr;
          setMealSlot(targetDate, p.slot || 'dinner', {
            title: p.title,
            recipeId: p.recipeId,
          });
          setActionSuccessNotice(`✓ "${p.title}" in den Essensplan eingetragen! 🍽️`);
          return true;
        }

        case 'CLEAR_MEAL': {
          const targetDate = p.date || todayStr;
          setMealSlot(targetDate, p.slot || 'dinner', { title: '' });
          setActionSuccessNotice(`✓ Essensplan für ${targetDate} geleert.`);
          return true;
        }

        case 'ADD_RECIPE': {
          addRecipe({
            title: p.title || 'Rezept',
            prepTime: p.prepTime || '25 Min',
            servings: p.servings || 4,
            category: p.category || 'family-favorite',
            imageUrl: p.imageUrl || 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=600&q=80',
            ingredients: p.ingredients || [],
            instructions: p.instructions || [],
            isFavorite: false,
            tags: p.tags || ['Familie'],
          });
          setActionSuccessNotice(`✓ Rezept "${p.title}" in Rezeptbox gespeichert! 🍲`);
          return true;
        }

        case 'FAVORITE_RECIPE': {
          const match = safeRecipes.find((r) => r.title.toLowerCase().includes(p.title.toLowerCase()));
          if (match) {
            toggleFavoriteRecipe(match.id);
            setActionSuccessNotice(`✓ "${match.title}" als Favorit ⭐ markiert!`);
            return true;
          }
          return false;
        }

        case 'ADD_RECIPE_TO_GROCERIES': {
          const match = safeRecipes.find((r) => r.title.toLowerCase().includes(p.title.toLowerCase()));
          if (match) {
            addRecipeIngredientsToGrocery(match, p.date || todayStr);
            setActionSuccessNotice(`✓ Zutaten für "${match.title}" zur Einkaufsliste hinzugefügt! 🛒`);
            return true;
          }
          return false;
        }

        case 'ADD_NOTE': {
          addNote(p.title || 'Notiz', p.content || p.title || '', p.tag || 'info', true);
          setActionSuccessNotice(`✓ Notiz "${p.title}" ans Schwarze Brett geheftet! 📌`);
          return true;
        }

        case 'DELETE_NOTE': {
          const match = safeNotes.find(
            (n) => (p.id && n.id === p.id) || (p.title && n.title.toLowerCase().includes(p.title.toLowerCase()))
          );
          if (match) {
            deleteNote(match.id);
            setActionSuccessNotice(`✓ Notiz "${match.title}" entfernt.`);
            return true;
          }
          return false;
        }

        case 'UPDATE_CHILD_DETAILS': {
          const member = safeMembers.find(
            (m) => (p.memberId && m.id === p.memberId) || (p.childName && m.name.toLowerCase().includes(p.childName.toLowerCase()))
          );
          if (member) {
            updateMember(member.id, {
              childDetails: {
                ...(member.childDetails || {}),
                ...(p.shoeSize ? { shoeSize: p.shoeSize } : {}),
                ...(p.clothingSize ? { clothingSize: p.clothingSize } : {}),
                ...(p.allergies ? { allergies: p.allergies } : {}),
                ...(p.notes ? { notes: p.notes } : {}),
              },
            });
            setActionSuccessNotice(`✓ Daten für ${member.name} aktualisiert! 🧸`);
            return true;
          }
          return false;
        }

        case 'AWARD_STARS': {
          const member = safeMembers.find(
            (m) => (p.memberId && m.id === p.memberId) || (p.memberName && m.name.toLowerCase().includes(p.memberName.toLowerCase()))
          );
          if (member) {
            awardStars(member.id, Number(p.stars) || 3);
            setActionSuccessNotice(`✓ ${p.stars || 3} Sterne an ${member.name} vergeben! ⭐🎉`);
            return true;
          }
          return false;
        }

        case 'ADD_REWARD': {
          addReward(p.title, Number(p.starsCost) || 15, p.icon || '🎁', p.description);
          setActionSuccessNotice(`✓ Belohnung "${p.title}" angelegt! 🎁`);
          return true;
        }

        case 'CLAIM_REWARD': {
          const reward = safeRewards.find((r) => r.title.toLowerCase().includes(p.title.toLowerCase()));
          const child = safeMembers.find(
            (m) => (p.childName && m.name.toLowerCase().includes(p.childName.toLowerCase())) || m.isChild
          );
          if (reward && child) {
            claimReward(reward.id, child.id);
            setActionSuccessNotice(`✓ Belohnung "${reward.title}" für ${child.name} eingelöst! 🎁`);
            return true;
          }
          return false;
        }

        case 'SET_MORNING_BRIEFING': {
          const briefingObj = {
            headline: p.headline || `Guten Morgen Familie ${familyName}! ☀️`,
            summary: p.summary || 'Eure persönlichen Tagesgrüße',
            highlights: Array.isArray(p.highlights) ? p.highlights : [],
            tipOfTheDay: p.tipOfTheDay || '',
            generatedAt: new Date().toISOString(),
          };
          if (typeof window !== 'undefined') {
            localStorage.setItem('famly_cached_briefing', JSON.stringify(briefingObj));
            window.dispatchEvent(new CustomEvent('famly_daily_briefing_updated', { detail: briefingObj }));
          }
          setActionSuccessNotice(`✓ Tagesgrüße auf dem Dashboard gespeichert! ☀️`);
          return true;
        }

        case 'NAVIGATE': {
          onClose();
          if (p.tab === 'settings') onOpenSettings?.();
          else if (onNavigateTab && p.tab) onNavigateTab(p.tab);
          return true;
        }

        default:
          return false;
      }
    } catch (e) {
      console.warn('handleExecuteAction failed:', e);
      return false;
    }
  };

  // Undo Action
  const handleUndoAction = (action: CopilotAction) => {
    try {
      const p = action.payload || {};
      if (action.type === 'ADD_GROCERY') {
        const match = safeGroceries.find((g) => g.name.toLowerCase() === p.name.toLowerCase());
        if (match) deleteGrocery(match.id);
      } else if (action.type === 'CHECK_GROCERY') {
        const match = safeGroceries.find((g) => g.name.toLowerCase() === p.name.toLowerCase());
        if (match) toggleGrocery(match.id);
      } else if (action.type === 'SET_MEAL') {
        const targetDate = p.date || todayStr;
        setMealSlot(targetDate, p.slot || 'dinner', { title: '' });
      } else if (action.type === 'ADD_APPOINTMENT' || action.type === 'SCHEDULE_CHORE') {
        const titleMatch = action.type === 'SCHEDULE_CHORE' ? `🧹 ${p.title}` : p.title;
        const match = safeAppointments.find((a) => a.title === titleMatch);
        if (match) deleteAppointment(match.id);
      } else if (action.type === 'ADD_CHORE') {
        const match = safeChores.find((c) => c.title === p.title);
        if (match) deleteChore(match.id);
      } else if (action.type === 'COMPLETE_CHORE') {
        const match = safeChores.find((c) => c.title === p.title);
        if (match) toggleChore(match.id);
      } else if (action.type === 'ADD_NOTE') {
        const match = safeNotes.find((n) => n.title === p.title);
        if (match) deleteNote(match.id);
      } else if (action.type === 'AWARD_STARS') {
        const member = safeMembers.find((m) => m.id === p.memberId || m.name === p.memberName);
        if (member) awardStars(member.id, -Math.abs(Number(p.stars) || 3));
      }
      setActionSuccessNotice(`Aktion "${action.description}" rückgängig gemacht.`);
      setTimeout(() => setActionSuccessNotice(null), 3000);
    } catch (e) {
      console.warn('handleUndoAction error:', e);
    }
  };

  // Schedule Single Proposal
  const handleScheduleSingleProposal = (proposal: ChoreScheduleProposal) => {
    addAppointment({
      title: `🧹 ${proposal.chore.title}`,
      date: proposal.proposedDate,
      time: proposal.proposedTime,
      durationMinutes: proposal.durationMinutes,
      memberIds: [proposal.targetMember.id],
      category: 'family',
      notes: `Vom Aufgaben-Planer eingetragen (${proposal.reason})`,
    });
    setScheduledChoreIds((prev) => new Set([...prev, proposal.chore.id]));
    confetti({ particleCount: 45, spread: 60, origin: { y: 0.6 } });
    setActionSuccessNotice(`✓ "${proposal.chore.title}" für ${proposal.proposedTime} Uhr eingetragen! 📅`);
    setTimeout(() => setActionSuccessNotice(null), 3500);
  };

  // Schedule All Proposals
  const handleScheduleAllProposals = () => {
    let count = 0;
    choreProposals.forEach((proposal) => {
      if (!scheduledChoreIds.has(proposal.chore.id)) {
        addAppointment({
          title: `🧹 ${proposal.chore.title}`,
          date: proposal.proposedDate,
          time: proposal.proposedTime,
          durationMinutes: proposal.durationMinutes,
          memberIds: [proposal.targetMember.id],
          category: 'family',
          notes: `Vom Aufgaben-Planer eingetragen (${proposal.reason})`,
        });
        count++;
      }
    });
    setScheduledChoreIds(new Set(choreProposals.map((p) => p.chore.id)));
    confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
    setActionSuccessNotice(`✓ ${count} Aufgaben automatisch in freie Zeitfenster eingetragen! 🎉`);
    setTimeout(() => setActionSuccessNotice(null), 4000);
  };

  // Handle Send Chat
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
          notes: safeNotes,
          rewards: safeRewards,
        },
        history
      );

      // Auto-execute all actions immediately
      const executedActions = (response.actions || []).map((act) => {
        const ok = handleExecuteAction(act);
        return { ...act, autoExecuted: ok };
      });

      if (executedActions.length > 0) {
        triggerHaptic('success');
        try {
          confetti({ particleCount: 45, spread: 60, origin: { y: 0.6 } });
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in">
      <div className="duo-card w-full max-w-3xl bg-white dark:bg-slate-900 border-2 border-stone-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[85vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center justify-center text-xl shrink-0">
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
                Fragen stellen, Aufgaben & Termine planen, Notizen anheften
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

        {/* Tab 1: Chat */}
        {activeTab === 'chat' && (
          <AssistantChatTab
            chatMessages={chatMessages}
            chatInput={chatInput}
            setChatInput={setChatInput}
            isAiLoading={isAiLoading}
            onSendChat={handleSendChat}
            onUndoAction={handleUndoAction}
            onExecuteAction={handleExecuteAction}
            hasApiKey={hasApiKey}
            onOpenSettings={onOpenSettings}
            onClose={onClose}
          />
        )}

        {/* Tab 2: Scheduler */}
        {activeTab === 'scheduler' && (
          <AssistantSchedulerTab
            choreProposals={choreProposals}
            scheduledChoreIds={scheduledChoreIds}
            onScheduleSingleProposal={handleScheduleSingleProposal}
            onScheduleAllProposals={handleScheduleAllProposals}
          />
        )}

        {/* Tab 3: Meals */}
        {activeTab === 'meals' && (
          <AssistantMealsTab
            safeMealPlans={safeMealPlans}
            safeRecipes={safeRecipes}
            todayStr={todayStr}
            todayPlan={todayPlan}
            onSetMealSlot={(date, slot, data) => setMealSlot(date, slot, data)}
            onSuccessNotice={(msg) => {
              setActionSuccessNotice(msg);
              setTimeout(() => setActionSuccessNotice(null), 3500);
            }}
          />
        )}

        {/* Tab 4: Autonomous Decider */}
        {activeTab === 'custom' && (
          <AssistantAdviceTab
            customQuestion={customQuestion}
            setCustomQuestion={setCustomQuestion}
            isDeciding={isDeciding}
            decisionResult={decisionResult}
            handleRunDecision={handleRunDecision}
            familyMemories={familyMemories}
            onSuccessNotice={(msg) => {
              setActionSuccessNotice(msg);
              setTimeout(() => setActionSuccessNotice(null), 3500);
            }}
          />
        )}
      </div>
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
