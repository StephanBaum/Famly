import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { PhotoMemory, GalleryAlbum, PhotoItem, GuestReaction } from '../../types';
import { STORAGE_KEYS, getStoredOrDefault } from '../storageKeys';

interface UsePhotosGalleriesSliceOptions {
  currentMemberId: string | 'all';
  fallbackMemberId?: string;
}

export function usePhotosGalleriesSlice({
  currentMemberId,
  fallbackMemberId,
}: UsePhotosGalleriesSliceOptions) {
  const [photos, setPhotos] = useState<PhotoMemory[]>(() => {
    const stored = getStoredOrDefault<PhotoMemory[] | null>(STORAGE_KEYS.PHOTOS, null);
    if (stored !== null) return stored;
    return [];
  });

  const [galleries, setGalleries] = useState<GalleryAlbum[]>(() => {
    const stored = getStoredOrDefault<GalleryAlbum[] | null>(STORAGE_KEYS.GALLERIES, null);
    if (stored !== null) return stored;
    return [];
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PHOTOS, JSON.stringify(photos));
  }, [photos]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.GALLERIES, JSON.stringify(galleries));
  }, [galleries]);

  const activeId = currentMemberId === 'all' ? fallbackMemberId || 'm1' : currentMemberId;

  // Photos
  const addPhoto = (photo: Omit<PhotoMemory, 'id' | 'likes'>) => {
    const newPhoto: PhotoMemory = {
      ...photo,
      id: `p_${Date.now()}`,
      likes: [],
    };
    setPhotos((prev) => [newPhoto, ...prev]);
    confetti({
      particleCount: 70,
      spread: 70,
      origin: { y: 0.7 },
    });
  };

  const togglePhotoLike = (photoId: string) => {
    setPhotos((prev) =>
      prev.map((photo) => {
        if (photo.id !== photoId) return photo;
        const hasLiked = photo.likes.includes(activeId);
        return {
          ...photo,
          likes: hasLiked
            ? photo.likes.filter((id) => id !== activeId)
            : [...photo.likes, activeId],
        };
      })
    );
  };

  const deletePhoto = (photoId: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
  };

  // Multi-Photo Collaborative Galleries & Relative Sharing
  const createGallery = (
    galleryData: Omit<GalleryAlbum, 'id' | 'photos' | 'shareCode' | 'guestReactions'>,
    initialPhotos: Omit<PhotoItem, 'id' | 'likes'>[] = []
  ): GalleryAlbum => {
    const slug = galleryData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const newGallery: GalleryAlbum = {
      ...galleryData,
      id: `gal_${Date.now()}`,
      shareCode: `${slug || 'album'}-${Math.floor(1000 + Math.random() * 9000)}`,
      photos: initialPhotos.map((p, idx) => ({
        ...p,
        id: `p_${Date.now()}_${idx}`,
        likes: [],
      })),
      guestReactions: [],
    };
    setGalleries((prev) => [newGallery, ...prev]);
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
    });
    return newGallery;
  };

  const addPhotosToGallery = (
    galleryId: string,
    newPhotos: Omit<PhotoItem, 'id' | 'likes'>[]
  ) => {
    if (newPhotos.length === 0) return;
    const mapped: PhotoItem[] = newPhotos.map((p, idx) => ({
      ...p,
      id: `p_${Date.now()}_${idx}`,
      likes: [],
    }));

    setGalleries((prev) =>
      prev.map((gal) => {
        if (gal.id !== galleryId) return gal;
        return {
          ...gal,
          photos: [...gal.photos, ...mapped],
        };
      })
    );
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
    });
  };

  const deleteGallery = (galleryId: string) => {
    setGalleries((prev) => prev.filter((g) => g.id !== galleryId));
  };

  const deletePhotoFromGallery = (galleryId: string, photoId: string) => {
    setGalleries((prev) =>
      prev.map((gal) => {
        if (gal.id !== galleryId) return gal;
        return {
          ...gal,
          photos: gal.photos.filter((p) => p.id !== photoId),
        };
      })
    );
  };

  const toggleGalleryPhotoLike = (galleryId: string, photoId: string) => {
    setGalleries((prev) =>
      prev.map((gal) => {
        if (gal.id !== galleryId) return gal;
        return {
          ...gal,
          photos: gal.photos.map((p) => {
            if (p.id !== photoId) return p;
            const hasLiked = p.likes.includes(activeId);
            return {
              ...p,
              likes: hasLiked
                ? p.likes.filter((id) => id !== activeId)
                : [...p.likes, activeId],
            };
          }),
        };
      })
    );
  };

  const addGuestReaction = (
    galleryId: string,
    author: string,
    message: string,
    emoji: string
  ) => {
    const reaction: GuestReaction = {
      id: `gr_${Date.now()}`,
      author: author.trim() || 'Relative',
      message: message.trim(),
      emoji: emoji || '❤️',
      timestamp: 'Just now',
    };

    setGalleries((prev) =>
      prev.map((gal) => {
        if (gal.id !== galleryId) return gal;
        return {
          ...gal,
          guestReactions: [reaction, ...(gal.guestReactions || [])],
        };
      })
    );
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const toggleGalleryShare = (galleryId: string, isShared: boolean) => {
    setGalleries((prev) =>
      prev.map((gal) => (gal.id === galleryId ? { ...gal, isPublicShared: isShared } : gal))
    );
  };

  return {
    photos,
    setPhotos,
    galleries,
    setGalleries,
    addPhoto,
    togglePhotoLike,
    deletePhoto,
    createGallery,
    addPhotosToGallery,
    deleteGallery,
    deletePhotoFromGallery,
    toggleGalleryPhotoLike,
    addGuestReaction,
    toggleGalleryShare,
  };
}
