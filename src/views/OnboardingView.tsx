import React, { useState, useEffect } from 'react';
import { useFamily } from '../context/FamilyContext';
import { FamilyMember } from '../types';
import { pullVercelFamilyState } from '../services/vercelSync';
import { Sparkles, QrCode } from 'lucide-react';

interface NewMemberDraft {
  idTemp: string;
  name: string;
  role: string;
  avatar: string;
  color: string;
  isChild: boolean;
  pin: string;
}

const COLOR_PALETTES = [
  { hex: '#EC4899', name: 'Rosa', bgLight: 'bg-pink-50', borderClass: 'border-pink-300', textClass: 'text-pink-700' },
  { hex: '#0D9488', name: 'Teal', bgLight: 'bg-teal-50', borderClass: 'border-teal-300', textClass: 'text-teal-700' },
  { hex: '#F59E0B', name: 'Bernstein', bgLight: 'bg-amber-50', borderClass: 'border-amber-300', textClass: 'text-amber-700' },
  { hex: '#8B5CF6', name: 'Lila', bgLight: 'bg-purple-50', borderClass: 'border-purple-300', textClass: 'text-purple-700' },
  { hex: '#3B82F6', name: 'Blau', bgLight: 'bg-blue-50', borderClass: 'border-blue-300', textClass: 'text-blue-700' },
  { hex: '#10B981', name: 'Smaragd', bgLight: 'bg-emerald-50', borderClass: 'border-emerald-300', textClass: 'text-emerald-700' },
  { hex: '#F43F5E', name: 'Koralle', bgLight: 'bg-rose-50', borderClass: 'border-rose-300', textClass: 'text-rose-700' },
  { hex: '#6366F1', name: 'Indigo', bgLight: 'bg-indigo-50', borderClass: 'border-indigo-300', textClass: 'text-indigo-700' },
];

const EMOJI_PRESETS = ['👩', '👨', '👧', '👦', '👶', '👵', '👴', '🐶', '🐱', '⚽', '🎨', '🚀', '🌟', '🧁'];

export const OnboardingView: React.FC = () => {
  const { completeOnboarding, loadDemoData, isDarkMode, toggleDarkMode, joinFamilyFromCloud } = useFamily();
  const [cloudFamilyName, setCloudFamilyName] = useState<string | null>(null);
  const [isJoiningCloud, setIsJoiningCloud] = useState<boolean>(false);

  useEffect(() => {
    // Check if cloud storage already has an active family
    pullVercelFamilyState().then((res) => {
      if (res.success && res.data && Array.isArray(res.data.members) && res.data.members.length > 0) {
        setCloudFamilyName(res.data.familyName || 'Bestehende Familie');
      }
    });
  }, []);

  const handleJoinCloud = async () => {
    setIsJoiningCloud(true);
    const success = await joinFamilyFromCloud();
    if (!success) {
      setIsJoiningCloud(false);
      alert('Konnte Familiendaten nicht laden. Bitte prüfe deine Internetverbindung.');
    }
  };

  // Wizard Steps: 0 = Welcome / Choice, 1 = Family Name, 2 = Members, 3 = Preferences
  const [step, setStep] = useState<number>(0);
  const [familyNameInput, setFamilyNameInput] = useState<string>('');
  const [members, setMembers] = useState<NewMemberDraft[]>([
    {
      idTemp: 'draft_1',
      name: 'Mama',
      role: 'Mama',
      avatar: '👩',
      color: '#EC4899',
      isChild: false,
      pin: '',
    },
    {
      idTemp: 'draft_2',
      name: 'Papa',
      role: 'Papa',
      avatar: '👨',
      color: '#0D9488',
      isChild: false,
      pin: '',
    },
  ]);

  const [loadSampleRecipes, setLoadSampleRecipes] = useState<boolean>(true);
  const [loadSampleStores, setLoadSampleStores] = useState<boolean>(true);

  // Helper to add member preset
  const handleAddPresetMember = (rolePreset: 'Mama' | 'Papa' | 'Kind' | 'Oma' | 'Opa' | 'Custom') => {
    let name = '';
    let role = '';
    let avatar = '👤';
    let color = COLOR_PALETTES[members.length % COLOR_PALETTES.length].hex;
    let isChild = false;

    if (rolePreset === 'Mama') {
      name = 'Mama';
      role = 'Mama';
      avatar = '👩';
      color = '#EC4899';
    } else if (rolePreset === 'Papa') {
      name = 'Papa';
      role = 'Papa';
      avatar = '👨';
      color = '#0D9488';
    } else if (rolePreset === 'Kind') {
      name = 'Kind';
      role = 'Kind';
      avatar = members.length % 2 === 0 ? '👦' : '👧';
      color = '#F59E0B';
      isChild = true;
    } else if (rolePreset === 'Oma') {
      name = 'Oma';
      role = 'Oma';
      avatar = '👵';
      color = '#3B82F6';
    } else if (rolePreset === 'Opa') {
      name = 'Opa';
      role = 'Opa';
      avatar = '👴';
      color = '#10B981';
    } else {
      name = 'Mitglied';
      role = 'Familie';
      avatar = '🌟';
    }

    setMembers((prev) => [
      ...prev,
      {
        idTemp: `draft_${Date.now()}_${Math.random()}`,
        name,
        role,
        avatar,
        color,
        isChild,
        pin: '',
      },
    ]);
  };

  const handleUpdateMember = (idTemp: string, updates: Partial<NewMemberDraft>) => {
    setMembers((prev) => prev.map((m) => (m.idTemp === idTemp ? { ...m, ...updates } : m)));
  };

  const handleRemoveMember = (idTemp: string) => {
    if (members.length <= 1) return;
    setMembers((prev) => prev.filter((m) => m.idTemp !== idTemp));
  };

  const handleFinishOnboarding = () => {
    const cleanFamily = familyNameInput.trim() || 'Familie';
    const finalMembers: Array<Omit<FamilyMember, 'id'>> = members.map((m) => {
      const palette = COLOR_PALETTES.find((p) => p.hex === m.color) || COLOR_PALETTES[0];
      return {
        name: m.name.trim() || 'Familienmitglied',
        role: m.role.trim() || (m.isChild ? 'Kind' : 'Erwachsener'),
        avatar: m.avatar || (m.isChild ? '👦' : '👤'),
        color: palette.hex,
        bgLight: palette.bgLight,
        borderClass: palette.borderClass,
        textClass: palette.textClass,
        isChild: m.isChild,
        pin: m.pin.trim() || undefined,
      };
    });

    completeOnboarding({
      familyName: cleanFamily,
      members: finalMembers,
      loadSampleRecipes,
      loadSampleStores,
    });
  };

  const formattedFamilyPreview = () => {
    const raw = familyNameInput.trim();
    if (!raw) return 'Familie';
    return raw.toLowerCase().startsWith('familie') ? raw : `Familie ${raw}`;
  };

  return (
    <div className="min-h-screen bg-[#F7F9FA] dark:bg-[#0c1222] text-stone-900 dark:text-slate-100 flex flex-col items-center justify-center p-4 transition-colors">
      {/* Theme Toggle Top Right */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={toggleDarkMode}
          className="p-2.5 rounded-full bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 shadow-sm text-stone-600 dark:text-stone-300 hover:scale-105 active:scale-95 transition-all text-sm flex items-center gap-1.5"
          title="Design wechseln"
        >
          {isDarkMode ? '☀️ Hell' : '🌙 Dunkel'}
        </button>
      </div>

      <div className="max-w-xl w-full">
        {/* Step 0: Welcome & Decision */}
        {step === 0 && (
          <div className="bg-white dark:bg-slate-900 border-2 border-stone-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xl text-center animate-page-enter">
            <div className="w-20 h-20 bg-amber-100 dark:bg-amber-950/60 rounded-3xl flex items-center justify-center text-4xl mx-auto shadow-inner mb-6">
              🏡
            </div>

            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-stone-900 dark:text-white">
              Willkommen bei <span className="text-amber-600 dark:text-amber-400">Famly</span>
            </h1>
            <p className="mt-3 text-stone-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
              Euer gemeinsamer Familien-Hub für Termine, Essensplanung, Einkaufslisten, Kinderpass und die schönsten Momente.
            </p>

            {/* Detected Cloud Family Quick-Join Banner */}
            {cloudFamilyName && (
              <div className="mt-6 mb-2 p-5 rounded-3xl bg-emerald-50 dark:bg-emerald-950/60 border-2 border-emerald-400 dark:border-emerald-600 text-center space-y-3 animate-pop-in">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 rounded-2xl flex items-center justify-center text-2xl mx-auto shadow-xs">
                  🏡
                </div>
                <div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-200/70 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200">
                    <Sparkles className="w-3 h-3" /> Cloud-Synchronisation aktiv
                  </span>
                  <h3 className="text-lg font-black text-emerald-950 dark:text-emerald-100 mt-1">
                    {cloudFamilyName.toLowerCase().startsWith('familie') ? cloudFamilyName : `Familie ${cloudFamilyName}`} gefunden!
                  </h3>
                  <p className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold mt-0.5">
                    Dieses Gerät direkt mit eurem Familien-Hub verknüpfen?
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleJoinCloud}
                  disabled={isJoiningCloud}
                  className="duo-btn duo-btn-green w-full py-3.5 px-6 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  <span>{isJoiningCloud ? 'Synchronisiere...' : `🚀 Jetzt ${cloudFamilyName} beitreten`}</span>
                </button>
              </div>
            )}

            <div className="mt-6 space-y-3">
              <button
                onClick={() => setStep(1)}
                className="w-full py-4 px-6 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white font-extrabold text-base sm:text-lg shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2"
              >
                <span>👨‍👩‍👧‍👦 Eigene Familie neu einrichten</span>
                <span className="text-xl">➔</span>
              </button>

              <button
                type="button"
                onClick={handleJoinCloud}
                disabled={isJoiningCloud}
                className="w-full py-3.5 px-6 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 active:scale-[0.98] text-indigo-900 dark:text-indigo-200 font-bold text-sm sm:text-base border-2 border-indigo-200 dark:border-indigo-800 transition-all flex items-center justify-center gap-2"
              >
                <QrCode className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Bestehender Familie beitreten (Cloud Sync)</span>
              </button>

              <div className="relative py-2 flex items-center justify-center">
                <div className="border-t border-stone-200 dark:border-slate-800 w-full"></div>
                <span className="bg-white dark:bg-slate-900 px-3 text-xs font-semibold text-stone-400 dark:text-slate-500 uppercase tracking-wider absolute">
                  Oder
                </span>
              </div>

              <button
                onClick={loadDemoData}
                className="w-full py-3 px-6 rounded-2xl bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 active:scale-[0.98] text-stone-700 dark:text-slate-200 font-bold text-xs sm:text-sm border border-stone-200 dark:border-slate-700 transition-all flex items-center justify-center gap-2"
              >
                <span>✨ Erstmal mit Beispieldaten umsehen</span>
              </button>
            </div>

            <p className="mt-6 text-xs text-stone-400 dark:text-slate-500">
              Keine Voreinstellungen erzwungen • Ihr könnt alle Daten jederzeit ändern oder zurücksetzen.
            </p>
          </div>
        )}

        {/* Step 1: Family Name */}
        {step === 1 && (
          <div className="bg-white dark:bg-slate-900 border-2 border-stone-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xl animate-page-enter">
            <div className="flex items-center justify-between mb-6">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-3 py-1 rounded-full">
                Schritt 1 von 3
              </div>
              <button
                onClick={() => setStep(0)}
                className="text-xs font-bold text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              >
                Zurück
              </button>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-white">
              Wie lautet euer Familienname?
            </h2>
            <p className="mt-2 text-stone-500 dark:text-slate-400 text-sm">
              Das wird in der App auf der Startseite und in geteilten Fotogalerien für Verwandte angezeigt.
            </p>

            <div className="mt-6">
              <label className="block text-xs font-bold text-stone-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Familienname
              </label>
              <input
                type="text"
                autoFocus
                placeholder="z. B. Baum, Müller oder Familie Schmidt"
                value={familyNameInput}
                onChange={(e) => setFamilyNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && familyNameInput.trim()) setStep(2);
                }}
                className="w-full px-4 py-3.5 rounded-2xl bg-stone-50 dark:bg-slate-800 border-2 border-stone-200 dark:border-slate-700 text-stone-900 dark:text-white text-lg font-bold placeholder-stone-400 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            {/* Live Preview Badge */}
            <div className="mt-6 p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-center gap-3">
              <span className="text-2xl">👋</span>
              <div>
                <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">So begrüßt euch die App:</p>
                <p className="text-base font-black text-amber-900 dark:text-amber-100">
                  Hallo {formattedFamilyPreview()}!
                </p>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setStep(2)}
                disabled={!familyNameInput.trim()}
                className="py-3.5 px-8 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-black text-base shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center gap-2"
              >
                <span>Weiter zu den Personen</span>
                <span>➔</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Family Members */}
        {step === 2 && (
          <div className="bg-white dark:bg-slate-900 border-2 border-stone-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl animate-page-enter">
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-3 py-1 rounded-full">
                Schritt 2 von 3
              </div>
              <button
                onClick={() => setStep(1)}
                className="text-xs font-bold text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              >
                Zurück
              </button>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-white">
              Wer gehört zu {formattedFamilyPreview()}?
            </h2>
            <p className="mt-1 text-stone-500 dark:text-slate-400 text-sm">
              Tragt die Familienmitglieder ein. Ihr könnt Name, Emoji, Farbe und optional eine PIN festlegen.
            </p>

            {/* Quick Starter Chips */}
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="text-xs font-bold text-stone-400 dark:text-slate-500 self-center mr-1">
                Hinzufügen:
              </span>
              <button
                onClick={() => handleAddPresetMember('Mama')}
                className="px-3 py-1.5 rounded-xl bg-pink-100 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 font-bold text-xs hover:scale-105 active:scale-95 transition-all"
              >
                + 👩 Mama
              </button>
              <button
                onClick={() => handleAddPresetMember('Papa')}
                className="px-3 py-1.5 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-bold text-xs hover:scale-105 active:scale-95 transition-all"
              >
                + 👨 Papa
              </button>
              <button
                onClick={() => handleAddPresetMember('Kind')}
                className="px-3 py-1.5 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold text-xs hover:scale-105 active:scale-95 transition-all"
              >
                + 🧒 Kind
              </button>
              <button
                onClick={() => handleAddPresetMember('Oma')}
                className="px-3 py-1.5 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-xs hover:scale-105 active:scale-95 transition-all"
              >
                + 👵 Oma
              </button>
              <button
                onClick={() => handleAddPresetMember('Opa')}
                className="px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs hover:scale-105 active:scale-95 transition-all"
              >
                + 👴 Opa
              </button>
            </div>

            {/* Members List */}
            <div className="mt-5 space-y-3 max-h-[50vh] overflow-y-auto pr-1">
              {members.map((member) => {
                return (
                  <div
                    key={member.idTemp}
                    className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-800/70 border border-stone-200 dark:border-slate-700/80 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between"
                  >
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      {/* Avatar Picker Dropdown */}
                      <div className="relative group">
                        <select
                          value={member.avatar}
                          onChange={(e) => handleUpdateMember(member.idTemp, { avatar: e.target.value })}
                          className="w-12 h-12 text-2xl rounded-2xl bg-white dark:bg-slate-700 border-2 border-stone-200 dark:border-slate-600 flex items-center justify-center shadow-sm cursor-pointer text-center appearance-none"
                          style={{ borderColor: member.color }}
                        >
                          {EMOJI_PRESETS.map((emoji) => (
                            <option key={emoji} value={emoji}>
                              {emoji}
                            </option>
                          ))}
                        </select>
                        <span className="absolute -bottom-1 -right-1 text-[10px] bg-stone-200 dark:bg-slate-600 rounded-full px-1 pointer-events-none">
                          ✏️
                        </span>
                      </div>

                      {/* Name & Role Inputs */}
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Name"
                          value={member.name}
                          onChange={(e) => handleUpdateMember(member.idTemp, { name: e.target.value })}
                          className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 border border-stone-200 dark:border-slate-600 text-stone-900 dark:text-white font-bold text-sm focus:outline-none focus:border-amber-500"
                        />
                        <input
                          type="text"
                          placeholder="Rolle (z. B. Mama)"
                          value={member.role}
                          onChange={(e) => handleUpdateMember(member.idTemp, { role: e.target.value })}
                          className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 border border-stone-200 dark:border-slate-600 text-stone-600 dark:text-slate-300 text-xs focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-stone-200 dark:border-slate-700">
                      {/* Color Palette Switcher */}
                      <div className="flex items-center gap-1">
                        {COLOR_PALETTES.slice(0, 5).map((color) => (
                          <button
                            key={color.hex}
                            onClick={() => handleUpdateMember(member.idTemp, { color: color.hex })}
                            className={`w-5 h-5 rounded-full transition-transform ${
                              member.color === color.hex ? 'scale-125 ring-2 ring-stone-400 dark:ring-white' : 'opacity-60'
                            }`}
                            style={{ backgroundColor: color.hex }}
                            title={color.name}
                          />
                        ))}
                      </div>

                      {/* Child Toggle */}
                      <button
                        onClick={() => handleUpdateMember(member.idTemp, { isChild: !member.isChild })}
                        className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors ${
                          member.isChild
                            ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300'
                            : 'bg-stone-200 dark:bg-slate-700 text-stone-600 dark:text-slate-300'
                        }`}
                      >
                        {member.isChild ? 'Kind 🧒' : 'Erwachsen 👤'}
                      </button>

                      {/* Remove Button */}
                      {members.length > 1 && (
                        <button
                          onClick={() => handleRemoveMember(member.idTemp)}
                          className="p-1.5 text-stone-400 hover:text-red-500 transition-colors"
                          title="Entfernen"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex justify-between items-center">
              <button
                onClick={() => handleAddPresetMember('Custom')}
                className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline"
              >
                + Weiteres Mitglied anlegen
              </button>

              <button
                onClick={() => setStep(3)}
                disabled={members.length === 0 || members.some((m) => !m.name.trim())}
                className="py-3 px-6 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-black text-sm shadow-md shadow-amber-500/20 disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center gap-2"
              >
                <span>Weiter</span>
                <span>➔</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Starteinstellungen & Finish */}
        {step === 3 && (
          <div className="bg-white dark:bg-slate-900 border-2 border-stone-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xl animate-page-enter">
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-3 py-1 rounded-full">
                Schritt 3 von 3
              </div>
              <button
                onClick={() => setStep(2)}
                className="text-xs font-bold text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              >
                Zurück
              </button>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-white">
              Fast geschafft! 🚀
            </h2>
            <p className="mt-1 text-stone-500 dark:text-slate-400 text-sm">
              Wählt eure bevorzugten Starteinstellungen für {formattedFamilyPreview()}:
            </p>

            <div className="mt-6 space-y-4">
              {/* Option 1: Stores */}
              <label className="flex items-start gap-3 p-4 rounded-2xl bg-stone-50 dark:bg-slate-800/70 border border-stone-200 dark:border-slate-700/80 cursor-pointer hover:border-amber-400 transition-colors">
                <input
                  type="checkbox"
                  checked={loadSampleStores}
                  onChange={(e) => setLoadSampleStores(e.target.checked)}
                  className="mt-1 w-5 h-5 text-amber-500 rounded focus:ring-amber-400 cursor-pointer"
                />
                <div>
                  <p className="text-sm font-bold text-stone-900 dark:text-white">
                    🛒 Beliebte Geschäfte anlegen (Rewe, dm, Bäcker, Apotheke)
                  </p>
                  <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
                    Sortiert eure Einkäufe automatisch nach passenden Läden. Eigene Läden können jederzeit hinzugefügt werden.
                  </p>
                </div>
              </label>

              {/* Option 2: Recipes */}
              <label className="flex items-start gap-3 p-4 rounded-2xl bg-stone-50 dark:bg-slate-800/70 border border-stone-200 dark:border-slate-700/80 cursor-pointer hover:border-amber-400 transition-colors">
                <input
                  type="checkbox"
                  checked={loadSampleRecipes}
                  onChange={(e) => setLoadSampleRecipes(e.target.checked)}
                  className="mt-1 w-5 h-5 text-amber-500 rounded focus:ring-amber-400 cursor-pointer"
                />
                <div>
                  <p className="text-sm font-bold text-stone-900 dark:text-white">
                    🍳 5 beliebte Familien-Rezepte als Inspiration beilegen
                  </p>
                  <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
                    Enthält schnelle Pasta, Tacos, Pizza, Eintopf und Pancakes. (Kann jederzeit gelöscht oder erweitert werden).
                  </p>
                </div>
              </label>
            </div>

            {/* Summary Preview */}
            <div className="mt-6 p-4 rounded-2xl bg-stone-100 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-stone-500 dark:text-slate-400">Eure Familie:</p>
                <p className="text-sm font-black text-stone-900 dark:text-white">
                  {formattedFamilyPreview()} ({members.length} Mitglieder)
                </p>
              </div>
              <div className="flex -space-x-2">
                {members.map((m) => (
                  <div
                    key={m.idTemp}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-sm border-2 border-white dark:border-slate-800"
                    style={{ backgroundColor: m.color }}
                  >
                    {m.avatar}
                  </div>
                ))}
              </div>
            </div>

            {/* Complete Button */}
            <div className="mt-8">
              <button
                onClick={handleFinishOnboarding}
                className="w-full py-4 px-6 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white font-extrabold text-base sm:text-lg shadow-xl shadow-amber-500/25 transition-all flex items-center justify-center gap-2"
              >
                <span>Famly starten 🚀</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
