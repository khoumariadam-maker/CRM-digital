'use client';

import React, { useState } from 'react';
import { useCRMData } from '@/context/CRMDataContext';
import { Landmark, Package, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';

interface InitialSetupModalProps {
  isOpen: boolean;
  onComplete: (initialBalanceDzd: number, productName: string, priceDzd: number, rawLinks?: string) => void;
}

export default function InitialSetupModal({ isOpen, onComplete }: InitialSetupModalProps) {
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 — always start empty, user types their real balance
  const [startingBalanceDzd, setStartingBalanceDzd] = useState<string>('');

  // Step 2 — empty product fields
  const [productName, setProductName] = useState<string>('');
  const [productPriceDzd, setProductPriceDzd] = useState<string>('');
  const [productCostUsd, setProductCostUsd] = useState<string>('');
  const [initialLinksText, setInitialLinksText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const balanceValue = parseFloat(startingBalanceDzd.replace(',', '.')) || 0;
  const priceValue = parseFloat(productPriceDzd.replace(',', '.')) || 0;

  const handleFinish = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onComplete(
        balanceValue,
        productName.trim(),
        priceValue,
        initialLinksText.trim() || undefined
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const canGoToStep2 = step === 1 && startingBalanceDzd.trim() !== '';

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 animate-fade-in">
      <div className="relative w-full sm:max-w-md bg-[#0f1117] sm:rounded-3xl rounded-t-3xl border border-white/10 shadow-2xl overflow-hidden">

        {/* Gradient top accent */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent" />

        <div className="p-6 sm:p-7 space-y-5">

          {/* Step indicator */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                {step === 1 ? 'Capital Initial' : 'Produit Principal'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {[1, 2].map((s) => (
                <div
                  key={s}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    s === step ? 'w-6 bg-emerald-400' : s < step ? 'w-4 bg-emerald-600' : 'w-4 bg-slate-700'
                  }`}
                />
              ))}
            </div>
          </div>

          {step === 1 ? (
            /* ── STEP 1: BaridiMob Capital ── */
            <div className="space-y-5">
              <div className="space-y-1">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center mb-3">
                  <Landmark className="w-5 h-5 text-emerald-400" />
                </div>
                <h2 className="text-xl font-black text-white">Solde BaridiMob Actuel</h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Saisissez le montant <strong className="text-slate-300">exact</strong> présent sur votre compte BaridiMob en ce moment. Ce solde sert de base de calcul — vos bénéfices s'y ajouteront automatiquement.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">
                  Capital BaridiMob (DA)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    step="any"
                    value={startingBalanceDzd}
                    onChange={(e) => setStartingBalanceDzd(e.target.value)}
                    placeholder="ex: 15000"
                    autoFocus
                    className="w-full bg-slate-900/80 border border-white/10 focus:border-emerald-500/60 rounded-2xl px-4 py-3.5 text-2xl font-black text-white placeholder-slate-700 focus:outline-none transition-colors"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">
                    DA
                  </span>
                </div>
                {balanceValue > 0 && (
                  <p className="text-xs text-emerald-400 font-medium">
                    ✓ {balanceValue.toLocaleString('fr-DZ')} DA enregistré comme capital de départ
                  </p>
                )}
                <p className="text-[11px] text-slate-500">
                  Vous pouvez aussi saisir 0 et mettre à jour plus tard dans les Paramètres.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={startingBalanceDzd.trim() === ''}
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 active:scale-[0.98] transition-all cursor-pointer min-h-[52px] touch-manipulation"
              >
                <span>Continuer</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setStartingBalanceDzd('0');
                  setStep(2);
                }}
                className="w-full text-xs text-slate-500 hover:text-slate-300 transition-colors py-1 cursor-pointer touch-manipulation"
              >
                Passer — configurer le capital plus tard
              </button>
            </div>
          ) : (
            /* ── STEP 2: Product Setup ── */
            <form onSubmit={handleFinish} className="space-y-4">
              <div className="space-y-1">
                <div className="w-11 h-11 rounded-2xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center mb-3">
                  <Package className="w-5 h-5 text-blue-400" />
                </div>
                <h2 className="text-xl font-black text-white">Produit Principal</h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Configurez votre produit phare. Vous pourrez en ajouter d'autres depuis la section Stock.
                </p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Nom du Produit</label>
                  <input
                    type="text"
                    required
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="ex: Jio AI Pro, Canva Pro..."
                    className="w-full bg-slate-900/80 border border-white/10 focus:border-blue-500/60 rounded-xl px-3.5 py-2.5 text-sm font-medium text-white placeholder-slate-600 focus:outline-none transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Prix de Vente (DA)</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      required
                      min="1"
                      step="any"
                      value={productPriceDzd}
                      onChange={(e) => setProductPriceDzd(e.target.value)}
                      placeholder="1400"
                      className="w-full bg-slate-900/80 border border-white/10 focus:border-emerald-500/60 rounded-xl px-3 py-2.5 text-sm font-bold text-emerald-400 placeholder-slate-600 focus:outline-none transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Coût Source ($)</label>
                    <input
                      type="number"
                      inputMode="decimal"
                      step="any"
                      min="0"
                      value={productCostUsd}
                      onChange={(e) => setProductCostUsd(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-slate-900/80 border border-white/10 focus:border-amber-500/60 rounded-xl px-3 py-2.5 text-sm font-bold text-amber-400 placeholder-slate-600 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300">
                      Liens / Codes de Stock
                    </label>
                    <span className="text-[10px] text-slate-500 font-normal">1 ligne = 1 article — Optionnel</span>
                  </div>
                  <textarea
                    rows={3}
                    placeholder={"https://example.com/activate?token=...\nhttps://example.com/activate?token=..."}
                    value={initialLinksText}
                    onChange={(e) => setInitialLinksText(e.target.value)}
                    className="w-full bg-slate-900/80 border border-white/10 focus:border-blue-500/60 rounded-xl p-3 text-xs font-mono text-slate-300 placeholder-slate-700 focus:outline-none transition-colors resize-none"
                  />
                  {initialLinksText.trim() && (
                    <p className="text-[11px] text-blue-400">
                      {initialLinksText.trim().split('\n').filter(Boolean).length} lien(s) prêts à déposer
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-bold transition-all cursor-pointer min-h-[52px] touch-manipulation"
                >
                  Retour
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || !productName.trim() || !productPriceDzd}
                  className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/25 active:scale-[0.98] transition-all cursor-pointer min-h-[52px] touch-manipulation"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isSubmitting ? 'Initialisation...' : 'Lancer le CRM'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
