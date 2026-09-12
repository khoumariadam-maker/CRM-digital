'use client';

import React, { useState, useMemo, useRef } from 'react';
import { Sale, DailyAdSpend, Expense } from '@/types/crm';
import { TrendingUp, Calendar, Zap, DollarSign, PackageCheck } from 'lucide-react';

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
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

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
        pendingOrdersCount: number;
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
          pendingOrdersCount: 0,
        };
      }
      if (s.paymentStatus === 'pending') {
        datesMap[date].pendingOrdersCount += 1;
      } else {
        datesMap[date].revenueDzd += s.sellingPriceDzd || 0;
        datesMap[date].costDzd += Math.round((s.productCostUsd || 0) * (s.exchangeRateUsed || exchangeRate));
        datesMap[date].ordersCount += 1;
      }
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
          pendingOrdersCount: 0,
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
          pendingOrdersCount: 0,
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

    // Ensure we have a continuous timeline over at least recent 5 days
    const now = new Date();
    const padDates: string[] = [];
    for (let i = 4; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 3600 * 1000);
      padDates.push(d.toISOString().split('T')[0]);
    }

    // Combine any recorded dates with padDates
    const allUniqueDates = Array.from(new Set([...padDates, ...Object.keys(datesMap)])).sort();

    return allUniqueDates.map((date) => {
      const existing = datesMap[date] || {
        revenueDzd: 0,
        costDzd: 0,
        adSpendDzd: 0,
        expensesDzd: 0,
        profitDzd: 0,
        ordersCount: 0,
        pendingOrdersCount: 0,
      };

      const dateObj = new Date(date);
      const isToday = date === now.toISOString().split('T')[0];

      return {
        date,
        displayDate: isToday
          ? "Aujourd'hui"
          : dateObj.toLocaleDateString('fr-DZ', { weekday: 'short', day: 'numeric', month: 'short' }),
        shortDate: dateObj.toLocaleDateString('fr-DZ', { day: 'numeric', month: 'short' }),
        ...existing,
      };
    });
  }, [sales, dailyAdSpends, expenses, exchangeRate]);

  // Aggregate metrics
  const totalProfit = useMemo(() => chartData.reduce((sum, d) => sum + d.profitDzd, 0), [chartData]);
  const totalRevenue = useMemo(() => chartData.reduce((sum, d) => sum + d.revenueDzd, 0), [chartData]);
  const totalOrders = useMemo(() => chartData.reduce((sum, d) => sum + d.ordersCount, 0), [chartData]);

  // Determine peak day for active metric
  const peakDay = useMemo(() => {
    let max = -Infinity;
    let target = chartData[0];
    for (const d of chartData) {
      const val = metric === 'profit' ? d.profitDzd : metric === 'revenue' ? d.revenueDzd : d.ordersCount;
      if (val > max) {
        max = val;
        target = d;
      }
    }
    return { item: target, value: max };
  }, [chartData, metric]);

  // SVG Dimensions & Margins
  const SVG_WIDTH = 740;
  const SVG_HEIGHT = 200;
  const PADDING_TOP = 20;
  const PADDING_BOTTOM = 30;
  const PADDING_LEFT = 55;
  const PADDING_RIGHT = 25;

  const chartWidth = SVG_WIDTH - PADDING_LEFT - PADDING_RIGHT;
  const chartHeight = SVG_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

  // Max value with 15% headroom for graceful peak rendering
  const maxRawVal = Math.max(
    ...chartData.map((d) => {
      if (metric === 'profit') return Math.max(0, d.profitDzd);
      if (metric === 'revenue') return d.revenueDzd;
      return d.ordersCount;
    }),
    10
  );
  const maxVal = Math.ceil(maxRawVal * 1.15);

  // Compute (x, y) coordinates for each data point
  const points = useMemo(() => {
    if (chartData.length === 0) return [];
    const step = chartWidth / (chartData.length - 1);
    return chartData.map((d, i) => {
      const val = metric === 'profit' ? Math.max(0, d.profitDzd) : metric === 'revenue' ? d.revenueDzd : d.ordersCount;
      const x = PADDING_LEFT + i * step;
      const y = PADDING_TOP + chartHeight - (val / maxVal) * chartHeight;
      return { x, y, val, data: d };
    });
  }, [chartData, metric, maxVal, chartWidth, chartHeight]);

  // Generate Smooth Cubic Bezier Spline Path
  const linePath = useMemo(() => {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
    if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;

    let path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return path;
  }, [points]);

  // Area under curve path
  const areaPath = useMemo(() => {
    if (points.length < 2 || !linePath) return '';
    const bottomY = PADDING_TOP + chartHeight;
    const firstX = points[0].x;
    const lastX = points[points.length - 1].x;
    return `${linePath} L ${lastX.toFixed(1)} ${bottomY} L ${firstX.toFixed(1)} ${bottomY} Z`;
  }, [linePath, points, chartHeight]);

  // Selected item for Tooltip / HUD (defaults to hovered, or latest day)
  const activePoint = hoveredIdx !== null && points[hoveredIdx] ? points[hoveredIdx] : points[points.length - 1];

  // Colors based on metric
  const themeColors = {
    profit: {
      stroke: '#10b981',
      gradientStart: '#10b981',
      glow: 'rgba(16, 185, 129, 0.4)',
      badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      activeText: 'text-emerald-400',
    },
    revenue: {
      stroke: '#06b6d4',
      gradientStart: '#06b6d4',
      glow: 'rgba(6, 182, 212, 0.4)',
      badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      activeText: 'text-cyan-400',
    },
    orders: {
      stroke: '#8b5cf6',
      gradientStart: '#8b5cf6',
      glow: 'rgba(139, 92, 246, 0.4)',
      badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      activeText: 'text-purple-400',
    },
  }[metric];

  // Mouse / Touch scrubber handler
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || points.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * SVG_WIDTH;

    // Find closest point by x coordinate
    let closestIdx = 0;
    let minDist = Infinity;
    points.forEach((p, idx) => {
      const dist = Math.abs(p.x - mouseX);
      if (dist < minDist) {
        minDist = dist;
        closestIdx = idx;
      }
    });
    setHoveredIdx(closestIdx);
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl glass-panel border border-white/10 space-y-4 animate-fade-in">
      {/* Top Header & Metric Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-black text-white leading-tight">
                Graphique de Croissance Live
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse">
                Temps Réel
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Progression financière continue & volume de ventes sur les derniers jours
            </p>
          </div>
        </div>

        {/* Metric Switcher */}
        <div className="flex rounded-xl bg-slate-950 p-1 border border-white/10 text-[11px] font-bold self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setMetric('profit')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              metric === 'profit'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-3 h-3" />
            <span>Net Profit</span>
          </button>
          <button
            type="button"
            onClick={() => setMetric('revenue')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              metric === 'revenue'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <DollarSign className="w-3 h-3" />
            <span>Revenue</span>
          </button>
          <button
            type="button"
            onClick={() => setMetric('orders')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              metric === 'orders'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <PackageCheck className="w-3 h-3" />
            <span>Commandes</span>
          </button>
        </div>
      </div>

      {/* Financial Metric KPI Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
        <div className="p-2.5 rounded-xl bg-slate-950/70 border border-white/5">
          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">
            Total Période
          </span>
          <span className={`text-sm sm:text-base font-black ${themeColors.activeText}`}>
            {metric === 'orders'
              ? `${totalOrders} commandes`
              : metric === 'revenue'
              ? `${totalRevenue.toLocaleString()} DA`
              : `+${totalProfit.toLocaleString()} DA`}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-950/70 border border-white/5">
          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">
            Pic Journalier (Max)
          </span>
          <span className="text-sm sm:text-base font-black text-white">
            {metric === 'orders'
              ? `${peakDay.value} orders`
              : `${peakDay.value.toLocaleString()} DA`}
          </span>
          <span className="text-[9px] text-slate-400 block truncate">
            {peakDay.item?.displayDate}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-950/70 border border-white/5">
          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">
            Moyenne / Jour
          </span>
          <span className="text-sm sm:text-base font-black text-white">
            {metric === 'orders'
              ? `${(totalOrders / Math.max(chartData.length, 1)).toFixed(1)} / j`
              : `${Math.round(
                  (metric === 'profit' ? totalProfit : totalRevenue) / Math.max(chartData.length, 1)
                ).toLocaleString()} DA`}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-950/70 border border-white/5">
          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">
            Point Inspecté
          </span>
          <span className="text-xs sm:text-sm font-bold text-slate-200 truncate block">
            {activePoint?.data.displayDate}
          </span>
          <span className={`text-[11px] font-extrabold ${themeColors.activeText}`}>
            {metric === 'orders'
              ? `${activePoint?.val} commandes`
              : `${activePoint?.val.toLocaleString()} DA`}
          </span>
        </div>
      </div>

      {/* Continuous SVG Line & Area Graph */}
      <div className="relative pt-2">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="w-full h-48 sm:h-60 overflow-visible cursor-crosshair select-none"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredIdx(null)}
        >
          <defs>
            {/* Area Gradient */}
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={themeColors.gradientStart} stopOpacity="0.35" />
              <stop offset="60%" stopColor={themeColors.gradientStart} stopOpacity="0.10" />
              <stop offset="100%" stopColor={themeColors.gradientStart} stopOpacity="0.0" />
            </linearGradient>

            {/* Glowing Filter */}
            <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Horizontal Grid lines & Y-Axis Labels */}
          {[1, 0.66, 0.33, 0].map((ratio) => {
            const y = PADDING_TOP + chartHeight * (1 - ratio);
            const labelVal = Math.round(maxVal * ratio);
            return (
              <g key={ratio}>
                <line
                  x1={PADDING_LEFT}
                  y1={y}
                  x2={SVG_WIDTH - PADDING_RIGHT}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.07)"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={PADDING_LEFT - 10}
                  y={y + 3}
                  fill="rgba(148, 163, 184, 0.6)"
                  fontSize="9"
                  fontFamily="monospace"
                  textAnchor="end"
                >
                  {metric === 'orders'
                    ? `${labelVal}`
                    : labelVal >= 1000
                    ? `${(labelVal / 1000).toFixed(0)}k`
                    : `${labelVal}`}
                </text>
              </g>
            );
          })}

          {/* 1. Filled Area beneath curve */}
          {areaPath && <path d={areaPath} fill="url(#areaGrad)" />}

          {/* 2. Glowing Smooth Curve Line */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke={themeColors.stroke}
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glowFilter)"
            />
          )}

          {/* 3. Vertical Crosshair Scrubber on Hover */}
          {activePoint && (
            <g className="transition-all duration-150">
              <line
                x1={activePoint.x}
                y1={PADDING_TOP}
                x2={activePoint.x}
                y2={PADDING_TOP + chartHeight}
                stroke="rgba(255, 255, 255, 0.3)"
                strokeDasharray="3 3"
                strokeWidth="1.5"
              />
            </g>
          )}

          {/* 4. Interactive Data Points */}
          {points.map((p, idx) => {
            const isTarget = activePoint && activePoint.x === p.x;
            return (
              <g key={idx} className="cursor-pointer">
                {/* Active Outer Pulsing Ring */}
                {isTarget && (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="8"
                    fill="none"
                    stroke={themeColors.stroke}
                    strokeWidth="2"
                    opacity="0.7"
                    className="animate-ping"
                  />
                )}
                {/* Point Base Dot */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isTarget ? 5.5 : 4}
                  fill="#09090b"
                  stroke={themeColors.stroke}
                  strokeWidth={isTarget ? 3 : 2}
                  className="transition-all duration-200 hover:scale-125"
                />
              </g>
            );
          })}

          {/* 5. X-Axis Dates */}
          {points.map((p, idx) => {
            const isTarget = activePoint && activePoint.x === p.x;
            return (
              <text
                key={idx}
                x={p.x}
                y={SVG_HEIGHT - 8}
                fill={isTarget ? '#ffffff' : 'rgba(148, 163, 184, 0.7)'}
                fontSize="10"
                fontWeight={isTarget ? 'bold' : 'normal'}
                textAnchor="middle"
                className="transition-colors"
              >
                {p.data.shortDate}
              </text>
            );
          })}
        </svg>

        {/* Hover / Active HUD Tooltip Bar */}
        {activePoint && (
          <div className="mt-2 p-2.5 rounded-xl bg-slate-950/90 border border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs backdrop-blur-md animate-fade-in">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-bold text-white">{activePoint.data.displayDate}</span>
              <span className="text-slate-500">•</span>
              <span className={`font-black ${themeColors.activeText}`}>
                {metric === 'orders'
                  ? `${activePoint.val} commandes`
                  : `${activePoint.val.toLocaleString()} DA ${
                      metric === 'profit' ? 'Profit' : 'Chiffre d’Affaires'
                    }`}
              </span>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span>
                Revenu:{' '}
                <strong className="text-slate-200">
                  {activePoint.data.revenueDzd.toLocaleString()} DA
                </strong>
              </span>
              <span>
                Coût Sourcing:{' '}
                <strong className="text-slate-300">
                  {activePoint.data.costDzd.toLocaleString()} DA
                </strong>
              </span>
              <span>
                Commandes Payées:{' '}
                <strong className="text-emerald-400">{activePoint.data.ordersCount}</strong>
              </span>
              {activePoint.data.pendingOrdersCount > 0 && (
                <span className="text-amber-400 font-bold">
                  {activePoint.data.pendingOrdersCount} à crédit
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
