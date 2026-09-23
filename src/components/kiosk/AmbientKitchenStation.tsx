import React, { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import confetti from 'canvas-confetti';
import {
  ChefHat,
  CheckCircle2,
  Circle,
  ChevronDown,
  Timer,
  ShoppingBag,
  Heart,
  Sparkles,
} from 'lucide-react';
import { useFamily } from '../../context/FamilyContext';
import { fetchFamilyWeather, FamilyWeather } from '../../services/weatherService';
import {
  Daypart,
  getCurrentDaypart,
  setSimulatedDaypart,
} from '../../services/contextEngine';
import { getButlerStagedCart } from '../../services/storeCartService';
import { ActiveTab } from '../Header';

interface AmbientKitchenStationProps {
  onOpenFullHub: (tab?: ActiveTab) => void;
  onOpenAssistant?: () => void;
  onLaunchShopping?: () => void;
}

export const AmbientKitchenStation: React.FC<AmbientKitchenStationProps> = ({
  onOpenFullHub,
  onOpenAssistant,
  onLaunchShopping,
}) => {
  const {
    members,
    appointments,
    mealPlans,
    recipes,
    chores,
    toggleChore,
    photos,
    familyName,
    groceries,
  } = useFamily();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [weather, setWeather] = useState<FamilyWeather | null>(null);
  const [daypart, setDaypart] = useState<Daypart>(() => getCurrentDaypart());
  const [cookingTimerSeconds, setCookingTimerSeconds] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Local state for kid punch-cards (teeth, shoes, bag) for today
  const [morningPunches, setMorningPunches] = useState<Record<string, { teeth: boolean; shoes: boolean; bag: boolean }>>(() => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const saved = localStorage.getItem(`famly_morning_punches_${today}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Photo slideshow index for Calm Ambient mode
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      setDaypart(getCurrentDaypart(now));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Listen for simulated daypart changes
  useEffect(() => {
    const handleDaypartChange = (e: any) => {
      setDaypart(e.detail || getCurrentDaypart());
    };
    window.addEventListener('famly_daypart_change', handleDaypartChange);
    return () => window.removeEventListener('famly_daypart_change', handleDaypartChange);
  }, []);

  // Fetch weather
  useEffect(() => {
    fetchFamilyWeather().then(setWeather).catch(() => {});
  }, []);

  // Cooking timer countdown
  useEffect(() => {
    if (!isTimerRunning || cookingTimerSeconds === null) return;
    if (cookingTimerSeconds <= 0) {
      setIsTimerRunning(false);
      playSuccessChime();
      confetti({ particleCount: 50, spread: 60 });
      return;
    }
    const interval = setInterval(() => {
      setCookingTimerSeconds((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning, cookingTimerSeconds]);

  // Rotate photos in ambient mode
  useEffect(() => {
    if (daypart !== 'day_ambient' || photos.length === 0) return;
    const interval = setInterval(() => {
      setActivePhotoIdx((prev) => (prev + 1) % photos.length);
    }, 12000);
    return () => clearInterval(interval);
  }, [daypart, photos.length]);

  // Audio chime feedback
  const playSuccessChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    } catch {
      // Audio might be blocked by browser autoplay policy
    }
  };

  const todayStr = useMemo(() => currentTime.toISOString().split('T')[0], [currentTime]);

  // Today's appointments
  const todayAppointments = useMemo(() => {
    return appointments
      .filter((a) => a.date === todayStr)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [appointments, todayStr]);

  // Next upcoming appointment
  const nextAppointment = useMemo(() => {
    const currentClockStr = format(currentTime, 'HH:mm');
    return todayAppointments.find((a) => a.time >= currentClockStr) || todayAppointments[0];
  }, [todayAppointments, currentTime]);

  // Today's dinner
  const todayMeal = useMemo(() => mealPlans.find((m) => m.date === todayStr), [mealPlans, todayStr]);
  const dinnerRecipe = useMemo(() => {
    return todayMeal?.dinner?.recipeId
      ? recipes.find((r) => r.id === todayMeal.dinner?.recipeId)
      : null;
  }, [todayMeal, recipes]);

  const dinnerChef = useMemo(() => {
    return todayMeal?.dinner?.chefId
      ? members.find((m) => m.id === todayMeal.dinner?.chefId)
      : null;
  }, [todayMeal, members]);

  // Autonomous Butler Staged Cart
  const stagedCart = useMemo(() => {
    return getButlerStagedCart(mealPlans, recipes, groceries, 3);
  }, [mealPlans, recipes, groceries]);

  // Kids in household
  const kids = useMemo(() => members.filter((m) => m.isChild), [members]);

  // Toggle kid morning punch
  const handleToggleMorningPunch = (childId: string, punch: 'teeth' | 'shoes' | 'bag') => {
    playSuccessChime();
    confetti({
      particleCount: 25,
      spread: 45,
      origin: { y: 0.7 },
      colors: ['#3B82F6', '#10B981', '#F59E0B'],
    });

    setMorningPunches((prev) => {
      const childData = prev[childId] || { teeth: false, shoes: false, bag: false };
      const updated = {
        ...prev,
        [childId]: {
          ...childData,
          [punch]: !childData[punch],
        },
      };
      try {
        localStorage.setItem(`famly_morning_punches_${todayStr}`, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const uncheckedGroceriesCount = groceries.filter((g) => !g.checked).length;

  return (
    <div className={`min-h-screen flex flex-col justify-between transition-colors duration-700 select-none p-4 sm:p-8 ${
      daypart === 'night_dim'
        ? 'bg-[#090D16] text-amber-100/90'
        : 'bg-[#F4F6F9] dark:bg-[#0c1222] text-stone-900 dark:text-white'
    }`}>
      
      {/* Top Ambient Bar: Live Clock, Weather & Quick Simulation Switcher */}
      <header className="flex items-center justify-between gap-4 border-b border-stone-200/60 dark:border-slate-800/80 pb-4">
        {/* Large Kitchen Clock */}
        <div className="flex items-baseline gap-3">
          <span className="text-4xl sm:text-6xl font-black tracking-tight font-mono">
            {format(currentTime, 'HH:mm')}
          </span>
          <span className="text-base sm:text-xl font-bold text-stone-500 dark:text-slate-400">
            {format(currentTime, 'EEEE, d. MMMM', { locale: de })}
          </span>
        </div>

        {/* Weather & Daypart Tag */}
        <div className="flex items-center gap-3 sm:gap-6">
          {weather && (
            <div className="flex items-center gap-2 bg-white/80 dark:bg-slate-800/80 px-4 py-2 rounded-2xl border-2 border-stone-200 dark:border-slate-700 shadow-xs">
              <span className="text-2xl">{weather.icon}</span>
              <div>
                <div className="text-sm font-black">{Math.round(weather.temperature)}°C</div>
                <div className="text-[11px] font-semibold text-stone-500 dark:text-slate-400 truncate max-w-[120px] sm:max-w-[200px]">
                  {weather.condition}
                </div>
              </div>
            </div>
          )}

          {/* Quick Daypart Simulation Pill (Allows parents to test or toggle time states) */}
          <div className="hidden md:flex items-center bg-stone-200/80 dark:bg-slate-800 p-1 rounded-2xl text-xs font-bold gap-1">
            <button
              onClick={() => setSimulatedDaypart('morning_rush')}
              className={`px-2.5 py-1 rounded-xl transition-all ${
                daypart === 'morning_rush'
                  ? 'bg-amber-400 text-stone-900 shadow-xs font-black'
                  : 'text-stone-500 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              ☀️ Morgen
            </button>
            <button
              onClick={() => setSimulatedDaypart('day_ambient')}
              className={`px-2.5 py-1 rounded-xl transition-all ${
                daypart === 'day_ambient'
                  ? 'bg-sky-400 text-white shadow-xs font-black'
                  : 'text-stone-500 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              🌿 Tag
            </button>
            <button
              onClick={() => setSimulatedDaypart('evening_hub')}
              className={`px-2.5 py-1 rounded-xl transition-all ${
                daypart === 'evening_hub'
                  ? 'bg-orange-500 text-white shadow-xs font-black'
                  : 'text-stone-500 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              🍲 Abend
            </button>
            <button
              onClick={() => setSimulatedDaypart('night_dim')}
              className={`px-2.5 py-1 rounded-xl transition-all ${
                daypart === 'night_dim'
                  ? 'bg-indigo-600 text-white shadow-xs font-black'
                  : 'text-stone-500 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              🌙 Nacht
            </button>
          </div>
        </div>
      </header>

      {/* Main Adaptive Stage: Dynamic based on Daypart */}
      <main className="flex-1 my-6 flex flex-col justify-center">
        
        {/* ========================================================================= */}
        {/* 1. MORNING RUSH (06:30 - 09:00): Departure countdown & kids punch cards */}
        {/* ========================================================================= */}
        {daypart === 'morning_rush' && (
          <div className="space-y-6 max-w-5xl mx-auto w-full animate-in fade-in zoom-in-95 duration-500">
            {/* Morning Departure Pill & Weather Tip */}
            <div className="bg-amber-100/80 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700/60 p-4 sm:p-5 rounded-3xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🎒</span>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-amber-950 dark:text-amber-200">
                    Guten Morgen, Familie {familyName}!
                  </h3>
                  <p className="text-xs sm:text-sm font-bold text-amber-800 dark:text-amber-300">
                    {weather?.familyTip || 'Alles bereit für den Start in den Schultag.'}
                  </p>
                </div>
              </div>

              {nextAppointment && (
                <div className="bg-white dark:bg-slate-900 px-4 py-2 rounded-2xl border-2 border-amber-300 dark:border-amber-700 text-right">
                  <span className="text-[10px] uppercase font-black tracking-wider text-amber-600 block">Nächster Termin</span>
                  <span className="text-sm font-black text-stone-900 dark:text-white">
                    {nextAppointment.time} Uhr • {nextAppointment.title}
                  </span>
                </div>
              )}
            </div>

            {/* Kids 3-Punch Launchpad: Big, tactile buttons for kids */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {kids.length > 0 ? (
                kids.map((kid) => {
                  const punch = morningPunches[kid.id] || { teeth: false, shoes: false, bag: false };
                  const completedCount = Number(punch.teeth) + Number(punch.shoes) + Number(punch.bag);

                  return (
                    <div
                      key={kid.id}
                      className="bg-white dark:bg-slate-900 border-3 border-stone-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col justify-between gap-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{kid.avatar}</span>
                          <div>
                            <h4 className="text-lg font-black text-stone-900 dark:text-white">{kid.name}</h4>
                            <span className="text-xs font-bold text-stone-400">
                              {completedCount === 3 ? '🎉 Alles fertig!' : `${completedCount}/3 Aufgaben`}
                            </span>
                          </div>
                        </div>

                        {completedCount === 3 && (
                          <span className="text-2xl animate-bounce">⭐</span>
                        )}
                      </div>

                      {/* The 3 Punch Icons */}
                      <div className="grid grid-cols-3 gap-2">
                        {/* 1. Teeth */}
                        <button
                          type="button"
                          onClick={() => handleToggleMorningPunch(kid.id, 'teeth')}
                          className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-1 transition-all active:scale-95 ${
                            punch.teeth
                              ? 'bg-emerald-500 border-emerald-600 text-white font-black shadow-xs'
                              : 'bg-stone-50 dark:bg-slate-800 border-stone-200 dark:border-slate-700 text-stone-700 dark:text-slate-300'
                          }`}
                        >
                          <span className="text-2xl">🪥</span>
                          <span className="text-[11px] font-bold">Zähne</span>
                        </button>

                        {/* 2. School Bag */}
                        <button
                          type="button"
                          onClick={() => handleToggleMorningPunch(kid.id, 'bag')}
                          className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-1 transition-all active:scale-95 ${
                            punch.bag
                              ? 'bg-emerald-500 border-emerald-600 text-white font-black shadow-xs'
                              : 'bg-stone-50 dark:bg-slate-800 border-stone-200 dark:border-slate-700 text-stone-700 dark:text-slate-300'
                          }`}
                        >
                          <span className="text-2xl">🎒</span>
                          <span className="text-[11px] font-bold">Ranzen</span>
                        </button>

                        {/* 3. Shoes & Jacket */}
                        <button
                          type="button"
                          onClick={() => handleToggleMorningPunch(kid.id, 'shoes')}
                          className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-1 transition-all active:scale-95 ${
                            punch.shoes
                              ? 'bg-emerald-500 border-emerald-600 text-white font-black shadow-xs'
                              : 'bg-stone-50 dark:bg-slate-800 border-stone-200 dark:border-slate-700 text-stone-700 dark:text-slate-300'
                          }`}
                        >
                          <span className="text-2xl">👟</span>
                          <span className="text-[11px] font-bold">Schuhe</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border-2 border-stone-200 dark:border-slate-800">
                  <p className="text-base font-bold text-stone-500">Keine Kinder-Profile eingerichtet.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. DAY AMBIENT (09:00 - 15:30): Calm Hearth & Memory Slideshow            */}
        {/* ========================================================================= */}
        {daypart === 'day_ambient' && (
          <div className="max-w-4xl mx-auto w-full grid grid-cols-1 md:grid-cols-12 gap-6 items-center animate-in fade-in duration-700">
            {/* Left: Memory Photo Frame */}
            <div className="md:col-span-7 bg-white dark:bg-slate-900 p-4 rounded-3xl border-3 border-stone-200 dark:border-slate-800 shadow-md">
              {photos.length > 0 && photos[activePhotoIdx] ? (
                <div className="relative aspect-4/3 rounded-2xl overflow-hidden bg-stone-100 dark:bg-slate-800">
                  <img
                    src={photos[activePhotoIdx].imageUrl || (photos[activePhotoIdx] as any).url}
                    alt={photos[activePhotoIdx].caption || 'Familienmoment'}
                    className="w-full h-full object-cover transition-opacity duration-1000"
                  />
                  {photos[activePhotoIdx].caption && (
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 text-white">
                      <p className="text-sm font-black">{photos[activePhotoIdx].caption}</p>
                      <span className="text-xs text-stone-300">{photos[activePhotoIdx].date}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-4/3 rounded-2xl bg-amber-50 dark:bg-slate-800/60 border-2 border-dashed border-amber-200 dark:border-slate-700 flex flex-col items-center justify-center text-center p-6">
                  <Heart className="w-12 h-12 text-rose-400 mb-2 stroke-[2]" />
                  <h4 className="text-base font-black text-stone-800 dark:text-stone-200">Familie {familyName}</h4>
                  <p className="text-xs text-stone-500 mt-1">Hier erscheinen gemeinsame Fotos & Erinnerungen.</p>
                </div>
              )}
            </div>

            {/* Right: Peaceful Status & Dinner Preview */}
            <div className="md:col-span-5 space-y-4">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border-2 border-stone-200 dark:border-slate-800">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-600 block mb-1">Status</span>
                <h3 className="text-lg font-black text-stone-900 dark:text-white">Alles ruhig im Haus 🏡</h3>
                <p className="text-xs text-stone-500 mt-1">Schule & Arbeit laufen planmäßig.</p>
              </div>

              {dinnerRecipe && (
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border-2 border-stone-200 dark:border-slate-800">
                  <span className="text-xs font-black uppercase tracking-wider text-orange-600 block mb-1">Heute Abend</span>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-3xl">🍲</span>
                    <div>
                      <h4 className="text-base font-black text-stone-900 dark:text-white">{dinnerRecipe.title}</h4>
                      <p className="text-xs text-stone-500">
                        {dinnerChef ? `Chefkoch: ${dinnerChef.name}` : 'Gemeinsam kochen'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Butler Staged Cart in Ambient Mode */}
              {stagedCart.totalItemCount > 0 && (
                <div className="bg-emerald-50 dark:bg-emerald-950/40 p-5 rounded-3xl border-2 border-emerald-300 dark:border-emerald-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                      Warenkorb vorbefüllt 🛒
                    </span>
                    <span className="text-xs font-black bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 px-2 py-0.5 rounded-full">
                      {stagedCart.totalItemCount} Artikel
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                    Zutaten für Abendessen & Vorräte bereitgestellt (~{stagedCart.estimatedTotalEur} €).
                  </p>
                  <a
                    href={stagedCart.reweCartUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="duo-btn duo-btn-green w-full py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <span>1-Klick: Bei Rewe bestellen</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. EVENING HUB (15:30 - 20:30): Dinner Hub & Cooking Timer                */}
        {/* ========================================================================= */}
        {daypart === 'evening_hub' && (
          <div className="max-w-4xl mx-auto w-full space-y-6 animate-in fade-in duration-500">
            {/* Big Dinner Command Card */}
            <div className="bg-gradient-to-br from-orange-500 to-amber-500 text-white p-6 sm:p-8 rounded-3xl shadow-lg relative overflow-hidden">
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 text-orange-100 text-xs font-black uppercase tracking-wider mb-1">
                    <ChefHat className="w-4 h-4" />
                    <span>Heute Abend auf dem Tisch</span>
                  </div>
                  <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
                    {dinnerRecipe ? dinnerRecipe.title : 'Kein Gericht geplant'}
                  </h2>
                  <p className="text-sm font-bold text-orange-100 mt-1">
                    {dinnerChef ? `Zubereitet von ${dinnerChef.name} ${dinnerChef.avatar || '👨‍🍳'}` : 'Familien-Abendessen'}
                  </p>
                </div>

                {/* Cooking Timer Button */}
                <div className="bg-white/20 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-white/30 flex items-center gap-4">
                  {cookingTimerSeconds !== null && cookingTimerSeconds > 0 ? (
                    <div className="text-center font-mono">
                      <span className="text-2xl sm:text-3xl font-black">
                        {Math.floor(cookingTimerSeconds / 60)}:
                        {(cookingTimerSeconds % 60).toString().padStart(2, '0')}
                      </span>
                      <div className="flex gap-2 mt-1">
                        <button
                          onClick={() => setIsTimerRunning(!isTimerRunning)}
                          className="px-3 py-1 bg-white text-orange-600 rounded-xl text-xs font-black"
                        >
                          {isTimerRunning ? 'Pause' : 'Weiter'}
                        </button>
                        <button
                          onClick={() => {
                            setCookingTimerSeconds(null);
                            setIsTimerRunning(false);
                          }}
                          className="px-3 py-1 bg-black/20 text-white rounded-xl text-xs font-bold"
                        >
                          Stop
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setCookingTimerSeconds(20 * 60); // 20 min timer
                        setIsTimerRunning(true);
                        playSuccessChime();
                      }}
                      className="px-4 py-2.5 bg-white text-orange-600 rounded-xl text-sm font-black flex items-center gap-2 hover:bg-orange-50 active:scale-95 transition-all shadow-md"
                    >
                      <Timer className="w-4 h-4" />
                      <span>20 Min Koch-Timer starten</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Chores Check-Off */}
            <div className="bg-white dark:bg-slate-900 border-2 border-stone-200 dark:border-slate-800 p-5 rounded-3xl">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-base font-black text-stone-900 dark:text-white flex items-center gap-2">
                  <span>Tages-Aufgaben</span>
                  <span className="text-xs font-bold text-amber-500">⭐ Sterne sammeln</span>
                </h4>
                <button
                  onClick={() => onOpenFullHub('calendar')}
                  className="text-xs font-bold text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
                >
                  Alle anzeigen
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {chores.slice(0, 4).map((chore) => (
                  <button
                    key={chore.id}
                    onClick={() => {
                      playSuccessChime();
                      toggleChore(chore.id);
                    }}
                    className={`p-3 rounded-2xl border-2 flex items-center justify-between gap-3 text-left transition-all active:scale-98 ${
                      chore.completed
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                        : 'bg-stone-50 dark:bg-slate-800/60 border-stone-200 dark:border-slate-700 text-stone-800 dark:text-stone-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {chore.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-stone-400 shrink-0" />
                      )}
                      <span className={`text-xs font-black truncate ${chore.completed ? 'line-through opacity-70' : ''}`}>
                        {chore.title}
                      </span>
                    </div>
                    <span className="text-xs font-black text-amber-500 shrink-0">+{chore.stars || 1} ⭐</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 4. NIGHT DIM (20:30 - 06:30): Low Blue-Light Rest Mode                   */}
        {/* ========================================================================= */}
        {daypart === 'night_dim' && (
          <div className="max-w-md mx-auto w-full text-center space-y-4 animate-in fade-in duration-1000">
            <div className="w-20 h-20 rounded-full bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center text-4xl mx-auto">
              🌙
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-amber-200/90 tracking-tight">
              Gute Nacht, Familie {familyName}
            </h2>
            <p className="text-sm font-semibold text-amber-300/60">
              Der Tag ist vollbracht. Bildschirm schläft im Nachtmodus.
            </p>
          </div>
        )}

      </main>

      {/* Bottom Bar: 1-Tap Expansion to Full Hub (Calendar, Meals, Groceries, Settings) */}
      <footer className="flex items-center justify-between gap-4 border-t border-stone-200/60 dark:border-slate-800/80 pt-4">
        <div className="flex items-center gap-2">
          {/* Groceries Quick Glance Button */}
          {uncheckedGroceriesCount > 0 ? (
            <button
              onClick={() => onLaunchShopping ? onLaunchShopping() : onOpenFullHub('groceries')}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-2xl text-xs font-black shadow-xs active:scale-95 transition-all"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{uncheckedGroceriesCount} Einkaufs-Artikel</span>
            </button>
          ) : (
            <div className="text-xs font-bold text-stone-400">
              Kühlschrank-Station aktiv
            </div>
          )}

          {/* Butler Staged Cart Quick Launch Button */}
          {stagedCart.totalItemCount > 0 && (
            <a
              href={stagedCart.reweCartUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-2 bg-white dark:bg-slate-800 hover:bg-stone-100 text-emerald-700 dark:text-emerald-400 border-2 border-emerald-500/50 px-3.5 py-2.5 rounded-2xl text-xs font-black shadow-xs active:scale-95 transition-all"
              title="Vorbefüllten Rewe-Warenkorb öffnen"
            >
              <span>🛒</span>
              <span>Rewe-Warenkorb ({stagedCart.totalItemCount} Artikel • ~{stagedCart.estimatedTotalEur} €)</span>
            </a>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Famly AI Assistant Quick Trigger */}
          {onOpenAssistant && (
            <button
              onClick={onOpenAssistant}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border-2 border-amber-300 dark:border-amber-700 text-xs font-black shadow-xs active:scale-95 transition-all"
              title="Famly Assistent"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 stroke-[2.5]" />
              <span className="hidden sm:inline">Assistent</span>
            </button>
          )}

          {/* Big Expansion Button to Open Full Hub (Returns to ambient automatically after 60s idle) */}
          <button
            onClick={() => onOpenFullHub('dashboard')}
            className="duo-btn duo-btn-white dark:bg-slate-800 dark:text-white px-5 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 shadow-xs active:scale-95 transition-all"
          >
            <span>Alle Bereiche öffnen</span>
            <ChevronDown className="w-4 h-4 stroke-[3]" />
          </button>
        </div>
      </footer>

    </div>
  );
};
