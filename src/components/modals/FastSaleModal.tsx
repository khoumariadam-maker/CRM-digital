'use client';

import React, { useState, useEffect } from 'react';
import { useCRMData } from '@/context/CRMDataContext';
import { useCurrency } from '@/context/CurrencyContext';
import { PartnerName, PaymentMethod } from '@/types/crm';
import { calculateSaleNetProfit, convertUsdToDzd } from '@/lib/calculations';
import {
  X,
  Plus,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  Key,
  User,
  Phone,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface FastSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FastSaleModal({ isOpen, onClose }: FastSaleModalProps) {
  const { products, addSale, activePartner } = useCRMData();
  const { exchangeRate, format } = useCurrency();

  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [customProductName, setCustomProductName] = useState('');
  const [sellingPriceDzd, setSellingPriceDzd] = useState<string>('1800');
  const [productCostUsd, setProductCostUsd] = useState<string>('4.00');
  const [metaAdCostUsd, setMetaAdCostUsd] = useState<string>('1.50');
  const [soldBy, setSoldBy] = useState<PartnerName>(activePartner);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('baridimob');

  // Optional fields
  const [showOptional, setShowOptional] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveredKey, setDeliveredKey] = useState('');
  const [notes, setNotes] = useState('');

  // Sync default partner
  useEffect(() => {
    setSoldBy(activePartner);
  }, [activePartner]);

  // Set default product when opened
  useEffect(() => {
    if (products.length > 0 && !selectedProductId) {
      const p = products[0];
      setSelectedProductId(p.id);
      setSellingPriceDzd(p.defaultSellingDzd.toString());
      setProductCostUsd(p.defaultCostUsd.toString());
    }
  }, [products, selectedProductId]);

  if (!isOpen) return null;

  const handleProductSelect = (prodId: string) => {
    setSelectedProductId(prodId);
    if (prodId === 'custom') {
      setCustomProductName('');
      return;
    }
    const p = products.find((item) => item.id === prodId);
    if (p) {
      setSellingPriceDzd(p.defaultSellingDzd.toString());
      setProductCostUsd(p.defaultCostUsd.toString());
      if (p.stockKeys && p.stockKeys.length > 0) {
        setDeliveredKey(p.stockKeys[0]);
      } else {
        setDeliveredKey('');
      }
    }
  };

  // Real-time live net profit calculations
  const parsedPriceDzd = parseFloat(sellingPriceDzd) || 0;
  const parsedProductCostUsd = parseFloat(productCostUsd) || 0;
  const parsedMetaAdUsd = parseFloat(metaAdCostUsd) || 0;

  const { netProfitDzd, netProfitUsd, marginPercent } = calculateSaleNetProfit(
    parsedPriceDzd,
    parsedProductCostUsd,
    parsedMetaAdUsd,
    exchangeRate
  );

  const productCostDzd = convertUsdToDzd(parsedProductCostUsd, exchangeRate);
  const metaAdCostDzd = convertUsdToDzd(parsedMetaAdUsd, exchangeRate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let finalName = '';
    if (selectedProductId === 'custom') {
      finalName = customProductName.trim() || 'Digital Product';
    } else {
      const p = products.find((item) => item.id === selectedProductId);
      finalName = p ? p.name : 'Digital Product';
    }

    addSale({
      productName: finalName,
      productId: selectedProductId !== 'custom' ? selectedProductId : undefined,
      sellingPriceDzd: parsedPriceDzd,
      productCostUsd: parsedProductCostUsd,
      metaAdCostUsd: parsedMetaAdUsd,
      soldBy,
      paymentMethod,
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      deliveredKey: deliveredKey.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    // Reset optional fields & close
    setCustomerName('');
    setCustomerPhone('');
    setDeliveredKey('');
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-slate-800/40 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">Log Digital Sale</h2>
              <p className="text-[11px] text-slate-400">Track selling price, product cost & Meta ads</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 pb-8 sm:pb-5">
          {/* Partner Selector (Adem vs Abdou) */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Sold By *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSoldBy('Adem')}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  soldBy === 'Adem'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30'
                    : 'bg-slate-950 text-slate-400 border-white/10 hover:border-white/20'
                }`}
              >
                Adem
              </button>
              <button
                type="button"
                onClick={() => setSoldBy('Abdou')}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  soldBy === 'Abdou'
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30'
                    : 'bg-slate-950 text-slate-400 border-white/10 hover:border-white/20'
                }`}
              >
                Abdou
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
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-3 text-sm text-white focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Sell: {p.defaultSellingDzd.toLocaleString()} DA • Cost: ${p.defaultCostUsd})
                </option>
              ))}
              <option value="custom">✏️ Enter custom product title...</option>
            </select>

            {selectedProductId === 'custom' && (
              <input
                type="text"
                required
                placeholder="Type digital product name..."
                value={customProductName}
                onChange={(e) => setCustomProductName(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white mt-2 focus:outline-none focus:border-blue-500"
              />
            )}
          </div>

          {/* Financials: Selling Price, Product Cost, Meta Ad Cost */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Selling Price */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                Selling Price (DA) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="50"
                  required
                  value={sellingPriceDzd}
                  onChange={(e) => setSellingPriceDzd(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl pl-3 pr-9 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
                />
                <span className="absolute right-3 top-3 text-[11px] font-semibold text-slate-400">DA</span>
              </div>
            </div>

            {/* Product Purchase Cost */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                Product Cost ($) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-bold">$</span>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  required
                  value={productCostUsd}
                  onChange={(e) => setProductCostUsd(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl pl-7 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                ≈ {productCostDzd.toLocaleString()} DA
              </span>
            </div>

            {/* Meta Ad Cost for this sale */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                Meta Ad Cost ($) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-bold">$</span>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  required
                  value={metaAdCostUsd}
                  onChange={(e) => setMetaAdCostUsd(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl pl-7 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                ≈ {metaAdCostDzd.toLocaleString()} DA
              </span>
            </div>
          </div>

          {/* LIVE NET PROFIT PREVIEW CARD */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-950 to-slate-900 border border-emerald-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] text-slate-300 font-semibold">Net Profit for This Sale:</span>
                <div className="text-base font-black text-emerald-400">
                  +{netProfitDzd.toLocaleString()} DA <span className="text-xs text-slate-400 font-normal">(+${netProfitUsd})</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400">Profit Margin</span>
              <div className={`text-sm font-black ${marginPercent >= 35 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {marginPercent}%
              </div>
            </div>
          </div>

          {/* Payment Channel */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Payment Method
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {(['baridimob', 'ccp', 'paysera', 'wise', 'cash'] as PaymentMethod[]).map((pm) => (
                <button
                  type="button"
                  key={pm}
                  onClick={() => setPaymentMethod(pm)}
                  className={`py-2 px-2 rounded-xl text-[11px] font-semibold capitalize border transition-all cursor-pointer truncate ${
                    paymentMethod === pm
                      ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                      : 'bg-slate-950 text-slate-400 border-white/10 hover:border-white/20'
                  }`}
                >
                  {pm === 'baridimob' ? 'BaridiMob' : pm}
                </button>
              ))}
            </div>
          </div>

          {/* Toggle Optional Details */}
          <button
            type="button"
            onClick={() => setShowOptional(!showOptional)}
            className="flex items-center justify-between w-full py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 border-t border-white/5 pt-3 cursor-pointer"
          >
            <span>Optional Customer Info & License Key</span>
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
                    placeholder="e.g. Karim (optional)"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Phone / WhatsApp (Optional)</label>
                  <input
                    type="tel"
                    placeholder="0550... (optional)"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Delivered License Key or Login (Optional)</label>
                <input
                  type="text"
                  placeholder="Paste delivered key or credentials..."
                  value={deliveredKey}
                  onChange={(e) => setDeliveredKey(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Sale Notes</label>
                <input
                  type="text"
                  placeholder="e.g. RIP receipt confirmed"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-xl shadow-emerald-600/30 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Confirm & Save Sale</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
