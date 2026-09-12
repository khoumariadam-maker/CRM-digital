'use client';

import React, { useState } from 'react';
import { useCRMData } from '@/context/CRMDataContext';
import { Landmark, Package, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

interface InitialSetupModalProps {
  isOpen: boolean;
  onComplete: (initialBalanceDzd: number, productName: string, priceDzd: number, rawLinks?: string) => void;
}

export default function InitialSetupModal({ isOpen, onComplete }: InitialSetupModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [startingBalanceDzd, setStartingBalanceDzd] = useState<number>(22345);
  const [productName, setProductName] = useState<string>('Jio AI Pro');
  const [productPriceDzd, setProductPriceDzd] = useState<number>(1400);
  const [initialLinksText, setInitialLinksText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleFinish = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onComplete(
        startingBalanceDzd || 0,
        productName.trim() || 'Jio AI Pro',
        productPriceDzd || 1400,
        initialLinksText.trim() || undefined
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-md my-auto bg-slate-950 border border-emerald-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-emerald-950/40 space-y-6">
        {/* Glow ambient */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Step Indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              Configuration Initiale (1ère Utilisation)
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-400 font-bold">
            Étape {step} / 2
          </span>
        </div>

        {step === 1 ? (
          /* Step 1: Capital BaridiMob */
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-2">
                <Landmark className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black text-white">Solde Initial BaridiMob</h2>
              <p className="text-xs text-slate-400">
                Indiquez le capital réel présent sur votre compte BaridiMob aujourd&apos;hui. Vos bénéfices nets s&apos;y ajouteront automatiquement.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Capital BaridiMob Actuel (DA)
              </label>
              <div className="relative">
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  required
                  value={startingBalanceDzd || ''}
                  onChange={(e) => setStartingBalanceDzd(Number(e.target.value))}
                  placeholder="22345"
                  className="w-full bg-slate-900 border border-emerald-500/40 focus:border-emerald-400 rounded-2xl px-4 py-3 text-lg font-black text-white placeholder-slate-600 focus:outline-none tracking-tight"
                />
                <span className="absolute right-4 top-3.5 text-xs font-bold text-slate-400">
                  DZD
                </span>
              </div>
              <p className="text-[11px] text-emerald-400/90 font-medium">
                💡 Recommandé : 22,345 DA (Capital actuel confirmé)
              </p>
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 active:scale-95 transition-all cursor-pointer min-h-[48px]"
            >
              <span>Continuer vers le Produit</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* Step 2: Product & Stock Confirmation */
          <form onSubmit={handleFinish} className="space-y-4">
            <div className="space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-2">
                <Package className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black text-white">Produit & Stock</h2>
              <p className="text-xs text-slate-400">
                Confirmez votre produit principal et déposez vos premiers liens d&apos;activation (optionnel).
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Nom Produit</label>
                <input
                  type="text"
                  required
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Prix de Vente (DA)</label>
                <input
                  type="number"
                  required
                  value={productPriceDzd}
                  onChange={(e) => setProductPriceDzd(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Liens de Stock / Tokens (1 ligne = 1 article)</span>
                <span className="text-[10px] text-slate-400 font-normal">Optionnel</span>
              </label>
              <textarea
                rows={3}
                placeholder="https://jioai.pro/activate?token=...&#10;https://jioai.pro/activate?token=..."
                value={initialLinksText}
                onChange={(e) => setInitialLinksText(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-all cursor-pointer min-h-[48px]"
              >
                Retour
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/30 active:scale-95 transition-all cursor-pointer min-h-[48px]"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Initialisation...' : 'Valider & Lancer le CRM'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
