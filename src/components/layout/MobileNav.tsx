'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShoppingBag, Package, Settings, Plus } from 'lucide-react';
import { useCRMData } from '@/context/CRMDataContext';
import { Badge } from '@/components/ui/badge';

export default function MobileNav() {
  const pathname = usePathname();
  const { openSaleModal, sales, expiringStockItems } = useCRMData();

  const pendingCount = sales.filter((s) => s.paymentStatus === 'pending').length;
  const expiredCount = (expiringStockItems || []).length;

  return (
    <nav
      aria-label="Navigation Principale Mobile"
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#090D16]/95 backdrop-blur-2xl border-t border-white/[0.08] px-2 py-1.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden shadow-[0_-8px_32px_rgba(0,0,0,0.5)]"
    >
      <div className="grid grid-cols-5 items-center max-w-lg mx-auto relative">
        {/* Tab 1: Tableau de bord */}
        <Link
          href="/"
          className={`flex flex-col items-center justify-center min-h-[48px] py-1 px-1 rounded-2xl transition-all duration-200 active:scale-95 ${
            pathname === '/'
              ? 'text-emerald-400 font-bold bg-emerald-500/10'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className={`w-5 h-5 transition-transform ${pathname === '/' ? 'scale-110' : ''}`} />
          <span className="text-[11px] tracking-tight mt-0.5">Tableau</span>
        </Link>

        {/* Tab 2: Commandes & Ventes */}
        <Link
          href="/orders"
          className={`flex flex-col items-center justify-center min-h-[48px] py-1 px-1 rounded-2xl transition-all duration-200 relative active:scale-95 ${
            pathname === '/orders'
              ? 'text-emerald-400 font-bold bg-emerald-500/10'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <ShoppingBag className={`w-5 h-5 transition-transform ${pathname === '/orders' ? 'scale-110' : ''}`} />
            {pendingCount > 0 && (
              <Badge
                variant="outline"
                className="absolute -top-1.5 -right-2.5 h-4 px-1 text-[9px] font-black bg-amber-500 text-slate-950 border-amber-400 ring-2 ring-[#090D16] animate-pulse"
              >
                {pendingCount}
              </Badge>
            )}
          </div>
          <span className="text-[11px] tracking-tight mt-0.5">Ventes</span>
        </Link>

        {/* Center Floating Action Button (+) — 56px touch target */}
        <div className="flex items-center justify-center relative -top-4">
          <button
            type="button"
            onClick={openSaleModal}
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 text-white shadow-xl shadow-emerald-500/40 flex items-center justify-center active:scale-90 transition-transform duration-150 border-4 border-[#090D16] cursor-pointer hover:brightness-110 focus:outline-none"
            title="Nouvelle Vente Flash (3s)"
            aria-label="Nouvelle Vente Flash"
          >
            <Plus className="w-7 h-7 stroke-[3] transition-transform group-active:rotate-90" />
          </button>
        </div>

        {/* Tab 3: Stock & Liens */}
        <Link
          href="/products"
          className={`flex flex-col items-center justify-center min-h-[48px] py-1 px-1 rounded-2xl transition-all duration-200 relative active:scale-95 ${
            pathname === '/products'
              ? 'text-emerald-400 font-bold bg-emerald-500/10'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Package className={`w-5 h-5 transition-transform ${pathname === '/products' ? 'scale-110' : ''}`} />
            {expiredCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1.5 -right-2.5 h-4 px-1 text-[9px] font-black ring-2 ring-[#090D16]"
              >
                !
              </Badge>
            )}
          </div>
          <span className="text-[11px] tracking-tight mt-0.5">Stock</span>
        </Link>

        {/* Tab 4: Paramètres */}
        <Link
          href="/settings"
          className={`flex flex-col items-center justify-center min-h-[48px] py-1 px-1 rounded-2xl transition-all duration-200 active:scale-95 ${
            pathname === '/settings'
              ? 'text-emerald-400 font-bold bg-emerald-500/10'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Settings className={`w-5 h-5 transition-transform ${pathname === '/settings' ? 'scale-110' : ''}`} />
          <span className="text-[11px] tracking-tight mt-0.5">Réglages</span>
        </Link>
      </div>
    </nav>
  );
}
