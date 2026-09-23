import React, { useState, useMemo } from 'react';
import { useFamily } from '../../context/FamilyContext';
import { getButlerStagedCart } from '../../services/storeCartService';
import {
  ExternalLink,
  ChevronDown,
  ChevronUp,
  X,
  Check,
  PlusCircle,
} from 'lucide-react';

interface ButlerProvisioningCardProps {
  onNavigateGroceries?: () => void;
  className?: string;
}

export const ButlerProvisioningCard: React.FC<ButlerProvisioningCardProps> = ({
  onNavigateGroceries,
  className = '',
}) => {
  const { mealPlans, recipes, groceries, addGrocery } = useFamily();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [addedToListToast, setAddedToListToast] = useState(false);

  const stagedCart = useMemo(() => {
    return getButlerStagedCart(mealPlans, recipes, groceries, 3);
  }, [mealPlans, recipes, groceries]);

  if (isDismissed || stagedCart.totalItemCount === 0) {
    return null;
  }

  const handleAddAllToGroceries = () => {
    stagedCart.items.forEach((item) => {
      // Check if already in groceries
      const exists = groceries.some(
        (g) => g.name.toLowerCase().trim() === item.name.toLowerCase().trim()
      );
      if (!exists) {
        addGrocery(item.name, item.category as any || 'produce');
      }
    });

    setAddedToListToast(true);
    setTimeout(() => setAddedToListToast(false), 3000);
  };

  return (
    <div className={`duo-card bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-3xl p-5 sm:p-6 shadow-lg border-2 border-emerald-400 relative overflow-hidden transition-all ${className}`}>
      
      {/* Dismiss Button */}
      <button
        onClick={() => setIsDismissed(true)}
        className="absolute top-4 right-4 w-7 h-7 rounded-xl bg-black/20 hover:bg-black/30 text-emerald-100 flex items-center justify-center transition-colors"
        title="Ausblenden"
      >
        <X className="w-3.5 h-3.5 stroke-[2.5]" />
      </button>

      {/* Header */}
      <div className="flex items-start gap-3.5">
        <div className="w-12 h-12 rounded-2xl bg-white text-emerald-700 flex items-center justify-center text-2xl shrink-0 shadow-md">
          🛒
        </div>

        <div className="min-w-0 pr-6">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-emerald-100 border border-white/20">
              Famly Butler • Bereit zur Bestellung
            </span>
            <span className="text-xs font-black bg-amber-400 text-stone-900 px-2 py-0.5 rounded-full shadow-2xs">
              ca. {stagedCart.estimatedTotalEur} €
            </span>
          </div>

          <h3 className="text-lg sm:text-xl font-black tracking-tight mt-1">
            Supermarkt-Warenkorb vorbefüllt ({stagedCart.totalItemCount} Artikel)
          </h3>

          <p className="text-xs text-emerald-100 font-semibold mt-0.5 leading-relaxed">
            {stagedCart.mealTitles.length > 0 ? (
              <>
                Passend für <strong>{stagedCart.mealTitles.slice(0, 2).join(' & ')}</strong>
                {stagedCart.mealTitles.length > 2 && ` (+${stagedCart.mealTitles.length - 2} weitere)`}
              </>
            ) : (
              'Passend für die anstehenden Mahlzeiten & Vorräte'
            )}
          </p>
        </div>
      </div>

      {/* Collapsible Item Chips Preview */}
      <div className="mt-4 pt-3 border-t border-white/20">
        <div className="flex items-center justify-between text-xs font-bold mb-2">
          <span className="text-emerald-100">Enthaltene Zutaten & Artikel:</span>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-[11px] font-black text-white hover:text-emerald-200"
          >
            <span>{isExpanded ? 'Weniger anzeigen' : `Alle ${stagedCart.totalItemCount} anzeigen`}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto scrollbar-thin">
          {(isExpanded ? stagedCart.items : stagedCart.items.slice(0, 6)).map((item) => (
            <span
              key={item.id}
              className="px-2.5 py-1 rounded-xl bg-white/15 backdrop-blur-xs text-xs font-bold text-white border border-white/20 flex items-center gap-1"
            >
              <span>{item.name}</span>
              {item.amount && <span className="opacity-70 text-[10px]">({item.amount})</span>}
            </span>
          ))}

          {!isExpanded && stagedCart.items.length > 6 && (
            <span className="px-2 py-1 rounded-xl bg-white/10 text-xs font-bold text-emerald-200">
              +{stagedCart.items.length - 6} mehr...
            </span>
          )}
        </div>
      </div>

      {/* 1-Tap Confirmation Buttons (Human-in-the-Loop) */}
      <div className="mt-4 pt-3 border-t border-white/20 flex flex-wrap items-center gap-2.5">
        {/* Rewe Staged Cart Button */}
        <a
          href={stagedCart.reweCartUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="duo-btn duo-btn-white text-emerald-800 px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
        >
          <span>🛒 Bei Rewe öffnen</span>
          <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
        </a>

        {/* Instacart Shoppable Cart Button */}
        <a
          href={stagedCart.instacartCartUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="duo-btn px-4 py-2.5 rounded-2xl text-xs font-black bg-emerald-500 hover:bg-emerald-400 text-white border-2 border-emerald-300 flex items-center gap-1.5 shadow-xs active:scale-95 transition-all"
        >
          <span>🥕 Instacart Cart</span>
          <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
        </a>

        {/* Add to Local Grocery List */}
        <button
          type="button"
          onClick={handleAddAllToGroceries}
          className="duo-btn px-3.5 py-2.5 rounded-2xl text-xs font-black bg-white/20 hover:bg-white/30 text-white border border-white/30 flex items-center gap-1.5 shadow-xs active:scale-95 transition-all"
        >
          {addedToListToast ? (
            <>
              <Check className="w-3.5 h-3.5 text-amber-300" />
              <span>Zur Liste hinzugefügt!</span>
            </>
          ) : (
            <>
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Auf Einkaufsliste</span>
            </>
          )}
        </button>

        {onNavigateGroceries && (
          <button
            type="button"
            onClick={onNavigateGroceries}
            className="text-xs text-white/80 hover:text-white underline underline-offset-2 ml-auto font-bold py-1 px-2"
          >
            Einkaufsliste ansehen &rarr;
          </button>
        )}
      </div>

    </div>
  );
};
