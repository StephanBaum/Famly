import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Storage keys for Bring Your Own Key (BYOK)
export const STORAGE_KEY_SUPABASE_URL = 'famly_supabase_url';
export const STORAGE_KEY_SUPABASE_ANON_KEY = 'famly_supabase_anon_key';

/**
 * Returns current Supabase config (checking localStorage first, then .env fallback)
 */
export const getSupabaseConfig = (): {
  url: string;
  anonKey: string;
  isConfigured: boolean;
  isCustom: boolean;
} => {
  const customUrl = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_SUPABASE_URL) : null;
  const customKey = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_SUPABASE_ANON_KEY) : null;

  const envUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || '';
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || '';

  const isCustom = Boolean(customUrl && customKey && customUrl.trim().length > 0 && customKey.trim().length > 0);
  const url = (isCustom ? customUrl! : envUrl).trim();
  const anonKey = (isCustom ? customKey! : envKey).trim();

  const isConfigured = Boolean(
    url &&
    anonKey &&
    url.startsWith('https://') &&
    anonKey.length > 10
  );

  return { url, anonKey, isConfigured, isCustom };
};

export const isSupabaseConfigured = (): boolean => {
  return getSupabaseConfig().isConfigured;
};

// Internal client instance
let currentClient: SupabaseClient | null = null;

const createSupabaseInstance = (url: string, key: string): SupabaseClient | null => {
  try {
    if (!url || !key || !url.startsWith('https://') || key.length < 10) return null;
    return createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
    return null;
  }
};

// Initialize client
const initialConfig = getSupabaseConfig();
if (initialConfig.isConfigured) {
  currentClient = createSupabaseInstance(initialConfig.url, initialConfig.anonKey);
}

/**
 * Singleton getter for Supabase client
 */
export const getSupabaseClient = (): SupabaseClient | null => {
  if (!currentClient) {
    const cfg = getSupabaseConfig();
    if (cfg.isConfigured) {
      currentClient = createSupabaseInstance(cfg.url, cfg.anonKey);
    }
  }
  return currentClient;
};

// Exported instance for backwards compatibility
export let supabase: SupabaseClient | null = currentClient;

/**
 * Save custom Supabase credentials (BYOK) and reinitialize client
 */
export const saveSupabaseCredentials = (url: string, anonKey: string): void => {
  const cleanUrl = url.trim();
  const cleanKey = anonKey.trim();

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_SUPABASE_URL, cleanUrl);
    localStorage.setItem(STORAGE_KEY_SUPABASE_ANON_KEY, cleanKey);
  }

  currentClient = createSupabaseInstance(cleanUrl, cleanKey);
  supabase = currentClient;
};

/**
 * Clear custom Supabase credentials and reset to default/.env
 */
export const clearSupabaseCredentials = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY_SUPABASE_URL);
    localStorage.removeItem(STORAGE_KEY_SUPABASE_ANON_KEY);
  }

  const envUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || '';
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || '';
  
  if (envUrl && envKey && envUrl.startsWith('https://')) {
    currentClient = createSupabaseInstance(envUrl, envKey);
  } else {
    currentClient = null;
  }
  supabase = currentClient;
};

/**
 * Live test connection to Supabase instance.
 * Checks reachability and tests if 'family-photos' bucket is available.
 */
export const testSupabaseConnection = async (
  url: string,
  anonKey: string
): Promise<{ success: boolean; message: string; bucketReady: boolean }> => {
  try {
    const cleanUrl = url.trim();
    const cleanKey = anonKey.trim();

    if (!cleanUrl.startsWith('https://')) {
      return {
        success: false,
        message: 'Die URL muss mit https:// beginnen (z. B. https://xyzcompany.supabase.co).',
        bucketReady: false,
      };
    }
    if (cleanKey.length < 20) {
      return {
        success: false,
        message: 'Der Anon Key scheint unvollständig zu sein (normalerweise ca. 100+ Zeichen).',
        bucketReady: false,
      };
    }

    const testClient = createClient(cleanUrl, cleanKey, {
      auth: { persistSession: false },
    });

    // Test 1: Check storage bucket
    const { data: buckets, error: storageError } = await testClient.storage.listBuckets();

    if (storageError) {
      // If storage error occurred, check if it's an auth/url error
      return {
        success: false,
        message: `Verbindung fehlgeschlagen: ${storageError.message}. Prüfe URL und Anon Key.`,
        bucketReady: false,
      };
    }

    const bucketReady = Array.isArray(buckets) && buckets.some((b) => b.id === 'family-photos' || b.name === 'family-photos');

    if (bucketReady) {
      return {
        success: true,
        message: 'Erfolgreich verbunden! Cloud-Datenbank & Foto-Speicher (family-photos) sind bereit.',
        bucketReady: true,
      };
    } else {
      return {
        success: true,
        message: 'Verbindung zu Supabase hergestellt! Hinweis: Führe noch supabase/schema.sql im SQL Editor aus, um den Speicher-Bucket "family-photos" anzulegen.',
        bucketReady: false,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: `Fehler beim Verbindungsaufbau: ${err?.message || 'Netzwerkfehler'}`,
      bucketReady: false,
    };
  }
};

/**
 * Generate a shareable URL / QR-Payload that allows other family members
 * to connect to the same Supabase project with a single tap/scan.
 */
export const generateCloudConnectUrl = (): string => {
  const cfg = getSupabaseConfig();
  if (!cfg.isConfigured) return '';

  const payload = JSON.stringify({
    url: cfg.url,
    key: cfg.anonKey,
  });

  const encoded = btoa(encodeURIComponent(payload));
  const baseUrl = window.location.origin + window.location.pathname;
  return `${baseUrl}#cloud_connect=${encoded}`;
};

/**
 * Parse a cloud connect token from URL hash or string
 */
export const parseCloudConnectToken = (
  tokenOrUrl: string
): { url: string; anonKey: string } | null => {
  try {
    let token = tokenOrUrl;
    if (token.includes('cloud_connect=')) {
      token = token.split('cloud_connect=')[1].split('&')[0];
    }
    const decoded = decodeURIComponent(atob(token));
    const data = JSON.parse(decoded);
    if (data.url && data.key && data.url.startsWith('https://')) {
      return { url: data.url, anonKey: data.key };
    }
    return null;
  } catch (err) {
    console.error('Invalid cloud connect token:', err);
    return null;
  }
};

/**
 * Client-side image compression to optimize upload size and speed.
 * Compresses images to a max dimension while preserving good visual quality.
 */
export const compressImage = (
  file: File,
  maxWidth = 1600,
  maxHeight = 1600,
  quality = 0.82
): Promise<File> => {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/') || file.size < 400 * 1024) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
};

/**
 * Uploads a photo to Supabase Storage Bucket 'family-photos'
 * Returns a public CDN URL accessible across devices.
 * If Supabase is not configured, falls back to a base64 DataURL.
 */
export const uploadPhotoToStorage = async (
  file: File,
  folder = 'uploads'
): Promise<string> => {
  const client = getSupabaseClient();

  if (isSupabaseConfigured() && client) {
    try {
      const compressed = await compressImage(file);
      const fileExt = compressed.name.split('.').pop() || 'jpg';
      const cleanFileName = compressed.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .slice(0, 30);
      const filePath = `${folder}/${Date.now()}_${cleanFileName}.${fileExt}`;

      const { error: uploadError } = await client.storage
        .from('family-photos')
        .upload(filePath, compressed, {
          cacheControl: '31536000',
          upsert: true,
        });

      if (uploadError) {
        console.warn('Supabase storage upload failed, using local fallback:', uploadError);
        throw uploadError;
      }

      const { data } = client.storage.from('family-photos').getPublicUrl(filePath);
      return data.publicUrl;
    } catch (err) {
      console.error('Error during Supabase upload:', err);
      return readAsDataUrlCompressed(file);
    }
  }

  // Fallback for offline / local mode
  return readAsDataUrlCompressed(file);
};

const readAsDataUrlCompressed = async (file: File): Promise<string> => {
  const compressed = await compressImage(file, 1000, 1000, 0.7);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(compressed);
  });
};
