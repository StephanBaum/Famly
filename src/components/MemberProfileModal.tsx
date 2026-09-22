import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { FamilyMember } from '../types';
import { useFamily } from '../context/FamilyContext';
import { ModalPortal } from './ModalPortal';
import {
  Sparkles,
  Shirt,
  HeartPulse,
  Phone,
  GraduationCap,
  Briefcase,
  AlertCircle,
  Plus,
  X,
  Check,
  Copy,
  Wand2,
} from 'lucide-react';

interface MemberProfileModalProps {
  member: FamilyMember;
  isOpen: boolean;
  onClose: () => void;
  initialEditMode?: boolean;
}

const HOBBY_PRESETS = [
  { label: '🚴 Radfahren / MTB', category: 'sport' },
  { label: '⚽ Fußball', category: 'sport' },
  { label: '🧗 Bouldern & Klettern', category: 'sport' },
  { label: '🏊 Schwimmen', category: 'sport' },
  { label: '🏃 Laufen & Joggen', category: 'sport' },
  { label: '🧘 Yoga & Fitness', category: 'sport' },
  { label: '🎾 Tennis / Padel', category: 'sport' },
  { label: '🛹 Skaten / Scooter', category: 'sport' },
  { label: '🎨 Malen & Basteln', category: 'creative' },
  { label: '🎸 Musik & Instrumente', category: 'creative' },
  { label: '🧱 LEGO & Bauen', category: 'creative' },
  { label: '🎮 Gaming', category: 'creative' },
  { label: '📚 Lesen & Bücher', category: 'creative' },
  { label: '🍳 Kochen & Backen', category: 'creative' },
  { label: '🪴 Natur & Garten', category: 'creative' },
  { label: '☕ Kaffee-Liebhaber', category: 'food' },
  { label: '🍕 Pizza & Pasta', category: 'food' },
  { label: '🍣 Sushi', category: 'food' },
  { label: '🥗 Vegetarisch', category: 'food' },
  { label: '🌱 Vegan', category: 'food' },
  { label: '🍫 Schokolade & Süßes', category: 'food' },
];

const ALLERGY_PRESETS = [
  '🌸 Pollen / Heuschnupfen',
  '🌾 Gluten',
  '🥛 Laktose',
  '🥜 Erdnüsse',
  '🌰 Nüsse allgemein',
  '🐝 Wespen-/Bienenstich',
  '🐱 Tierhaare',
  '🏠 Hausstaub',
  '💊 Penicillin',
];

const BLOOD_TYPES = ['0+', '0-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

export const MemberProfileModal: React.FC<MemberProfileModalProps> = ({
  member,
  isOpen,
  onClose,
}) => {
  const { updateMember, loggedInMemberId } = useFamily();

  const isChild = Boolean(
    member?.isChild ||
      member?.role.toLowerCase().includes('sohn') ||
      member?.role.toLowerCase().includes('tochter') ||
      member?.role.toLowerCase().includes('kind') ||
      member?.role.toLowerCase().includes('son') ||
      member?.role.toLowerCase().includes('daughter') ||
      member?.role.toLowerCase().includes('child')
  );

  const [activeTab, setActiveTab] = useState<'profile' | 'sizes' | 'health' | 'school'>('profile');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [magicInput, setMagicInput] = useState('');
  const [magicFeedback, setMagicFeedback] = useState<string | null>(null);

  // Form states
  const [interests, setInterests] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');
  const [notes, setNotes] = useState('');
  const [clothingSize, setClothingSize] = useState('');
  const [shoeSize, setShoeSize] = useState('');
  const [pantsSize, setPantsSize] = useState('');
  const [bikeSize, setBikeSize] = useState('');
  const [allergies, setAllergies] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [doctorPhone, setDoctorPhone] = useState('');
  const [doctorAddress, setDoctorAddress] = useState('');
  const [dentistName, setDentistName] = useState('');
  const [dentistPhone, setDentistPhone] = useState('');
  const [dentistAddress, setDentistAddress] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [grade, setGrade] = useState('');
  const [occupation, setOccupation] = useState('');

  // Sync state when member changes or modal opens
  useEffect(() => {
    if (!member) return;
    const details = member.childDetails || {};

    const initialInterests = Array.isArray(member.interests)
      ? member.interests
      : Array.isArray(details.interests)
      ? details.interests
      : [];

    setInterests(initialInterests);
    setNotes(member.notes || '');
    setClothingSize(member.clothingSize || details.clothingSize || '');
    setShoeSize(member.shoeSize || details.shoeSize || '');
    setPantsSize(member.pantsSize || details.pantsSize || '');
    setBikeSize(member.bikeSize || details.bikeSize || '');
    setAllergies(member.allergies || details.allergies || '');
    setBloodType(member.bloodType || details.bloodType || '');
    setDoctorName(member.doctorName || details.doctorName || '');
    setDoctorPhone(member.doctorPhone || details.doctorPhone || '');
    setDoctorAddress(member.doctorAddress || details.doctorAddress || '');
    setDentistName(member.dentistName || details.dentistName || '');
    setDentistPhone(member.dentistPhone || details.dentistPhone || '');
    setDentistAddress(member.dentistAddress || details.dentistAddress || '');
    setEmergencyContact(member.emergencyContact || details.emergencyContact || '');
    setSchoolName(details.schoolName || '');
    setGrade(details.grade || '');
    setOccupation(member.occupation || details.occupation || '');
  }, [member, isOpen]);

  if (!isOpen || !member) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const toggleInterest = (tag: string) => {
    setInterests((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleAddCustomTag = () => {
    const clean = customTagInput.trim();
    if (!clean) return;
    if (!interests.includes(clean)) {
      setInterests((prev) => [...prev, clean]);
    }
    setCustomTagInput('');
  };

  const toggleAllergyPreset = (allergy: string) => {
    const cleanName = allergy.replace(/^[^\w\s]+/, '').trim();
    if (allergies.toLowerCase().includes(cleanName.toLowerCase())) {
      const parts = allergies
        .split(/[,;]+/)
        .map((p) => p.trim())
        .filter((p) => p && !p.toLowerCase().includes(cleanName.toLowerCase()));
      setAllergies(parts.join(', '));
    } else {
      setAllergies((prev) => (prev ? `${prev}, ${cleanName}` : cleanName));
    }
  };

  // Magic Quick-Input NLP Parser
  const handleMagicApply = () => {
    const text = magicInput.trim();
    if (!text) return;

    let appliedCount = 0;
    const lower = text.toLowerCase();

    // 1. Shoe size
    const shoeMatch = text.match(/(?:schuh(?:größe)?|schuhe)\s*(?:größe)?\s*[:\s]?\s*(\d{2})/i);
    if (shoeMatch && shoeMatch[1]) {
      setShoeSize(shoeMatch[1]);
      appliedCount++;
    }

    // 2. Clothing size
    const clothMatch = text.match(/(?:kleidergröße|größe|kleidung|oberteil)\s*[:\s]?\s*([0-9]{2,3}|(?:xs|s|m|l|xl|xxl))/i);
    if (clothMatch && clothMatch[1]) {
      setClothingSize(clothMatch[1].toUpperCase());
      appliedCount++;
    }

    // 3. Allergies
    const allergyMatch = text.match(/(?:allergie|allergisch gegen|unverträglichkeit)\s*[:\s]?\s*([^,.;]+)/i);
    if (allergyMatch && allergyMatch[1]) {
      const extractedAllergy = allergyMatch[1].trim();
      setAllergies((prev) => (prev ? `${prev}, ${extractedAllergy}` : extractedAllergy));
      appliedCount++;
    } else if (lower.includes('heuschnupfen')) {
      setAllergies((prev) => (prev ? `${prev}, Heuschnupfen` : 'Heuschnupfen'));
      appliedCount++;
    }

    // 4. Hobbies & Interests from presets
    const foundTags: string[] = [];
    HOBBY_PRESETS.forEach((preset) => {
      const baseWord = preset.label.replace(/^[^\w\s]+/, '').split('/')[0].trim().toLowerCase();
      if (lower.includes(baseWord) && !interests.includes(preset.label)) {
        foundTags.push(preset.label);
      }
    });

    if (foundTags.length > 0) {
      setInterests((prev) => Array.from(new Set([...prev, ...foundTags])));
      appliedCount += foundTags.length;
    }

    if (appliedCount > 0) {
      setMagicFeedback(`✨ ${appliedCount} Angabe(n) automatisch erkannt & ausgefüllt!`);
      setMagicInput('');
      setTimeout(() => setMagicFeedback(null), 4000);
    } else {
      setMagicFeedback('💡 Tipp: Schreib z.B. "Schuhgröße 42, liebt Bouldern und Kaffee, Erdnussallergie"');
      setTimeout(() => setMagicFeedback(null), 4000);
    }
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const updatedChildDetails = {
      ...(member.childDetails || {}),
      clothingSize: clothingSize.trim() || undefined,
      shoeSize: shoeSize.trim() || undefined,
      pantsSize: pantsSize.trim() || undefined,
      bikeSize: bikeSize.trim() || undefined,
      doctorName: doctorName.trim() || undefined,
      doctorPhone: doctorPhone.trim() || undefined,
      doctorAddress: doctorAddress.trim() || undefined,
      dentistName: dentistName.trim() || undefined,
      dentistPhone: dentistPhone.trim() || undefined,
      dentistAddress: dentistAddress.trim() || undefined,
      allergies: allergies.trim() || undefined,
      bloodType: bloodType.trim() || undefined,
      schoolName: schoolName.trim() || undefined,
      grade: grade.trim() || undefined,
      emergencyContact: emergencyContact.trim() || undefined,
      interests,
      occupation: occupation.trim() || undefined,
    };

    updateMember(member.id, {
      notes: notes.trim() || undefined,
      interests,
      clothingSize: clothingSize.trim() || undefined,
      shoeSize: shoeSize.trim() || undefined,
      pantsSize: pantsSize.trim() || undefined,
      bikeSize: bikeSize.trim() || undefined,
      allergies: allergies.trim() || undefined,
      bloodType: bloodType.trim() || undefined,
      doctorName: doctorName.trim() || undefined,
      doctorPhone: doctorPhone.trim() || undefined,
      doctorAddress: doctorAddress.trim() || undefined,
      dentistName: dentistName.trim() || undefined,
      dentistPhone: dentistPhone.trim() || undefined,
      dentistAddress: dentistAddress.trim() || undefined,
      emergencyContact: emergencyContact.trim() || undefined,
      occupation: occupation.trim() || undefined,
      childDetails: updatedChildDetails,
    });

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#8B5CF6', '#10B981', '#F59E0B'],
    });

    onClose();
  };

  const isLoggedIn = member.id === loggedInMemberId;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl border-2 border-stone-200 dark:border-slate-800 animate-in fade-in zoom-in-95 max-h-[92vh] flex flex-col my-auto overflow-hidden">
          
          {/* HEADER HERO */}
          <div className="relative border-b border-stone-200 dark:border-slate-800 p-5 sm:p-6 pb-4 bg-linear-to-b from-stone-50 to-white dark:from-slate-900 dark:to-slate-900/90 shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border-2 shadow-md relative group transition-transform hover:scale-105"
                  style={{ backgroundColor: `${member.color}20`, borderColor: member.color }}
                >
                  {member.avatar}
                  <span
                    className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900"
                    style={{ backgroundColor: member.color }}
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white">
                      {member.name}
                    </h2>
                    <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                      {member.role}
                    </span>
                    {isLoggedIn && (
                      <span className="text-[10px] font-black text-emerald-800 dark:text-emerald-200 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700">
                        Dein Profil
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                    <span>{isChild ? '🧸 Kinder-Pass' : '👤 Steckbrief & persönliche Daten'}</span>
                    {member.birthday && (
                      <>
                        <span>•</span>
                        <span>🎂 {member.birthday}</span>
                      </>
                    )}
                    {member.stars !== undefined && member.stars > 0 && (
                      <>
                        <span>•</span>
                        <span className="font-extrabold text-amber-600 dark:text-amber-400">⭐ {member.stars} Sterne</span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-9 h-9 rounded-2xl bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 text-stone-500 dark:text-slate-300 font-bold flex items-center justify-center transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* MAGIC QUICK INPUT BAR */}
            <div className="mt-4 pt-3 border-t border-stone-200/70 dark:border-slate-800">
              <div className="flex items-center gap-2 bg-purple-50/80 dark:bg-purple-950/30 p-2 rounded-2xl border border-purple-200/80 dark:border-purple-800/50">
                <Wand2 className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 ml-1" />
                <input
                  type="text"
                  placeholder="🪄 Schnelleingabe: z.B. 'Schuhgröße 44, liebt Bouldern und Kaffee, Erdnussallergie'..."
                  value={magicInput}
                  onChange={(e) => setMagicInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleMagicApply()}
                  className="bg-transparent flex-1 text-xs text-stone-800 dark:text-white placeholder:text-stone-400 dark:placeholder:text-slate-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleMagicApply}
                  disabled={!magicInput.trim()}
                  className="duo-btn duo-btn-purple px-3 py-1 text-[11px] font-black rounded-xl shrink-0 disabled:opacity-40"
                >
                  Einsortieren
                </button>
              </div>

              {magicFeedback && (
                <p className="text-[11px] font-extrabold text-purple-700 dark:text-purple-300 mt-1.5 px-2 animate-in fade-in">
                  {magicFeedback}
                </p>
              )}
            </div>

            {/* TAB NAVIGATION */}
            <div className="flex items-center gap-2 mt-4 overflow-x-auto scrollbar-none pb-0.5">
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'profile'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300 hover:bg-stone-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Steckbrief & Hobbys ({interests.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('sizes')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'sizes'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300 hover:bg-stone-200'
                }`}
              >
                <Shirt className="w-3.5 h-3.5" />
                <span>Größen & Maße</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('health')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'health'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300 hover:bg-stone-200'
                }`}
              >
                <HeartPulse className="w-3.5 h-3.5" />
                <span>Gesundheit & Notfall</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('school')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'school'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300 hover:bg-stone-200'
                }`}
              >
                {isChild ? <GraduationCap className="w-3.5 h-3.5" /> : <Briefcase className="w-3.5 h-3.5" />}
                <span>{isChild ? 'Schule & Kita' : 'Beruf & Notizen'}</span>
              </button>
            </div>
          </div>

          {/* TAB CONTENT (SCROLLABLE) */}
          <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
            
            {/* TAB 1: STECKBRIEF & HOBBYS */}
            {activeTab === 'profile' && (
              <div className="space-y-6 animate-in fade-in">
                
                {/* Active Interests Chips */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase text-stone-600 dark:text-slate-400 tracking-wider">
                      Aktuelle Hobbys, Interessen & Vorlieben ({interests.length})
                    </label>
                    <span className="text-[11px] text-stone-400">Antippen zum Entfernen</span>
                  </div>

                  {interests.length > 0 ? (
                    <div className="flex flex-wrap gap-2 p-3 bg-stone-50 dark:bg-slate-800/60 rounded-2xl border border-stone-200 dark:border-slate-700 min-h-[50px] items-center">
                      {interests.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleInterest(tag)}
                          className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs group transition-all"
                        >
                          <span>{tag}</span>
                          <X className="w-3 h-3 text-purple-200 group-hover:text-white" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 bg-stone-50 dark:bg-slate-800/60 rounded-2xl border border-dashed border-stone-200 dark:border-slate-700 text-xs text-stone-400">
                      Noch keine Interessen hinterlegt. Tippe unten auf die Vorschläge oder tippe eigene ein!
                    </div>
                  )}
                </div>

                {/* Custom Tag Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Eigenes Hobby / Vorliebe eintippen (z.B. Klavier, Astronomie)..."
                    value={customTagInput}
                    onChange={(e) => setCustomTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCustomTag()}
                    className="flex-1 px-3 py-2 rounded-xl border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-stone-800 dark:text-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomTag}
                    disabled={!customTagInput.trim()}
                    className="duo-btn duo-btn-purple px-4 py-2 text-xs font-black rounded-xl flex items-center gap-1 disabled:opacity-40"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Hinzufügen</span>
                  </button>
                </div>

                {/* Quick Preset Badges */}
                <div className="space-y-3 pt-2 border-t border-stone-100 dark:border-slate-800">
                  <label className="text-xs font-black uppercase text-stone-600 dark:text-slate-400 tracking-wider block">
                    Beliebte Schnellauswahl (1 Klick zum Hinzufügen)
                  </label>

                  <div className="flex flex-wrap gap-2">
                    {HOBBY_PRESETS.map((preset) => {
                      const isSelected = interests.includes(preset.label);
                      return (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => toggleInterest(preset.label)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                            isSelected
                              ? 'bg-purple-100 dark:bg-purple-950/80 border-purple-400 text-purple-800 dark:text-purple-200 shadow-2xs'
                              : 'bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700 text-stone-700 dark:text-slate-300 hover:border-purple-300'
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-1.5 pt-2 border-t border-stone-100 dark:border-slate-800">
                  <label className="text-xs font-black uppercase text-stone-600 dark:text-slate-400 tracking-wider block">
                    Freie Notizen & Steckbrief-Infos
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Wichtige persönliche Notizen, Lieblingsfarbe, Besonderheiten..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-2xl border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-stone-800 dark:text-white focus:outline-none resize-none"
                  />
                </div>
              </div>
            )}

            {/* TAB 2: GRÖSSEN & MASSE */}
            {activeTab === 'sizes' && (
              <div className="space-y-4 animate-in fade-in">
                <p className="text-xs text-stone-500 dark:text-slate-400">
                  Praktisch für Kleiderkauf, Geschenke und Flohmärkte. Immer griffbereit auf einen Blick.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Clothing Size */}
                  <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 space-y-2">
                    <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
                      <Shirt className="w-4 h-4 text-amber-600" />
                      <span className="text-xs font-extrabold uppercase tracking-wide">Kleidergröße / Oberteil</span>
                    </div>
                    <input
                      type="text"
                      placeholder={isChild ? 'z.B. 140 / 146' : 'z.B. M / L (40)'}
                      value={clothingSize}
                      onChange={(e) => setClothingSize(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-stone-900 dark:text-white focus:outline-none"
                    />
                    <div className="flex gap-1.5 flex-wrap pt-1">
                      {(isChild ? ['116', '128', '140', '152', '164'] : ['S', 'M', 'L', 'XL']).map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setClothingSize(preset)}
                          className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200 hover:bg-amber-100"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Shoe Size */}
                  <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/40 space-y-2">
                    <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200">
                      <span className="text-base">👟</span>
                      <span className="text-xs font-extrabold uppercase tracking-wide">Schuhgröße</span>
                    </div>
                    <input
                      type="text"
                      placeholder={isChild ? 'z.B. 34' : 'z.B. 43.5'}
                      value={shoeSize}
                      onChange={(e) => setShoeSize(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-stone-900 dark:text-white focus:outline-none"
                    />
                    <div className="flex gap-1.5 flex-wrap pt-1">
                      {(isChild ? ['30', '32', '34', '36', '38'] : ['39', '40', '42', '44', '45']).map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setShoeSize(preset)}
                          className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-200 hover:bg-blue-100"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Pants / Bund */}
                  <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200">
                      <span className="text-base">👖</span>
                      <span className="text-xs font-extrabold uppercase tracking-wide">Hosenbund / Schnitt</span>
                    </div>
                    <input
                      type="text"
                      placeholder="z.B. 32/34 oder 140 Slim"
                      value={pantsSize}
                      onChange={(e) => setPantsSize(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-stone-900 dark:text-white focus:outline-none"
                    />
                  </div>

                  {/* Bike / Helmet */}
                  <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-900/40 space-y-2">
                    <div className="flex items-center gap-2 text-purple-900 dark:text-purple-200">
                      <span className="text-base">🚴‍♂️</span>
                      <span className="text-xs font-extrabold uppercase tracking-wide">Fahrrad / Helmgröße</span>
                    </div>
                    <input
                      type="text"
                      placeholder="z.B. 24 Zoll / Helm M (54-58cm)"
                      value={bikeSize}
                      onChange={(e) => setBikeSize(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-stone-900 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: GESUNDHEIT & NOTFALL */}
            {activeTab === 'health' && (
              <div className="space-y-6 animate-in fade-in">
                
                {/* Allergies Card */}
                <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/20 border-2 border-rose-200/80 dark:border-rose-900/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-rose-900 dark:text-rose-200">
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                      <span className="text-xs font-extrabold uppercase tracking-wide">Allergien & Unverträglichkeiten</span>
                    </div>
                    <span className="text-[10px] font-bold text-rose-600">Wichtig für Notfälle</span>
                  </div>

                  <input
                    type="text"
                    placeholder="z.B. Erdnüsse, Laktose, Heuschnupfen..."
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-stone-900 dark:text-white focus:outline-none"
                  />

                  {/* Allergy Presets */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {ALLERGY_PRESETS.map((allergy) => {
                      const clean = allergy.replace(/^[^\w\s]+/, '').trim();
                      const isChecked = allergies.toLowerCase().includes(clean.toLowerCase());
                      return (
                        <button
                          key={allergy}
                          type="button"
                          onClick={() => toggleAllergyPreset(allergy)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                            isChecked
                              ? 'bg-rose-600 text-white border-rose-700 shadow-2xs'
                              : 'bg-white dark:bg-slate-800 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 hover:bg-rose-100'
                          }`}
                        >
                          {allergy}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Blood Type */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-stone-600 dark:text-slate-400 tracking-wider block">
                    Blutgruppe
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {BLOOD_TYPES.map((bt) => (
                      <button
                        key={bt}
                        type="button"
                        onClick={() => setBloodType(bloodType === bt ? '' : bt)}
                        className={`w-11 h-9 rounded-xl text-xs font-black transition-all border ${
                          bloodType === bt
                            ? 'bg-rose-600 text-white border-rose-700 shadow-2xs'
                            : 'bg-stone-50 dark:bg-slate-800 border-stone-200 dark:border-slate-700 text-stone-700 dark:text-slate-300 hover:bg-stone-100'
                        }`}
                      >
                        {bt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Doctor */}
                <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase text-emerald-900 dark:text-emerald-200 tracking-wide flex items-center gap-1.5">
                      <HeartPulse className="w-4 h-4 text-emerald-600" />
                      <span>{isChild ? 'Kinderarzt' : 'Hausarzt'}</span>
                    </span>
                    {doctorPhone && (
                      <div className="flex items-center gap-1">
                        <a
                          href={`tel:${doctorPhone}`}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-black flex items-center gap-1 hover:bg-emerald-700"
                        >
                          <Phone className="w-3 h-3" />
                          <span>Anrufen</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => handleCopy(doctorPhone, 'doc')}
                          className="p-1 text-emerald-700 hover:text-emerald-900"
                          title="Nummer kopieren"
                        >
                          {copiedKey === 'doc' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Name des Arztes (z.B. Dr. med. Weber)"
                      value={doctorName}
                      onChange={(e) => setDoctorName(e.target.value)}
                      className="px-3 py-1.5 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-stone-900 dark:text-white focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Telefon (z.B. 089 123456)"
                      value={doctorPhone}
                      onChange={(e) => setDoctorPhone(e.target.value)}
                      className="px-3 py-1.5 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-stone-900 dark:text-white focus:outline-none"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Praxis-Adresse (z.B. Sonnenstraße 12, München)"
                    value={doctorAddress}
                    onChange={(e) => setDoctorAddress(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-stone-900 dark:text-white focus:outline-none"
                  />
                </div>

                {/* Emergency Contact */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-stone-600 dark:text-slate-400 tracking-wider block">
                    🚨 Notfallkontakt (Name & Telefon)
                  </label>
                  <input
                    type="text"
                    placeholder="z.B. Oma Maria: 0171 9876543"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-stone-800 dark:text-white font-semibold focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* TAB 4: SCHULE & BERUF */}
            {activeTab === 'school' && (
              <div className="space-y-5 animate-in fade-in">
                {isChild ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-900/40 space-y-3">
                      <div className="flex items-center gap-2 text-purple-900 dark:text-purple-200">
                        <GraduationCap className="w-4 h-4 text-purple-600" />
                        <span className="text-xs font-extrabold uppercase tracking-wide">Schule & Kindergarten</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-stone-600 dark:text-slate-400 mb-1">
                            Schule / Kita
                          </label>
                          <input
                            type="text"
                            placeholder="z.B. Grundschule am Park"
                            value={schoolName}
                            onChange={(e) => setSchoolName(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-stone-900 dark:text-white focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-stone-600 dark:text-slate-400 mb-1">
                            Klasse / Gruppe & Lehrer
                          </label>
                          <input
                            type="text"
                            placeholder="z.B. Klasse 3b (Frau Müller)"
                            value={grade}
                            onChange={(e) => setGrade(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-stone-900 dark:text-white focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200/80 dark:border-indigo-900/40 space-y-3">
                      <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200">
                        <Briefcase className="w-4 h-4 text-indigo-600" />
                        <span className="text-xs font-extrabold uppercase tracking-wide">Beruf & Arbeitsbereich</span>
                      </div>

                      <input
                        type="text"
                        placeholder="z.B. Software-Ingenieur, Ärztin, Lehrer..."
                        value={occupation}
                        onChange={(e) => setOccupation(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-stone-900 dark:text-white focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-t border-stone-200 dark:border-slate-800 bg-stone-50/70 dark:bg-slate-900/80 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="duo-btn duo-btn-white px-4 py-2 text-xs font-bold rounded-xl"
            >
              Abbrechen
            </button>

            <button
              type="button"
              onClick={() => handleSave()}
              className="duo-btn duo-btn-green px-6 py-2.5 text-xs font-black rounded-xl shadow-xs flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Speichern & Schließen</span>
            </button>
          </div>

        </div>
      </div>
    </ModalPortal>
  );
};
