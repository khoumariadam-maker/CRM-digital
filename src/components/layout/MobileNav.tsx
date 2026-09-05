'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShoppingBag, Package, Settings, Plus } from 'lucide-react';
import { useCRMData } from '@/context/CRMDataContext';

interface MobileNavProps {
  onOpenAddSale: () => void;
}

export default function MobileNav({ onOpenAddSale }: MobileNavProps) {
  const pathname = usePathname();
  const { sales } = useCRMData();

  const navItems = [
    { label: 'Overview', href: '/', icon: LayoutDashboard },
    { label: 'Sales', href: '/orders', icon: ShoppingBag, badge: sales.length },
    { label: 'Products', href: '/products', icon: Package },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-white/10 px-3 py-2 pb-safe lg:hidden">
      <div className="flex items-center justify-between max-w-md mx-auto relative">
        {/* Tab 1: Overview */}
        <Link
          href="/"
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            pathname === '/' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px]">Overview</span>
        </Link>

        {/* Tab 2: Sales */}
        <Link
          href="/orders"
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all relative ${
            pathname === '/orders' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShoppingBag className="w-5 h-5" />
          <span className="text-[10px]">Sales</span>
          {sales.length > 0 && (
            <span className="absolute 0 top-0.5 right-2 w-2 h-2 rounded-full bg-emerald-400" />
          )}
        </Link>

        {/* Center Floating "+" Button */}
        <div className="relative -top-5 flex justify-center">
          <button
            onClick={onOpenAddSale}
            className="w-13 h-13 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-xl shadow-emerald-500/40 flex items-center justify-center active:scale-95 transition-all border-4 border-[#0B0F17] cursor-pointer"
            title="Log New Sale"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </button>
        </div>

        {/* Tab 3: Products */}
        <Link
          href="/products"
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            pathname === '/products' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Package className="w-5 h-5" />
          <span className="text-[10px]">Products</span>
        </Link>

        {/* Tab 4: Settings */}
        <Link
          href="/settings"
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            pathname === '/settings' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px]">Settings</span>
        </Link>
      </div>
    </div>
  );
}
