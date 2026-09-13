'use client';

import React, { useState, useEffect } from 'react';
import { useCRMData } from '@/context/CRMDataContext';
import { useCurrency } from '@/context/CurrencyContext';
import { parseNumericInput } from '@/lib/calculations';
import { X, Landmark, CheckCircle2, Lock, Unlock, AlertCircle } from 'lucide-react';

interface CaisseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CaisseModal({ isOpen, onClose }: CaisseModalProps) {
  const { activeCaisse, openCaisse, closeCaisse, sales, expenses, activePartner } = useCRMData();
  const { exchangeRate } = useCurrency();

  // Opening fields - start empty for real data entry
  const [initDzd, setInitDzd] = useState('');
  const [initUsd, setInitUsd] = useState('');

  // Closing fields
  const [closingDzd, setClosingDzd] = useState('');
  const [closingUsd, setClosingUsd] = useState('');
  const [closeNotes, setCloseNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Compute shift figures if caisse is open
  const shiftSales = activeCaisse
    ? sales.filter((s) => new Date(s.createdAt) >= new Date(activeCaisse.openedAt))
    : [];
  const totalSalesDzd = shiftSales.reduce((sum, s) => sum + (s.sellingPriceDzd || 0), 0);

  const shiftExpenses = activeCaisse
    ? expenses.filter((e) => new Date(e.createdAt) >= new Date(activeCaisse.openedAt))
    : [];
  const totalExpensesDzd = shiftExpenses.reduce((sum, e) => sum + (e.amountDzd || 0), 0);

  const expectedDzd = activeCaisse
    ? activeCaisse.initialBalanceDzd + totalSalesDzd - totalExpensesDzd
    : 0;

  useEffect(() => {
    if (activeCaisse && isOpen) {
      setClosingDzd(expectedDzd.toString());
      setClosingUsd(activeCaisse.initialBalanceUsd.toString());
    }
  }, [activeCaisse, isOpen, expectedDzd]);

  if (!isOpen) return null;

  const handleOpenCaisse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const parsedDzd = parseNumericInput(initDzd);
    const parsedUsd = parseNumericInput(initUsd);

    setIsSubmitting(true);
    try {
      await openCaisse(parsedDzd, parsedUsd);
      onClose();
    } catch (err) {
      console.error('Failed to open caisse:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseCaisse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCaisse || isSubmitting) return;

    const parsedClosingDzd = parseNumericInput(closingDzd);
    const parsedClosingUsd = parseNumericInput(closingUsd);

    setIsSubmitting(true);
    try {
      await closeCaisse(activeCaisse.id, parsedClosingDzd, parsedClosingUsd, closeNotes);
      onClose();
    } catch (err) {
      console.error('Failed to close caisse:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const countedDzd = parseNumericInput(closingDzd);
  const varianceDzd = countedDzd - expectedDzd;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92dvh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-slate-900/95 backdrop-blur shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                activeCaisse
                  ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-600/20 text-amber-400 border-amber-500/30'
              }`}
            >
              <Landmark className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white leading-tight">
                {activeCaisse ? 'Clôture de Caisse (24h)' : 'Ouverture de Caisse (24h)'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {activeCaisse
                  ? `Caisse ouverte par ${activeCaisse.openedBy}`
                  : 'Définir le fonds de caisse initial du jour'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {!activeCaisse ? (
          /* FORM: OUVERTURE */
          <form id="open-caisse-form" onSubmit={handleOpenCaisse} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5">
              <Unlock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-200/90 leading-relaxed">
                Démarrez votre journée de 24h en saisissant les fonds disponibles pour payer les publicités Meta et les stocks.
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                Fonds Initial BaridiMob / Cash (DA) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  inputMode="numeric"
                  step="any"
                  min="0"
                  required
                  placeholder="e.g. 50000"
                  value={initDzd}
                  onChange={(e) => setInitDzd(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl pl-3.5 pr-12 py-2.5 text-base font-bold text-white focus:outline-none focus:border-amber-500"
                />
                <span className="absolute right-3.5 top-3 text-xs font-bold text-slate-400">DA</span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                Solde Cartes USD Ads & Stocks ($) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 text-xs font-bold">$</span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min="0"
                  required
                  placeholder="e.g. 100.00"
                  value={initUsd}
                  onChange={(e) => setInitUsd(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl pl-8 pr-3.5 py-2.5 text-base font-bold text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="p-4 border-t border-white/10 bg-slate-900 shrink-0 pt-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm shadow-xl shadow-amber-600/30 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Unlock className="w-4 h-4 stroke-[2.5]" />
                <span>{isSubmitting ? 'Ouverture...' : 'Ouvrir la Caisse'}</span>
              </button>
            </div>
          </form>
        ) : (
          /* FORM: CLÔTURE */
          <form id="close-caisse-form" onSubmit={handleCloseCaisse} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
            {/* Shift Recap Card */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-white/10 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>Fonds initial (Départ):</span>
                <span className="font-bold text-white">{activeCaisse.initialBalanceDzd.toLocaleString()} DA</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>+ Ventes encaissées ({shiftSales.length}):</span>
                <span className="font-bold text-emerald-400">+{totalSalesDzd.toLocaleString()} DA</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>− Dépenses de la journée:</span>
                <span className="font-bold text-rose-400">−{totalExpensesDzd.toLocaleString()} DA</span>
              </div>
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-sm">
                <span className="font-bold text-slate-300">Solde théorique attendu:</span>
                <span className="font-black text-amber-300">{expectedDzd.toLocaleString()} DA</span>
              </div>
            </div>

            {/* Real Counted Cash */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                Solde Réel Compté (DA) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  inputMode="numeric"
                  step="any"
                  required
                  value={closingDzd}
                  onChange={(e) => setClosingDzd(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl pl-3.5 pr-12 py-2.5 text-base font-bold text-white focus:outline-none focus:border-emerald-500"
                />
                <span className="absolute right-3.5 top-3 text-xs font-bold text-slate-400">DA</span>
              </div>

              {/* Variance / Ecart */}
              {varianceDzd !== 0 && (
                <div
                  className={`mt-1.5 text-xs font-bold flex items-center gap-1.5 ${
                    varianceDzd > 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>
                    Écart de caisse: {varianceDzd > 0 ? `+${varianceDzd.toLocaleString()}` : varianceDzd.toLocaleString()} DA
                  </span>
                </div>
              )}
            </div>

            {/* Real Counted USD */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                Solde Final Cartes USD ($)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 text-xs font-bold">$</span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  value={closingUsd}
                  onChange={(e) => setClosingUsd(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl pl-8 pr-3.5 py-2.5 text-xs sm:text-sm font-semibold text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <input
                type="text"
                placeholder="Remarques de clôture (optionnel)..."
                value={closeNotes}
                onChange={(e) => setCloseNotes(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="p-4 border-t border-white/10 bg-slate-900 shrink-0 pt-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-xl shadow-emerald-600/30 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Lock className="w-4 h-4 stroke-[2.5]" />
                <span>{isSubmitting ? 'Clôture en cours...' : 'Clôturer la Caisse'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
