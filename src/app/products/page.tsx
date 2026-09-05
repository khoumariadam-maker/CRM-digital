'use client';

import React, { useState } from 'react';
import { useCRMData } from '@/context/CRMDataContext';
import { useCurrency } from '@/context/CurrencyContext';
import { convertUsdToDzd } from '@/lib/calculations';
import CreateProductModal from '@/components/modals/CreateProductModal';
import {
  Package,
  Plus,
  Key,
  Trash2,
  Copy,
  Check,
  Search,
  Sparkles,
} from 'lucide-react';

export default function ProductsPage() {
  const { products, deleteProduct, addStockKeys } = useCRMData();
  const { format, exchangeRate } = useCurrency();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedProdForKeys, setSelectedProdForKeys] = useState<string | null>(null);
  const [keysInput, setKeysInput] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDepositKeys = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProdForKeys || !keysInput.trim()) return;

    const keys = keysInput
      .split('\n')
      .map((k) => k.trim())
      .filter(Boolean);

    addStockKeys(selectedProdForKeys, keys);
    setKeysInput('');
    setSelectedProdForKeys(null);
  };

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="p-5 sm:p-6 rounded-2xl glass-panel border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-400 mb-1">
            <Package className="w-3.5 h-3.5" />
            <span>PRODUCTS & VAULT</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">Digital Products Catalog</h1>
          <p className="text-xs text-slate-400">
            Configure default prices, sourcing costs, and store license keys.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-4 py-3 rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create Product</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
        <input
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-950 border border-white/10 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filtered.map((prod) => {
          const costDzd = convertUsdToDzd(prod.defaultCostUsd, exchangeRate);
          const profitDzd = prod.defaultSellingDzd - costDzd;
          const margin = prod.defaultSellingDzd > 0 ? Math.round((profitDzd / prod.defaultSellingDzd) * 100) : 0;
          const keysCount = prod.stockKeys?.length || 0;

          return (
            <div
              key={prod.id}
              className="p-4 rounded-2xl glass-card border border-white/10 space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold">
                    {prod.category}
                  </span>
                  <button
                    onClick={() => deleteProduct(prod.id)}
                    className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                    title="Delete product"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h3 className="text-base font-bold text-white leading-tight">
                  {prod.name}
                </h3>
              </div>

              {/* Price Breakdown */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-white/5 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Default Selling:</span>
                  <span className="font-bold text-white">
                    {prod.defaultSellingDzd.toLocaleString()} DA
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Sourcing Cost:</span>
                  <span className="font-semibold text-slate-200">
                    ${prod.defaultCostUsd} <span className="text-slate-400 text-[10px]">({costDzd} DA)</span>
                  </span>
                </div>
                <div className="pt-1.5 border-t border-white/5 flex items-center justify-between">
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>+{profitDzd.toLocaleString()} DA Profit</span>
                  </span>
                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    {margin}%
                  </span>
                </div>
              </div>

              {/* Key Vault */}
              <div className="pt-1 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium flex items-center gap-1">
                    <Key className="w-3.5 h-3.5 text-slate-400" />
                    <span>Keys in Vault:</span>
                  </span>
                  <span
                    className={`font-bold text-xs px-2 py-0.5 rounded ${
                      keysCount > 0
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {keysCount} ready
                  </span>
                </div>

                {keysCount > 0 && (
                  <div className="p-2 rounded-lg bg-slate-950 border border-white/5 flex items-center justify-between gap-1 text-[11px] font-mono text-emerald-300">
                    <span className="truncate">Next: {prod.stockKeys[0]}</span>
                    <button
                      onClick={() => handleCopy(prod.stockKeys[0])}
                      className="text-slate-400 hover:text-white p-1"
                    >
                      {copiedKey === prod.stockKeys[0] ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                )}

                <button
                  onClick={() => setSelectedProdForKeys(prod.id)}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 text-xs font-bold transition-all cursor-pointer"
                >
                  + Add Stock Keys
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Deposit Keys Modal */}
      {selectedProdForKeys && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-t-3xl sm:rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-blue-400" />
              <span>Deposit Keys into Vault</span>
            </h3>
            <textarea
              rows={4}
              required
              placeholder="Paste license keys or logins (one per line)..."
              value={keysInput}
              onChange={(e) => setKeysInput(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500 resize-none"
            />
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => setSelectedProdForKeys(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400"
              >
                Cancel
              </button>
              <button
                onClick={handleDepositKeys}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
              >
                Deposit Keys
              </button>
            </div>
          </div>
        </div>
      )}

      <CreateProductModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </div>
  );
}
