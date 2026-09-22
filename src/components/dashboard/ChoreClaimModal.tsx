import React from 'react';
import { Chore, FamilyMember } from '../../types';
import { ModalPortal } from '../ModalPortal';

interface ChoreClaimModalProps {
  chore: Chore | null;
  members: FamilyMember[];
  onClose: () => void;
  onClaim: (choreId: string, memberId: string) => void;
}

export const ChoreClaimModal: React.FC<ChoreClaimModalProps> = ({
  chore,
  members,
  onClose,
  onClaim,
}) => {
  if (!chore) return null;

  const getEligibleClaimants = (): FamilyMember[] => {
    if (chore.assignedMemberIds && chore.assignedMemberIds.length > 0) {
      const matched = members.filter((m) => chore.assignedMemberIds!.includes(m.id));
      if (matched.length > 0) return matched;
    }
    const kids = members.filter((m) => m.isChild);
    return kids.length > 0 ? kids : members;
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-xl border-2 border-stone-200 dark:border-slate-800 animate-in fade-in zoom-in-95 text-center">
          <span className="text-4xl mb-2 block">🌟</span>
          <h3 className="text-lg font-black text-stone-900 dark:text-white mb-1">
            Wer hat es erledigt?
          </h3>
          <p className="text-xs font-semibold text-stone-500 dark:text-slate-400 mb-4">
            „{chore.title}“ (+{chore.stars} ⭐)
          </p>

          <div className="space-y-2 mb-4">
            {getEligibleClaimants().map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  onClaim(chore.id, m.id);
                  onClose();
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl border-2 border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 hover:bg-amber-50 hover:border-amber-300 dark:hover:bg-amber-950/40 dark:hover:border-amber-700 transition-all cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{m.avatar}</span>
                  <div>
                    <p className="text-sm font-black text-stone-900 dark:text-white">{m.name}</p>
                    <p className="text-[10px] font-bold text-stone-400">{m.role}</p>
                  </div>
                </div>
                <span className="text-xs font-black text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-2.5 py-1 rounded-xl">
                  +{chore.stars} ⭐
                </span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="duo-btn duo-btn-white w-full py-2 text-xs font-bold rounded-xl"
          >
            Abbrechen
          </button>
        </div>
      </div>
    </ModalPortal>
  );
};
