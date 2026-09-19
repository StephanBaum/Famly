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
      // Adult member update
      updateMember(member.id, {
        customFields,
      });
    }

    setIsEditing(false);
  };

  const details = member.childDetails || {};
  const activeCustomFields = member.customFields || details.customFields || [];

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border-2 border-stone-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border-2 shadow-sm"
              style={{ backgroundColor: `${member.color}15`, borderColor: `${member.color}40` }}
            >
              {member.avatar}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-extrabold text-stone-900">{member.name}</h3>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700">
                  {member.role}
                </span>
              </div>
              <p className="text-xs font-semibold text-stone-500">
                {isChild ? '🧸 Child Passport • Sizes, Medical & Custom Info' : '👤 Member Profile & Custom Info'}
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
                ✏️ Edit Info
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold flex items-center justify-center text-sm"
            >
              ✕
            </button>
          </div>
        </div>

        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-5">
            
            {/* ONLY FOR CHILDREN: CLOTHING & SHOE SIZES */}
            {isChild && (
              <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200/80 space-y-2">
                <h4 className="text-xs font-extrabold text-amber-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Shirt className="w-4 h-4 text-amber-600" />
                  <span>Wardrobe & Footwear Sizes</span>
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">Top / Clothes</label>
                    <input
                      type="text"
                      placeholder="e.g. Youth M (10-12)"
                      value={clothingSize}
                      onChange={(e) => setClothingSize(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-stone-300 text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">Shoe Size</label>
                    <input
                      type="text"
                      placeholder="e.g. US 6 / EU 38"
                      value={shoeSize}
                      onChange={(e) => setShoeSize(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-stone-300 text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">Pants / Waist</label>
                    <input
                      type="text"
                      placeholder="e.g. 10 Slim"
                      value={pantsSize}
                      onChange={(e) => setPantsSize(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-stone-300 text-xs focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ONLY FOR CHILDREN: DOCTOR & CLINIC */}
            {isChild && (
              <>
                <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200/80">
                  <h4 className="text-xs font-extrabold text-emerald-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <HeartPulse className="w-4 h-4 text-emerald-600" />
                    <span>Pediatrician / Primary Doctor</span>
                  </h4>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-stone-600 mb-1">Doctor Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Dr. Emily Hayes"
                          value={doctorName}
                          onChange={(e) => setDoctorName(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-xl border border-stone-300 text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-stone-600 mb-1">Phone Number</label>
                        <input
                          type="text"
                          placeholder="e.g. (555) 342-9100"
                          value={doctorPhone}
                          onChange={(e) => setDoctorPhone(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-xl border border-stone-300 text-xs focus:outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">Clinic Address</label>
                      <input
                        type="text"
                        placeholder="e.g. Oak Valley Clinic, 420 Blossom Ave"
                        value={doctorAddress}
                        onChange={(e) => setDoctorAddress(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-stone-300 text-xs focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-200/80">
                  <h4 className="text-xs font-extrabold text-blue-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span>🦷</span>
                    <span>Dentist</span>
                  </h4>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-stone-600 mb-1">Dentist Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Dr. Peter Vance"
                          value={dentistName}
                          onChange={(e) => setDentistName(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-xl border border-stone-300 text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-stone-600 mb-1">Phone Number</label>
                        <input
                          type="text"
                          placeholder="e.g. (555) 883-2040"
                          value={dentistPhone}
                          onChange={(e) => setDentistPhone(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-xl border border-stone-300 text-xs focus:outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">Dental Clinic Address</label>
                      <input
                        type="text"
                        placeholder="e.g. Valley Smiles, 108 River St"
                        value={dentistAddress}
                        onChange={(e) => setDentistAddress(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-stone-300 text-xs focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">Allergies / Alerts</label>
                    <input
                      type="text"
                      placeholder="e.g. Peanut allergy, asthma"
                      value={allergies}
                      onChange={(e) => setAllergies(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-stone-300 text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">Blood Type</label>
                    <input
                      type="text"
                      placeholder="e.g. O+, A+"
                      value={bloodType}
                      onChange={(e) => setBloodType(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-stone-300 text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">School Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Lincoln Middle School"
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-stone-300 text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">Grade / Teacher</label>
                    <input
                      type="text"
                      placeholder="e.g. 7th Grade (Room 104)"
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-stone-300 text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">Emergency Contact</label>
                  <input
                    type="text"
                    placeholder="e.g. Sarah Miller (Mom): (555) 712-4401"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-stone-300 text-xs focus:outline-none"
                  />
                </div>
              </>
            )}

            {/* CUSTOMIZABLE INFORMATION FIELDS (FOR BOTH KIDS & ADULTS!) */}
            <div className="bg-purple-50/70 p-4 rounded-2xl border-2 border-purple-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>Custom Information Fields</span>
                </h4>
                <span className="text-[10px] font-bold text-purple-600">
                  Add any info your family needs
                </span>
              </div>

              {/* Active custom fields in edit form */}
              {customFields.length > 0 && (
                <div className="space-y-2">
                  {customFields.map((field) => (
                    <div
                      key={field.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-white border border-purple-200 text-xs"
                    >
                      <div>
                        <strong className="text-stone-800">{field.label}:</strong>{' '}
                        <span className="text-stone-600">{field.value}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteCustomField(field.id)}
                        className="text-stone-300 hover:text-rose-600 p-1"
                        title="Delete field"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* New Field Adder */}
              <div className="p-3 bg-white rounded-xl border border-purple-200 space-y-2">
                <span className="block text-[11px] font-extrabold text-stone-700">
                  + Add New Info Field
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Field name (e.g. Helmet, Club ID)..."
                    value={newFieldLabel}
                    onChange={(e) => setNewFieldLabel(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Value (e.g. 54cm, #9041)..."
                    value={newFieldValue}
                    onChange={(e) => setNewFieldValue(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs focus:outline-none"
                  />
                  <select
                    value={newFieldCategory}
                    onChange={(e) => setNewFieldCategory(e.target.value as 'sizes' | 'health' | 'school' | 'other')}
                    className="px-2 py-1.5 rounded-lg border border-stone-300 text-xs focus:outline-none bg-white font-semibold text-stone-700"
                  >
                    <option value="sizes">Sizes & Gear</option>
                    <option value="health">Health & Medical</option>
                    <option value="school">School / Activities</option>
                    <option value="other">General / Other</option>
                  </select>
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleAddCustomField}
                    disabled={!newFieldLabel.trim() || !newFieldValue.trim()}
                    className="duo-btn duo-btn-purple px-3 py-1 text-xs font-black rounded-lg disabled:opacity-50"
                  >
                    + Add Field
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="duo-btn duo-btn-white px-4 py-2 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="duo-btn duo-btn-green px-5 py-2 text-xs font-extrabold rounded-xl"
              >
                Save Details
              </button>
            </div>
          </form>
        ) : (
          /* READ ONLY VIEW */
          <div className="space-y-4">
            
            {/* ONLY FOR CHILDREN: WARDROBE SIZES */}
            {isChild && (
              <div className="bg-amber-50/70 p-4 rounded-3xl border-2 border-amber-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Shirt className="w-4 h-4 text-amber-600" />
                    <span>Wardrobe & Footwear Sizes</span>
                  </h4>
                  <span className="text-[10px] font-bold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full">
                    Kid Sizes
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white p-2.5 rounded-2xl border border-amber-200/80 shadow-2xs">
                    <span className="block text-[10px] uppercase font-bold text-stone-400">Clothes / Top</span>
                    <strong className="text-xs font-extrabold text-stone-800">
                      {details.clothingSize || '—'}
                    </strong>
                  </div>

                  <div className="bg-white p-2.5 rounded-2xl border border-amber-200/80 shadow-2xs">
                    <span className="block text-[10px] uppercase font-bold text-stone-400">Shoe Size</span>
                    <strong className="text-xs font-extrabold text-stone-800">
                      {details.shoeSize || '—'}
                    </strong>
                  </div>

                  <div className="bg-white p-2.5 rounded-2xl border border-amber-200/80 shadow-2xs">
                    <span className="block text-[10px] uppercase font-bold text-stone-400">Pants / Waist</span>
                    <strong className="text-xs font-extrabold text-stone-800">
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
                <div className="bg-emerald-50/70 p-4 rounded-3xl border-2 border-emerald-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-extrabold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                      <HeartPulse className="w-4 h-4 text-emerald-600" />
                      <span>Pediatrician / Doctor</span>
                    </h4>
                    {details.doctorPhone && (
                      <a
                        href={`tel:${details.doctorPhone}`}
                        className="duo-btn duo-btn-green px-2.5 py-1 text-[11px] font-extrabold rounded-xl flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" />
                        <span>Call</span>
                      </a>
                    )}
                  </div>

                  <div className="bg-white p-3 rounded-2xl border border-emerald-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-stone-900">
                        {details.doctorName || 'No doctor listed'}
                      </span>
                      {details.doctorPhone && (
                        <button
                          onClick={() => handleCopy(details.doctorPhone!, 'docPhone')}
                          className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
                        >
                          {copiedKey === 'docPhone' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          <span>{details.doctorPhone}</span>
                        </button>
                      )}
                    </div>

                    {details.doctorAddress && (
                      <div className="flex items-start justify-between gap-2 pt-1 border-t border-stone-100 text-xs text-stone-600">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{details.doctorAddress}</span>
                        </span>
                        <button
                          onClick={() => handleCopy(details.doctorAddress!, 'docAddr')}
                          className="text-[10px] font-bold text-stone-400 hover:text-stone-700 shrink-0 underline"
                        >
                          {copiedKey === 'docAddr' ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Dentist */}
                {details.dentistName && (
                  <div className="bg-blue-50/70 p-4 rounded-3xl border-2 border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-extrabold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                        <span>🦷</span>
                        <span>Dentist</span>
                      </h4>
                      {details.dentistPhone && (
                        <a
                          href={`tel:${details.dentistPhone}`}
                          className="duo-btn duo-btn-blue px-2.5 py-1 text-[11px] font-extrabold rounded-xl flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3" />
                          <span>Call</span>
                        </a>
                      )}
                    </div>

                    <div className="bg-white p-3 rounded-2xl border border-blue-200/80 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-stone-900">
                          {details.dentistName}
                        </span>
                        {details.dentistPhone && (
                          <span className="text-xs font-bold text-stone-600">
                            {details.dentistPhone}
                          </span>
                        )}
                      </div>
                      {details.dentistAddress && (
                        <p className="text-xs text-stone-500">{details.dentistAddress}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Allergies & School */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-rose-50/70 p-3 rounded-2xl border-2 border-rose-200">
                    <span className="block text-[10px] uppercase font-bold text-rose-800 flex items-center gap-1 mb-1">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> Allergies & Blood
                    </span>
                    <p className="text-xs font-extrabold text-stone-800">
                      {details.allergies || 'None reported'}
                    </p>
                    {details.bloodType && (
                      <span className="inline-block mt-1 text-[10px] font-extrabold bg-white px-2 py-0.5 rounded-md text-rose-700 border border-rose-200">
                        Blood: {details.bloodType}
                      </span>
                    )}
                  </div>

                  <div className="bg-purple-50/70 p-3 rounded-2xl border-2 border-purple-200">
                    <span className="block text-[10px] uppercase font-bold text-purple-800 flex items-center gap-1 mb-1">
                      <GraduationCap className="w-3.5 h-3.5 text-purple-600" /> School
                    </span>
                    <p className="text-xs font-extrabold text-stone-800 truncate">
                      {details.schoolName || 'Not specified'}
                    </p>
                    {details.grade && (
                      <p className="text-[10px] text-stone-500 font-semibold mt-0.5">
                        {details.grade}
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* CUSTOMIZABLE INFORMATION SECTION (FOR BOTH KIDS & ADULTS!) */}
            <div className="bg-purple-50/70 p-4 rounded-3xl border-2 border-purple-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>Custom Household Information ({activeCustomFields.length})</span>
                </h4>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-xs font-black text-purple-700 hover:underline"
                >
                  + Add Custom Field
                </button>
              </div>

              {activeCustomFields.length === 0 ? (
                <div className="text-center py-4 bg-white rounded-2xl border border-dashed border-purple-200 text-stone-400 text-xs">
                  No custom fields added yet. Tap "+ Add Custom Field" to save anything you need!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activeCustomFields.map((field) => (
                    <div
                      key={field.id}
                      className="bg-white p-3 rounded-2xl border border-purple-200 shadow-2xs space-y-0.5"
                    >
                      <span className="block text-[10px] font-extrabold text-stone-400 uppercase tracking-wider">
                        {field.label}
                      </span>
                      <strong className="text-xs font-black text-stone-800 block">
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
                ✏️ Customize Info Fields
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
