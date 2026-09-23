import React, { useState } from 'react';
import { ModalPortal } from '../ModalPortal';
import { CALENDAR_STICKERS, STICKER_CATEGORIES, CalendarSticker } from './calendarConstants';
import { Sparkles, X, Search } from 'lucide-react';

interface StickerPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSticker?: string;
  onSelectSticker: (stickerEmoji: string) => void;
}

export const StickerPickerModal: React.FC<StickerPickerModalProps> = ({
  isOpen,
  onClose,
  selectedSticker,
  onSelectSticker,
}) => {
  const [activeCategory, setActiveCategory] = useState<CalendarSticker['category'] | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredStickers = CALENDAR_STICKERS.filter((s) => {
    const matchesCategory = activeCategory === 'all' || s.category === activeCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      s.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.emoji.includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
        <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border-2 border-stone-200 dark:border-slate-800 flex flex-col max-h-[85vh] overflow-hidden">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-stone-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 flex items-center justify-center text-lg">
                <Sparkles className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="text-base font-black text-stone-900 dark:text-white">
                  Kalender-Sticker auswählen
                </h3>
                <p className="text-xs text-stone-500 dark:text-slate-400">
                  Visuelle Icons für Termine & Routinen
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-slate-800 text-stone-400 hover:text-stone-700 dark:hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search bar */}
          <div className="p-3 px-4 border-b border-stone-100 dark:border-slate-800 bg-stone-50/50 dark:bg-slate-800/40">
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Sticker suchen (z.B. Fußball, Zahnarzt, Klavier)..."
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-1.5 p-2 px-4 overflow-x-auto scrollbar-none border-b border-stone-100 dark:border-slate-800 bg-stone-50/80 dark:bg-slate-800/60 shrink-0">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1 rounded-xl text-xs font-black transition-all shrink-0 ${
                activeCategory === 'all'
                  ? 'bg-amber-400 text-stone-950 shadow-2xs'
                  : 'text-stone-600 dark:text-slate-300 hover:bg-stone-200 dark:hover:bg-slate-700'
              }`}
            >
              ✨ Alle
            </button>
            {STICKER_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shrink-0 ${
                  activeCategory === cat.id
                    ? 'bg-amber-400 text-stone-950 shadow-2xs'
                    : 'text-stone-600 dark:text-slate-300 hover:bg-stone-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Stickers Grid */}
          <div className="p-4 overflow-y-auto flex-1 grid grid-cols-4 sm:grid-cols-6 gap-2.5">
            {filteredStickers.map((sticker) => {
              const isSelected = selectedSticker === sticker.emoji;
              return (
                <button
                  key={sticker.id}
                  type="button"
                  onClick={() => {
                    onSelectSticker(sticker.emoji);
                    onClose();
                  }}
                  className={`p-2.5 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 text-center ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/60 shadow-xs'
                      : 'border-stone-200 dark:border-slate-700 hover:border-amber-400 bg-white dark:bg-slate-800'
                  }`}
                >
                  <span className="text-2xl sm:text-3xl filter drop-shadow-xs">{sticker.emoji}</span>
                  <span className="text-[10px] font-bold text-stone-600 dark:text-slate-300 truncate w-full">
                    {sticker.label}
                  </span>
                </button>
              );
            })}

            {filteredStickers.length === 0 && (
              <div className="col-span-full py-8 text-center text-xs font-bold text-stone-400 dark:text-slate-500">
                Kein Sticker gefunden für "{searchQuery}"
              </div>
            )}
          </div>

          {/* Footer with Reset */}
          <div className="p-3 px-4 border-t border-stone-100 dark:border-slate-800 bg-stone-50 dark:bg-slate-800/50 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={() => {
                onSelectSticker('');
                onClose();
              }}
              className="text-xs font-bold text-stone-500 hover:text-stone-800 dark:text-slate-400 dark:hover:text-white"
            >
              Kein Sticker (Auto-Icon)
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-stone-200 dark:bg-slate-700 text-stone-800 dark:text-white font-bold text-xs"
            >
              Fertig
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
