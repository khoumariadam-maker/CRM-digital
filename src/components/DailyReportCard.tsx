'use client';

import React, { useState } from 'react';
import { X, Copy, Check, BarChart3, TrendingUp, Package } from 'lucide-react';

interface DailyReportCardProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  salesCount: number;
  pendingCount: number;
  revenueDzd: number;
  netProfitDzd: number;
  metaAdsDzd: number;
  baridiMobBalanceDzd: number;
  stockRemaining: number;
}

export default function DailyReportCard({
  isOpen,
  onClose,
  date,
  salesCount,
  pendingCount,
  revenueDzd,
  netProfitDzd,
  metaAdsDzd,
  baridiMobBalanceDzd,
  stockRemaining,
}: DailyReportCardProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const whatsappText = `📅 DzDigital — ${date}
━━━━━━━━━━━━━━━━━
✅ Ventes encaissées : ${salesCount} ventes = ${revenueDzd.toLocaleString()} DA
⏳ Crédits en attente : ${pendingCount} commande(s)
📣 Ads Meta : ${metaAdsDzd.toLocaleString()} DA
💰 Bénéfice net : ${netProfitDzd.toLocaleString()} DA
💳 Solde BaridiMob : ${baridiMobBalanceDzd.toLocaleString()} DA
📦 Stock restant : ${stockRemaining} liens
━━━━━━━━━━━━━━━━━
DzDigital CRM 🇩🇿`;

  const handleCopy = () => {
    navigator.clipboard.writeText(whatsappText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-sm rounded-2xl bg-[#0d1117] border border-white/10 shadow-2xl overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-black text-white">Rapport du Jour</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Date */}
        <div className="px-5 pt-4 pb-2">
          <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">{date}</p>
        </div>

        {/* Stats Grid */}
        <div className="px-5 pb-4 grid grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/20 space-y-0.5">
            <p className="text-[10px] font-bold text-emerald-400 uppercase">Ventes encaissées</p>
            <p className="text-xl font-black text-white">{salesCount}</p>
            <p className="text-[10px] text-slate-400">{revenueDzd.toLocaleString()} DA</p>
          </div>
          <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/20 space-y-0.5">
            <p className="text-[10px] font-bold text-amber-400 uppercase">À Encaisser</p>
            <p className="text-xl font-black text-white">{pendingCount}</p>
            <p className="text-[10px] text-slate-400">crédits en attente</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/5 space-y-0.5">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Bénéfice Net</p>
            <p className="text-xl font-black text-emerald-300">+{netProfitDzd.toLocaleString()}</p>
            <p className="text-[10px] text-slate-400">DA aujourd&apos;hui</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/5 space-y-0.5">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Solde BaridiMob</p>
            <p className="text-base font-black text-white">{baridiMobBalanceDzd.toLocaleString()}</p>
            <p className="text-[10px] text-slate-400">DA</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/80 border border-white/5 flex items-center justify-between col-span-2">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-white">Stock restant</span>
            </div>
            <span className="text-xs font-mono font-black text-white">{stockRemaining} liens</span>
          </div>
          {metaAdsDzd > 0 && (
            <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-500/20 flex items-center justify-between col-span-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-white">Ads Meta</span>
              </div>
              <span className="text-xs font-mono font-black text-blue-300">-{metaAdsDzd.toLocaleString()} DA</span>
            </div>
          )}
        </div>

        {/* Copy Button */}
        <div className="px-5 pb-5">
          <button
            type="button"
            onClick={handleCopy}
            className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition-all text-white text-sm font-black flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/30 min-h-[48px]"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? '✓ Copié pour WhatsApp !' : '📋 Copier le Rapport WhatsApp'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
