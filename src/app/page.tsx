'use client';

import React, { useState } from 'react';
import { useCRMData } from '@/context/CRMDataContext';
import { useCurrency } from '@/context/CurrencyContext';
import { generateWhatsAppLink } from '@/lib/calculations';
import GrowthChart from '@/components/dashboard/GrowthChart';
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
  Megaphone,
  Receipt,
  Landmark,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  AlertTriangle,
  Package,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const {
    sales,
    deleteSale,
    markSaleAsPaid,
    financials,
    activeCaisse,
    dailyAdSpends,
    expenses,
    lowStockProducts,
    openSaleModal,
    openAdSpendModal,
    openExpenseModal,
    openCaisseModal,
    openStockImportModal,
  } = useCRMData();
  const { currency, format, exchangeRate } = useCurrency();

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const recentSales = sales.slice(0, 10);

  const todayFullDate = new Intl.DateTimeFormat('fr-DZ', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in pb-12 max-w-4xl mx-auto">
      {/* Date & Market Status Header */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1 pt-1">
        <div className="flex items-center gap-1.5 font-bold text-slate-200 capitalize">
          <Calendar className="w-3.5 h-3.5 text-blue-400" />
          <span>{todayFullDate}</span>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          Square: <strong className="text-emerald-400">{exchangeRate} DA/$</strong>
        </span>
      </div>

      {/* 0. Caisse (24h Register) Status Banner */}
      <div className="p-3 sm:p-4 rounded-2xl glass-panel border border-white/10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
              activeCaisse
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
            }`}
          >
            <Landmark className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">
                {activeCaisse ? 'Caisse Ouverte' : 'Caisse Fermée'}
              </span>
              <span
                className={`text-[10px] px-2 py-0.2 rounded-full font-bold uppercase tracking-wider ${
                  activeCaisse
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-amber-500/20 text-amber-300'
                }`}
              >
                {activeCaisse ? 'Shift 24h Actif' : 'Non démarrée'}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block truncate">
              {activeCaisse
                ? `Fonds: ${activeCaisse.initialBalanceDzd.toLocaleString()} DA • Ouverte par ${activeCaisse.openedBy}`
                : 'Ouvrez la caisse pour tracer le fonds de roulement du jour.'}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={openCaisseModal}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all shrink-0 cursor-pointer ${
            activeCaisse
              ? 'bg-slate-900 hover:bg-slate-800 text-white border-white/10'
              : 'bg-amber-600 hover:bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-600/30'
          }`}
        >
          {activeCaisse ? 'Clôturer' : 'Ouvrir Caisse'}
        </button>
      </div>

      {/* 0.1 Upcoming Payments Banner (if any pending) */}
      {financials.pendingPaymentsCount > 0 && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="text-xs text-amber-200">
              <span className="font-bold">{financials.pendingPaymentsCount} Paiements en attente</span>{' '}
              ({financials.pendingPaymentsAmountDzd.toLocaleString()} DA à encaisser)
            </div>
          </div>
          <Link
            href="/orders"
            className="text-xs font-bold text-amber-300 hover:text-white underline shrink-0"
          >
            Voir les commandes &rarr;
          </Link>
        </div>
      )}

      {/* 0.2 Stock Alert Banner (if low or zero stock items exist) */}
      {lowStockProducts.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2.5 min-w-0">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <div className="text-xs text-rose-200 min-w-0">
              <span className="font-bold">⚠️ ALERTE STOCK:</span>{' '}
              <span>{lowStockProducts.length} produit(s) en rupture ou stock critique</span>
              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-rose-300/80 truncate">
                {lowStockProducts.slice(0, 3).map((p) => {
                  const count = p.stockKeys?.length || 0;
                  return (
                    <span key={p.id} className="truncate">
                      {p.name}: <strong className={count === 0 ? 'text-red-400' : 'text-amber-300'}>{count} item(s)</strong>
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={openStockImportModal}
            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-bold text-xs shrink-0 cursor-pointer shadow-md shadow-rose-600/30 active:scale-95 transition-all"
          >
            + Réapprovisionner
          </button>
        </div>
      )}

      {/* 1. Mobile-First Hero: Real Net Profit Card */}
      <div className="relative p-5 sm:p-7 rounded-3xl bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-950 border border-emerald-500/30 shadow-2xl overflow-hidden">
        <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>REAL NET PROFIT</span>
          </div>
          <div className="flex items-center gap-2">
            {financials.averageCpmDzd > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                CPM: {financials.averageCpmDzd} DA
              </span>
            )}
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {financials.profitMarginPercent}% Margin
            </span>
          </div>
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
            Ventes − Coûts Sourcing − Meta Ads − Dépenses
          </span>
        </div>

        {/* 4-Pill Financial Breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-5 pt-4 border-t border-white/10">
          <div className="p-2 rounded-xl bg-slate-950/60 border border-white/5 text-center">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">Ventes</span>
            <span className="text-xs sm:text-sm font-bold text-white block mt-0.5 truncate">
              {format(financials.totalRevenueDzd, financials.totalRevenueUsd)}
            </span>
          </div>

          <div className="p-2 rounded-xl bg-slate-950/60 border border-white/5 text-center">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">Produits</span>
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

          <div className="p-2 rounded-xl bg-slate-950/60 border border-white/5 text-center">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">Dépenses</span>
            <span className="text-xs sm:text-sm font-bold text-rose-400 block mt-0.5 truncate">
              −{format(financials.totalExpensesDzd, financials.totalExpensesUsd)}
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

      {/* 3. Action Hub: Fast Sale + Ad Spend + Dépenses */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={openSaleModal}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm sm:text-base shadow-xl shadow-emerald-600/30 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-5 h-5 stroke-[3]" />
          <span>+ Log New Digital Sale (3 sec)</span>
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={openAdSpendModal}
            className="py-3 px-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-indigo-500/30 hover:border-indigo-400 text-indigo-300 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Megaphone className="w-4 h-4 text-indigo-400" />
            <span>End-of-Day Ad Spend</span>
          </button>

          <button
            type="button"
            onClick={openExpenseModal}
            className="py-3 px-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-rose-500/30 hover:border-rose-400 text-rose-300 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Receipt className="w-4 h-4 text-rose-400" />
            <span>+ Log Dépense</span>
          </button>
        </div>
      </div>

      {/* 4. Growth Progress Graph */}
      <GrowthChart
        sales={sales}
        dailyAdSpends={dailyAdSpends}
        expenses={expenses}
        exchangeRate={exchangeRate}
      />

      {/* 5. Recent Sales Feed */}
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

        {sales.length === 0 ? (
          <div className="p-8 rounded-2xl glass-card border border-white/10 text-center space-y-2">
            <ShoppingBag className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="text-xs font-bold text-slate-300">Clean Slate — No sales recorded yet.</p>
            <p className="text-[11px] text-slate-500">
              Tap &quot;+ Log New Digital Sale&quot; to register your first order.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {recentSales.map((sale) => {
              const isPending = sale.paymentStatus === 'pending';
              const waLink = generateWhatsAppLink(
                sale.customerPhone,
                sale.deliveredKey
                  ? `Salam! Vos accès pour *${sale.productName}*:\n🔑 ${sale.deliveredKey}\n\nMerci pour votre achat!`
                  : `Salam! Confirmation de votre commande pour *${sale.productName}* (${sale.sellingPriceDzd.toLocaleString()} DA).`
              );

              return (
                <div
                  key={sale.id}
                  className={`p-3.5 sm:p-4 rounded-2xl glass-card border space-y-2.5 ${
                    isPending ? 'border-amber-500/40 bg-amber-950/10' : 'border-white/10'
                  }`}
                >
                  {/* Top Row: Sale #, Partner Tag, Payment Method & Status */}
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

                      {/* Pending Payment Badge */}
                      {isPending && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          <Clock className="w-3 h-3" />
                          <span>À Payer</span>
                        </span>
                      )}
                    </div>

                    <span className="capitalize px-2 py-0.5 rounded bg-slate-950 text-[10px] font-semibold text-slate-400 border border-white/5">
                      {sale.paymentMethod}
                    </span>
                  </div>

                  {/* Product & Price */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-white text-sm sm:text-base">
                        {sale.productName}
                      </h4>
                      {isPending && sale.pendingNote && (
                        <p className="text-[11px] text-amber-400/90 italic mt-0.5">
                          Note: {sale.pendingNote}
                        </p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-sm sm:text-base font-extrabold text-white">
                        {sale.sellingPriceDzd.toLocaleString()} DA
                      </div>
                      <span className="text-[10px] font-bold text-emerald-400 block">
                        +{sale.netProfitDzd.toLocaleString()} DA gross
                      </span>
                    </div>
                  </div>

                  {/* Quick Action Bar for the Sale */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                    {/* Mark as paid button if pending */}
                    {isPending ? (
                      <button
                        type="button"
                        onClick={() => markSaleAsPaid(sale.id)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Encaissé (Mark as Paid)</span>
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-500">
                        {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}

                    <div className="flex items-center gap-1.5 ml-auto">
                      {sale.customerPhone && (
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30"
                          title="WhatsApp direct"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {sale.deliveredKey && (
                        <button
                          type="button"
                          onClick={() => handleCopy(sale.deliveredKey!, sale.id)}
                          className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white"
                          title="Copy license key"
                        >
                          {copiedId === sale.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => deleteSale(sale.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400"
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
        )}
      </div>
    </div>
  );
}
