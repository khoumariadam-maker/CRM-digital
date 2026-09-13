'use client';

import React, { useState } from 'react';
import { useCurrency } from '@/context/CurrencyContext';
import { useCRMData } from '@/context/CRMDataContext';
import { useAuth } from '@/context/AuthContext';
import { parseNumericInput } from '@/lib/calculations';
import { Check, Edit2, Lock, User, Wifi, WifiOff } from 'lucide-react';

export default function TopHeader() {
  const { currency, toggleCurrency, exchangeRate } = useCurrency();
  const { cloudSyncStatus, updateExchangeRate } = useCRMData();
  const { partner, logout } = useAuth();

  const [isEditingRate, setIsEditingRate] = useState(false);
  const [rateInput, setRateInput] = useState(exchangeRate.toString());

  const handleSaveRate = async () => {
    const val = parseNumericInput(rateInput);
    if (val > 0) {
      await updateExchangeRate(val);
      setIsEditingRate(false);
    }
  };

  const isAdem = partner === 'Adem';

  return (
    <header className="sticky top-0 z-30 w-full border-b border-white/[0.08] glass-panel px-3 sm:px-6 py-2.5 backdrop-blur-xl bg-[#090D16]/85">
      <div className="flex items-center justify-between max-w-5xl mx-auto gap-2">
        {/* Left: Clean Brand Logo & Status */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center font-black text-white text-xs shadow-md shadow-emerald-500/20 shrink-0">
            DZ
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-white text-xs sm:text-sm tracking-tight truncate">
                DzDigital CRM
              </span>
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  cloudSyncStatus === 'connected'
                    ? 'bg-emerald-400 animate-pulse'
                    : 'bg-amber-400'
                }`}
              />
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
              {cloudSyncStatus === 'connected' ? (
                <>
                  <Wifi className="w-2.5 h-2.5 text-emerald-400" />
                  <span className="truncate">Cloud Synchro</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-2.5 h-2.5 text-amber-400" />
                  <span className="truncate">Local</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Partner Badge, Square Rate, Currency Toggle & Lock */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Active Partner Pill */}
          {partner && (
            <div
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                isAdem
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  : 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300'
              }`}
              title={`Connecté en tant que ${partner}`}
            >
              <User className="w-3 h-3" />
              <span>{partner}</span>
            </div>
          )}

          {/* Square Rate Pill */}
          <div className="flex items-center bg-slate-900/90 border border-white/10 rounded-full px-2.5 py-1 text-[11px] text-slate-300">
            {isEditingRate ? (
              <div className="flex items-center gap-1">
                <span className="text-slate-400 font-medium text-[10px]">1$=</span>
                <input
                  type="number"
                  step="any"
                  value={rateInput}
                  onChange={(e) => setRateInput(e.target.value)}
                  className="w-12 bg-slate-800 border border-emerald-500 rounded px-1 py-0.5 text-[11px] text-white focus:outline-none"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveRate()}
                />
                <button
                  type="button"
                  onClick={handleSaveRate}
                  className="p-0.5 text-emerald-400 hover:text-emerald-300 cursor-pointer"
                >
                  <Check className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setRateInput(exchangeRate.toString());
                  setIsEditingRate(true);
                }}
                className="flex items-center gap-1 font-semibold text-slate-300 hover:text-white cursor-pointer text-[11px]"
                title="Modifier taux Square"
              >
                <span>{exchangeRate} DA/$</span>
                <Edit2 className="w-2.5 h-2.5 text-slate-400" />
              </button>
            )}
          </div>

          {/* Currency Toggle */}
          <button
            type="button"
            onClick={toggleCurrency}
            className="flex items-center bg-slate-900 p-0.5 rounded-full border border-white/10 cursor-pointer text-xs font-bold transition-all active:scale-95"
            title="Basculer devise DA / $"
          >
            <span
              className={`px-2 py-0.5 rounded-full transition-all text-[10px] ${
                currency === 'DZD' ? 'bg-emerald-600 text-white shadow-sm font-black' : 'text-slate-400'
              }`}
            >
              DA
            </span>
            <span
              className={`px-2 py-0.5 rounded-full transition-all text-[10px] ${
                currency === 'USD' ? 'bg-emerald-600 text-white shadow-sm font-black' : 'text-slate-400'
              }`}
            >
              $
            </span>
          </button>

          {/* Lock Session */}
          <button
            type="button"
            onClick={logout}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 active:bg-slate-700 border border-white/10 text-slate-400 hover:text-amber-400 transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
            title="Verrouiller la session"
            aria-label="Verrouiller"
          >
            <Lock className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
