'use client';

import React, { useState } from 'react';
import { useCurrency } from '@/context/CurrencyContext';
import { useCRMData } from '@/context/CRMDataContext';
import { PartnerName } from '@/types/crm';
import {
  TrendingUp,
  Plus,
  Users,
  Check,
  Edit2,
  PackagePlus,
  ShoppingBag,
  Flame,
} from 'lucide-react';

interface TopHeaderProps {
  onOpenAddSale: () => void;
  onOpenNewProduct: () => void;
}

export default function TopHeader({ onOpenAddSale, onOpenNewProduct }: TopHeaderProps) {
  const { currency, toggleCurrency, exchangeRate, setExchangeRate } = useCurrency();
  const { activePartner, setActivePartner, isFirebaseConnected } = useCRMData();

  const [isEditingRate, setIsEditingRate] = useState(false);
  const [rateInput, setRateInput] = useState(exchangeRate.toString());

  const handleSaveRate = () => {
    const val = parseFloat(rateInput);
    if (!isNaN(val) && val > 0) {
      setExchangeRate(val);
      setIsEditingRate(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-white/10 glass-panel px-3 sm:px-6 py-2.5">
      <div className="flex items-center justify-between gap-2 max-w-7xl mx-auto">
        {/* Brand & Partner Pill */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Logo */}
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-black text-white text-xs shadow-md shadow-blue-500/30">
            DZ
          </div>

          {/* Adem / Abdou Partner Switcher */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-full border border-white/10">
            <button
              onClick={() => setActivePartner('Adem')}
              className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activePartner === 'Adem'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Adem
            </button>
            <button
              onClick={() => setActivePartner('Abdou')}
              className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activePartner === 'Abdou'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Abdou
            </button>
          </div>
        </div>

        {/* Right Side: Currency Toggle & Rate */}
        <div className="flex items-center gap-2">
          {/* Parallel "Square" Rate Pill */}
          <div className="hidden xs:flex items-center bg-slate-900/90 border border-white/10 rounded-full px-2.5 py-1 text-[11px] text-slate-300">
            {isEditingRate ? (
              <div className="flex items-center gap-1">
                <span className="text-white font-medium">1$ =</span>
                <input
                  type="number"
                  value={rateInput}
                  onChange={(e) => setRateInput(e.target.value)}
                  className="w-14 bg-slate-800 border border-blue-500 rounded px-1 py-0.5 text-[11px] text-white focus:outline-none"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveRate()}
                />
                <span className="text-white font-medium">DA</span>
                <button
                  onClick={handleSaveRate}
                  className="p-0.5 text-emerald-400 hover:text-emerald-300"
                >
                  <Check className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setRateInput(exchangeRate.toString());
                  setIsEditingRate(true);
                }}
                className="flex items-center gap-1 font-semibold text-slate-300 hover:text-white cursor-pointer"
                title="Click to edit parallel exchange rate"
              >
                <span>1$ = {exchangeRate} DA</span>
                <Edit2 className="w-2.5 h-2.5 text-slate-400" />
              </button>
            )}
          </div>

          {/* Live Currency Toggle */}
          <button
            onClick={toggleCurrency}
            className="flex items-center bg-slate-950 p-0.5 rounded-full border border-white/10 cursor-pointer text-xs font-bold transition-all active:scale-95"
            title="Toggle DZD / USD"
          >
            <span
              className={`px-2 py-1 rounded-full transition-all text-[11px] ${
                currency === 'DZD'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400'
              }`}
            >
              DZD
            </span>
            <span
              className={`px-2 py-1 rounded-full transition-all text-[11px] ${
                currency === 'USD'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400'
              }`}
            >
              USD
            </span>
          </button>

          {/* Desktop/Tablet Add Sale Button */}
          <button
            onClick={onOpenAddSale}
            className="hidden sm:flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-600/30 active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Sale</span>
          </button>
        </div>
      </div>
    </header>
  );
}
