import React from 'react';
import { Chore, FamilyMember } from '../../types';
import { ModalPortal } from '../ModalPortal';
import { Sparkles } from 'lucide-react';

interface CalendarClaimModalProps {
  claimingChore: Chore | null;
  onClose: () => void;
  onClaim: (choreId: string, memberId: string) => void;
  eligibleClaimants: FamilyMember[];
}

export const CalendarClaimModal: React.FC<CalendarClaimModalProps> = ({
  claimingChore,
  onClose,
  onClaim,
  eligibleClaimants,
}) => {
  if (!claimingChore) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border-2 border-stone-200 dark:border-slate-800 animate-in fade-in zoom-in-95 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
            <Sparkles className="w-8 h-8" />
          </div>

          <h3 className="text-lg font-black text-stone-900 dark:text-white">
            Wer hat die Aufgabe erledigt?
          </h3>
          <p className="text-xs text-stone-600 dark:text-slate-300 mt-1.5 font-medium">
            "{claimingChore.title}" (+{claimingChore.stars} Sterne ⭐)
          </p>

          <div className="grid grid-cols-2 gap-2.5 mt-5">
            {eligibleClaimants.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => {
                  onClaim(claimingChore.id, member.id);
                  onClose();
                }}
                className="duo-btn duo-btn-white p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-all group"
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">
                  {member.avatar}
                </span>
                <span className="text-xs font-black text-stone-800 dark:text-stone-200">
                  {member.name}
                </span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="duo-btn duo-btn-white w-full mt-4 py-2 text-xs font-bold rounded-xl"
          >
            Abbrechen
          </button>
        </div>
      </div>
    </ModalPortal>
  );
};
