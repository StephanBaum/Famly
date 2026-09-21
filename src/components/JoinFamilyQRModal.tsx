import React, { useState } from 'react';
import { ModalPortal } from './ModalPortal';
import { useFamily } from '../context/FamilyContext';
import { QRCodeImage } from './QRCodeImage';
import { X, Copy, Check, Sparkles, Share2 } from 'lucide-react';

interface JoinFamilyQRModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const JoinFamilyQRModal: React.FC<JoinFamilyQRModalProps> = ({ isOpen, onClose }) => {
  const { familyName } = useFamily();
  const [copied, setCopied] = useState(false);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const joinUrl = `${origin}/#join-family=${encodeURIComponent(familyName || 'family')}`;

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Famly • Tritt Familie ${familyName || ''} bei!`,
          text: `Hier ist der Einladungslink für unseren Familien-Hub:`,
          url: joinUrl,
        });
      } catch {
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
        <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border-2 border-stone-200 dark:border-slate-800 my-auto space-y-5 text-stone-900 dark:text-slate-100 overflow-hidden animate-in zoom-in-95">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center text-xl font-black shadow-xs">
                📲
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-stone-900 dark:text-white leading-tight">
                  Familie beitreten & Gerät verbinden
                </h3>
                <p className="text-xs font-semibold text-stone-500 dark:text-slate-400">
                  {familyName ? `Familie ${familyName}` : 'Familien-Hub'} auf weiteren Geräten öffnen
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

          {/* QR Code Card */}
          <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 rounded-3xl border-2 border-amber-200/80 dark:border-amber-800/40 text-center space-y-3">
            <QRCodeImage
              value={joinUrl}
              size={220}
              className="border-2 border-amber-300 dark:border-amber-600 shadow-md"
            />

            <div className="flex items-center gap-1.5 text-xs font-black text-amber-900 dark:text-amber-300">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Mit Smartphone-Kamera scannen</span>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-2 text-xs">
            <div className="flex items-start gap-2.5 p-2.5 rounded-2xl bg-stone-50 dark:bg-slate-800/50 border border-stone-200/70 dark:border-slate-700">
              <span className="w-5 h-5 rounded-full bg-amber-400 text-stone-900 font-black flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                1
              </span>
              <span className="text-stone-700 dark:text-slate-300 font-medium">
                Öffne die Kamera auf dem zweiten Smartphone oder Tablet.
              </span>
            </div>

            <div className="flex items-start gap-2.5 p-2.5 rounded-2xl bg-stone-50 dark:bg-slate-800/50 border border-stone-200/70 dark:border-slate-700">
              <span className="w-5 h-5 rounded-full bg-amber-400 text-stone-900 font-black flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                2
              </span>
              <span className="text-stone-700 dark:text-slate-300 font-medium">
                Tippe auf den erkannten Link – die Famly-App synchronisiert sich sofort vollautomatisch via Cloud!
              </span>
            </div>
          </div>

          {/* Shareable Link Box & Action Buttons */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className={`duo-btn flex-1 py-3 px-4 text-xs font-black rounded-2xl flex items-center justify-center gap-2 transition-all ${
                  copied ? 'duo-btn-green' : 'duo-btn-white text-stone-800 dark:text-slate-200'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Link in Zwischenablage kopiert!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 stroke-[2.5]" />
                    <span>Einladungs-Link kopieren</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleNativeShare}
                className="duo-btn duo-btn-amber py-3 px-4 text-xs font-black rounded-2xl flex items-center justify-center gap-1.5 shrink-0"
                title="Per WhatsApp, Signal etc. teilen"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Teilen</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
