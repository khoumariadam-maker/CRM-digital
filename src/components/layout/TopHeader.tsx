'use client';

import React, { useState } from 'react';
import { useCurrency } from '@/context/CurrencyContext';
import { useCRMData } from '@/context/CRMDataContext';
import { useAuth } from '@/context/AuthContext';
import { parseNumericInput } from '@/lib/calculations';
import {
  TrendingUp,
  Plus,
  Check,
  Edit2,
  Lock,
  Wifi,
  WifiOff,
} from 'lucide-react';

export default function TopHeader() {
  const { currency, toggleCurrency, exchangeRate } = useCurrency();
  const {
    activePartner,
    setActivePartner,
    openSaleModal,
    cloudSyncStatus,
    updateExchangeRate,
  } = useCRMData();
  const { logout } = useAuth();

  const [isEditingRate, setIsEditingRate] = useState(false);
  const [rateInput, setRateInput] = useState(exchangeRate.toString());

  const handleSaveRate = async () => {
    const val = parseNumericInput(rateInput);
    if (val > 0) {
      await updateExchangeRate(val);
      setIsEditingRate(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-white/10 glass-panel px-2.5 sm:px-6 py-2.5 backdrop-blur-xl bg-slate-950/80">
      <div className="flex items-center justify-between gap-1.5 sm:gap-2 max-w-7xl mx-auto">
        {/* Left: Brand & Authenticated Partner Badge */}
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
          {/* Logo */}
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-black text-white text-xs shadow-md shadow-blue-500/30 shrink-0">
            DZ
          </div>

          {/* Partner Selector Pill */}
          <div className="flex items-center bg-slate-900/90 p-0.5 rounded-full border border-white/10 shrink-0">
            <button
              type="button"
              onClick={() => setActivePartner('Adem')}
              className={`px-2 sm:px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activePartner === 'Adem'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {activePartner === 'Adem' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
              <span>Adem</span>
            </button>
            <button
              type="button"
              onClick={() => setActivePartner('Abdou')}
              className={`px-2 sm:px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activePartner === 'Abdou'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {activePartner === 'Abdou' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
              <span>Abdou</span>
            </button>
          </div>

          {/* Cloud Sync Status Indicator */}
          <div
            className="hidden md:flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900 border border-white/5 text-[10px] font-semibold text-slate-400"
            title={`Firebase Cloud: ${cloudSyncStatus}`}
          >
            {cloudSyncStatus === 'connected' ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 font-mono">Synced</span>
              </>
            ) : cloudSyncStatus === 'syncing' ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
                <span className="text-blue-400 font-mono">Syncing</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span className="text-amber-400 font-mono">Offline</span>
              </>
            )}
          </div>
        </div>

        {/* Right Side: Rate Pill, Currency Toggle, Quick Add & Lock */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Parallel "Square" Rate Pill */}
          <div className="flex items-center bg-slate-900/90 border border-white/10 rounded-full px-2 sm:px-2.5 py-1 text-[11px] text-slate-300">
            {isEditingRate ? (
              <div className="flex items-center gap-1">
                <span className="text-white font-medium text-[10px] sm:text-xs">1$=</span>
                <input
                  type="number"
                  step="any"
                  value={rateInput}
                  onChange={(e) => setRateInput(e.target.value)}
                  className="w-12 bg-slate-800 border border-blue-500 rounded px-1 py-0.5 text-[11px] text-white focus:outline-none"
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
                className="flex items-center gap-1 font-semibold text-slate-300 hover:text-white cursor-pointer text-[10px] sm:text-[11px]"
                title="Edit parallel Square rate"
              >
                <span>{exchangeRate} DA</span>
                <Edit2 className="w-2.5 h-2.5 text-slate-400" />
              </button>
            )}
          </div>

          {/* Live Currency Toggle */}
          <button
            type="button"
            onClick={toggleCurrency}
            className="flex items-center bg-slate-950 p-0.5 rounded-full border border-white/10 cursor-pointer text-xs font-bold transition-all active:scale-95"
            title="Toggle currency: DZD / USD"
          >
            <span
              className={`px-1.5 sm:px-2 py-0.5 rounded-full transition-all text-[10px] ${
                currency === 'DZD' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400'
              }`}
            >
              DA
            </span>
            <span
              className={`px-1.5 sm:px-2 py-0.5 rounded-full transition-all text-[10px] ${
                currency === 'USD' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400'
              }`}
            >
              $
            </span>
          </button>

          {/* Desktop/Tablet Add Sale Button */}
          <button
            type="button"
            onClick={openSaleModal}
            className="hidden sm:flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-600/30 active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>+ Sale</span>
          </button>

          {/* Lock / Switch PIN session button */}
          <button
            type="button"
            onClick={logout}
            className="p-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 active:bg-slate-700 border border-white/10 text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
            title="Lock CRM & Switch User"
            aria-label="Lock CRM & Switch User"
          >
            <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
