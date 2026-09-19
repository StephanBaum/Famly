import React, { useState } from 'react';
import { useFamily } from '../context/FamilyContext';
import { FamilyMember } from '../types';
import { Plus, Edit2, Calendar, Shirt, HeartPulse } from 'lucide-react';
import { ChildDetailsModal } from '../components/ChildDetailsModal';

const AVATAR_OPTIONS = ['👩‍💼', '👨‍💻', '👦', '👧', '👵', '👴', '👶', '🐶', '🐱', '⚽', '🎨', '🚀', '🌟', '📚'];
const COLOR_OPTIONS = ['#EC4899', '#0D9488', '#F59E0B', '#8B5CF6', '#3B82F6', '#10B981', '#F43F5E', '#6366F1'];

export const FamilyMembersView: React.FC = () => {
  const { members, addMember, updateMember, currentMemberId, setCurrentMemberId } = useFamily();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [selectedDetailsMember, setSelectedDetailsMember] = useState<FamilyMember | null>(null);

  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [avatar, setAvatar] = useState('👩‍💼');
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [birthday, setBirthday] = useState('');
  const [notes, setNotes] = useState('');

  const openAddModal = () => {
    setEditingMember(null);
    setName('');
    setRole('');
    setAvatar('👩‍💼');
    setColor(COLOR_OPTIONS[members.length % COLOR_OPTIONS.length]);
    setBirthday('');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (m: FamilyMember) => {
    setEditingMember(m);
    setName(m.name);
    setRole(m.role);
    setAvatar(m.avatar);
    setColor(m.color);
    setBirthday(m.birthday || '');
    setNotes(m.notes || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !role.trim()) return;

    if (editingMember) {
      updateMember(editingMember.id, {
        name: name.trim(),
        role: role.trim(),
        avatar,
        color,
        birthday: birthday || undefined,
        notes: notes.trim() || undefined,
      });
    } else {
      addMember({
        name: name.trim(),
        role: role.trim(),
        avatar,
        color,
        bgLight: 'bg-stone-50',
        borderClass: 'border-stone-300',
        textClass: 'text-stone-800',
        birthday: birthday || undefined,
        notes: notes.trim() || undefined,
        childDetails: {},
      });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="duo-card p-6 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-black text-2xl">
            🧸
          </div>
          <div>
            <h2 className="text-xl font-black text-stone-900">Kids & Family Details</h2>
            <p className="text-xs font-bold text-stone-400">
              Clothing sizes, doctor & dentist clinics, school information, and member profiles
            </p>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="duo-btn duo-btn-purple px-4 py-2.5 text-xs font-black rounded-2xl"
        >
          <Plus className="w-4 h-4 mr-1 stroke-[3]" />
          <span>Add Family Member</span>
        </button>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map((member) => {
          const isCurrent = currentMemberId === member.id;
          const isChild = Boolean(
            member.isChild ||
              member.role.toLowerCase().includes('son') ||
              member.role.toLowerCase().includes('daughter') ||
              member.role.toLowerCase().includes('child')
          );
          const details = member.childDetails || {};
          const customFields = member.customFields || details.customFields || [];

          return (
            <div
              key={member.id}
              className={`duo-card p-6 bg-white flex flex-col justify-between transition-all ${
                isCurrent ? 'border-purple-400 ring-2 ring-purple-400/30' : ''
              }`}
            >
              <div className="space-y-4">
                
                {/* Member Top Bar */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl border-2 shadow-2xs"
                      style={{ backgroundColor: `${member.color}15`, borderColor: `${member.color}40` }}
                    >
                      {member.avatar}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-black text-stone-900 text-base">{member.name}</h3>
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: member.color }}
                        />
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs font-extrabold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                          {member.role}
                        </span>
                        {isChild && (
                          <span className="text-[10px] font-black text-amber-800 bg-amber-100 px-2 py-0.2 rounded-full border border-amber-300">
                            Child
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => openEditModal(member)}
                    className="p-1.5 text-stone-300 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors"
                    title="Edit name/avatar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>

                {member.birthday && (
                  <p className="text-xs text-stone-500 font-semibold flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-stone-400" />
                    <span>Birthday: {member.birthday}</span>
                  </p>
                )}

                {/* KID-SPECIFIC SIZES & CLINIC PREVIEW CARD */}
                {isChild ? (
                  <div className="bg-amber-50/50 p-3.5 rounded-2xl border-2 border-amber-200/80 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-black text-amber-900 tracking-wider">
                        Kid Sizes & Care Info
                      </span>
                      <button
                        onClick={() => setSelectedDetailsMember(member)}
                        className="text-[11px] font-extrabold text-purple-700 hover:underline"
                      >
                        Open Passport →
                      </button>
                    </div>

                    {/* Sizes chips */}
                    <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                      <div className="bg-white px-2 py-1 rounded-xl border border-stone-200 flex items-center gap-1">
                        <Shirt className="w-3 h-3 text-amber-500" />
                        <span className="font-semibold text-stone-600 truncate">
                          {details.clothingSize || 'Sizes not set'}
                        </span>
                      </div>
                      <div className="bg-white px-2 py-1 rounded-xl border border-stone-200 flex items-center gap-1">
                        <span>👟</span>
                        <span className="font-semibold text-stone-600 truncate">
                          {details.shoeSize || 'Shoe not set'}
                        </span>
                      </div>
                    </div>

                    {/* Doctor preview */}
                    {details.doctorName && (
                      <div className="text-[11px] text-stone-600 flex items-center gap-1 bg-white px-2 py-1 rounded-xl border border-stone-200 truncate">
                        <HeartPulse className="w-3 h-3 text-emerald-500 shrink-0" />
                        <span className="font-semibold truncate">{details.doctorName}</span>
                      </div>
                    )}

                    {/* Custom fields preview */}
                    {customFields.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {customFields.slice(0, 2).map((cf) => (
                          <span
                            key={cf.id}
                            className="text-[10px] bg-white px-2 py-0.5 rounded-lg border border-amber-200 font-bold text-stone-700 truncate max-w-[150px]"
                          >
                            {cf.label}: {cf.value}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  /* ADULT / PARENT INFORMATION & CUSTOM FIELDS */
                  <div className="bg-stone-50 p-3.5 rounded-2xl border-2 border-stone-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-black text-stone-500 tracking-wider">
                        Personal & Household Info
                      </span>
                      <button
                        onClick={() => setSelectedDetailsMember(member)}
                        className="text-[11px] font-extrabold text-purple-700 hover:underline"
                      >
                        + Add Custom Info →
                      </button>
                    </div>

                    {customFields.length > 0 ? (
                      <div className="space-y-1.5">
                        {customFields.map((cf) => (
                          <div
                            key={cf.id}
                            className="bg-white px-2.5 py-1.5 rounded-xl border border-stone-200 flex items-center justify-between text-xs"
                          >
                            <span className="font-bold text-stone-500">{cf.label}:</span>
                            <span className="font-black text-stone-800">{cf.value}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-stone-400 italic bg-white p-2.5 rounded-xl border border-stone-200">
                        No custom notes added. Click "+ Add Custom Info" to save health or personal details.
                      </p>
                    )}
                  </div>
                )}

                {member.notes && (
                  <p className="text-xs text-stone-500 bg-white p-2.5 rounded-xl border border-stone-200 font-medium">
                    {member.notes}
                  </p>
                )}
              </div>

              {/* Card Footer */}
              <div className="mt-5 pt-3 border-t-2 border-stone-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedDetailsMember(member)}
                  className={`duo-btn px-3 py-1.5 text-xs font-black rounded-xl flex-1 ${
                    isChild ? 'duo-btn-purple' : 'duo-btn-white text-stone-700'
                  }`}
                >
                  {isChild ? '🧸 Kid Passport & Sizes' : '👤 Member Details & Custom Info'}
                </button>

                <button
                  onClick={() => setCurrentMemberId(member.id)}
                  className={`duo-btn px-3 py-1.5 text-xs font-extrabold rounded-xl ${
                    isCurrent
                      ? 'bg-stone-900 text-white'
                      : 'duo-btn-white'
                  }`}
                >
                  {isCurrent ? 'Active' : 'Switch'}
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* Child Details Modal */}
      {selectedDetailsMember && (
        <ChildDetailsModal
          member={selectedDetailsMember}
          isOpen={true}
          onClose={() => setSelectedDetailsMember(null)}
        />
      )}

      {/* Add / Edit Member Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border-2 border-stone-200 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-black text-stone-900 mb-1">
              {editingMember ? 'Edit Family Member' : 'Add Family Member'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-stone-600 uppercase mb-1">
                  Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Leo, Mia, Grandma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-stone-600 uppercase mb-1">
                  Role
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mom, Dad, Son (12), Daughter (8)"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-none"
                  required
                />
              </div>

              {/* Avatar Picker */}
              <div>
                <label className="block text-xs font-extrabold text-stone-600 uppercase mb-1.5">
                  Pick Avatar
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVATAR_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setAvatar(emoji)}
                      className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center border-2 transition-all ${
                        avatar === emoji
                          ? 'bg-purple-100 border-purple-500 scale-110 shadow-2xs'
                          : 'bg-stone-50 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Picker */}
              <div>
                <label className="block text-xs font-extrabold text-stone-600 uppercase mb-1.5">
                  Accent Color
                </label>
                <div className="flex items-center gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      style={{ backgroundColor: c }}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        color === c ? 'scale-125 ring-2 ring-offset-2 ring-stone-800' : 'hover:scale-110'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-stone-600 uppercase mb-1">
                  Birthday (optional)
                </label>
                <input
                  type="date"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-stone-600 uppercase mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Loves robotics, art, soccer"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="duo-btn duo-btn-white px-4 py-2 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="duo-btn duo-btn-purple px-5 py-2 text-xs font-black rounded-xl"
                >
                  Save Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
