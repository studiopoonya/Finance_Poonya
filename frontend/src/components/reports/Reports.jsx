import { useState, useEffect, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp, TrendingDown, DollarSign, BarChart2,
  FileText, Activity, Download, RefreshCw,
} from 'lucide-react';
import clsx from 'clsx';
import { getProfitLoss, getBalanceSheet, getCashFlow, getUnitEconomics } from '../../lib/api';

const TABS = [
  { key: 'pl',      label: 'Laba Rugi',     icon: TrendingUp },
  { key: 'bs',      label: 'Neraca',         icon: BarChart2 },
  { key: 'cf',      label: 'Arus Kas',       icon: Activity },
  { key: 'ue',      label: 'Unit Ekonomi',   icon: DollarSign },
];

const MONTHS = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const COLORS  = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

const fmt = (n, short = false) => {
  if (n === null || n === undefined) return '-';
  const abs = Math.abs(n);
  if (short && abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}jt`;
  if (short && abs >= 1_000)     return `${(n / 1_000).toFixed(0)}rb`;
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
};

const pct = (n) => (n !== null && n !== undefined ? `${n > 0 ? '+' : ''}${n}%` : '-');

function KpiCard({ label, value, sub, positive, icon: Icon, color = 'violet' }) {
  const colorMap = {
    violet: 'bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400',
    cyan:   'bg-cyan-100   dark:bg-cyan-900/40   text-cyan-600   dark:text-cyan-400',
    green:  'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400',
    red:    'bg-red-100    dark:bg-red-900/40    text-red-600    dark:text-red-400',
    amber:  'bg-amber-100  dark:bg-amber-900/40  text-amber-600  dark:text-amber-400',
  };
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
          {sub && (
            <p className={clsx('mt-1 text-xs font-medium', positive === true ? 'text-emerald-600' : positive === false ? 'text-red-500' : 'text-slate-500 dark:text-slate-400')}>
              {sub}
            </p>
          )}
        </div>
        <div className={clsx('p-3 rounded-xl', colorMap[color] || colorMap.violet)}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

// ── P&L Tab ──────────────────────────────────────────────────────────────────
function PLTab({ year, month }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const MOCK = {
    total_revenue: 85000000, total_expense: 52000000, net_profit: 33000000, margin_pct: 38.8,
    revenue_items: [{ category: 'Wedding Photography', total: 50000000 }, { category: 'Corporate Event', total: 35000000 }],
    expense_items: [{ category: 'Equipment', total: 15000000 }, { category: 'Staff', total: 20000000 }, { category: 'Marketing', total: 8000000 }, { category: 'Operasional', total: 9000000 }],
    monthly_trend: { 1: { revenue: 7000000, expense: 4500000 }, 2: { revenue: 6500000, expense: 4000000 }, 3: { revenue: 8000000, expense: 4800000 }, 4: { revenue: 7200000, expense: 4300000 }, 5: { revenue: 9000000, expense: 5500000 } },
  };

  useEffect(() => {
    setLoading(true);
    getProfitLoss({ year, month })
      .then(setData)
      .catch(() => setData(MOCK))
      .finally(() => setLoading(false));
  }, [year, month]);

  const d = data || {};
  const trend = Object.entries(d.monthly_trend || {}).map(([m, v]) => ({
    name: MONTHS[parseInt(m)], revenue: v.revenue, expense: v.expense, profit: v.revenue - v.expense,
  }));

  if (loading) return <div className="h-64 flex items-center justify-center text-slate-400">Memuat...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Pendapatan" value={fmt(d.total_revenue, true)} color="green" icon={TrendingUp} />
        <KpiCard label="Total Pengeluaran" value={fmt(d.total_expense, true)} color="red" icon={TrendingDown} />
        <KpiCard label="Laba Bersih" value={fmt(d.net_profit, true)} color="violet" icon={DollarSign} positive={d.net_profit >= 0} />
        <KpiCard label="Margin" value={pct(d.margin_pct)} color="cyan" icon={Activity} positive={d.margin_pct >= 0} sub="Net profit margin" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend chart */}
        <div className="glass rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">Tren Bulanan {year}</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="exp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={v => fmt(v, true)} tick={{ fontSize: 10 }} />
              <Tooltip formatter={v => fmt(v)} />
              <Legend />
              <Area type="monotone" dataKey="revenue" name="Pendapatan" stroke="#8b5cf6" fill="url(#rev)" strokeWidth={2} />
              <Area type="monotone" dataKey="expense" name="Pengeluaran" stroke="#ef4444" fill="url(#exp)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Breakdown tables */}
        <div className="space-y-4">
          <div className="glass rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-3">Rincian Pendapatan</h3>
            <table className="w-full text-sm">
              <tbody>
                {(d.revenue_items || []).map(r => (
                  <tr key={r.category} className="border-b border-slate-100 dark:border-slate-700/50 last:border-0">
                    <td className="py-1.5 text-slate-600 dark:text-slate-300">{r.category}</td>
                    <td className="py-1.5 text-right font-medium text-slate-800 dark:text-white">{fmt(r.total)}</td>
                    <td className="py-1.5 text-right text-slate-400 text-xs w-12">
                      {d.total_revenue > 0 ? `${Math.round(r.total / d.total_revenue * 100)}%` : ''}
                    </td>
                  </tr>
                ))}
                <tr className="font-bold">
                  <td className="pt-2 text-emerald-700 dark:text-emerald-400">Total</td>
                  <td className="pt-2 text-right text-emerald-700 dark:text-emerald-400">{fmt(d.total_revenue)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="glass rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-3">Rincian Pengeluaran</h3>
            <table className="w-full text-sm">
              <tbody>
                {(d.expense_items || []).map(r => (
                  <tr key={r.category} className="border-b border-slate-100 dark:border-slate-700/50 last:border-0">
                    <td className="py-1.5 text-slate-600 dark:text-slate-300">{r.category}</td>
                    <td className="py-1.5 text-right font-medium text-slate-800 dark:text-white">{fmt(r.total)}</td>
                    <td className="py-1.5 text-right text-slate-400 text-xs w-12">
                      {d.total_expense > 0 ? `${Math.round(r.total / d.total_expense * 100)}%` : ''}
                    </td>
                  </tr>
                ))}
                <tr className="font-bold">
                  <td className="pt-2 text-red-600 dark:text-red-400">Total</td>
                  <td className="pt-2 text-right text-red-600 dark:text-red-400">{fmt(d.total_expense)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Balance Sheet Tab ─────────────────────────────────────────────────────────
function BSTab({ year }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const asOf = `${year}-12-31`;

  const MOCK = {
    as_of: asOf,
    assets: {
      current: [{ name: 'Kas & Bank', amount: 33000000 }, { name: 'Piutang Usaha', amount: 5000000 }],
      fixed:   [{ name: 'Kamera Sony A7R V', cost: 25000000, accum: 5000000, amount: 20000000 }, { name: 'Lighting Set', cost: 10000000, accum: 2000000, amount: 8000000 }],
      total:   66000000,
    },
    liabilities_equity: {
      liabilities: [],
      equity: [{ name: 'Modal & Laba Ditahan', amount: 38000000 }, { name: 'Aset Tetap (NBV)', amount: 28000000 }],
      total: 66000000,
    },
  };

  useEffect(() => {
    setLoading(true);
    getBalanceSheet({ as_of: asOf })
      .then(setData)
      .catch(() => setData(MOCK))
      .finally(() => setLoading(false));
  }, [year]);

  const d = data || {};

  if (loading) return <div className="h-64 flex items-center justify-center text-slate-400">Memuat...</div>;

  const Section = ({ title, items, total, color }) => (
    <div className="glass rounded-2xl p-5">
      <h3 className={clsx('text-sm font-semibold mb-3', color)}>{title}</h3>
      <table className="w-full text-sm">
        <tbody>
          {items.map((r, i) => (
            <tr key={i} className="border-b border-slate-100 dark:border-slate-700/50 last:border-0">
              <td className="py-1.5 text-slate-600 dark:text-slate-300">{r.name}</td>
              {r.cost !== undefined && (
                <td className="py-1.5 text-right text-slate-400 text-xs">{fmt(r.cost)} - {fmt(r.accum)}</td>
              )}
              <td className="py-1.5 text-right font-medium text-slate-800 dark:text-white">{fmt(r.amount)}</td>
            </tr>
          ))}
          <tr className="font-bold border-t border-slate-200 dark:border-slate-600">
            <td className="pt-2">Total</td>
            <td className="pt-2 text-right">{fmt(total)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500 dark:text-slate-400">Per tanggal: {d.as_of}</p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Section title="Aset Lancar" items={d.assets?.current || []} total={(d.assets?.current || []).reduce((s, r) => s + r.amount, 0)} color="text-violet-600 dark:text-violet-400" />
          <Section title="Aset Tetap (Nilai Buku)" items={d.assets?.fixed || []} total={(d.assets?.fixed || []).reduce((s, r) => s + r.amount, 0)} color="text-violet-600 dark:text-violet-400" />
          <div className="glass rounded-xl px-5 py-3 flex justify-between font-bold text-lg">
            <span>Total Aset</span>
            <span className="text-violet-600 dark:text-violet-400">{fmt(d.assets?.total)}</span>
          </div>
        </div>
        <div className="space-y-4">
          <Section title="Liabilitas" items={d.liabilities_equity?.liabilities || [{ name: 'Tidak ada liabilitas', amount: 0 }]} total={0} color="text-red-600 dark:text-red-400" />
          <Section title="Ekuitas" items={d.liabilities_equity?.equity || []} total={(d.liabilities_equity?.equity || []).reduce((s, r) => s + r.amount, 0)} color="text-emerald-600 dark:text-emerald-400" />
          <div className="glass rounded-xl px-5 py-3 flex justify-between font-bold text-lg">
            <span>Total Liabilitas + Ekuitas</span>
            <span className="text-emerald-600 dark:text-emerald-400">{fmt(d.liabilities_equity?.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Cash Flow Tab ─────────────────────────────────────────────────────────────
function CFTab({ year, month }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const MOCK = {
    net_operating: 33000000, net_investing: -5000000, net_cash: 28000000,
    operating: {
      inflows:  [{ category: 'Wedding Photography', total: 50000000 }, { category: 'Corporate Event', total: 35000000 }],
      outflows: [{ category: 'Staff', total: 20000000 }, { category: 'Marketing', total: 8000000 }],
    },
    investing: [{ category: 'Equipment Purchase', total: 5000000 }],
    monthly: {
      1: { revenue: 7000000, expense: 4500000, net: 2500000 },
      2: { revenue: 6500000, expense: 4000000, net: 2500000 },
      3: { revenue: 8000000, expense: 4800000, net: 3200000 },
      4: { revenue: 7200000, expense: 4300000, net: 2900000 },
      5: { revenue: 9000000, expense: 5500000, net: 3500000 },
    },
  };

  useEffect(() => {
    setLoading(true);
    getCashFlow({ year, month })
      .then(setData)
      .catch(() => setData(MOCK))
      .finally(() => setLoading(false));
  }, [year, month]);

  const d = data || {};
  const monthly = Object.entries(d.monthly || {}).map(([m, v]) => ({
    name: MONTHS[parseInt(m)], ...v,
  }));

  if (loading) return <div className="h-64 flex items-center justify-center text-slate-400">Memuat...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard label="Kas dari Operasional" value={fmt(d.net_operating, true)} color={d.net_operating >= 0 ? 'green' : 'red'} icon={TrendingUp} positive={d.net_operating >= 0} />
        <KpiCard label="Kas dari Investasi" value={fmt(d.net_investing, true)} color={d.net_investing >= 0 ? 'green' : 'amber'} icon={BarChart2} positive={d.net_investing >= 0} />
        <KpiCard label="Net Cash Flow" value={fmt(d.net_cash, true)} color={d.net_cash >= 0 ? 'violet' : 'red'} icon={Activity} positive={d.net_cash >= 0} />
      </div>

      <div className="glass rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">Arus Kas Bulanan {year}</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthly}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={v => fmt(v, true)} tick={{ fontSize: 10 }} />
            <Tooltip formatter={v => fmt(v)} />
            <Legend />
            <Bar dataKey="revenue" name="Masuk" fill="#10b981" radius={[3, 3, 0, 0]} />
            <Bar dataKey="expense" name="Keluar" fill="#ef4444" radius={[3, 3, 0, 0]} />
            <Bar dataKey="net" name="Net" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-3">Kas Masuk (Operasional)</h3>
          {(d.operating?.inflows || []).map(r => (
            <div key={r.category} className="flex justify-between text-sm py-1 border-b border-slate-100 dark:border-slate-700/50">
              <span className="text-slate-600 dark:text-slate-300">{r.category}</span>
              <span className="font-medium">{fmt(r.total)}</span>
            </div>
          ))}
        </div>
        <div className="glass rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-3">Kas Keluar (Operasional)</h3>
          {(d.operating?.outflows || []).map(r => (
            <div key={r.category} className="flex justify-between text-sm py-1 border-b border-slate-100 dark:border-slate-700/50">
              <span className="text-slate-600 dark:text-slate-300">{r.category}</span>
              <span className="font-medium">{fmt(r.total)}</span>
            </div>
          ))}
        </div>
        <div className="glass rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-amber-600 dark:text-amber-400 mb-3">Aktivitas Investasi</h3>
          {(d.investing || []).length === 0 && <p className="text-sm text-slate-400">Tidak ada</p>}
          {(d.investing || []).map(r => (
            <div key={r.category} className="flex justify-between text-sm py-1 border-b border-slate-100 dark:border-slate-700/50">
              <span className="text-slate-600 dark:text-slate-300">{r.category}</span>
              <span className="font-medium text-red-500">-{fmt(r.total)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Unit Economics Tab ────────────────────────────────────────────────────────
function UETab({ year }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const MOCK = {
    total_revenue: 85000000, total_expense: 52000000, net_profit: 33000000,
    total_paid_events: 24, avg_rev_per_event: 3541667,
    revenue_by_type: [
      { event_type: 'wedding', count: 12, revenue: 50000000, avg_revenue: 4166667 },
      { event_type: 'corporate', count: 8, revenue: 25000000, avg_revenue: 3125000 },
      { event_type: 'birthday', count: 4, revenue: 10000000, avg_revenue: 2500000 },
    ],
    top_expenses: [
      { category: 'Staff', total: 20000000 },
      { category: 'Equipment', total: 15000000 },
      { category: 'Marketing', total: 8000000 },
      { category: 'Operasional', total: 9000000 },
    ],
  };

  useEffect(() => {
    setLoading(true);
    getUnitEconomics({ year })
      .then(setData)
      .catch(() => setData(MOCK))
      .finally(() => setLoading(false));
  }, [year]);

  const d = data || {};
  const pieData = (d.revenue_by_type || []).map(r => ({ name: r.event_type, value: parseFloat(r.revenue) || 0 }));

  if (loading) return <div className="h-64 flex items-center justify-center text-slate-400">Memuat...</div>;

  const EVENT_LABELS = { wedding: 'Wedding', corporate: 'Corporate', social: 'Social', birthday: 'Birthday', other: 'Lainnya' };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Pendapatan" value={fmt(d.total_revenue, true)} color="green" icon={TrendingUp} />
        <KpiCard label="Laba Bersih" value={fmt(d.net_profit, true)} color="violet" icon={DollarSign} positive={d.net_profit >= 0} />
        <KpiCard label="Total Event" value={d.total_paid_events || 0} color="cyan" icon={FileText} />
        <KpiCard label="Rata-rata / Event" value={fmt(d.avg_rev_per_event, true)} color="amber" icon={BarChart2} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">Pendapatan per Tipe Event</h3>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="50%" height={200}>
              <PieChart>
                <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={80} label={false}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={v => fmt(v)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {(d.revenue_by_type || []).map((r, i) => (
                <div key={r.event_type} className="flex items-center gap-2 text-sm">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="flex-1 text-slate-600 dark:text-slate-300">{EVENT_LABELS[r.event_type] || r.event_type}</span>
                  <span className="font-semibold">{r.count}x</span>
                  <span className="text-slate-400 text-xs">{fmt(r.avg_revenue, true)}/event</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">Top Pengeluaran</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={d.top_expenses || []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
              <XAxis type="number" tickFormatter={v => fmt(v, true)} tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="category" tick={{ fontSize: 11 }} width={90} />
              <Tooltip formatter={v => fmt(v)} />
              <Bar dataKey="total" name="Pengeluaran" fill="#ef4444" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Perbandingan Event</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="pb-2 text-left font-medium text-slate-500">Tipe Event</th>
                <th className="pb-2 text-right font-medium text-slate-500">Jumlah</th>
                <th className="pb-2 text-right font-medium text-slate-500">Total</th>
                <th className="pb-2 text-right font-medium text-slate-500">Rata-rata</th>
              </tr>
            </thead>
            <tbody>
              {(d.revenue_by_type || []).map(r => (
                <tr key={r.event_type} className="border-b border-slate-100 dark:border-slate-700/50 last:border-0">
                  <td className="py-2 capitalize font-medium">{EVENT_LABELS[r.event_type] || r.event_type}</td>
                  <td className="py-2 text-right">{r.count}</td>
                  <td className="py-2 text-right">{fmt(r.revenue)}</td>
                  <td className="py-2 text-right text-violet-600 dark:text-violet-400">{fmt(r.avg_revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Main Reports ──────────────────────────────────────────────────────────────
export default function Reports() {
  const [activeTab, setActiveTab] = useState('pl');
  const [year,  setYear]  = useState(new Date().getFullYear());
  const [month, setMonth] = useState('');
  const [key,   setKey]   = useState(0);

  const refresh = () => setKey(k => k + 1);

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Laporan Keuangan</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">P&L, Neraca, Arus Kas &amp; Unit Ekonomi</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={year}
            onChange={e => setYear(parseInt(e.target.value))}
            className="text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select
            value={month}
            onChange={e => setMonth(e.target.value)}
            className="text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
          >
            <option value="">Semua Bulan</option>
            {MONTHS.slice(1).map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </select>
          <button onClick={refresh} className="p-2 rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl p-1 w-fit">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                activeTab === t.key
                  ? 'bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              )}
            >
              <Icon size={15} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div key={`${activeTab}-${year}-${month}-${key}`}>
        {activeTab === 'pl' && <PLTab year={year} month={month} />}
        {activeTab === 'bs' && <BSTab year={year} />}
        {activeTab === 'cf' && <CFTab year={year} month={month} />}
        {activeTab === 'ue' && <UETab year={year} />}
      </div>
    </div>
  );
}
