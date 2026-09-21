import React, { useState } from 'react';
import { ModalPortal } from '../ModalPortal';
import {
  KidAgeGroup,
  EducationalCategory,
  EducationalQuestion,
  KidModuleSettings,
} from '../../types/kidsEducation';
import {
  getKidModuleSettings,
  saveKidModuleSettings,
} from '../../services/kidsEducationService';
import { X, ShieldCheck, Check, Plus, Trash2 } from 'lucide-react';

interface KidParentSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberId: string;
  memberName: string;
  onSettingsSaved: () => void;
}

export const KidParentSettingsModal: React.FC<KidParentSettingsModalProps> = ({
  isOpen,
  onClose,
  memberId,
  memberName,
  onSettingsSaved,
}) => {
  const [settings, setSettings] = useState<KidModuleSettings>(() =>
    getKidModuleSettings(memberId)
  );

  // Form for custom question
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customCategory, setCustomCategory] = useState<EducationalCategory>('animals');
  const [customQuestionText, setCustomQuestionText] = useState('');
  const [customOption1, setCustomOption1] = useState('');
  const [customOption2, setCustomOption2] = useState('');
  const [customOption3, setCustomOption3] = useState('');
  const [customCorrectIndex, setCustomCorrectIndex] = useState(0);
  const [customFunFact, setCustomFunFact] = useState('');
  const [savedNotice, setSavedNotice] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    saveKidModuleSettings(memberId, settings);
    setSavedNotice(true);
    onSettingsSaved();
    setTimeout(() => {
      setSavedNotice(false);
      onClose();
    }, 1200);
  };

  const handleToggleCategory = (cat: EducationalCategory) => {
    setSettings((prev) => {
      const active = prev.activeCategories.includes(cat)
        ? prev.activeCategories.filter((c) => c !== cat)
        : [...prev.activeCategories, cat];
      return { ...prev, activeCategories: active.length > 0 ? active : [cat] };
    });
  };

  const handleAddCustomQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuestionText.trim() || !customOption1.trim() || !customOption2.trim()) return;

    const options = [customOption1.trim(), customOption2.trim()];
    if (customOption3.trim()) options.push(customOption3.trim());

    const newQ: EducationalQuestion = {
      id: `custom_${Date.now()}`,
      category: customCategory,
      ageGroup: settings.ageGroup,
      emoji: '⭐',
      question: customQuestionText.trim(),
      options,
      correctIndex: customCorrectIndex,
      funFact: customFunFact.trim() || 'Super gewusst!',
      isCustom: true,
    };

    setSettings((prev) => ({
      ...prev,
      customQuestions: [...prev.customQuestions, newQ],
    }));

    setCustomQuestionText('');
    setCustomOption1('');
    setCustomOption2('');
    setCustomOption3('');
    setCustomFunFact('');
    setShowAddCustom(false);
  };

  const handleDeleteCustomQuestion = (id: string) => {
    setSettings((prev) => ({
      ...prev,
      customQuestions: prev.customQuestions.filter((q) => q.id !== id),
    }));
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in">
        <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border-2 border-stone-200 dark:border-slate-800 animate-in zoom-in-95 my-auto text-stone-900 dark:text-slate-100 flex flex-col overflow-hidden max-h-[90vh]">
          
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-stone-100 dark:border-slate-800 flex items-center justify-between bg-stone-50 dark:bg-slate-800/60 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-black">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black">
                  Eltern-Lernstudio: {memberName}
                </h3>
                <p className="text-xs text-stone-400 font-semibold">
                  Altersstufe & Lern-Themen anpassen
                </p>
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

          {/* Body */}
          <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1 scrollbar-thin">
            {/* Age Group Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-wider text-stone-400">
                Altersstufe für {memberName}
              </label>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'ages_3_5', label: '3–5 Jahre', sub: 'Zählen & Tiere', emoji: '🐣' },
                  { key: 'ages_6_8', label: '6–8 Jahre', sub: 'Rechnen & Fakten', emoji: '🦊' },
                  { key: 'ages_9_12', label: '9–12 Jahre', sub: 'Mathe & Wissen', emoji: '🦉' },
                ].map((tier) => (
                  <button
                    key={tier.key}
                    type="button"
                    onClick={() =>
                      setSettings((prev) => ({ ...prev, ageGroup: tier.key as KidAgeGroup }))
                    }
                    className={`p-3 rounded-2xl border-2 text-center transition-all flex flex-col items-center gap-1 ${
                      settings.ageGroup === tier.key
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200 shadow-xs'
                        : 'border-stone-200 dark:border-slate-700 bg-stone-50/50 dark:bg-slate-800/40 text-stone-600 dark:text-slate-300'
                    }`}
                  >
                    <span className="text-2xl">{tier.emoji}</span>
                    <span className="text-xs font-black">{tier.label}</span>
                    <span className="text-[10px] text-stone-400">{tier.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Category Toggles */}
            <div className="space-y-2.5">
              <label className="block text-xs font-black uppercase tracking-wider text-stone-400">
                Aktive Lern-Themen
              </label>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { cat: 'animals', label: 'Tier-Wissen & Fakten', emoji: '🦁' },
                  { cat: 'math', label: 'Zahlen & Rechnen', emoji: '🔢' },
                  { cat: 'nature', label: 'Natur & Welt', emoji: '🌿' },
                  { cat: 'words', label: 'Wörter & Buchstaben', emoji: '🔤' },
                ].map((item) => {
                  const isActive = settings.activeCategories.includes(item.cat as EducationalCategory);
                  return (
                    <button
                      key={item.cat}
                      type="button"
                      onClick={() => handleToggleCategory(item.cat as EducationalCategory)}
                      className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                        isActive
                          ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 font-black'
                          : 'border-stone-200 dark:border-slate-800 text-stone-400 dark:text-slate-500 font-bold opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{item.emoji}</span>
                        <span className="text-xs">{item.label}</span>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                          isActive ? 'bg-emerald-500 text-white' : 'bg-stone-200'
                        }`}
                      >
                        {isActive && '✓'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Questions Section */}
            <div className="space-y-3 pt-2 border-t border-stone-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-stone-400">
                    Eigene Familien-Fragen ({settings.customQuestions.length})
                  </h4>
                  <p className="text-[11px] text-stone-500">
                    z. B. Name des Haustiers, Wohnort oder eigene Quizfragen.
                  </p>
                </div>

                {!showAddCustom && (
                  <button
                    type="button"
                    onClick={() => setShowAddCustom(true)}
                    className="duo-btn duo-btn-white px-2.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 text-emerald-600"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Frage hinzufügen</span>
                  </button>
                )}
              </div>

              {/* Add Custom Question Form */}
              {showAddCustom && (
                <form
                  onSubmit={handleAddCustomQuestion}
                  className="p-3.5 rounded-2xl bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 space-y-2.5 animate-in fade-in"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black">Neue Quiz-Frage formulieren:</span>
                    <button
                      type="button"
                      onClick={() => setShowAddCustom(false)}
                      className="text-[11px] font-bold text-stone-400 hover:text-stone-600"
                    >
                      Abbrechen
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-[11px] font-bold text-stone-400">Thema:</label>
                    <select
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value as EducationalCategory)}
                      className="px-2 py-1 rounded-lg text-xs bg-white dark:bg-slate-900 border border-stone-300 dark:border-slate-700 text-stone-900 dark:text-white"
                    >
                      <option value="animals">🦁 Tier-Wissen</option>
                      <option value="math">🔢 Zahlen & Rechnen</option>
                      <option value="nature">🌿 Natur & Welt</option>
                      <option value="words">🔤 Wörter & Buchstaben</option>
                    </select>
                  </div>

                  <input
                    type="text"
                    required
                    placeholder="z. B. Wie heißt unsere Katze?"
                    value={customQuestionText}
                    onChange={(e) => setCustomQuestionText(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-stone-300 dark:border-slate-700 text-stone-900 dark:text-white"
                  />

                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-stone-400">Antwortoptionen (richtige markieren):</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="correctOpt"
                        checked={customCorrectIndex === 0}
                        onChange={() => setCustomCorrectIndex(0)}
                      />
                      <input
                        type="text"
                        required
                        placeholder="Option 1 (z. B. Luna)"
                        value={customOption1}
                        onChange={(e) => setCustomOption1(e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-900 border border-stone-300 dark:border-slate-700"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="correctOpt"
                        checked={customCorrectIndex === 1}
                        onChange={() => setCustomCorrectIndex(1)}
                      />
                      <input
                        type="text"
                        required
                        placeholder="Option 2 (z. B. Bella)"
                        value={customOption2}
                        onChange={(e) => setCustomOption2(e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-900 border border-stone-300 dark:border-slate-700"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="correctOpt"
                        checked={customCorrectIndex === 2}
                        onChange={() => setCustomCorrectIndex(2)}
                      />
                      <input
                        type="text"
                        placeholder="Option 3 (optional, z. B. Felix)"
                        value={customOption3}
                        onChange={(e) => setCustomOption3(e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-900 border border-stone-300 dark:border-slate-700"
                      />
                    </div>
                  </div>

                  <input
                    type="text"
                    placeholder="Wissens-Fakt / Erklärung (z. B. Luna ist eine Tigerkatze!)"
                    value={customFunFact}
                    onChange={(e) => setCustomFunFact(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-900 border border-stone-300 dark:border-slate-700"
                  />

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      className="duo-btn duo-btn-green px-3 py-1.5 text-xs font-black rounded-xl"
                    >
                      Speichern
                    </button>
                  </div>
                </form>
              )}

              {/* Custom Questions List */}
              {settings.customQuestions.length > 0 && (
                <div className="space-y-1.5">
                  {settings.customQuestions.map((q) => (
                    <div
                      key={q.id}
                      className="p-2.5 px-3 rounded-xl bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 flex items-center justify-between text-xs"
                    >
                      <span className="font-bold text-stone-800 dark:text-slate-200 truncate pr-2">
                        {q.question}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteCustomQuestion(q.id)}
                        className="text-stone-400 hover:text-rose-500 p-1 shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 sm:p-5 bg-stone-50 dark:bg-slate-800/60 border-t border-stone-100 dark:border-slate-800 flex items-center justify-between shrink-0">
            {savedNotice ? (
              <span className="text-xs font-black text-emerald-600 flex items-center gap-1 animate-in fade-in">
                <Check className="w-4 h-4 stroke-[3]" />
                Lernprofil gespeichert!
              </span>
            ) : (
              <span className="text-xs text-stone-400 font-semibold">
                Änderungen gelten sofort für {memberName}
              </span>
            )}

            <button
              type="button"
              onClick={handleSave}
              className="duo-btn duo-btn-green px-5 py-2.5 rounded-2xl text-xs font-black flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Übernehmen & Fertig</span>
            </button>
          </div>

        </div>
      </div>
    </ModalPortal>
  );
};
