import React, { useState } from 'react';
import { useFamily } from '../../context/FamilyContext';
import { Chore, isChoreRelevantForMember } from '../../types';
import { ModalPortal } from '../ModalPortal';
import { ChoresTab, CHORE_FREQUENCY_MAP } from './ChoresTab';
import { RewardsTab } from './RewardsTab';
import { Plus, Sparkles, Gift, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

export const ChoresAndRewardsSection: React.FC = () => {
  const {
    members,
    chores,
    addChore,
    updateChore,
    toggleChore,
    deleteChore,
    rewards,
    rewardClaims,
    addReward,
    deleteReward,
    claimReward,
    approveClaim,
    deleteClaim,
    getMemberStarBalance,
    getMemberTotalEarnedStars,
    currentMemberId,
  } = useFamily();

  // Chores vs Rewards Sub-tab
  const [choreSubTab, setChoreSubTab] = useState<'chores' | 'rewards'>('chores');

  // Rewards State
  const childrenMembers = members.filter((m) => m.isChild);
  const eligibleRewardMembers = childrenMembers.length > 0 ? childrenMembers : members;
  const [selectedChildForReward, setSelectedChildForReward] = useState<string>(
    eligibleRewardMembers[0]?.id || members[0]?.id || 'm1'
  );
  const [isAddRewardOpen, setIsAddRewardOpen] = useState(false);
  const [newRewardTitle, setNewRewardTitle] = useState('');
  const [newRewardDescription, setNewRewardDescription] = useState('');
  const [newRewardCost, setNewRewardCost] = useState(10);
  const [newRewardIcon, setNewRewardIcon] = useState('🎁');
  const [rewardError, setRewardError] = useState<string | null>(null);

  // Chore Form State
  const [isAddChoreOpen, setIsAddChoreOpen] = useState(false);
  const [editingChoreId, setEditingChoreId] = useState<string | null>(null);
  const [choreToDelete, setChoreToDelete] = useState<Chore | null>(null);
  const [choreTitle, setChoreTitle] = useState('');
  const [choreAssignees, setChoreAssignees] = useState<string[]>([]);
  const [choreFrequency, setChoreFrequency] = useState<Chore['frequency']>('once');
  const [choreStars, setChoreStars] = useState(3);
  const [choreDueDate, setChoreDueDate] = useState<string>('');

  const openAddChore = () => {
    setEditingChoreId(null);
    setChoreTitle('');
    setChoreAssignees([]); // Default: Offen für alle
    setChoreFrequency('once');
    setChoreStars(3);
    setChoreDueDate(format(new Date(), 'yyyy-MM-dd'));
    setIsAddChoreOpen(true);
  };

  const openEditChore = (chore: Chore) => {
    setEditingChoreId(chore.id);
    setChoreTitle(chore.title);
    const existingAssignees =
      chore.assignedMemberIds && chore.assignedMemberIds.length > 0
        ? chore.assignedMemberIds
        : chore.assignedMemberId
        ? [chore.assignedMemberId]
        : [];
    setChoreAssignees(existingAssignees);
    setChoreFrequency(chore.frequency);
    setChoreStars(chore.stars);
    setChoreDueDate(chore.dueDate || '');
    setIsAddChoreOpen(true);
  };

  const handleAddChore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!choreTitle.trim()) return;
    if (editingChoreId) {
      updateChore(editingChoreId, {
        title: choreTitle.trim(),
        assignedMemberId: choreAssignees[0] || '',
        assignedMemberIds: choreAssignees,
        frequency: choreFrequency,
        stars: Number(choreStars),
        dueDate: choreDueDate || undefined,
      });
    } else {
      addChore(
        choreTitle.trim(),
        choreAssignees[0] || '',
        choreFrequency,
        Number(choreStars),
        choreAssignees,
        choreDueDate || undefined
      );
    }
    setChoreTitle('');
    setChoreAssignees([]);
    setChoreDueDate('');
    setEditingChoreId(null);
    setIsAddChoreOpen(false);
  };

  const handleCreateReward = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRewardTitle.trim()) return;
    addReward(
      newRewardTitle.trim(),
      newRewardCost,
      newRewardIcon || '🎁',
      newRewardDescription.trim() || undefined
    );
    setNewRewardTitle('');
    setNewRewardDescription('');
    setNewRewardCost(10);
    setNewRewardIcon('🎁');
    setIsAddRewardOpen(false);
  };

  const handleClaimReward = (rewardId: string) => {
    setRewardError(null);
    const success = claimReward(rewardId, selectedChildForReward);
    if (!success) {
      setRewardError('Nicht genügend Sterne vorhanden!');
      setTimeout(() => setRewardError(null), 3000);
    }
  };

  // Filter chores for current active member
  const filteredChores = chores.filter((c) => isChoreRelevantForMember(c, currentMemberId));

  return (
    <div className="space-y-4 animate-in fade-in">
      {/* Chores & Stars Control Card */}
      <div className="duo-card p-4 sm:p-5 bg-white dark:bg-slate-900 border-2 border-stone-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-black text-stone-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>Aufgaben & Familien-Belohnungen</span>
            </h3>
            <p className="text-xs font-semibold text-stone-500 dark:text-slate-400 mt-0.5">
              Aufgaben erledigen, Sterne sammeln und gegen Wunschbelohnungen eintauschen.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {choreSubTab === 'chores' ? (
              <button
                type="button"
                onClick={openAddChore}
                className="duo-btn duo-btn-amber px-4 py-2 text-xs font-black rounded-xl shadow-xs"
              >
                <Plus className="w-4 h-4 mr-1 stroke-[3]" />
                <span>Aufgabe hinzufügen</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsAddRewardOpen(true)}
                className="duo-btn duo-btn-purple px-4 py-2 text-xs font-black rounded-xl shadow-xs"
              >
                <Plus className="w-4 h-4 mr-1 stroke-[3]" />
                <span>Belohnung anlegen</span>
              </button>
            )}
          </div>
        </div>

        {/* Member Star Counts */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mt-4">
          {members.map((m) => {
            const memberStars = getMemberTotalEarnedStars(m.id);
            const available = getMemberStarBalance(m.id);

            return (
              <div
                key={m.id}
                className="bg-stone-50 dark:bg-slate-800/80 p-2.5 rounded-xl border border-stone-200 dark:border-slate-700 flex items-center justify-between shadow-2xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-lg">{m.avatar}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-stone-800 dark:text-white truncate">{m.name}</p>
                    <p className="text-[10px] text-stone-400 font-bold truncate">{m.role}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-black text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded-lg block">
                    ⭐ {available}
                  </span>
                  {m.isChild && (
                    <span className="text-[9px] font-semibold text-stone-400 block mt-0.5">
                      ({memberStars} ges.)
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Sub-tab switch: Aufgaben vs Belohnungs-Shop */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-stone-200/80 dark:border-slate-800/80">
          <button
            type="button"
            onClick={() => setChoreSubTab('chores')}
            className={`duo-btn px-3.5 py-1.5 text-xs font-black rounded-xl transition-all ${
              choreSubTab === 'chores'
                ? 'duo-btn-amber shadow-2xs'
                : 'duo-btn-white text-stone-600 dark:text-slate-300'
            }`}
          >
            <span>📋 Aufgaben ({filteredChores.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setChoreSubTab('rewards')}
            className={`duo-btn px-3.5 py-1.5 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 ${
              choreSubTab === 'rewards'
                ? 'duo-btn-purple shadow-2xs'
                : 'duo-btn-white text-stone-600 dark:text-slate-300'
            }`}
          >
            <span>⭐ Belohnungs-Shop ({rewards.length})</span>
            {rewardClaims.filter((c) => c.status === 'pending').length > 0 && (
              <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full animate-pulse">
                {rewardClaims.filter((c) => c.status === 'pending').length} offen
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Sub-tab views */}
      {choreSubTab === 'chores' ? (
        <ChoresTab
          chores={filteredChores}
          members={members}
          currentMemberId={currentMemberId}
          onToggleChore={toggleChore}
          onEditChore={openEditChore}
          onDeleteChore={(chore) => setChoreToDelete(chore)}
        />
      ) : (
        <RewardsTab
          rewards={rewards}
          rewardClaims={rewardClaims}
          members={members}
          eligibleRewardMembers={eligibleRewardMembers}
          selectedChildForReward={selectedChildForReward}
          onSelectChild={setSelectedChildForReward}
          getMemberStarBalance={getMemberStarBalance}
          onClaimReward={handleClaimReward}
          onDeleteReward={deleteReward}
          onApproveClaim={approveClaim}
          onDeleteClaim={deleteClaim}
          onOpenAddReward={() => setIsAddRewardOpen(true)}
          rewardError={rewardError}
          chores={chores}
          getMemberTotalEarnedStars={getMemberTotalEarnedStars}
        />
      )}

      {/* Add / Edit Chore Modal */}
      {isAddChoreOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border-2 border-stone-200 dark:border-slate-800 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-black text-stone-900 dark:text-white mb-4">
                {editingChoreId ? 'Aufgabe bearbeiten' : 'Aufgabe im Haushalt anlegen'}
              </h3>
              <form onSubmit={handleAddChore} className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-stone-600 dark:text-slate-300 uppercase mb-1">
                    Beschreibung
                  </label>
                  <input
                    type="text"
                    placeholder="z.B. Bett machen, Spülmaschine ausräumen, Tomaten gießen"
                    value={choreTitle}
                    onChange={(e) => setChoreTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-sm focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-black text-stone-600 dark:text-slate-300 uppercase">
                      Zuweisen an
                    </label>
                    <button
                      type="button"
                      onClick={() => setChoreAssignees([])}
                      className={`text-[11px] font-extrabold px-2.5 py-1 rounded-lg border transition-all ${
                        choreAssignees.length === 0
                          ? 'bg-teal-500 text-white border-teal-600 shadow-2xs'
                          : 'text-stone-500 hover:text-stone-800 dark:text-slate-400 dark:hover:text-white border-stone-200 dark:border-slate-700'
                      }`}
                    >
                      👥 Offen für alle (Wer zuerst kommt)
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {members.map((m) => {
                      const isSelected = choreAssignees.includes(m.id);
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setChoreAssignees((prev) =>
                              prev.includes(m.id) ? prev.filter((id) => id !== m.id) : [...prev, m.id]
                            );
                          }}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border-2 text-xs font-bold transition-all text-left ${
                            isSelected
                              ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-400 text-amber-900 dark:text-amber-200 shadow-2xs'
                              : 'bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700 text-stone-700 dark:text-slate-300 hover:border-amber-300'
                          }`}
                        >
                          <span className="text-base">{m.avatar}</span>
                          <span className="truncate">{m.name}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-stone-400 dark:text-slate-400 font-semibold mt-1.5">
                    {choreAssignees.length === 0
                      ? '✨ Offen für alle: Wer die Aufgabe zuerst erledigt, erhält die ⭐ Sterne!'
                      : choreAssignees.length === 1
                      ? `🎯 Feste Zuweisung an ${members.find((m) => m.id === choreAssignees[0])?.name || 'Mitglied'}`
                      : `🤝 Team-Aufgabe für ${choreAssignees.map((id) => members.find((m) => m.id === id)?.name).filter(Boolean).join(' & ')} (Wer sie zuerst erledigt, erhält die Sterne)`}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-black text-stone-600 dark:text-slate-300 uppercase mb-1">
                    📅 Kalender-Datum / Fälligkeit (optional)
                  </label>
                  <input
                    type="date"
                    value={choreDueDate}
                    onChange={(e) => setChoreDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 text-stone-900 dark:text-white focus:outline-none"
                  />
                  <p className="text-[11px] text-stone-500 dark:text-slate-400 mt-1">
                    Erscheint an diesem Tag direkt im Familienkalender.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black text-stone-600 dark:text-slate-300 uppercase mb-1">
                      Häufigkeit
                    </label>
                    <select
                      value={choreFrequency}
                      onChange={(e) => setChoreFrequency(e.target.value as Chore['frequency'])}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 text-stone-900 dark:text-white focus:outline-none cursor-pointer font-semibold"
                    >
                      <option value="once">🎯 Einmalig (Standard)</option>
                      <option value="weekly">🗓️ Wöchentlich</option>
                      <option value="2x_weekly">🔄 2x pro Woche</option>
                      <option value="biweekly">⏳ Alle 2 Wochen</option>
                      <option value="monthly">📅 Monatlich</option>
                      <option value="daily">☀️ Täglich</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-stone-600 dark:text-slate-300 uppercase mb-1">
                      Belohnung (Sterne)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={choreStars}
                      onChange={(e) => setChoreStars(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 text-stone-900 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddChoreOpen(false);
                      setEditingChoreId(null);
                    }}
                    className="duo-btn duo-btn-white px-4 py-2 text-xs font-bold rounded-xl"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    className="duo-btn duo-btn-amber px-5 py-2 text-xs font-black rounded-xl"
                  >
                    {editingChoreId ? 'Änderungen speichern' : 'Aufgabe anlegen'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Add Custom Reward Modal */}
      {isAddRewardOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-xl border-2 border-stone-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
              <h3 className="text-lg font-black text-stone-900 dark:text-white mb-1 flex items-center gap-2">
                <Gift className="w-5 h-5 text-purple-500" />
                <span>Eigene Familien-Belohnung erstellen</span>
              </h3>
              <p className="text-xs font-semibold text-stone-500 dark:text-slate-400 mb-4">
                Lege eine neue Belohnung fest, die sich eure Kinder mit ihren erledigten Haushaltsaufgaben verdienen können.
              </p>

              <form onSubmit={handleCreateReward} className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-stone-600 dark:text-slate-300 uppercase mb-1">
                    Titel der Belohnung
                  </label>
                  <input
                    type="text"
                    placeholder="z.B. Zoobesuch, Pizza-Abend, 45 Min Nintendo Switch"
                    value={newRewardTitle}
                    onChange={(e) => setNewRewardTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-sm focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-stone-600 dark:text-slate-300 uppercase mb-1">
                    Beschreibung (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="z.B. Ein Ausflug am Wochenende mit der ganzen Familie"
                    value={newRewardDescription}
                    onChange={(e) => setNewRewardDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-sm focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black text-stone-600 dark:text-slate-300 uppercase mb-1">
                      Kosten in Sternen
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={newRewardCost}
                      onChange={(e) => setNewRewardCost(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 text-stone-900 dark:text-white focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-stone-600 dark:text-slate-300 uppercase mb-1">
                      Icon / Emoji
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        maxLength={2}
                        value={newRewardIcon}
                        onChange={(e) => setNewRewardIcon(e.target.value)}
                        className="w-14 text-center px-2 py-2 rounded-xl border border-stone-300 dark:border-slate-700 text-lg bg-white dark:bg-slate-800 text-stone-900 dark:text-white focus:outline-none"
                        required
                      />
                      <div className="flex flex-wrap gap-1 text-base">
                        {['🍦', '🎮', '🎬', '🍕', '🎡', '⛺', '🛹', '🎳'].map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => setNewRewardIcon(emoji)}
                            className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-slate-800"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsAddRewardOpen(false)}
                    className="duo-btn duo-btn-white px-4 py-2 text-xs font-bold rounded-xl"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    className="duo-btn duo-btn-purple px-5 py-2 text-xs font-black rounded-xl"
                  >
                    Belohnung speichern
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Delete Chore Confirmation Modal */}
      {choreToDelete && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border-2 border-stone-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3">
                <Trash2 className="w-6 h-6" />
              </div>

              {choreToDelete.frequency === 'once' ? (
                <>
                  <h3 className="text-lg font-black text-stone-900 dark:text-white">
                    Aufgabe löschen?
                  </h3>
                  <p className="text-xs text-stone-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                    Möchtest du die einmalige Aufgabe <strong className="text-stone-900 dark:text-white">"{choreToDelete.title}"</strong> wirklich löschen?
                  </p>
                  <div className="flex items-center justify-end gap-2 mt-5">
                    <button
                      type="button"
                      onClick={() => setChoreToDelete(null)}
                      className="duo-btn duo-btn-white px-4 py-2 text-xs font-bold rounded-xl"
                    >
                      Abbrechen
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        deleteChore(choreToDelete.id);
                        setChoreToDelete(null);
                      }}
                      className="duo-btn duo-btn-rose px-5 py-2 text-xs font-black rounded-xl"
                    >
                      Ja, Aufgabe löschen
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-black text-stone-900 dark:text-white">
                    Wiederkehrende Aufgabe löschen?
                  </h3>
                  <p className="text-xs text-stone-600 dark:text-slate-300 mt-2 leading-relaxed">
                    Die Aufgabe <strong className="text-stone-900 dark:text-white">"{choreToDelete.title}"</strong> ist als <span className="font-black px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200">{CHORE_FREQUENCY_MAP[choreToDelete.frequency]?.label || choreToDelete.frequency}</span> eingestellt.
                  </p>
                  <p className="text-xs text-stone-500 dark:text-slate-400 mt-1.5">
                    Wie möchtest du mit den zukünftigen Wiederholungen verfahren?
                  </p>

                  <div className="space-y-2 mt-4">
                    <button
                      type="button"
                      onClick={() => {
                        deleteChore(choreToDelete.id);
                        setChoreToDelete(null);
                      }}
                      className="w-full duo-btn duo-btn-rose p-3 text-xs font-black rounded-2xl flex items-center justify-between text-left"
                    >
                      <div>
                        <div className="font-black">Alle zukünftigen Wiederholungen löschen 🗑️</div>
                        <div className="text-[10px] font-normal opacity-90 mt-0.5">Entfernt die Aufgabe komplett aus allen Listen</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        updateChore(choreToDelete.id, { frequency: 'once' });
                        setChoreToDelete(null);
                      }}
                      className="w-full duo-btn duo-btn-amber p-3 text-xs font-black rounded-2xl flex items-center justify-between text-left"
                    >
                      <div>
                        <div className="font-black">Nur Wiederholungen stoppen (Auf einmalig setzen) ⏸️</div>
                        <div className="text-[10px] font-normal opacity-90 mt-0.5">Aktuelle Aufgabe bleibt stehen, wiederholt sich danach aber nicht mehr</div>
                      </div>
                    </button>
                  </div>

                  <div className="flex justify-end mt-4">
                    <button
                      type="button"
                      onClick={() => setChoreToDelete(null)}
                      className="duo-btn duo-btn-white px-4 py-2 text-xs font-bold rounded-xl"
                    >
                      Abbrechen
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
};
