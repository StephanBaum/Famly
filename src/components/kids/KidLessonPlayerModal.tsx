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
import { X, Check, ArrowRight, Sparkles, Lightbulb } from 'lucide-react';

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
  const questions: EducationalQuestion[] = React.useMemo(() => {
    const pool = getQuestionsForLesson(memberId, lesson.category);
    return pool.slice(0, 3);
  }, [memberId, lesson]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  if (!isOpen) return null;

  const currentQ = questions[currentIndex];

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
        particleCount: 60,
        spread: 70,
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
    } else {
      // Lesson finished!
      setIsCompleted(true);
      triggerHaptic('celebration');
      confetti({
        particleCount: 100,
        spread: 90,
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
      <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in">
        <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border-4 border-amber-300 dark:border-amber-700 animate-in zoom-in-95 my-auto text-stone-900 dark:text-slate-100 flex flex-col overflow-hidden relative">
          
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-stone-100 dark:border-slate-800 flex items-center justify-between bg-stone-50/80 dark:bg-slate-800/40">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{lesson.emoji}</span>
              <div>
                <h3 className="text-sm sm:text-base font-black text-stone-900 dark:text-white">
                  {lesson.title}
                </h3>
                {!isCompleted && (
                  <span className="text-[11px] font-bold text-stone-400">
                    Frage {currentIndex + 1} von {questions.length}
                  </span>
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
          <div className="p-5 sm:p-6 space-y-5">
            {!isCompleted ? (
              <>
                {/* Progress Bar */}
                <div className="w-full bg-stone-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${((currentIndex + (isAnswerChecked && isCorrect ? 1 : 0)) / questions.length) * 100}%`,
                    }}
                  />
                </div>

                {/* Visual Prompt / Emoji */}
                <div className="text-center py-2 space-y-2">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-amber-100 dark:bg-amber-950/60 mx-auto flex items-center justify-center text-3xl sm:text-4xl shadow-xs border-2 border-amber-300">
                    {currentQ.emoji}
                  </div>
                  {currentQ.visualPrompt && (
                    <div className="text-2xl sm:text-3xl font-black tracking-widest py-1 animate-bounce">
                      {currentQ.visualPrompt}
                    </div>
                  )}
                  <h2 className="text-base sm:text-lg font-black text-stone-900 dark:text-white leading-snug">
                    {currentQ.question}
                  </h2>
                </div>

                {/* Multiple Choice Options */}
                <div className="space-y-2.5">
                  {currentQ.options.map((option, idx) => {
                    const isSelected = selectedOption === idx;
                    let btnStyle = 'duo-btn duo-btn-white border-2 border-stone-200 dark:border-slate-700';

                    if (isAnswerChecked) {
                      if (idx === currentQ.correctIndex) {
                        btnStyle = 'duo-btn duo-btn-green border-2 border-emerald-500 text-white';
                      } else if (isSelected && !isCorrect) {
                        btnStyle = 'duo-btn duo-btn-rose border-2 border-rose-500 text-white animate-shake';
                      } else {
                        btnStyle = 'opacity-40 duo-btn duo-btn-white';
                      }
                    } else if (isSelected) {
                      btnStyle = 'duo-btn duo-btn-amber border-2 border-amber-500 text-white scale-[1.02]';
                    }

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectOption(idx)}
                        disabled={isAnswerChecked && isCorrect}
                        className={`w-full p-3.5 sm:p-4 rounded-2xl text-sm sm:text-base font-black text-left flex items-center justify-between transition-all ${btnStyle}`}
                      >
                        <span>{option}</span>
                        {isAnswerChecked && idx === currentQ.correctIndex && (
                          <Check className="w-5 h-5 text-white stroke-[3]" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Fun Fact Card (shown once answered) */}
                {isAnswerChecked && (
                  <div
                    className={`p-4 rounded-2xl border text-xs sm:text-sm space-y-1 animate-in fade-in ${
                      isCorrect
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-950 dark:text-emerald-200'
                        : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 text-amber-950 dark:text-amber-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-black">
                      <Lightbulb className="w-4 h-4 text-amber-500" />
                      <span>{isCorrect ? '🎉 Klasse gemacht! Wusstest du schon?' : '💡 Fast! Wusstest du schon?'}</span>
                    </div>
                    <p className="leading-relaxed font-medium">
                      {currentQ.funFact}
                    </p>
                  </div>
                )}
              </>
            ) : (
              /* Completion Screen */
              <div className="text-center py-6 space-y-4">
                <div className="w-20 h-20 rounded-3xl bg-amber-400 text-white mx-auto flex items-center justify-center text-4xl shadow-md animate-bounce">
                  🏆
                </div>
                <div className="space-y-1">
                  <h2 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white">
                    Lektion gemeistert!
                  </h2>
                  <p className="text-xs sm:text-sm font-semibold text-stone-500 dark:text-slate-400">
                    Du hast alle Fragen super beantwortet!
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 p-3 px-5 rounded-2xl bg-amber-100 dark:bg-amber-950/60 border-2 border-amber-300 text-amber-900 dark:text-amber-200 text-sm font-black">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                  <span>+{lesson.xpReward} XP Wissens-Punkte verdient!</span>
                </div>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="p-4 sm:p-5 bg-stone-50 dark:bg-slate-800/40 border-t border-stone-100 dark:border-slate-800 flex justify-end">
            {!isCompleted ? (
              !isAnswerChecked ? (
                <button
                  type="button"
                  onClick={handleCheckAnswer}
                  disabled={selectedOption === null}
                  className="w-full duo-btn duo-btn-green py-3 rounded-2xl text-sm font-black flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  <span>Prüfen</span>
                  <Check className="w-4 h-4 stroke-[3]" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full duo-btn duo-btn-amber py-3 rounded-2xl text-sm font-black flex items-center justify-center gap-2"
                >
                  <span>{currentIndex < questions.length - 1 ? 'Nächste Frage' : 'Lektion abschließen'}</span>
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </button>
              )
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="w-full duo-btn duo-btn-green py-3 rounded-2xl text-sm font-black flex items-center justify-center gap-2"
              >
                <span>Zurück zum Lernpfad</span>
                <Check className="w-4 h-4 stroke-[3]" />
              </button>
            )}
          </div>

        </div>
      </div>
    </ModalPortal>
  );
};
