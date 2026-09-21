import React, { useState, useEffect } from 'react';
import { useFamily } from '../context/FamilyContext';
import { fetchFamilyWeather, FamilyWeather } from '../services/weatherService';
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
  CloudSun,
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { ChildDetailsModal } from '../components/ChildDetailsModal';
import { FamilyMember, Chore, isChoreRelevantForMember } from '../types';
import { ModalPortal } from '../components/ModalPortal';

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
  const [childModalInitialEdit, setChildModalInitialEdit] = useState<boolean>(false);
  const [claimingChore, setClaimingChore] = useState<Chore | null>(null);
  const [weather, setWeather] = useState<FamilyWeather | null>(null);

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

  // Filter chores for member
  const relevantChores = chores.filter((c) => isChoreRelevantForMember(c, currentMemberId));
  const completedChoresCount = relevantChores.filter((c) => c.completed).length;

  const getEligibleClaimants = (chore: Chore): FamilyMember[] => {
    if (chore.assignedMemberIds && chore.assignedMemberIds.length > 0) {
      const matched = members.filter((m) => chore.assignedMemberIds!.includes(m.id));
      if (matched.length > 0) return matched;
    }
    const kids = members.filter((m) => m.isChild);
    return kids.length > 0 ? kids : members;
  };

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

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteContent.trim()) return;
    addNote(noteTitle.trim(), noteContent.trim(), noteTag, true);
    setNoteTitle('');
    setNoteContent('');
    setShowAddNoteModal(false);
  };

  // Kids in household
  const kids = members.filter((m) => m.isChild);

  // Greeting logic: ensure "Hallo Familie Baum!" without duplication
  const displayGreetingName = currentMember
    ? currentMember.name
    : familyName.toLowerCase().startsWith('familie')
      ? familyName
      : `Familie ${familyName}`;

  return (
    <div className="space-y-6">
      
      {/* Duolingo-style Cheerful Welcome Header */}
      <div className="duo-card p-6 bg-gradient-to-br from-amber-50 via-rose-50 to-emerald-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 border-2 border-stone-200 dark:border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-white dark:bg-slate-800 border-2 border-b-4 border-stone-300 dark:border-slate-700 flex items-center justify-center text-3xl shadow-sm shrink-0">
              {currentMember ? currentMember.avatar : '🏡'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl font-black text-stone-900 dark:text-white tracking-tight">
                  Hallo {displayGreetingName}!
                </h2>
                <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-[#FFC800] text-stone-900 border-b-2 border-[#E5A500]">
                  {format(new Date(), 'EEEE', { locale: de })}
                </span>
              </div>
              <p className="text-xs font-bold text-stone-500 dark:text-slate-400 mt-0.5">
                {todayAppointments.length === 0
                  ? 'Heute keine Termine • Zeit für die Familie!'
                  : todayAppointments.length === 1
                    ? '1 Termin auf dem heutigen Plan.'
                    : `${todayAppointments.length} Termine auf dem heutigen Plan.`}
              </p>
            </div>
          </div>

          <button
            onClick={onOpenAddAppointment}
            className="duo-btn duo-btn-green px-5 py-2.5 text-xs font-black rounded-2xl self-start md:self-auto"
          >
            <Plus className="w-4 h-4 mr-1 stroke-[3]" />
            <span>Termin planen</span>
          </button>
        </div>

        {/* Morning Weather & Family Advice Briefing */}
        {weather && (
          <div className="mt-5 p-4 bg-white/80 dark:bg-slate-800/80 rounded-2xl border-2 border-amber-200/80 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3.5 min-w-0">
              <span className="text-3xl p-2 bg-amber-100 dark:bg-slate-700 rounded-2xl shrink-0">
                {weather.icon}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm sm:text-base font-black text-stone-900 dark:text-white">
                    {weather.temperature}°C • {weather.condition}
                  </span>
                  {weather.tempMax !== undefined && weather.tempMin !== undefined && (
                    <span className="text-xs font-bold text-stone-400 dark:text-slate-400">
                      (Max {weather.tempMax}° / Min {weather.tempMin}°)
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-600 dark:text-slate-300 font-bold mt-0.5 truncate sm:whitespace-normal">
                  💡 {weather.familyTip}
                </p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-100/70 dark:bg-slate-700/60 text-[11px] font-black text-amber-900 dark:text-amber-200 shrink-0">
              <CloudSun className="w-3.5 h-3.5 text-amber-600" />
              <span>Familien-Wetter</span>
            </div>
          </div>
        )}

        {/* Chunky 4-stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          
          <div
            onClick={() => onNavigate('calendar')}
            className="cursor-pointer bg-white dark:bg-slate-800/90 p-3.5 rounded-2xl border-2 border-b-4 border-blue-200 dark:border-blue-900/60 hover:border-blue-400 dark:hover:border-blue-700 transition-all text-center"
          >
            <span className="text-xl">📅</span>
            <p className="text-lg font-black text-stone-900 dark:text-white mt-1">{todayAppointments.length}</p>
            <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">Termine heute</p>
          </div>

          <div
            onClick={() => onNavigate('meals')}
            className="cursor-pointer bg-white dark:bg-slate-800/90 p-3.5 rounded-2xl border-2 border-b-4 border-teal-200 dark:border-teal-900/60 hover:border-teal-400 dark:hover:border-teal-700 transition-all text-center"
          >
            <span className="text-xl">🍲</span>
            <p className="text-sm font-black text-stone-900 dark:text-white truncate mt-1">
              {todayMeal?.dinner?.title || 'Tippen zum Planen'}
            </p>
            <p className="text-[11px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wide truncate">
              {dinnerChef ? `Koch: ${dinnerChef.name}` : 'Abendessen'}
            </p>
          </div>

          <div
            onClick={() => onNavigate('lists')}
            className="cursor-pointer bg-white dark:bg-slate-800/90 p-3.5 rounded-2xl border-2 border-b-4 border-amber-200 dark:border-amber-900/60 hover:border-amber-400 dark:hover:border-amber-700 transition-all text-center"
          >
            <span className="text-xl">⭐</span>
            <p className="text-lg font-black text-stone-900 dark:text-white mt-1">
              {completedChoresCount}/{relevantChores.length}
            </p>
            <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">Aufgaben erledigt</p>
          </div>

          <div
            onClick={() => onNavigate('lists')}
            className="cursor-pointer bg-white dark:bg-slate-800/90 p-3.5 rounded-2xl border-2 border-b-4 border-emerald-200 dark:border-emerald-900/60 hover:border-emerald-400 dark:hover:border-emerald-700 transition-all text-center"
          >
            <span className="text-xl">🛒</span>
            <p className="text-lg font-black text-stone-900 dark:text-white mt-1">
              {groceries.filter((g) => !g.checked).length}
            </p>
            <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Einkäufe nötig</p>
          </div>

        </div>
      </div>

      {/* QUICK CHILD DETAILS BAR (Sizes, Doctor, School) - Render only if kids exist */}
      {kids.length > 0 && (
        <div className="duo-card p-5 bg-white dark:bg-slate-900 border-2 border-purple-200 dark:border-purple-900/50">
          <div className="flex items-center justify-between mb-3 gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xl shrink-0">🧸</span>
              <div className="min-w-0">
                <h3 className="font-extrabold text-stone-900 dark:text-white text-sm truncate">
                  Wichtige Kinder-Infos & Kleidergrößen
                </h3>
                <p className="text-[11px] font-semibold text-stone-400 dark:text-slate-400 truncate">
                  Schuhgrößen, Kinderarzt-Telefon und Schuldetails sofort griffbereit
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('members')}
              className="text-xs font-black text-purple-600 dark:text-purple-400 hover:text-purple-800 underline shrink-0 whitespace-nowrap"
            >
              <span className="hidden sm:inline">Familienmitglieder verwalten →</span>
              <span className="sm:hidden">Verwalten →</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {kids.map((kid) => (
              <div
                key={kid.id}
                onClick={() => {
                  setSelectedChildForModal(kid);
                  setChildModalInitialEdit(false);
                }}
                className="cursor-pointer p-3.5 rounded-2xl border-2 border-b-4 border-stone-200 dark:border-slate-800 bg-stone-50/50 dark:bg-slate-800/60 hover:bg-purple-50/40 dark:hover:bg-purple-950/30 hover:border-purple-300 dark:hover:border-purple-700 transition-all flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl shrink-0">{kid.avatar}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <strong className="text-xs font-black text-stone-900 dark:text-white truncate">{kid.name}</strong>
                      <span className="text-[10px] font-bold text-purple-600 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/50 px-1.5 py-0.5 rounded-md shrink-0">
                        {kid.role}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-stone-600 dark:text-slate-300 font-semibold mt-1 truncate">
                      <span className="flex items-center gap-1 shrink-0">
                        <Shirt className="w-3 h-3 text-stone-400 dark:text-slate-400" />
                        <span>{kid.childDetails?.clothingSize || 'Größe k.A.'}</span>
                      </span>
                      <span>•</span>
                      <span className="shrink-0">👟 {kid.childDetails?.shoeSize || 'Schuhe k.A.'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedChildForModal(kid);
                      setChildModalInitialEdit(false);
                    }}
                    className="duo-btn duo-btn-white px-2.5 py-1 text-[11px] font-black rounded-xl"
                  >
                    Karte
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedChildForModal(kid);
                      setChildModalInitialEdit(true);
                    }}
                    className="duo-btn px-2 py-1 text-[11px] font-black rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-200 hover:bg-purple-200 border border-purple-200 dark:border-purple-800"
                    title="Direkt bearbeiten"
                  >
                    ✏️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: Left Column (Events & Dinner) / Right Column (Board & Memories) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Today's Schedule Card */}
          <div className="duo-card p-6 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between mb-4 gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 flex items-center justify-center font-black shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-extrabold text-stone-900 dark:text-white truncate">Heutige Termine</h3>
                  <p className="text-xs font-semibold text-stone-400 dark:text-slate-400 truncate">
                    Gemeinsamer Plan für {currentMember ? currentMember.name : 'die ganze Familie'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('calendar')}
                className="duo-btn duo-btn-white px-3 py-1.5 text-xs font-extrabold rounded-xl shrink-0 whitespace-nowrap"
              >
                <span>Kalender</span>
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>

            {todayAppointments.length === 0 ? (
              <div className="text-center py-8 bg-stone-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-stone-200 dark:border-slate-700">
                <span className="text-3xl mb-1 block">🏖️</span>
                <p className="text-sm font-extrabold text-stone-700 dark:text-slate-200">Heute alles frei!</p>
                <p className="text-xs font-semibold text-stone-400 dark:text-slate-400 mt-0.5">
                  Keine Termine für heute eingetragen.
                </p>
                <button
                  onClick={onOpenAddAppointment}
                  className="mt-3 text-xs font-black text-rose-600 dark:text-rose-400 hover:underline"
                >
                  + Termin für heute hinzufügen
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {todayAppointments.map((app) => {
                  const assignedMembers = members.filter((m) => app.memberIds.includes(m.id));
                  return (
                    <div
                      key={app.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border-2 border-b-4 border-stone-200 dark:border-slate-800 bg-stone-50/50 dark:bg-slate-800/60 hover:bg-stone-50 dark:hover:bg-slate-800 transition-all gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border-2 border-stone-200 dark:border-slate-700 shadow-2xs text-xs font-black text-stone-800 dark:text-slate-100 flex items-center gap-1.5 shrink-0">
                          <Clock className="w-3.5 h-3.5 text-blue-500" />
                          {app.time}
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="text-sm font-black text-stone-900 dark:text-white">
                            {app.title}
                          </h4>
                          {app.location && (
                            <p className="text-xs font-semibold text-stone-500 dark:text-slate-400 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-stone-400 dark:text-slate-500" />
                              <span>{app.location}</span>
                            </p>
                          )}
                          {app.notes && (
                            <p className="text-xs text-stone-600 dark:text-slate-300 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-lg border border-stone-200 dark:border-slate-700 inline-block mt-1 font-medium">
                              {app.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Attendee Avatars */}
                      <div className="flex items-center gap-1.5 self-end sm:self-center">
                        <div className="flex -space-x-1.5">
                          {assignedMembers.map((m) => (
                            <div
                              key={m.id}
                              title={`${m.name} (${m.role})`}
                              className="w-8 h-8 rounded-full bg-white dark:bg-slate-900 border-2 border-stone-200 dark:border-slate-700 shadow-xs flex items-center justify-center text-sm"
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
          <div className="duo-card p-6 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between mb-4 gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-2xl bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 flex items-center justify-center font-black shrink-0">
                  <Utensils className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-extrabold text-stone-900 dark:text-white truncate">Heutiges Abendessen</h3>
                  <p className="text-xs font-semibold text-stone-400 dark:text-slate-400 truncate">Gemeinsame Wochenplanung</p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('meals')}
                className="duo-btn duo-btn-white px-3 py-1.5 text-xs font-extrabold rounded-xl shrink-0 whitespace-nowrap"
              >
                <span>Essensplan</span>
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>

            {todayMeal?.dinner?.title ? (
              <div className="flex flex-col sm:flex-row gap-4 bg-teal-50/50 dark:bg-teal-950/30 rounded-2xl border-2 border-teal-200 dark:border-teal-900/60 p-4">
                {dinnerRecipe?.imageUrl ? (
                  <img
                    src={dinnerRecipe.imageUrl}
                    alt={todayMeal.dinner.title}
                    className="w-full sm:w-32 h-28 object-cover rounded-2xl shadow-xs border-2 border-white dark:border-slate-800"
                  />
                ) : (
                  <div className="w-full sm:w-32 h-28 rounded-2xl bg-teal-100 dark:bg-teal-950/80 flex items-center justify-center text-3xl">
                    🍲
                  </div>
                )}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-teal-200 dark:bg-teal-900/60 text-teal-900 dark:text-teal-200">
                        Abendessen
                      </span>
                      {dinnerChef && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-stone-700 dark:text-slate-300 border border-stone-200 dark:border-slate-700 flex items-center gap-1">
                          <span>Koch:</span>
                          <span>{dinnerChef.avatar}</span>
                          <span className="font-black">{dinnerChef.name}</span>
                        </span>
                      )}
                    </div>
                    <h4 className="text-base font-black text-stone-900 dark:text-white">{todayMeal.dinner.title}</h4>
                    {dinnerRecipe?.notes && (
                      <p className="text-xs text-stone-600 dark:text-slate-300 mt-1 font-medium line-clamp-2">
                        {dinnerRecipe.notes}
                      </p>
                    )}
                  </div>

                  {dinnerRecipe && (
                    <div className="mt-3 pt-2 border-t border-teal-100 dark:border-teal-900/40 flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-500 dark:text-slate-400">
                        {dinnerRecipe.ingredients.length} Zutaten
                      </span>
                      <button
                        onClick={() => addRecipeIngredientsToGrocery(dinnerRecipe)}
                        className="duo-btn duo-btn-green px-3 py-1 text-xs font-black rounded-xl"
                      >
                        + Zur Einkaufsliste
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 bg-stone-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-stone-200 dark:border-slate-700">
                <p className="text-xs font-bold text-stone-600 dark:text-slate-300">Heutiges Abendessen ist noch nicht geplant!</p>
                <button
                  onClick={() => onNavigate('meals')}
                  className="mt-2 text-xs font-black text-teal-600 dark:text-teal-400 underline"
                >
                  Rezept aus dem Planer wählen
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Right Column (5 cols): Bulletin Board & Chores */}
        <div className="lg:col-span-5 space-y-6">

          {/* Quick Chores */}
          <div className="duo-card p-6 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between mb-4 gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 flex items-center justify-center font-black shrink-0">
                  <span>⭐</span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-extrabold text-stone-900 dark:text-white truncate">Heutige Aufgaben</h3>
                  <p className="text-xs font-semibold text-stone-400 dark:text-slate-400 truncate">Sterne sammeln für Mithilfe!</p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('lists')}
                className="duo-btn duo-btn-white px-3 py-1.5 text-xs font-extrabold rounded-xl shrink-0 whitespace-nowrap"
              >
                <span>Alle Aufgaben</span>
              </button>
            </div>

            {relevantChores.length === 0 ? (
              <div className="text-center py-6 bg-stone-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-stone-200 dark:border-slate-700">
                <span className="text-2xl mb-1 block">✨</span>
                <p className="text-xs font-bold text-stone-600 dark:text-slate-300">Keine offenen Aufgaben für heute.</p>
                <button
                  onClick={() => onNavigate('lists')}
                  className="mt-2 text-xs font-black text-amber-600 dark:text-amber-400 hover:underline"
                >
                  + Erste Aufgabe eintragen
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {relevantChores.slice(0, 4).map((chore) => {
                  const assignees =
                    chore.assignedMemberIds && chore.assignedMemberIds.length > 0
                      ? members.filter((m) => chore.assignedMemberIds!.includes(m.id))
                      : chore.assignedMemberId
                      ? members.filter((m) => m.id === chore.assignedMemberId)
                      : [];
                  const completedBy = members.find((m) => m.id === chore.completedByMemberId);

                  return (
                    <div
                      key={chore.id}
                      onClick={() => handleDashboardChoreClick(chore)}
                      className={`cursor-pointer flex items-center justify-between p-3 rounded-2xl border-2 transition-all ${
                        chore.completed
                          ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 opacity-65'
                          : 'bg-white dark:bg-slate-800/80 border-b-4 border-stone-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {chore.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-amber-500 fill-amber-100 dark:fill-amber-950/50 shrink-0" />
                        ) : (
                          <Circle className="w-5 h-5 text-stone-300 dark:text-slate-600 hover:text-amber-500 shrink-0" />
                        )}
                        <div>
                          <p
                            className={`text-xs font-extrabold ${
                              chore.completed ? 'line-through text-stone-400 dark:text-slate-500' : 'text-stone-800 dark:text-white'
                            }`}
                          >
                            {chore.title}
                          </p>

                          {chore.completed ? (
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1 mt-0.5">
                              <span>✓ Erledigt von</span>
                              {completedBy ? (
                                <>
                                  <span>{completedBy.avatar}</span>
                                  <span className="font-extrabold">{completedBy.name}</span>
                                </>
                              ) : (
                                <span>einem Familienmitglied</span>
                              )}
                            </span>
                          ) : currentMemberId === 'all' && (
                            <span className="text-[10px] text-stone-500 dark:text-slate-400 font-bold flex items-center gap-1 mt-0.5">
                              {assignees.length === 0 ? (
                                <span className="text-teal-600 dark:text-teal-400">👥 Offen für alle</span>
                              ) : assignees.length === 1 ? (
                                <>
                                  <span>{assignees[0].avatar}</span>
                                  <span>{assignees[0].name}</span>
                                </>
                              ) : (
                                <span className="text-indigo-600 dark:text-indigo-400">
                                  👥 {assignees.map((a) => a.name).join(' & ')}
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs font-black text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded-lg">
                        ⭐ +{chore.stars}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Family Notice Board */}
          <div className="duo-card p-6 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between mb-4 gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 flex items-center justify-center font-black shrink-0">
                  <Pin className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-extrabold text-stone-900 dark:text-white truncate">Schwarzes Brett</h3>
                  <p className="text-xs font-semibold text-stone-400 dark:text-slate-400 truncate">WLAN, Buspläne & Notizen</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddNoteModal(true)}
                className="duo-btn duo-btn-rose px-3 py-1.5 text-xs font-black rounded-xl shrink-0 whitespace-nowrap flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="hidden sm:inline">Notiz anheften</span>
                <span className="sm:hidden">Notiz</span>
              </button>
            </div>

            {notes.length === 0 ? (
              <div className="text-center py-6 bg-stone-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-stone-200 dark:border-slate-700">
                <span className="text-2xl mb-1 block">📌</span>
                <p className="text-xs font-bold text-stone-600 dark:text-slate-300">Noch keine Notizen auf dem Schwarzen Brett.</p>
                <button
                  onClick={() => setShowAddNoteModal(true)}
                  className="mt-2 text-xs font-black text-rose-600 dark:text-rose-400 hover:underline"
                >
                  + Erste Notiz anheften
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {notes.map((note) => {
                  const author = members.find((m) => m.id === note.authorMemberId);
                  const tagStyles = {
                    wifi: 'bg-sky-50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800 text-sky-950 dark:text-sky-200',
                    urgent: 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-200',
                    fun: 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200',
                    info: 'bg-stone-50 dark:bg-slate-800 border-stone-300 dark:border-slate-700 text-stone-950 dark:text-slate-200',
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
                          {note.tag === 'wifi' && <Wifi className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />}
                          {note.tag === 'urgent' && <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />}
                          {note.tag === 'fun' && <PartyPopper className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
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
                      <div className="mt-2 flex items-center justify-between text-[10px] text-stone-400 dark:text-slate-400 font-semibold">
                        <span>Von {author ? author.name : 'Familie'}</span>
                        <span>{note.createdAt}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Child Details Modal */}
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

      {/* Add Note Modal */}
      {showAddNoteModal && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-xl border-2 border-stone-200 dark:border-slate-800 animate-in fade-in zoom-in-95 my-auto overflow-hidden">
            <div className="flex items-center justify-between mb-4 border-b border-stone-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-black text-stone-900 dark:text-white">Notiz anheften</h3>
              <button
                type="button"
                onClick={() => setShowAddNoteModal(false)}
                className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-slate-800 text-stone-400 hover:text-stone-600 dark:hover:text-white flex items-center justify-center text-sm font-bold transition-colors shrink-0"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddNote} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-stone-600 dark:text-slate-300 uppercase mb-1">Titel</label>
                <input
                  type="text"
                  placeholder="z.B. Babysitter-Telefon, WLAN-Passwort"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-sm focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-stone-600 dark:text-slate-300 uppercase mb-1">Kategorie</label>
                <div className="grid grid-cols-4 gap-2">
                  {([
                    { tag: 'info', label: 'Info' },
                    { tag: 'urgent', label: 'Wichtig' },
                    { tag: 'wifi', label: 'WLAN' },
                    { tag: 'fun', label: 'Spaß' },
                  ] as const).map(({ tag, label }) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setNoteTag(tag)}
                      className={`duo-btn py-1.5 text-xs font-black rounded-xl ${
                        noteTag === tag
                          ? 'duo-btn-rose'
                          : 'duo-btn-white'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-stone-600 dark:text-slate-300 uppercase mb-1">Details</label>
                <textarea
                  rows={3}
                  placeholder="Nachricht oder Notiz hier eingeben..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-sm focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddNoteModal(false)}
                  className="duo-btn duo-btn-white px-4 py-2 text-xs font-bold rounded-xl"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="duo-btn duo-btn-rose px-5 py-2 text-xs font-black rounded-xl"
                >
                  Notiz anheften
                </button>
              </div>
            </form>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* Claim Picker Modal for Open / Multi-Assignee Chores */}
      {claimingChore && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-xl border-2 border-stone-200 dark:border-slate-800 animate-in fade-in zoom-in-95 text-center">
              <span className="text-4xl mb-2 block">🌟</span>
              <h3 className="text-lg font-black text-stone-900 dark:text-white mb-1">
                Wer hat es erledigt?
              </h3>
              <p className="text-xs font-semibold text-stone-500 dark:text-slate-400 mb-4">
                „{claimingChore.title}“ (+{claimingChore.stars} ⭐)
              </p>

              <div className="space-y-2 mb-4">
                {getEligibleClaimants(claimingChore).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      toggleChore(claimingChore.id, m.id);
                      setClaimingChore(null);
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-2xl border-2 border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 hover:bg-amber-50 hover:border-amber-300 dark:hover:bg-amber-950/40 dark:hover:border-amber-700 transition-all cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{m.avatar}</span>
                      <div>
                        <p className="text-sm font-black text-stone-900 dark:text-white">{m.name}</p>
                        <p className="text-[10px] font-bold text-stone-400">{m.role}</p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-2.5 py-1 rounded-xl">
                      +{claimingChore.stars} ⭐
                    </span>
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setClaimingChore(null)}
                className="duo-btn duo-btn-white w-full py-2 text-xs font-bold rounded-xl"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </ModalPortal>
      )}

    </div>
  );
};
