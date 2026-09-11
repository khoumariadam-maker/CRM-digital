'use client';

import React, { useState, useMemo } from 'react';
import { Sale, DailyAdSpend, Expense } from '@/types/crm';
import { TrendingUp, BarChart3, Calendar, Sparkles } from 'lucide-react';

interface GrowthChartProps {
  sales: Sale[];
  dailyAdSpends: DailyAdSpend[];
  expenses: Expense[];
  exchangeRate: number;
}

type MetricMode = 'profit' | 'revenue' | 'orders';

export default function GrowthChart({
  sales,
  dailyAdSpends,
  expenses,
  exchangeRate,
}: GrowthChartProps) {
  const [metric, setMetric] = useState<MetricMode>('profit');
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  // Group data by date (YYYY-MM-DD)
  const chartData = useMemo(() => {
    const datesMap: {
      [date: string]: {
        revenueDzd: number;
        costDzd: number;
        adSpendDzd: number;
        expensesDzd: number;
        profitDzd: number;
        ordersCount: number;
      };
    } = {};

    // 1. Process sales
    for (const s of sales) {
      const date = s.createdAt.split('T')[0];
      if (!datesMap[date]) {
        datesMap[date] = {
          revenueDzd: 0,
          costDzd: 0,
          adSpendDzd: 0,
          expensesDzd: 0,
          profitDzd: 0,
          ordersCount: 0,
        };
      }
      datesMap[date].revenueDzd += s.sellingPriceDzd || 0;
      datesMap[date].costDzd += Math.round((s.productCostUsd || 0) * (s.exchangeRateUsed || exchangeRate));
      datesMap[date].ordersCount += 1;
    }

    // 2. Process daily ad spends
    for (const a of dailyAdSpends) {
      if (!datesMap[a.date]) {
        datesMap[a.date] = {
          revenueDzd: 0,
          costDzd: 0,
          adSpendDzd: 0,
          expensesDzd: 0,
          profitDzd: 0,
          ordersCount: 0,
        };
      }
      datesMap[a.date].adSpendDzd += a.spendDzd || 0;
    }

    // 3. Process expenses
    for (const e of expenses) {
      const date = e.date || e.createdAt.split('T')[0];
      if (!datesMap[date]) {
        datesMap[date] = {
          revenueDzd: 0,
          costDzd: 0,
          adSpendDzd: 0,
          expensesDzd: 0,
          profitDzd: 0,
          ordersCount: 0,
        };
      }
      const expDzd = e.currency === 'USD' ? Math.round((e.amountUsd || 0) * exchangeRate) : e.amountDzd;
      datesMap[date].expensesDzd += expDzd;
    }

    // 4. Calculate Net Profit per date
    for (const date of Object.keys(datesMap)) {
      const d = datesMap[date];
      d.profitDzd = d.revenueDzd - d.costDzd - d.adSpendDzd - d.expensesDzd;
    }

    // Sort chronologically
    const sortedDates = Object.keys(datesMap).sort();
    
    // Take up to last 7 days or pad if less
    return sortedDates.map((date) => ({
      date,
      displayDate: new Date(date).toLocaleDateString('fr-DZ', { month: 'short', day: 'numeric' }),
      ...datesMap[date],
    }));
  }, [sales, dailyAdSpends, expenses, exchangeRate]);

  if (chartData.length === 0) {
    return (
      <div className="p-5 rounded-2xl glass-panel border border-white/10 text-center space-y-2">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mx-auto flex items-center justify-center">
          <TrendingUp className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-bold text-white">Daily Growth & Performance Graph</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Start recording sales, daily ad spend, or expenses to visualize your live daily profit curve.
        </p>
      </div>
    );
  }

  // Calculate max value for chart scale
  const maxVal = Math.max(
    ...chartData.map((d) => {
      if (metric === 'profit') return Math.max(0, d.profitDzd);
      if (metric === 'revenue') return d.revenueDzd;
      return d.ordersCount;
    }),
    1
  );

  const totalSelectedMetric = chartData.reduce((sum, d) => {
    if (metric === 'profit') return sum + d.profitDzd;
    if (metric === 'revenue') return sum + d.revenueDzd;
    return sum + d.ordersCount;
  }, 0);

  return (
    <div className="p-4 sm:p-5 rounded-2xl glass-panel border border-white/10 space-y-4">
      {/* Chart Header & Metric Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
              <span>Daily Growth</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                Live
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Total period:{' '}
              <span className="font-bold text-white">
                {metric === 'orders'
                  ? `${totalSelectedMetric} orders`
                  : `${totalSelectedMetric.toLocaleString()} DA`}
              </span>
            </p>
          </div>
        </div>

        {/* Metric Toggles */}
        <div className="flex rounded-xl bg-slate-950 p-1 border border-white/10 text-[11px] font-bold self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setMetric('profit')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              metric === 'profit' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Net Profit
          </button>
          <button
            type="button"
            onClick={() => setMetric('revenue')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              metric === 'revenue' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Revenue
          </button>
          <button
            type="button"
            onClick={() => setMetric('orders')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              metric === 'orders' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Orders
          </button>
        </div>
      </div>

      {/* SVG / Bar Representation */}
      <div className="pt-2">
        <div className="h-44 flex items-end justify-between gap-2 sm:gap-3 px-1">
          {chartData.map((item) => {
            const rawVal =
              metric === 'profit'
                ? item.profitDzd
                : metric === 'revenue'
                ? item.revenueDzd
                : item.ordersCount;

            const heightPercent = Math.max(Math.round((Math.max(0, rawVal) / maxVal) * 100), 8);
            const isHovered = hoveredDay === item.date;

            return (
              <div
                key={item.date}
                className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                onMouseEnter={() => setHoveredDay(item.date)}
                onMouseLeave={() => setHoveredDay(null)}
                onClick={() => setHoveredDay(hoveredDay === item.date ? null : item.date)}
              >
                {/* Tooltip on hover */}
                {isHovered && (
                  <div className="mb-2 px-2 py-1 rounded-lg bg-slate-800 border border-white/20 text-[10px] text-white whitespace-nowrap shadow-xl animate-fade-in text-center z-10 pointer-events-none">
                    <span className="text-slate-400 block">{item.date}</span>
                    <span className="font-bold text-emerald-300">
                      {metric === 'orders' ? `${rawVal} orders` : `${rawVal.toLocaleString()} DA`}
                    </span>
                  </div>
                )}

                {/* Bar */}
                <div
                  style={{ height: `${heightPercent}%` }}
                  className={`w-full max-w-[42px] rounded-t-xl transition-all duration-300 relative ${
                    metric === 'profit'
                      ? isHovered
                        ? 'bg-emerald-400 shadow-lg shadow-emerald-500/40'
                        : 'bg-gradient-to-t from-emerald-700 to-emerald-500'
                      : metric === 'revenue'
                      ? isHovered
                        ? 'bg-blue-400 shadow-lg shadow-blue-500/40'
                        : 'bg-gradient-to-t from-blue-700 to-blue-500'
                      : isHovered
                      ? 'bg-indigo-400 shadow-lg shadow-indigo-500/40'
                      : 'bg-gradient-to-t from-indigo-700 to-indigo-500'
                  }`}
                />

                {/* Day label */}
                <span className="text-[10px] text-slate-400 font-bold mt-2 truncate w-full text-center">
                  {item.displayDate}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
