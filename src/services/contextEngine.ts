import { STORAGE_KEYS } from '../context/storageKeys';

export type Daypart = 'morning_rush' | 'day_ambient' | 'evening_hub' | 'night_dim';

export interface SupermarketLocation {
  name: string;
  lat: number;
  lng: number;
  radiusMeters?: number;
}

// Default fallback supermarket location (e.g. for testing or initial setup)
export const DEFAULT_SUPERMARKET: SupermarketLocation = {
  name: 'Rewe Center',
  lat: 52.5200,
  lng: 13.4050,
  radiusMeters: 200,
};

let simulatedDaypartOverride: Daypart | null = null;
let simulatedStoreProximity = false;

/**
 * Calculates the current daypart based on the clock or active simulation
 */
export function getCurrentDaypart(date: Date = new Date()): Daypart {
  if (simulatedDaypartOverride) {
    return simulatedDaypartOverride;
  }

  // Check URL override: ?daypart=morning_rush
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const paramDaypart = params.get('daypart') as Daypart | null;
    if (paramDaypart && ['morning_rush', 'day_ambient', 'evening_hub', 'night_dim'].includes(paramDaypart)) {
      return paramDaypart;
    }
  }

  const hours = date.getHours();
  const minutes = date.getMinutes();
  const decimalHour = hours + minutes / 60;

  // 06:30 - 09:00: Morning Rush (Bus, teeth, breakfast, shoes)
  if (decimalHour >= 6.5 && decimalHour < 9.0) {
    return 'morning_rush';
  }

  // 09:00 - 15:30: Calm Ambient (School / Work time, quiet hearth)
  if (decimalHour >= 9.0 && decimalHour < 15.5) {
    return 'day_ambient';
  }

  // 15:30 - 20:30: Evening Hub (Dinner, sports pickups, chores)
  if (decimalHour >= 15.5 && decimalHour < 20.5) {
    return 'evening_hub';
  }

  // 20:30 - 06:30: Night Dim (Warm amber glow, bedtime rest)
  return 'night_dim';
}

export function setSimulatedDaypart(daypart: Daypart | null) {
  simulatedDaypartOverride = daypart;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('famly_daypart_change', { detail: daypart }));
  }
}

/**
 * Checks whether the current device is designated or detected as a Kitchen Kiosk / Fridge Screen
 */
export function isKioskDevice(): boolean {
  if (typeof window === 'undefined') return false;

  // 1. Explicit query or hash parameter ?kiosk=1 or #kiosk
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('kiosk') === '1' || urlParams.get('mode') === 'kiosk' || window.location.hash === '#kiosk') {
    return true;
  }

  // 2. Explicit user setting stored in localStorage
  const storedRole = localStorage.getItem(STORAGE_KEYS.DEVICE_ROLE);
  if (storedRole === 'kiosk') {
    return true;
  }

  // 3. Auto-detection heuristics: landscape orientation with tablet/screen width >= 1024px
  const isLandscape = window.innerWidth > window.innerHeight;
  const isLargeScreen = window.innerWidth >= 1024 && window.innerHeight >= 600;

  // If running in standalone PWA / full screen on landscape tablet
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;

  if (isStandalone && isLandscape && isLargeScreen) {
    return true;
  }

  return false;
}

export function setDeviceRole(role: 'personal' | 'kiosk') {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.DEVICE_ROLE, role);
  window.dispatchEvent(new CustomEvent('famly_device_role_change', { detail: role }));
}

export function getDeviceRole(): 'personal' | 'kiosk' {
  if (typeof window === 'undefined') return 'personal';
  const stored = localStorage.getItem(STORAGE_KEYS.DEVICE_ROLE);
  if (stored === 'kiosk') return 'kiosk';
  return isKioskDevice() ? 'kiosk' : 'personal';
}

/**
 * Supermarket Geolocation & Proximity Detection
 */
export function getSavedSupermarket(): SupermarketLocation {
  if (typeof window === 'undefined') return DEFAULT_SUPERMARKET;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SUPERMARKET_LOCATION);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // fallback
  }
  return DEFAULT_SUPERMARKET;
}

export function saveSupermarket(location: SupermarketLocation) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.SUPERMARKET_LOCATION, JSON.stringify(location));
  window.dispatchEvent(new CustomEvent('famly_supermarket_change', { detail: location }));
}

/**
 * Haversine formula to calculate distance in meters between two GPS coordinates
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export function setSimulatedStoreProximity(isNear: boolean) {
  simulatedStoreProximity = isNear;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('famly_store_proximity_change', { detail: isNear }));
  }
}

export function getSimulatedStoreProximity(): boolean {
  return simulatedStoreProximity;
}

/**
 * Subscribes to real-time store proximity (via HTML5 Geolocation or simulation)
 */
export function subscribeToStoreProximity(
  onProximityChange: (isNear: boolean, distanceMeters?: number) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  let watchId: number | null = null;
  const store = getSavedSupermarket();
  const radius = store.radiusMeters || 200;

  const handleSimulated = (e: any) => {
    onProximityChange(e.detail);
  };
  window.addEventListener('famly_store_proximity_change', handleSimulated);

  // If simulation is active, notify immediately
  if (simulatedStoreProximity) {
    onProximityChange(true, 45);
  }

  // Check HTML5 Geolocation if available
  if ('geolocation' in navigator) {
    try {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          if (simulatedStoreProximity) return; // Don't override active simulation
          const distance = calculateDistanceMeters(
            position.coords.latitude,
            position.coords.longitude,
            store.lat,
            store.lng
          );
          const isNear = distance <= radius;
          onProximityChange(isNear, Math.round(distance));
        },
        () => {
          // Geolocation might be denied or uncalibrated; silent ignore
        },
        {
          enableHighAccuracy: false,
          maximumAge: 60000,
          timeout: 20000,
        }
      );
    } catch (e) {
      // ignore
    }
  }

  return () => {
    window.removeEventListener('famly_store_proximity_change', handleSimulated);
    if (watchId !== null && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(watchId);
    }
  };
}

/**
 * Inactivity Idle Watcher:
 * Automatically fires `onIdle` after `timeoutMs` without user interaction.
 */
export function setupIdleWatcher(onIdle: () => void, timeoutMs: number = 60000): () => void {
  if (typeof window === 'undefined') return () => {};

  let timer: any = null;

  const resetTimer = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      onIdle();
    }, timeoutMs);
  };

  const activityEvents = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll', 'click'];
  activityEvents.forEach((evt) => {
    window.addEventListener(evt, resetTimer, { passive: true });
  });

  resetTimer();

  return () => {
    if (timer) clearTimeout(timer);
    activityEvents.forEach((evt) => {
      window.removeEventListener(evt, resetTimer);
    });
  };
}
