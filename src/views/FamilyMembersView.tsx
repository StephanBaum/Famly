import React, { useState } from 'react';
import { useFamily } from '../context/FamilyContext';
import { FamilyMember } from '../types';
import { Plus, Edit2, Calendar, QrCode, Sparkles } from 'lucide-react';
import { MemberProfileModal } from '../components/MemberProfileModal';
import { ModalPortal } from '../components/ModalPortal';
import { JoinFamilyQRModal } from '../components/JoinFamilyQRModal';

const AVATAR_OPTIONS = ['👩‍💼', '👨‍💻', '👦', '👧', '👵', '👴', '👶', '🐶', '🐱', '⚽', '🎨', '🚀', '🌟', '📚'];
const COLOR_OPTIONS = ['#EC4899', '#0D9488', '#F59E0B', '#8B5CF6', '#3B82F6', '#10B981', '#F43F5E', '#6366F1'];

export const FamilyMembersView: React.FC = () => {
  const { members, addMember, updateMember, loggedInMemberId } = useFamily();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isJoinQROpen, setIsJoinQROpen] = useState(false);
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
      <div className="duo-card p-6 bg-white dark:bg-slate-900 border-2 border-stone-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 flex items-center justify-center font-black text-2xl">
            🧸
          </div>
          <div>
            <h2 className="text-xl font-black text-stone-900 dark:text-white">Kinder & Familienmitglieder</h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsJoinQROpen(true)}
            className="duo-btn duo-btn-white px-3.5 py-2.5 text-xs font-black rounded-2xl flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800"
          >
            <QrCode className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Gerät verbinden (QR)</span>
          </button>

          <button
            onClick={openAddModal}
            className="duo-btn duo-btn-purple px-4 py-2.5 text-xs font-black rounded-2xl"
          >
            <Plus className="w-4 h-4 mr-1 stroke-[3]" />
            <span>Mitglied hinzufügen</span>
          </button>
        </div>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map((member) => {
          const isLoggedIn = member.id === loggedInMemberId;
          const isChild = Boolean(
            member.isChild ||
              member.role.toLowerCase().includes('sohn') ||
              member.role.toLowerCase().includes('tochter') ||
              member.role.toLowerCase().includes('kind') ||
              member.role.toLowerCase().includes('son') ||
              member.role.toLowerCase().includes('daughter') ||
              member.role.toLowerCase().includes('child')
          );
          const details = member.childDetails || {};

          return (
            <div
              key={member.id}
              className={`duo-card p-6 bg-white dark:bg-slate-900 border-2 ${
                isLoggedIn ? 'border-purple-300 dark:border-purple-700 ring-2 ring-purple-400/20' : 'border-stone-200 dark:border-slate-800'
              } flex flex-col justify-between transition-all`}
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
                        <h3 className="font-black text-stone-900 dark:text-white text-base">{member.name}</h3>
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: member.color }}
                        />
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs font-extrabold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2.5 py-0.5 rounded-full border border-purple-200 dark:border-purple-800">
                          {member.role}
                        </span>
                        {isChild && (
                          <span className="text-[10px] font-black text-amber-800 dark:text-amber-200 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.2 rounded-full border border-amber-300 dark:border-amber-700">
                            Kind
                          </span>
                        )}
                        {isLoggedIn && (
                          <span className="text-[10px] font-black text-emerald-800 dark:text-emerald-200 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.2 rounded-full border border-emerald-300 dark:border-emerald-700">
                            Dein Profil
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => openEditModal(member)}
                    className="p-1.5 text-stone-300 hover:text-stone-700 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    title="Bearbeiten"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>

                {member.birthday && (
                  <p className="text-xs text-stone-500 dark:text-slate-400 font-semibold flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-stone-400" />
                    <span>Geburtstag: {member.birthday}</span>
                  </p>
                )}

                {/* 10x HIGHLIGHTS & STECKBRIEF TAGS */}
                {(() => {
                  const tags: Array<{ label: string; isAllergy?: boolean }> = [];
                  const memberInterests = Array.isArray(member.interests)
                    ? member.interests
                    : (details.interests || []);
                  
                  memberInterests.slice(0, 3).forEach((tag) => tags.push({ label: tag }));

                  const cSize = member.clothingSize || details.clothingSize;
                  if (cSize) tags.push({ label: `👕 Gr. ${cSize}` });

                  const sSize = member.shoeSize || details.shoeSize;
                  if (sSize) tags.push({ label: `👟 Gr. ${sSize}` });

                  const mAllergies = member.allergies || details.allergies;
                  if (mAllergies) tags.push({ label: `⚠️ ${mAllergies}`, isAllergy: true });

                  if (tags.length > 0) {
                    return (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] font-black uppercase text-stone-400 dark:text-slate-500 tracking-wider">
                          Steckbrief-Highlights
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {tags.slice(0, 5).map((t, idx) => (
                            <span
                              key={idx}
                              className={`text-xs px-2.5 py-1 rounded-xl font-bold border transition-all truncate max-w-[170px] ${
                                t.isAllergy
                                  ? 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:text-rose-200 dark:border-rose-900'
                                  : 'bg-stone-50 dark:bg-slate-800/80 text-stone-700 dark:text-slate-200 border-stone-200 dark:border-slate-700'
                              }`}
                            >
                              {t.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <button
                      type="button"
                      onClick={() => setSelectedDetailsMember(member)}
                      className="w-full py-3 px-3 rounded-2xl border-2 border-dashed border-purple-200 dark:border-purple-900/50 bg-purple-50/40 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300 hover:bg-purple-50 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors group"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-purple-500 group-hover:rotate-12 transition-transform" />
                      <span>+ Steckbrief ausfüllen (Hobbys, Maße & Notfall)</span>
                    </button>
                  );
                })()}

                {member.notes && (
                  <p className="text-xs text-stone-500 dark:text-slate-400 bg-stone-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-stone-200 dark:border-slate-700 font-medium line-clamp-2">
                    {member.notes}
                  </p>
                )}
              </div>

              {/* Clean Single Action Footer */}
              <div className="mt-5 pt-3 border-t-2 border-stone-100 dark:border-slate-800 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedDetailsMember(member)}
                  className={`duo-btn px-4 py-2.5 text-xs font-black rounded-xl flex-1 flex items-center justify-center gap-1.5 ${
                    isChild ? 'duo-btn-purple' : 'duo-btn-white text-stone-800 dark:text-white border-stone-300 dark:border-slate-700'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isChild ? '🧸 Kinder-Pass & Größen' : '✨ Steckbrief & Infos öffnen'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => openEditModal(member)}
                  className="p-2.5 rounded-xl text-stone-400 hover:text-stone-800 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors border border-stone-200 dark:border-slate-700 shrink-0"
                  title="Name & Avatar anpassen"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {members.length === 0 && (
        <div className="p-12 text-center duo-card bg-white dark:bg-slate-900 border-2 border-dashed border-stone-200 dark:border-slate-800 space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 mx-auto flex items-center justify-center text-3xl shadow-xs">
            👨‍👩‍👧‍👦
          </div>
          <h4 className="text-base font-black text-stone-900 dark:text-white">
            Noch keine Familienmitglieder angelegt
          </h4>
          <p className="text-xs text-stone-500 dark:text-slate-400 max-w-md mx-auto">
            Füge Eltern, Kinder oder Großeltern hinzu, um Aufgaben, Termine und Vorlieben individuell zuzuordnen.
          </p>
          <button
            onClick={openAddModal}
            className="duo-btn duo-btn-purple px-5 py-2.5 text-xs font-black rounded-xl inline-flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Erstes Mitglied hinzufügen</span>
          </button>
        </div>
      )}

      {/* Member Profile Modal */}
      {selectedDetailsMember && (
        <MemberProfileModal
          member={selectedDetailsMember}
          isOpen={true}
          onClose={() => setSelectedDetailsMember(null)}
        />
      )}

      {/* Add / Edit Member Modal */}
      {isModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-xl border-2 border-stone-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
              <h3 className="text-lg font-black text-stone-900 dark:text-white mb-1">
                {editingMember ? 'Mitglied bearbeiten' : 'Familienmitglied hinzufügen'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-extrabold text-stone-600 dark:text-slate-300 uppercase mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    placeholder="z.B. Leo, Mia, Oma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-sm focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-stone-600 dark:text-slate-300 uppercase mb-1">
                    Rolle
                  </label>
                  <input
                    type="text"
                    placeholder="z.B. Mama, Papa, Sohn (12), Tochter (8)"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-sm focus:outline-none"
                    required
                  />
                </div>

                {/* Avatar Picker */}
                <div>
                  <label className="block text-xs font-extrabold text-stone-600 dark:text-slate-300 uppercase mb-1.5">
                    Avatar wählen
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {AVATAR_OPTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setAvatar(emoji)}
                        className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center border-2 transition-all ${
                          avatar === emoji
                            ? 'bg-purple-100 dark:bg-purple-950 border-purple-500 scale-110 shadow-2xs'
                            : 'bg-stone-50 dark:bg-slate-800 border-stone-200 dark:border-slate-700 hover:bg-stone-100'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Picker */}
                <div>
                  <label className="block text-xs font-extrabold text-stone-600 dark:text-slate-300 uppercase mb-1.5">
                    Farbe
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
                  <label className="block text-xs font-extrabold text-stone-600 dark:text-slate-300 uppercase mb-1">
                    Geburtstag (optional)
                  </label>
                  <input
                    type="date"
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-stone-600 dark:text-slate-300 uppercase mb-1">
                    Notizen
                  </label>
                  <input
                    type="text"
                    placeholder="z.B. Liebt Robotik, Kunst, Fußball"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-sm focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="duo-btn duo-btn-white px-4 py-2 text-xs font-bold rounded-xl"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    className="duo-btn duo-btn-purple px-5 py-2 text-xs font-black rounded-xl"
                  >
                    Speichern
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Join Family / Connect Device QR Modal */}
      <JoinFamilyQRModal
        isOpen={isJoinQROpen}
        onClose={() => setIsJoinQROpen(false)}
      />
    </div>
  );
};
