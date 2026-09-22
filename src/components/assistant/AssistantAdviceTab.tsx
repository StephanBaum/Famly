import React from 'react';
import { Brain, RefreshCw, Sparkles, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { DecisionResult } from '../../services/decisionService';

interface AssistantAdviceTabProps {
  customQuestion: string;
  setCustomQuestion: (q: string) => void;
  isDeciding: boolean;
  decisionResult: DecisionResult | null;
  handleRunDecision: (overrideQuestion?: string) => Promise<void>;
  familyMemories: any[];
  onSuccessNotice: (msg: string) => void;
}

export const AssistantAdviceTab: React.FC<AssistantAdviceTabProps> = ({
  customQuestion,
  setCustomQuestion,
  isDeciding,
  decisionResult,
  handleRunDecision,
  familyMemories,
  onSuccessNotice,
}) => {
  return (
    <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 scrollbar-thin">
      {/* Info Header */}
      <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 space-y-1.5">
        <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-black text-xs sm:text-sm">
          <Brain className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>Autonomer KI-Familienrat (Gemini 3+ Flash)</span>
        </div>
        <p className="text-xs text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
          Nennt einfach euer Dilemma: Die KI recherchiert passende Vorschläge, gleicht sie mit eurem Familien-Gedächtnis & Kalender ab und berechnet Vor- und Nachteile.
        </p>
      </div>

      {/* Quick Topic Chips */}
      <div className="space-y-1.5">
        <label className="block text-[11px] font-black uppercase text-stone-500 dark:text-slate-400">
          Schnelle Ideen / Häufige Familienfragen
        </label>
        <div className="flex flex-wrap gap-1.5">
          {[
            { label: '🌧️ Regentags-Plan', q: 'Was machen wir heute Nachmittag bei schlechtem Wetter / Regen mit den Kindern?' },
            { label: '🍿 Familienfilm für heute', q: 'Welchen Familienfilm können wir heute Abend schauen, der allen Spaß macht?' },
            { label: '🎯 Wochenend-Ausflug', q: 'Was ist ein schöner, stressfreier Familienausflug für das Wochenende?' },
            { label: '🍕 Schnelles Abendessen', q: 'Was kochen wir heute Abend schnell und unkompliziert für die ganze Familie?' },
            { label: '🧹 Aufgaben fair verteilen', q: 'Wie teilen wir die anstehenden Haushaltsaufgaben heute fair und motivierend auf?' },
          ].map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => handleRunDecision(chip.q)}
              className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-stone-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-slate-700 transition-colors shrink-0"
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Question Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleRunDecision();
        }}
        className="space-y-2 pt-1"
      >
        <label className="block text-xs font-black uppercase text-stone-500 dark:text-slate-400">
          Frage oder Dilemma an den Rat
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={customQuestion}
            onChange={(e) => setCustomQuestion(e.target.value)}
            placeholder="z.B. Welches Spiel spielen wir heute oder wohin geht der Sonntagsausflug?"
            className="flex-1 px-4 py-2.5 rounded-xl border border-stone-300 dark:border-slate-700 text-xs sm:text-sm font-bold bg-stone-50 dark:bg-slate-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500"
          />
          <button
            type="submit"
            disabled={!customQuestion.trim() || isDeciding}
            className="duo-btn duo-btn-amber px-4 py-2.5 text-xs font-black rounded-xl flex items-center gap-1.5 disabled:opacity-50 shrink-0"
          >
            {isDeciding ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>{isDeciding ? 'Berät...' : 'Rat einholen'}</span>
          </button>
        </div>
      </form>

      {/* Memory Indicator */}
      {familyMemories.length > 0 && (
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-stone-400 dark:text-slate-500 pt-0.5">
          <span className="text-amber-500">🧠</span>
          <span>Langzeit-Gedächtnis aktiv ({familyMemories.length} Familienfakten fließen in die Empfehlung ein)</span>
        </div>
      )}

      {/* Loading State */}
      {isDeciding && (
        <div className="text-center py-10 space-y-2">
          <div className="w-10 h-10 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 flex items-center justify-center text-xl font-black">
            <RefreshCw className="w-5 h-5 animate-spin" />
          </div>
          <h4 className="text-sm font-black text-stone-800 dark:text-slate-200">
            Der Familienrat berät sich...
          </h4>
          <p className="text-xs text-stone-500 dark:text-slate-400">
            Gemini 3+ Flash wiegt Möglichkeiten, Wetter, Zeiten und Vorlieben ab.
          </p>
        </div>
      )}

      {/* Decision Result Display */}
      {!isDeciding && decisionResult && (
        <div className="space-y-4 pt-2">
          {/* Winner Card */}
          <div className="p-4 sm:p-5 rounded-3xl bg-linear-to-br from-amber-50 via-orange-50 to-amber-100/60 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-amber-950/20 border-2 border-amber-300 dark:border-amber-700/60 shadow-xs space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-[11px] font-black uppercase text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                <span>🏆</span>
                <span>Empfehlung des Familienrats</span>
              </span>
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200">
                {decisionResult.winner.percentage}% Übereinstimmung
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-amber-950 dark:text-white">
                  {decisionResult.winner.title}
                </h3>
                {decisionResult.winner.badge && (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-slate-700">
                    {decisionResult.winner.badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-amber-900/80 dark:text-amber-200/80 mt-1 leading-relaxed">
                {decisionResult.summary}
              </p>
            </div>

            {/* Pros & Cons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
              {decisionResult.winner.pros && decisionResult.winner.pros.length > 0 && (
                <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/70 border border-amber-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400">
                    Vorteile:
                  </span>
                  <ul className="space-y-0.5 text-stone-700 dark:text-slate-300">
                    {decisionResult.winner.pros.map((pro, pIdx) => (
                      <li key={pIdx} className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{pro}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {decisionResult.winner.cons && decisionResult.winner.cons.length > 0 && (
                <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/70 border border-amber-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] font-black uppercase text-stone-500 dark:text-slate-400">
                    Zu bedenken:
                  </span>
                  <ul className="space-y-0.5 text-stone-600 dark:text-slate-400">
                    {decisionResult.winner.cons.map((con, cIdx) => (
                      <li key={cIdx} className="flex items-start gap-1.5">
                        <span className="text-stone-400 shrink-0">•</span>
                        <span>{con}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
                  onSuccessNotice(`Entscheidung "${decisionResult.winner.title}" angenommen! 🚀`);
                }}
                className="duo-btn duo-btn-amber px-4 py-2 text-xs font-black rounded-xl"
              >
                <span>Vorschlag annehmen</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
