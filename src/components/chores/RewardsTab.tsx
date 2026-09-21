import React from 'react';
import { Reward, RewardClaim, FamilyMember } from '../../types';
import { Trophy, Gift, Clock, Trash2, CheckCheck, Check, Plus } from 'lucide-react';

interface RewardsTabProps {
  rewards: Reward[];
  rewardClaims: RewardClaim[];
  members: FamilyMember[];
  eligibleRewardMembers: FamilyMember[];
  selectedChildForReward: string;
  onSelectChild: (id: string) => void;
  getMemberStarBalance: (memberId: string) => number;
  onClaimReward: (rewardId: string) => void;
  onDeleteReward: (rewardId: string) => void;
  onApproveClaim: (claimId: string) => void;
  onDeleteClaim: (claimId: string) => void;
  onOpenAddReward: () => void;
  rewardError: string | null;
  chores: Array<{ assignedMemberId?: string; completed: boolean; stars: number }>;
  getMemberTotalEarnedStars?: (memberId: string) => number;
}

export const RewardsTab: React.FC<RewardsTabProps> = ({
  rewards,
  rewardClaims,
  members,
  eligibleRewardMembers,
  selectedChildForReward,
  onSelectChild,
  getMemberStarBalance,
  onClaimReward,
  onDeleteReward,
  onApproveClaim,
  onDeleteClaim,
  onOpenAddReward,
  rewardError,
  chores,
  getMemberTotalEarnedStars,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Star Banks per Child / Member */}
      <div className="duo-card p-6 bg-white dark:bg-slate-900 border-2 border-stone-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-base font-black text-stone-900 dark:text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <span>Sterne-Sparkonten der Kinder</span>
            </h4>
            <p className="text-xs font-semibold text-stone-500 dark:text-slate-400">
              Erledigte Aufgaben bringen Sterne, die hier gegen tolle Familien-Belohnungen eingelöst werden können!
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenAddReward}
            className="duo-btn duo-btn-purple px-4 py-2.5 text-xs font-black rounded-2xl shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 mr-1 stroke-[3]" />
            <span>Eigene Belohnung</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
          {eligibleRewardMembers.map((m) => {
            const balance = getMemberStarBalance(m.id);
            const isSelected = selectedChildForReward === m.id;
            const totalEarned = getMemberTotalEarnedStars
              ? getMemberTotalEarnedStars(m.id)
              : chores
                  .filter((c) => c.assignedMemberId === m.id && c.completed)
                  .reduce((sum, c) => sum + c.stars, 0);
            const spent = rewardClaims
              .filter((c) => c.memberId === m.id)
              .reduce((sum, c) => sum + c.starsSpent, 0);

            return (
              <button
                key={m.id}
                type="button"
                onClick={() => onSelectChild(m.id)}
                className={`text-left p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-400 dark:border-amber-500 shadow-sm ring-2 ring-amber-400/20'
                    : 'bg-stone-50/60 dark:bg-slate-800/40 border-stone-200 dark:border-slate-700 hover:border-amber-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{m.avatar}</span>
                    <div>
                      <p className="text-sm font-black text-stone-900 dark:text-white">{m.name}</p>
                      <p className="text-[10px] font-bold text-stone-400">{m.role}</p>
                    </div>
                  </div>
                  {isSelected && (
                    <span className="text-[10px] font-black uppercase bg-amber-400 text-stone-900 px-2 py-0.5 rounded-full shadow-2xs">
                      Aktiv
                    </span>
                  )}
                </div>

                <div className="flex items-baseline justify-between mt-3 pt-2 border-t border-stone-200/50 dark:border-slate-700/50">
                  <span className="text-xs font-bold text-stone-500 dark:text-slate-400">Verfügbar:</span>
                  <span className="text-lg font-black text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    ⭐ {balance} Sterne
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-semibold text-stone-400 mt-0.5">
                  <span>Gesamt: {totalEarned} ⭐</span>
                  <span>Eingelöst: {spent} ⭐</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected child hint */}
        <div className="bg-amber-50/50 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-200 dark:border-amber-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-stone-700 dark:text-slate-200">
            <span>💡</span>
            <span>
              Belohnungen werden eingelöst für:{' '}
              <strong className="font-black text-amber-700 dark:text-amber-400">
                {members.find((m) => m.id === selectedChildForReward)?.name || 'Ausgewähltes Kind'}
              </strong>{' '}
              (Guthaben: {getMemberStarBalance(selectedChildForReward)} Sterne)
            </span>
          </div>
          {rewardError && (
            <span className="font-black text-rose-600 dark:text-rose-400 animate-bounce">
              {rewardError}
            </span>
          )}
        </div>
      </div>

      {/* Available Rewards Grid */}
      <div className="duo-card p-6 bg-white dark:bg-slate-900 border-2 border-stone-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-base font-black text-stone-900 dark:text-white flex items-center gap-2">
            <Gift className="w-5 h-5 text-purple-500" />
            <span>Verfügbare Belohnungen</span>
          </h4>
          <span className="text-xs font-bold text-stone-400 dark:text-slate-400">
            {rewards.length} Belohnungen im Katalog
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rewards.map((reward) => {
            const currentChildBalance = getMemberStarBalance(selectedChildForReward);
            const canAfford = currentChildBalance >= reward.starsCost;
            const needed = reward.starsCost - currentChildBalance;

            return (
              <div
                key={reward.id}
                className={`p-4 rounded-2xl border-2 flex flex-col justify-between transition-all ${
                  canAfford
                    ? 'bg-gradient-to-b from-white to-amber-50/30 dark:from-slate-800 dark:to-slate-800/80 border-stone-200 dark:border-slate-700 hover:border-amber-400 shadow-2xs'
                    : 'bg-stone-50/50 dark:bg-slate-900/60 border-stone-200/60 dark:border-slate-800/80 opacity-75'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-3xl p-2 bg-stone-100 dark:bg-slate-700/60 rounded-2xl">
                      {reward.icon}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2.5 py-1 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 text-xs font-black border border-amber-300 dark:border-amber-700">
                        ⭐ {reward.starsCost}
                      </span>
                      {reward.id.startsWith('r_custom') && (
                        <button
                          type="button"
                          onClick={() => onDeleteReward(reward.id)}
                          className="text-stone-300 hover:text-rose-500 p-1"
                          title="Belohnung löschen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <h5 className="text-sm font-black text-stone-900 dark:text-white mb-1">
                    {reward.title}
                  </h5>
                  {reward.description && (
                    <p className="text-xs text-stone-500 dark:text-slate-400 leading-relaxed mb-3">
                      {reward.description}
                    </p>
                  )}
                </div>

                <div className="pt-3 mt-2 border-t border-stone-100 dark:border-slate-800">
                  {canAfford ? (
                    <button
                      type="button"
                      onClick={() => onClaimReward(reward.id)}
                      className="w-full duo-btn duo-btn-amber py-2 text-xs font-black rounded-xl flex items-center justify-center gap-1.5 shadow-2xs hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      <span>⭐ Einlösen</span>
                    </button>
                  ) : (
                    <div className="w-full py-2 px-3 rounded-xl bg-stone-100 dark:bg-slate-800 text-center text-xs font-bold text-stone-400 dark:text-slate-500 border border-stone-200 dark:border-slate-700">
                      Noch {needed} ⭐ benötigt
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Claims & History Section */}
      <div className="duo-card p-6 bg-white dark:bg-slate-900 border-2 border-stone-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-base font-black text-stone-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-500" />
              <span>Eingelöste Belohnungen & Gutscheine</span>
            </h4>
            <p className="text-xs font-semibold text-stone-500 dark:text-slate-400">
              Von Kindern beantragte Belohnungen können hier von den Eltern genehmigt & abgehakt werden.
            </p>
          </div>
          <span className="text-xs font-bold text-stone-400 dark:text-slate-400">
            {rewardClaims.length} gesamt
          </span>
        </div>

        {rewardClaims.length === 0 ? (
          <div className="text-center py-8 text-stone-400 dark:text-slate-500 space-y-2">
            <span className="text-3xl block">🎟️</span>
            <p className="text-xs font-bold">Noch keine Belohnungen beantragt.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {rewardClaims.map((claim) => {
              const claimant = members.find((m) => m.id === claim.memberId);
              const isPending = claim.status === 'pending';

              return (
                <div
                  key={claim.id}
                  className={`p-3.5 rounded-2xl border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                    isPending
                      ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60'
                      : 'bg-stone-50/40 dark:bg-slate-800/40 border-stone-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl p-2 bg-white dark:bg-slate-800 rounded-xl border border-stone-200 dark:border-slate-700">
                      {claim.rewardIcon}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="text-sm font-black text-stone-900 dark:text-white">
                          {claim.rewardTitle}
                        </h5>
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                          (-{claim.starsSpent} ⭐)
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-slate-400 mt-0.5">
                        <span>Eingelöst von:</span>
                        <span className="font-bold text-stone-700 dark:text-slate-200">
                          {claimant?.avatar} {claimant?.name || 'Kind'}
                        </span>
                        <span>•</span>
                        <span>
                          {new Date(claim.claimedAt).toLocaleDateString('de-DE', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {isPending ? (
                      <>
                        <span className="text-[11px] font-black px-2.5 py-1 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                          ⏳ Wartet auf OK
                        </span>

                        <button
                          type="button"
                          onClick={() => onApproveClaim(claim.id)}
                          className="duo-btn duo-btn-green px-3 py-1.5 text-xs font-black rounded-xl flex items-center gap-1 shadow-2xs"
                          title="Von Eltern genehmigen & einlösen"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span>Genehmigen</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onDeleteClaim(claim.id)}
                          className="text-stone-400 hover:text-rose-500 p-1.5"
                          title="Einlösung stornieren (Sterne erstatten)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="text-[11px] font-black px-2.5 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Genehmigt & Eingelöst</span>
                        </span>

                        <button
                          type="button"
                          onClick={() => onDeleteClaim(claim.id)}
                          className="text-stone-300 hover:text-rose-500 p-1.5"
                          title="Eintrag entfernen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
