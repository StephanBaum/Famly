import React, { useState, useEffect, useRef } from 'react';
import { ModalPortal } from './ModalPortal';
import { Mic, MicOff, X, Sparkles, Trash2, ShoppingCart, AlertCircle } from 'lucide-react';
import { GroceryCategory } from '../types';
import { inferGroceryCategory } from '../utils/recipeParser';
import {
  isSpeechRecognitionSupported,
  startVoiceRecognition,
  VoiceSession,
} from '../services/voiceRecognitionService';

interface VoiceInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItems: (items: Array<{ name: string; category: GroceryCategory }>) => void;
}

export const VoiceInputModal: React.FC<VoiceInputModalProps> = ({
  isOpen,
  onClose,
  onAddItems,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [parsedItems, setParsedItems] = useState<Array<{ name: string; category: GroceryCategory }>>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasSpeechSupport] = useState(() => isSpeechRecognitionSupported());
  const sessionRef = useRef<VoiceSession | null>(null);

  // Clean up session on modal close
  useEffect(() => {
    if (!isOpen) {
      if (sessionRef.current) {
        sessionRef.current.stop();
        sessionRef.current = null;
      }
      setIsListening(false);
      setTranscript('');
      setParsedItems([]);
      setErrorMessage(null);
    }
  }, [isOpen]);

  // Parse speech transcript whenever transcript updates
  useEffect(() => {
    if (!transcript.trim()) {
      setParsedItems([]);
      return;
    }

    // Clean common prefixes
    const clean = transcript
      .replace(/^(wir brauchen|bitte kauf|kauf bitte|ich brauche|kauf mal|aufschreiben|einkaufsliste)\s*/gi, '')
      .trim();

    // Split on commas, "und", semicolons, or line breaks
    const rawTokens = clean
      .split(/[,;\n]|\s+und\s+/i)
      .map((t) => t.trim())
      .filter((t) => t.length > 1);

    const items = rawTokens.map((t) => ({
      name: t.charAt(0).toUpperCase() + t.slice(1),
      category: inferGroceryCategory(t),
    }));

    setParsedItems(items);
  }, [transcript]);

  const toggleListening = async () => {
    setErrorMessage(null);

    if (isListening && sessionRef.current) {
      sessionRef.current.stop();
      sessionRef.current = null;
      setIsListening(false);
      return;
    }

    const session = await startVoiceRecognition({
      onStart: () => {
        setIsListening(true);
        setErrorMessage(null);
      },
      onTranscriptChange: (text) => {
        setTranscript(text);
      },
      onError: (msg) => {
        setErrorMessage(msg);
        setIsListening(false);
        sessionRef.current = null;
      },
      onEnd: () => {
        setIsListening(false);
        sessionRef.current = null;
      },
    });

    if (session) {
      sessionRef.current = session;
    }
  };

  const handleRemoveItem = (index: number) => {
    setParsedItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirmAdd = () => {
    if (parsedItems.length === 0) return;
    onAddItems(parsedItems);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
        <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border-2 border-stone-200 dark:border-slate-800 animate-in zoom-in-95 space-y-5 text-stone-900 dark:text-slate-100 my-auto">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 flex items-center justify-center text-xl shadow-xs">
                🎙️
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  Sprach-Einkauf
                </h3>
                <p className="text-xs text-stone-500 dark:text-slate-400 font-semibold">
                  Zutaten freihändig einsprechen
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

          {!hasSpeechSupport ? (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/50 rounded-2xl border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-2">
              <p className="font-bold">Mikrofon im Browser nicht verfügbar</p>
              <p className="text-[11px] text-amber-800 dark:text-amber-300">
                Dein Browser unterstützt die Web Speech API aktuell nicht. Öffne Famly in Chrome auf deinem Pixel / Smartphone.
              </p>
            </div>
          ) : (
            <>
              {/* Error Notice */}
              {errorMessage && (
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 rounded-2xl text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <p className="font-semibold leading-relaxed">{errorMessage}</p>
                </div>
              )}

              {/* Pulsing Mic Visualizer */}
              <div className="flex flex-col items-center justify-center py-4 space-y-3">
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-lg cursor-pointer ${
                    isListening
                      ? 'bg-rose-500 text-white animate-pulse ring-8 ring-rose-200 dark:ring-rose-950/50 scale-105'
                      : 'bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300 hover:scale-105 hover:bg-rose-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {isListening ? <Mic className="w-8 h-8 stroke-[2.5]" /> : <MicOff className="w-8 h-8" />}
                </button>

                <div className="text-center space-y-1">
                  <span className="text-xs font-black text-stone-800 dark:text-white block">
                    {isListening ? 'Famly hört zu... sprich einfach los!' : 'Tippe auf das Mikrofon, um zu sprechen'}
                  </span>
                  <p className="text-[11px] text-stone-500 dark:text-slate-400 max-w-xs">
                    Tipp: <em>„Wir brauchen Hafermilch, 6 Eier, Bananen und Butter“</em>
                  </p>
                </div>
              </div>

              {/* Live Transcript / Parsed Items Box */}
              <div className="p-3.5 bg-stone-50 dark:bg-slate-800/60 rounded-2xl border border-stone-200 dark:border-slate-700 space-y-2.5 max-h-56 overflow-y-auto">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-stone-500 dark:text-slate-400 tracking-wider">
                    Erkannte Artikel ({parsedItems.length})
                  </span>
                  {parsedItems.length > 0 && (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Auto-Kategorie
                    </span>
                  )}
                </div>

                {parsedItems.length === 0 ? (
                  <p className="text-xs text-stone-400 dark:text-slate-500 italic py-2 text-center">
                    {isListening ? 'Warte auf Spracheingabe...' : 'Noch nichts eingesprochen.'}
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {parsedItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-2 px-3 rounded-xl bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 flex items-center justify-between gap-2 text-xs animate-in fade-in"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className={`text-[9px] uppercase font-black px-1.5 py-0.5 rounded-md ${
                              item.category === 'produce'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : item.category === 'dairy'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                                : item.category === 'meat'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                : 'bg-stone-100 text-stone-700 dark:bg-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {item.category}
                          </span>
                          <span className="font-extrabold text-stone-800 dark:text-white truncate">
                            {item.name}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-stone-300 hover:text-rose-500 p-1 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="duo-btn duo-btn-white px-4 py-2 text-xs font-bold rounded-xl text-stone-700 dark:text-slate-300"
                >
                  Abbrechen
                </button>

                <button
                  type="button"
                  onClick={handleConfirmAdd}
                  disabled={parsedItems.length === 0}
                  className="duo-btn duo-btn-green px-5 py-2 text-xs font-black rounded-xl flex items-center gap-1.5 disabled:opacity-40"
                >
                  <ShoppingCart className="w-4 h-4 stroke-[2.5]" />
                  <span>{parsedItems.length} Artikel hinzufügen</span>
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </ModalPortal>
  );
};
