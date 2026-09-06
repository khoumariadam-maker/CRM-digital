'use client';

import React, { useState } from 'react';
import { useCRMData } from '@/context/CRMDataContext';
import { useCurrency } from '@/context/CurrencyContext';
import { generateWhatsAppLink } from '@/lib/calculations';
import {
  TrendingUp,
  ShoppingBag,
  Plus,
  Users,
  Copy,
  Check,
  MessageCircle,
  Sparkles,
  ArrowRight,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { sales, deleteSale, financials, openSaleModal } = useCRMData();
  const { currency, format, exchangeRate } = useCurrency();

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const recentSales = sales.slice(0, 10);

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in pb-12 max-w-4xl mx-auto">
      {/* 1. Mobile-First Hero: Real Net Profit Card */}
      <div className="relative p-5 sm:p-7 rounded-3xl bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-950 border border-emerald-500/30 shadow-2xl overflow-hidden">
        <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>REAL NET PROFIT</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            {financials.profitMarginPercent}% Margin
          </span>
        </div>

        {/* Big Profit Number */}
        <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          {format(financials.netProfitDzd, financials.netProfitUsd)}
        </div>
        <div className="text-xs text-slate-400 font-medium mt-1">
          {currency === 'DZD'
            ? `≈ $${financials.netProfitUsd.toLocaleString()} USD`
            : `≈ ${financials.netProfitDzd.toLocaleString()} DA`}
          {' • '}
          <span className="text-slate-300">
            Revenue − Product Costs − Meta Ads
          </span>
        </div>

        {/* Quick 3-Pill Breakdown for Mobile */}
        <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-white/10">
          <div className="p-2 rounded-xl bg-slate-950/60 border border-white/5 text-center">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">Revenue</span>
            <span className="text-xs sm:text-sm font-bold text-white block mt-0.5 truncate">
              {format(financials.totalRevenueDzd, financials.totalRevenueUsd)}
            </span>
          </div>

          <div className="p-2 rounded-xl bg-slate-950/60 border border-white/5 text-center">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">Products</span>
            <span className="text-xs sm:text-sm font-bold text-amber-400 block mt-0.5 truncate">
              −{format(financials.totalProductCostDzd, financials.totalProductCostUsd)}
            </span>
          </div>

          <div className="p-2 rounded-xl bg-slate-950/60 border border-white/5 text-center">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">Meta Ads</span>
            <span className="text-xs sm:text-sm font-bold text-indigo-400 block mt-0.5 truncate">
              −{format(financials.totalMetaAdSpendDzd, financials.totalMetaAdSpendUsd)}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Adem & Abdou Partners Split Card */}
      <div className="p-4 sm:p-5 rounded-2xl glass-panel border border-white/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
            <Users className="w-4 h-4 text-blue-400" />
            <span>Partners Performance</span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            {financials.salesCount} total sales
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Adem */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-blue-500/20 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-400">Adem</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 font-semibold">
                {financials.ademSalesCount} sales
              </span>
            </div>
            <div className="text-base font-extrabold text-white">
              {format(financials.ademProfitDzd)}
            </div>
            <span className="text-[10px] text-slate-400 block">Real profit logged</span>
          </div>

          {/* Abdou */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-emerald-500/20 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400">Abdou</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-semibold">
                {financials.abdouSalesCount} sales
              </span>
            </div>
            <div className="text-base font-extrabold text-white">
              {format(financials.abdouProfitDzd)}
            </div>
            <span className="text-[10px] text-slate-400 block">Real profit logged</span>
          </div>
        </div>
      </div>

      {/* 3. Big Touch Button to Log Sale */}
      <button
        type="button"
        onClick={openSaleModal}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm sm:text-base shadow-xl shadow-emerald-600/30 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
      >
        <Plus className="w-5 h-5 stroke-[3]" />
        <span>+ Log New Digital Sale</span>
      </button>

      {/* 4. Recent Sales Feed (Mobile Card Style) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm sm:text-base font-bold text-white">Recent Sales</h3>
          <Link
            href="/orders"
            className="flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300"
          >
            <span>View All ({sales.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="space-y-2.5">
          {recentSales.map((sale) => {
            const productCostDzd = Math.round(sale.productCostUsd * (sale.exchangeRateUsed || exchangeRate));
            const metaAdDzd = Math.round(sale.metaAdCostUsd * (sale.exchangeRateUsed || exchangeRate));

            const waLink = generateWhatsAppLink(
              sale.customerPhone,
              sale.deliveredKey
                ? `Salam! Vos accès pour *${sale.productName}*:\n🔑 ${sale.deliveredKey}\n\nMerci pour votre achat!`
                : `Salam! Confirmation de votre commande pour *${sale.productName}* (${sale.sellingPriceDzd.toLocaleString()} DA).`
            );

            return (
              <div
                key={sale.id}
                className="p-3.5 sm:p-4 rounded-2xl glass-card border border-white/10 space-y-2.5"
              >
                {/* Top Row: Sale #, Partner Tag, Payment Method */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-400 text-[11px]">
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

                  <span className="capitalize px-2 py-0.5 rounded bg-slate-950 text-[10px] font-semibold text-slate-400 border border-white/5">
                    {sale.paymentMethod === 'baridimob' ? 'BaridiMob' : sale.paymentMethod}
                  </span>
                </div>

                {/* Product Name & Customer info */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-white text-sm sm:text-base">
                      {sale.productName}
                    </h4>
                    {sale.customerName && (
                      <span className="text-xs text-slate-400 block mt-0.5">
                        Client: {sale.customerName}{' '}
                        {sale.customerPhone && `(${sale.customerPhone})`}
                      </span>
                    )}
                  </div>

                  {/* Net Profit Badge */}
                  <div className="text-right shrink-0">
                    <span className={`text-xs sm:text-sm font-black block ${sale.netProfitDzd >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {sale.netProfitDzd >= 0 ? `+${format(sale.netProfitDzd)}` : format(sale.netProfitDzd)}
                    </span>
                    <span className="text-[10px] text-slate-400">Net Profit</span>
                  </div>
                </div>

                {/* Financial breakdown details */}
                <div className="grid grid-cols-3 gap-2 p-2 rounded-xl bg-slate-950/70 text-[11px] border border-white/5">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Price (DA)</span>
                    <span className="font-bold text-white">
                      {sale.sellingPriceDzd.toLocaleString()} DA
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Cost ($)</span>
                    <span className="font-semibold text-amber-300">
                      ${sale.productCostUsd} ({productCostDzd} DA)
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Meta Ad ($)</span>
                    <span className="font-semibold text-indigo-300">
                      ${sale.metaAdCostUsd} ({metaAdDzd} DA)
                    </span>
                  </div>
                </div>

                {/* Delivered License Key snippet */}
                {sale.deliveredKey && (
                  <div className="p-2 rounded-xl bg-slate-950 border border-white/5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">KEY:</span>
                      <code className="text-xs text-emerald-400 font-mono truncate">
                        {sale.deliveredKey}
                      </code>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(sale.deliveredKey!, sale.id)}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white shrink-0 cursor-pointer"
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

                {/* Quick Actions (WhatsApp & Delete) */}
                <div className="flex items-center justify-between pt-1 border-t border-white/5">
                  <span className="text-[10px] text-slate-400 font-mono">
                    {sale.createdAt.split('T')[0]}
                  </span>

                  <div className="flex items-center gap-2">
                    {sale.customerPhone && (
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600/20 text-emerald-400 text-xs font-semibold border border-emerald-500/30 hover:bg-emerald-600/30 transition-all active:scale-95"
                      >
                        <MessageCircle className="w-3 h-3" />
                        <span>WhatsApp</span>
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => deleteSale(sale.id)}
                      className="p-1.5 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                      title="Delete sale"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
