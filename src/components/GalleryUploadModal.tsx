import React, { useState, useRef } from 'react';
import { GalleryAlbum } from '../types';
import { useFamily } from '../context/FamilyContext';
import { ModalPortal } from './ModalPortal';
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
  { label: 'Bergwanderung', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1000&q=80' },
  { label: 'Sonnenuntergang am See', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80' },
  { label: 'Plätzchen backen', url: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1000&q=80' },
  { label: 'Frische Kekse', url: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=1000&q=80' },
  { label: 'Geburtstagskerzen', url: 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?auto=format&fit=crop&w=1000&q=80' },
  { label: 'Luftballons', url: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1000&q=80' },
  { label: 'Fußballspiel', url: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=1000&q=80' },
  { label: 'Pokalsieger', url: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?auto=format&fit=crop&w=1000&q=80' },
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
          description: newDescription.trim() || 'Familienalbum',
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

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border-2 border-stone-200 dark:border-slate-800 animate-in fade-in zoom-in-95 my-auto max-h-[92vh] flex flex-col text-stone-900 dark:text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 flex items-center justify-center text-xl font-black shadow-xs">
              📸
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-stone-900 dark:text-white leading-tight">
                Fotos zu Familien-Momenten hinzufügen
              </h3>
              <p className="text-xs font-semibold text-stone-500 dark:text-slate-400">
                Gemeinsam an Alben & Erinnerungen mitwirken
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 text-stone-600 dark:text-slate-400 flex items-center justify-center font-black transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto py-4 space-y-5 flex-1 pr-1">
          
          {/* Target Mode: Add to Existing Album vs Create New Album */}
          <div>
            <label className="block text-xs font-extrabold text-stone-700 dark:text-slate-300 uppercase tracking-wide mb-2">
              Wohin sollen die Fotos?
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode('existing')}
                className={`py-2 px-3 rounded-2xl border-2 font-black text-xs flex items-center justify-center gap-2 transition-all ${
                  mode === 'existing'
                    ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-700 shadow-xs'
                    : 'bg-stone-50 dark:bg-slate-800 text-stone-600 dark:text-slate-300 border-stone-200 dark:border-slate-700 hover:bg-stone-100 dark:hover:bg-slate-700'
                }`}
              >
                <span>Zu bestehendem Album</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('new')}
                className={`py-2 px-3 rounded-2xl border-2 font-black text-xs flex items-center justify-center gap-2 transition-all ${
                  mode === 'new'
                    ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-700 shadow-xs'
                    : 'bg-stone-50 dark:bg-slate-800 text-stone-600 dark:text-slate-300 border-stone-200 dark:border-slate-700 hover:bg-stone-100 dark:hover:bg-slate-700'
                }`}
              >
                <FolderPlus className="w-4 h-4" />
                <span>Neues Album anlegen</span>
              </button>
            </div>
          </div>

          {/* Existing Album Selector */}
          {mode === 'existing' ? (
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-slate-300 mb-1">
                Familienalbum auswählen
              </label>
              <select
                value={selectedGalleryId}
                onChange={(e) => setSelectedGalleryId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-sm font-bold focus:outline-none focus:border-amber-400"
              >
                {galleries.map((gal) => (
                  <option key={gal.id} value={gal.id}>
                    {gal.title} ({gal.photos.length} Fotos)
                  </option>
                ))}
              </select>
            </div>
          ) : (
            /* New Album Fields */
            <div className="p-4 bg-amber-50/50 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-800 space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-slate-300 mb-1">
                  Album-Name *
                </label>
                <input
                  type="text"
                  placeholder="z. B. Omas 75. Geburtstag, Sommerurlaub an der Ostsee..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 text-sm font-bold focus:outline-none focus:border-amber-500 bg-white dark:bg-slate-800 text-stone-900 dark:text-white"
                  required={mode === 'new'}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-slate-300 mb-1">
                    Kategorie
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 text-xs font-bold bg-white dark:bg-slate-800 text-stone-900 dark:text-white"
                  >
                    <option value="everyday">Familien-Alltag</option>
                    <option value="vacation">Urlaub & Reisen</option>
                    <option value="birthday">Geburtstage & Feste</option>
                    <option value="sports">Sport & Turniere</option>
                    <option value="milestones">Meilensteine & Schule</option>
                    <option value="holidays">Feiertage & Ausflüge</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-slate-300 mb-1">
                    Datum
                  </label>
                  <input
                    type="date"
                    value={albumDate}
                    onChange={(e) => setAlbumDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 text-xs font-bold bg-white dark:bg-slate-800 text-stone-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-slate-300 mb-1">
                  Beschreibung / Geschichte
                </label>
                <input
                  type="text"
                  placeholder="Kurze Notiz zu diesem Tag..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 text-xs font-medium bg-white dark:bg-slate-800 text-stone-900 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* Contributor / Who is Uploading */}
          <div>
            <label className="block text-xs font-extrabold text-stone-700 dark:text-slate-300 uppercase tracking-wide mb-1.5">
              Wer lädt diese Fotos hoch?
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
                        ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-400 dark:border-indigo-600 text-indigo-900 dark:text-indigo-300 shadow-2xs'
                        : 'bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700 text-stone-600 dark:text-slate-300 hover:bg-stone-50 dark:hover:bg-slate-700'
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
              <label className="block text-xs font-extrabold text-stone-700 dark:text-slate-300 uppercase tracking-wide">
                Ausgewählte Fotos ({stagedPhotos.length})
              </label>
              {stagedPhotos.length > 0 && (
                <button
                  type="button"
                  onClick={() => setStagedPhotos([])}
                  className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline"
                >
                  Alle entfernen
                </button>
              )}
            </div>

            {stagedPhotos.length === 0 ? (
              <div className="p-6 rounded-2xl border-2 border-dashed border-stone-200 dark:border-slate-700 bg-stone-50/60 dark:bg-slate-800/40 text-center space-y-1">
                <span className="text-2xl block">🖼️</span>
                <p className="text-xs font-bold text-stone-600 dark:text-slate-300">Noch keine Fotos ausgewählt</p>
                <p className="text-[11px] text-stone-400 dark:text-slate-500">
                  Wähle aus den Vorlagen unten, füge einen Link ein oder lade Fotos von deinem Gerät hoch.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {stagedPhotos.map((photo, idx) => (
                  <div
                    key={idx}
                    className="relative rounded-xl overflow-hidden border border-stone-200 dark:border-slate-700 aspect-4/3 group"
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
            <label className="block text-xs font-bold text-stone-600 dark:text-slate-300 mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Foto-Vorlagen per Klick hinzufügen:</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_PHOTO_COLLECTION.map((pre, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleAddStagedPhoto(pre.url, pre.label)}
                  className="px-2.5 py-1 rounded-xl bg-stone-100 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-950/50 text-stone-700 dark:text-slate-300 hover:text-amber-900 dark:hover:text-amber-300 border border-stone-200 dark:border-slate-700 text-[11px] font-bold transition-colors"
                >
                  + {pre.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom URL & Caption or File upload */}
          <div className="p-3 bg-stone-50 dark:bg-slate-800/60 rounded-2xl border border-stone-200 dark:border-slate-700 space-y-2">
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <input
                type="text"
                placeholder="Bild-URL einfügen (https://...)..."
                value={customUrlInput}
                onChange={(e) => setCustomUrlInput(e.target.value)}
                className="flex-1 w-full px-3 py-1.5 rounded-xl border border-stone-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-stone-900 dark:text-white focus:outline-none"
              />
              <input
                type="text"
                placeholder="Bildunterschrift (optional)"
                value={customCaptionInput}
                onChange={(e) => setCustomCaptionInput(e.target.value)}
                className="w-full sm:w-40 px-3 py-1.5 rounded-xl border border-stone-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-stone-900 dark:text-white focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleAddStagedPhoto(customUrlInput, customCaptionInput)}
                disabled={!customUrlInput.trim()}
                className="w-full sm:w-auto px-4 py-1.5 rounded-xl bg-stone-800 dark:bg-emerald-600 hover:bg-stone-900 dark:hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-40 shrink-0"
              >
                + Hinzufügen
              </button>
            </div>

            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="text-[11px] text-stone-500 dark:text-slate-400 font-medium">Oder vom Smartphone / PC auswählen:</span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-black text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Fotos hochladen</span>
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
          <div className="pt-3 border-t border-stone-100 dark:border-slate-800 flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-stone-600 dark:text-slate-400 hover:bg-stone-100 dark:hover:bg-slate-800"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={stagedPhotos.length === 0}
              className="duo-btn duo-btn-green px-6 py-2.5 text-xs font-black rounded-xl shadow-xs disabled:opacity-50"
            >
              <span>{stagedPhotos.length} {stagedPhotos.length === 1 ? 'Foto' : 'Fotos'} im Album speichern</span>
            </button>
          </div>

        </form>

      </div>
    </div>
    </ModalPortal>
  );
};
