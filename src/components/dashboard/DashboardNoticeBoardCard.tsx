import React from 'react';
import { Pin, Plus, Wifi, AlertCircle, PartyPopper } from 'lucide-react';
import { PinnedNote, FamilyMember } from '../../types';

interface DashboardNoticeBoardCardProps {
  notes: PinnedNote[];
  members: FamilyMember[];
  onOpenAddNote: () => void;
  onDeleteNote: (id: string) => void;
}

export const DashboardNoticeBoardCard: React.FC<DashboardNoticeBoardCardProps> = ({
  notes,
  members,
  onOpenAddNote,
  onDeleteNote,
}) => {
  return (
    <div className="duo-card p-4 sm:p-6 bg-white dark:bg-slate-900">
      <div className="flex items-center justify-between mb-4 gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 flex items-center justify-center font-black shrink-0">
            <Pin className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="font-black text-stone-900 dark:text-white text-base truncate">Notizen & Infos</h3>
          </div>
        </div>
        <button
          onClick={onOpenAddNote}
          className="duo-btn duo-btn-rose px-3 py-1.5 text-xs font-black rounded-xl shrink-0 whitespace-nowrap flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span className="hidden sm:inline">Notiz anheften</span>
          <span className="sm:hidden">Notiz</span>
        </button>
      </div>

      {notes.length === 0 ? (
        <div className="text-center py-6 bg-stone-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-stone-200 dark:border-slate-700">
          <span className="text-2xl mb-1 block">📌</span>
          <p className="text-xs font-bold text-stone-600 dark:text-slate-300">Noch keine Notizen auf dem Schwarzen Brett.</p>
          <button
            onClick={onOpenAddNote}
            className="mt-2 text-xs font-black text-rose-600 dark:text-rose-400 hover:underline"
          >
            + Erste Notiz anheften
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => {
            const author = members.find((m) => m.id === note.authorMemberId);
            const tagStyles: Record<PinnedNote['tag'], string> = {
              wifi: 'bg-sky-50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800 text-sky-950 dark:text-sky-200',
              urgent: 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-200',
              fun: 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200',
              info: 'bg-stone-50 dark:bg-slate-800 border-stone-300 dark:border-slate-700 text-stone-950 dark:text-slate-200',
            };
            return (
              <div
                key={note.id}
                className={`p-3.5 rounded-2xl border-2 border-b-4 ${
                  tagStyles[note.tag]
                } relative group`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 font-black text-xs">
                    {note.tag === 'wifi' && <Wifi className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />}
                    {note.tag === 'urgent' && <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />}
                    {note.tag === 'fun' && <PartyPopper className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
                    <span>{note.title}</span>
                  </div>
                  <button
                    onClick={() => onDeleteNote(note.id)}
                    className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-rose-600 text-xs font-bold transition-opacity"
                    title="Notiz löschen"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-xs font-medium whitespace-pre-line leading-relaxed">
                  {note.content}
                </p>
                <div className="mt-2 flex items-center justify-between text-[10px] text-stone-400 dark:text-slate-400 font-semibold">
                  <span>Von {author ? author.name : 'Familie'}</span>
                  <span>{note.createdAt}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
