import React, { useState } from 'react';
import { Appointment } from '../../types';
import { claimCarpoolSeat } from '../../services/carpoolService';
import confetti from 'canvas-confetti';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Car,
  AlertCircle,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface GuestCarpoolViewerProps {
  appointment: Appointment;
  familyName?: string;
  onUpdateAppointment: (updated: Appointment) => void;
  onClose: () => void;
}

export const GuestCarpoolViewer: React.FC<GuestCarpoolViewerProps> = ({
  appointment,
  familyName = 'Baum',
  onUpdateAppointment,
  onClose,
}) => {
  const [childName, setChildName] = useState('');
  const [parentName, setParentName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const carpool = appointment.carpool;
  const totalSeats = carpool?.totalSeats || 3;
  const riders = carpool?.riders || [];
  const openSeats = Math.max(0, totalSeats - riders.length);
  const isFull = openSeats === 0;

  let formattedDate = appointment.date;
  try {
    formattedDate = format(new Date(appointment.date + 'T00:00:00'), 'EEEE, d. MMMM', { locale: de });
  } catch {}

  const handleClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (!childName.trim()) {
      setErrorMessage('Bitte gib den Namen deines Kindes ein.');
      return;
    }

    const res = claimCarpoolSeat(appointment, {
      childName: childName.trim(),
      parentName: parentName.trim() || undefined,
      phone: phone.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    if (res.error) {
      setErrorMessage(res.error);
      return;
    }

    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#3B82F6', '#10B981', '#F59E0B'],
    });

    onUpdateAppointment(res.updatedAppointment);
    setIsSuccess(true);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] dark:bg-[#0c1222] text-stone-900 dark:text-white flex flex-col justify-center items-center p-4 sm:p-6 select-none animate-in fade-in duration-300">
      
      {/* Container Card */}
      <div className="max-w-lg w-full bg-white dark:bg-slate-900 rounded-3xl border-3 border-stone-200 dark:border-slate-800 shadow-2xl p-5 sm:p-8 space-y-6 relative overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-2xl bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 text-stone-500 dark:text-slate-400 flex items-center justify-center transition-colors"
          title="Schließen"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header Badge */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-500 text-white flex items-center justify-center text-2xl shadow-md">
            🚗
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
              <span>Fahrgemeinschaft</span>
              <span>•</span>
              <span>Familie {familyName}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-0.5">
              {appointment.title}
            </h2>
          </div>
        </div>

        {/* Ride Details Card */}
        <div className="bg-stone-50 dark:bg-slate-800/60 border-2 border-stone-200 dark:border-slate-700/80 rounded-2xl p-4 space-y-2.5 text-xs font-semibold">
          <div className="flex items-center gap-2 text-stone-700 dark:text-slate-300">
            <Calendar className="w-4 h-4 text-blue-500 shrink-0" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center gap-2 text-stone-700 dark:text-slate-300">
            <Clock className="w-4 h-4 text-blue-500 shrink-0" />
            <span>Abfahrt: <strong>{appointment.time} Uhr</strong></span>
          </div>
          {appointment.location && (
            <div className="flex items-center gap-2 text-stone-700 dark:text-slate-300">
              <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
              <span>Ziel: <strong>{appointment.location}</strong></span>
            </div>
          )}
          {carpool?.meetingPoint && (
            <div className="flex items-center gap-2 text-stone-700 dark:text-slate-300">
              <Car className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Treffpunkt: <strong>{carpool.meetingPoint}</strong></span>
            </div>
          )}
          <div className="pt-2 border-t border-stone-200 dark:border-slate-700 text-stone-500">
            Fahrer: <strong>{carpool?.driverName || 'Eltern'}</strong>
          </div>
        </div>

        {/* Seat Availability Visual Tracker */}
        <div>
          <div className="flex items-center justify-between text-xs font-black mb-2">
            <span className="text-stone-700 dark:text-slate-300">Plätze im Auto:</span>
            <span className={openSeats > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}>
              {openSeats > 0 ? `${openSeats} von ${totalSeats} frei` : 'Voll besetzt'}
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {Array.from({ length: totalSeats }).map((_, idx) => {
              const rider = riders[idx];
              return (
                <div
                  key={idx}
                  className={`p-2.5 rounded-2xl border-2 text-center flex flex-col items-center justify-center min-h-[64px] transition-all ${
                    rider
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-400 text-blue-900 dark:text-blue-200 shadow-2xs'
                      : 'bg-stone-50 dark:bg-slate-800/40 border-dashed border-stone-300 dark:border-slate-700 text-stone-400'
                  }`}
                >
                  <span className="text-base">{rider ? '🧒' : '💺'}</span>
                  <span className="text-[11px] font-black truncate max-w-full mt-0.5">
                    {rider ? rider.childName : 'Frei'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form or Success State */}
        {isSuccess ? (
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-400 rounded-3xl p-6 text-center space-y-3 animate-in zoom-in-95">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h3 className="text-lg font-black text-emerald-950 dark:text-emerald-200">
              Platz erfolgreich reserviert! 🎉
            </h3>
            <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              <strong>{childName}</strong> fährt mit {carpool?.driverName || 'den Eltern'}. Familie {familyName} wurde benachrichtigt!
            </p>
            <button
              onClick={onClose}
              className="duo-btn duo-btn-green px-5 py-2.5 rounded-2xl text-xs font-black mt-2"
            >
              Fertig
            </button>
          </div>
        ) : isFull ? (
          <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-center">
            <p className="text-xs font-black text-amber-900 dark:text-amber-200">
              Alle Plätze für diese Fahrt sind bereits reserviert.
            </p>
          </div>
        ) : (
          <form onSubmit={handleClaim} className="space-y-3 pt-2">
            <div>
              <label className="block text-[11px] font-black uppercase text-stone-500 dark:text-slate-400 mb-1">
                Name deines Kindes *
              </label>
              <input
                type="text"
                required
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                placeholder="z.B. Emma"
                className="w-full px-3.5 py-2.5 rounded-2xl border-2 border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-black uppercase text-stone-500 dark:text-slate-400 mb-1">
                  Dein Name (Elternteil)
                </label>
                <input
                  type="text"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  placeholder="z.B. Sarah"
                  className="w-full px-3.5 py-2.5 rounded-2xl border-2 border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-stone-500 dark:text-slate-400 mb-1">
                  Handynummer (für Notfälle)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0171 1234567"
                  className="w-full px-3.5 py-2.5 rounded-2xl border-2 border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase text-stone-500 dark:text-slate-400 mb-1">
                Hinweis für den Fahrer (z.B. Kindersitz vorhanden)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="z.B. Sitzerhöhung ist im Auto"
                className="w-full px-3.5 py-2.5 rounded-2xl border-2 border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <button
              type="submit"
              className="w-full duo-btn duo-btn-blue py-3 rounded-2xl text-sm font-black flex items-center justify-center gap-2 mt-2 shadow-md active:scale-98 transition-all"
            >
              <span>Kind anmelden & Platz reservieren 🚗</span>
            </button>
            <p className="text-[11px] text-center text-stone-400 font-semibold">
              Kostenlos • Keine Registrierung oder App nötig
            </p>
          </form>
        )}

      </div>
    </div>
  );
};
