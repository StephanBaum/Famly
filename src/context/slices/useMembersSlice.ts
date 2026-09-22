import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { FamilyMember } from '../../types';
import { STORAGE_KEYS, getStoredOrDefault } from '../storageKeys';

interface UseMembersSliceOptions {
  onAwardStars?: (memberId: string, count: number) => void;
}

export function useMembersSlice({ onAwardStars }: UseMembersSliceOptions = {}) {
  const [loggedInMemberId, setLoggedInMemberId] = useState<string | null>(() =>
    getStoredOrDefault<string | null>(STORAGE_KEYS.LOGGED_IN_MEMBER, null)
  );

  const [members, setMembers] = useState<FamilyMember[]>(() => {
    const stored = getStoredOrDefault<FamilyMember[] | null>(STORAGE_KEYS.MEMBERS, null);
    if (stored !== null) return stored;
    return [];
  });

  const [currentMemberId, setCurrentMemberId] = useState<string | 'all'>(() =>
    getStoredOrDefault(STORAGE_KEYS.ACTIVE_MEMBER, 'all')
  );

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_MEMBER, JSON.stringify(currentMemberId));
  }, [currentMemberId]);

  useEffect(() => {
    if (loggedInMemberId) {
      localStorage.setItem(STORAGE_KEYS.LOGGED_IN_MEMBER, JSON.stringify(loggedInMemberId));
    } else {
      localStorage.removeItem(STORAGE_KEYS.LOGGED_IN_MEMBER);
    }
  }, [loggedInMemberId]);

  const loggedInMember = members.find((m) => m.id === loggedInMemberId);
  const currentMember = members.find((m) => m.id === currentMemberId);

  const login = (memberId: string, pinInput?: string): { success: boolean; message?: string } => {
    const member = members.find((m) => m.id === memberId);
    if (!member) {
      return { success: false, message: 'Member profile not found' };
    }
    if (member.pin && member.pin !== pinInput) {
      return { success: false, message: 'Incorrect 4-digit PIN' };
    }
    setLoggedInMemberId(member.id);
    setCurrentMemberId(member.id);
    confetti({
      particleCount: 70,
      spread: 70,
      origin: { y: 0.6 },
    });
    return { success: true };
  };

  const logout = () => {
    setLoggedInMemberId(null);
    setCurrentMemberId('all');
  };

  const addMember = (m: Omit<FamilyMember, 'id'>) => {
    const newMember: FamilyMember = {
      ...m,
      id: `m_${Date.now()}`,
    };
    setMembers((prev) => [...prev, newMember]);
  };

  const updateMember = (id: string, updates: Partial<FamilyMember>) => {
    setMembers((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          return {
            ...m,
            ...updates,
            childDetails: updates.childDetails
              ? { ...(m.childDetails || {}), ...updates.childDetails }
              : m.childDetails,
          };
        }
        return m;
      })
    );
  };

  const deleteMember = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const awardStars = (memberId: string, count: number) => {
    const starDelta = Number(count) || 0;
    if (starDelta === 0) return;

    if (onAwardStars) {
      onAwardStars(memberId, starDelta);
    }

    setMembers((prev) =>
      prev.map((m) => {
        if (m.id === memberId) {
          return { ...m, stars: Math.max(0, (m.stars || 0) + starDelta) };
        }
        return m;
      })
    );
  };

  return {
    members,
    setMembers,
    loggedInMemberId,
    setLoggedInMemberId,
    loggedInMember,
    currentMemberId,
    setCurrentMemberId,
    currentMember,
    login,
    logout,
    addMember,
    updateMember,
    deleteMember,
    awardStars,
  };
}
