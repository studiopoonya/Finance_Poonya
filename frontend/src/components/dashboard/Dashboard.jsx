import React from 'react';
import { DollarSign, TrendingDown, Wallet, Percent, RefreshCw, AlertCircle, Camera } from 'lucide-react';
import clsx from 'clsx';
import { useDashboard } from '../../hooks/useDashboard';
import KpiCard            from './KpiCard';
import RevenueChart       from './RevenueChart';
import ExpenseDonut       from './ExpenseDonut';
import RecentTransactions from './RecentTransactions';

function Skeleton({ className }) {
  return <div className={clsx('rounded-2xl bg-slate-200 dark:bg-slate-800/60 animate-pulse', className)} />;
}

function InvestorRoiCard({ kpis }) {
  const { roi, total_invested, net_profit } = kpis;
  return (
    <div className="glass rounded-2xl border border-black/8 dark:border-white/5 p-6 shadow-glass-light dark:shadow-glass flex flex-col justify-between h-full">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Investor ROI</p>
          <p className="text-3xl font-bold gradient-text mt-1">{roi}%</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-violet-100 dark:bg-violet-900/40 border border-violet-200 dark:border-violet-500/20 flex items-center justify-center">
          <Percent size={20} className="text-violet-600 dark:text-violet-400" />
        </div>
      </div>

      <div className="h-px bg-black/6 dark:bg-white/5 my-4" />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-[11px] text-slate-500 uppercase tracking-wide">Total Invested</p>
          <p className="text-slate-900 dark:text-white font-semibold text-base mt-0.5">
            ${Number(total_invested).toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-slate-500 uppercase tracking-wide">Net Return</p>
          <p className={clsx('font-semibold text-base mt-0.5', net_profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
            {net_profit >= 0 ? '+' : ''}${Number(net_profit).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-[11px] text-slate-500 mb-1.5">
          <span>Return progress</span>
          <span>{Math.min(roi, 100).toFixed(1)}%</span>
        </div>
        <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-700"
            style={{ width: `${Math.min(Math.abs(roi), 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data, loading, isMock, reload } = useDashboard();

  return (
    <div className="p-6 lg:p-8 min-h-screen">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Investor Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isMock && (
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg px-3 py-1.5">
              <AlertCircle size={13} />
              <span className="text-xs font-medium">Demo data — backend offline</span>
            </div>
          )}
          <button
            onClick={reload}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-700 dark:hover:text-white bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-medium transition-all"
          >
            <RefreshCw size={13} />
            Refresh
          </button>
          <a
            href="/scanner"
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-4 py-2 text-xs font-semibold transition-colors shadow-lg shadow-indigo-500/20"
          >
            <Camera size={13} />
            Scan Receipt
          </a>
        </div>
      </div>

      {loading ? (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <Skeleton className="h-72 lg:col-span-2" />
            <Skeleton className="h-72" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <Skeleton className="h-80 lg:col-span-2" />
            <Skeleton className="h-80" />
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Row 1: KPI Cards */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <KpiCard title="Total Revenue"  value={data.kpis.total_revenue}  change={data.kpis.revenue_change}  icon={DollarSign}  accent="emerald" />
            <KpiCard title="Burn Rate"      value={data.kpis.burn_rate}      change={data.kpis.expenses_change} icon={TrendingDown} accent="rose"    />
            <KpiCard title="Net Profit"     value={data.kpis.net_profit}                                        icon={Wallet}       accent="indigo"  />
            <KpiCard title="Investor ROI"   value={data.kpis.roi}            suffix="%"                         icon={Percent}      accent="violet"  />
          </div>

          {/* Row 2: Chart + ROI detail */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5" style={{ minHeight: '280px' }}>
            <div className="xl:col-span-2"><RevenueChart data={data.trend} /></div>
            <InvestorRoiCard kpis={data.kpis} />
          </div>

          {/* Row 3: Transactions + Donut */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5" style={{ minHeight: '320px' }}>
            <div className="xl:col-span-2"><RecentTransactions transactions={data.recent} /></div>
            <ExpenseDonut data={data.expense_breakdown} />
          </div>
        </div>
      )}
    </div>
  );
}
