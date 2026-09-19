import React, { useState } from 'react';
import { FamilyMember, ChildDetails, CustomInfoField } from '../types';
import { useFamily } from '../context/FamilyContext';
import {
  Phone,
  MapPin,
  Check,
  Copy,
  HeartPulse,
  Shirt,
  GraduationCap,
  AlertCircle,
  Trash2,
  Sparkles,
} from 'lucide-react';

interface ChildDetailsModalProps {
  member: FamilyMember;
  isOpen: boolean;
  onClose: () => void;
}

export const ChildDetailsModal: React.FC<ChildDetailsModalProps> = ({
  member,
  isOpen,
  onClose,
}) => {
  const { updateMember } = useFamily();
  const [isEditing, setIsEditing] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const isChild = Boolean(
    member.isChild ||
      member.role.toLowerCase().includes('sohn') ||
      member.role.toLowerCase().includes('tochter') ||
      member.role.toLowerCase().includes('kind') ||
      member.role.toLowerCase().includes('son') ||
      member.role.toLowerCase().includes('daughter') ||
      member.role.toLowerCase().includes('child')
  );

  const initialDetails: ChildDetails = member.childDetails || {};

  // Form state for standard fields
  const [clothingSize, setClothingSize] = useState(initialDetails.clothingSize || '');
  const [shoeSize, setShoeSize] = useState(initialDetails.shoeSize || '');
  const [pantsSize, setPantsSize] = useState(initialDetails.pantsSize || '');
  const [doctorName, setDoctorName] = useState(initialDetails.doctorName || '');
  const [doctorPhone, setDoctorPhone] = useState(initialDetails.doctorPhone || '');
  const [doctorAddress, setDoctorAddress] = useState(initialDetails.doctorAddress || '');
  const [dentistName, setDentistName] = useState(initialDetails.dentistName || '');
  const [dentistPhone, setDentistPhone] = useState(initialDetails.dentistPhone || '');
  const [dentistAddress, setDentistAddress] = useState(initialDetails.dentistAddress || '');
  const [allergies, setAllergies] = useState(initialDetails.allergies || '');
  const [bloodType, setBloodType] = useState(initialDetails.bloodType || '');
  const [schoolName, setSchoolName] = useState(initialDetails.schoolName || '');
  const [grade, setGrade] = useState(initialDetails.grade || '');
  const [emergencyContact, setEmergencyContact] = useState(
    initialDetails.emergencyContact || ''
  );

  // Dynamic Custom Fields state
  const [customFields, setCustomFields] = useState<CustomInfoField[]>(() => {
    return member.customFields || initialDetails.customFields || [];
  });

  // New field input
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');
  const [newFieldCategory, setNewFieldCategory] = useState<'sizes' | 'health' | 'school' | 'other'>(
    isChild ? 'sizes' : 'health'
  );

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleAddCustomField = () => {
    if (!newFieldLabel.trim() || !newFieldValue.trim()) return;
    const newField: CustomInfoField = {
      id: `cf_${Date.now()}`,
      label: newFieldLabel.trim(),
      value: newFieldValue.trim(),
      category: newFieldCategory,
    };
    setCustomFields((prev) => [...prev, newField]);
    setNewFieldLabel('');
    setNewFieldValue('');
  };

  const handleDeleteCustomField = (id: string) => {
    setCustomFields((prev) => prev.filter((f) => f.id !== id));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (isChild) {
      updateMember(member.id, {
        childDetails: {
          clothingSize: clothingSize.trim() || undefined,
          shoeSize: shoeSize.trim() || undefined,
          pantsSize: pantsSize.trim() || undefined,
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
          customFields,
        },
        customFields,
      });
    } else {
      updateMember(member.id, {
        customFields,
      });
    }

    setIsEditing(false);
  };

  const details = member.childDetails || {};
  const activeCustomFields = member.customFields || details.customFields || [];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 shadow-2xl border-2 border-stone-200 dark:border-slate-800 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border-2 shadow-sm"
              style={{ backgroundColor: `${member.color}15`, borderColor: `${member.color}40` }}
            >
              {member.avatar}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-extrabold text-stone-900 dark:text-white">{member.name}</h3>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300">
                  {member.role}
                </span>
              </div>
              <p className="text-xs font-semibold text-stone-500 dark:text-slate-400">
                {isChild ? '🧸 Kinder-Pass • Größen, Arzt & Infos' : '👤 Mitglieder-Profil & Eigene Infos'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="duo-btn duo-btn-white px-3 py-1.5 text-xs font-extrabold rounded-xl"
              >
                ✏️ Bearbeiten
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 text-stone-600 dark:text-slate-300 font-bold flex items-center justify-center text-sm"
            >
              ✕
            </button>
          </div>
        </div>

        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-5">
            
            {/* ONLY FOR CHILDREN: CLOTHING & SHOE SIZES */}
            {isChild && (
              <div className="bg-amber-50/60 dark:bg-amber-950/20 p-4 rounded-2xl border border-amber-200/80 dark:border-amber-900/40 space-y-2">
                <h4 className="text-xs font-extrabold text-amber-900 dark:text-amber-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Shirt className="w-4 h-4 text-amber-600" />
                  <span>Kleidung & Schuhgrößen</span>
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 dark:text-slate-300 mb-1">Oberteil / Kleidung</label>
                    <input
                      type="text"
                      placeholder="z.B. 140 / 146"
                      value={clothingSize}
                      onChange={(e) => setClothingSize(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 dark:text-slate-300 mb-1">Schuhgröße</label>
                    <input
                      type="text"
                      placeholder="z.B. 34"
                      value={shoeSize}
                      onChange={(e) => setShoeSize(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 dark:text-slate-300 mb-1">Hose / Bund</label>
                    <input
                      type="text"
                      placeholder="z.B. 140 Slim"
                      value={pantsSize}
                      onChange={(e) => setPantsSize(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-xs focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ONLY FOR CHILDREN: DOCTOR & CLINIC */}
            {isChild && (
              <>
                <div className="bg-emerald-50/60 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/40">
                  <h4 className="text-xs font-extrabold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <HeartPulse className="w-4 h-4 text-emerald-600" />
                    <span>Kinderarzt / Hausarzt</span>
                  </h4>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-stone-600 dark:text-slate-300 mb-1">Name des Arztes</label>
                        <input
                          type="text"
                          placeholder="z.B. Dr. med. Weber"
                          value={doctorName}
                          onChange={(e) => setDoctorName(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-stone-600 dark:text-slate-300 mb-1">Telefonnummer</label>
                        <input
                          type="text"
                          placeholder="z.B. 089 123456"
                          value={doctorPhone}
                          onChange={(e) => setDoctorPhone(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-xs focus:outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 dark:text-slate-300 mb-1">Praxis-Adresse</label>
                      <input
                        type="text"
                        placeholder="z.B. Sonnenstraße 12, 80331 München"
                        value={doctorAddress}
                        onChange={(e) => setDoctorAddress(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-xs focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50/60 dark:bg-blue-950/20 p-4 rounded-2xl border border-blue-200/80 dark:border-blue-900/40">
                  <h4 className="text-xs font-extrabold text-blue-900 dark:text-blue-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span>🦷</span>
                    <span>Zahnarzt</span>
                  </h4>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-stone-600 dark:text-slate-300 mb-1">Name des Zahnarztes</label>
                        <input
                          type="text"
                          placeholder="z.B. Dr. Peter Vance"
                          value={dentistName}
                          onChange={(e) => setDentistName(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-stone-600 dark:text-slate-300 mb-1">Telefonnummer</label>
                        <input
                          type="text"
                          placeholder="z.B. 089 987654"
                          value={dentistPhone}
                          onChange={(e) => setDentistPhone(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-xs focus:outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 dark:text-slate-300 mb-1">Praxis-Adresse</label>
                      <input
                        type="text"
                        placeholder="z.B. Blumenweg 4, 80333 München"
                        value={dentistAddress}
                        onChange={(e) => setDentistAddress(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-xs focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 dark:text-slate-300 mb-1">Allergien / Hinweise</label>
                    <input
                      type="text"
                      placeholder="z.B. Erdnuss-Allergie, Asthma"
                      value={allergies}
                      onChange={(e) => setAllergies(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 dark:text-slate-300 mb-1">Blutgruppe</label>
                    <input
                      type="text"
                      placeholder="z.B. 0+, A+"
                      value={bloodType}
                      onChange={(e) => setBloodType(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 dark:text-slate-300 mb-1">Schule / Kita</label>
                    <input
                      type="text"
                      placeholder="z.B. Grundschule am Park"
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 dark:text-slate-300 mb-1">Klasse / Gruppe</label>
                    <input
                      type="text"
                      placeholder="z.B. Klasse 3b (Frau Müller)"
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-600 dark:text-slate-300 mb-1">Notfallkontakt</label>
                  <input
                    type="text"
                    placeholder="z.B. Sarah (Mama): 0171 1234567"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-xs focus:outline-none"
                  />
                </div>
              </>
            )}

            {/* CUSTOMIZABLE INFORMATION FIELDS */}
            <div className="bg-purple-50/70 dark:bg-purple-950/20 p-4 rounded-2xl border-2 border-purple-200 dark:border-purple-900/40 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-purple-900 dark:text-purple-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>Eigene Informationsfelder</span>
                </h4>
                <span className="text-[10px] font-bold text-purple-600 dark:text-purple-300">
                  Alle wichtigen Daten speichern
                </span>
              </div>

              {/* Active custom fields in edit form */}
              {customFields.length > 0 && (
                <div className="space-y-2">
                  {customFields.map((field) => (
                    <div
                      key={field.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800 text-xs"
                    >
                      <div>
                        <strong className="text-stone-800 dark:text-white">{field.label}:</strong>{' '}
                        <span className="text-stone-600 dark:text-slate-300">{field.value}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteCustomField(field.id)}
                        className="text-stone-300 hover:text-rose-600 p-1"
                        title="Feld löschen"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* New Field Adder */}
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-purple-200 dark:border-purple-800 space-y-2">
                <span className="block text-[11px] font-extrabold text-stone-700 dark:text-slate-300">
                  + Neues Informationsfeld
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Feldname (z.B. Fahrradhelm)..."
                    value={newFieldLabel}
                    onChange={(e) => setNewFieldLabel(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-stone-900 dark:text-white text-xs focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Wert (z.B. 54cm, #9041)..."
                    value={newFieldValue}
                    onChange={(e) => setNewFieldValue(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-stone-900 dark:text-white text-xs focus:outline-none"
                  />
                  <select
                    value={newFieldCategory}
                    onChange={(e) => setNewFieldCategory(e.target.value as 'sizes' | 'health' | 'school' | 'other')}
                    className="px-2 py-1.5 rounded-lg border border-stone-300 dark:border-slate-700 text-xs focus:outline-none bg-white dark:bg-slate-900 font-semibold text-stone-700 dark:text-slate-300"
                  >
                    <option value="sizes">Größen & Ausrüstung</option>
                    <option value="health">Gesundheit & Medizin</option>
                    <option value="school">Schule & Freizeit</option>
                    <option value="other">Allgemein / Sonstiges</option>
                  </select>
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleAddCustomField}
                    disabled={!newFieldLabel.trim() || !newFieldValue.trim()}
                    className="duo-btn duo-btn-purple px-3 py-1 text-xs font-black rounded-lg disabled:opacity-50"
                  >
                    + Hinzufügen
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="duo-btn duo-btn-white px-4 py-2 text-xs font-bold rounded-xl"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                className="duo-btn duo-btn-green px-5 py-2 text-xs font-extrabold rounded-xl"
              >
                Details speichern
              </button>
            </div>
          </form>
        ) : (
          /* READ ONLY VIEW */
          <div className="space-y-4">
            
            {/* ONLY FOR CHILDREN: WARDROBE SIZES */}
            {isChild && (
              <div className="bg-amber-50/70 dark:bg-amber-950/20 p-4 rounded-3xl border-2 border-amber-200 dark:border-amber-900/40">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-extrabold text-amber-900 dark:text-amber-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Shirt className="w-4 h-4 text-amber-600" />
                    <span>Kleidung & Schuhgrößen</span>
                  </h4>
                  <span className="text-[10px] font-bold bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded-full">
                    Kindergrößen
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white dark:bg-slate-800 p-2.5 rounded-2xl border border-amber-200/80 dark:border-amber-900/40 shadow-2xs">
                    <span className="block text-[10px] uppercase font-bold text-stone-400 dark:text-slate-400">Kleidung / Oberteil</span>
                    <strong className="text-xs font-extrabold text-stone-800 dark:text-white">
                      {details.clothingSize || '—'}
                    </strong>
                  </div>

                  <div className="bg-white dark:bg-slate-800 p-2.5 rounded-2xl border border-amber-200/80 dark:border-amber-900/40 shadow-2xs">
                    <span className="block text-[10px] uppercase font-bold text-stone-400 dark:text-slate-400">Schuhe</span>
                    <strong className="text-xs font-extrabold text-stone-800 dark:text-white">
                      {details.shoeSize || '—'}
                    </strong>
                  </div>

                  <div className="bg-white dark:bg-slate-800 p-2.5 rounded-2xl border border-amber-200/80 dark:border-amber-900/40 shadow-2xs">
                    <span className="block text-[10px] uppercase font-bold text-stone-400 dark:text-slate-400">Hose / Bund</span>
                    <strong className="text-xs font-extrabold text-stone-800 dark:text-white">
                      {details.pantsSize || '—'}
                    </strong>
                  </div>
                </div>
              </div>
            )}

            {/* ONLY FOR CHILDREN: PEDIATRICIAN & DENTIST */}
            {isChild && (
              <>
                {/* Doctor */}
                <div className="bg-emerald-50/70 dark:bg-emerald-950/20 p-4 rounded-3xl border-2 border-emerald-200 dark:border-emerald-900/40">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-extrabold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider flex items-center gap-1.5">
                      <HeartPulse className="w-4 h-4 text-emerald-600" />
                      <span>Kinderarzt</span>
                    </h4>
                    {details.doctorPhone && (
                      <a
                        href={`tel:${details.doctorPhone}`}
                        className="duo-btn duo-btn-green px-2.5 py-1 text-[11px] font-extrabold rounded-xl flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" />
                        <span>Anrufen</span>
                      </a>
                    )}
                  </div>

                  <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-stone-900 dark:text-white">
                        {details.doctorName || 'Kein Arzt eingetragen'}
                      </span>
                      {details.doctorPhone && (
                        <button
                          onClick={() => handleCopy(details.doctorPhone!, 'docPhone')}
                          className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
                        >
                          {copiedKey === 'docPhone' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          <span>{details.doctorPhone}</span>
                        </button>
                      )}
                    </div>

                    {details.doctorAddress && (
                      <div className="flex items-start justify-between gap-2 pt-1 border-t border-stone-100 dark:border-slate-700 text-xs text-stone-600 dark:text-slate-300">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{details.doctorAddress}</span>
                        </span>
                        <button
                          onClick={() => handleCopy(details.doctorAddress!, 'docAddr')}
                          className="text-[10px] font-bold text-stone-400 hover:text-stone-700 shrink-0 underline"
                        >
                          {copiedKey === 'docAddr' ? 'Kopiert!' : 'Kopieren'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Dentist */}
                {details.dentistName && (
                  <div className="bg-blue-50/70 dark:bg-blue-950/20 p-4 rounded-3xl border-2 border-blue-200 dark:border-blue-900/40">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-extrabold text-blue-900 dark:text-blue-200 uppercase tracking-wider flex items-center gap-1.5">
                        <span>🦷</span>
                        <span>Zahnarzt</span>
                      </h4>
                      {details.dentistPhone && (
                        <a
                          href={`tel:${details.dentistPhone}`}
                          className="duo-btn duo-btn-blue px-2.5 py-1 text-[11px] font-extrabold rounded-xl flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3" />
                          <span>Anrufen</span>
                        </a>
                      )}
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-blue-200/80 dark:border-blue-900/40 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-stone-900 dark:text-white">
                          {details.dentistName}
                        </span>
                        {details.dentistPhone && (
                          <span className="text-xs font-bold text-stone-600 dark:text-slate-300">
                            {details.dentistPhone}
                          </span>
                        )}
                      </div>
                      {details.dentistAddress && (
                        <p className="text-xs text-stone-500 dark:text-slate-400">{details.dentistAddress}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Allergies & School */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-rose-50/70 dark:bg-rose-950/20 p-3 rounded-2xl border-2 border-rose-200 dark:border-rose-900/40">
                    <span className="block text-[10px] uppercase font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1 mb-1">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> Allergien & Blutgruppe
                    </span>
                    <p className="text-xs font-extrabold text-stone-800 dark:text-white">
                      {details.allergies || 'Keine bekannt'}
                    </p>
                    {details.bloodType && (
                      <span className="inline-block mt-1 text-[10px] font-extrabold bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                        Blutgruppe: {details.bloodType}
                      </span>
                    )}
                  </div>

                  <div className="bg-purple-50/70 dark:bg-purple-950/20 p-3 rounded-2xl border-2 border-purple-200 dark:border-purple-900/40">
                    <span className="block text-[10px] uppercase font-bold text-purple-800 dark:text-purple-300 flex items-center gap-1 mb-1">
                      <GraduationCap className="w-3.5 h-3.5 text-purple-600" /> Schule & Kita
                    </span>
                    <p className="text-xs font-extrabold text-stone-800 dark:text-white truncate">
                      {details.schoolName || 'Nicht angegeben'}
                    </p>
                    {details.grade && (
                      <p className="text-[10px] text-stone-500 dark:text-slate-400 font-semibold mt-0.5">
                        {details.grade}
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* CUSTOMIZABLE INFORMATION SECTION */}
            <div className="bg-purple-50/70 dark:bg-purple-950/20 p-4 rounded-3xl border-2 border-purple-200 dark:border-purple-900/40 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-purple-900 dark:text-purple-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>Eigene Informationen ({activeCustomFields.length})</span>
                </h4>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-xs font-black text-purple-700 dark:text-purple-300 hover:underline"
                >
                  + Feld hinzufügen
                </button>
              </div>

              {activeCustomFields.length === 0 ? (
                <div className="text-center py-4 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-purple-200 dark:border-purple-800 text-stone-400 dark:text-slate-400 text-xs">
                  Noch keine eigenen Felder angelegt. Tippe auf "+ Feld hinzufügen", um beliebige Daten zu speichern!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activeCustomFields.map((field) => (
                    <div
                      key={field.id}
                      className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-purple-200 dark:border-purple-800 shadow-2xs space-y-0.5"
                    >
                      <span className="block text-[10px] font-extrabold text-stone-400 dark:text-slate-400 uppercase tracking-wider">
                        {field.label}
                      </span>
                      <strong className="text-xs font-black text-stone-800 dark:text-white block">
                        {field.value}
                      </strong>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="duo-btn duo-btn-purple px-5 py-2.5 text-xs font-extrabold rounded-2xl"
              >
                ✏️ Felder bearbeiten
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
