'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Landmark, Package, Settings, Plus } from 'lucide-react';
import { useCRMData } from '@/context/CRMDataContext';

export default function MobileNav() {
  const pathname = usePathname();
  const { openSaleModal, financials } = useCRMData();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-white/10 px-4 py-2 pb-[max(0.6rem,env(safe-area-inset-bottom))] lg:hidden shadow-2xl">
      <div className="flex items-center justify-around max-w-md mx-auto relative">
        {/* Tab 1: Caisse & Ventes */}
        <Link
          href="/"
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            pathname === '/' ? 'text-emerald-400 font-extrabold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Landmark className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Caisse & Ventes</span>
        </Link>

        {/* Center Floating "+" Button to Log Fast Sale */}
        <div className="relative -top-5 flex justify-center">
          <button
            type="button"
            onClick={openSaleModal}
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-500 text-white shadow-xl shadow-emerald-500/40 flex items-center justify-center active:scale-95 transition-all border-4 border-[#0B0F17] cursor-pointer"
            title="Nouvelle Vente"
            aria-label="Nouvelle Vente"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </button>
        </div>

        {/* Tab 2: Stock & Liens */}
        <Link
          href="/products"
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all relative ${
            pathname === '/products' ? 'text-emerald-400 font-extrabold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Package className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Stock / Liens</span>
        </Link>

        {/* Tab 3: Paramètres */}
        <Link
          href="/settings"
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            pathname === '/settings' ? 'text-emerald-400 font-extrabold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Paramètres</span>
        </Link>
      </div>
    </div>
  );
}
