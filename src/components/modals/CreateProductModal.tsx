'use client';

import React, { useState } from 'react';
import { useCRMData } from '@/context/CRMDataContext';
import { useCurrency } from '@/context/CurrencyContext';
import { convertUsdToDzd } from '@/lib/calculations';
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

  if (!isOpen) return null;

  const parsedCostUsd = parseFloat(defaultCostUsd) || 0;
  const parsedSellingDzd = parseFloat(defaultSellingDzd) || 0;
  const costDzd = convertUsdToDzd(parsedCostUsd, exchangeRate);
  const unitProfitDzd = parsedSellingDzd - costDzd;
  const marginPercent = parsedSellingDzd > 0 ? Math.round((unitProfitDzd / parsedSellingDzd) * 100) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const stockKeys = rawKeys
      .split('\n')
      .map((k) => k.trim())
      .filter(Boolean);

    addProduct({
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
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-slate-800/40 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">Create Digital Product</h2>
              <p className="text-[11px] text-slate-400">Add any digital item, default prices & license keys</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 pb-8 sm:pb-5">
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
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                Default Cost ($ USD)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-bold">$</span>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={defaultCostUsd}
                  onChange={(e) => setDefaultCostUsd(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl pl-7 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-bold"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                ≈ {costDzd.toLocaleString()} DA
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                Default Price (DA)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="50"
                  required
                  value={defaultSellingDzd}
                  onChange={(e) => setDefaultSellingDzd(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl pl-3 pr-9 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-bold"
                />
                <span className="absolute right-3 top-2.5 text-[11px] text-slate-400">DA</span>
              </div>
            </div>
          </div>

          {/* Unit Profit Preview */}
          <div className="p-3 rounded-xl bg-slate-950 border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-slate-300 font-semibold">Gross Profit per Unit:</span>
            </div>
            <div className="text-right">
              <span className="text-xs font-black text-emerald-400">
                +{unitProfitDzd.toLocaleString()} DA
              </span>
              <span className="text-[10px] text-slate-400 block font-medium">
                {marginPercent}% Margin
              </span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
              Deposit Initial License Keys (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="Paste license keys or accounts (one per line):&#10;KEY-1111-2222-3333&#10;user@dz.com : pass123"
              value={rawKeys}
              onChange={(e) => setRawKeys(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-xs font-mono text-emerald-300 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-xl shadow-blue-600/30 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Create Product</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
