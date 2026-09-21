import React, { useState } from 'react';
import { FamilyProvider, useFamily } from './context/FamilyContext';
import { Header, ActiveTab } from './components/Header';
import { MobileBottomNav } from './components/MobileBottomNav';
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { CalendarView } from './views/CalendarView';
import { MealPlannerView } from './views/MealPlannerView';
import { PhotoStreamView } from './views/PhotoStreamView';
import { ListsAndChoresView } from './views/ListsAndChoresView';
import { FamilyMembersView } from './views/FamilyMembersView';
import { QuickAddModal } from './components/QuickAddModal';
import { GuestGalleryViewer } from './components/GuestGalleryViewer';
import { SettingsModal } from './components/SettingsModal';
import { DecisionMakerModal } from './components/DecisionMakerModal';
import { OnboardingView } from './views/OnboardingView';
import { KidsView } from './views/KidsView';

const MainAppContent: React.FC = () => {
  const { loggedInMemberId, galleries, isOnboarded } = useFamily();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isKidsMode, setIsKidsMode] = useState(false);
  const [isDecisionOpen, setIsDecisionOpen] = useState(false);

  // Detect direct guest link for relatives: e.g. #guest-gallery=gal_1
  const [guestGalleryId, setGuestGalleryId] = useState<string | null>(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#guest-gallery=')) {
      return hash.replace('#guest-gallery=', '');
    }
    return null;
  });

  const sharedGuestGallery = guestGalleryId
    ? galleries.find((g) => g.id === guestGalleryId || g.shareCode === guestGalleryId)
    : null;

  if (sharedGuestGallery) {
    return (
      <GuestGalleryViewer
        gallery={sharedGuestGallery}
        onClose={() => {
          window.location.hash = '';
          setGuestGalleryId(null);
        }}
      />
    );
  }

  // If family is not onboarded yet, show friendly Onboarding Wizard
  if (!isOnboarded) {
    return <OnboardingView />;
  }

  // If no member is logged in, show the Login / Who is using screen
  if (!loggedInMemberId) {
    return <LoginView />;
  }

  // If Kids Mode is active, render dedicated Kids View
  if (isKidsMode) {
    return <KidsView onExitKidsMode={() => setIsKidsMode(false)} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F9FA] dark:bg-[#0c1222] text-stone-900 dark:text-slate-100 font-sans pb-24 sm:pb-8 transition-colors">
      {/* Sticky Header with Logged-in Profile, Theme & Quick Add */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onQuickAdd={() => setIsQuickAddOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onToggleKidsMode={() => setIsKidsMode(true)}
        onOpenDecision={() => setIsDecisionOpen(true)}
      />

      {/* Main Content Area with Smooth Page Animation */}
      <main key={activeTab} className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 animate-page-enter">
        {activeTab === 'dashboard' && (
          <DashboardView
            onNavigate={(tab) => setActiveTab(tab)}
            onOpenAddAppointment={() => setActiveTab('calendar')}
          />
        )}

        {activeTab === 'calendar' && <CalendarView />}

        {activeTab === 'meals' && <MealPlannerView />}

        {activeTab === 'photos' && <PhotoStreamView />}

        {activeTab === 'lists' && <ListsAndChoresView />}

        {activeTab === 'members' && <FamilyMembersView />}
      </main>

      {/* Footer (Hidden on small mobile screens to keep space clean) */}
      <footer className="hidden sm:block border-t-2 border-stone-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 py-6 mt-12 text-center text-xs text-stone-400 dark:text-slate-500 transition-colors">
        <p className="font-extrabold text-stone-600 dark:text-slate-300">Famly 🏡 Familien-Hub & Organisation</p>
        <p className="mt-1 font-semibold">
          Entwickelt für Familien • Mobil-optimiert, privat & lokal.
        </p>
      </footer>

      {/* Mobile Bottom Navigation Bar (Visible on mobile only) */}
      <MobileBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Quick Add Universal Modal */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onNavigateTab={(tab) => setActiveTab(tab)}
      />

      {/* Settings & Data Management Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
          setIsSettingsOpen(false);
        }}
      />

      {/* Open-Jev Family Decision Maker Modal */}
      <DecisionMakerModal
        isOpen={isDecisionOpen}
        onClose={() => setIsDecisionOpen(false)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <FamilyProvider>
      <MainAppContent />
    </FamilyProvider>
  );
};

export default App;
