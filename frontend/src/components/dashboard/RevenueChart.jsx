import React from 'react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip,
} from 'recharts';
import { useTheme } from '../../context/ThemeContext';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-xl px-4 py-3 text-xs shadow-xl border border-black/8 dark:border-white/10">
      <p className="text-slate-700 dark:text-slate-300 font-semibold mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
          <span className="text-slate-500 capitalize">{p.name}:</span>
          <span className="text-slate-900 dark:text-white font-medium">${Number(p.value).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

export default function RevenueChart({ data = [] }) {
  const { dark } = useTheme();
  const tickColor    = dark ? '#64748b' : '#94a3b8';
  const gridColor    = dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)';

  return (
    <div className="glass rounded-2xl border border-black/8 dark:border-white/5 p-6 shadow-glass-light dark:shadow-glass h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-slate-900 dark:text-white font-semibold text-sm">Revenue vs Expenses</h3>
          <p className="text-slate-500 text-xs mt-0.5">6-month trend</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-slate-500">
            <span className="w-3 h-1 rounded-full bg-indigo-500 inline-block" /> Revenue
          </span>
          <span className="flex items-center gap-1.5 text-slate-500">
            <span className="w-3 h-1 rounded-full bg-rose-400 inline-block" /> Expenses
          </span>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#6366f1" stopOpacity={dark ? 0.3 : 0.2} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradExpenses" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#f43f5e" stopOpacity={dark ? 0.3 : 0.15} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis dataKey="month" tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => v.split(' ')[0]} />
            <YAxis tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="revenue"  name="Revenue"  stroke="#6366f1" strokeWidth={2} fill="url(#gradRevenue)"  dot={false} activeDot={{ r: 4, fill: '#6366f1' }} />
            <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#f43f5e" strokeWidth={2} fill="url(#gradExpenses)" dot={false} activeDot={{ r: 4, fill: '#f43f5e' }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
