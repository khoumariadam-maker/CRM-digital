'use client';

import React, { useState } from 'react';
import { useCRMData } from '@/context/CRMDataContext';
import { useCurrency } from '@/context/CurrencyContext';
import { generateWhatsAppLink } from '@/lib/calculations';

// shadcn UI primitives
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const pendingSalesCount = sales.filter((s) => s.paymentStatus === 'pending').length;
  const confirmedSalesCount = sales.filter((s) => s.paymentStatus === 'paid' || !s.paymentStatus).length;

  const filteredSales = sales.filter((s) => {
    let matchesFilter = true;
    if (statusFilter === 'pending') {
      matchesFilter = s.paymentStatus === 'pending';
    } else if (statusFilter === 'confirmed') {
      matchesFilter = s.paymentStatus === 'paid' || !s.paymentStatus;
    }

    const matchesSearch =
      s.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.customerName && s.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.customerPhone && s.customerPhone.includes(searchQuery)) ||
      s.saleNumber.includes(searchQuery);

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="flex flex-col gap-4 sm:gap-6 animate-fade-in pb-16 max-w-4xl mx-auto">
      {/* Header Card */}
      <Card className="glass-panel border-white/10 p-4 sm:p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 ring-0">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>JOURNAL DES VENTES</span>
          </div>
          <CardTitle className="text-xl sm:text-2xl font-black text-white">Suivi des Ventes</CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Historique complet des licences délivrées, encaissements et crédits clients.
          </CardDescription>
        </div>

        <Button
          type="button"
          onClick={openSaleModal}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 h-10 px-4 rounded-xl shrink-0"
        >
          <Plus className="size-4" data-icon="inline-start" />
          <span>+ Nouvelle Vente</span>
        </Button>
      </Card>

      {/* Tabs & Search */}
      <div className="flex flex-col gap-3">
        <Tabs
          value={statusFilter}
          onValueChange={(val) => setStatusFilter(val as 'all' | 'confirmed' | 'pending')}
          className="w-full"
        >
          <TabsList className="grid grid-cols-3 w-full h-11 bg-slate-950 border border-white/10 p-1 rounded-2xl">
            <TabsTrigger
              value="all"
              className="rounded-xl text-xs font-bold data-active:bg-emerald-600 data-active:text-white"
            >
              Toutes ({sales.length})
            </TabsTrigger>

            <TabsTrigger
              value="confirmed"
              className="rounded-xl text-xs font-bold data-active:bg-emerald-600 data-active:text-white"
            >
              Encaissées ({confirmedSalesCount})
            </TabsTrigger>

            <TabsTrigger
              value="pending"
              className="rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 data-active:bg-amber-600 data-active:text-white"
            >
              <Clock className="size-3.5" />
              <span>À Encaisser ({pendingSalesCount})</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <Input
            type="text"
            placeholder="Rechercher par produit, client, téléphone, ou n° de vente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border-white/10 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 h-10"
          />
        </div>
      </div>

      {/* Sales Stream Cards */}
      <div className="flex flex-col gap-3">
        {filteredSales.length === 0 ? (
          <div className="p-8 text-center glass-panel rounded-2xl border border-white/10 space-y-2">
            <ShoppingBag className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="text-sm font-bold text-white">Aucune vente trouvée</p>
            <p className="text-xs text-slate-400">Essayez une autre recherche ou enregistrez une vente.</p>
          </div>
        ) : (
          filteredSales.map((sale) => {
            const isPending = sale.paymentStatus === 'pending';

            const waLink = generateWhatsAppLink(
              sale.customerPhone,
              sale.deliveredKey
                ? `Salam! Vos accès pour *${sale.productName}*:\n🔑 ${sale.deliveredKey}\n\nMerci pour votre confiance!`
                : `Salam! Confirmation de votre commande pour *${sale.productName}*.`
            );

            return (
              <Card
                key={sale.id}
                className={`p-4 sm:p-5 rounded-2xl glass-card ring-0 flex flex-col gap-3 ${
                  isPending ? 'border-amber-500/40 bg-amber-950/10' : 'border-white/10'
                }`}
              >
                {/* Top Info */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-300 text-xs sm:text-sm">
                      {sale.saleNumber}
                    </span>

                    {isPending ? (
                      <Badge
                        variant="outline"
                        className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px] font-bold flex items-center gap-1"
                      >
                        <Clock className="size-3" />
                        <span>En Attente</span>
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px] font-bold flex items-center gap-1"
                      >
                        <CheckCircle2 className="size-3" />
                        <span>Payé</span>
                      </Badge>
                    )}
                  </div>

                  <Badge variant="outline" className="capitalize text-[10px] font-semibold text-slate-400 bg-slate-950 border-white/5">
                    {sale.paymentMethod || 'BaridiMob'}
                  </Badge>
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
                    <div className="text-base sm:text-lg font-black text-white font-mono">
                      {sale.sellingPriceDzd.toLocaleString()} DA
                    </div>
                    <span className="text-[10px] text-emerald-400 font-bold block">
                      +{sale.netProfitDzd.toLocaleString()} DA net
                    </span>
                  </div>
                </div>

                {/* License Key Display (if delivered) */}
                {sale.deliveredKey && (
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-white/5 flex items-center justify-between gap-2 text-xs font-mono text-emerald-300">
                    <span className="truncate">{sale.deliveredKey}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleCopy(sale.deliveredKey!, sale.id)}
                      className="text-slate-400 hover:text-white shrink-0"
                      title="Copier la clé"
                    >
                      {copiedId === sale.id ? (
                        <Check className="size-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="size-3.5" />
                      )}
                    </Button>
                  </div>
                )}

                {/* Bottom Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                  {/* Mark as paid button if pending */}
                  {isPending ? (
                    <Button
                      type="button"
                      onClick={() => markSaleAsPaid(sale.id)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-8 rounded-xl shadow-md shadow-emerald-600/20 active:scale-95"
                    >
                      <CheckCircle2 className="size-3.5" data-icon="inline-start" />
                      <span>Encaissé (Confirmer)</span>
                    </Button>
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

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => deleteSale(sale.id)}
                      className="text-slate-500 hover:text-red-400"
                      title="Supprimer la vente"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
