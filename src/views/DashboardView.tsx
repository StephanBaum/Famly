import React, { useState, useEffect } from 'react';
import { useFamily } from '../context/FamilyContext';
import { fetchFamilyWeather, FamilyWeather } from '../services/weatherService';
import { ChildDetailsModal } from '../components/ChildDetailsModal';
import { FamilyAssistantModal } from '../components/FamilyAssistantModal';
import { FamilyMember, Chore, isChoreRelevantForMember } from '../types';
import { ActiveTab } from '../components/Header';
import { DashboardHero } from '../components/dashboard/DashboardHero';
import { DashboardKidsStrip } from '../components/dashboard/DashboardKidsStrip';
import { DashboardAppointmentsCard } from '../components/dashboard/DashboardAppointmentsCard';
import { DashboardDinnerCard } from '../components/dashboard/DashboardDinnerCard';
import { DashboardChoresCard } from '../components/dashboard/DashboardChoresCard';
import { DashboardNoticeBoardCard } from '../components/dashboard/DashboardNoticeBoardCard';
import { AddNoteModal } from '../components/dashboard/AddNoteModal';
import { ChoreClaimModal } from '../components/dashboard/ChoreClaimModal';

interface DashboardViewProps {
  onNavigate: (tab: ActiveTab) => void;
  onOpenAddAppointment: () => void;
  onOpenAssistant?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenAddAppointment,
  onOpenAssistant,
}) => {
  const {
    members,
    currentMemberId,
    currentMember,
    appointments,
    mealPlans,
    recipes,
    chores,
    toggleChore,
    notes,
    addNote,
    deleteNote,
    addRecipeIngredientsToGrocery,
    familyName,
  } = useFamily();

  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [selectedChildForModal, setSelectedChildForModal] = useState<FamilyMember | null>(null);
  const [childModalInitialEdit, setChildModalInitialEdit] = useState<boolean>(false);
  const [claimingChore, setClaimingChore] = useState<Chore | null>(null);
  const [weather, setWeather] = useState<FamilyWeather | null>(null);
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);

  useEffect(() => {
    fetchFamilyWeather()
      .then((data) => setWeather(data))
      .catch(() => {});
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];

  // Filter today's appointments
  const todayAppointments = appointments
    .filter((a) => a.date === todayStr)
    .filter((a) => (currentMemberId === 'all' ? true : a.memberIds.includes(currentMemberId)))
    .sort((a, b) => a.time.localeCompare(b.time));

  // Today's meal plan
  const todayMeal = mealPlans.find((m) => m.date === todayStr);
  const dinnerRecipe = todayMeal?.dinner?.recipeId
    ? recipes.find((r) => r.id === todayMeal.dinner?.recipeId)
    : null;
  const dinnerChef = todayMeal?.dinner?.chefId
    ? members.find((m) => m.id === todayMeal.dinner?.chefId)
    : null;

  // Filter chores for current member
  const relevantChores = chores.filter((c) => isChoreRelevantForMember(c, currentMemberId));

  const handleDashboardChoreClick = (chore: Chore) => {
    if (chore.completed) {
      toggleChore(chore.id);
      return;
    }

    if (currentMemberId !== 'all') {
      toggleChore(chore.id, currentMemberId);
      return;
    }

    const assignees =
      chore.assignedMemberIds && chore.assignedMemberIds.length > 0
        ? members.filter((m) => chore.assignedMemberIds!.includes(m.id))
        : chore.assignedMemberId
        ? members.filter((m) => m.id === chore.assignedMemberId)
        : [];

    if (assignees.length === 1) {
      toggleChore(chore.id, assignees[0].id);
    } else {
      setClaimingChore(chore);
    }
  };

  const handleAddNote = (title: string, content: string, tag: 'urgent' | 'info' | 'fun' | 'wifi') => {
    addNote(title, content, tag, true);
  };

  // Kids in household
  const kids = members.filter((m) => m.isChild);

  return (
    <div className="space-y-5">
      {/* Calm, Stress-Free Today Hero */}
      <DashboardHero
        currentMember={currentMember}
        familyName={familyName}
        weather={weather}
        onOpenAddAppointment={onOpenAddAppointment}
      />

      {/* Quick Child Details Glance Strip */}
      <DashboardKidsStrip
        kids={kids}
        onSelectChild={(kid) => {
          setSelectedChildForModal(kid);
          setChildModalInitialEdit(false);
        }}
        onNavigate={onNavigate}
      />

      {/* Main Grid: Left Column (Events & Dinner) / Right Column (Board & Chores) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Left Column (7 cols) */}
        <div className="lg:col-span-7 space-y-4 sm:space-y-6">
          <DashboardAppointmentsCard
            todayAppointments={todayAppointments}
            members={members}
            onNavigate={onNavigate}
            onOpenAddAppointment={onOpenAddAppointment}
          />

          <DashboardDinnerCard
            todayMeal={todayMeal}
            dinnerRecipe={dinnerRecipe}
            dinnerChef={dinnerChef}
            onNavigate={onNavigate}
            onAddRecipeToGrocery={addRecipeIngredientsToGrocery}
          />
        </div>

        {/* Right Column (5 cols): Bulletin Board & Chores */}
        <div className="lg:col-span-5 space-y-4 sm:space-y-6">
          <DashboardChoresCard
            relevantChores={relevantChores}
            members={members}
            currentMemberId={currentMemberId}
            onNavigate={onNavigate}
            onChoreClick={handleDashboardChoreClick}
          />

          <DashboardNoticeBoardCard
            notes={notes}
            members={members}
            onOpenAddNote={() => setShowAddNoteModal(true)}
            onDeleteNote={deleteNote}
          />
        </div>
      </div>

      {/* Modals */}
      {selectedChildForModal && (
        <ChildDetailsModal
          member={selectedChildForModal}
          isOpen={true}
          initialEditMode={childModalInitialEdit}
          onClose={() => {
            setSelectedChildForModal(null);
            setChildModalInitialEdit(false);
          }}
        />
      )}

      <AddNoteModal
        isOpen={showAddNoteModal}
        onClose={() => setShowAddNoteModal(false)}
        onAddNote={handleAddNote}
      />

      <ChoreClaimModal
        chore={claimingChore}
        members={members}
        onClose={() => setClaimingChore(null)}
        onClaim={(choreId, memberId) => toggleChore(choreId, memberId)}
      />

      {!onOpenAssistant && (
        <FamilyAssistantModal
          isOpen={isDecisionModalOpen}
          onClose={() => setIsDecisionModalOpen(false)}
        />
      )}
    </div>
  );
};
