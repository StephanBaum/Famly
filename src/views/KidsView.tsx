import React, { useState } from 'react';
import { useFamily } from '../context/FamilyContext';
import { FamilyMember } from '../types';
import { KidLessonNode } from '../types/kidsEducation';
import {
  getKidProgress,
  buildKidLessonPath,
  KidProgressData,
} from '../services/kidsEducationService';
import { KidLessonPlayerModal } from '../components/kids/KidLessonPlayerModal';
import { KidParentSettingsModal } from '../components/kids/KidParentSettingsModal';
import {
  ArrowLeft,
  Settings,
  Flame,
  Star,
  Check,
  Lock,
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface KidsViewProps {
  onExitKidsMode: () => void;
}

export const KidsView: React.FC<KidsViewProps> = ({ onExitKidsMode }) => {
  const { members, currentMemberId, setCurrentMemberId } = useFamily();

  // Find all kids in household
  const kids = members.filter((m) => m.isChild);
  const activeKid: FamilyMember =
    kids.find((k) => k.id === currentMemberId) || kids[0] || members[0];

  // Learning progress & path
  const [refreshKey, setRefreshKey] = useState(0);
  const progress: KidProgressData = React.useMemo(() => {
    return getKidProgress(activeKid.id);
  }, [activeKid.id, refreshKey]);

  const lessonPath: KidLessonNode[] = React.useMemo(() => {
    return buildKidLessonPath(activeKid.id);
  }, [activeKid.id, refreshKey]);

  // Modal States
  const [activeLesson, setActiveLesson] = useState<KidLessonNode | null>(null);
  const [isParentSettingsOpen, setIsParentSettingsOpen] = useState(false);

  const handleOpenLesson = (lesson: KidLessonNode) => {
    if (lesson.isLocked) {
      triggerHaptic('medium');
      return;
    }
    triggerHaptic('light');
    setActiveLesson(lesson);
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-sky-100 via-amber-50 to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-stone-900 dark:text-white font-sans flex flex-col">
      
      {/* Top App Bar: Duolingo Header */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b-2 border-stone-200 dark:border-slate-800 p-3 sm:p-4 shadow-xs">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-2">
          
          {/* Back to Parent Dashboard */}
          <button
            type="button"
            onClick={onExitKidsMode}
            className="duo-btn duo-btn-white px-3 py-1.5 rounded-2xl text-xs font-black flex items-center gap-1.5 text-stone-600 dark:text-slate-300"
          >
            <ArrowLeft className="w-4 h-4 stroke-[3]" />
            <span className="hidden sm:inline">Eltern-Bereich</span>
          </button>

          {/* Child Switcher (if multiple kids) */}
          {kids.length > 1 && (
            <div className="flex items-center gap-1 bg-stone-100 dark:bg-slate-800 p-1 rounded-2xl">
              {kids.map((k) => (
                <button
                  key={k.id}
                  onClick={() => {
                    setCurrentMemberId(k.id);
                    setRefreshKey((k) => k + 1);
                  }}
                  className={`px-2.5 py-1 rounded-xl text-xs font-black flex items-center gap-1 transition-all ${
                    k.id === activeKid.id
                      ? 'bg-amber-400 text-stone-900 shadow-xs'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  <span>{k.avatar}</span>
                  <span className="hidden xs:inline">{k.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Gamification Stats: Streak & XP & Settings */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-2xl bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-black">
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>{progress.streakDays || 1}</span>
            </div>

            <div className="flex items-center gap-1 px-2.5 py-1 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-black">
              <Star className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500" />
              <span>{progress.xp} XP</span>
            </div>

            {/* Parent Module Settings Button */}
            <button
              type="button"
              onClick={() => setIsParentSettingsOpen(true)}
              title="Eltern-Lernstudio: Altersstufe & Module einstellen"
              className="w-8 h-8 rounded-2xl bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 text-stone-600 dark:text-slate-300 border border-stone-200 dark:border-slate-700 flex items-center justify-center font-black transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-xl w-full mx-auto p-4 sm:p-6 space-y-8">
        
        {/* Kid Greeting Card */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border-2 border-stone-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-amber-200 dark:bg-amber-950 flex items-center justify-center text-3xl shadow-xs border-2 border-amber-300">
              {activeKid.avatar || '🦁'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-stone-900 dark:text-white">
                  Hallo {activeKid.name}!
                </h2>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-400 text-stone-900">
                  Level {progress.level}
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-slate-400 font-semibold">
                Bereit für dein nächstes Quiz-Abenteuer?
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[10px] uppercase font-black tracking-wider text-stone-400 block">
              Tagesziel
            </span>
            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
              1 Lektion 🎯
            </span>
          </div>
        </div>

        {/* Duolingo Winding Lesson Path */}
        <div className="relative py-4 flex flex-col items-center space-y-6">
          {lessonPath.map((node, index) => {
            // Alternating horizontal alignment for winding snake effect
            const offsetClasses = [
              'translate-x-0',
              '-translate-x-12 sm:-translate-x-16',
              'translate-x-12 sm:translate-x-16',
              '-translate-x-8 sm:-translate-x-10',
              'translate-x-8 sm:translate-x-10',
              'translate-x-0',
            ];
            const alignment = offsetClasses[index % offsetClasses.length];

            return (
              <div
                key={node.id}
                className={`relative flex flex-col items-center transition-transform ${alignment}`}
              >
                {/* Connector line to next node */}
                {index < lessonPath.length - 1 && (
                  <div className="absolute top-16 w-2 h-12 bg-stone-200 dark:bg-slate-800 -z-0 rounded-full" />
                )}

                {/* Level Node Button */}
                <button
                  type="button"
                  onClick={() => handleOpenLesson(node)}
                  disabled={node.isLocked}
                  className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex flex-col items-center justify-center text-3xl sm:text-4xl shadow-md border-b-6 transition-all z-10 ${
                    node.isLocked
                      ? 'bg-stone-200 dark:bg-slate-800 border-stone-300 dark:border-slate-700 opacity-60 cursor-not-allowed text-stone-400'
                      : node.isCompleted
                      ? 'bg-amber-400 border-amber-500 hover:scale-105 active:translate-y-1'
                      : `${node.colorClass} ${node.borderColorClass} text-white hover:scale-110 active:translate-y-1 animate-bounce-subtle`
                  }`}
                >
                  <span>{node.emoji}</span>

                  {/* Badges on node */}
                  {node.isCompleted && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white text-[11px] font-black">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}

                  {node.isLocked && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-stone-400 border-2 border-white flex items-center justify-center text-white text-[10px]">
                      <Lock className="w-3 h-3" />
                    </div>
                  )}
                </button>

                {/* Node Title Pill */}
                <div className="mt-2 text-center">
                  <span
                    className={`inline-block px-3 py-1 rounded-xl text-xs font-black tracking-wide border shadow-2xs ${
                      node.isLocked
                        ? 'bg-stone-100 dark:bg-slate-800/60 border-stone-200 dark:border-slate-700 text-stone-400'
                        : 'bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700 text-stone-800 dark:text-white'
                    }`}
                  >
                    {node.title}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mascot Encouragement Box */}
        <div className="p-4 rounded-3xl bg-linear-to-r from-emerald-500/10 via-amber-500/10 to-sky-500/10 border-2 border-emerald-200 dark:border-emerald-900/50 flex items-center gap-3">
          <span className="text-3xl">🦉</span>
          <div className="text-xs">
            <p className="font-black text-stone-800 dark:text-white">
              „Jeden Tag ein bisschen schlauer!“
            </p>
            <p className="text-stone-500 dark:text-slate-400">
              Spiele täglich eine Lektion, um deine Flammen-Serie nicht zu verlieren!
            </p>
          </div>
        </div>

      </main>

      {/* Interactive Micro-Lesson Player Modal */}
      {activeLesson && (
        <KidLessonPlayerModal
          isOpen={Boolean(activeLesson)}
          onClose={() => setActiveLesson(null)}
          lesson={activeLesson}
          memberId={activeKid.id}
          onLessonFinished={() => {
            setRefreshKey((k) => k + 1);
          }}
        />
      )}

      {/* Parental Controls / Modules Customizer Modal */}
      <KidParentSettingsModal
        isOpen={isParentSettingsOpen}
        onClose={() => setIsParentSettingsOpen(false)}
        memberId={activeKid.id}
        memberName={activeKid.name}
        onSettingsSaved={() => {
          setRefreshKey((k) => k + 1);
        }}
      />

    </div>
  );
};
