'use client';

import React, { useState } from 'react';
import { useCRMData } from '@/context/CRMDataContext';
import { useCurrency } from '@/context/CurrencyContext';
import { generateWhatsAppLink } from '@/lib/calculations';
import {
  ShoppingBag,
  Plus,
  Search,
  Copy,
  Check,
  MessageCircle,
  Trash2,
} from 'lucide-react';

export default function SalesPage() {
  const { sales, deleteSale, openSaleModal } = useCRMData();
  const { format, exchangeRate } = useCurrency();

  const [partnerFilter, setPartnerFilter] = useState<'All' | 'Adem' | 'Abdou'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredSales = sales.filter((s) => {
    const matchesPartner = partnerFilter === 'All' || s.soldBy === partnerFilter;
    const matchesSearch =
      s.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.customerName && s.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.customerPhone && s.customerPhone.includes(searchQuery)) ||
      s.saleNumber.includes(searchQuery);

    return matchesPartner && matchesSearch;
  });

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="p-4 sm:p-6 rounded-2xl glass-panel border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 mb-1">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>SALES LOG</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">Digital Sales Tracker</h1>
          <p className="text-xs text-slate-400">
            Real profit per sale with sourcing costs, Meta ads, and partner attribution.
          </p>
        </div>

        <button
          type="button"
          onClick={openSaleModal}
          className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white px-4 py-3 rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Log Sale</span>
        </button>
      </div>

      {/* Partner Tabs & Search */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          {(['All', 'Adem', 'Abdou'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setPartnerFilter(tab)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                partnerFilter === tab
                  ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30'
                  : 'bg-slate-950 text-slate-400 border-white/10 hover:border-white/20'
              }`}
            >
              {tab === 'All' ? `All (${sales.length})` : `${tab} (${sales.filter((s) => s.soldBy === tab).length})`}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by product, customer, phone, or #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-white/10 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Sales Stream Cards */}
      <div className="space-y-3">
        {filteredSales.length === 0 ? (
          <div className="p-8 text-center glass-panel rounded-2xl border border-white/10">
            <ShoppingBag className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <p className="text-sm font-bold text-white">No sales found</p>
            <p className="text-xs text-slate-400 mt-1">Try another search or log a new digital sale.</p>
          </div>
        ) : (
          filteredSales.map((sale) => {
            const productCostDzd = Math.round(sale.productCostUsd * (sale.exchangeRateUsed || exchangeRate));
            const metaAdDzd = Math.round(sale.metaAdCostUsd * (sale.exchangeRateUsed || exchangeRate));

            const waLink = generateWhatsAppLink(
              sale.customerPhone,
              sale.deliveredKey
                ? `Salam! Vos accès pour *${sale.productName}*:\n🔑 ${sale.deliveredKey}\n\nMerci pour votre confiance!`
                : `Salam! Confirmation de votre commande pour *${sale.productName}*.`
            );

            return (
              <div
                key={sale.id}
                className="p-3.5 sm:p-5 rounded-2xl glass-card border border-white/10 space-y-3"
              >
                {/* Top Info */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-300 text-xs sm:text-sm">
                      {sale.saleNumber}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        sale.soldBy === 'Adem'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {sale.soldBy}
                    </span>
                  </div>

                  <span className="capitalize px-2.5 py-0.5 rounded-full bg-slate-950 text-[10px] font-semibold text-slate-300 border border-white/5">
                    {sale.paymentMethod === 'baridimob' ? 'BaridiMob' : sale.paymentMethod}
                  </span>
                </div>

                {/* Product & Financials */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white leading-tight">
                      {sale.productName}
                    </h3>
                    {sale.customerName && (
                      <span className="text-xs text-slate-400 mt-0.5 block">
                        Client: {sale.customerName} {sale.customerPhone ? `(${sale.customerPhone})` : ''}
                      </span>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-sm sm:text-base font-black text-white">
                      {format(sale.sellingPriceDzd)}
                    </div>
                    <div className={`text-xs sm:text-sm font-black ${sale.netProfitDzd >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {sale.netProfitDzd >= 0 ? `+${format(sale.netProfitDzd)}` : format(sale.netProfitDzd)} Net
                    </div>
                  </div>
                </div>

                {/* Direct Costs Breakdown */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950/80 p-2.5 rounded-xl border border-white/5">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Product Cost</span>
                    <span className="font-semibold text-slate-200">
                      ${sale.productCostUsd} <span className="text-[10px] text-slate-400">({productCostDzd} DA)</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Meta Ad Spend</span>
                    <span className="font-semibold text-indigo-300">
                      ${sale.metaAdCostUsd} <span className="text-[10px] text-slate-400">({metaAdDzd} DA)</span>
                    </span>
                  </div>
                </div>

                {/* Delivered Key */}
                {sale.deliveredKey && (
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-emerald-500/20 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-400 block">Delivered Key / Login:</span>
                      <span className="text-xs font-mono text-emerald-300 truncate block">
                        {sale.deliveredKey}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(sale.deliveredKey!, sale.id)}
                      className="p-1.5 text-slate-400 hover:text-white shrink-0 cursor-pointer"
                      title="Copy Key"
                    >
                      {copiedId === sale.id ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                )}

                {/* Bottom Action Row */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                  <span className="text-slate-400 font-mono text-[11px]">
                    {sale.createdAt.split('T')[0]}
                  </span>

                  <div className="flex items-center gap-2">
                    {sale.customerPhone && (
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600/20 text-emerald-400 text-xs font-bold border border-emerald-500/30 hover:bg-emerald-600/30 active:scale-95 transition-all"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => deleteSale(sale.id)}
                      className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                      title="Delete sale"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
