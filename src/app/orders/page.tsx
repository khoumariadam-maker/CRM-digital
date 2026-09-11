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
  Clock,
  CheckCircle2,
} from 'lucide-react';

export default function SalesPage() {
  const { sales, deleteSale, markSaleAsPaid, openSaleModal } = useCRMData();
  const { format, exchangeRate } = useCurrency();

  const [partnerFilter, setPartnerFilter] = useState<'All' | 'Adem' | 'Abdou' | 'Pending'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const pendingSalesCount = sales.filter((s) => s.paymentStatus === 'pending').length;

  const filteredSales = sales.filter((s) => {
    let matchesFilter = true;
    if (partnerFilter === 'Pending') {
      matchesFilter = s.paymentStatus === 'pending';
    } else if (partnerFilter !== 'All') {
      matchesFilter = s.soldBy === partnerFilter;
    }

    const matchesSearch =
      s.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.customerName && s.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.customerPhone && s.customerPhone.includes(searchQuery)) ||
      s.saleNumber.includes(searchQuery);

    return matchesFilter && matchesSearch;
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
            Real profit per sale with sourcing costs, payment channels, and pending payment tracking.
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

      {/* Tabs & Search */}
      <div className="space-y-2.5">
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
          {(['All', 'Adem', 'Abdou'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setPartnerFilter(tab)}
              className={`py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer truncate ${
                partnerFilter === tab
                  ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30'
                  : 'bg-slate-950 text-slate-400 border-white/10 hover:border-white/20'
              }`}
            >
              {tab === 'All' ? `All (${sales.length})` : `${tab} (${sales.filter((s) => s.soldBy === tab).length})`}
            </button>
          ))}

          {/* Pending / Pay Later Filter Tab */}
          <button
            type="button"
            onClick={() => setPartnerFilter('Pending')}
            className={`py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer truncate flex items-center justify-center gap-1 ${
              partnerFilter === 'Pending'
                ? 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-600/30'
                : pendingSalesCount > 0
                ? 'bg-amber-950/40 text-amber-300 border-amber-500/30 hover:border-amber-400'
                : 'bg-slate-950 text-slate-500 border-white/10'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>À Payer ({pendingSalesCount})</span>
          </button>
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
            const isPending = sale.paymentStatus === 'pending';
            const productCostDzd = Math.round(sale.productCostUsd * (sale.exchangeRateUsed || exchangeRate));

            const waLink = generateWhatsAppLink(
              sale.customerPhone,
              sale.deliveredKey
                ? `Salam! Vos accès pour *${sale.productName}*:\n🔑 ${sale.deliveredKey}\n\nMerci pour votre confiance!`
                : `Salam! Confirmation de votre commande pour *${sale.productName}*.`
            );

            return (
              <div
                key={sale.id}
                className={`p-3.5 sm:p-5 rounded-2xl glass-card border space-y-3 ${
                  isPending ? 'border-amber-500/40 bg-amber-950/10' : 'border-white/10'
                }`}
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

                    {isPending ? (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        <Clock className="w-3 h-3" />
                        <span>Paiement en attente</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Payé</span>
                      </span>
                    )}
                  </div>

                  <span className="capitalize px-2 py-0.5 rounded bg-slate-950 text-[10px] font-semibold text-slate-400 border border-white/5">
                    {sale.paymentMethod}
                  </span>
                </div>

                {/* Product & Financials */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-white">{sale.productName}</h3>
                    {sale.customerName && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        Client: <span className="text-slate-300 font-medium">{sale.customerName}</span>
                        {sale.customerPhone && ` • ${sale.customerPhone}`}
                      </p>
                    )}
                    {isPending && sale.pendingNote && (
                      <p className="text-[11px] text-amber-400/90 italic mt-1">
                        Note: {sale.pendingNote}
                      </p>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-base sm:text-lg font-black text-white">
                      {sale.sellingPriceDzd.toLocaleString()} DA
                    </div>
                    <span className="text-[10px] text-emerald-400 font-bold block">
                      +{sale.netProfitDzd.toLocaleString()} DA gross
                    </span>
                  </div>
                </div>

                {/* License Key Display (if delivered) */}
                {sale.deliveredKey && (
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-white/5 flex items-center justify-between gap-2 text-xs font-mono text-emerald-300">
                    <span className="truncate">{sale.deliveredKey}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(sale.deliveredKey!, sale.id)}
                      className="p-1 text-slate-400 hover:text-white shrink-0 cursor-pointer"
                      title="Copy Key"
                    >
                      {copiedId === sale.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                )}

                {/* Bottom Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                  {/* Mark as paid button if pending */}
                  {isPending ? (
                    <button
                      type="button"
                      onClick={() => markSaleAsPaid(sale.id)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Encaissé (Mark as Paid)</span>
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-500">
                      {new Date(sale.createdAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}

                  <div className="flex items-center gap-2 ml-auto">
                    {sale.customerPhone && (
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 px-2.5 py-1.5 rounded-lg border border-emerald-500/20"
                      >
                        <MessageCircle className="w-3 h-3" />
                        <span>WhatsApp</span>
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => deleteSale(sale.id)}
                      className="p-1.5 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                      title="Delete sale"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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
