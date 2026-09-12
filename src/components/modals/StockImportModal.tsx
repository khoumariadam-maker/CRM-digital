'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useCRMData } from '@/context/CRMDataContext';
import { useCurrency } from '@/context/CurrencyContext';
import { parseNumericInput, convertUsdToDzd, formatSignedProfit } from '@/lib/calculations';
import {
  X,
  FileSpreadsheet,
  ClipboardPaste,
  Upload,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Clock,
  Package,
} from 'lucide-react';

interface StockImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ExpiryPreset = '24h' | '48h' | '7d' | '30d' | 'custom';

export default function StockImportModal({ isOpen, onClose }: StockImportModalProps) {
  const { products, addProduct, addStockKeys } = useCRMData();
  const { exchangeRate } = useCurrency();

  // 1. All hooks called unconditionally at top level (React Rules of Hooks compliant)
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
  const [newProductName, setNewProductName] = useState<string>('');
  const [newProductCategory, setNewProductCategory] = useState<string>('AI Tools');
  const [sellingPriceDzd, setSellingPriceDzd] = useState<string>('1400');
  const [purchaseCostUsd, setPurchaseCostUsd] = useState<string>('0');
  const [rawText, setRawText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Link Expiration state
  const [hasExpiration, setHasExpiration] = useState<boolean>(false);
  const [expiryPreset, setExpiryPreset] = useState<ExpiryPreset>('24h');
  const [customDays, setCustomDays] = useState<string>('14');

  // Initialize or synchronize default prices when selection changes
  useEffect(() => {
    if (products.length > 0 && !selectedProductId) {
      const first = products[0];
      setSelectedProductId(first.id);
      setSellingPriceDzd(first.defaultSellingDzd.toString());
      setPurchaseCostUsd(first.defaultCostUsd.toString());
      setIsCreatingNew(false);
    }
  }, [products, selectedProductId]);

  const handleProductSelect = (id: string) => {
    if (id === 'NEW') {
      setIsCreatingNew(true);
      setSelectedProductId('NEW');
      setNewProductName('');
      setSellingPriceDzd('1400');
      setPurchaseCostUsd('0');
      return;
    }

    setIsCreatingNew(false);
    setSelectedProductId(id);
    const prod = products.find((p) => p.id === id);
    if (prod) {
      setSellingPriceDzd(prod.defaultSellingDzd.toString());
      setPurchaseCostUsd(prod.defaultCostUsd.toString());
    }
  };

  // 1-Tap Clipboard paste
  const handlePasteFromClipboard = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (clipText && clipText.trim()) {
        setRawText(clipText.trim());
      }
    } catch (err) {
      console.warn('Clipboard read error (fallback to manual paste):', err);
    }
  };

  // CSV / TXT File upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setRawText(content);
      }
    };
    reader.readAsText(file);
  };

  // Extract cleaned list of keys/links from the uploaded text (1 link = 1 stock item)
  const extractedKeys = useMemo(() => {
    if (!rawText || !rawText.trim()) return [];
    return rawText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith('#'))
      .filter((line, idx, self) => self.indexOf(line) === idx); // deduplicate batch
  }, [rawText]);

  // Compute calculated expiration date
  const calculatedExpiresAt = useMemo(() => {
    if (!hasExpiration) return undefined;
    const now = Date.now();
    if (expiryPreset === '24h') return new Date(now + 24 * 3600 * 1000).toISOString();
    if (expiryPreset === '48h') return new Date(now + 48 * 3600 * 1000).toISOString();
    if (expiryPreset === '7d') return new Date(now + 7 * 24 * 3600 * 1000).toISOString();
    if (expiryPreset === '30d') return new Date(now + 30 * 24 * 3600 * 1000).toISOString();
    if (expiryPreset === 'custom') {
      const days = parseInt(customDays, 10) || 1;
      return new Date(now + days * 24 * 3600 * 1000).toISOString();
    }
    return undefined;
  }, [hasExpiration, expiryPreset, customDays]);

  // Pricing calculations
  const parsedSellDzd = parseNumericInput(sellingPriceDzd);
  const parsedCostUsd = parseNumericInput(purchaseCostUsd);
  const costDzd = convertUsdToDzd(parsedCostUsd, exchangeRate);
  const unitProfitDzd = parsedSellDzd - costDzd;
  const margin = parsedSellDzd > 0 ? Math.round((unitProfitDzd / parsedSellDzd) * 100) : 0;
  const totalStockGrossDzd = parsedSellDzd * extractedKeys.length;
  const totalProfitDzd = unitProfitDzd * extractedKeys.length;

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const selectedProductStockCount = selectedProduct?.stockKeys?.length || 0;

  // Form submit handler
  const handleConfirmImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (extractedKeys.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (isCreatingNew) {
        const name = newProductName.trim() || 'New Digital Product';
        await addProduct({
          name,
          category: newProductCategory,
          defaultSellingDzd: parsedSellDzd,
          defaultCostUsd: parsedCostUsd,
          stockKeys: extractedKeys,
          stockItems: extractedKeys.map((k, i) => ({
            id: `item-${Date.now()}-${i}`,
            keyOrLink: k,
            addedAt: new Date().toISOString(),
            ...(calculatedExpiresAt ? { expiresAt: calculatedExpiresAt } : {}),
          })),
        });
      } else if (selectedProductId) {
        await addStockKeys(selectedProductId, extractedKeys, calculatedExpiresAt);
      }

      setRawText('');
      onClose();
    } catch (err) {
      console.error('Stock import failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Conditional render occurs AFTER all hooks have executed
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[88vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-slate-900/95 backdrop-blur shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white leading-tight">
                Import Stock & Set Pricing
              </h2>
              <p className="text-[11px] text-slate-400">
                1 Link = 1 Stock Item • Expiration & Pricing Controls
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <form
          id="stock-import-form"
          onSubmit={handleConfirmImport}
          className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1"
        >
          {/* 1. Target Product Selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
              Select or Create Product *
            </label>
            <select
              value={isCreatingNew ? 'NEW' : selectedProductId}
              onChange={(e) => handleProductSelect(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              {products
                .filter((p) => p && typeof p.name === 'string' && p.name.trim().length > 0)
                .map((p) => {
                  const count = p.stockKeys?.length || 0;
                  const statusTag =
                    count === 0
                      ? '🚨 RUPTURE (0 item)'
                      : count <= (p.lowStockThreshold ?? 2)
                      ? `⚠️ FAIBLE (${count} items)`
                      : `✅ (${count} items)`;
                  return (
                    <option key={p.id} value={p.id}>
                      {p.name} — [{statusTag}]
                    </option>
                  );
                })}
              <option value="NEW">✨ + Create New Product & Deposit Links</option>
            </select>
          </div>

          {/* Current Stock Banner when selecting existing product */}
          {!isCreatingNew && selectedProduct && (
            <div
              className={`p-2.5 rounded-xl border text-xs flex items-center justify-between animate-fade-in ${
                selectedProductStockCount === 0
                  ? 'bg-red-950/30 border-red-500/30 text-red-300'
                  : selectedProductStockCount <= (selectedProduct.lowStockThreshold ?? 2)
                  ? 'bg-amber-950/30 border-amber-500/30 text-amber-300'
                  : 'bg-emerald-950/20 border-emerald-500/20 text-emerald-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>
                  <strong>État Actuel :</strong>{' '}
                  {selectedProductStockCount === 0
                    ? '🚨 Rupture complète (0 lien disponible)'
                    : selectedProductStockCount <= (selectedProduct.lowStockThreshold ?? 2)
                    ? `⚠️ Stock critique (${selectedProductStockCount} lien(s) restant(s))`
                    : `✅ Stock approvisionné (${selectedProductStockCount} liens)`}
                </span>
              </div>
              <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/10">
                1 lien = 1 article
              </span>
            </div>
          )}

          {/* New Product Name & Category if creating new */}
          {isCreatingNew && (
            <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-blue-950/20 border border-blue-500/30 animate-fade-in">
              <div className="col-span-2">
                <label className="block text-[10px] font-bold uppercase text-blue-300 mb-1">
                  Product Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Canva Pro 1 Year, NordVPN..."
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  className="w-full bg-slate-950 border border-blue-500/40 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-blue-300 mb-1">
                  Category
                </label>
                <select
                  value={newProductCategory}
                  onChange={(e) => setNewProductCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-blue-500/40 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="Software">Software</option>
                  <option value="OS Keys">OS Keys</option>
                  <option value="Streaming">Streaming</option>
                  <option value="AI Tools">AI Tools</option>
                  <option value="VPN">VPN</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          )}

          {/* 2. Selling Price & Purchase Cost Fields */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 p-3.5 rounded-2xl bg-slate-950 border border-white/10">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                Selling Price (DA) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  inputMode="numeric"
                  step="any"
                  min="0"
                  required
                  placeholder="e.g. 1800"
                  value={sellingPriceDzd}
                  onChange={(e) => setSellingPriceDzd(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl pl-3 pr-10 py-2 text-sm sm:text-base font-bold text-white focus:outline-none focus:border-emerald-500"
                />
                <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">DA</span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                Purchase Cost ($) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 text-xs font-bold">$</span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min="0"
                  required
                  placeholder="e.g. 4.00"
                  value={purchaseCostUsd}
                  onChange={(e) => setPurchaseCostUsd(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl pl-7 pr-3 py-2 text-sm sm:text-base font-bold text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block truncate">
                ≈ {costDzd.toLocaleString()} DA (Rate: {exchangeRate})
              </span>
            </div>

            {/* Margin simulator bar */}
            <div className="col-span-2 pt-2 border-t border-white/5 flex items-center justify-between text-xs">
              <span className="text-slate-400">Unit Profit per Item:</span>
              <span className="font-extrabold text-emerald-400">
                {formatSignedProfit(unitProfitDzd, 'DZD')} ({margin}% margin)
              </span>
            </div>
          </div>

          {/* 3. Link Expiration Settings (Optional 24h, 48h, 7d, 30d, or Custom) */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-indigo-500/20 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span>Optional Link Expiration (Durée de validité)</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasExpiration}
                  onChange={(e) => setHasExpiration(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {hasExpiration && (
              <div className="space-y-2 pt-1 animate-fade-in">
                <div className="grid grid-cols-5 gap-1.5 text-center">
                  {(['24h', '48h', '7d', '30d', 'custom'] as ExpiryPreset[]).map((preset) => (
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
                  Les liens recevront un badge de validité dans le coffre pour prévenir l&apos;expiration.
                </p>
              </div>
            )}
          </div>

          {/* 4. CSV File Upload & 1-Tap Paste Actions */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handlePasteFromClipboard}
              className="py-2.5 px-3 rounded-xl bg-slate-950 border border-blue-500/40 hover:border-blue-400 text-blue-300 hover:text-white text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
            >
              <ClipboardPaste className="w-4 h-4 text-blue-400" />
              <span>Paste from Clipboard</span>
            </button>

            <label className="py-2.5 px-3 rounded-xl bg-slate-950 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer">
              <Upload className="w-4 h-4 text-slate-400" />
              <span>Choose CSV File</span>
              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* 5. Textarea for Links */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                Activation Links (1 per line = 1 Stock Item) *
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                {extractedKeys.length} items detected
              </span>
            </div>
            <textarea
              rows={4}
              required
              placeholder="Paste activation links or tokens (one per line):&#10;https://canva.com/brand/join?token=abc1&#10;https://canva.com/brand/join?token=abc2"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-xs font-mono text-emerald-300 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* 6. Live Stock Preview Summary (1 link = 1 stock item) */}
          {extractedKeys.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 space-y-2 text-xs animate-fade-in">
              <div className="flex items-center justify-between text-emerald-300 font-bold">
                <span className="flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-emerald-400" />
                  <span>
                    {extractedKeys.length} Articles en Stock ({extractedKeys.length} liens = {extractedKeys.length} items)
                  </span>
                </span>
                <span className="text-white font-black">{totalStockGrossDzd.toLocaleString()} DA Gross</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-emerald-500/10 pt-1.5">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-indigo-400" />
                  <span>
                    {hasExpiration
                      ? `Validité : Expire après ${expiryPreset === 'custom' ? `${customDays} jours` : expiryPreset}`
                      : 'Validité : Permanente (Aucune expiration)'}
                  </span>
                </span>
                <span className="font-extrabold text-emerald-400">
                  +{totalProfitDzd.toLocaleString()} DA Marge Potentielle
                </span>
              </div>
            </div>
          )}
        </form>

        {/* Sticky Action Footer */}
        <div className="p-4 border-t border-white/10 bg-slate-900/95 backdrop-blur shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            type="submit"
            form="stock-import-form"
            disabled={extractedKeys.length === 0 || isSubmitting}
            className={`w-full py-3.5 rounded-xl font-bold text-sm shadow-xl active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer ${
              extractedKeys.length > 0
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            <span>
              {isSubmitting
                ? 'Saving...'
                : extractedKeys.length > 0
                ? `Déposer ${extractedKeys.length} Articles (${extractedKeys.length} Liens) & Enregistrer`
                : 'Uploadez ou collez des liens pour continuer'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
