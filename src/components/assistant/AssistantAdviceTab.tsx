import React, { useState } from 'react';
import { Brain, RefreshCw, Sparkles, Check, MapPin, Calendar, Clock, DollarSign, Home } from 'lucide-react';
import confetti from 'canvas-confetti';
import { DecisionResult, DecisionOption } from '../../services/decisionService';

interface AssistantAdviceTabProps {
  customQuestion: string;
  setCustomQuestion: (q: string) => void;
  isDeciding: boolean;
  decisionResult: DecisionResult | null;
  handleRunDecision: (overrideQuestion?: string) => Promise<void>;
  familyMemories: any[];
  onSuccessNotice: (msg: string) => void;
  familyRegion?: string;
  onUpdateRegion?: (region: string) => void;
  onSelectOption?: (option: DecisionOption, question: string) => void;
}

export const AssistantAdviceTab: React.FC<AssistantAdviceTabProps> = ({
  customQuestion,
  setCustomQuestion,
  isDeciding,
  decisionResult,
  handleRunDecision,
  familyMemories,
  onSuccessNotice,
  familyRegion = 'München & Umland',
  onUpdateRegion,
  onSelectOption,
}) => {
  const [localRegion, setLocalRegion] = useState(familyRegion);

  const handleRegionChange = (val: string) => {
    setLocalRegion(val);
    onUpdateRegion?.(val);
  };

  const handleChooseOption = (option: DecisionOption) => {
    confetti({ particleCount: 65, spread: 70, origin: { y: 0.6 } });
    if (onSelectOption) {
      onSelectOption(option, decisionResult?.question || customQuestion);
    } else {
      onSuccessNotice(`✓ Ausflug "${option.title}" für die Familie ausgewählt! 📅`);
    }
  };

  return (
    <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 scrollbar-thin">
      {/* Info Header */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/40 border border-amber-300/70 dark:border-amber-900/60 space-y-1">
        <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-black text-xs sm:text-sm">
          <Brain className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>Autonomer KI-Familienrat (Gemini 3+ Flash & Google Search)</span>
        </div>
        <p className="text-xs text-amber-900/80 dark:text-amber-300/80 leading-relaxed font-medium">
          Nennt euer Anliegen: Die KI recherchiert echte regionale Highlights, gleicht sie mit euren Familieninteressen ab und präsentiert euch 3 abwechslungsreiche Top-Optionen zum Vergleichen.
        </p>
      </div>

      {/* Region / Location Selector Pill */}
      <div className="flex items-center justify-between gap-2 p-2.5 px-3 rounded-2xl bg-stone-100 dark:bg-slate-800/80 border border-stone-200 dark:border-slate-700 text-xs">
        <div className="flex items-center gap-1.5 min-w-0">
          <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="font-bold text-stone-800 dark:text-slate-200">Eure Region / Stadt:</span>
        </div>
        <input
          type="text"
          value={localRegion}
          onChange={(e) => handleRegionChange(e.target.value)}
          placeholder="z.B. München & Umland, Hamburg..."
          className="px-3 py-1 rounded-xl border border-stone-300 dark:border-slate-700 text-xs font-bold bg-white dark:bg-slate-900 text-stone-900 dark:text-white max-w-[210px] focus:ring-2 focus:ring-amber-500"
        />
      </div>

      {/* Quick Topic Chips */}
      <div className="space-y-1.5">
        <label className="block text-[11px] font-black uppercase text-stone-500 dark:text-slate-400">
          Häufige Familienfragen
        </label>
        <div className="flex flex-wrap gap-1.5">
          {[
            { label: '🌧️ Regentags-Plan', q: 'Was machen wir am Wochenende bei Regen / schlechtem Wetter mit der Familie?' },
            { label: '🎯 Wochenend-Ausflug', q: 'Was ist ein schöner, erlebnisreicher Familienausflug für das kommende Wochenende?' },
            { label: '🍿 Familienfilm für heute', q: 'Welchen Familienfilm können wir heute Abend schauen, der allen Spaß macht?' },
            { label: '⚡ Indoor-Action', q: 'Welche Indoor-Erlebniswelt oder Hallenaktivität passt am besten zu unseren Kindern?' },
            { label: '🍕 Schnelles Abendessen', q: 'Was kochen wir heute Abend schnell und lecker für die ganze Familie?' },
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
            placeholder="z.B. Was machen wir am Wochenende falls es regnet?"
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
            <span>{isDeciding ? 'Recherchiert...' : 'Rat einholen'}</span>
          </button>
        </div>
      </form>

      {/* Memory Indicator */}
      {familyMemories.length > 0 && (
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-stone-400 dark:text-slate-500 pt-0.5">
          <span className="text-amber-500">🧠</span>
          <span>Familieninteressen & Langzeit-Gedächtnis fließen in die Vorschläge ein</span>
        </div>
      )}

      {/* Loading State */}
      {isDeciding && (
        <div className="text-center py-10 space-y-2">
          <div className="w-10 h-10 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 flex items-center justify-center text-xl font-black">
            <RefreshCw className="w-5 h-5 animate-spin" />
          </div>
          <h4 className="text-sm font-black text-stone-800 dark:text-slate-200">
            Der Familienrat recherchiert für {localRegion}...
          </h4>
          <p className="text-xs text-stone-500 dark:text-slate-400">
            Gemini 3+ Flash wiegt regionale Angebote, Wetter und gemeinsame Familien-Interessen ab.
          </p>
        </div>
      )}

      {/* Decision Result Display: Comparison of all 3 options */}
      {!isDeciding && decisionResult && (
        <div className="space-y-4 pt-2 animate-in fade-in duration-300">
          {/* Header Summary */}
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50">
            <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
              <span className="text-xs font-black uppercase text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                <span>🏆</span>
                <span>Die 3 besten Ideen im direkten Vergleich:</span>
              </span>
            </div>
            <p className="text-xs font-medium text-stone-800 dark:text-slate-200 leading-relaxed">
              {decisionResult.summary}
            </p>
          </div>

          {/* Cards List for all 3 Options */}
          <div className="space-y-3">
            {decisionResult.options.map((option, idx) => {
              const isWinner = option.id === decisionResult.winner.id || idx === 0;

              return (
                <div
                  key={option.id}
                  className={`p-4 sm:p-5 rounded-3xl border-2 transition-all space-y-3 ${
                    isWinner
                      ? 'bg-linear-to-br from-amber-50/90 via-orange-50/60 to-amber-100/50 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-amber-950/20 border-amber-300 dark:border-amber-600/70 shadow-sm ring-2 ring-amber-400/20'
                      : 'bg-white dark:bg-slate-800/80 border-stone-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-700/50'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                          isWinner
                            ? 'bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200'
                            : 'bg-stone-100 dark:bg-slate-700 text-stone-700 dark:text-slate-300'
                        }`}
                      >
                        {isWinner ? '🏆 Top-Empfehlung' : `💡 Option ${idx + 1}`}
                      </span>

                      {option.badge && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white dark:bg-slate-900 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-slate-700">
                          {option.badge}
                        </span>
                      )}
                    </div>

                    <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                      {option.percentage}% Übereinstimmung
                    </span>
                  </div>

                  {/* Title & Metadata */}
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-stone-900 dark:text-white">
                      {option.title}
                    </h3>

                    {/* Metadata tags */}
                    <div className="flex items-center gap-3 flex-wrap mt-1 text-[11px] font-bold text-stone-500 dark:text-slate-400">
                      {option.duration && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{option.duration}</span>
                        </span>
                      )}
                      {option.estimatedCost && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>{option.estimatedCost}</span>
                        </span>
                      )}
                      {typeof option.isIndoor === 'boolean' && (
                        <span className="flex items-center gap-1">
                          <Home className="w-3.5 h-3.5" />
                          <span>{option.isIndoor ? 'Wetterfest / Drinnen' : 'Outdoor / Frische Luft'}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Why it matches common family interests */}
                  {option.fitReason && (
                    <div className="p-2.5 rounded-xl bg-amber-500/10 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs">
                      <span className="font-black text-amber-900 dark:text-amber-200">
                        💡 Passt zu euren Interessen:{' '}
                      </span>
                      <span className="text-stone-700 dark:text-slate-300 font-medium">
                        {option.fitReason}
                      </span>
                    </div>
                  )}

                  {/* Pros & Cons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5 text-xs">
                    {option.pros && option.pros.length > 0 && (
                      <div className="p-2.5 rounded-xl bg-white/90 dark:bg-slate-900/70 border border-stone-200 dark:border-slate-800 space-y-1">
                        <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400">
                          Vorteile:
                        </span>
                        <ul className="space-y-0.5 text-stone-700 dark:text-slate-300">
                          {option.pros.map((pro, pIdx) => (
                            <li key={pIdx} className="flex items-start gap-1.5">
                              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                              <span>{pro}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {option.cons && option.cons.length > 0 && (
                      <div className="p-2.5 rounded-xl bg-white/90 dark:bg-slate-900/70 border border-stone-200 dark:border-slate-800 space-y-1">
                        <span className="text-[10px] font-black uppercase text-stone-500 dark:text-slate-400">
                          Zu bedenken:
                        </span>
                        <ul className="space-y-0.5 text-stone-600 dark:text-slate-400">
                          {option.cons.map((con, cIdx) => (
                            <li key={cIdx} className="flex items-start gap-1.5">
                              <span className="text-stone-400 shrink-0">•</span>
                              <span>{con}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Action Button: Choose this plan */}
                  <div className="pt-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleChooseOption(option)}
                      className={`duo-btn px-4 py-2 text-xs font-black rounded-xl flex items-center gap-1.5 ${
                        isWinner ? 'duo-btn-amber' : 'duo-btn-white'
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{isWinner ? '✨ Diesen Plan wählen & eintragen' : 'Diesen Plan wählen'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
