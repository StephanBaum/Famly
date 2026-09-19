import React, { useState, useRef } from 'react';
import { GalleryAlbum } from '../types';
import { useFamily } from '../context/FamilyContext';
import { ModalPortal } from './ModalPortal';
import { uploadPhotoToStorage } from '../services/supabase';
import {
  X,
  Upload,
  FolderPlus,
  Loader2,
  Image as ImageIcon,
  Link as LinkIcon,
  Trash2,
} from 'lucide-react';

interface GalleryUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetGalleryId?: string; // If provided, defaults to adding into this specific gallery
}

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

  const hasGalleries = galleries.length > 0;

  const [mode, setMode] = useState<'existing' | 'new'>(
    targetGalleryId ? 'existing' : hasGalleries ? 'existing' : 'new'
  );
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
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Secondary Web-URL input toggle & states
  const [showUrlInput, setShowUrlInput] = useState(false);
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

  const processFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of files) {
        const url = await uploadPhotoToStorage(file, 'albums');
        const caption = file.name.replace(/\.[^/.]+$/, '');
        handleAddStagedPhoto(url, caption);
      }
    } catch (err) {
      console.error('Photo upload failed:', err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
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
                  {hasGalleries ? 'Fotos zu Album hinzufügen' : 'Erstes Familienalbum anlegen'}
                </h3>
                <p className="text-xs font-semibold text-stone-500 dark:text-slate-400">
                  Fotos von Handy oder PC hochladen & sicher teilen
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
                  disabled={!hasGalleries}
                  onClick={() => setMode('existing')}
                  className={`py-2 px-3 rounded-2xl border-2 font-black text-xs flex items-center justify-center gap-2 transition-all ${
                    !hasGalleries
                      ? 'opacity-40 cursor-not-allowed bg-stone-100 dark:bg-slate-800 border-stone-200 dark:border-slate-700 text-stone-400'
                      : mode === 'existing'
                      ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-700 shadow-xs'
                      : 'bg-stone-50 dark:bg-slate-800 text-stone-600 dark:text-slate-300 border-stone-200 dark:border-slate-700 hover:bg-stone-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>Zu bestehendem Album</span>
                  {!hasGalleries && <span className="text-[10px] text-stone-400 font-normal">(keine)</span>}
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
            {mode === 'existing' && hasGalleries ? (
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
                    placeholder="z. B. Sommerurlaub, Omas 75. Geburtstag, Zoo-Ausflug..."
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
                      <option value="everyday">Familien-Alltag 🍪</option>
                      <option value="vacation">Urlaub & Reisen 🏔️</option>
                      <option value="birthday">Geburtstage & Feste 🎂</option>
                      <option value="sports">Sport & Turniere ⚽</option>
                      <option value="milestones">Meilensteine & Schule 🎨</option>
                      <option value="holidays">Feiertage & Ausflüge 🌟</option>
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
                    Beschreibung / Notiz (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Kurze Erinnerung oder Geschichte zu diesem Anlass..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 text-xs font-medium bg-white dark:bg-slate-800 text-stone-900 dark:text-white"
                  />
                </div>
              </div>
            )}

            {/* Contributor / Who is Uploading */}
            {members.length > 0 && (
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
            )}

            {/* Primary Drag & Drop Upload Zone */}
            <div>
              <label className="block text-xs font-extrabold text-stone-700 dark:text-slate-300 uppercase tracking-wide mb-2">
                Fotos hochladen
              </label>

              <div
                onClick={() => !isUploading && fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`p-6 sm:p-8 rounded-3xl border-2 border-dashed text-center flex flex-col items-center justify-center gap-3 transition-all cursor-pointer ${
                  isDragging
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 scale-[1.01]'
                    : 'border-stone-300 dark:border-slate-700 bg-stone-50/70 dark:bg-slate-800/40 hover:bg-stone-100/70 dark:hover:bg-slate-800/80 hover:border-amber-400 dark:hover:border-amber-500'
                }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 flex items-center justify-center shadow-xs">
                  {isUploading ? (
                    <Loader2 className="w-7 h-7 animate-spin text-amber-600" />
                  ) : (
                    <Upload className="w-7 h-7 stroke-[2.5]" />
                  )}
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-black text-stone-900 dark:text-white">
                    {isUploading
                      ? 'Fotos werden hochgeladen & optimiert...'
                      : 'Klicken oder Fotos hierher ziehen'}
                  </p>
                  <p className="text-xs text-stone-500 dark:text-slate-400 max-w-sm mx-auto">
                    Wähle Fotos von deinem Smartphone (Galerie/Kamera) oder Computer aus.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={isUploading}
                  className="duo-btn duo-btn-white px-5 py-2 text-xs font-black rounded-xl shadow-2xs flex items-center gap-2 pointer-events-none"
                >
                  <ImageIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Dateien auswählen</span>
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

            {/* Staged Photos Preview Grid */}
            {stagedPhotos.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-extrabold text-stone-700 dark:text-slate-300 uppercase tracking-wide">
                    Ausgewählte Fotos ({stagedPhotos.length})
                  </label>
                  <button
                    type="button"
                    onClick={() => setStagedPhotos([])}
                    className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Alle entfernen</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {stagedPhotos.map((photo, idx) => (
                    <div
                      key={idx}
                      className="relative rounded-2xl overflow-hidden border-2 border-stone-200 dark:border-slate-700 aspect-4/3 group bg-stone-100 dark:bg-slate-800"
                    >
                      <img
                        src={photo.imageUrl}
                        alt={`Vorschau ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setStagedPhotos((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="absolute top-2 right-2 w-7 h-7 rounded-xl bg-black/75 text-white flex items-center justify-center opacity-90 hover:opacity-100 hover:bg-rose-600 transition-colors shadow-sm"
                        title="Foto entfernen"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      {/* Caption Input / Display */}
                      <div className="absolute bottom-0 inset-x-0 bg-black/70 backdrop-blur-xs p-1.5">
                        <input
                          type="text"
                          placeholder="Bildunterschrift..."
                          value={photo.caption}
                          onChange={(e) => {
                            const val = e.target.value;
                            setStagedPhotos((prev) =>
                              prev.map((p, i) => (i === idx ? { ...p, caption: val } : p))
                            );
                          }}
                          className="w-full bg-transparent text-[11px] text-white placeholder:text-stone-300 border-none outline-none font-medium px-1"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Optional / Secondary: Web Image URL Input */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="text-xs font-bold text-stone-500 dark:text-slate-400 hover:text-stone-800 dark:hover:text-white flex items-center gap-1.5 transition-colors"
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>{showUrlInput ? 'Web-URL Eingabe schließen' : 'Oder Bild über Web-URL einfügen (optional)'}</span>
              </button>

              {showUrlInput && (
                <div className="mt-2 p-3 bg-stone-50 dark:bg-slate-800/60 rounded-2xl border border-stone-200 dark:border-slate-700 flex flex-col sm:flex-row items-center gap-2">
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
              )}
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
                disabled={stagedPhotos.length === 0 || (mode === 'new' && !newTitle.trim())}
                className="duo-btn duo-btn-green px-6 py-2.5 text-xs font-black rounded-xl shadow-xs disabled:opacity-50"
              >
                <span>
                  {stagedPhotos.length === 0
                    ? 'Wähle mindestens 1 Foto'
                    : `${stagedPhotos.length} ${stagedPhotos.length === 1 ? 'Foto' : 'Fotos'} im Album speichern`}
                </span>
              </button>
            </div>

          </form>

        </div>
      </div>
    </ModalPortal>
  );
};
