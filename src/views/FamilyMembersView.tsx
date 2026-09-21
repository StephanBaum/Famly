import React, { useState } from 'react';
import { useFamily } from '../context/FamilyContext';
import { FamilyMember } from '../types';
import { Plus, Edit2, Calendar, Shirt, HeartPulse, QrCode } from 'lucide-react';
import { ChildDetailsModal } from '../components/ChildDetailsModal';
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
  const [detailsInitialEditMode, setDetailsInitialEditMode] = useState<boolean>(false);

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
            <p className="text-xs font-bold text-stone-400 dark:text-slate-400">
              Kleidergrößen, Kinderarzt, Schulinformationen und persönliche Profile
            </p>
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
          const customFields = member.customFields || details.customFields || [];

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

                {/* KID-SPECIFIC SIZES & CLINIC PREVIEW CARD */}
                {isChild ? (
                  <div className="bg-amber-50/50 dark:bg-amber-950/20 p-3.5 rounded-2xl border-2 border-amber-200/80 dark:border-amber-900/40 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-black text-amber-900 dark:text-amber-200 tracking-wider">
                        🧸 Kinder-Pass
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedDetailsMember(member);
                            setDetailsInitialEditMode(false);
                          }}
                          className="text-[11px] font-extrabold text-purple-700 dark:text-purple-300 hover:underline"
                        >
                          Pass ansehen
                        </button>
                        <span className="text-stone-300 dark:text-slate-600">•</span>
                        <button
                          onClick={() => {
                            setSelectedDetailsMember(member);
                            setDetailsInitialEditMode(true);
                          }}
                          className="text-[11px] font-black text-amber-700 dark:text-amber-400 hover:underline"
                        >
                          ✏️ Bearbeiten
                        </button>
                      </div>
                    </div>

                    {/* Sizes chips */}
                    <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                      <div className="bg-white dark:bg-slate-800 px-2 py-1 rounded-xl border border-stone-200 dark:border-slate-700 flex items-center gap-1">
                        <Shirt className="w-3 h-3 text-amber-500" />
                        <span className="font-semibold text-stone-600 dark:text-slate-300 truncate">
                          {details.clothingSize || 'Größe k.A.'}
                        </span>
                      </div>
                      <div className="bg-white dark:bg-slate-800 px-2 py-1 rounded-xl border border-stone-200 dark:border-slate-700 flex items-center gap-1">
                        <span>👟</span>
                        <span className="font-semibold text-stone-600 dark:text-slate-300 truncate">
                          {details.shoeSize || 'Schuhe k.A.'}
                        </span>
                      </div>
                    </div>

                    {/* Doctor preview */}
                    {details.doctorName && (
                      <div className="text-[11px] text-stone-600 dark:text-slate-300 flex items-center gap-1 bg-white dark:bg-slate-800 px-2 py-1 rounded-xl border border-stone-200 dark:border-slate-700 truncate">
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
                            className="text-[10px] bg-white dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-amber-200 dark:border-amber-900/60 font-bold text-stone-700 dark:text-slate-300 truncate max-w-[150px]"
                          >
                            {cf.label}: {cf.value}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  /* ADULT / PARENT INFORMATION & CUSTOM FIELDS */
                  <div className="bg-stone-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border-2 border-stone-200/80 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-black text-stone-500 dark:text-slate-400 tracking-wider">
                        Persönliche Infos
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedDetailsMember(member);
                            setDetailsInitialEditMode(false);
                          }}
                          className="text-[11px] font-extrabold text-purple-700 dark:text-purple-300 hover:underline"
                        >
                          Ansehen
                        </button>
                        <span className="text-stone-300 dark:text-slate-600">•</span>
                        <button
                          onClick={() => {
                            setSelectedDetailsMember(member);
                            setDetailsInitialEditMode(true);
                          }}
                          className="text-[11px] font-black text-amber-700 dark:text-amber-400 hover:underline"
                        >
                          ✏️ Bearbeiten
                        </button>
                      </div>
                    </div>

                    {customFields.length > 0 ? (
                      <div className="space-y-1.5">
                        {customFields.map((cf) => (
                          <div
                            key={cf.id}
                            className="bg-white dark:bg-slate-800 px-2.5 py-1.5 rounded-xl border border-stone-200 dark:border-slate-700 flex items-center justify-between text-xs"
                          >
                            <span className="font-bold text-stone-500 dark:text-slate-400">{cf.label}:</span>
                            <span className="font-black text-stone-800 dark:text-white">{cf.value}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-stone-400 italic bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-stone-200 dark:border-slate-700">
                        Keine Notizen hinterlegt. Klicke auf "+ Infos bearbeiten" für wichtige persönliche Angaben.
                      </p>
                    )}
                  </div>
                )}

                {member.notes && (
                  <p className="text-xs text-stone-500 dark:text-slate-400 bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-stone-200 dark:border-slate-700 font-medium">
                    {member.notes}
                  </p>
                )}
              </div>

              {/* Card Footer */}
              <div className="mt-5 pt-3 border-t-2 border-stone-100 dark:border-slate-800 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDetailsMember(member);
                    setDetailsInitialEditMode(false);
                  }}
                  className={`duo-btn px-3 py-2 text-xs font-black rounded-xl flex-1 ${
                    isChild ? 'duo-btn-purple' : 'duo-btn-white text-stone-700 dark:text-slate-200'
                  }`}
                >
                  {isChild ? '🧸 Kinder-Pass öffnen' : '👤 Profil & Details'}
                </button>

                <button
                  type="button"
                  onClick={() => openEditModal(member)}
                  className="duo-btn duo-btn-white px-3 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 text-stone-600 dark:text-slate-300 hover:text-stone-900 dark:hover:text-white shrink-0"
                  title="Basisdaten bearbeiten"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Bearbeiten</span>
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

      {/* Child Details Modal */}
      {selectedDetailsMember && (
        <ChildDetailsModal
          member={selectedDetailsMember}
          isOpen={true}
          initialEditMode={detailsInitialEditMode}
          onClose={() => {
            setSelectedDetailsMember(null);
            setDetailsInitialEditMode(false);
          }}
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
