import React, { useState } from 'react';
import { useFamily } from '../context/FamilyContext';
import { GalleryAlbum } from '../types';
import {
  Heart,
  Plus,
  Share2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  Trash2,
  Globe,
  Upload,
} from 'lucide-react';
import { GalleryShareModal } from '../components/GalleryShareModal';
import { GuestGalleryViewer } from '../components/GuestGalleryViewer';
import { GalleryUploadModal } from '../components/GalleryUploadModal';

export const PhotoStreamView: React.FC = () => {
  const {
    members,
    galleries,
    deleteGallery,
    deletePhotoFromGallery,
    toggleGalleryPhotoLike,
    toggleGalleryShare,
    currentMemberId,
  } = useFamily();

  // Active Selected Gallery (null = show all albums grid)
  const [selectedGalleryId, setSelectedGalleryId] = useState<string | null>(null);

  // Category filter
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Modals state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [sharingGallery, setSharingGallery] = useState<GalleryAlbum | null>(null);
  const [guestPreviewGallery, setGuestPreviewGallery] = useState<GalleryAlbum | null>(null);

  // Lightbox within the album
  const [lightboxPhotoIdx, setLightboxPhotoIdx] = useState<number | null>(null);

  const selectedGallery = galleries.find((g) => g.id === selectedGalleryId) || null;

  // Filtered galleries
  const filteredGalleries = galleries.filter((g) => {
    if (categoryFilter === 'all') return true;
    return g.category === categoryFilter;
  });

  const categories = [
    { id: 'all', label: 'All Albums' },
    { id: 'vacation', label: 'Vacations & Trips 🏔️' },
    { id: 'birthday', label: 'Birthdays & Parties 🎂' },
    { id: 'everyday', label: 'Everyday Moments 🍪' },
    { id: 'sports', label: 'Sports & Games ⚽' },
    { id: 'milestones', label: 'Milestones & School 🎨' },
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="duo-card p-5 sm:p-6 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-black text-2xl shadow-xs">
            📸
          </div>
          <div>
            <h2 className="text-xl font-black text-stone-900">Family Moments & Shared Galleries</h2>
            <p className="text-xs font-bold text-stone-400">
              Collaborative multi-photo albums with relative sharing & guest love notes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedGalleryId && (
            <button
              onClick={() => setSelectedGalleryId(null)}
              className="duo-btn duo-btn-white px-3.5 py-2 text-xs font-black rounded-xl flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>All Albums</span>
            </button>
          )}

          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="duo-btn duo-btn-green px-4 py-2 text-xs font-black rounded-xl shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>{selectedGalleryId ? '+ Add Photos' : '+ New Album / Upload'}</span>
          </button>
        </div>
      </div>

      {/* VIEW MODE 1: ALL ALBUMS GRID */}
      {!selectedGallery ? (
        <div className="space-y-5">
          
          {/* Category Chips Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all whitespace-nowrap border-2 ${
                  categoryFilter === cat.id
                    ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-2xs'
                    : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Albums Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {filteredGalleries.map((album) => {
              // Gather distinct contributor member IDs from album photos
              const contributorIds = Array.from(
                new Set(album.photos.map((p) => p.uploadedByMemberId))
              );
              const contributors = members.filter((m) => contributorIds.includes(m.id));

              return (
                <div
                  key={album.id}
                  onClick={() => setSelectedGalleryId(album.id)}
                  className="cursor-pointer group duo-card bg-white overflow-hidden flex flex-col justify-between hover:shadow-md transition-all relative border-2 border-stone-200/90 hover:border-amber-300"
                >
                  <div>
                    {/* Cover Photo Banner */}
                    <div className="relative h-48 sm:h-52 overflow-hidden bg-stone-100">
                      <img
                        src={album.coverPhotoUrl}
                        alt={album.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

                      {/* Photo Count Badge */}
                      <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-black text-white flex items-center gap-1">
                        <span>📸</span>
                        <span>{album.photos.length} photos</span>
                      </div>

                      {/* Quick Share Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSharingGallery(album);
                        }}
                        className="absolute top-3 right-3 p-2 rounded-xl bg-white/95 hover:bg-white text-stone-800 shadow-sm transition-transform active:scale-95 flex items-center gap-1 text-xs font-bold"
                        title="Share gallery with relatives"
                      >
                        <Share2 className="w-3.5 h-3.5 text-indigo-600" />
                        <span className="hidden xs:inline text-[11px]">Share</span>
                      </button>

                      {/* Date Badge Bottom Right */}
                      <div className="absolute bottom-3 right-3 text-[11px] font-extrabold text-white/90 bg-black/50 backdrop-blur-xs px-2 py-0.5 rounded-lg">
                        {album.date}
                      </div>
                    </div>

                    {/* Album Content info */}
                    <div className="p-4 sm:p-5 space-y-2">
                      <h3 className="font-black text-stone-900 text-base leading-snug group-hover:text-amber-800 transition-colors">
                        {album.title}
                      </h3>
                      <p className="text-xs text-stone-600 font-medium line-clamp-2 leading-relaxed">
                        {album.description}
                      </p>

                      {/* Contributor Members Strip */}
                      <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-extrabold text-stone-400 uppercase">
                            Contributors:
                          </span>
                          <div className="flex -space-x-1.5">
                            {contributors.map((m) => (
                              <span
                                key={m.id}
                                title={m.name}
                                className="w-6 h-6 rounded-full border border-white bg-stone-100 text-xs flex items-center justify-center shadow-2xs"
                              >
                                {m.avatar}
                              </span>
                            ))}
                          </div>
                        </div>

                        {album.guestReactions && album.guestReactions.length > 0 && (
                          <span className="text-[11px] font-extrabold text-rose-600 flex items-center gap-1">
                            <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                            <span>{album.guestReactions.length} love notes</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Bar */}
                  <div className="px-4 py-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between text-xs">
                    <span className="font-extrabold text-amber-800 group-hover:underline">
                      Open Album Gallery →
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSharingGallery(album);
                      }}
                      className="text-indigo-600 hover:text-indigo-800 font-black flex items-center gap-1"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Guest Link</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredGalleries.length === 0 && (
            <div className="p-12 text-center duo-card bg-white">
              <span className="text-3xl block mb-2">📸</span>
              <h4 className="text-sm font-black text-stone-800">No albums in this category</h4>
              <p className="text-xs text-stone-400 mt-1">Tap "+ New Album / Upload" to create one!</p>
            </div>
          )}

        </div>
      ) : (
        /* VIEW MODE 2: SPECIFIC ALBUM GALLERY VIEW */
        <div className="space-y-6">
          
          {/* Album Hero Showcase Card */}
          <div className="duo-card p-5 sm:p-6 bg-white space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-100 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 uppercase tracking-wide">
                    {selectedGallery.category}
                  </span>
                  <span className="text-xs font-bold text-stone-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{selectedGallery.date}</span>
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-stone-900">
                  {selectedGallery.title}
                </h2>
                <p className="text-xs sm:text-sm text-stone-600 font-medium max-w-2xl leading-relaxed">
                  {selectedGallery.description}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(true)}
                  className="duo-btn duo-btn-green px-4 py-2 text-xs font-black rounded-xl flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>+ Add Photos to Album</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSharingGallery(selectedGallery)}
                  className="duo-btn duo-btn-blue px-4 py-2 text-xs font-black rounded-xl flex items-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share with Relatives</span>
                </button>

                <button
                  type="button"
                  onClick={() => setGuestPreviewGallery(selectedGallery)}
                  className="duo-btn duo-btn-white px-3.5 py-2 text-xs font-black rounded-xl text-stone-700 flex items-center gap-1.5"
                  title="View as a relative guest"
                >
                  <Globe className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Guest View</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete the album "${selectedGallery.title}" and all its photos?`)) {
                      deleteGallery(selectedGallery.id);
                      setSelectedGalleryId(null);
                    }
                  }}
                  className="px-3 py-2 text-xs font-black rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-1"
                  title="Delete Album"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Delete Album</span>
                </button>
              </div>
            </div>

            {/* Contributors & Love Notes Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-stone-500">Contributing Family Members:</span>
                <div className="flex items-center gap-1.5">
                  {Array.from(new Set(selectedGallery.photos.map((p) => p.uploadedByMemberId))).map(
                    (mid) => {
                      const m = members.find((mem) => mem.id === mid);
                      if (!m) return null;
                      return (
                        <span
                          key={mid}
                          className="inline-flex items-center gap-1 bg-stone-100 px-2 py-0.5 rounded-lg font-bold text-stone-700"
                        >
                          <span>{m.avatar}</span>
                          <span>{m.name}</span>
                        </span>
                      );
                    }
                  )}
                </div>
              </div>

              {selectedGallery.guestReactions && selectedGallery.guestReactions.length > 0 && (
                <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 px-3 py-1 rounded-xl text-rose-800 font-extrabold text-xs">
                  <span>💌 {selectedGallery.guestReactions.length} love notes received from relatives</span>
                </div>
              )}
            </div>
          </div>

          {/* Photo Gallery Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {selectedGallery.photos.map((photo, idx) => {
              const uploader = members.find((m) => m.id === photo.uploadedByMemberId);
              const hasLiked = currentMemberId !== 'all' && photo.likes.includes(currentMemberId);

              return (
                <div
                  key={photo.id}
                  onClick={() => setLightboxPhotoIdx(idx)}
                  className="cursor-pointer group duo-card bg-white overflow-hidden flex flex-col justify-between transition-all hover:border-amber-300 relative"
                >
                  <div className="relative aspect-4/3 overflow-hidden bg-stone-100">
                    <img
                      src={photo.imageUrl}
                      alt={photo.caption || 'Memory photo'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3 text-white text-xs font-bold">
                      Click to expand photo
                    </div>

                    {/* Contributor Pill */}
                    {uploader && (
                      <div className="absolute top-2.5 left-2.5 bg-white/95 backdrop-blur-md px-2 py-0.5 rounded-lg text-[10px] font-black text-stone-800 shadow-2xs flex items-center gap-1">
                        <span>{uploader.avatar}</span>
                        <span>{uploader.name}</span>
                      </div>
                    )}
                  </div>

                  <div className="p-3.5 space-y-2">
                    {photo.caption && (
                      <p className="text-xs font-extrabold text-stone-800 leading-snug">
                        {photo.caption}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                      {/* Likes count & button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleGalleryPhotoLike(selectedGallery.id, photo.id);
                        }}
                        className={`flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-lg transition-colors ${
                          hasLiked
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-stone-100 text-stone-600 hover:bg-rose-50 hover:text-rose-600'
                        }`}
                      >
                        <Heart
                          className={`w-3.5 h-3.5 ${
                            hasLiked ? 'fill-rose-600 text-rose-600' : ''
                          }`}
                        />
                        <span>{photo.likes.length > 0 ? photo.likes.length : ''}</span>
                      </button>

                      {/* Delete photo button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('Delete this photo from the album?')) {
                            deletePhotoFromGallery(selectedGallery.id, photo.id);
                          }
                        }}
                        className="p-1.5 text-stone-300 hover:text-rose-600 rounded-lg transition-colors"
                        title="Delete photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Received Relative Love Notes Section */}
          {selectedGallery.guestReactions && selectedGallery.guestReactions.length > 0 && (
            <div className="duo-card p-5 sm:p-6 bg-gradient-to-r from-rose-50/70 to-amber-50/70 border-2 border-rose-200 space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">💌</span>
                <div>
                  <h3 className="text-sm font-black text-stone-900">Love Notes from Relatives</h3>
                  <p className="text-xs text-stone-500">
                    Grandma, Grandpa & family friends sent these cheers from the guest link:
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedGallery.guestReactions.map((reac) => (
                  <div
                    key={reac.id}
                    className="p-3.5 bg-white rounded-2xl border border-rose-200 shadow-2xs flex items-start gap-3"
                  >
                    <span className="text-2xl">{reac.emoji}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-xs font-black text-stone-900">{reac.author}</strong>
                        <span className="text-[10px] text-stone-400">{reac.timestamp}</span>
                      </div>
                      <p className="text-xs text-stone-700 mt-0.5 font-medium">"{reac.message}"</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Lightbox Modal (For photo viewing inside an album) */}
      {selectedGallery && lightboxPhotoIdx !== null && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 animate-in fade-in">
          <div className="flex items-center justify-between text-white pb-2">
            <span className="text-xs font-bold text-stone-400">
              {lightboxPhotoIdx + 1} / {selectedGallery.photos.length}
            </span>
            <button
              onClick={() => setLightboxPhotoIdx(null)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-between gap-4 max-h-[80vh] my-auto relative">
            <button
              onClick={() =>
                setLightboxPhotoIdx((prev) =>
                  prev !== null && prev > 0 ? prev - 1 : selectedGallery.photos.length - 1
                )
              }
              className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-xs transition-transform active:scale-90"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <img
              src={selectedGallery.photos[lightboxPhotoIdx].imageUrl}
              alt="Expanded"
              className="max-h-[75vh] max-w-full object-contain rounded-2xl shadow-2xl mx-auto"
            />

            <button
              onClick={() =>
                setLightboxPhotoIdx((prev) =>
                  prev !== null && prev < selectedGallery.photos.length - 1 ? prev + 1 : 0
                )
              }
              className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-xs transition-transform active:scale-90"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {selectedGallery.photos[lightboxPhotoIdx].caption && (
            <div className="text-center pt-3 pb-2 text-white max-w-lg mx-auto">
              <p className="text-sm font-semibold">
                {selectedGallery.photos[lightboxPhotoIdx].caption}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Share with Relatives Modal */}
      <GalleryShareModal
        gallery={sharingGallery}
        isOpen={!!sharingGallery}
        onClose={() => setSharingGallery(null)}
        onOpenGuestPreview={(g) => {
          setSharingGallery(null);
          setGuestPreviewGallery(g);
        }}
        onToggleShare={toggleGalleryShare}
      />

      {/* Standalone Guest Relative Viewer (Full-screen preview) */}
      {guestPreviewGallery && (
        <GuestGalleryViewer
          gallery={guestPreviewGallery}
          onClose={() => setGuestPreviewGallery(null)}
        />
      )}

      {/* Collaborative Multi-Photo Upload Modal */}
      <GalleryUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        targetGalleryId={selectedGalleryId || undefined}
      />

    </div>
  );
};
