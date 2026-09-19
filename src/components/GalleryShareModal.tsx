import React, { useState } from 'react';
import { GalleryAlbum } from '../types';
import { ModalPortal } from './ModalPortal';
import {
  X,
  Copy,
  Check,
  QrCode,
  Globe,
  ExternalLink,
  Lock,
} from 'lucide-react';

interface GalleryShareModalProps {
  gallery: GalleryAlbum | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenGuestPreview: (gallery: GalleryAlbum) => void;
  onToggleShare: (galleryId: string, isShared: boolean) => void;
}

export const GalleryShareModal: React.FC<GalleryShareModalProps> = ({
  gallery,
  isOpen,
  onClose,
  onOpenGuestPreview,
  onToggleShare,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !gallery) return null;

  // Build the relative/guest link
  const origin = window.location.origin;
  const guestUrl = `${origin}/#guest-gallery=${gallery.id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(guestUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!isOpen || !gallery) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border-2 border-stone-200 dark:border-slate-800 animate-in fade-in zoom-in-95 my-auto space-y-5 text-stone-900 dark:text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 flex items-center justify-center text-xl font-black shadow-xs">
              💌
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-stone-900 dark:text-white leading-tight">
                Mit Verwandten teilen
              </h3>
              <p className="text-xs font-semibold text-stone-500 dark:text-slate-400">
                Oma, Opa & Verwandte können Fotos ohne Login ansehen
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

        {/* Gallery Summary Pill */}
        <div className="p-3 bg-stone-50 dark:bg-slate-800/60 rounded-2xl border border-stone-200 dark:border-slate-700 flex items-center gap-3">
          <img
            src={gallery.coverPhotoUrl}
            alt={gallery.title}
            className="w-14 h-14 rounded-xl object-cover shrink-0 shadow-2xs border border-stone-200 dark:border-slate-700"
          />
          <div className="min-w-0 flex-1">
            <h4 className="text-xs sm:text-sm font-black text-stone-900 dark:text-white truncate">
              {gallery.title}
            </h4>
            <p className="text-[11px] text-stone-500 dark:text-slate-400 font-bold mt-0.5">
              📸 {gallery.photos.length} Fotos in diesem Album
            </p>
            <div className="flex items-center gap-2 mt-1">
              <button
                type="button"
                onClick={() => onToggleShare(gallery.id, !gallery.isPublicShared)}
                className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                  gallery.isPublicShared
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200'
                    : 'bg-stone-200 dark:bg-slate-700 text-stone-700 dark:text-slate-300 hover:bg-stone-300'
                }`}
              >
                {gallery.isPublicShared ? '✓ Freigabe-Link aktiv' : <><Lock className="w-3 h-3 inline" /> Freigabe pausiert</>}
              </button>
            </div>
          </div>
        </div>

        {/* Shareable Link Box */}
        <div className="space-y-2">
          <label className="block text-xs font-extrabold text-stone-700 dark:text-slate-300 uppercase tracking-wide">
            Gast-Link (Kein Login erforderlich)
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 px-3 py-2.5 bg-stone-100 dark:bg-slate-800 rounded-xl text-xs font-mono text-stone-700 dark:text-slate-300 truncate border border-stone-200 dark:border-slate-700 select-all">
              {guestUrl}
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className={`duo-btn px-4 py-2.5 text-xs font-black rounded-xl shrink-0 transition-all ${
                copied ? 'duo-btn-green' : 'duo-btn-blue'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-1 stroke-[3]" />
                  <span>Kopiert!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-1 stroke-[2.5]" />
                  <span>Link kopieren</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Simulated QR Code for phone scan */}
        <div className="bg-gradient-to-br from-indigo-50/70 to-purple-50/70 dark:from-indigo-950/40 dark:to-purple-950/40 p-4 rounded-2xl border-2 border-indigo-100 dark:border-indigo-900/50 flex items-center gap-4">
          <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-2xl p-2 border-2 border-indigo-200 dark:border-indigo-700 shadow-xs flex flex-col items-center justify-center shrink-0">
            <QrCode className="w-14 h-14 text-indigo-900 dark:text-indigo-400" />
            <span className="text-[8px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase">Scannen</span>
          </div>
          <div>
            <h5 className="text-xs font-black text-indigo-950 dark:text-indigo-200">Verwandten direkt vor Ort zeigen</h5>
            <p className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 leading-relaxed mt-0.5">
              Oma oder Besucher können einfach ihre Smartphone-Kamera auf den QR-Code richten, um das Album sofort auf ihrem Bildschirm zu öffnen.
            </p>
          </div>
        </div>

        {/* Preview Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-stone-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenGuestPreview(gallery);
            }}
            className="w-full sm:w-auto duo-btn duo-btn-white px-4 py-2.5 text-xs font-black rounded-xl flex items-center justify-center gap-1.5 text-stone-800 dark:text-slate-200"
          >
            <Globe className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Gast-Ansicht für Verwandte testen</span>
            <ExternalLink className="w-3.5 h-3.5 ml-0.5 opacity-60" />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-extrabold bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-300"
          >
            Fertig
          </button>
        </div>

      </div>
    </div>
    </ModalPortal>
  );
};
