'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string;
  secondaryValue?: string;
  subtitle?: string;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  badgeText?: string;
  badgeColor?: string;
  highlight?: boolean;
}

export default function KPICard({
  title,
  value,
  secondaryValue,
  subtitle,
  icon: Icon,
  iconColor,
  iconBg,
  badgeText,
  badgeColor = 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  highlight = false,
}: KPICardProps) {
  return (
    <div
      className={`relative p-5 rounded-2xl border transition-all ${
        highlight
          ? 'bg-gradient-to-b from-emerald-950/40 to-slate-900 border-emerald-500/30 glow-emerald'
          : 'glass-card'
      }`}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
          {title}
        </span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-2xl font-black tracking-tight text-white">{value}</div>
        {secondaryValue && (
          <div className="text-xs font-medium text-slate-400">{secondaryValue}</div>
        )}
      </div>

      {(subtitle || badgeText) && (
        <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-white/5 text-xs">
          {subtitle && <span className="text-slate-400 text-[11px]">{subtitle}</span>}
          {badgeText && (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeColor}`}
            >
              {badgeText}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
