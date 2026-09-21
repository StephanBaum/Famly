import React, { useState } from 'react';
import { useFamily } from '../context/FamilyContext';
import { FamilyMember } from '../types';
import { KidLessonNode, EducationalCategory } from '../types/kidsEducation';
import {
  getKidProgress,
  buildKidGameBubbles,
  KidProgressData,
} from '../services/kidsEducationService';
import { KidLessonPlayerModal } from '../components/kids/KidLessonPlayerModal';
import { KidParentSettingsModal } from '../components/kids/KidParentSettingsModal';
import {
  ArrowLeft,
  Settings,
  Flame,
  Star,
  Sparkles,
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

  // Learning progress & game bubbles
  const [refreshKey, setRefreshKey] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState<EducationalCategory | 'all'>('all');

  const progress: KidProgressData = React.useMemo(() => {
    return getKidProgress(activeKid.id);
  }, [activeKid.id, refreshKey]);

  const allBubbles: KidLessonNode[] = React.useMemo(() => {
    return buildKidGameBubbles(activeKid.id);
  }, [activeKid.id, refreshKey]);

  const visibleBubbles = React.useMemo(() => {
    if (categoryFilter === 'all') return allBubbles;
    return allBubbles.filter((b) => b.category === categoryFilter);
  }, [allBubbles, categoryFilter]);

  // Modal States
  const [activeLesson, setActiveLesson] = useState<KidLessonNode | null>(null);
  const [isParentSettingsOpen, setIsParentSettingsOpen] = useState(false);

  const handleOpenBubble = (bubble: KidLessonNode) => {
    triggerHaptic('success');
    setActiveLesson(bubble);
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-sky-100 via-amber-50 to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-stone-900 dark:text-white font-sans flex flex-col select-none">
      
      {/* Top App Bar */}
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
                    setRefreshKey((prev) => prev + 1);
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
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-2xl bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-black shadow-2xs">
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>{progress.streakDays || 1}</span>
            </div>

            <div className="flex items-center gap-1 px-2.5 py-1 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-black shadow-2xs">
              <Star className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500" />
              <span>{progress.xp} XP</span>
            </div>

            {/* Parent Settings Button */}
            <button
              type="button"
              onClick={() => setIsParentSettingsOpen(true)}
              title="Eltern-Lernstudio: Altersstufe & Themen einstellen"
              className="w-8 h-8 rounded-2xl bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 text-stone-600 dark:text-slate-300 border border-stone-200 dark:border-slate-700 flex items-center justify-center font-black transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* Main Playground Content */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-6 space-y-6">
        
        {/* Child Greeting & Mascot Banner */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border-2 border-stone-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-3xl bg-amber-200 dark:bg-amber-950 flex items-center justify-center text-3xl shadow-xs border-2 border-amber-300 animate-bounce-subtle shrink-0">
              {activeKid.avatar || '🦁'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-stone-900 dark:text-white">
                  Hallo {activeKid.name}!
                </h2>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-400 text-stone-900">
                  Level {progress.level}
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-slate-400 font-semibold">
                Tippe auf einen Spielkreis und gewinne neue Sterne! ⭐
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1 p-2 px-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 text-emerald-800 dark:text-emerald-300 text-xs font-black shrink-0">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <span>Alle Spiele offen</span>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 ${
              categoryFilter === 'all'
                ? 'bg-amber-400 text-stone-900 shadow-xs'
                : 'bg-white dark:bg-slate-800 text-stone-600 dark:text-slate-300 border border-stone-200 dark:border-slate-700'
            }`}
          >
            ✨ Alle Spiele
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter('animals')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 ${
              categoryFilter === 'animals'
                ? 'bg-emerald-500 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-stone-600 dark:text-slate-300 border border-stone-200 dark:border-slate-700'
            }`}
          >
            🦁 Tiere
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter('math')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 ${
              categoryFilter === 'math'
                ? 'bg-amber-400 text-stone-900 shadow-xs'
                : 'bg-white dark:bg-slate-800 text-stone-600 dark:text-slate-300 border border-stone-200 dark:border-slate-700'
            }`}
          >
            🍎 Zahlen
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter('nature')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 ${
              categoryFilter === 'nature'
                ? 'bg-sky-500 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-stone-600 dark:text-slate-300 border border-stone-200 dark:border-slate-700'
            }`}
          >
            🌿 Natur
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter('words')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 ${
              categoryFilter === 'words'
                ? 'bg-indigo-500 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-stone-600 dark:text-slate-300 border border-stone-200 dark:border-slate-700'
            }`}
          >
            🔤 Wörter
          </button>
        </div>

        {/* Playground Field: Vibrant Field of Circular Game Bubbles */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6 py-2">
          {visibleBubbles.map((bubble) => (
            <div
              key={bubble.id}
              className="flex flex-col items-center gap-2 group"
            >
              {/* The Big Circular Game Button */}
              <button
                type="button"
                onClick={() => handleOpenBubble(bubble)}
                className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full flex flex-col items-center justify-center text-4xl sm:text-5xl shadow-md border-b-6 transition-all hover:scale-110 active:translate-y-1.5 active:shadow-xs relative ${bubble.colorClass} ${bubble.borderColorClass}`}
              >
                <span className="transform transition-transform group-hover:rotate-6">
                  {bubble.emoji}
                </span>

                {/* Sparkling Star Badge */}
                <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-white dark:bg-slate-900 border-2 border-amber-400 flex items-center justify-center text-amber-500 text-xs shadow-xs font-black">
                  ⭐
                </div>
              </button>

              {/* Game Title Badge */}
              <span className="px-3 py-1 rounded-xl text-xs font-black bg-white dark:bg-slate-800 border-2 border-stone-200 dark:border-slate-700 text-stone-800 dark:text-white shadow-2xs group-hover:border-amber-400 transition-colors">
                {bubble.title}
              </span>
            </div>
          ))}
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
