import React, { useState } from 'react';
import { ModalPortal } from '../ModalPortal';
import {
  EducationalQuestion,
  KidLessonNode,
} from '../../types/kidsEducation';
import {
  getKidProgress,
  saveKidProgress,
  getQuestionsForLesson,
} from '../../services/kidsEducationService';
import confetti from 'canvas-confetti';
import { triggerHaptic } from '../../utils/haptics';
import { X, Check, ArrowRight, Sparkles } from 'lucide-react';

interface KidLessonPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  lesson: KidLessonNode;
  memberId: string;
  onLessonFinished: () => void;
}

export const KidLessonPlayerModal: React.FC<KidLessonPlayerModalProps> = ({
  isOpen,
  onClose,
  lesson,
  memberId,
  onLessonFinished,
}) => {
  // Always load 4 questions for this round
  const questions: EducationalQuestion[] = React.useMemo(() => {
    return getQuestionsForLesson(memberId, lesson.category);
  }, [memberId, lesson]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Interactive Counting State (child can tap individual items on screen!)
  const [tappedItemIndices, setTappedItemIndices] = useState<Set<number>>(new Set());

  if (!isOpen) return null;

  const currentQ = questions[currentIndex] || questions[0];

  // Split visualPrompt into individual items if space-separated
  const visualItems = currentQ?.visualPrompt
    ? currentQ.visualPrompt.split(/\s+/).filter(Boolean)
    : [];

  const handleTapVisualItem = (index: number) => {
    triggerHaptic('light');
    setTappedItemIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleSelectOption = (idx: number) => {
    if (isAnswerChecked) return;
    setSelectedOption(idx);
    triggerHaptic('light');
  };

  const handleCheckAnswer = () => {
    if (selectedOption === null || !currentQ) return;

    const correct = selectedOption === currentQ.correctIndex;
    setIsCorrect(correct);
    setIsAnswerChecked(true);

    if (correct) {
      triggerHaptic('success');
      confetti({
        particleCount: 70,
        spread: 80,
        origin: { y: 0.6 },
      });
    } else {
      triggerHaptic('medium');
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerChecked(false);
      setIsCorrect(false);
      setTappedItemIndices(new Set());
    } else {
      // Lesson finished!
      setIsCompleted(true);
      triggerHaptic('celebration');
      confetti({
        particleCount: 120,
        spread: 100,
        origin: { y: 0.5 },
      });

      // Update XP & Progress
      const progress = getKidProgress(memberId);
      const newXp = progress.xp + lesson.xpReward;
      const newLevel = Math.floor(newXp / 50) + 1;
      const newCompletedIds = Array.from(
        new Set([...progress.completedQuestionIds, ...questions.map((q) => q.id)])
      );

      saveKidProgress(memberId, {
        ...progress,
        xp: newXp,
        level: newLevel,
        completedQuestionIds: newCompletedIds,
        lastPlayedDate: new Date().toISOString().split('T')[0],
      });

      onLessonFinished();
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in">
        <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border-4 border-amber-300 dark:border-amber-700 animate-in zoom-in-95 my-auto text-stone-900 dark:text-slate-100 flex flex-col overflow-hidden relative">
          
          {/* Header */}
          <div className="p-3.5 sm:p-4 border-b border-stone-100 dark:border-slate-800 flex items-center justify-between bg-stone-50/80 dark:bg-slate-800/40">
            <div className="flex items-center gap-2">
              <span className="text-3xl animate-bounce-subtle">{lesson.emoji}</span>
              <div>
                <h3 className="text-base font-black text-stone-900 dark:text-white">
                  {lesson.title}
                </h3>
                {!isCompleted && (
                  <div className="flex items-center gap-1.5 pt-0.5">
                    {questions.map((_, qIdx) => (
                      <div
                        key={qIdx}
                        className={`w-3 h-3 rounded-full transition-all ${
                          qIdx < currentIndex
                            ? 'bg-emerald-500 scale-105'
                            : qIdx === currentIndex
                            ? 'bg-amber-400 scale-125'
                            : 'bg-stone-200 dark:bg-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 text-stone-500 flex items-center justify-center font-black transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-5 space-y-4">
            {!isCompleted ? (
              <>
                {/* Big Question Prompt (Short & Visual) */}
                <div className="text-center space-y-2">
                  <h2 className="text-lg sm:text-xl font-black text-stone-900 dark:text-white">
                    {currentQ.question}
                  </h2>

                  {/* Interactive Tappable Item Playground */}
                  {visualItems.length > 0 && (
                    <div className="py-2">
                      <div className="flex flex-wrap items-center justify-center gap-2 p-3 bg-amber-50/70 dark:bg-amber-950/30 rounded-2xl border-2 border-dashed border-amber-300">
                        {visualItems.map((item, itemIdx) => {
                          const isTapped = tappedItemIndices.has(itemIdx);
                          return (
                            <button
                              key={itemIdx}
                              type="button"
                              onClick={() => handleTapVisualItem(itemIdx)}
                              className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-all select-none ${
                                isTapped
                                  ? 'bg-amber-300 scale-110 shadow-sm ring-2 ring-amber-500'
                                  : 'bg-white dark:bg-slate-800 hover:scale-105 shadow-2xs'
                              }`}
                            >
                              <span>{item}</span>
                            </button>
                          );
                        })}
                      </div>

                      {tappedItemIndices.size > 0 && (
                        <span className="text-[11px] font-black text-amber-800 dark:text-amber-300 mt-1 inline-block">
                          Getippt: {tappedItemIndices.size} gezählt! ⭐
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Big Tactile Choice Buttons (Low text, high visual punch) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {currentQ.options.map((option, idx) => {
                    const isSelected = selectedOption === idx;
                    let btnClass = 'bg-stone-50 dark:bg-slate-800 border-2 border-b-4 border-stone-200 dark:border-slate-700 text-stone-800 dark:text-white hover:border-amber-400';

                    if (isAnswerChecked) {
                      if (idx === currentQ.correctIndex) {
                        btnClass = 'bg-emerald-500 border-emerald-600 border-b-4 text-white scale-[1.02] shadow-sm';
                      } else if (isSelected && !isCorrect) {
                        btnClass = 'bg-rose-500 border-rose-600 border-b-4 text-white animate-shake';
                      } else {
                        btnClass = 'opacity-30 bg-stone-100 border-transparent';
                      }
                    } else if (isSelected) {
                      btnClass = 'bg-[#FFC800] border-[#E5A500] border-b-4 text-[#262010] scale-[1.03] shadow-md ring-2 ring-amber-400';
                    }

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectOption(idx)}
                        disabled={isAnswerChecked && isCorrect}
                        className={`p-4 rounded-2xl text-base sm:text-lg font-black flex items-center justify-center gap-2 transition-all active:translate-y-1 select-none ${btnClass}`}
                      >
                        <span className={isSelected && !isAnswerChecked ? '!text-[#262010]' : ''}>{option}</span>
                        {isAnswerChecked && idx === currentQ.correctIndex && (
                          <Check className="w-5 h-5 text-white stroke-[3]" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Animated Mascot Fact Card (Short & Fun) */}
                {isAnswerChecked && (
                  <div
                    className={`p-3.5 rounded-2xl border-2 flex items-center gap-3 animate-in fade-in ${
                      isCorrect
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-950 dark:text-emerald-200'
                        : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 text-amber-950 dark:text-amber-200'
                    }`}
                  >
                    <span className="text-3xl shrink-0">{isCorrect ? '🥳' : '💡'}</span>
                    <div className="text-xs">
                      <p className="font-black">
                        {isCorrect ? 'Super gelöst!' : 'Tipp:'}
                      </p>
                      <p className="font-medium text-stone-700 dark:text-slate-200">
                        {currentQ.funFact}
                      </p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Round Finished Celebration Card */
              <div className="text-center py-6 space-y-4">
                <div className="w-20 h-20 rounded-3xl bg-amber-400 text-white mx-auto flex items-center justify-center text-5xl shadow-md animate-bounce">
                  ⭐
                </div>
                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-stone-900 dark:text-white">
                    Super geschafft!
                  </h2>
                  <p className="text-xs font-semibold text-stone-500 dark:text-slate-400">
                    Du hast alle 4 Fragen dieser Runde gemeistert!
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 p-3 px-5 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 border-2 border-emerald-300 text-emerald-900 dark:text-emerald-200 text-sm font-black">
                  <Sparkles className="w-5 h-5 text-emerald-600" />
                  <span>+{lesson.xpReward} XP Wissens-Punkte gesammelt!</span>
                </div>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="p-3.5 sm:p-4 bg-stone-50 dark:bg-slate-800/40 border-t border-stone-100 dark:border-slate-800 flex justify-end">
            {!isCompleted ? (
              !isAnswerChecked ? (
                <button
                  type="button"
                  onClick={handleCheckAnswer}
                  disabled={selectedOption === null}
                  className="w-full duo-btn duo-btn-green py-3.5 rounded-2xl text-sm font-black flex items-center justify-center gap-2 disabled:opacity-40 shadow-xs"
                >
                  <span>Prüfen</span>
                  <Check className="w-4 h-4 stroke-[3]" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full duo-btn duo-btn-amber py-3.5 rounded-2xl text-sm font-black flex items-center justify-center gap-2 shadow-xs"
                >
                  <span>{currentIndex < questions.length - 1 ? 'Nächste Frage' : 'Runde beenden'}</span>
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </button>
              )
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="w-full duo-btn duo-btn-green py-3.5 rounded-2xl text-sm font-black flex items-center justify-center gap-2 shadow-xs"
              >
                <span>Zurück zu den Spielen</span>
                <Check className="w-4 h-4 stroke-[3]" />
              </button>
            )}
          </div>

        </div>
      </div>
    </ModalPortal>
  );
};
