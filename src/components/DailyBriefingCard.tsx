import React, { useState, useEffect } from 'react';
import { Sun, Sparkles, RefreshCw, ChevronDown, ChevronUp, Lightbulb, CheckCircle2 } from 'lucide-react';
import { DailyBriefing, getCachedDailyBriefing, generateDailyBriefing } from '../services/briefingService';
import { useFamily } from '../context/FamilyContext';

interface DailyBriefingCardProps {
  onOpenSettings?: () => void;
}

export const DailyBriefingCard: React.FC<DailyBriefingCardProps> = () => {
  const { familyName, appointments, chores, mealPlans, members } = useFamily();
  const [briefing, setBriefing] = useState<DailyBriefing | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => typeof window !== 'undefined' && window.innerWidth < 640);

  // Filter events and chores for today
  const todayDateStr = new Date().toISOString().split('T')[0];
  const todayEvents = appointments.filter((a) => a.date?.startsWith(todayDateStr));
  const openChores = chores.filter((c) => !c.completed);
  const todayMealDay = mealPlans.find((m) => m.date === todayDateStr);
  const todayMeals = {
    lunch: todayMealDay?.lunch?.title,
    dinner: todayMealDay?.dinner?.title,
    breakfast: todayMealDay?.breakfast?.title,
  };

  useEffect(() => {
    let isMounted = true;

    async function load() {
      const cached = await getCachedDailyBriefing();
      if (cached && isMounted) {
        setBriefing(cached);
      } else if (isMounted) {
        // Automatically generate first briefing if none cached
        handleRefresh();
      }
    }

    const handleCustomUpdate = (e: any) => {
      if (e?.detail && isMounted) {
        setBriefing(e.detail);
      }
    };

    window.addEventListener('famly_daily_briefing_updated', handleCustomUpdate);
    load();

    return () => {
      isMounted = false;
      window.removeEventListener('famly_daily_briefing_updated', handleCustomUpdate);
    };
  }, []);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const result = await generateDailyBriefing({
        familyName,
        events: todayEvents,
        chores: openChores,
        meals: todayMeals,
        members,
      });
      setBriefing(result);
    } catch (err) {
      console.warn('Briefing refresh failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!briefing && !isLoading) {
    return null;
  }

  return (
    <div className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-rose-500/10 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-rose-950/30 border border-amber-200/60 dark:border-amber-700/30 shadow-sm backdrop-blur-md transition-all">
      {/* Header bar */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-amber-200/40 dark:border-amber-800/30">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 text-white shadow-md shadow-amber-500/20">
            <Sun className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Tägliche Familien-Routine
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:text-amber-200">
                <Sparkles className="h-3 w-3" /> Upstash Workflow
              </span>
            </div>
            <h2 className="text-lg font-black text-stone-800 dark:text-stone-100">
              {briefing?.headline || `Guten Morgen Familie ${familyName}! ☀️`}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            title="Briefing neu berechnen"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/80 dark:bg-slate-800/80 text-stone-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 shadow-sm border border-stone-200/60 dark:border-slate-700 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-amber-500' : ''}`} />
          </button>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/80 dark:bg-slate-800/80 text-stone-600 dark:text-slate-300 hover:text-stone-900 dark:hover:text-white shadow-sm border border-stone-200/60 dark:border-slate-700 transition-all"
          >
            {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Body content */}
      {!isCollapsed && (
        <div className="p-5 space-y-4">
          {isLoading && !briefing ? (
            <div className="flex items-center gap-3 py-6 text-stone-500 dark:text-slate-400 justify-center">
              <RefreshCw className="h-5 w-5 animate-spin text-amber-500" />
              <span className="text-sm font-medium">Gemini 3+ Flash stellt das Morgenbriefing zusammen...</span>
            </div>
          ) : (
            <>
              {/* Summary */}
              {briefing?.summary && (
                <p className="text-sm sm:text-base font-medium text-stone-700 dark:text-stone-200 leading-relaxed">
                  {briefing.summary}
                </p>
              )}

              {/* Highlights grid */}
              {briefing?.highlights && briefing.highlights.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  {briefing.highlights.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 rounded-2xl bg-white/70 dark:bg-slate-900/60 p-3 border border-amber-100 dark:border-amber-900/40 shadow-xs"
                    >
                      <CheckCircle2 className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                      <span className="text-xs sm:text-sm font-semibold text-stone-800 dark:text-stone-200">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Tip of the day */}
              {briefing?.tipOfTheDay && (
                <div className="flex items-center gap-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 px-4 py-2.5 border border-amber-200/60 dark:border-amber-800/40 text-xs sm:text-sm text-amber-900 dark:text-amber-200">
                  <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span className="italic font-medium">
                    Tipp des Tages: {briefing.tipOfTheDay}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
