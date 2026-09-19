import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables for Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.trim().startsWith('https://') &&
    supabaseAnonKey.trim().length > 10
  );
};

// Singleton Supabase client (only initialized if valid credentials exist)
export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

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
    // If it's already small or not an image, return as is
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
  // If Supabase is configured, upload to cloud bucket
  if (isSupabaseConfigured() && supabase) {
    try {
      const compressed = await compressImage(file);
      const fileExt = compressed.name.split('.').pop() || 'jpg';
      const cleanFileName = compressed.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .slice(0, 30);
      const filePath = `${folder}/${Date.now()}_${cleanFileName}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('family-photos')
        .upload(filePath, compressed, {
          cacheControl: '31536000', // 1 year cache for fast repeat loads
          upsert: true,
        });

      if (uploadError) {
        console.warn('Supabase storage upload failed, using local fallback:', uploadError);
        throw uploadError;
      }

      const { data } = supabase.storage.from('family-photos').getPublicUrl(filePath);
      return data.publicUrl;
    } catch (err) {
      console.error('Error during Supabase upload:', err);
      // Fallback to compressed base64 if cloud upload fails
      return readAsDataUrlCompressed(file);
    }
  }

  // Fallback for offline / local mode (compressed base64 data URL)
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
