import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { useFamily } from '../context/FamilyContext';
import { FamilyMember, Chore, isChoreRelevantForMember, isChoreOnDate } from '../types';
import { Sparkles, CheckCircle2, Circle, Trophy, Flame, Gift, ArrowLeft, Star } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface KidsViewProps {
  onExitKidsMode: () => void;
}

export const KidsView: React.FC<KidsViewProps> = ({ onExitKidsMode }) => {
  const {
    members,
    currentMemberId,
    setCurrentMemberId,
    chores,
    toggleChore,
    rewards,
    claimReward,
    getMemberStarBalance,
  } = useFamily();

  // Find all kids in household
  const kids = members.filter((m) => m.isChild);
  const activeKid: FamilyMember =
    kids.find((k) => k.id === currentMemberId) || kids[0] || members[0];

  const [claimFeedback, setClaimFeedback] = useState<string | null>(null);

  const starBalance = getMemberStarBalance(activeKid.id);
  const streak = activeKid.choreStreak || 1;
  const badges = activeKid.earnedBadges || ['⭐ Starter-Stern'];

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  // Filter chores for active kid
  const kidChores = chores.filter(
    (c) => isChoreRelevantForMember(c, activeKid.id) && isChoreOnDate(c, todayStr)
  );
  const completedCount = kidChores.filter((c) => c.completed).length;

  const handleChoreClick = (chore: Chore) => {
    toggleChore(chore.id, activeKid.id);
    if (!chore.completed) {
      triggerHaptic('success');
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#FFC800', '#22C55E', '#3B82F6', '#EC4899'],
      });
    } else {
      triggerHaptic('light');
    }
  };

  const handleClaimReward = (rewardId: string, rewardTitle: string) => {
    const success = claimReward(rewardId, activeKid.id);
    if (success) {
      triggerHaptic('celebration');
      setClaimFeedback(`🎉 Belohnung "${rewardTitle}" angefragt! Deine Eltern müssen sie nur noch bestätigen.`);
      confetti({
        particleCount: 70,
        spread: 70,
        origin: { y: 0.5 },
      });
      setTimeout(() => setClaimFeedback(null), 5000);
    } else {
      triggerHaptic('medium');
      setClaimFeedback('Du hast leider noch nicht genug Sterne für diese Belohnung.');
      setTimeout(() => setClaimFeedback(null), 3500);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 via-amber-50 to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 sm:p-6 text-stone-900 dark:text-white font-sans">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Top Header: Kid Switcher & Exit */}
        <div className="flex items-center justify-between">
          <button
            onClick={onExitKidsMode}
            className="duo-btn duo-btn-white px-3.5 py-2 text-xs font-black rounded-2xl flex items-center gap-1.5 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 stroke-[3]" />
            <span>Zurück zur Eltern-Ansicht</span>
          </button>

          {/* Child Switcher if multiple kids */}
          {kids.length > 1 && (
            <div className="flex items-center gap-2">
              {kids.map((k) => (
                <button
                  key={k.id}
                  onClick={() => setCurrentMemberId(k.id)}
                  className={`px-3 py-1.5 rounded-2xl text-xs font-black flex items-center gap-1.5 transition-all border-2 ${
                    k.id === activeKid.id
                      ? 'bg-white dark:bg-slate-800 border-amber-400 shadow-sm scale-105'
                      : 'bg-white/60 dark:bg-slate-800/60 border-transparent opacity-75'
                  }`}
                >
                  <span className="text-base">{k.avatar}</span>
                  <span>{k.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Hero Card with Big Avatar, Stars & Streak */}
        <div className="duo-card p-6 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-300 dark:from-amber-600 dark:to-yellow-600 border-4 border-amber-500 rounded-3xl shadow-lg text-stone-900 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-3xl bg-white border-4 border-amber-200 flex items-center justify-center text-4xl shadow-md shrink-0">
                {activeKid.avatar}
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                  Hallo, {activeKid.name}! 🚀
                </h1>
                <p className="text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-100">
                  {format(new Date(), 'EEEE, d. MMMM', { locale: de })}
                </p>
              </div>
            </div>

            {/* Big Star Balance Badge */}
            <div className="flex items-center gap-3">
              <div className="bg-white dark:bg-slate-900 px-5 py-3 rounded-3xl border-3 border-amber-400 shadow-md flex items-center gap-2">
                <Star className="w-8 h-8 fill-amber-400 text-amber-500 animate-bounce" />
                <div>
                  <span className="block text-3xl font-black text-stone-900 dark:text-white leading-none">
                    {starBalance}
                  </span>
                  <span className="text-[10px] font-extrabold uppercase text-amber-700 dark:text-amber-400 tracking-wider">
                    Sterne
                  </span>
                </div>
              </div>

              {/* Streak Badge */}
              <div className="bg-white dark:bg-slate-900 px-4 py-3 rounded-3xl border-3 border-orange-400 shadow-md flex items-center gap-2">
                <Flame className="w-7 h-7 text-orange-500 fill-orange-500" />
                <div>
                  <span className="block text-2xl font-black text-stone-900 dark:text-white leading-none">
                    {streak}
                  </span>
                  <span className="text-[10px] font-extrabold uppercase text-orange-700 dark:text-orange-400 tracking-wider">
                    Tage
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Badges Display */}
          <div className="pt-3 border-t-2 border-amber-500/40 flex items-center gap-2 flex-wrap">
            <span className="text-xs font-black text-amber-900 dark:text-amber-100 uppercase tracking-wider flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5" /> Deine Auszeichnungen:
            </span>
            {badges.map((badge, idx) => (
              <span
                key={idx}
                className="px-3 py-1 rounded-full bg-white/90 dark:bg-slate-900/90 text-stone-900 dark:text-white font-black text-xs shadow-2xs border border-amber-300"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>

        {/* Claim Feedback Toast */}
        {claimFeedback && (
          <div className="p-4 rounded-2xl bg-emerald-500 text-white font-black text-sm shadow-lg animate-in fade-in zoom-in-95 flex items-center justify-between">
            <span>{claimFeedback}</span>
            <button onClick={() => setClaimFeedback(null)} className="ml-2 underline text-xs">
              OK
            </button>
          </div>
        )}

        {/* Chores Section: Large Tactile Buttons */}
        <div className="duo-card p-5 bg-white dark:bg-slate-900 border-2 border-stone-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 dark:border-slate-800 pb-3">
            <h2 className="text-lg font-black text-stone-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>Deine Aufgaben für heute</span>
            </h2>
            <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-black text-xs">
              {completedCount} / {kidChores.length} erledigt
            </span>
          </div>

          {kidChores.length === 0 ? (
            <div className="text-center py-10 text-stone-400 space-y-2">
              <span className="text-4xl block">🎉</span>
              <p className="font-bold text-sm">Super gemacht! Keine offenen Aufgaben für heute.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {kidChores.map((chore) => (
                <div
                  key={chore.id}
                  onClick={() => handleChoreClick(chore)}
                  className={`p-4 rounded-3xl border-3 transition-all cursor-pointer flex items-center justify-between gap-4 select-none ${
                    chore.completed
                      ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 opacity-80'
                      : 'bg-amber-50 dark:bg-slate-800 border-amber-300 dark:border-amber-700 hover:scale-102 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <button
                      type="button"
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black transition-all ${
                        chore.completed
                          ? 'bg-emerald-500 text-white shadow-sm'
                          : 'bg-white dark:bg-slate-700 text-stone-300 border-2 border-stone-300 dark:border-slate-600'
                      }`}
                    >
                      {chore.completed ? <CheckCircle2 className="w-7 h-7" /> : <Circle className="w-7 h-7" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <h3
                        className={`text-base font-black truncate ${
                          chore.completed
                            ? 'line-through text-stone-400 dark:text-slate-500'
                            : 'text-stone-900 dark:text-white'
                        }`}
                      >
                        {chore.title}
                      </h3>
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                        Belohnung: +{chore.stars} ★
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-4 py-2 rounded-2xl font-black text-sm shadow-xs ${
                      chore.completed
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-400 text-stone-900 border-b-3 border-amber-500'
                    }`}
                  >
                    {chore.completed ? 'Erledigt ✓' : `+${chore.stars} ★`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rewards Store Section */}
        <div className="duo-card p-5 bg-white dark:bg-slate-900 border-2 border-stone-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 dark:border-slate-800 pb-3">
            <h2 className="text-lg font-black text-stone-900 dark:text-white flex items-center gap-2">
              <Gift className="w-5 h-5 text-purple-500" />
              <span>Belohnungen einlösen</span>
            </h2>
            <span className="text-xs font-bold text-stone-400">
              Verfügbar: {starBalance} Sterne
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {rewards.map((reward) => {
              const canAfford = starBalance >= reward.starsCost;
              return (
                <div
                  key={reward.id}
                  className={`p-4 rounded-3xl border-2 transition-all flex flex-col justify-between gap-3 ${
                    canAfford
                      ? 'bg-purple-50/70 dark:bg-purple-950/30 border-purple-300 dark:border-purple-800'
                      : 'bg-stone-50 dark:bg-slate-800/60 border-stone-200 dark:border-slate-700 opacity-75'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-3xl p-2 bg-white dark:bg-slate-800 rounded-2xl shadow-2xs border border-stone-200 dark:border-slate-700">
                      {reward.icon}
                    </span>
                    <div>
                      <h4 className="font-black text-sm text-stone-900 dark:text-white">
                        {reward.title}
                      </h4>
                      {reward.description && (
                        <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
                          {reward.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-purple-200/60 dark:border-purple-900/60">
                    <span className="text-xs font-black text-purple-700 dark:text-purple-300">
                      {reward.starsCost} ★ benötigt
                    </span>
                    <button
                      type="button"
                      onClick={() => handleClaimReward(reward.id, reward.title)}
                      disabled={!canAfford}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                        canAfford
                          ? 'duo-btn duo-btn-purple shadow-xs'
                          : 'bg-stone-200 dark:bg-slate-700 text-stone-400 cursor-not-allowed'
                      }`}
                    >
                      {canAfford ? 'Jetzt einlösen 🎁' : `Fehlen noch ${reward.starsCost - starBalance}★`}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
