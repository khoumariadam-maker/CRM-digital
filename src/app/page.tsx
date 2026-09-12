'use client';

import React, { useState, useMemo } from 'react';
import { useCRMData } from '@/context/CRMDataContext';
import { useCurrency } from '@/context/CurrencyContext';
import { generateWhatsAppLink, calculateSummary } from '@/lib/calculations';
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
  Calendar,
  AlertTriangle,
  Package,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Zap,
} from 'lucide-react';
import Link from 'next/link';

type ViewMode = 'today' | 'yesterday' | 'all';

export default function DashboardPage() {
  const {
    sales,
    deleteSale,
    markSaleAsPaid,
    financials: globalFinancials,
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

  const [viewMode, setViewMode] = useState<ViewMode>('today');
  const [showGrowthChartInDaily, setShowGrowthChartInDaily] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper date formatting (YYYY-MM-DD)
  const getLocalDateStr = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const now = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => getLocalDateStr(now), [now]);

  const yesterdayDate = useMemo(() => {
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    return y;
  }, [now]);
  const yesterdayStr = useMemo(() => getLocalDateStr(yesterdayDate), [yesterdayDate]);

  // Extract YYYY-MM-DD from ISO or local timestamp
  const getSaleDateStr = (createdAt: string) => {
    if (!createdAt) return '';
    return createdAt.split('T')[0];
  };

  // Filtered slices based on selected View Mode
  const currentSales = useMemo(() => {
    if (viewMode === 'all') return sales;
    const target = viewMode === 'today' ? todayStr : yesterdayStr;
    return sales.filter((s) => getSaleDateStr(s.createdAt) === target);
  }, [sales, viewMode, todayStr, yesterdayStr]);

  const currentExpenses = useMemo(() => {
    if (viewMode === 'all') return expenses;
    const target = viewMode === 'today' ? todayStr : yesterdayStr;
    return expenses.filter((e) => (e.date || e.createdAt.split('T')[0]) === target);
  }, [expenses, viewMode, todayStr, yesterdayStr]);

  const currentAdSpends = useMemo(() => {
    if (viewMode === 'all') return dailyAdSpends;
    const target = viewMode === 'today' ? todayStr : yesterdayStr;
    return dailyAdSpends.filter((a) => a.date === target);
  }, [dailyAdSpends, viewMode, todayStr, yesterdayStr]);

  // Dynamic Financial Summary for selected period (Today, Yesterday, or All)
  const currentFinancials = useMemo(() => {
    if (viewMode === 'all') return globalFinancials;
    return calculateSummary(currentSales, exchangeRate, currentExpenses, currentAdSpends);
  }, [viewMode, globalFinancials, currentSales, exchangeRate, currentExpenses, currentAdSpends]);

  // Sales breakdown for the current view
  const pendingSalesInView = useMemo(() => {
    return currentSales.filter((s) => s.paymentStatus === 'pending');
  }, [currentSales]);

  const paidSalesInView = useMemo(() => {
    return currentSales.filter((s) => s.paymentStatus !== 'pending');
  }, [currentSales]);

  // Formatted date title
  const dateTitle = useMemo(() => {
    if (viewMode === 'today') {
      return new Intl.DateTimeFormat('fr-DZ', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(now);
    }
    if (viewMode === 'yesterday') {
      return new Intl.DateTimeFormat('fr-DZ', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(yesterdayDate);
    }
    return 'Historique Complet (Toutes Périodes)';
  }, [viewMode, now, yesterdayDate]);

  // Quick counts for the tab badges
  const todaySalesCount = useMemo(
    () => sales.filter((s) => getSaleDateStr(s.createdAt) === todayStr).length,
    [sales, todayStr]
  );
  const yesterdaySalesCount = useMemo(
    () => sales.filter((s) => getSaleDateStr(s.createdAt) === yesterdayStr).length,
    [sales, yesterdayStr]
  );

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in pb-12 max-w-4xl mx-auto">
      {/* 1. Date & Market Status Header */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1 pt-1">
        <div className="flex items-center gap-1.5 font-bold text-slate-200 capitalize">
          <Calendar className="w-3.5 h-3.5 text-blue-400" />
          <span>{dateTitle}</span>
          {viewMode === 'today' && (
            <span className="hidden sm:inline-block px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Shift Actif
            </span>
          )}
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          Square: <strong className="text-emerald-400">{exchangeRate} DA/$</strong>
        </span>
      </div>

      {/* 2. DAILY VIEW SELECTOR TABS (Vue du Jour / Hier / Vue Globale) */}
      <div className="grid grid-cols-3 gap-1.5 p-1.5 rounded-2xl bg-slate-950/90 border border-white/10 shadow-lg">
        <button
          type="button"
          onClick={() => setViewMode('today')}
          className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px] ${
            viewMode === 'today'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 border border-emerald-500'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              viewMode === 'today' ? 'bg-white animate-pulse' : 'bg-emerald-500'
            }`}
          />
          <span className="truncate">Aujourd&apos;hui</span>
          {todaySalesCount > 0 && (
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                viewMode === 'today' ? 'bg-emerald-700 text-white' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {todaySalesCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setViewMode('yesterday')}
          className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px] ${
            viewMode === 'yesterday'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 border border-blue-500'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Hier</span>
          {yesterdaySalesCount > 0 && (
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                viewMode === 'yesterday' ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {yesterdaySalesCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setViewMode('all')}
          className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px] ${
            viewMode === 'all'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-500'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Vue Globale</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
              viewMode === 'all' ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-300'
            }`}
          >
            {sales.length}
          </span>
        </button>
      </div>

      {/* 3. Caisse (24h Register) Status Banner */}
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
                {activeCaisse ? 'Caisse 24h Ouverte' : 'Caisse Fermée'}
              </span>
              <span
                className={`text-[10px] px-2 py-0.2 rounded-full font-bold uppercase tracking-wider ${
                  activeCaisse
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-amber-500/20 text-amber-300'
                }`}
              >
                {activeCaisse ? 'Fonds Actif' : 'Non démarrée'}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block truncate">
              {activeCaisse
                ? `Fonds BaridiMob: ${activeCaisse.initialBalanceDzd.toLocaleString()} DA • Ouverte par ${activeCaisse.openedBy}`
                : 'Ouvrez la caisse pour tracer le fonds de roulement du jour.'}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={openCaisseModal}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all shrink-0 cursor-pointer min-h-[44px] ${
            activeCaisse
              ? 'bg-slate-900 hover:bg-slate-800 text-white border-white/10'
              : 'bg-amber-600 hover:bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-600/30'
          }`}
        >
          {activeCaisse ? 'Clôturer' : 'Ouvrir Caisse'}
        </button>
      </div>

      {/* 4. Upcoming Payments Banner (Scoped to current view) */}
      {currentFinancials.pendingPaymentsCount > 0 && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="text-xs text-amber-200">
              <span className="font-bold">
                {currentFinancials.pendingPaymentsCount} Paiement(s) en attente{' '}
                {viewMode === 'today' ? "aujourd'hui" : ''}
              </span>{' '}
              ({currentFinancials.pendingPaymentsAmountDzd.toLocaleString()} DA à encaisser)
            </div>
          </div>
          <span className="text-[11px] text-amber-300 font-semibold shrink-0">
            Exclu du bénéfice jusqu&apos;à confirmation
          </span>
        </div>
      )}

      {/* 5. Stock Alert Banner (if low or zero stock items exist) */}
      {lowStockProducts.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2.5 min-w-0">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <div className="text-xs text-rose-200 min-w-0">
              <span className="font-bold">⚠️ ALERTE STOCK:</span>{' '}
              <span>{lowStockProducts.length} produit(s) critique(s)</span>
              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-rose-300/80 truncate">
                {lowStockProducts.slice(0, 3).map((p) => {
                  const count = p.stockKeys?.length || 0;
                  return (
                    <span key={p.id} className="truncate">
                      {p.name}:{' '}
                      <strong className={count === 0 ? 'text-red-400' : 'text-amber-300'}>
                        {count} link(s)
                      </strong>
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

      {/* 6. Dynamic Hero Card: Real Net Profit (Scoped to View Mode) */}
      <div className="relative p-5 sm:p-7 rounded-3xl bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-950 border border-emerald-500/30 shadow-2xl overflow-hidden">
        <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {viewMode === 'today'
                ? "Bénéfice Net Aujourd'hui"
                : viewMode === 'yesterday'
                ? "Bénéfice Net d'Hier"
                : 'Real Net Profit Global'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {currentFinancials.averageCpmDzd > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                CPM: {currentFinancials.averageCpmDzd} DA
              </span>
            )}
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {currentFinancials.profitMarginPercent}% Margin
            </span>
          </div>
        </div>

        {/* Big Profit Number */}
        <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          {format(currentFinancials.netProfitDzd, currentFinancials.netProfitUsd)}
        </div>
        <div className="text-xs text-slate-400 font-medium mt-1">
          {currency === 'DZD'
            ? `≈ $${currentFinancials.netProfitUsd.toLocaleString()} USD`
            : `≈ ${currentFinancials.netProfitDzd.toLocaleString()} DA`}
          {' • '}
          <span className="text-slate-300">
            {viewMode === 'today'
              ? "Encaissé aujourd'hui (crédits exclus jusqu'à confirmation)"
              : 'Ventes encaissées − Coûts Sourcing − Meta Ads − Dépenses'}
          </span>
        </div>

        {/* Pending Alert Badge inside Hero */}
        {currentFinancials.pendingPaymentsCount > 0 && (
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-200 text-xs font-bold">
            <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              +{currentFinancials.pendingPaymentsAmountDzd.toLocaleString()} DA en attente (
              {currentFinancials.pendingPaymentsCount} crédits non encaissés)
            </span>
          </div>
        )}

        {/* 4-Pill Financial Breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-4 border-t border-white/10">
          <div className="p-2 rounded-xl bg-slate-950/60 border border-white/5 text-center">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">
              Ventes Encaissées
            </span>
            <span className="text-xs sm:text-sm font-bold text-white block mt-0.5 truncate">
              {format(currentFinancials.totalRevenueDzd, currentFinancials.totalRevenueUsd)}
            </span>
          </div>

          <div className="p-2 rounded-xl bg-slate-950/60 border border-white/5 text-center">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">
              Coûts Sourcing
            </span>
            <span className="text-xs sm:text-sm font-bold text-amber-400 block mt-0.5 truncate">
              −{format(currentFinancials.totalProductCostDzd, currentFinancials.totalProductCostUsd)}
            </span>
          </div>

          <div className="p-2 rounded-xl bg-slate-950/60 border border-white/5 text-center">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">
              Meta Ads
            </span>
            <span className="text-xs sm:text-sm font-bold text-indigo-400 block mt-0.5 truncate">
              −{format(currentFinancials.totalMetaAdSpendDzd, currentFinancials.totalMetaAdSpendUsd)}
            </span>
          </div>

          <div className="p-2 rounded-xl bg-slate-950/60 border border-white/5 text-center">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">
              Dépenses
            </span>
            <span className="text-xs sm:text-sm font-bold text-rose-400 block mt-0.5 truncate">
              −{format(currentFinancials.totalExpensesDzd, currentFinancials.totalExpensesUsd)}
            </span>
          </div>
        </div>
      </div>

      {/* 7. Today's Operational Mini-HUD (Commandes, Ads, Caisse) */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 rounded-2xl glass-panel border border-white/10 text-center space-y-1">
          <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider truncate">
            {viewMode === 'today' ? "Commandes d'Auj." : viewMode === 'yesterday' ? "Commandes d'Hier" : 'Commandes Total'}
          </span>
          <div className="text-sm sm:text-base font-black text-white">
            {currentSales.length}{' '}
            <span className="text-[10px] font-normal text-slate-400">
              ({currentFinancials.paidSalesCount} payées)
            </span>
          </div>
          {currentFinancials.pendingPaymentsCount > 0 && (
            <span className="text-[10px] font-bold text-amber-400 block">
              {currentFinancials.pendingPaymentsCount} en attente
            </span>
          )}
        </div>

        <div className="p-3 rounded-2xl glass-panel border border-white/10 text-center space-y-1">
          <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider truncate">
            {viewMode === 'today' ? "Ads d'Aujourd'hui" : viewMode === 'yesterday' ? "Ads d'Hier" : 'Ads Meta Total'}
          </span>
          <div className="text-sm sm:text-base font-black text-indigo-300">
            {currentFinancials.totalMetaAdSpendDzd.toLocaleString()} DA
          </div>
          <span className="text-[10px] text-slate-400 block">
            {currentFinancials.totalMessagesCount} messages
          </span>
        </div>

        <div className="p-3 rounded-2xl glass-panel border border-white/10 text-center space-y-1">
          <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider truncate">
            Caisse 24h
          </span>
          <div className="text-sm sm:text-base font-black text-emerald-400">
            {activeCaisse ? 'Ouverte' : 'Fermée'}
          </div>
          <span className="text-[10px] text-slate-400 block truncate">
            {activeCaisse ? `${activeCaisse.initialBalanceDzd.toLocaleString()} DA` : '0 DA'}
          </span>
        </div>
      </div>

      {/* 8. Adem & Abdou Partners Split Card */}
      <div className="p-4 sm:p-5 rounded-2xl glass-panel border border-white/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
            <Users className="w-4 h-4 text-blue-400" />
            <span>
              {viewMode === 'today'
                ? "Partners Aujourd'hui"
                : viewMode === 'yesterday'
                ? 'Partners Hier'
                : 'Partners Performance Globale'}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            {currentFinancials.paidSalesCount} vente(s) encaissée(s)
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Adem */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-blue-500/20 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-400">Adem</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 font-semibold">
                {currentFinancials.ademSalesCount} payées
              </span>
            </div>
            <div className="text-base font-extrabold text-white">
              {format(currentFinancials.ademProfitDzd)}
            </div>
            <span className="text-[10px] text-slate-400 block truncate">
              {currentSales.filter((s) => s.soldBy === 'Adem' && s.paymentStatus === 'pending').length > 0
                ? `+ ${currentSales.filter((s) => s.soldBy === 'Adem' && s.paymentStatus === 'pending').length} à crédit`
                : 'Bénéfice encaissé'}
            </span>
          </div>

          {/* Abdou */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-emerald-500/20 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400">Abdou</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-semibold">
                {currentFinancials.abdouSalesCount} payées
              </span>
            </div>
            <div className="text-base font-extrabold text-white">
              {format(currentFinancials.abdouProfitDzd)}
            </div>
            <span className="text-[10px] text-slate-400 block truncate">
              {currentSales.filter((s) => s.soldBy === 'Abdou' && s.paymentStatus === 'pending').length > 0
                ? `+ ${currentSales.filter((s) => s.soldBy === 'Abdou' && s.paymentStatus === 'pending').length} à crédit`
                : 'Bénéfice encaissé'}
            </span>
          </div>
        </div>
      </div>

      {/* 9. Action Hub: Fast Sale + Ad Spend + Dépenses */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={openSaleModal}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm sm:text-base shadow-xl shadow-emerald-600/30 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[52px]"
        >
          <Plus className="w-5 h-5 stroke-[3]" />
          <span>+ Log New Digital Sale (3 sec)</span>
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={openAdSpendModal}
            className="py-3 px-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-indigo-500/30 hover:border-indigo-400 text-indigo-300 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[44px]"
          >
            <Megaphone className="w-4 h-4 text-indigo-400" />
            <span>End-of-Day Ad Spend</span>
          </button>

          <button
            type="button"
            onClick={openExpenseModal}
            className="py-3 px-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-rose-500/30 hover:border-rose-400 text-rose-300 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[44px]"
          >
            <Receipt className="w-4 h-4 text-rose-400" />
            <span>+ Log Dépense</span>
          </button>
        </div>
      </div>

      {/* 10. Growth Progress Graph (Shown automatically in 'all' view, toggleable in daily views) */}
      {viewMode === 'all' ? (
        <GrowthChart
          sales={sales}
          dailyAdSpends={dailyAdSpends}
          expenses={expenses}
          exchangeRate={exchangeRate}
        />
      ) : (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setShowGrowthChartInDaily((prev) => !prev)}
            className="w-full py-2.5 px-4 rounded-xl glass-panel border border-white/10 hover:border-white/20 text-xs font-bold text-slate-300 hover:text-white flex items-center justify-between transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Courbe de Croissance Globale & Tendance</span>
            </div>
            {showGrowthChartInDaily ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {showGrowthChartInDaily && (
            <div className="animate-fade-in">
              <GrowthChart
                sales={sales}
                dailyAdSpends={dailyAdSpends}
                expenses={expenses}
                exchangeRate={exchangeRate}
              />
            </div>
          )}
        </div>
      )}

      {/* 11. SALES FEED (Segmented by Pending vs Paid in Daily Mode) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-bold text-white">
              {viewMode === 'today'
                ? "Ventes du Jour (Aujourd'hui)"
                : viewMode === 'yesterday'
                ? "Ventes d'Hier"
                : 'Recent Sales'}
            </h3>
            <span className="text-[11px] px-2 py-0.5 rounded-full font-extrabold bg-slate-800 text-slate-300">
              {currentSales.length}
            </span>
          </div>

          <Link
            href="/orders"
            className="flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300"
          >
            <span>Voir Toutes ({sales.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {currentSales.length === 0 ? (
          <div className="p-8 rounded-2xl glass-card border border-white/10 text-center space-y-2">
            <ShoppingBag className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="text-xs font-bold text-slate-300">
              {viewMode === 'today'
                ? "Aucune vente enregistrée pour le moment aujourd'hui."
                : 'Aucune commande enregistrée pour cette période.'}
            </p>
            <p className="text-[11px] text-slate-500">
              Tapez sur &quot;+ Log New Digital Sale&quot; pour enregistrer une nouvelle commande en 3 secondes.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Section A: Pending Payments (crédits à encaisser) */}
            {pendingSalesInView.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 px-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    À ENCAISSER / CRÉDITS EN ATTENTE ({pendingSalesInView.length}) — Confirmer dès réception
                  </span>
                </div>

                <div className="space-y-2">
                  {pendingSalesInView.map((sale) => {
                    const waLink = generateWhatsAppLink(
                      sale.customerPhone,
                      `Salam! Juste un rappel pour le règlement de votre abonnement *${sale.productName}* (${sale.sellingPriceDzd.toLocaleString()} DA par BaridiMob). Merci!`
                    );

                    return (
                      <div
                        key={sale.id}
                        className="p-3.5 sm:p-4 rounded-2xl glass-card border border-amber-500/40 bg-amber-950/15 space-y-2.5 shadow-lg shadow-amber-950/20"
                      >
                        {/* Top Row: Sale #, Partner Tag, Payment Method & Status */}
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-amber-300 text-[11px]">
                              {sale.saleNumber}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                sale.soldBy === 'Adem'
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              }`}
                            >
                              {sale.soldBy}
                            </span>
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/30 text-amber-200 border border-amber-500/50">
                              <Clock className="w-3 h-3" />
                              <span>En Attente</span>
                            </span>
                          </div>

                          <span className="capitalize px-2 py-0.5 rounded bg-slate-950 text-[10px] font-semibold text-slate-300 border border-white/5">
                            {sale.paymentMethod}
                          </span>
                        </div>

                        {/* Product & Price */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-bold text-white text-sm sm:text-base">
                              {sale.productName}
                            </h4>
                            {sale.customerName && (
                              <p className="text-xs text-slate-300 font-medium mt-0.5">
                                Client: <span className="text-white font-semibold">{sale.customerName}</span>
                                {sale.customerPhone ? ` • ${sale.customerPhone}` : ''}
                              </p>
                            )}
                            {sale.pendingNote && (
                              <p className="text-[11px] text-amber-300/90 italic mt-0.5">
                                Note: {sale.pendingNote}
                              </p>
                            )}
                          </div>

                          <div className="text-right shrink-0">
                            <div className="text-sm sm:text-base font-black text-amber-300">
                              {sale.sellingPriceDzd.toLocaleString()} DA
                            </div>
                            <span className="text-[10px] font-bold text-amber-400/80 block">
                              À encaisser
                            </span>
                          </div>
                        </div>

                        {/* 1-Tap Payment Confirmation & Quick Actions */}
                        <div className="flex items-center justify-between pt-2 border-t border-amber-500/20 text-xs gap-2">
                          <button
                            type="button"
                            onClick={() => markSaleAsPaid(sale.id)}
                            className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/30 active:scale-95 transition-all min-h-[44px]"
                          >
                            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                            <span>Encaissé (Confirmer Paiement)</span>
                          </button>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {sale.customerPhone && (
                              <a
                                href={waLink}
                                target="_blank"
                                rel="noreferrer"
                                className="p-2 rounded-xl bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 min-w-[40px] min-h-[40px] flex items-center justify-center"
                                title="WhatsApp direct"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </a>
                            )}
                            {sale.deliveredKey && (
                              <button
                                type="button"
                                onClick={() => handleCopy(sale.deliveredKey!, sale.id)}
                                className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white min-w-[40px] min-h-[40px] flex items-center justify-center cursor-pointer"
                                title="Copy link"
                              >
                                {copiedId === sale.id ? (
                                  <Check className="w-4 h-4 text-emerald-400" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => deleteSale(sale.id)}
                              className="p-2 rounded-xl text-slate-500 hover:text-red-400 min-w-[40px] min-h-[40px] flex items-center justify-center cursor-pointer"
                              title="Delete sale"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Section B: Confirmed Paid Sales */}
            <div className="space-y-2">
              {pendingSalesInView.length > 0 && paidSalesInView.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 px-1 pt-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>VENTES ENCAISSÉES ({paidSalesInView.length})</span>
                </div>
              )}

              {paidSalesInView.map((sale) => {
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
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                          <Check className="w-3 h-3" />
                          <span>Encaissé</span>
                        </span>
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
                        {sale.customerName && (
                          <p className="text-xs text-slate-400 mt-0.5">
                            Client: <span className="text-slate-200">{sale.customerName}</span>
                          </p>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-sm sm:text-base font-extrabold text-white">
                          {sale.sellingPriceDzd.toLocaleString()} DA
                        </div>
                        <span className="text-[10px] font-bold text-emerald-400 block">
                          +{sale.netProfitDzd.toLocaleString()} DA encaissé
                        </span>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                      <span className="text-[10px] text-slate-500">
                        {new Date(sale.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>

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
          </div>
        )}
      </div>
    </div>
  );
}
