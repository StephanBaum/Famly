import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Chore, Reward, RewardClaim, FamilyMember } from '../../types';
import { INITIAL_CHORES } from '../../utils/initialData';
import { STORAGE_KEYS, INITIAL_REWARDS, getStoredOrDefault } from '../storageKeys';

interface UseChoresRewardsSliceOptions {
  currentMemberId: string | 'all';
  setMembers: React.Dispatch<React.SetStateAction<FamilyMember[]>>;
}

export function useChoresRewardsSlice({
  currentMemberId,
  setMembers,
}: UseChoresRewardsSliceOptions) {
  const [chores, setChores] = useState<Chore[]>(() => {
    const stored = getStoredOrDefault<Chore[] | null>(STORAGE_KEYS.CHORES, null);
    if (stored !== null) return stored;
    return [];
  });

  const [rewards, setRewards] = useState<Reward[]>(() =>
    getStoredOrDefault(STORAGE_KEYS.REWARDS, INITIAL_REWARDS)
  );

  const [rewardClaims, setRewardClaims] = useState<RewardClaim[]>(() =>
    getStoredOrDefault(STORAGE_KEYS.REWARD_CLAIMS, [])
  );

  // Permanent Star Bank / Ledger - stars earned by children are NEVER wiped on chore deletion!
  const [earnedStars, setEarnedStars] = useState<Record<string, number>>(() => {
    const stored = getStoredOrDefault<Record<string, number> | null>(STORAGE_KEYS.EARNED_STARS, null);
    if (stored !== null) return stored;

    // Backward compatibility & migration: seed from completed chores
    const initialMap: Record<string, number> = {};
    const existingChores = getStoredOrDefault<Chore[] | null>(STORAGE_KEYS.CHORES, null) || INITIAL_CHORES;
    existingChores.forEach((c) => {
      if (c.completed) {
        const who = c.completedByMemberId || c.assignedMemberId || (c.assignedMemberIds && c.assignedMemberIds[0]);
        if (who && who !== 'all') {
          initialMap[who] = (initialMap[who] || 0) + (c.stars || 0);
        }
      }
    });
    return initialMap;
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CHORES, JSON.stringify(chores));
  }, [chores]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.REWARDS, JSON.stringify(rewards));
  }, [rewards]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.REWARD_CLAIMS, JSON.stringify(rewardClaims));
  }, [rewardClaims]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EARNED_STARS, JSON.stringify(earnedStars));
  }, [earnedStars]);

  // Chores
  const addChore = (
    title: string,
    assignedMemberId: string,
    frequency: Chore['frequency'],
    stars: number,
    assignedMemberIds?: string[],
    dueDate?: string
  ) => {
    const ids = assignedMemberIds && assignedMemberIds.length > 0
      ? assignedMemberIds
      : (assignedMemberId && assignedMemberId !== 'all' && assignedMemberId !== 'anyone' ? [assignedMemberId] : []);

    const newChore: Chore = {
      id: `c_${Date.now()}`,
      title: title.trim(),
      assignedMemberId: ids[0] || '',
      assignedMemberIds: ids,
      frequency,
      completed: false,
      stars: Math.max(1, Number(stars) || 1),
      dueDate: dueDate ? dueDate.trim() : undefined,
    };
    setChores((prev) => [newChore, ...prev]);
  };

  const updateChore = (id: string, updates: Partial<Omit<Chore, 'id'>>) => {
    setChores((prev) =>
      prev.map((chore) => {
        if (chore.id === id) {
          const updated = { ...chore, ...updates };
          if (updates.assignedMemberIds !== undefined && updates.assignedMemberId === undefined) {
            updated.assignedMemberId = updates.assignedMemberIds[0] || '';
          }
          return updated;
        }
        return chore;
      })
    );
  };

  const toggleChore = (id: string, completingMemberId?: string) => {
    setChores((prev) =>
      prev.map((chore) => {
        if (chore.id === id) {
          const newCompleted = !chore.completed;
          const assignedId = chore.assignedMemberId || (chore.assignedMemberIds && chore.assignedMemberIds.length === 1 ? chore.assignedMemberIds[0] : undefined);
          const activeOrProvided = completingMemberId || (currentMemberId !== 'all' ? currentMemberId : undefined);
          const beneficiaryId = newCompleted
            ? (activeOrProvided || chore.completedByMemberId || assignedId)
            : (chore.completedByMemberId || assignedId);

          if (newCompleted) {
            confetti({
              particleCount: 60,
              spread: 60,
              origin: { y: 0.6 },
              colors: ['#F59E0B', '#10B981', '#6366F1', '#EC4899'],
            });
            if (beneficiaryId) {
              setEarnedStars((s) => ({
                ...s,
                [beneficiaryId]: (s[beneficiaryId] || 0) + (chore.stars || 0),
              }));

              const todayStr = new Date().toISOString().split('T')[0];
              const yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);
              const yesterdayStr = yesterday.toISOString().split('T')[0];

              setMembers((prevMembers) =>
                prevMembers.map((m) => {
                  if (m.id !== beneficiaryId) return m;

                  let streak = m.choreStreak || 0;
                  if (m.lastStreakDate === yesterdayStr) {
                    streak += 1;
                  } else if (m.lastStreakDate !== todayStr) {
                    streak = 1;
                  }

                  const existingBadges = m.earnedBadges || [];
                  const newBadges = [...existingBadges];
                  if (streak >= 3 && !newBadges.includes('🔥 3-Tage-Serie')) {
                    newBadges.push('🔥 3-Tage-Serie');
                  }
                  if (streak >= 7 && !newBadges.includes('⚡ 7-Tage-Champion')) {
                    newBadges.push('⚡ 7-Tage-Champion');
                  }
                  const totalStars = (earnedStars[m.id] || 0) + (chore.stars || 0);
                  if (totalStars >= 15 && !newBadges.includes('⭐ Sternen-Profi')) {
                    newBadges.push('⭐ Sternen-Profi');
                  }
                  if (totalStars >= 50 && !newBadges.includes('👑 Alltags-Held')) {
                    newBadges.push('👑 Alltags-Held');
                  }

                  return {
                    ...m,
                    choreStreak: streak,
                    lastStreakDate: todayStr,
                    earnedBadges: newBadges,
                  };
                })
              );
            }
          } else {
            if (beneficiaryId) {
              setEarnedStars((s) => ({
                ...s,
                [beneficiaryId]: Math.max(0, (s[beneficiaryId] || 0) - (chore.stars || 0)),
              }));
            }
          }

          const updated: Chore = {
            ...chore,
            completed: newCompleted,
            completedByMemberId: newCompleted ? beneficiaryId : undefined,
            completedAt: newCompleted ? new Date().toISOString() : undefined,
          };
          return updated;
        }
        return chore;
      })
    );
  };

  const deleteChore = (id: string) => {
    setChores((prev) => prev.filter((chore) => chore.id !== id));
  };

  // Rewards & Gamification
  const addReward = (
    title: string,
    starsCost: number,
    icon = '🎁',
    description?: string,
    targetMemberId?: string
  ) => {
    const newRew: Reward = {
      id: `rew_${Date.now()}`,
      title: title.trim(),
      starsCost: Math.max(1, Number(starsCost)),
      icon: icon || '🎁',
      description: description?.trim() || undefined,
      targetMemberId: targetMemberId || undefined,
    };
    setRewards((prev) => [...prev, newRew]);
  };

  const deleteReward = (id: string) => {
    setRewards((prev) => prev.filter((r) => r.id !== id));
  };

  const getMemberTotalEarnedStars = (memberId: string): number => {
    return earnedStars[memberId] || 0;
  };

  const getMemberStarBalance = (memberId: string): number => {
    const totalEarned = getMemberTotalEarnedStars(memberId);

    const totalSpent = rewardClaims
      .filter((cl) => cl.memberId === memberId && cl.status !== 'rejected')
      .reduce((acc, cl) => acc + (cl.starsSpent || 0), 0);

    return Math.max(0, totalEarned - totalSpent);
  };

  const addMemberStars = (memberId: string, amount: number) => {
    setEarnedStars((prev) => ({
      ...prev,
      [memberId]: Math.max(0, (prev[memberId] || 0) + amount),
    }));
  };

  const claimReward = (rewardId: string, memberId: string): boolean => {
    const reward = rewards.find((r) => r.id === rewardId);
    if (!reward) return false;

    const balance = getMemberStarBalance(memberId);
    if (balance < reward.starsCost) return false;

    const newClaim: RewardClaim = {
      id: `claim_${Date.now()}`,
      rewardId: reward.id,
      rewardTitle: reward.title,
      rewardIcon: reward.icon,
      memberId,
      starsSpent: reward.starsCost,
      claimedAt: new Date().toISOString(),
      status: 'pending',
    };

    setRewardClaims((prev) => [newClaim, ...prev]);

    confetti({
      particleCount: 75,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#F59E0B', '#10B981', '#EC4899', '#6366F1'],
    });

    return true;
  };

  const approveClaim = (claimId: string) => {
    setRewardClaims((prev) =>
      prev.map((c) => (c.id === claimId ? { ...c, status: 'approved' } : c))
    );
  };

  const deleteClaim = (claimId: string) => {
    setRewardClaims((prev) => prev.filter((c) => c.id !== claimId));
  };

  return {
    chores,
    setChores,
    rewards,
    setRewards,
    rewardClaims,
    setRewardClaims,
    earnedStars,
    setEarnedStars,
    addChore,
    updateChore,
    toggleChore,
    deleteChore,
    addReward,
    deleteReward,
    claimReward,
    approveClaim,
    deleteClaim,
    getMemberStarBalance,
    getMemberTotalEarnedStars,
    addMemberStars,
  };
}
