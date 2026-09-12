'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useCRMData } from '@/context/CRMDataContext';
import { useCurrency } from '@/context/CurrencyContext';
import { PartnerName, PaymentMethod, PaymentStatus } from '@/types/crm';
import { convertUsdToDzd, parseNumericInput, formatSignedProfit } from '@/lib/calculations';
import {
  X,
  ShoppingBag,
  ChevronDown,
  ChevronUp,
  Sparkles,
  UserCheck,
  Key,
  Clock,
  CheckCircle2,
  AlertTriangle,
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
  const [sellingPriceDzd, setSellingPriceDzd] = useState<string>('1400');
  const [productCostUsd, setProductCostUsd] = useState<string>('0');
  const [soldBy, setSoldBy] = useState<PartnerName>(activePartner);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('baridimob');

  // Upcoming Payment / Pay Later
  const [isPayLater, setIsPayLater] = useState<boolean>(false);
  const [pendingNote, setPendingNote] = useState('');

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
    setIsPayLater(false);
    setPendingNote('');
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
      setSellingPriceDzd('1400');
      setProductCostUsd('0');
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
  const isOutOfStock = Boolean(currentProduct && availableKeysCount === 0);
  const isLowStock = Boolean(
    currentProduct && availableKeysCount > 0 && availableKeysCount <= (currentProduct.lowStockThreshold ?? 2)
  );

  // Check expiration of the selected/delivered key
  const deliveredStockItem = currentProduct?.stockItems?.find((it) => it.keyOrLink === deliveredKey);
  const isDeliveredExpired = Boolean(
    deliveredStockItem?.expiresAt && new Date(deliveredStockItem.expiresAt).getTime() < Date.now()
  );
  const deliveredExpiryDate = deliveredStockItem?.expiresAt
    ? new Date(deliveredStockItem.expiresAt).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

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

  // Real-time calculation of Unit Gross Profit
  const parsedPriceDzd = parseNumericInput(sellingPriceDzd);
  const parsedProductCostUsd = parseNumericInput(productCostUsd);
  const productCostDzd = convertUsdToDzd(parsedProductCostUsd, exchangeRate);
  const unitGrossProfitDzd = parsedPriceDzd - productCostDzd;
  const marginPercent = parsedPriceDzd > 0 ? Math.round((unitGrossProfitDzd / parsedPriceDzd) * 100) : 0;

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

      const finalKey = deliveredKey.trim() ? deliveredKey.trim() : undefined;

      await addSale({
        productName: finalName,
        productId: selectedProductId !== 'custom' ? selectedProductId : undefined,
        sellingPriceDzd: parsedPriceDzd,
        productCostUsd: parsedProductCostUsd,
        soldBy,
        paymentMethod,
        paymentStatus: isPayLater ? 'pending' : 'paid',
        pendingNote: isPayLater && pendingNote.trim() ? pendingNote.trim() : undefined,
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

  const paymentMethods: { id: PaymentMethod; label: string; badge: string }[] = [
    { id: 'baridimob', label: 'BaridiMob', badge: 'bg-amber-500/10 text-amber-300 border-amber-500/30' },
    { id: 'ccp', label: 'CCP', badge: 'bg-blue-500/10 text-blue-300 border-blue-500/30' },
    { id: 'banque', label: 'Banque', badge: 'bg-purple-500/10 text-purple-300 border-purple-500/30' },
    { id: 'redotpay', label: 'RedotPay', badge: 'bg-rose-500/10 text-rose-300 border-rose-500/30' },
    { id: 'binance', label: 'Binance', badge: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30' },
    { id: 'cash', label: 'Cash', badge: 'bg-slate-500/10 text-slate-300 border-slate-500/30' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[88vh] overflow-hidden">
        {/* Sticky Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-slate-900/95 backdrop-blur shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white leading-tight">Log Digital Sale</h2>
              <p className="text-[11px] text-slate-400">Fast 3-second recording for Adem & Abdou</p>
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
              {products.map((p) => {
                const stock = p.stockKeys?.length || 0;
                const statusTag =
                  stock === 0
                    ? '🚨 RUPTURE (0 item)'
                    : stock <= (p.lowStockThreshold ?? 2)
                    ? `⚠️ FAIBLE (${stock} items)`
                    : `✅ (${stock} items)`;
                return (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.defaultSellingDzd.toLocaleString()} DA) — [{statusTag}]
                  </option>
                );
              })}
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

          {/* Key Vault Delivery Status (1 link = 1 stock item) */}
          {selectedProductId !== 'custom' && (
            <div className="p-3 rounded-xl bg-slate-950 border border-white/5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                  <Key className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Activation Link (1 lien = 1 article)</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                      availableKeysCount > 0
                        ? isLowStock
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-red-500/20 text-red-300'
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
                    <span className="text-[11px] text-slate-300">Auto-Deliver</span>
                  </label>
                )}
              </div>

              {/* Stock Alerts inside Fast Sale */}
              {isOutOfStock && (
                <div className="p-2.5 rounded-xl bg-red-950/30 border border-red-500/30 text-xs text-red-300 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-red-200">🚨 ALERTE RUPTURE DE STOCK</strong>
                    <span>
                      Ce produit n&apos;a aucun lien en stock (0 article). Collez un lien manuellement ci-dessous ou livrez le client ultérieurement.
                    </span>
                  </div>
                </div>
              )}

              {isLowStock && (
                <div className="p-2 rounded-xl bg-amber-950/30 border border-amber-500/30 text-[11px] text-amber-300 flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>
                    ⚠️ <strong>Stock Faible:</strong> Seulement {availableKeysCount}{' '}
                    {availableKeysCount <= 1 ? 'lien restant' : 'liens restants'} (1 lien = 1 article).
                  </span>
                </div>
              )}

              {/* Input for key / link */}
              {hasStockKeys && deliverKeyFromVault ? (
                <div className="space-y-1">
                  <input
                    type="text"
                    value={deliveredKey}
                    onChange={(e) => setDeliveredKey(e.target.value)}
                    placeholder="Key or link to deliver..."
                    className="w-full bg-slate-900 border border-emerald-500/30 rounded-lg px-2.5 py-1.5 text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-500"
                  />
                  {deliveredExpiryDate && (
                    <div className="flex items-center gap-1.5 text-[10px] pt-0.5">
                      <Clock className="w-3 h-3 text-indigo-400" />
                      <span className={isDeliveredExpired ? 'text-red-400 font-bold' : 'text-indigo-300'}>
                        {isDeliveredExpired ? '⚠️ Ce lien est EXPIRÉ !' : `Validité : Expire le ${deliveredExpiryDate}`}
                      </span>
                    </div>
                  )}
                </div>
              ) : !hasStockKeys ? (
                <input
                  type="text"
                  value={deliveredKey}
                  onChange={(e) => setDeliveredKey(e.target.value)}
                  placeholder="Coller un lien ou clé manuellement (optionnel)..."
                  className="w-full bg-slate-900 border border-white/10 rounded-lg px-2.5 py-2 text-xs font-mono text-emerald-300 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              ) : null}
            </div>
          )}

          {/* Selling Price & Sourcing Cost */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
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
                  className="w-full bg-slate-950 border border-white/10 rounded-xl pl-3.5 pr-10 py-2.5 text-base font-bold text-white focus:outline-none focus:border-emerald-500"
                />
                <span className="absolute right-3 top-3 text-xs font-bold text-slate-400">DA</span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                Product Cost ($)
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
          </div>

          {/* Unit Margin Indicator */}
          <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-950/50 via-slate-950 to-slate-900 border border-emerald-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 font-semibold block">Unit Gross Profit:</span>
                <div className={`text-sm sm:text-base font-black truncate ${unitGrossProfitDzd >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatSignedProfit(unitGrossProfitDzd, 'DZD')}
                </div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] text-slate-400 block">Margin</span>
              <div className="text-xs sm:text-sm font-black text-emerald-400">
                {marginPercent}%
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Payment Method *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {paymentMethods.map((pm) => (
                <button
                  type="button"
                  key={pm.id}
                  onClick={() => setPaymentMethod(pm.id)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer truncate ${
                    paymentMethod === pm.id
                      ? `${pm.badge} ring-2 ring-white/20 font-extrabold shadow-sm`
                      : 'bg-slate-950 text-slate-400 border-white/5 hover:border-white/20'
                  }`}
                >
                  {pm.label}
                </button>
              ))}
            </div>
          </div>

          {/* Upcoming Payment / Pay Later (Crédit) Toggle */}
          <div className="p-3 rounded-2xl bg-slate-950/80 border border-amber-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Upcoming Payment / Pay Later (Crédit)</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPayLater}
                  onChange={(e) => setIsPayLater(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>

            {isPayLater && (
              <div className="pt-1">
                <input
                  type="text"
                  placeholder="Quick note (e.g. Will pay tonight via BaridiMob)..."
                  value={pendingNote}
                  onChange={(e) => setPendingNote(e.target.value)}
                  className="w-full bg-slate-900 border border-amber-500/40 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
                <p className="text-[10px] text-amber-400/80 mt-1">
                  Sale will be tagged as &quot;Pending Payment&quot; with a 1-tap &quot;Mark as Paid&quot; button in Orders.
                </p>
              </div>
            )}
          </div>

          {/* Collapsible Customer Info (Non-Obligatory) */}
          <div className="border-t border-white/5 pt-2">
            <button
              type="button"
              onClick={() => setShowOptional(!showOptional)}
              className="w-full py-2 flex items-center justify-between text-xs font-semibold text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <span>+ Customer Contact & Notes (Optional)</span>
              {showOptional ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showOptional && (
              <div className="space-y-3 pt-2 animate-fade-in">
                <div className="grid grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    placeholder="Customer name..."
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="tel"
                    inputMode="tel"
                    placeholder="Phone (05/06/07...)"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Additional delivery notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            )}
          </div>
        </form>

        {/* Sticky Action Footer */}
        <div className="p-4 border-t border-white/10 bg-slate-900/95 backdrop-blur shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            type="submit"
            form="sale-form"
            disabled={isSubmitting}
            className={`w-full py-3.5 rounded-xl font-bold text-sm shadow-xl active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer ${
              isPayLater
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            <span>
              {isSubmitting
                ? 'Saving...'
                : isPayLater
                ? `Confirm Sale (${parsedPriceDzd.toLocaleString()} DA - Pay Later)`
                : `Confirm & Save Sale (+${unitGrossProfitDzd.toLocaleString()} DA)`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
