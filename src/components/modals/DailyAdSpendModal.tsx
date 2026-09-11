'use client';

import React, { useState, useEffect } from 'react';
import { useCRMData } from '@/context/CRMDataContext';
import { useCurrency } from '@/context/CurrencyContext';
import { parseNumericInput, convertUsdToDzd } from '@/lib/calculations';
import { X, Megaphone, CheckCircle2, MessageSquare, DollarSign, Calendar, TrendingDown } from 'lucide-react';

interface DailyAdSpendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DailyAdSpendModal({ isOpen, onClose }: DailyAdSpendModalProps) {
  const { sales, logDailyAdSpend, dailyAdSpends, activePartner } = useCRMData();
  const { exchangeRate } = useCurrency();

  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [spendUsd, setSpendUsd] = useState<string>('');
  const [spendDzd, setSpendDzd] = useState<string>('');
  const [messagesCount, setMessagesCount] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [currencyInput, setCurrencyInput] = useState<'USD' | 'DZD'>('USD');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split('T')[0];
      setDate(today);

      // Check if ad spend was already logged for this date
      const existing = dailyAdSpends.find((d) => d.date === today);
      if (existing) {
        setSpendUsd(existing.spendUsd > 0 ? existing.spendUsd.toString() : '');
        setSpendDzd(existing.spendDzd > 0 ? existing.spendDzd.toString() : '');
        setMessagesCount(existing.messagesCount > 0 ? existing.messagesCount.toString() : '');
        setNotes(existing.notes || '');
      } else {
        setSpendUsd('');
        setSpendDzd('');
        setMessagesCount('');
        setNotes('');
      }
    }
  }, [isOpen, dailyAdSpends]);

  if (!isOpen) return null;

  // Filter sales for the selected date
  const selectedDateSales = sales.filter((s) => s.createdAt.startsWith(date));
  const salesCount = selectedDateSales.length;
  const dayRevenueDzd = selectedDateSales.reduce((sum, s) => sum + s.sellingPriceDzd, 0);

  // Compute spend in both currencies
  const parsedUsd = parseNumericInput(spendUsd);
  const parsedDzd = parseNumericInput(spendDzd);

  let finalSpendDzd = 0;
  let finalSpendUsd = 0;

  if (currencyInput === 'USD') {
    finalSpendUsd = parsedUsd;
    finalSpendDzd = convertUsdToDzd(parsedUsd, exchangeRate);
  } else {
    finalSpendDzd = parsedDzd;
    finalSpendUsd = exchangeRate > 0 ? Number((parsedDzd / exchangeRate).toFixed(2)) : 0;
  }

  const parsedMessages = parseInt(messagesCount, 10) || 0;
  const cpmDzd = parsedMessages > 0 ? Math.round(finalSpendDzd / parsedMessages) : 0;
  const cpaDzd = salesCount > 0 ? Math.round(finalSpendDzd / salesCount) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (finalSpendDzd <= 0 && finalSpendUsd <= 0) {
      alert('Please enter a valid Meta ad spend amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      await logDailyAdSpend({
        date,
        spendUsd: finalSpendUsd,
        spendDzd: finalSpendDzd,
        messagesCount: parsedMessages,
        loggedBy: activePartner,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err) {
      console.error('Failed to log daily ad spend:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92dvh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-slate-900/95 backdrop-blur shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Megaphone className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white leading-tight">End-of-Day Ad Spend</h2>
              <p className="text-[11px] text-slate-400">Log Meta budget & calculate Cost Per Message</p>
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

        {/* Body */}
        <form id="ad-spend-form" onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* Date Selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
              Date *
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Ad Spend Amount & Currency toggle */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                Meta Daily Ad Spend *
              </label>
              <div className="flex rounded-lg bg-slate-950 p-0.5 border border-white/10 text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setCurrencyInput('USD')}
                  className={`px-2 py-0.5 rounded-md ${currencyInput === 'USD' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                >
                  USD ($)
                </button>
                <button
                  type="button"
                  onClick={() => setCurrencyInput('DZD')}
                  className={`px-2 py-0.5 rounded-md ${currencyInput === 'DZD' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                >
                  DZD (DA)
                </button>
              </div>
            </div>

            {currencyInput === 'USD' ? (
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 text-xs font-bold">$</span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min="0"
                  required
                  placeholder="e.g. 15.00"
                  value={spendUsd}
                  onChange={(e) => setSpendUsd(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl pl-8 pr-3.5 py-2.5 text-base font-bold text-white focus:outline-none focus:border-indigo-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  ≈ {finalSpendDzd.toLocaleString()} DA (at {exchangeRate} DA/$ rate)
                </span>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="number"
                  inputMode="numeric"
                  step="any"
                  min="0"
                  required
                  placeholder="e.g. 3600"
                  value={spendDzd}
                  onChange={(e) => setSpendDzd(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl pl-3.5 pr-12 py-2.5 text-base font-bold text-white focus:outline-none focus:border-indigo-500"
                />
                <span className="absolute right-3.5 top-3 text-xs font-bold text-slate-400">DA</span>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  ≈ ${finalSpendUsd.toLocaleString()} USD
                </span>
              </div>
            )}
          </div>

          {/* Messages / Leads Inquiries */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
              WhatsApp / IG Messages Received
            </label>
            <div className="relative">
              <MessageSquare className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="number"
                inputMode="numeric"
                min="0"
                placeholder="e.g. 48 messages"
                value={messagesCount}
                onChange={(e) => setMessagesCount(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Live Metric Calculations Box */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-indigo-500/20 grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-xl bg-slate-900 border border-white/5">
              <span className="text-[9px] text-slate-400 font-bold block uppercase">Cost / Msg (CPM)</span>
              <span className="text-xs sm:text-sm font-extrabold text-indigo-400 block mt-0.5">
                {cpmDzd > 0 ? `${cpmDzd} DA` : '—'}
              </span>
            </div>

            <div className="p-2 rounded-xl bg-slate-900 border border-white/5">
              <span className="text-[9px] text-slate-400 font-bold block uppercase">Cost / Sale (CPA)</span>
              <span className="text-xs sm:text-sm font-extrabold text-amber-400 block mt-0.5">
                {cpaDzd > 0 ? `${cpaDzd} DA` : '—'}
              </span>
            </div>

            <div className="p-2 rounded-xl bg-slate-900 border border-white/5">
              <span className="text-[9px] text-slate-400 font-bold block uppercase">Sales Today</span>
              <span className="text-xs sm:text-sm font-extrabold text-white block mt-0.5">
                {salesCount} orders
              </span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <input
              type="text"
              placeholder="Campaign notes (e.g. Canva Pro campaign A/B test)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-slate-900/95 backdrop-blur shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            type="submit"
            form="ad-spend-form"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            <span>{isSubmitting ? 'Saving...' : `Save Day Ad Spend (${finalSpendDzd.toLocaleString()} DA)`}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
