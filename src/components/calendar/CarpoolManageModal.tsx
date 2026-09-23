import React, { useState } from 'react';
import { Appointment, FamilyMember } from '../../types';
import { ModalPortal } from '../ModalPortal';
import { configureCarpool, buildCarpoolShareDetails, removeCarpoolRider } from '../../services/carpoolService';
import {
  X,
  Trash2,
  Check,
  MessageCircle,
  Copy,
} from 'lucide-react';

interface CarpoolManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  members: FamilyMember[];
  familyName?: string;
  onSave: (updated: Appointment) => void;
}

export const CarpoolManageModal: React.FC<CarpoolManageModalProps> = ({
  isOpen,
  onClose,
  appointment,
  members,
  familyName = 'Baum',
  onSave,
}) => {
  if (!isOpen || !appointment) return null;

  const initialCarpool = appointment.carpool;
  const adultMembers = members.filter((m) => !m.isChild);

  const [enabled, setEnabled] = useState(initialCarpool?.enabled ?? true);
  const [driverName, setDriverName] = useState(initialCarpool?.driverName || adultMembers[0]?.name || 'Papa');
  const [totalSeats, setTotalSeats] = useState(initialCarpool?.totalSeats || 3);
  const [meetingPoint, setMeetingPoint] = useState(initialCarpool?.meetingPoint || '');
  const [copiedToast, setCopiedToast] = useState(false);

  const riders = initialCarpool?.riders || [];

  const handleSave = () => {
    const updated = configureCarpool(appointment, {
      enabled,
      driverName,
      totalSeats,
      meetingPoint: meetingPoint.trim() || undefined,
    });
    onSave(updated);
    onClose();
  };

  const handleRemoveRider = (riderId: string) => {
    const updated = removeCarpoolRider(appointment, riderId);
    onSave(updated);
  };

  const shareDetails = buildCarpoolShareDetails(
    {
      ...appointment,
      carpool: {
        enabled,
        driverName,
        totalSeats,
        riders,
        shareCode: initialCarpool?.shareCode || appointment.id,
        meetingPoint,
      },
    },
    familyName
  );

  const handleCopyLink = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(shareDetails.shareUrl);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2500);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in overflow-y-auto">
        <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border-2 border-stone-200 dark:border-slate-800 shadow-2xl p-5 sm:p-6 space-y-5 animate-in zoom-in-95 my-auto">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500 text-white flex items-center justify-center text-xl shadow-xs">
                🚗
              </div>
              <div>
                <h3 className="text-base font-black text-stone-900 dark:text-white">
                  Fahrgemeinschaft verwalten
                </h3>
                <p className="text-xs text-stone-400 truncate max-w-[240px]">
                  {appointment.title}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 text-stone-500 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Toggle Enabled */}
          <div className="flex items-center justify-between p-3.5 bg-stone-50 dark:bg-slate-800/60 border border-stone-200 dark:border-slate-700 rounded-2xl">
            <div>
              <h4 className="text-xs font-black text-stone-900 dark:text-white">
                Mitfahrgelegenheit anbieten
              </h4>
              <p className="text-[11px] text-stone-400">
                Anderen Eltern erlauben, Plätze für diese Fahrt zu reservieren
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEnabled(!enabled)}
              className={`w-12 h-7 rounded-full p-1 transition-colors ${
                enabled ? 'bg-blue-500' : 'bg-stone-300 dark:bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {enabled && (
            <div className="space-y-4 animate-in fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Driver */}
                <div>
                  <label className="block text-[11px] font-black uppercase text-stone-500 dark:text-slate-400 mb-1">
                    Fahrer
                  </label>
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="z.B. Papa"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                  />
                </div>

                {/* Total Seats */}
                <div>
                  <label className="block text-[11px] font-black uppercase text-stone-500 dark:text-slate-400 mb-1">
                    Freie Plätze im Auto
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5, 6].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setTotalSeats(num)}
                        className={`flex-1 py-1.5 rounded-xl border text-xs font-black transition-all ${
                          totalSeats === num
                            ? 'bg-blue-500 text-white border-blue-600 shadow-2xs'
                            : 'bg-white dark:bg-slate-900 border-stone-200 dark:border-slate-700 text-stone-700 dark:text-slate-300'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Meeting Point */}
              <div>
                <label className="block text-[11px] font-black uppercase text-stone-500 dark:text-slate-400 mb-1">
                  Treffpunkt (optional)
                </label>
                <input
                  type="text"
                  value={meetingPoint}
                  onChange={(e) => setMeetingPoint(e.target.value)}
                  placeholder="z.B. Schulparkplatz oder zu Hause"
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                />
              </div>

              {/* Current Riders List */}
              <div className="p-3 bg-stone-50 dark:bg-slate-800/60 border border-stone-200 dark:border-slate-700 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs font-black">
                  <span className="text-stone-700 dark:text-slate-300">
                    Angemeldete Kinder ({riders.length} / {totalSeats})
                  </span>
                  <span className="text-blue-600 dark:text-blue-400 font-bold">
                    {Math.max(0, totalSeats - riders.length)} Plätze frei
                  </span>
                </div>

                {riders.length === 0 ? (
                  <p className="text-xs text-stone-400 italic py-1">
                    Noch keine Kinder angemeldet. Teile den Link mit anderen Eltern!
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {riders.map((rider) => (
                      <div
                        key={rider.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span>🧒</span>
                          <div>
                            <span className="font-black text-stone-900 dark:text-white">
                              {rider.childName}
                            </span>
                            {rider.parentName && (
                              <span className="text-stone-400 text-[11px] ml-1.5">
                                (Eltern: {rider.parentName} {rider.phone ? `• ${rider.phone}` : ''})
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveRider(rider.id)}
                          className="p-1 text-stone-400 hover:text-rose-500 transition-colors"
                          title="Platz freigeben"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Share Actions (WhatsApp & Copy Link) */}
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-2xl space-y-2">
                <span className="text-[11px] font-black uppercase text-blue-800 dark:text-blue-300 block">
                  Mit anderen Eltern teilen (Zero-Login Link)
                </span>
                
                <div className="flex gap-2">
                  <a
                    href={shareDetails.whatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 duo-btn px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <MessageCircle className="w-4 h-4 fill-white" />
                    <span>WhatsApp</span>
                  </a>

                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex-1 duo-btn duo-btn-white px-3 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    {copiedToast ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-500" />
                        <span>Kopiert!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Link kopieren</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-stone-500 hover:text-stone-800"
            >
              Abbrechen
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="duo-btn duo-btn-blue px-5 py-2 text-xs font-black rounded-xl shadow-xs"
            >
              Speichern
            </button>
          </div>

        </div>
      </div>
    </ModalPortal>
  );
};
