'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCRMData } from '@/context/CRMDataContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Settings,
  Flame,
  Users,
  Lock,
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { sales, products, isFirebaseConnected, financials } = useCRMData();
  const { format } = useCurrency();
  const { partner, logout } = useAuth();

  const navItems = [
    {
      label: 'Overview',
      href: '/',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      label: 'Sales Tracker',
      href: '/orders',
      icon: ShoppingBag,
      badge: sales.length,
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
    {
      label: 'Digital Products',
      href: '/products',
      icon: Package,
      badge: products.length,
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    },
    {
      label: 'Settings & Cloud',
      href: '/settings',
      icon: Settings,
      badge: isFirebaseConnected ? 'Cloud Active' : 'Offline',
      badgeColor: isFirebaseConnected
        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
        : 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-white/10 glass-panel shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="p-5 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center font-black text-white text-sm shadow-md shadow-emerald-500/30 tracking-wider">
            DZ
          </div>
          <div>
            <h1 className="font-black text-white text-base tracking-tight leading-none">
              Digital CRM
            </h1>
            <span className="text-[11px] text-emerald-400 font-medium">Business Pro</span>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 p-3 space-y-1.5">
        <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Menu Principal
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all group ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-400'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge !== null && (
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                    isActive ? 'bg-white/20 text-white border-white/20' : item.badgeColor
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        {/* Global Financial Status */}
        <div className="pt-5 px-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
            <span>Solde & Bénéfices</span>
          </div>
          <div className="space-y-2">
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-emerald-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-bold text-white">BaridiMob</span>
              </div>
              <span className="text-xs font-mono font-black text-emerald-300">
                {format(financials.baridiMobCurrentBalanceDzd || 0)}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-xs font-bold text-white">Bénéfice Net</span>
              </div>
              <span className="text-xs font-mono font-extrabold text-white">
                {format(financials.netProfitDzd)}
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Authenticated User & Lock */}
      <div className="p-4 border-t border-white/10 m-3 rounded-2xl bg-slate-900/80 border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg font-black text-xs text-white bg-emerald-600 flex items-center justify-center">
            DZ
          </div>
          <div>
            <span className="text-xs font-bold text-white block">Session Business</span>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              PIN 1234
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={logout}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
          title="Verrouiller la caisse"
        >
          <Lock className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
}
