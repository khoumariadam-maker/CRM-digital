'use client';

import React, { useState, useMemo } from 'react';
import { useCRMData } from '@/context/CRMDataContext';
import { useCurrency } from '@/context/CurrencyContext';
import { convertUsdToDzd } from '@/lib/calculations';
import { Product } from '@/types/crm';
import {
  Package,
  Plus,
  Key,
  Trash2,
  Copy,
  Check,
  Search,
  Sparkles,
  X,
  FileSpreadsheet,
  Clock,
  AlertTriangle,
} from 'lucide-react';

export default function ProductsPage() {
  const { products, deleteProduct, addStockKeys, openProductModal, openStockImportModal } = useCRMData();
  const { format, exchangeRate } = useCurrency();

  const [selectedProdForKeys, setSelectedProdForKeys] = useState<string | null>(null);
  const [keysInput, setKeysInput] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'out' | 'low' | 'in'>('all');
  const [hasExpiry, setHasExpiry] = useState(false);
  const [expiryPreset, setExpiryPreset] = useState<'24h' | '48h' | '7d' | '30d' | 'custom'>('24h');
  const [customDays, setCustomDays] = useState('14');

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const detectedDepositKeys = keysInput
    .split('\n')
    .map((k) => k.trim())
    .filter(Boolean);

  const handleDepositKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProdForKeys || detectedDepositKeys.length === 0) return;

    let calculatedExpiresAt: string | undefined = undefined;
    if (hasExpiry) {
      const now = Date.now();
      if (expiryPreset === '24h') calculatedExpiresAt = new Date(now + 24 * 3600 * 1000).toISOString();
      else if (expiryPreset === '48h') calculatedExpiresAt = new Date(now + 48 * 3600 * 1000).toISOString();
      else if (expiryPreset === '7d') calculatedExpiresAt = new Date(now + 7 * 24 * 3600 * 1000).toISOString();
      else if (expiryPreset === '30d') calculatedExpiresAt = new Date(now + 30 * 24 * 3600 * 1000).toISOString();
      else if (expiryPreset === 'custom') {
        const days = parseInt(customDays, 10) || 1;
        calculatedExpiresAt = new Date(now + days * 24 * 3600 * 1000).toISOString();
      }
    }

    await addStockKeys(selectedProdForKeys, detectedDepositKeys, calculatedExpiresAt);
    setKeysInput('');
    setHasExpiry(false);
    setSelectedProdForKeys(null);
  };

  // Stock counts across catalog
  const validProducts = useMemo<Product[]>(() => {
    return products.filter((p): p is Product => Boolean(p && typeof p.name === 'string' && p.name.trim().length > 0));
  }, [products]);

  const outOfStockCount = validProducts.filter((p) => (p.stockKeys?.length || 0) === 0).length;
  const lowStockCount = validProducts.filter((p) => {
    const c = p.stockKeys?.length || 0;
    return c > 0 && c <= (p.lowStockThreshold ?? 2);
  }).length;
  const inStockCount = validProducts.filter((p) => (p.stockKeys?.length || 0) > (p.lowStockThreshold ?? 2)).length;

  const filtered = validProducts.filter((p) => {
    const pName = (p.name || '').toLowerCase();
    const pCat = (p.category || '').toLowerCase();
    const query = (searchQuery || '').toLowerCase();
    const matchesSearch = pName.includes(query) || pCat.includes(query);
    if (!matchesSearch) return false;

    const count = p.stockKeys?.length || 0;
    if (stockFilter === 'out') return count === 0;
    if (stockFilter === 'low') return count > 0 && count <= (p.lowStockThreshold ?? 2);
    if (stockFilter === 'in') return count > (p.lowStockThreshold ?? 2);
    return true;
  });

  const targetProd = validProducts.find((p) => p.id === selectedProdForKeys);

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="p-4 sm:p-6 rounded-2xl glass-panel border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-400 mb-1">
            <Package className="w-3.5 h-3.5" />
            <span>PRODUCTS & VAULT</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">Digital Products Catalog</h1>
          <p className="text-xs text-slate-400">
            Stock géré par article (1 lien = 1 article en stock) avec alerte de rupture et validité.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openStockImportModal}
            className="flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-blue-500/40 text-blue-300 hover:text-white px-3.5 py-3 rounded-xl text-xs font-bold active:scale-95 transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-blue-400" />
            <span>+ Import Stock (CSV/Paste)</span>
          </button>

          <button
            type="button"
            onClick={openProductModal}
            className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white px-4 py-3 rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create</span>
          </button>
        </div>
      </div>

      {/* Stock Alerts Overview & Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setStockFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
            stockFilter === 'all'
              ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30'
              : 'bg-slate-950 text-slate-400 border-white/10 hover:border-white/20'
          }`}
        >
          Tous ({validProducts.length})
        </button>

        <button
          type="button"
          onClick={() => setStockFilter('out')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
            stockFilter === 'out'
              ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-600/30'
              : outOfStockCount > 0
              ? 'bg-red-950/40 text-red-300 border-red-500/30 hover:border-red-500/50'
              : 'bg-slate-950 text-slate-400 border-white/10 hover:border-white/20'
          }`}
        >
          <span>🚨 Rupture de Stock</span>
          <span className="px-1.5 py-0.2 rounded-full bg-red-500/20 text-red-200 text-[10px] font-mono">
            {outOfStockCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStockFilter('low')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
            stockFilter === 'low'
              ? 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-600/30'
              : lowStockCount > 0
              ? 'bg-amber-950/40 text-amber-300 border-amber-500/30 hover:border-amber-500/50'
              : 'bg-slate-950 text-slate-400 border-white/10 hover:border-white/20'
          }`}
        >
          <span>⚠️ Stock Faible</span>
          <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-200 text-[10px] font-mono">
            {lowStockCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStockFilter('in')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
            stockFilter === 'in'
              ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30'
              : 'bg-slate-950 text-slate-400 border-white/10 hover:border-white/20'
          }`}
        >
          <span>✅ En Stock</span>
          <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-200 text-[10px] font-mono">
            {inStockCount}
          </span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
        <input
          type="text"
          placeholder="Search products by title or category..."
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
          const isOutOfStock = keysCount === 0;
          const isLowStock = keysCount > 0 && keysCount <= (prod.lowStockThreshold ?? 2);

          return (
            <div
              key={prod.id}
              className={`p-4 rounded-2xl glass-card border space-y-3 flex flex-col justify-between transition-all ${
                isOutOfStock
                  ? 'border-red-500/30 bg-red-950/5'
                  : isLowStock
                  ? 'border-amber-500/30 bg-amber-950/5'
                  : 'border-white/10'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold">
                    {prod.category}
                  </span>

                  {/* Stock Alert Badge */}
                  {isOutOfStock ? (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-bold animate-pulse">
                      <AlertTriangle className="w-3 h-3" />
                      <span>🚨 RUPTURE (0 item)</span>
                    </span>
                  ) : isLowStock ? (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                      <AlertTriangle className="w-3 h-3" />
                      <span>⚠️ STOCK FAIBLE ({keysCount} restant)</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                      <Check className="w-3 h-3" />
                      <span>✅ EN STOCK ({keysCount} items)</span>
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => deleteProduct(prod.id)}
                    className="p-1 text-slate-400 hover:text-red-400 transition-colors cursor-pointer ml-auto"
                    title="Delete product"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h3 className="text-base font-bold text-white leading-tight">
                  {prod.name}
                </h3>
                {prod.description && (
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                    {prod.description}
                  </p>
                )}

                {/* Default Pricing Breakdown */}
                <div className="grid grid-cols-2 gap-2 mt-3 p-2.5 rounded-xl bg-slate-950/70 border border-white/5 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Default Sell</span>
                    <span className="font-bold text-white">
                      {prod.defaultSellingDzd.toLocaleString()} DA
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Default Cost</span>
                    <span className="font-bold text-slate-300">
                      ${prod.defaultCostUsd}{' '}
                      <span className="text-[10px] text-slate-400">({costDzd} DA)</span>
                    </span>
                  </div>
                </div>

                {/* Margin pill */}
                <div className="flex items-center justify-between mt-2 px-1 text-[11px]">
                  <span className="text-slate-400">Projected Margin:</span>
                  <span className="font-extrabold text-emerald-400">
                    +{profitDzd.toLocaleString()} DA ({margin}%)
                  </span>
                </div>
              </div>

              {/* Stock Items / Links Section (1 link = 1 stock item) */}
              <div className="pt-3 border-t border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                    <Key className="w-3.5 h-3.5 text-blue-400" />
                    <span>Stock Disponible</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                        keysCount > 0
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-red-500/20 text-red-300'
                      }`}
                    >
                      {keysCount} {keysCount <= 1 ? 'item' : 'items'} ({keysCount} {keysCount <= 1 ? 'lien' : 'liens'})
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedProdForKeys(prod.id)}
                    className="text-xs text-blue-400 hover:text-blue-300 font-bold cursor-pointer hover:underline"
                  >
                    + Ajouter Liens
                  </button>
                </div>

                {keysCount > 0 ? (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {prod.stockKeys.slice(0, 4).map((k, idx) => {
                      // Find matched stockItem with expiry
                      const stockItem = prod.stockItems?.find((item) => item.keyOrLink === k);
                      const isExpired = stockItem?.expiresAt && new Date(stockItem.expiresAt).getTime() < Date.now();
                      const expiryLabel = stockItem?.expiresAt
                        ? new Date(stockItem.expiresAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                          })
                        : null;

                      return (
                        <div
                          key={idx}
                          className="p-1.5 rounded-lg bg-slate-950 border border-white/5 flex items-center justify-between text-[11px] font-mono text-emerald-300 gap-2"
                        >
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            <span className="text-[10px] font-bold text-slate-500 shrink-0">
                              #{idx + 1}
                            </span>
                            <span className="truncate">{k}</span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {expiryLabel && (
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-sans font-bold flex items-center gap-1 ${
                                  isExpired
                                    ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                    : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                }`}
                              >
                                <Clock className="w-2.5 h-2.5" />
                                <span>{isExpired ? 'Expiré' : `Exp: ${expiryLabel}`}</span>
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={() => handleCopy(k)}
                              className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/10 cursor-pointer"
                              title="Copier le lien"
                            >
                              {copiedKey === k ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {keysCount > 4 && (
                      <span className="text-[10px] text-slate-500 block text-center pt-0.5 font-medium">
                        +{keysCount - 4} autres articles/liens dans le stock
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-red-950/20 border border-red-500/20 text-[11px] text-red-300/90 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      <span>Rupture de stock : 0 lien disponible.</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedProdForKeys(prod.id)}
                      className="text-xs font-bold text-blue-400 hover:text-blue-300 underline cursor-pointer"
                    >
                      Déposer des liens
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Deposit Keys Modal with Expiration Controls & 1 Link = 1 Stock Item */}
      {selectedProdForKeys && targetProd && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-t-3xl sm:rounded-2xl p-5 space-y-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    Ajouter des Liens au Stock
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {targetProd.name} • 1 lien = 1 article en stock
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProdForKeys(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Rule reminder */}
            <div className="p-2.5 rounded-xl bg-blue-950/30 border border-blue-500/20 text-[11px] text-blue-300 flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-400 shrink-0" />
              <span>
                <strong>1 ligne = 1 article de stock</strong> (Ex: 4 liens collés = 4 articles ajoutés au stock).
              </span>
            </div>

            {/* Textarea */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  Liens d&apos;activation / Clés (1 par ligne) *
                </label>
                <span className="text-[10px] text-emerald-400 font-mono font-bold">
                  {detectedDepositKeys.length} {detectedDepositKeys.length <= 1 ? 'article' : 'articles'} détecté(s)
                </span>
              </div>
              <textarea
                rows={4}
                required
                placeholder="Collez les liens d'invitation ou clés (un par ligne):&#10;https://canva.com/brand/join?token=abc1&#10;https://canva.com/brand/join?token=abc2"
                value={keysInput}
                onChange={(e) => setKeysInput(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-xs font-mono text-emerald-300 focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>

            {/* Optional Expiration Selector */}
            <div className="p-3 rounded-xl bg-slate-950 border border-indigo-500/20 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Date d&apos;expiration optionnelle</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasExpiry}
                    onChange={(e) => setHasExpiry(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4.5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {hasExpiry && (
                <div className="space-y-2 pt-1 animate-fade-in">
                  <div className="grid grid-cols-5 gap-1.5 text-center">
                    {(['24h', '48h', '7d', '30d', 'custom'] as const).map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setExpiryPreset(preset)}
                        className={`py-1.5 px-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                          expiryPreset === preset
                            ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                            : 'bg-slate-900 text-slate-400 border-white/10 hover:border-white/20'
                        }`}
                      >
                        {preset === '24h'
                          ? '24h'
                          : preset === '48h'
                          ? '48h'
                          : preset === '7d'
                          ? '7 Jours'
                          : preset === '30d'
                          ? '30 Jours'
                          : 'Custom'}
                      </button>
                    ))}
                  </div>

                  {expiryPreset === 'custom' && (
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="number"
                        inputMode="numeric"
                        min="1"
                        placeholder="Nombre de jours..."
                        value={customDays}
                        onChange={(e) => setCustomDays(e.target.value)}
                        className="w-full bg-slate-900 border border-indigo-500/40 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-400"
                      />
                      <span className="text-xs font-semibold text-slate-400 shrink-0">jours</span>
                    </div>
                  )}

                  <p className="text-[10px] text-indigo-300/80">
                    Ces liens seront marqués avec leur date d&apos;expiration pour éviter les liens périmés.
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setSelectedProdForKeys(null)}
                className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={detectedDepositKeys.length === 0}
                onClick={handleDepositKeys}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all ${
                  detectedDepositKeys.length > 0
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30 active:scale-95'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                Déposer {detectedDepositKeys.length > 0 ? `${detectedDepositKeys.length} Articles` : 'des Liens'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
