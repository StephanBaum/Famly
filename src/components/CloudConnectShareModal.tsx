import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { ModalPortal } from './ModalPortal';
import { X, Copy, Check, QrCode, Smartphone, Cloud } from 'lucide-react';
import { generateCloudConnectUrl, getSupabaseConfig } from '../services/supabase';

interface CloudConnectShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CloudConnectShareModal: React.FC<CloudConnectShareModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [connectUrl, setConnectUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const url = generateCloudConnectUrl();
      setConnectUrl(url);

      if (url) {
        QRCode.toDataURL(url, {
          width: 320,
          margin: 2,
          color: {
            dark: '#1E293B',
            light: '#FFFFFF',
          },
        })
          .then((dataUri) => setQrDataUrl(dataUri))
          .catch((err) => console.error('Failed to generate QR code:', err));
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const cfg = getSupabaseConfig();

  const handleCopyLink = () => {
    if (!connectUrl) return;
    navigator.clipboard.writeText(connectUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
        <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border-2 border-stone-200 dark:border-slate-800 animate-in zoom-in-95 space-y-5 text-stone-900 dark:text-slate-100 my-auto">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shadow-xs">
                <QrCode className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  Cloud-Zugang teilen
                </h3>
                <p className="text-xs text-stone-500 dark:text-slate-400 font-semibold">
                  Mit Partner oder Kindern in 3 Sekunden verbinden
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 text-stone-500 dark:text-slate-400 flex items-center justify-center font-black transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* QR Code Container */}
          <div className="flex flex-col items-center justify-center p-4 bg-stone-50 dark:bg-slate-800/60 rounded-2xl border border-stone-200 dark:border-slate-700 space-y-3 text-center">
            {qrDataUrl ? (
              <div className="p-3 bg-white rounded-2xl shadow-md border-2 border-stone-200 dark:border-slate-700">
                <img
                  src={qrDataUrl}
                  alt="Cloud Connect QR Code"
                  className="w-48 h-48 sm:w-56 sm:h-56 rounded-xl object-contain"
                />
              </div>
            ) : (
              <div className="w-48 h-48 rounded-xl bg-stone-200 animate-pulse flex items-center justify-center text-xs font-bold text-stone-500">
                QR-Code wird erstellt...
              </div>
            )}

            <div className="space-y-1 max-w-xs">
              <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-700 dark:text-emerald-400">
                <Smartphone className="w-3.5 h-3.5" />
                Mit Smartphone-Kamera scannen
              </span>
              <p className="text-[11px] text-stone-500 dark:text-slate-400 font-medium">
                Das zweite Smartphone öffnet Famly und übernimmt die Cloud-Zugangsdaten automatisch. Kein Abtippen nötig!
              </p>
            </div>
          </div>

          {/* Quick Copy Link Option */}
          <div className="space-y-2">
            <span className="block text-xs font-black uppercase text-stone-500 dark:text-slate-400 tracking-wider">
              Oder Einladungs-Link senden
            </span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={connectUrl}
                className="flex-1 px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 text-xs text-stone-600 dark:text-slate-300 font-mono truncate focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="duo-btn duo-btn-green px-3.5 py-2 text-xs font-black rounded-xl shrink-0 flex items-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Kopiert!' : 'Kopieren'}</span>
              </button>
            </div>
            <p className="text-[10px] text-stone-400 dark:text-slate-500 font-semibold">
              Per WhatsApp, Signal, E-Mail oder AirDrop an Familienmitglieder senden.
            </p>
          </div>

          {/* Connected Project Info */}
          <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/40 text-[11px] space-y-1 text-emerald-900 dark:text-emerald-200">
            <div className="flex items-center gap-1.5 font-bold">
              <Cloud className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Verbundene Datenbank:</span>
            </div>
            <p className="font-mono text-[10px] truncate text-emerald-800 dark:text-emerald-300">
              {cfg.url}
            </p>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2 rounded-xl text-xs font-black bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-300 transition-colors"
            >
              Schließen
            </button>
          </div>

        </div>
      </div>
    </ModalPortal>
  );
};
