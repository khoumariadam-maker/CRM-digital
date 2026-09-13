'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useCRMData } from '@/context/CRMDataContext';
import { useCurrency } from '@/context/CurrencyContext';
import { generateWhatsAppLink } from '@/lib/calculations';
import GrowthChart from '@/components/dashboard/GrowthChart';
import DailyReportCard from '@/components/DailyReportCard';
import {
  Landmark,
  Plus,
  Clock,
  CheckCircle2,
  Copy,
  Check,
  MessageCircle,
  Trash2,
  Megaphone,
  Receipt,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  AlertTriangle,
  ChevronRight,
  BarChart3,
  Edit3,
  ArrowUpRight,
  Wallet,
  DollarSign,
  Layers,
  Sparkles,
  X,
} from 'lucide-react';

export default function DashboardPage() {
  const {
    sales,
    products,
    expiringStockItems,
    financials,
    deleteSale,
    markSaleAsPaid,
    dailyAdSpends,
    expenses,
    openSaleModal,
    openAdSpendModal,
    openExpenseModal,
    openCaisseModal,
    startingCapitalDzd,
    updateStartingCapital,
    openInitialSetup,
  } = useCRMData();
  const { format, exchangeRate, currency } = useCurrency();

  // Feed Tab: 'pending' (actionable credits) | 'confirmed' (paid sales)
  const [feedTab, setFeedTab] = useState<'pending' | 'confirmed'>('pending');
  const [showChart, setShowChart] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);

  // Quick Balance Adjustment Modal
  const [isEditBalanceOpen, setIsEditBalanceOpen] = useState(false);
  const [newBalanceInput, setNewBalanceInput] = useState('');
  const [isSavingBalance, setIsSavingBalance] = useState(false);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Segregate pending vs paid sales
  const pendingSales = useMemo(() => {
    return sales.filter((s) => s.paymentStatus === 'pending');
  }, [sales]);

  const paidSales = useMemo(() => {
    return sales.filter((s) => s.paymentStatus !== 'pending');
  }, [sales]);

  // Actual Real-Time BaridiMob Capital
  const baridiMobBalance = useMemo(() => {
    return financials.baridiMobCurrentBalanceDzd ?? (startingCapitalDzd + financials.netProfitDzd);
  }, [financials, startingCapitalDzd]);

  // Stock remaining (non-expired keys across products)
  const stockRemaining = useMemo(() => {
    const now = new Date();
    return products.reduce((total, p) => {
      const validKeys = (p.stockItems || []).filter(
        (item) => !item.expiresAt || new Date(item.expiresAt) > now
      ).length;
      return total + (validKeys || p.stockKeys?.length || 0);
    }, 0);
  }, [products]);

  // Today's Date String
  const todayDateStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todayPaidSales = useMemo(
    () => paidSales.filter((s) => s.createdAt.startsWith(todayDateStr)),
    [paidSales, todayDateStr]
  );
  const todayPendingSales = useMemo(
    () => pendingSales.filter((s) => s.createdAt.startsWith(todayDateStr)),
    [pendingSales, todayDateStr]
  );
  const todayRevenueDzd = useMemo(
    () => todayPaidSales.reduce((sum, s) => sum + (s.sellingPriceDzd || 0), 0),
    [todayPaidSales]
  );
  const todayAdsSpend = useMemo(
    () =>
      dailyAdSpends
        .filter((a) => a.date === todayDateStr)
        .reduce((sum, a) => sum + (a.spendDzd || 0), 0),
    [dailyAdSpends, todayDateStr]
  );
  const todayExpenses = useMemo(
    () =>
      expenses
        .filter((e) => e.createdAt.startsWith(todayDateStr))
        .reduce((sum, e) => sum + (e.amountDzd || 0), 0),
    [expenses, todayDateStr]
  );

  const handleSaveBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(newBalanceInput.replace(',', '.'));
    if (!isNaN(val) && val >= 0) {
      setIsSavingBalance(true);
      try {
        await updateStartingCapital(val);
        setIsEditBalanceOpen(false);
      } finally {
        setIsSavingBalance(false);
      }
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in pb-20 max-w-2xl mx-auto">
      {/* 1. HERO: REAL BARIDIMOB CAPITAL CARD */}
      <div className="relative p-5 sm:p-7 rounded-3xl bg-gradient-to-br from-[#0e1626] via-[#090d16] to-[#0b101c] border border-emerald-500/25 shadow-2xl shadow-emerald-950/30 overflow-hidden">
        {/* Glow ambient background elements */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-teal-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-3">
          {/* Header row of card */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                <Landmark className="w-4 h-4" />
              </div>
              <span className="text-[11px] sm:text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Solde BaridiMob Actuel
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setNewBalanceInput(baridiMobBalance.toString());
                setIsEditBalanceOpen(true);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-slate-300 hover:text-white text-[11px] font-semibold transition-all cursor-pointer"
              title="Ajuster le solde BaridiMob"
            >
              <Edit3 className="w-3 h-3 text-emerald-400" />
              <span>Ajuster</span>
            </button>
          </div>

          {/* Big Balance Number */}
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-5xl font-black text-white tracking-tight font-mono">
              {format(baridiMobBalance)}
            </span>
          </div>

          {/* Today's Context Subtitle */}
          <div className="flex items-center flex-wrap gap-2 text-xs font-medium text-slate-400 pt-1">
            <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              Aujourd&apos;hui: +{(financials.todayProfitDzd || 0).toLocaleString()} DA
            </span>
            {todayAdsSpend > 0 && (
              <span className="text-indigo-300 font-medium">
                • Ads: -{todayAdsSpend.toLocaleString()} DA
              </span>
            )}
            {todayExpenses > 0 && (
              <span className="text-rose-300 font-medium">
                • Dépenses: -{todayExpenses.toLocaleString()} DA
              </span>
            )}
            <span>• {todayPaidSales.length} vente(s)</span>
          </div>

          {/* Pending Debts Alert Badge (Clickable to switch tab) */}
          {financials.pendingPaymentsCount > 0 && (
            <button
              type="button"
              onClick={() => setFeedTab('pending')}
              className="mt-2 w-full p-3 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-200 text-xs font-bold flex items-center justify-between transition-all cursor-pointer active:scale-[0.99]"
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
                <span>
                  {financials.pendingPaymentsCount} crédit(s) en attente ({financials.pendingPaymentsAmountDzd.toLocaleString()} DA)
                </span>
              </div>
              <span className="text-[11px] text-amber-300 font-extrabold underline flex items-center gap-0.5">
                Voir &amp; Encaisser &darr;
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Stock Expiry Alert Banner */}
      {expiringStockItems && expiringStockItems.length > 0 && (
        <Link href="/products" className="block">
          <div className="p-3.5 rounded-2xl bg-red-950/40 border border-red-500/40 flex items-center justify-between gap-2 active:scale-[0.99] transition-transform hover:bg-red-950/60 shadow-lg shadow-red-950/20">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
              <div>
                <p className="text-xs font-black text-red-300">
                  {expiringStockItems.filter((i) => i.isExpired).length > 0
                    ? `🚨 ${expiringStockItems.filter((i) => i.isExpired).length} lien(s) de stock expiré(s)`
                    : `⚠️ ${expiringStockItems.filter((i) => i.isExpiringSoon).length} lien(s) expirent dans moins de 24h`}
                </p>
                <p className="text-[10px] text-red-400/80 mt-0.5">Appuyez pour réapprovisionner ou supprimer →</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-red-400 shrink-0" />
          </div>
        </Link>
      )}

      {/* 2. PRIMARY ACTION: BIG FAST SALE BUTTON (< 3s Sale) */}
      <div className="space-y-2.5">
        <button
          type="button"
          onClick={openSaleModal}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-base shadow-xl shadow-emerald-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-3 cursor-pointer min-h-[58px]"
        >
          <Plus className="w-6 h-6 stroke-[3]" />
          <span>+ Nouvelle Vente Flash (&lt; 3s)</span>
        </button>

        {/* Secondary Quick Action Row */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <button
            type="button"
            onClick={openAdSpendModal}
            className="py-3 px-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-white/10 hover:border-indigo-500/40 text-indigo-300 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[48px] active:scale-95"
          >
            <Megaphone className="w-4 h-4 text-indigo-400" />
            <span>+ Ads Meta</span>
          </button>

          <button
            type="button"
            onClick={openExpenseModal}
            className="py-3 px-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-white/10 hover:border-rose-500/40 text-rose-300 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[48px] active:scale-95"
          >
            <Receipt className="w-4 h-4 text-rose-400" />
            <span>+ Dépense</span>
          </button>
        </div>

        {/* Third Quick Action Row: Caisse Shift & WhatsApp Report */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <button
            type="button"
            onClick={openCaisseModal}
            className="py-2.5 px-3 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-white/5 hover:border-cyan-500/30 text-cyan-300 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[44px]"
          >
            <Wallet className="w-4 h-4 text-cyan-400" />
            <span>Shift de Caisse</span>
          </button>

          <button
            type="button"
            onClick={() => setIsReportOpen(true)}
            className="py-2.5 px-3 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-white/5 hover:border-emerald-500/30 text-slate-300 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[44px]"
          >
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <span>Rapport WhatsApp</span>
          </button>
        </div>
      </div>

      {/* 3. METRICS CARDS: NET PROFIT, REVENUE, ADS, EXPENSES */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Net Profit */}
        <div className="p-3.5 rounded-2xl glass-card border border-white/10 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Bénéfice Net
          </span>
          <div className="text-lg sm:text-xl font-black text-emerald-400 font-mono">
            {format(financials.netProfitDzd)}
          </div>
          <span className="text-[10px] text-slate-500 font-medium">
            Marge: {financials.profitMarginPercent}%
          </span>
        </div>

        {/* Total Revenue */}
        <div className="p-3.5 rounded-2xl glass-card border border-white/10 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Chiffre d&apos;Affaires
          </span>
          <div className="text-lg sm:text-xl font-black text-cyan-300 font-mono">
            {format(financials.totalRevenueDzd)}
          </div>
          <span className="text-[10px] text-slate-500 font-medium">
            {paidSales.length} ventes
          </span>
        </div>

        {/* Ads Spend */}
        <div className="p-3.5 rounded-2xl glass-card border border-white/10 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Meta Ads
          </span>
          <div className="text-lg sm:text-xl font-black text-indigo-300 font-mono">
            {format(financials.totalMetaAdSpendDzd)}
          </div>
          <span className="text-[10px] text-slate-500 font-medium">
            {dailyAdSpends.length} jour(s)
          </span>
        </div>

        {/* Expenses */}
        <div className="p-3.5 rounded-2xl glass-card border border-white/10 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Dépenses
          </span>
          <div className="text-lg sm:text-xl font-black text-rose-300 font-mono">
            {format(financials.totalExpensesDzd)}
          </div>
          <span className="text-[10px] text-slate-500 font-medium">
            {expenses.length} dépense(s)
          </span>
        </div>
      </div>

      {/* 4. SEGMENTED ORDERS FEED: À ENCAISSER vs CONFIRMÉES */}
      <div className="space-y-3 pt-2">
        {/* Segmented Control Pills */}
        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-slate-950 border border-white/10">
          <button
            type="button"
            onClick={() => setFeedTab('pending')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[44px] ${
              feedTab === 'pending'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 font-extrabold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>À Encaisser (Crédits)</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-black ${
                feedTab === 'pending' ? 'bg-amber-800 text-white' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {pendingSales.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFeedTab('confirmed')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[44px] ${
              feedTab === 'confirmed'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 font-extrabold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>Ventes Encaissées</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-black ${
                feedTab === 'confirmed' ? 'bg-emerald-800 text-white' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {paidSales.length}
            </span>
          </button>
        </div>

        {/* FEED CONTENT */}
        {feedTab === 'pending' ? (
          /* PENDING DEBTS LIST */
          pendingSales.length === 0 ? (
            <div className="p-8 rounded-3xl glass-card border border-white/10 text-center space-y-2.5">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white">
                Tous les paiements sont encaissés !
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Aucun client en attente de paiement pour le moment. Enregistrez une nouvelle vente ci-dessus.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingSales.map((sale) => {
                const waLink = generateWhatsAppLink(
                  sale.customerPhone,
                  `Salam! Juste un petit rappel pour le règlement de votre commande *${sale.productName}* (${sale.sellingPriceDzd.toLocaleString()} DA par BaridiMob). Merci!`
                );

                return (
                  <div
                    key={sale.id}
                    className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-amber-500/40 space-y-3 shadow-lg shadow-amber-950/20"
                  >
                    {/* Top Row: Product, Amount, Date */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[11px] text-amber-400 font-bold">
                            {sale.saleNumber}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            En Attente
                          </span>
                        </div>
                        <h4 className="font-bold text-white text-base mt-0.5">
                          {sale.productName}
                        </h4>
                        {sale.customerName && (
                          <p className="text-xs text-slate-300 font-medium">
                            Client : <span className="text-white font-semibold">{sale.customerName}</span>
                            {sale.customerPhone ? ` • ${sale.customerPhone}` : ''}
                          </p>
                        )}
                        {sale.pendingNote && (
                          <p className="text-[11px] text-amber-300/90 italic">
                            Note : {sale.pendingNote}
                          </p>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-lg sm:text-xl font-black text-amber-300 font-mono">
                          {sale.sellingPriceDzd.toLocaleString()} DA
                        </div>
                        <span className="text-[10px] font-semibold text-slate-400 block">
                          À encaisser
                        </span>
                      </div>
                    </div>

                    {/* Activation link / Key delivery snippet */}
                    {sale.deliveredKey && (
                      <div className="p-3 rounded-xl bg-slate-900 border border-white/5 space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
                          <span>Lien / Code d&apos;accès :</span>
                          <span className="text-emerald-400">Prêt à envoyer</span>
                        </div>
                        <p className="text-xs font-mono text-emerald-300 truncate select-all">
                          {sale.deliveredKey}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleCopy(sale.deliveredKey!, sale.id)}
                          className="w-full py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                        >
                          {copiedId === sale.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Copié dans le presse-papier !</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-emerald-400" />
                              <span>📋 Copier le Lien d&apos;Activation</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Action Row: Confirm Payment & WhatsApp */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/5 gap-2">
                      <button
                        type="button"
                        onClick={() => markSaleAsPaid(sale.id)}
                        className="flex-1 py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 active:scale-95 transition-all cursor-pointer min-h-[46px]"
                      >
                        <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                        <span>✅ Encaissé (Confirmer)</span>
                      </button>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {sale.customerPhone && (
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2.5 rounded-xl bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 min-w-[44px] min-h-[44px] flex items-center justify-center"
                            title="Envoyer rappel WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() => deleteSale(sale.id)}
                          className="p-2.5 rounded-xl text-slate-500 hover:text-red-400 min-w-[40px] min-h-[44px] flex items-center justify-center cursor-pointer"
                          title="Supprimer la commande"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* CONFIRMED PAID SALES LIST */
          paidSales.length === 0 ? (
            <div className="p-8 sm:p-10 rounded-3xl glass-card border border-white/10 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white">
                Aucune vente encore enregistrée
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Appuyez sur &quot;+ Nouvelle Vente Flash&quot; pour logguer votre première commande en 3 secondes.
              </p>
              <button
                type="button"
                onClick={openSaleModal}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 transition-all cursor-pointer shadow-lg shadow-emerald-600/20"
              >
                <Plus className="w-4 h-4" />
                <span>Enregistrer une Vente</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {paidSales.map((sale) => {
                const waLink = generateWhatsAppLink(
                  sale.customerPhone,
                  sale.deliveredKey
                    ? `Salam! Vos accès pour *${sale.productName}*:\n🔑 ${sale.deliveredKey}\n\nMerci pour votre achat!`
                    : `Salam! Confirmation de votre commande pour *${sale.productName}* (${sale.sellingPriceDzd.toLocaleString()} DA).`
                );

                return (
                  <div
                    key={sale.id}
                    className="p-4 rounded-2xl bg-slate-950 border border-white/10 space-y-2.5 hover:border-white/20 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] text-slate-400 font-bold">
                            {sale.saleNumber}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                            Encaissé
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(sale.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <h4 className="font-bold text-white text-base mt-1">
                          {sale.productName}
                        </h4>
                        {sale.customerName && (
                          <p className="text-xs text-slate-400 mt-0.5">
                            Client : <span className="text-slate-200">{sale.customerName}</span>
                          </p>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-base sm:text-lg font-black text-white font-mono">
                          {sale.sellingPriceDzd.toLocaleString()} DA
                        </div>
                        <span className="text-[10px] font-bold text-emerald-400 block">
                          +{sale.netProfitDzd.toLocaleString()} DA net
                        </span>
                      </div>
                    </div>

                    {/* Delivered link with copy button */}
                    {sale.deliveredKey && (
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-between gap-2">
                        <p className="text-xs font-mono text-emerald-300 truncate">
                          {sale.deliveredKey}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleCopy(sale.deliveredKey!, sale.id)}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white cursor-pointer shrink-0"
                          title="Copier le lien"
                        >
                          {copiedId === sale.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    )}

                    {/* Action Bar */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                      <span className="capitalize text-[10px] text-slate-400 font-semibold bg-white/5 px-2 py-0.5 rounded-md">
                        {sale.paymentMethod || 'BaridiMob'}
                      </span>

                      <div className="flex items-center gap-1.5 ml-auto">
                        {sale.customerPhone && (
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 rounded-xl bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 min-w-[36px] min-h-[36px] flex items-center justify-center"
                            title="WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() => deleteSale(sale.id)}
                          className="p-2 rounded-xl text-slate-500 hover:text-red-400 min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* 5. COLLAPSIBLE GROWTH CHART AT BOTTOM */}
      <div className="pt-2 border-t border-white/5">
        <button
          type="button"
          onClick={() => setShowChart(!showChart)}
          className="w-full py-3 px-4 rounded-2xl bg-slate-950/80 hover:bg-slate-900 border border-white/5 hover:border-white/10 text-xs font-semibold text-slate-400 hover:text-white flex items-center justify-between transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Courbe de Croissance &amp; Tendances</span>
          </div>
          {showChart ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {showChart && (
          <div className="mt-3 animate-fade-in">
            <GrowthChart
              sales={sales}
              dailyAdSpends={dailyAdSpends}
              expenses={expenses}
              exchangeRate={exchangeRate}
            />
          </div>
        )}
      </div>

      {/* Quick Adjust Balance Modal */}
      {isEditBalanceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-[#0F1525] border border-emerald-500/30 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Landmark className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">Ajuster Solde BaridiMob</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditBalanceOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Saisissez le montant exact présent actuellement sur votre compte BaridiMob.
            </p>

            <form onSubmit={handleSaveBalance} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Solde en Dinar Algérien (DA)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    inputMode="numeric"
                    step="any"
                    min="0"
                    required
                    value={newBalanceInput}
                    onChange={(e) => setNewBalanceInput(e.target.value)}
                    placeholder="ex: 25000"
                    autoFocus
                    className="w-full bg-slate-900 border border-white/10 focus:border-emerald-500 rounded-xl px-4 py-3 text-xl font-bold text-white placeholder-slate-600 focus:outline-none"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                    DA
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditBalanceOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-300 font-semibold text-xs hover:bg-white/5 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSavingBalance || newBalanceInput.trim() === ''}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 cursor-pointer"
                >
                  {isSavingBalance ? 'Enregistrement...' : 'Valider'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Daily Report Card Modal */}
      <DailyReportCard
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        date={new Date().toLocaleDateString('fr-DZ', { day: 'numeric', month: 'long', year: 'numeric' })}
        salesCount={todayPaidSales.length}
        pendingCount={todayPendingSales.length}
        revenueDzd={todayRevenueDzd}
        netProfitDzd={financials.todayProfitDzd || 0}
        metaAdsDzd={todayAdsSpend}
        baridiMobBalanceDzd={baridiMobBalance}
        stockRemaining={stockRemaining}
      />
    </div>
  );
}
