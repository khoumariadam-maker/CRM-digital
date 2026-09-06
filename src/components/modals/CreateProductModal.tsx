'use client';

import React, { useState, useEffect } from 'react';
import { useCRMData } from '@/context/CRMDataContext';
import { useCurrency } from '@/context/CurrencyContext';
import { convertUsdToDzd, parseNumericInput, formatSignedProfit } from '@/lib/calculations';
import { X, Tag, Key, CheckCircle2, Sparkles } from 'lucide-react';

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  'Software',
  'Streaming',
  'AI Tools',
  'OS Keys',
  'Gaming',
  'Courses',
];

export default function CreateProductModal({ isOpen, onClose }: CreateProductModalProps) {
  const { addProduct } = useCRMData();
  const { exchangeRate } = useCurrency();

  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [defaultCostUsd, setDefaultCostUsd] = useState('4.00');
  const [defaultSellingDzd, setDefaultSellingDzd] = useState('1800');
  const [rawKeys, setRawKeys] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setCategory(CATEGORIES[0]);
      setDefaultCostUsd('4.00');
      setDefaultSellingDzd('1800');
      setRawKeys('');
      setDescription('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const parsedCostUsd = parseNumericInput(defaultCostUsd);
  const parsedSellingDzd = parseNumericInput(defaultSellingDzd);
  const costDzd = convertUsdToDzd(parsedCostUsd, exchangeRate);
  const unitProfitDzd = parsedSellingDzd - costDzd;
  const marginPercent = parsedSellingDzd > 0 ? Math.round((unitProfitDzd / parsedSellingDzd) * 100) : 0;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    if (parsedSellingDzd <= 0) {
      alert('Please enter a valid default selling price in DA.');
      return;
    }

    setIsSubmitting(true);

    try {
      const stockKeys = rawKeys
        .split('\n')
        .map((k) => k.trim())
        .filter(Boolean);

      await addProduct({
        name: name.trim(),
        category,
        defaultCostUsd: parsedCostUsd,
        defaultSellingDzd: parsedSellingDzd,
        stockKeys,
        description: description.trim() || undefined,
      });

      setName('');
      setRawKeys('');
      setDescription('');
      onClose();
    } catch (err) {
      console.error('Failed to add product:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[88vh] overflow-hidden">
        {/* Sticky Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-slate-900/95 backdrop-blur shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white leading-tight">Create Digital Product</h2>
              <p className="text-[11px] text-slate-400">Add catalog item, default prices & license keys</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form
          id="product-form"
          onSubmit={handleSubmit}
          className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 overscroll-contain"
        >
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
              Product Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Canva Pro 1 Year, Netflix 1 Month..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                Default Cost ($) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-bold">$</span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min="0"
                  required
                  value={defaultCostUsd}
                  onChange={(e) => setDefaultCostUsd(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl pl-7 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                ≈ {costDzd.toLocaleString()} DA
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                Default Sell Price (DA) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  inputMode="numeric"
                  step="any"
                  required
                  value={defaultSellingDzd}
                  onChange={(e) => setDefaultSellingDzd(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl pl-3.5 pr-10 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
                />
                <span className="absolute right-3 top-2.5 text-xs font-semibold text-slate-400">DA</span>
              </div>
              <span className="text-[10px] text-emerald-400 mt-0.5 block font-semibold">
                Est. Profit: {formatSignedProfit(unitProfitDzd, 'DZD')} ({marginPercent}%)
              </span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
              Initial Stock Keys (One per line)
            </label>
            <textarea
              rows={3}
              placeholder="KEY-1234-ABCD&#10;KEY-5678-EFGH&#10;user:pass"
              value={rawKeys}
              onChange={(e) => setRawKeys(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Description (Optional)</label>
            <input
              type="text"
              placeholder="e.g. 1 year private account, auto-renewal"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </form>

        {/* Sticky Footer */}
        <div className="p-4 border-t border-white/10 bg-slate-900/95 backdrop-blur shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-black text-sm shadow-xl shadow-blue-600/30 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>{isSubmitting ? 'Creating...' : 'Save Digital Product'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
