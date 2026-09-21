import React from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Download, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface CalendarHeaderProps {
  currentDate: Date;
  viewMode: 'month' | 'agenda';
  setViewMode: (mode: 'month' | 'agenda') => void;
  onPrevPeriod: () => void;
  onNextPeriod: () => void;
  onGoToToday: () => void;
  onExportICal: () => void;
  onOpenAddAppointment: () => void;
  onOpenAddChore: () => void;
  appointmentCount: number;
  choreCount: number;
  selectedCategory: string;
  icalExportToast: string | null;
  onDismissToast: () => void;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentDate,
  viewMode,
  setViewMode,
  onPrevPeriod,
  onNextPeriod,
  onGoToToday,
  onExportICal,
  onOpenAddAppointment,
  onOpenAddChore,
  appointmentCount,
  choreCount,
  selectedCategory,
  icalExportToast,
  onDismissToast,
}) => {
  return (
    <div className="space-y-3">
      {/* iCal Export Toast */}
      {icalExportToast && (
        <div className="p-4 rounded-2xl bg-blue-600 text-white font-bold text-xs sm:text-sm shadow-lg flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <span>{icalExportToast}</span>
          <button
            onClick={onDismissToast}
            className="px-2.5 py-1 rounded-lg bg-blue-700 hover:bg-blue-800 text-xs font-black"
          >
            OK
          </button>
        </div>
      )}

      {/* Main Top Header Card */}
      <div className="duo-card flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 bg-white dark:bg-slate-900 p-3.5 sm:p-5 border-2 border-stone-200 dark:border-slate-800">
        {/* Navigation title & Quick Add */}
        <div className="flex items-center justify-between sm:justify-start gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold shrink-0">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h2 className="text-base sm:text-xl font-black text-stone-900 dark:text-white capitalize">
                  {format(currentDate, 'MMMM yyyy', { locale: de })}
                </h2>
                <button
                  onClick={onGoToToday}
                  className="px-2 py-0.5 text-[11px] sm:text-xs font-bold rounded-lg bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-200 transition-colors"
                >
                  Heute
                </button>
              </div>
              <p className="text-[11px] sm:text-xs font-semibold text-stone-500 dark:text-slate-400">
                {selectedCategory === 'chores_only'
                  ? `${choreCount} Aufgaben`
                  : `${appointmentCount} Termine${
                      selectedCategory === 'all' ? ` • ${choreCount} Aufgaben` : ''
                    }`}
              </p>
            </div>
          </div>

          {/* Quick Add on mobile right top */}
          <div className="flex items-center gap-1.5 sm:hidden shrink-0">
            <button
              onClick={onExportICal}
              className="p-2 text-stone-600 dark:text-slate-300 bg-stone-100 dark:bg-slate-800 rounded-xl hover:bg-stone-200"
              title="iCal Export"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenAddChore}
              className="duo-btn duo-btn-amber px-2.5 py-1.5 text-xs font-black rounded-xl shadow-xs flex items-center gap-1 whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5 stroke-[3]" />
              <span>Aufgabe</span>
            </button>
            <button
              onClick={onOpenAddAppointment}
              className="duo-btn duo-btn-blue px-2.5 py-1.5 text-xs font-black rounded-xl shadow-xs flex items-center gap-1 whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Termin</span>
            </button>
          </div>
        </div>

        {/* Date controls & View toggles */}
        <div className="flex items-center justify-between sm:justify-end flex-wrap gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100 dark:border-slate-800">
          {/* Previous / Next */}
          <div className="flex items-center bg-stone-100 dark:bg-slate-800 p-1 rounded-xl border border-stone-200/60 dark:border-slate-700">
            <button
              onClick={onPrevPeriod}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-stone-700 dark:text-slate-200 transition-colors"
              title="Vorheriger Zeitraum"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={onNextPeriod}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-stone-700 dark:text-slate-200 transition-colors"
              title="Nächster Zeitraum"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-stone-100 dark:bg-slate-800 p-1 rounded-xl border border-stone-200/60 dark:border-slate-700">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'month'
                  ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs'
                  : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <span className="sm:hidden">Kalender</span>
              <span className="hidden sm:inline">Monatsansicht</span>
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'agenda'
                  ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs'
                  : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              Terminliste
            </button>
          </div>

          {/* Add appointment & chore buttons (desktop) */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={onExportICal}
              className="duo-btn duo-btn-white px-3 py-2 text-xs font-black rounded-xl shadow-xs flex items-center whitespace-nowrap text-stone-700 dark:text-slate-200 border border-stone-200 dark:border-slate-700 hover:bg-stone-100 dark:hover:bg-slate-800"
              title="Kalender im iCal (.ics) Format herunterladen"
            >
              <Download className="w-4 h-4 mr-1.5 stroke-[2.5]" />
              <span>iCal (.ics)</span>
            </button>
            <button
              onClick={onOpenAddChore}
              className="duo-btn duo-btn-amber px-3 py-2 text-xs font-black rounded-xl shadow-xs flex items-center whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4 mr-1 stroke-[3]" />
              <span>+ Aufgabe</span>
            </button>
            <button
              onClick={onOpenAddAppointment}
              className="duo-btn duo-btn-blue px-3.5 py-2 text-xs font-black rounded-xl shadow-xs flex items-center whitespace-nowrap"
            >
              <Plus className="w-4 h-4 mr-1 stroke-[3]" />
              <span>+ Termin</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
