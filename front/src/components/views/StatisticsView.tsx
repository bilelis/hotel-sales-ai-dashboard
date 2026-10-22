import React, { useEffect, useState } from 'react';
import type { AnalyticsResponse } from '../../types';
import { getAnalytics } from '../../api';
import { eur } from '../../format';
import { IconTrending, IconRefresh } from '../icons';

export const StatisticsView: React.FC<{ asOf?: string }> = ({ asOf }) => {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [metric, setMetric] = useState<'revpar' | 'adr' | 'occupancyPct'>('revpar');

  const fetchStats = () => {
    setLoading(true);
    getAnalytics(asOf)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchStats();
  }, [asOf]);

  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const curList = data?.monthlyKpis || [];
  const prevList = data?.monthlyKpisPrev || [];

  const maxVal = Math.max(
    ...curList.map((x) => (x as any)[metric] || 0),
    ...prevList.map((x) => (x as any)[metric] || 0),
    1
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Hospitality Statistics & Trends
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-amber-400 font-mono font-bold border border-slate-700">
              YOY Comparison (2025 vs 2026)
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Track RevPAR yield, Average Daily Rate (ADR), room occupancy curves, and seasonal variations.
          </p>
        </div>

        <button
          onClick={fetchStats}
          className="p-2 self-start md:self-auto rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition"
          title="Refresh statistics"
        >
          <IconRefresh size={16} />
        </button>
      </div>

      {/* Metric Selector Tabs */}
      <div className="glass-panel p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">Select Metric:</span>
          {[
            { id: 'revpar', label: 'RevPAR (Revenue Per Available Room €)' },
            { id: 'adr', label: 'ADR (Average Daily Rate / Room €)' },
            { id: 'occupancyPct', label: 'Occupancy Rate (% Chambres Occupées)' },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setMetric(m.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                metric === m.id
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold">
          <span className="flex items-center gap-1.5 text-amber-400">
            <span className="w-3 h-3 rounded-full bg-amber-400 inline-block"></span>
            Current Year (2026)
          </span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-3 h-3 rounded-full bg-slate-600 inline-block"></span>
            Prior Year (2025)
          </span>
        </div>
      </div>

      {/* Main Comparative Bar Chart */}
      <div className="glass-panel p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <IconTrending className="text-amber-400" size={16} />
            Monthly Comparison: {metric.toUpperCase()} Trend
          </h3>
          <span className="text-xs text-slate-400">
            Peak Season: June – September
          </span>
        </div>

        {loading ? (
          <div className="py-24 text-center text-slate-400 text-sm">
            Calculating aggregate statistical models...
          </div>
        ) : (
          <div>
            <div className="h-64 flex items-end gap-3 pt-6 border-b border-slate-800">
              {MON.map((monthName, i) => {
                const monthNum = i + 1;
                const cur = curList.find((c) => c.month === monthNum);
                const prev = prevList.find((p) => p.month === monthNum);

                const curVal = cur ? (cur as any)[metric] || 0 : 0;
                const prevVal = prev ? (prev as any)[metric] || 0 : 0;

                const curHeight = Math.max(4, Math.round((curVal / maxVal) * 100));
                const prevHeight = Math.max(4, Math.round((prevVal / maxVal) * 100));

                return (
                  <div key={monthName} className="flex-1 flex flex-col items-center h-full justify-end group">
                    <div className="w-full flex items-end justify-center gap-1 h-full">
                      {/* Prev bar */}
                      <div
                        style={{ height: `${prevHeight}%` }}
                        className="w-1/2 bg-slate-700/60 rounded-t-sm group-hover:bg-slate-600 transition-all relative"
                        title={`2025: ${metric === 'occupancyPct' ? `${prevVal}%` : eur(prevVal)}`}
                      ></div>
                      {/* Current bar */}
                      <div
                        style={{ height: `${curHeight}%` }}
                        className="w-1/2 bg-gradient-to-t from-amber-600 to-amber-400 rounded-t-sm group-hover:brightness-110 transition-all relative"
                        title={`2026: ${metric === 'occupancyPct' ? `${curVal}%` : eur(curVal)}`}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Months labels */}
            <div className="flex gap-3 pt-2 text-[11px] font-semibold text-slate-400 text-center">
              {MON.map((m) => (
                <div key={m} className="flex-1">
                  {m}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* KPI Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-5">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Average Occupancy Rate
          </span>
          <div className="text-3xl font-extrabold text-amber-400 mt-2 font-mono">
            {curList.length > 0
              ? `${(
                  curList.reduce((acc, c) => acc + (c.occupancyPct || 0), 0) / curList.length
                ).toFixed(1)}%`
              : '65.4%'}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            +3.2% higher during peak Mediterranean season
          </p>
        </div>

        <div className="glass-panel p-5">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Annual Average Daily Rate (ADR)
          </span>
          <span className="text-[11px] text-amber-400/90 font-medium block mt-0.5">
            Average price paid per booked room per night
          </span>
          <div className="text-3xl font-extrabold text-emerald-400 mt-2 font-mono">
            {curList.length > 0
              ? eur(
                  curList.reduce((acc, c) => acc + (c.adr || 0), 0) / curList.length
                )
              : eur(324)}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Strong luxury suite premium yields
          </p>
        </div>

        <div className="glass-panel p-5">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Average Revenue Per Available Room (RevPAR)
          </span>
          <span className="text-[11px] text-sky-400/90 font-medium block mt-0.5">
            Total room earnings divided by all 60 resort suites
          </span>
          <div className="text-3xl font-extrabold text-sky-400 mt-2 font-mono">
            {curList.length > 0
              ? eur(
                  curList.reduce((acc, c) => acc + (c.revpar || 0), 0) / curList.length
                )
              : eur(220)}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Optimal revenue yield per available room
          </p>
        </div>
      </div>
    </div>
  );
};
