import React, { useState, useEffect } from 'react';
import { FamilyProvider, useFamily } from './context/FamilyContext';
import { Header, ActiveTab } from './components/Header';
import { MobileBottomNav } from './components/MobileBottomNav';
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { CalendarView } from './views/CalendarView';
import { MealPlannerView } from './views/MealPlannerView';
import { PhotoStreamView } from './views/PhotoStreamView';
import { GroceriesView } from './views/GroceriesView';
import { FamilyMembersView } from './views/FamilyMembersView';
import { QuickAddModal } from './components/QuickAddModal';
import { GuestGalleryViewer } from './components/GuestGalleryViewer';
import { GuestCarpoolViewer } from './components/calendar/GuestCarpoolViewer';
import { SettingsModal } from './components/SettingsModal';
import { FamilyAssistantModal } from './components/FamilyAssistantModal';
import { OnboardingView } from './views/OnboardingView';
import { KidsView } from './views/KidsView';
import { JoinFamilyQRModal } from './components/JoinFamilyQRModal';
import { pullVercelFamilyState } from './services/vercelSync';
import { initReminderScheduler } from './services/notificationService';
import { AmbientKitchenStation } from './components/kiosk/AmbientKitchenStation';
import { StoreArrivalBanner } from './components/groceries/StoreArrivalBanner';
import { ShoppingFocusModal } from './components/ShoppingFocusModal';
import { isKioskDevice, setupIdleWatcher } from './services/contextEngine';

const MainAppContent: React.FC = () => {
  const {
    loggedInMemberId,
    galleries,
    isOnboarded,
    joinFamilyFromCloud,
    appointments,
    updateAppointment,
    familyName,
    groceries,
    stores,
    toggleGrocery,
    clearCheckedGroceries,
  } = useFamily();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isKidsMode, setIsKidsMode] = useState(false);
  const [isDecisionOpen, setIsDecisionOpen] = useState(false);
  const [isJoinQROpen, setIsJoinQROpen] = useState(false);
  const [settingsScrollToAI, setSettingsScrollToAI] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);

  // Kiosk & Ambient Kitchen Display State
  const [isKiosk, setIsKiosk] = useState(() => isKioskDevice());
  const [isViewingFullHub, setIsViewingFullHub] = useState(() => !isKioskDevice());
  const [isGlobalShoppingFocusOpen, setIsGlobalShoppingFocusOpen] = useState(false);

  useEffect(() => {
    const handleRoleChange = () => {
      const kiosk = isKioskDevice();
      setIsKiosk(kiosk);
      if (kiosk) {
        setIsViewingFullHub(false);
      }
    };
    window.addEventListener('famly_device_role_change', handleRoleChange);
    return () => window.removeEventListener('famly_device_role_change', handleRoleChange);
  }, []);

  // Idle reset: if user opened full hub on a kiosk display, return to Ambient Station after 60s of inactivity
  useEffect(() => {
    if (!isKiosk || !isViewingFullHub) return;
    const cleanup = setupIdleWatcher(() => {
      setIsViewingFullHub(false);
    }, 60000);
    return cleanup;
  }, [isKiosk, isViewingFullHub]);

  const handleOpenSettingsForAI = () => {
    setIsDecisionOpen(false);
    setSettingsScrollToAI(true);
    setIsSettingsOpen(true);
  };

  // Detect direct guest link for relatives: e.g. #guest-gallery=gal_1
  const [guestGalleryId, setGuestGalleryId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const hash = window.location.hash;
    if (hash.startsWith('#guest-gallery=')) {
      return hash.replace('#guest-gallery=', '');
    }
    return null;
  });

  // Detect direct guest link for carpools: e.g. #carpool=c_98x
  const [guestCarpoolId, setGuestCarpoolId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const hash = window.location.hash;
    if (hash.startsWith('#carpool=')) {
      return hash.replace('#carpool=', '');
    }
    return null;
  });

  // Listen for hash changes (e.g. guest gallery, carpool, or join family)
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#guest-gallery=')) {
        setGuestGalleryId(hash.replace('#guest-gallery=', ''));
      } else if (hash.startsWith('#carpool=')) {
        setGuestCarpoolId(hash.replace('#carpool=', ''));
      } else if (hash.startsWith('#join-family')) {
        joinFamilyFromCloud().then((success) => {
          if (success) {
            window.location.hash = '';
          }
        });
      }
    };

    window.addEventListener('hashchange', handleHash);

    // Initial check on load for join
    if (window.location.hash.startsWith('#join-family')) {
      joinFamilyFromCloud().then((success) => {
        if (success) {
          window.location.hash = '';
        }
      });
    }

    return () => window.removeEventListener('hashchange', handleHash);
  }, [joinFamilyFromCloud]);

  const sharedGuestGallery = guestGalleryId
    ? galleries.find((g) => g.id === guestGalleryId || g.shareCode === guestGalleryId)
    : null;

  // Try to pull remote galleries if guest opened link but state isn't ready
  useEffect(() => {
    if (guestGalleryId && !sharedGuestGallery) {
      setIsGuestLoading(true);
      pullVercelFamilyState().finally(() => {
        setIsGuestLoading(false);
      });
    }
  }, [guestGalleryId, sharedGuestGallery]);

  // Start background reminder scheduler (checks due appointments and triggers native alerts)
  useEffect(() => {
    const cleanup = initReminderScheduler(() => appointments);
    return cleanup;
  }, [appointments]);

  // If visiting via guest link, handle guest viewer directly without ever redirecting to Onboarding!
  if (guestGalleryId) {
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

    return (
      <div className="min-h-screen bg-[#0F172A] text-white flex flex-col items-center justify-center p-6 text-center select-none">
        {isGuestLoading ? (
          <div className="space-y-4 animate-in fade-in">
            <div className="w-16 h-16 rounded-3xl bg-indigo-500/20 border-2 border-indigo-400 flex items-center justify-center text-3xl mx-auto animate-bounce">
              📸
            </div>
            <h2 className="text-xl font-black">Lade Fotoalbum für dich...</h2>
            <p className="text-xs text-slate-400">Verbindung zu Famly wird hergestellt</p>
          </div>
        ) : (
          <div className="space-y-4 max-w-sm animate-in fade-in">
            <div className="w-16 h-16 rounded-3xl bg-indigo-500/20 border-2 border-indigo-400 flex items-center justify-center text-3xl mx-auto">
              💌
            </div>
            <h2 className="text-xl font-black">Album nicht gefunden</h2>
            <p className="text-xs text-slate-400">
              Dieses Fotoalbum existiert nicht oder die Freigabe wurde beendet.
            </p>
            <button
              onClick={() => {
                window.location.hash = '';
                setGuestGalleryId(null);
              }}
              className="duo-btn duo-btn-white px-5 py-2.5 rounded-xl text-xs font-bold text-stone-900"
            >
              Zur Startseite
            </button>
          </div>
        )}
      </div>
    );
  }

  const sharedGuestCarpool = guestCarpoolId
    ? appointments.find((a) => a.id === guestCarpoolId || a.carpool?.shareCode === guestCarpoolId)
    : null;

  // If visiting via guest carpool link: e.g. #carpool=c_98x
  if (guestCarpoolId) {
    if (sharedGuestCarpool) {
      return (
        <GuestCarpoolViewer
          appointment={sharedGuestCarpool}
          familyName={familyName}
          onUpdateAppointment={(updated) => updateAppointment(updated.id, updated)}
          onClose={() => {
            window.location.hash = '';
            setGuestCarpoolId(null);
          }}
        />
      );
    }

    return (
      <div className="min-h-screen bg-[#0F172A] text-white flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="space-y-4 max-w-sm animate-in fade-in">
          <div className="w-16 h-16 rounded-3xl bg-blue-500/20 border-2 border-blue-400 flex items-center justify-center text-3xl mx-auto">
            🚗
          </div>
          <h2 className="text-xl font-black">Fahrt nicht gefunden</h2>
          <p className="text-xs text-slate-400">
            Diese Fahrgemeinschaft existiert nicht oder wurde bereits beendet.
          </p>
          <button
            onClick={() => {
              window.location.hash = '';
              setGuestCarpoolId(null);
            }}
            className="duo-btn duo-btn-white px-5 py-2.5 rounded-xl text-xs font-bold text-stone-900"
          >
            Zur Startseite
          </button>
        </div>
      </div>
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

  // If Kiosk / Kitchen Display is active, render Ambient Kitchen Station by default
  if (isKiosk && !isViewingFullHub) {
    return (
      <div className="min-h-screen bg-[#F4F6F9] dark:bg-[#0c1222] select-none">
        <AmbientKitchenStation
          onOpenFullHub={(tab) => {
            if (tab) setActiveTab(tab);
            setIsViewingFullHub(true);
          }}
          onLaunchShopping={() => setIsGlobalShoppingFocusOpen(true)}
          onOpenAssistant={() => setIsDecisionOpen(true)}
        />

        {/* Global Store Arrival Banner */}
        <StoreArrivalBanner onOpenShoppingFocus={() => setIsGlobalShoppingFocusOpen(true)} />

        {/* Global Shopping Focus Modal */}
        <ShoppingFocusModal
          isOpen={isGlobalShoppingFocusOpen}
          onClose={() => setIsGlobalShoppingFocusOpen(false)}
          groceries={groceries}
          stores={stores}
          onToggleItem={toggleGrocery}
          onClearChecked={clearCheckedGroceries}
        />

        {/* AI Assistant Modal */}
        <FamilyAssistantModal
          isOpen={isDecisionOpen}
          onClose={() => setIsDecisionOpen(false)}
          onOpenSettings={handleOpenSettingsForAI}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F9FA] dark:bg-[#0c1222] text-stone-900 dark:text-slate-100 font-sans pb-24 sm:pb-8 transition-colors">
      {/* Global Store Arrival Banner (Fires on proximity to grocery store) */}
      <StoreArrivalBanner onOpenShoppingFocus={() => setIsGlobalShoppingFocusOpen(true)} />

      {/* Sticky Header with Logged-in Profile, Theme & Quick Add */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onQuickAdd={() => setIsQuickAddOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onToggleKidsMode={() => setIsKidsMode(true)}
        onOpenDecision={() => setIsDecisionOpen(true)}
        onOpenJoinQR={() => setIsJoinQROpen(true)}
        onReturnToAmbient={isKiosk ? () => setIsViewingFullHub(false) : undefined}
      />

      {/* Main Content Area with Smooth Page Animation */}
      <main key={activeTab} className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 animate-page-enter">
        {activeTab === 'dashboard' && (
          <DashboardView
            onNavigate={(tab) => setActiveTab(tab)}
            onOpenAddAppointment={() => setActiveTab('calendar')}
            onOpenAssistant={() => setIsDecisionOpen(true)}
          />
        )}

        {activeTab === 'calendar' && <CalendarView />}

        {activeTab === 'meals' && <MealPlannerView />}

        {(activeTab === 'groceries' || activeTab === 'lists') && <GroceriesView />}

        {activeTab === 'photos' && <PhotoStreamView />}

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
        onClose={() => {
          setIsSettingsOpen(false);
          setSettingsScrollToAI(false);
        }}
        initialScrollToAI={settingsScrollToAI}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
          setIsSettingsOpen(false);
        }}
      />

      {/* Famly AI Assistant & Smart-Planer Modal */}
      <FamilyAssistantModal
        isOpen={isDecisionOpen}
        onClose={() => setIsDecisionOpen(false)}
        onOpenSettings={handleOpenSettingsForAI}
      />

      {/* Join Family / Connect Device QR Modal */}
      <JoinFamilyQRModal
        isOpen={isJoinQROpen}
        onClose={() => setIsJoinQROpen(false)}
      />

      {/* Global Shopping Focus Modal */}
      <ShoppingFocusModal
        isOpen={isGlobalShoppingFocusOpen}
        onClose={() => setIsGlobalShoppingFocusOpen(false)}
        groceries={groceries}
        stores={stores}
        onToggleItem={toggleGrocery}
        onClearChecked={clearCheckedGroceries}
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
