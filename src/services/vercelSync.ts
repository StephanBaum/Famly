export interface UpstashServiceStatus {
  configured: boolean;
  message: string;
}

export interface VercelSyncStatus {
  isAvailable: boolean;
  provider: 'upstash_redis' | 'none' | 'error';
  message: string;
  lastChecked: number;
  services?: {
    redis?: UpstashServiceStatus;
    vector?: UpstashServiceStatus;
    qstash?: UpstashServiceStatus;
  };
}

let cachedStatus: VercelSyncStatus = {
  isAvailable: false,
  provider: 'none',
  message: 'Prüfe Verbindung...',
  lastChecked: 0,
};

let lastKnownRemoteTimestamp = 0;
let debounceTimeout: any = null;

/**
 * Checks whether Vercel Storage (/api/status) is available and configured
 */
export const checkVercelStorageStatus = async (force = false): Promise<VercelSyncStatus> => {
  const now = Date.now();
  if (!force && cachedStatus.lastChecked > 0 && now - cachedStatus.lastChecked < 30000) {
    return cachedStatus;
  }

  try {
    const res = await fetch('/api/status', {
      headers: { 'Accept': 'application/json' },
      cache: 'no-store',
    });

    if (!res.ok) {
      cachedStatus = {
        isAvailable: false,
        provider: 'none',
        message: 'Kein Vercel-Serverless-Endpunkt erreichbar (evtl. lokale Vite-Vorschau ohne Vercel CLI).',
        lastChecked: now,
      };
      return cachedStatus;
    }

    const data = await res.json();
    cachedStatus = {
      isAvailable: Boolean(data.configured),
      provider: data.provider || 'none',
      message: data.message || '',
      services: data.services,
      lastChecked: now,
    };
    return cachedStatus;
  } catch {
    cachedStatus = {
      isAvailable: false,
      provider: 'none',
      message: 'Lokaler Modus aktiv (Vercel Storage nicht verbunden).',
      lastChecked: now,
    };
    return cachedStatus;
  }
};

/**
 * Downloads the full shared family state from Vercel Storage
 */
export const pullVercelFamilyState = async (): Promise<{
  success: boolean;
  data: any | null;
  updatedAt: number | null;
}> => {
  try {
    const res = await fetch('/api/sync', {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store',
    });

    if (!res.ok) {
      return { success: false, data: null, updatedAt: null };
    }

    const json = await res.json();
    if (json.success && json.data) {
      const parsedData = typeof json.data === 'string' ? JSON.parse(json.data) : json.data;
      if (json.updatedAt) {
        lastKnownRemoteTimestamp = Number(json.updatedAt);
      }
      return { success: true, data: parsedData, updatedAt: json.updatedAt };
    }

    return { success: Boolean(json.success), data: null, updatedAt: null };
  } catch {
    return { success: false, data: null, updatedAt: null };
  }
};

/**
 * Pushes state updates to Vercel Storage (debounced)
 */
export const pushVercelFamilyStateDebounced = (
  state: Record<string, any>,
  delayMs = 1500
): Promise<boolean> => {
  return new Promise((resolve) => {
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    debounceTimeout = setTimeout(async () => {
      try {
        const res = await fetch('/api/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(state),
        });

        if (res.ok) {
          const json = await res.json();
          if (json.updatedAt) {
            lastKnownRemoteTimestamp = Number(json.updatedAt);
          }
          resolve(true);
        } else {
          resolve(false);
        }
      } catch {
        resolve(false);
      }
    }, delayMs);
  });
};

/**
 * Starts background sync listener that periodically checks for changes from other devices
 */
export const startVercelSyncListener = (
  onRemoteUpdate: (remoteData: any) => void,
  intervalSeconds = 25
): (() => void) => {
  let isPolling = true;

  const poll = async () => {
    if (!isPolling) return;
    const status = await checkVercelStorageStatus();
    if (!status.isAvailable) return;

    const pullResult = await pullVercelFamilyState();
    if (
      pullResult.success &&
      pullResult.data &&
      pullResult.updatedAt &&
      pullResult.updatedAt > lastKnownRemoteTimestamp
    ) {
      lastKnownRemoteTimestamp = pullResult.updatedAt;
      onRemoteUpdate(pullResult.data);
    }
  };

  const timer = setInterval(poll, intervalSeconds * 1000);

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      poll();
    }
  };

  window.addEventListener('visibilitychange', handleVisibilityChange);

  return () => {
    isPolling = false;
    clearInterval(timer);
    window.removeEventListener('visibilitychange', handleVisibilityChange);
  };
};
