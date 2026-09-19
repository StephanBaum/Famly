import React, { useState } from 'react';
import { GalleryAlbum } from '../types';
import { useFamily } from '../context/FamilyContext';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Send,
  Check,
} from 'lucide-react';

interface GuestGalleryViewerProps {
  gallery: GalleryAlbum;
  onClose: () => void;
}

export const GuestGalleryViewer: React.FC<GuestGalleryViewerProps> = ({ gallery, onClose }) => {
  const { members, addGuestReaction } = useFamily();
  const [activePhotoIdx, setActivePhotoIdx] = useState<number | null>(null);

  // Guest comment form state
  const [guestName, setGuestName] = useState('');
  const [guestMessage, setGuestMessage] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('❤️');
  const [reactionSent, setReactionSent] = useState(false);

  const EMOJI_OPTIONS = ['❤️', '👏', '🎉', '🌟', '😍', '🍪', '🙌'];

  const handleSendReaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestMessage.trim()) return;
    addGuestReaction(
      gallery.id,
      guestName.trim() || 'Relative',
      guestMessage.trim(),
      selectedEmoji
    );
    setGuestMessage('');
    setReactionSent(true);
    setTimeout(() => setReactionSent(false), 4000);
  };

  const currentPhoto = activePhotoIdx !== null ? gallery.photos[activePhotoIdx] : null;

  return (
    <div className="fixed inset-0 z-50 bg-[#0F172A] text-white flex flex-col overflow-y-auto">
      
      {/* Top Floating Guest Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">🏡</span>
          <div>
            <h1 className="text-sm sm:text-base font-black tracking-tight text-white flex items-center gap-2">
              <span>Miller Family Memories</span>
              <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Guest View
              </span>
            </h1>
            <p className="text-xs text-slate-400 truncate max-w-xs sm:max-w-md">
              {gallery.title}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-black transition-colors"
        >
          <X className="w-4 h-4" />
          <span>Exit Guest View</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        
        {/* Album Hero Header */}
        <div className="relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-900">
          <div className="h-48 sm:h-72 w-full overflow-hidden relative">
            <img
              src={gallery.coverPhotoUrl}
              alt={gallery.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
          </div>

          <div className="absolute bottom-0 inset-x-0 p-5 sm:p-8 space-y-2">
            <div className="flex items-center gap-2 text-xs font-extrabold text-amber-400">
              <Calendar className="w-3.5 h-3.5" />
              <span>{gallery.date}</span>
              <span>•</span>
              <span>📸 {gallery.photos.length} shared photos</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight">
              {gallery.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              {gallery.description}
            </p>
          </div>
        </div>

        {/* Photos Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <span>All Moments ({gallery.photos.length})</span>
            </h3>
            <span className="text-xs text-slate-400 font-bold">
              Tap any photo to expand full screen
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {gallery.photos.map((photo, idx) => {
              const uploader = members.find((m) => m.id === photo.uploadedByMemberId);
              return (
                <div
                  key={photo.id}
                  onClick={() => setActivePhotoIdx(idx)}
                  className="cursor-pointer group rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-indigo-500/80 transition-all hover:scale-[1.02] flex flex-col justify-between shadow-md"
                >
                  <div className="relative aspect-4/3 overflow-hidden bg-slate-950">
                    <img
                      src={photo.imageUrl}
                      alt={photo.caption || 'Family photo'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                      <span className="text-xs text-white font-bold">Click to view in full resolution</span>
                    </div>
                  </div>

                  <div className="p-3.5 space-y-2">
                    {photo.caption && (
                      <p className="text-xs text-slate-200 font-medium leading-relaxed">
                        {photo.caption}
                      </p>
                    )}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px] text-slate-400">
                      {uploader && (
                        <span className="flex items-center gap-1.5 font-bold">
                          <span>{uploader.avatar}</span>
                          <span>{uploader.name}</span>
                        </span>
                      )}
                      <span>{photo.uploadedAt}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Guest Guestbook & Love Notes for the Family */}
        <section className="rounded-3xl bg-slate-900/90 border-2 border-slate-800 p-5 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <span>💬 Send Love Note to the Family</span>
                <span className="text-amber-400">❤️</span>
              </h3>
              <p className="text-xs text-slate-400">
                Grandma, Grandpa or relatives can leave warm cheers and reactions right here!
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSendReaction} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
              <input
                type="text"
                placeholder="Your Name (e.g. Grandma Elena, Uncle Marc)..."
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
              />
              <div className="sm:col-span-2 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Write a sweet message to the family..."
                  value={guestMessage}
                  onChange={(e) => setGuestMessage(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
                  required
                />
                <button
                  type="submit"
                  className="duo-btn duo-btn-green px-4 py-2.5 text-xs font-black rounded-xl shrink-0 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </div>
            </div>

            {/* Quick Emoji selection */}
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-xs text-slate-400 font-bold mr-1">Reaction:</span>
              {EMOJI_OPTIONS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setSelectedEmoji(em)}
                  className={`text-lg p-1.5 rounded-xl transition-all ${
                    selectedEmoji === em
                      ? 'bg-indigo-600/40 border border-indigo-400 scale-110'
                      : 'hover:bg-slate-800 border border-transparent'
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>

            {reactionSent && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-xs font-black text-emerald-300 flex items-center gap-2 animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Thank you! Your note has been delivered to the family album.</span>
              </div>
            )}
          </form>

          {/* List of received messages */}
          {gallery.guestReactions && gallery.guestReactions.length > 0 && (
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                Notes from Loved Ones ({gallery.guestReactions.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {gallery.guestReactions.map((reac) => (
                  <div
                    key={reac.id}
                    className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800 flex items-start gap-3"
                  >
                    <span className="text-2xl shrink-0">{reac.emoji}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <strong className="text-xs font-black text-white">{reac.author}</strong>
                        <span className="text-[10px] text-slate-500">{reac.timestamp}</span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 font-medium leading-relaxed">
                        "{reac.message}"
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </section>

      </main>

      {/* Fullscreen Lightbox Carousel */}
      {currentPhoto && activePhotoIdx !== null && (
        <div className="fixed inset-0 z-60 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 animate-in fade-in">
          
          {/* Lightbox Top bar */}
          <div className="flex items-center justify-between text-white pb-2">
            <span className="text-xs font-bold text-slate-400">
              {activePhotoIdx + 1} / {gallery.photos.length}
            </span>
            <button
              onClick={() => setActivePhotoIdx(null)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Lightbox Center Image & Controls */}
          <div className="flex-1 flex items-center justify-between gap-4 max-h-[80vh] my-auto relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActivePhotoIdx((prev) =>
                  prev !== null && prev > 0 ? prev - 1 : gallery.photos.length - 1
                );
              }}
              className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-xs transition-transform active:scale-90"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <img
              src={currentPhoto.imageUrl}
              alt={currentPhoto.caption || 'Expanded memory'}
              className="max-h-[75vh] max-w-full object-contain rounded-2xl shadow-2xl mx-auto"
            />

            <button
              onClick={(e) => {
                e.stopPropagation();
                setActivePhotoIdx((prev) =>
                  prev !== null && prev < gallery.photos.length - 1 ? prev + 1 : 0
                );
              }}
              className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-xs transition-transform active:scale-90"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Lightbox Caption bottom */}
          <div className="text-center pt-3 pb-2 max-w-lg mx-auto">
            {currentPhoto.caption && (
              <p className="text-sm text-slate-200 font-semibold">{currentPhoto.caption}</p>
            )}
            <p className="text-xs text-slate-500 mt-1">
              Captured on {currentPhoto.uploadedAt}
            </p>
          </div>
        </div>
      )}

    </div>
  );
};
