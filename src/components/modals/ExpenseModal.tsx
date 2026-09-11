'use client';

import React, { useState } from 'react';
import { useCRMData } from '@/context/CRMDataContext';
import { useCurrency } from '@/context/CurrencyContext';
import { ExpenseCategory, PartnerName } from '@/types/crm';
import { parseNumericInput, convertUsdToDzd } from '@/lib/calculations';
import { X, Receipt, CheckCircle2, Calendar } from 'lucide-react';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ExpenseModal({ isOpen, onClose }: ExpenseModalProps) {
  const { addExpense, activePartner } = useCRMData();
  const { exchangeRate } = useCurrency();

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<'DZD' | 'USD'>('DZD');
  const [category, setCategory] = useState<ExpenseCategory>('tools');
  const [paidBy, setPaidBy] = useState<PartnerName>(activePartner);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const parsedAmount = parseNumericInput(amount);
  const amountDzd = currency === 'DZD' ? parsedAmount : convertUsdToDzd(parsedAmount, exchangeRate);
  const amountUsd = currency === 'USD' ? parsedAmount : exchangeRate > 0 ? parsedAmount / exchangeRate : 0;

  const categories: { id: ExpenseCategory; label: string }[] = [
    { id: 'supplier', label: 'Fournisseur' },
    { id: 'proxy', label: 'Proxy / SIM' },
    { id: 'tools', label: 'Outils / SaaS' },
    { id: 'cards', label: 'Frais Cartes' },
    { id: 'ads', label: 'Meta Ads' },
    { id: 'other', label: 'Autre' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!title.trim() || parsedAmount <= 0) {
      alert('Please enter a title and a valid amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addExpense({
        title: title.trim(),
        amountDzd,
        amountUsd: currency === 'USD' ? parsedAmount : undefined,
        currency,
        category,
        paidBy,
        date,
        notes: notes.trim() || undefined,
      });

      setTitle('');
      setAmount('');
      setNotes('');
      onClose();
    } catch (err) {
      console.error('Failed to add expense:', err);
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
            <div className="w-8 h-8 rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white leading-tight">Log Daily Expense</h2>
              <p className="text-[11px] text-slate-400">Enregistrer une dépense opérationnelle</p>
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

        {/* Form Body */}
        <form id="expense-form" onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* Title */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
              Expense Description *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Proxy 4G renewal, SIM reload..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Amount & Currency */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                Amount *
              </label>
              <div className="flex rounded-lg bg-slate-950 p-0.5 border border-white/10 text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setCurrency('DZD')}
                  className={`px-2 py-0.5 rounded-md ${currency === 'DZD' ? 'bg-rose-600 text-white' : 'text-slate-400'}`}
                >
                  DZD (DA)
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency('USD')}
                  className={`px-2 py-0.5 rounded-md ${currency === 'USD' ? 'bg-rose-600 text-white' : 'text-slate-400'}`}
                >
                  USD ($)
                </button>
              </div>
            </div>

            <div className="relative">
              <input
                type="number"
                inputMode={currency === 'DZD' ? 'numeric' : 'decimal'}
                step="any"
                min="0"
                required
                placeholder={currency === 'DZD' ? 'e.g. 2500' : 'e.g. 10.00'}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl pl-3.5 pr-12 py-2.5 text-base font-bold text-white focus:outline-none focus:border-rose-500"
              />
              <span className="absolute right-3.5 top-3 text-xs font-bold text-slate-400">
                {currency === 'DZD' ? 'DA' : '$'}
              </span>
            </div>
            {currency === 'USD' && (
              <span className="text-[10px] text-slate-400 mt-1 block">
                ≈ {amountDzd.toLocaleString()} DA (Rate: {exchangeRate})
              </span>
            )}
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Category
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {categories.map((cat) => (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer truncate ${
                    category === cat.id
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : 'bg-slate-950 text-slate-400 border-white/5 hover:border-white/20'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Paid By */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Paid By
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaidBy('Adem')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  paidBy === 'Adem'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                    : 'bg-slate-950 text-slate-400 border-white/10'
                }`}
              >
                Adem
              </button>
              <button
                type="button"
                onClick={() => setPaidBy('Abdou')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  paidBy === 'Abdou'
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                    : 'bg-slate-950 text-slate-400 border-white/10'
                }`}
              >
                Abdou
              </button>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
              Date
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl pl-10 pr-3.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <input
              type="text"
              placeholder="Notes (optional)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-slate-900/95 backdrop-blur shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            type="submit"
            form="expense-form"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-xl shadow-rose-600/30 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            <span>{isSubmitting ? 'Saving...' : `Record Expense (-${amountDzd.toLocaleString()} DA)`}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
