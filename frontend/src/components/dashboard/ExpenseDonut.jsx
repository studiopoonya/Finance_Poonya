import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

const COLORS = ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="glass rounded-xl px-4 py-3 text-xs shadow-xl border border-black/8 dark:border-white/10">
      <p className="text-slate-800 dark:text-white font-medium">{item.name}</p>
      <p className="text-slate-500 mt-0.5">${Number(item.value).toLocaleString()}</p>
    </div>
  );
};

export default function ExpenseDonut({ data = [] }) {
  const total = data.reduce((s, d) => s + Number(d.total), 0);

  return (
    <div className="glass rounded-2xl border border-black/8 dark:border-white/5 p-6 shadow-glass-light dark:shadow-glass h-full flex flex-col">
      <div className="mb-4">
        <h3 className="text-slate-900 dark:text-white font-semibold text-sm">Expense Breakdown</h3>
        <p className="text-slate-500 text-xs mt-0.5">Current month by category</p>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-6 flex-1">
        <div className="relative w-40 h-40 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="total" nameKey="category" cx="50%" cy="50%" innerRadius={44} outerRadius={68} paddingAngle={3} strokeWidth={0}>
                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-slate-900 dark:text-white font-bold text-sm">${(total / 1000).toFixed(1)}K</p>
            <p className="text-slate-500 text-[10px]">total</p>
          </div>
        </div>

        <ul className="flex-1 space-y-2 w-full">
          {data.map((item, i) => {
            const pct = total > 0 ? ((item.total / total) * 100).toFixed(1) : 0;
            return (
              <li key={item.category} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="text-slate-600 dark:text-slate-400 text-xs flex-1 truncate">{item.category}</span>
                <span className="text-slate-400 dark:text-slate-500 text-xs">{pct}%</span>
                <span className="text-slate-800 dark:text-white text-xs font-medium w-16 text-right">${Number(item.total).toLocaleString()}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
