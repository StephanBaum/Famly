import React, { useState } from 'react';
import { useFamily } from '../context/FamilyContext';
import {
  Calendar,
  Clock,
  MapPin,
  Utensils,
  CheckCircle2,
  Circle,
  Pin,
  Plus,
  ChevronRight,
  Wifi,
  AlertCircle,
  PartyPopper,
  Shirt,
} from 'lucide-react';
import { format } from 'date-fns';
import { ChildDetailsModal } from '../components/ChildDetailsModal';
import { FamilyMember } from '../types';

interface DashboardViewProps {
  onNavigate: (tab: 'calendar' | 'meals' | 'photos' | 'lists' | 'members') => void;
  onOpenAddAppointment: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenAddAppointment,
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
    groceries,
    notes,
    addNote,
    deleteNote,
    addRecipeIngredientsToGrocery,
    familyName,
  } = useFamily();

  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteTag, setNoteTag] = useState<'urgent' | 'info' | 'fun' | 'wifi'>('info');
  const [selectedChildForModal, setSelectedChildForModal] = useState<FamilyMember | null>(null);

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

  // Filter chores for member
  const relevantChores = chores.filter((c) =>
    currentMemberId === 'all' ? true : c.assignedMemberId === currentMemberId
  );
  const completedChoresCount = relevantChores.filter((c) => c.completed).length;

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteContent.trim()) return;
    addNote(noteTitle.trim(), noteContent.trim(), noteTag, true);
    setNoteTitle('');
    setNoteContent('');
    setShowAddNoteModal(false);
  };

  // Kids in household (Leo & Mia)
  const kids = members.filter((m) => m.isChild);

  return (
    <div className="space-y-6">
      
      {/* Duolingo-style Cheerful Welcome Header */}
      <div className="duo-card p-6 bg-gradient-to-br from-amber-50 via-rose-50 to-emerald-50 border-2 border-stone-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-white border-2 border-b-4 border-stone-300 flex items-center justify-center text-3xl shadow-sm">
              {currentMember ? currentMember.avatar : '🏡'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-stone-900 tracking-tight">
                  {currentMember ? `Hi, ${currentMember.name}!` : `Hello, ${familyName}!`}
                </h2>
                <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-[#FFC800] text-stone-900 border-b-2 border-[#E5A500]">
                  {format(new Date(), 'EEEE')}
                </span>
              </div>
              <p className="text-xs font-bold text-stone-500 mt-0.5">
                {todayAppointments.length === 0
                  ? 'No events today • Open family time!'
                  : `${todayAppointments.length} appointment${todayAppointments.length > 1 ? 's' : ''} on today’s schedule.`}
              </p>
            </div>
          </div>

          <button
            onClick={onOpenAddAppointment}
            className="duo-btn duo-btn-green px-5 py-2.5 text-xs font-black rounded-2xl self-start md:self-auto"
          >
            <Plus className="w-4 h-4 mr-1 stroke-[3]" />
            <span>Schedule Appointment</span>
          </button>
        </div>

        {/* Chunky 4-stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          
          <div
            onClick={() => onNavigate('calendar')}
            className="cursor-pointer bg-white p-3.5 rounded-2xl border-2 border-b-4 border-blue-200 hover:border-blue-400 transition-all text-center"
          >
            <span className="text-xl">📅</span>
            <p className="text-lg font-black text-stone-900 mt-1">{todayAppointments.length}</p>
            <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wide">Today's Events</p>
          </div>

          <div
            onClick={() => onNavigate('meals')}
            className="cursor-pointer bg-white p-3.5 rounded-2xl border-2 border-b-4 border-teal-200 hover:border-teal-400 transition-all text-center"
          >
            <span className="text-xl">🍲</span>
            <p className="text-sm font-black text-stone-900 truncate mt-1">
              {todayMeal?.dinner?.title || 'Tap to plan'}
            </p>
            <p className="text-[11px] font-bold text-teal-600 uppercase tracking-wide truncate">
              {dinnerChef ? `Chef: ${dinnerChef.name}` : 'Tonight’s Dinner'}
            </p>
          </div>

          <div
            onClick={() => onNavigate('lists')}
            className="cursor-pointer bg-white p-3.5 rounded-2xl border-2 border-b-4 border-amber-200 hover:border-amber-400 transition-all text-center"
          >
            <span className="text-xl">⭐</span>
            <p className="text-lg font-black text-stone-900 mt-1">
              {completedChoresCount}/{relevantChores.length}
            </p>
            <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wide">Chores Done</p>
          </div>

          <div
            onClick={() => onNavigate('lists')}
            className="cursor-pointer bg-white p-3.5 rounded-2xl border-2 border-b-4 border-emerald-200 hover:border-emerald-400 transition-all text-center"
          >
            <span className="text-xl">🛒</span>
            <p className="text-lg font-black text-stone-900 mt-1">
              {groceries.filter((g) => !g.checked).length}
            </p>
            <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wide">Groceries Needed</p>
          </div>

        </div>
      </div>

      {/* QUICK CHILD DETAILS BAR (Sizes, Doctor, School) */}
      <div className="duo-card p-5 bg-white border-2 border-purple-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🧸</span>
            <div>
              <h3 className="font-extrabold text-stone-900 text-sm">
                Kids Vital Details & Clothes Sizes
              </h3>
              <p className="text-[11px] font-semibold text-stone-400">
                Instantly check shoe sizes, pediatrician phone numbers, and school details
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('members')}
            className="text-xs font-black text-purple-600 hover:text-purple-800 underline"
          >
            View All Family Info →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {kids.map((kid) => (
            <div
              key={kid.id}
              onClick={() => setSelectedChildForModal(kid)}
              className="cursor-pointer p-3.5 rounded-2xl border-2 border-b-4 border-stone-200 bg-stone-50/50 hover:bg-purple-50/40 hover:border-purple-300 transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{kid.avatar}</span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <strong className="text-xs font-black text-stone-900">{kid.name}</strong>
                    <span className="text-[10px] font-bold text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded-md">
                      {kid.role}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-stone-600 font-semibold mt-1">
                    <span className="flex items-center gap-1">
                      <Shirt className="w-3 h-3 text-stone-400" />
                      <span>{kid.childDetails?.clothingSize || 'Sizes'}</span>
                    </span>
                    <span>•</span>
                    <span>👟 {kid.childDetails?.shoeSize || 'Shoes'}</span>
                  </div>
                </div>
              </div>

              <button className="duo-btn duo-btn-white px-2.5 py-1 text-[11px] font-black rounded-xl">
                Open Card
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Grid: Left Column (Events & Dinner) / Right Column (Board & Memories) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Today's Schedule Card */}
          <div className="duo-card p-6 bg-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-black">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-stone-900">Today’s Appointments</h3>
                  <p className="text-xs font-semibold text-stone-400">
                    Coordinated schedule for {currentMember ? currentMember.name : 'the whole family'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('calendar')}
                className="duo-btn duo-btn-white px-3 py-1.5 text-xs font-extrabold rounded-xl"
              >
                <span>Full Calendar</span>
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>

            {todayAppointments.length === 0 ? (
              <div className="text-center py-8 bg-stone-50 rounded-2xl border-2 border-dashed border-stone-200">
                <span className="text-3xl mb-1 block">🏖️</span>
                <p className="text-sm font-extrabold text-stone-700">All clear today!</p>
                <p className="text-xs font-semibold text-stone-400 mt-0.5">
                  No appointments scheduled for today.
                </p>
                <button
                  onClick={onOpenAddAppointment}
                  className="mt-3 text-xs font-black text-rose-600 hover:underline"
                >
                  + Add an event for today
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {todayAppointments.map((app) => {
                  const assignedMembers = members.filter((m) => app.memberIds.includes(m.id));
                  return (
                    <div
                      key={app.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border-2 border-b-4 border-stone-200 bg-stone-50/50 hover:bg-stone-50 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className="px-3 py-1.5 rounded-xl bg-white border-2 border-stone-200 shadow-2xs text-xs font-black text-stone-800 flex items-center gap-1.5 shrink-0">
                          <Clock className="w-3.5 h-3.5 text-blue-500" />
                          {app.time}
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="text-sm font-black text-stone-900">
                            {app.title}
                          </h4>
                          {app.location && (
                            <p className="text-xs font-semibold text-stone-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-stone-400" />
                              <span>{app.location}</span>
                            </p>
                          )}
                          {app.notes && (
                            <p className="text-xs text-stone-600 bg-white px-2 py-0.5 rounded-lg border border-stone-200 inline-block mt-1 font-medium">
                              {app.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Attendee Avatars */}
                      <div className="flex items-center gap-1.5 mt-2 sm:mt-0 self-end sm:self-center">
                        <div className="flex -space-x-1.5">
                          {assignedMembers.map((m) => (
                            <div
                              key={m.id}
                              title={`${m.name} (${m.role})`}
                              className="w-8 h-8 rounded-full bg-white border-2 border-stone-200 shadow-xs flex items-center justify-center text-sm"
                            >
                              <span>{m.avatar}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tonight's Dinner Card */}
          <div className="duo-card p-6 bg-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center font-black">
                  <Utensils className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-stone-900">Tonight’s Dinner</h3>
                  <p className="text-xs font-semibold text-stone-400">Weekly meal plan coordination</p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('meals')}
                className="duo-btn duo-btn-white px-3 py-1.5 text-xs font-extrabold rounded-xl"
              >
                <span>Meal Planner</span>
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>

            {todayMeal?.dinner?.title ? (
              <div className="flex flex-col sm:flex-row gap-4 bg-teal-50/50 rounded-2xl border-2 border-teal-200 p-4">
                {dinnerRecipe?.imageUrl ? (
                  <img
                    src={dinnerRecipe.imageUrl}
                    alt={todayMeal.dinner.title}
                    className="w-full sm:w-32 h-28 object-cover rounded-2xl shadow-xs border-2 border-white"
                  />
                ) : (
                  <div className="w-full sm:w-32 h-28 rounded-2xl bg-teal-100 flex items-center justify-center text-3xl">
                    🍲
                  </div>
                )}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-teal-200 text-teal-900">
                        Dinner
                      </span>
                      {dinnerChef && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white text-stone-700 border border-stone-200 flex items-center gap-1">
                          <span>Chef:</span>
                          <span>{dinnerChef.avatar}</span>
                          <span className="font-black">{dinnerChef.name}</span>
                        </span>
                      )}
                    </div>
                    <h4 className="text-base font-black text-stone-900">{todayMeal.dinner.title}</h4>
                    {dinnerRecipe?.notes && (
                      <p className="text-xs text-stone-600 mt-1 font-medium line-clamp-2">
                        {dinnerRecipe.notes}
                      </p>
                    )}
                  </div>

                  {dinnerRecipe && (
                    <div className="mt-3 pt-2 border-t border-teal-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-500">
                        {dinnerRecipe.ingredients.length} ingredients
                      </span>
                      <button
                        onClick={() => addRecipeIngredientsToGrocery(dinnerRecipe)}
                        className="duo-btn duo-btn-green px-3 py-1 text-xs font-black rounded-xl"
                      >
                        + Send to Groceries
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 bg-stone-50 rounded-2xl border-2 border-dashed border-stone-200">
                <p className="text-xs font-bold text-stone-600">Tonight’s dinner isn’t planned yet!</p>
                <button
                  onClick={() => onNavigate('meals')}
                  className="mt-2 text-xs font-black text-teal-600 underline"
                >
                  Pick a recipe from the planner
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Right Column (5 cols): Bulletin Board & Chores */}
        <div className="lg:col-span-5 space-y-6">

          {/* Quick Chores */}
          <div className="duo-card p-6 bg-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-black">
                  <span>⭐</span>
                </div>
                <div>
                  <h3 className="font-extrabold text-stone-900">Today’s Chores</h3>
                  <p className="text-xs font-semibold text-stone-400">Earn stars for household help!</p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('lists')}
                className="duo-btn duo-btn-white px-3 py-1.5 text-xs font-extrabold rounded-xl"
              >
                <span>All Chores</span>
              </button>
            </div>

            <div className="space-y-2">
              {relevantChores.slice(0, 4).map((chore) => {
                const assigned = members.find((m) => m.id === chore.assignedMemberId);
                return (
                  <div
                    key={chore.id}
                    onClick={() => toggleChore(chore.id)}
                    className={`cursor-pointer flex items-center justify-between p-3 rounded-2xl border-2 transition-all ${
                      chore.completed
                        ? 'bg-amber-50/40 border-amber-200 opacity-60'
                        : 'bg-white border-b-4 border-stone-200 hover:border-amber-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {chore.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-amber-500 fill-amber-100 shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-stone-300 hover:text-amber-500 shrink-0" />
                      )}
                      <div>
                        <p
                          className={`text-xs font-extrabold ${
                            chore.completed ? 'line-through text-stone-400' : 'text-stone-800'
                          }`}
                        >
                          {chore.title}
                        </p>
                        {assigned && currentMemberId === 'all' && (
                          <span className="text-[10px] text-stone-500 font-bold flex items-center gap-1 mt-0.5">
                            <span>{assigned.avatar}</span>
                            <span>{assigned.name}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-lg">
                      ⭐ +{chore.stars}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Family Notice Board */}
          <div className="duo-card p-6 bg-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-black">
                  <Pin className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-stone-900">Family Notice Board</h3>
                  <p className="text-xs font-semibold text-stone-400">Wi-Fi, bus routines & alerts</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddNoteModal(true)}
                className="duo-btn duo-btn-rose px-3 py-1.5 text-xs font-black rounded-xl"
              >
                + Pin Note
              </button>
            </div>

            <div className="space-y-3">
              {notes.map((note) => {
                const author = members.find((m) => m.id === note.authorMemberId);
                const tagStyles = {
                  wifi: 'bg-sky-50 border-sky-300 text-sky-950',
                  urgent: 'bg-rose-50 border-rose-300 text-rose-950',
                  fun: 'bg-amber-50 border-amber-300 text-amber-950',
                  info: 'bg-stone-50 border-stone-300 text-stone-950',
                };
                return (
                  <div
                    key={note.id}
                    className={`p-3.5 rounded-2xl border-2 border-b-4 ${
                      tagStyles[note.tag]
                    } relative group`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5 font-black text-xs">
                        {note.tag === 'wifi' && <Wifi className="w-3.5 h-3.5 text-sky-600" />}
                        {note.tag === 'urgent' && <AlertCircle className="w-3.5 h-3.5 text-rose-600" />}
                        {note.tag === 'fun' && <PartyPopper className="w-3.5 h-3.5 text-amber-600" />}
                        <span>{note.title}</span>
                      </div>
                      <button
                        onClick={() => deleteNote(note.id)}
                        className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-rose-600 text-xs font-bold"
                      >
                        ✕
                      </button>
                    </div>
                    <p className="text-xs font-medium whitespace-pre-line leading-relaxed">
                      {note.content}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-stone-400 font-semibold">
                      <span>From {author ? author.name : 'Family'}</span>
                      <span>{note.createdAt}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

      {/* Child Details Modal */}
      {selectedChildForModal && (
        <ChildDetailsModal
          member={selectedChildForModal}
          isOpen={true}
          onClose={() => setSelectedChildForModal(null)}
        />
      )}

      {/* Add Note Modal */}
      {showAddNoteModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border-2 border-stone-200 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-black text-stone-900 mb-2">Pin a Notice</h3>
            <form onSubmit={handleAddNote} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-stone-600 uppercase mb-1">Title</label>
                <input
                  type="text"
                  placeholder="e.g. Babysitter Phone, Wi-Fi Password"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-stone-600 uppercase mb-1">Type</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['info', 'urgent', 'wifi', 'fun'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setNoteTag(t)}
                      className={`duo-btn py-1.5 text-xs font-black capitalize rounded-xl ${
                        noteTag === t
                          ? 'duo-btn-rose'
                          : 'duo-btn-white'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-stone-600 uppercase mb-1">Details</label>
                <textarea
                  rows={3}
                  placeholder="Write the message or details here..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddNoteModal(false)}
                  className="duo-btn duo-btn-white px-4 py-2 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="duo-btn duo-btn-rose px-5 py-2 text-xs font-black rounded-xl"
                >
                  Pin Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
