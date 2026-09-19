import React, { useState, useRef } from 'react';
import { GalleryAlbum } from '../types';
import { useFamily } from '../context/FamilyContext';
import {
  X,
  Upload,
  Sparkles,
  FolderPlus,
} from 'lucide-react';

interface GalleryUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetGalleryId?: string; // If provided, defaults to adding into this specific gallery
}

const PRESET_PHOTO_COLLECTION = [
  { label: 'Mountain Hike', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1000&q=80' },
  { label: 'Lake Sunset', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80' },
  { label: 'Cookie Baking', url: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1000&q=80' },
  { label: 'Fresh Cookies', url: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=1000&q=80' },
  { label: 'Birthday Candles', url: 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?auto=format&fit=crop&w=1000&q=80' },
  { label: 'Party Balloons', url: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1000&q=80' },
  { label: 'Soccer Match', url: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=1000&q=80' },
  { label: 'Trophy Celebration', url: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?auto=format&fit=crop&w=1000&q=80' },
];

export const GalleryUploadModal: React.FC<GalleryUploadModalProps> = ({
  isOpen,
  onClose,
  targetGalleryId,
}) => {
  const {
    members,
    galleries,
    currentMemberId,
    loggedInMemberId,
    createGallery,
    addPhotosToGallery,
  } = useFamily();

  const [mode, setMode] = useState<'existing' | 'new'>(targetGalleryId ? 'existing' : 'existing');
  const [selectedGalleryId, setSelectedGalleryId] = useState<string>(
    targetGalleryId || galleries[0]?.id || ''
  );

  // New Album metadata
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState<GalleryAlbum['category']>('everyday');
  const [albumDate, setAlbumDate] = useState(new Date().toISOString().split('T')[0]);

  // Contributor / Uploader
  const [uploaderMemberId, setUploaderMemberId] = useState(
    loggedInMemberId || (currentMemberId === 'all' ? members[0]?.id || 'm1' : currentMemberId)
  );

  // Staged Photos for batch upload
  const [stagedPhotos, setStagedPhotos] = useState<
    { imageUrl: string; caption: string }[]
  >([]);

  // Input states for adding another photo
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [customCaptionInput, setCustomCaptionInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleAddStagedPhoto = (url: string, caption = '') => {
    if (!url.trim()) return;
    setStagedPhotos((prev) => [...prev, { imageUrl: url.trim(), caption: caption.trim() }]);
    setCustomUrlInput('');
    setCustomCaptionInput('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          handleAddStagedPhoto(reader.result, file.name.replace(/\.[^/.]+$/, ''));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (stagedPhotos.length === 0) return;

    const mappedPhotos = stagedPhotos.map((p) => ({
      imageUrl: p.imageUrl,
      caption: p.caption || undefined,
      uploadedByMemberId: uploaderMemberId,
      uploadedAt: new Date().toISOString().split('T')[0],
    }));

    if (mode === 'new') {
      if (!newTitle.trim()) return;
      createGallery(
        {
          title: newTitle.trim(),
          description: newDescription.trim() || 'Family album',
          date: albumDate,
          coverPhotoUrl: stagedPhotos[0].imageUrl,
          category: newCategory,
          createdByMemberId: uploaderMemberId,
          isPublicShared: true,
        },
        mappedPhotos
      );
    } else {
      if (!selectedGalleryId) return;
      addPhotosToGallery(selectedGalleryId, mappedPhotos);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border-2 border-stone-200 animate-in fade-in zoom-in-95 my-auto max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-xl font-black shadow-xs">
              📸
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-stone-900 leading-tight">
                Add Photos to Family Moments
              </h3>
              <p className="text-xs font-semibold text-stone-500">
                Collaborate together on albums & shared memories
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center font-black transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto py-4 space-y-5 flex-1 pr-1">
          
          {/* Target Mode: Add to Existing Album vs Create New Album */}
          <div>
            <label className="block text-xs font-extrabold text-stone-700 uppercase tracking-wide mb-2">
              Where should these photos go?
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode('existing')}
                className={`py-2 px-3 rounded-2xl border-2 font-black text-xs flex items-center justify-center gap-2 transition-all ${
                  mode === 'existing'
                    ? 'bg-amber-50 text-amber-900 border-amber-300 shadow-xs'
                    : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                }`}
              >
                <span>Add to Existing Album</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('new')}
                className={`py-2 px-3 rounded-2xl border-2 font-black text-xs flex items-center justify-center gap-2 transition-all ${
                  mode === 'new'
                    ? 'bg-amber-50 text-amber-900 border-amber-300 shadow-xs'
                    : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                }`}
              >
                <FolderPlus className="w-4 h-4" />
                <span>Create New Album</span>
              </button>
            </div>
          </div>

          {/* Existing Album Selector */}
          {mode === 'existing' ? (
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Select Family Album
              </label>
              <select
                value={selectedGalleryId}
                onChange={(e) => setSelectedGalleryId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-stone-200 bg-white text-sm font-bold focus:outline-none focus:border-amber-400"
              >
                {galleries.map((gal) => (
                  <option key={gal.id} value={gal.id}>
                    {gal.title} ({gal.photos.length} photos)
                  </option>
                ))}
              </select>
            </div>
          ) : (
            /* New Album Fields */
            <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200 space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Album Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Grandma Elena's 75th Birthday, Weekend Lake Canoe..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-bold focus:outline-none focus:border-amber-500 bg-white"
                  required={mode === 'new'}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-bold bg-white"
                  >
                    <option value="everyday">Everyday Family Moments</option>
                    <option value="vacation">Vacation & Trips</option>
                    <option value="birthday">Birthdays & Parties</option>
                    <option value="sports">Sports & Tournaments</option>
                    <option value="milestones">Milestones & School</option>
                    <option value="holidays">Holidays & Celebrations</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={albumDate}
                    onChange={(e) => setAlbumDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-bold bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Description / Story
                </label>
                <input
                  type="text"
                  placeholder="Brief note about the day..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-medium bg-white"
                />
              </div>
            </div>
          )}

          {/* Contributor / Who is Uploading */}
          <div>
            <label className="block text-xs font-extrabold text-stone-700 uppercase tracking-wide mb-1.5">
              Who is adding these photos?
            </label>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {members.map((m) => {
                const isSelected = uploaderMemberId === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setUploaderMemberId(m.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 text-xs font-black transition-all shrink-0 ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-400 text-indigo-900 shadow-2xs'
                        : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <span>{m.avatar}</span>
                    <span>{m.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Staged Photos Preview Strip */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-extrabold text-stone-700 uppercase tracking-wide">
                Photos to Upload ({stagedPhotos.length})
              </label>
              {stagedPhotos.length > 0 && (
                <button
                  type="button"
                  onClick={() => setStagedPhotos([])}
                  className="text-[11px] font-bold text-rose-600 hover:underline"
                >
                  Clear All
                </button>
              )}
            </div>

            {stagedPhotos.length === 0 ? (
              <div className="p-6 rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50/60 text-center space-y-1">
                <span className="text-2xl block">🖼️</span>
                <p className="text-xs font-bold text-stone-600">No photos selected yet</p>
                <p className="text-[11px] text-stone-400">
                  Pick from curated presets below, paste a link, or upload files from your device.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {stagedPhotos.map((photo, idx) => (
                  <div
                    key={idx}
                    className="relative rounded-xl overflow-hidden border border-stone-200 aspect-4/3 group"
                  >
                    <img
                      src={photo.imageUrl}
                      alt={`Staged ${idx}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setStagedPhotos((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="absolute top-1 right-1 w-6 h-6 rounded-lg bg-black/70 text-white flex items-center justify-center opacity-90 group-hover:opacity-100 hover:bg-rose-600 transition-colors text-xs"
                    >
                      ✕
                    </button>
                    {photo.caption && (
                      <div className="absolute bottom-0 inset-x-0 bg-black/60 p-1 text-[10px] text-white truncate px-1.5">
                        {photo.caption}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Presets Picker */}
          <div>
            <label className="block text-xs font-bold text-stone-600 mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Tap to Add Preset Photos:</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_PHOTO_COLLECTION.map((pre, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleAddStagedPhoto(pre.url, pre.label)}
                  className="px-2.5 py-1 rounded-xl bg-stone-100 hover:bg-amber-100 text-stone-700 hover:text-amber-900 border border-stone-200 text-[11px] font-bold transition-colors"
                >
                  + {pre.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom URL & Caption or File upload */}
          <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <input
                type="text"
                placeholder="Paste photo image URL (https://...)..."
                value={customUrlInput}
                onChange={(e) => setCustomUrlInput(e.target.value)}
                className="flex-1 w-full px-3 py-1.5 rounded-xl border border-stone-300 text-xs bg-white focus:outline-none"
              />
              <input
                type="text"
                placeholder="Caption (optional)"
                value={customCaptionInput}
                onChange={(e) => setCustomCaptionInput(e.target.value)}
                className="w-full sm:w-40 px-3 py-1.5 rounded-xl border border-stone-300 text-xs bg-white focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleAddStagedPhoto(customUrlInput, customCaptionInput)}
                disabled={!customUrlInput.trim()}
                className="w-full sm:w-auto px-4 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-900 text-white text-xs font-bold disabled:opacity-40 shrink-0"
              >
                + Add
              </button>
            </div>

            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="text-[11px] text-stone-500 font-medium">Or choose from phone gallery:</span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-black text-indigo-600 hover:underline flex items-center gap-1"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload device files</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={stagedPhotos.length === 0}
              className="duo-btn duo-btn-green px-6 py-2.5 text-xs font-black rounded-xl shadow-xs disabled:opacity-50"
            >
              <span>Upload {stagedPhotos.length} Photos to Album</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
