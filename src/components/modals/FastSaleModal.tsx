'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useCRMData } from '@/context/CRMDataContext';
import { useCurrency } from '@/context/CurrencyContext';
import { PartnerName, PaymentMethod } from '@/types/crm';
import { calculateSaleNetProfit, convertUsdToDzd, parseNumericInput, formatSignedProfit } from '@/lib/calculations';
import {
  X,
  ShoppingBag,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Sparkles,
  UserCheck,
  Key,
  ShieldAlert,
} from 'lucide-react';

interface FastSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FastSaleModal({ isOpen, onClose }: FastSaleModalProps) {
  const { products, addSale, activePartner } = useCRMData();
  const { exchangeRate } = useCurrency();

  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [customProductName, setCustomProductName] = useState('');
  const [sellingPriceDzd, setSellingPriceDzd] = useState<string>('1800');
  const [productCostUsd, setProductCostUsd] = useState<string>('4.00');
  const [metaAdCostUsd, setMetaAdCostUsd] = useState<string>('1.50');
  const [soldBy, setSoldBy] = useState<PartnerName>(activePartner);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('baridimob');

  // Key vault delivery
  const [deliverKeyFromVault, setDeliverKeyFromVault] = useState<boolean>(true);
  const [deliveredKey, setDeliveredKey] = useState('');

  // Optional fields
  const [showOptional, setShowOptional] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form state when modal opens
  const initializeForm = useCallback(() => {
    setSoldBy(activePartner);
    setShowOptional(false);
    setCustomerName('');
    setCustomerPhone('');
    setNotes('');

    if (products.length > 0) {
      const first = products[0];
      setSelectedProductId(first.id);
      setCustomProductName('');
      setSellingPriceDzd(first.defaultSellingDzd.toString());
      setProductCostUsd(first.defaultCostUsd.toString());
      setMetaAdCostUsd('1.50');

      if (first.stockKeys && first.stockKeys.length > 0) {
        setDeliverKeyFromVault(true);
        setDeliveredKey(first.stockKeys[0]);
      } else {
        setDeliverKeyFromVault(false);
        setDeliveredKey('');
      }
    } else {
      setSelectedProductId('custom');
      setCustomProductName('');
      setSellingPriceDzd('1800');
      setProductCostUsd('4.00');
      setMetaAdCostUsd('1.50');
      setDeliverKeyFromVault(false);
      setDeliveredKey('');
    }
  }, [activePartner, products]);

  useEffect(() => {
    if (isOpen) {
      initializeForm();
    }
  }, [isOpen, initializeForm]);

  if (!isOpen) return null;

  const currentProduct = products.find((p) => p.id === selectedProductId);
  const hasStockKeys = Boolean(currentProduct?.stockKeys && currentProduct.stockKeys.length > 0);
  const availableKeysCount = currentProduct?.stockKeys?.length || 0;

  const handleProductSelect = (prodId: string) => {
    setSelectedProductId(prodId);
    if (prodId === 'custom') {
      setCustomProductName('');
      setDeliverKeyFromVault(false);
      setDeliveredKey('');
      return;
    }
    const p = products.find((item) => item.id === prodId);
    if (p) {
      setSellingPriceDzd(p.defaultSellingDzd.toString());
      setProductCostUsd(p.defaultCostUsd.toString());
      if (p.stockKeys && p.stockKeys.length > 0) {
        setDeliverKeyFromVault(true);
        setDeliveredKey(p.stockKeys[0]);
      } else {
        setDeliverKeyFromVault(false);
        setDeliveredKey('');
      }
    }
  };

  // Real-time calculation with safe numeric parsing (handling commas e.g. "4,50")
  const parsedPriceDzd = parseNumericInput(sellingPriceDzd);
  const parsedProductCostUsd = parseNumericInput(productCostUsd);
  const parsedMetaAdUsd = parseNumericInput(metaAdCostUsd);

  const { netProfitDzd, netProfitUsd, marginPercent } = calculateSaleNetProfit(
    parsedPriceDzd,
    parsedProductCostUsd,
    parsedMetaAdUsd,
    exchangeRate
  );

  const productCostDzd = convertUsdToDzd(parsedProductCostUsd, exchangeRate);
  const metaAdCostDzd = convertUsdToDzd(parsedMetaAdUsd, exchangeRate);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    if (parsedPriceDzd <= 0) {
      alert('Please enter a valid selling price in DA.');
      return;
    }

    setIsSubmitting(true);

    try {
      let finalName = '';
      if (selectedProductId === 'custom') {
        finalName = customProductName.trim() || 'Digital Product';
      } else {
        finalName = currentProduct ? currentProduct.name : 'Digital Product';
      }

      const finalKey = deliverKeyFromVault && deliveredKey.trim() ? deliveredKey.trim() : undefined;

      await addSale({
        productName: finalName,
        productId: selectedProductId !== 'custom' ? selectedProductId : undefined,
        sellingPriceDzd: parsedPriceDzd,
        productCostUsd: parsedProductCostUsd,
        metaAdCostUsd: parsedMetaAdUsd,
        soldBy,
        paymentMethod,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        deliveredKey: finalKey,
        notes: notes.trim() || undefined,
      });

      onClose();
    } catch (err) {
      console.error('Failed to add sale:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[88vh] overflow-hidden">
        {/* Sticky Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-slate-900/95 backdrop-blur shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white leading-tight">Log Digital Sale</h2>
              <p className="text-[11px] text-slate-400">Track price, sourcing cost & Meta ads</p>
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

        {/* Scrollable Form Body with Momentum Scrolling */}
        <form
          id="sale-form"
          onSubmit={handleSubmit}
          className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 overscroll-contain"
        >
          {/* Partner Selector (Adem vs Abdou) */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Sold By *
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setSoldBy('Adem')}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all border cursor-pointer flex items-center justify-center gap-1.5 ${
                  soldBy === 'Adem'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30 ring-2 ring-blue-400/40'
                    : 'bg-slate-950 text-slate-400 border-white/10 hover:border-white/20'
                }`}
              >
                {soldBy === 'Adem' && <UserCheck className="w-3.5 h-3.5" />}
                <span>Adem</span>
              </button>
              <button
                type="button"
                onClick={() => setSoldBy('Abdou')}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all border cursor-pointer flex items-center justify-center gap-1.5 ${
                  soldBy === 'Abdou'
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400/40'
                    : 'bg-slate-950 text-slate-400 border-white/10 hover:border-white/20'
                }`}
              >
                {soldBy === 'Abdou' && <UserCheck className="w-3.5 h-3.5" />}
                <span>Abdou</span>
              </button>
            </div>
          </div>

          {/* Product Selection */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Digital Product *
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => handleProductSelect(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-3 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.defaultSellingDzd.toLocaleString()} DA • ${p.defaultCostUsd})
                </option>
              ))}
              <option value="custom">✏️ Enter custom product title...</option>
            </select>

            {selectedProductId === 'custom' && (
              <input
                type="text"
                required
                placeholder="Type digital product title..."
                value={customProductName}
                onChange={(e) => setCustomProductName(e.target.value)}
                className="w-full bg-slate-950 border border-blue-500/50 rounded-xl px-3.5 py-2.5 text-xs text-white mt-2 focus:outline-none focus:border-blue-500"
              />
            )}
          </div>

          {/* Key Vault Delivery Status (if product has stock) */}
          {selectedProductId !== 'custom' && (
            <div className="p-3 rounded-xl bg-slate-950 border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                  <Key className="w-3.5 h-3.5 text-emerald-400" />
                  <span>License Key Vault</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                      hasStockKeys ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                    }`}
                  >
                    {availableKeysCount} in stock
                  </span>
                </div>

                {hasStockKeys && (
                  <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={deliverKeyFromVault}
                      onChange={(e) => setDeliverKeyFromVault(e.target.checked)}
                      className="rounded border-white/20 text-emerald-600 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-[11px] text-slate-300">Deliver Key</span>
                  </label>
                )}
              </div>

              {hasStockKeys && deliverKeyFromVault && (
                <input
                  type="text"
                  value={deliveredKey}
                  onChange={(e) => setDeliveredKey(e.target.value)}
                  placeholder="Key to deliver..."
                  className="w-full bg-slate-900 border border-emerald-500/30 rounded-lg px-2.5 py-1.5 text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-500"
                />
              )}
            </div>
          )}

          {/* Selling Price (DA) */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
              Selling Price (DA) *
            </label>
            <div className="relative">
              <input
                type="number"
                inputMode="numeric"
                step="any"
                required
                value={sellingPriceDzd}
                onChange={(e) => setSellingPriceDzd(e.target.value)}
                placeholder="e.g. 1800"
                className="w-full bg-slate-950 border border-white/10 rounded-xl pl-3.5 pr-12 py-2.5 text-base font-bold text-white focus:outline-none focus:border-emerald-500"
              />
              <span className="absolute right-3.5 top-3 text-xs font-bold text-slate-400">DA</span>
            </div>
          </div>

          {/* Sourcing Cost & Meta Ad Cost (2-Column Grid on Mobile) */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {/* Product Purchase Cost */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                Product Cost ($) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-bold">$</span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min="0"
                  required
                  value={productCostUsd}
                  onChange={(e) => setProductCostUsd(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl pl-7 pr-3 py-2 text-xs sm:text-sm font-semibold text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block truncate">
                ≈ {productCostDzd.toLocaleString()} DA
              </span>
            </div>

            {/* Meta Ad Cost */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                Meta Ad Cost ($) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-bold">$</span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min="0"
                  required
                  value={metaAdCostUsd}
                  onChange={(e) => setMetaAdCostUsd(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl pl-7 pr-3 py-2 text-xs sm:text-sm font-semibold text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block truncate">
                ≈ {metaAdCostDzd.toLocaleString()} DA
              </span>
            </div>
          </div>

          {/* LIVE NET PROFIT PREVIEW CARD */}
          <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-950/50 via-slate-950 to-slate-900 border border-emerald-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 font-semibold block">Net Profit:</span>
                <div className={`text-sm sm:text-base font-black truncate ${netProfitDzd >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatSignedProfit(netProfitDzd, 'DZD')}{' '}
                  <span className="text-[11px] text-slate-400 font-normal">
                    ({formatSignedProfit(netProfitDzd, 'USD', netProfitUsd)})
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] text-slate-400 block">Margin</span>
              <div className={`text-xs sm:text-sm font-black ${marginPercent >= 35 ? 'text-emerald-400' : marginPercent > 0 ? 'text-amber-400' : 'text-red-400'}`}>
                {marginPercent}%
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Payment Method
            </label>
            <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
              {(['baridimob', 'ccp', 'paysera', 'wise', 'cash'] as PaymentMethod[]).map((pm) => (
                <button
                  type="button"
                  key={pm}
                  onClick={() => setPaymentMethod(pm)}
                  className={`py-2 px-1 rounded-xl text-[10px] sm:text-xs font-bold capitalize border transition-all cursor-pointer text-center truncate ${
                    paymentMethod === pm
                      ? 'bg-blue-600 text-white border-blue-500 shadow-sm ring-1 ring-blue-400/50'
                      : 'bg-slate-950 text-slate-400 border-white/10 hover:border-white/20'
                  }`}
                >
                  {pm === 'baridimob' ? 'Baridi' : pm}
                </button>
              ))}
            </div>
          </div>

          {/* Toggle Optional Customer Details */}
          <button
            type="button"
            onClick={() => setShowOptional(!showOptional)}
            className="flex items-center justify-between w-full py-2.5 text-xs font-semibold text-slate-400 hover:text-slate-200 border-t border-white/5 cursor-pointer"
          >
            <span>Optional Customer Info & Notes</span>
            {showOptional ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {/* Optional Accordion */}
          {showOptional && (
            <div className="space-y-3 pt-1 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Customer Name (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Karim"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Phone / WhatsApp (Optional)</label>
                  <input
                    type="tel"
                    inputMode="tel"
                    placeholder="0550... / 06... / 07..."
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Sale Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. BaridiMob receipt validated"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}
        </form>

        {/* Sticky Modal Footer with Confirm & Save Button */}
        <div className="p-4 border-t border-white/10 bg-slate-900/95 backdrop-blur shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-black text-sm shadow-xl shadow-emerald-600/30 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>{isSubmitting ? 'Saving Sale...' : 'Confirm & Save Sale'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
