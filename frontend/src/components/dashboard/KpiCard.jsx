import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import clsx from 'clsx';

function fmt(n) {
  if (n === null || n === undefined) return '—';
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`;
  return `$${Number(n).toFixed(2)}`;
}

const ACCENT = {
  emerald: {
    card:   'from-emerald-500/15 to-emerald-600/5 dark:from-emerald-500/20 dark:to-emerald-600/5 border-emerald-500/25 dark:border-emerald-500/20',
    icon:   'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    glow:   'bg-emerald-400',
  },
  rose: {
    card:   'from-rose-500/10 to-rose-600/5 dark:from-rose-500/20 dark:to-rose-600/5 border-rose-500/25 dark:border-rose-500/20',
    icon:   'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400',
    glow:   'bg-rose-400',
  },
  indigo: {
    card:   'from-indigo-500/10 to-indigo-600/5 dark:from-indigo-500/20 dark:to-indigo-600/5 border-indigo-500/25 dark:border-indigo-500/20',
    icon:   'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400',
    glow:   'bg-indigo-400',
  },
  violet: {
    card:   'from-violet-500/10 to-violet-600/5 dark:from-violet-500/20 dark:to-violet-600/5 border-violet-500/25 dark:border-violet-500/20',
    icon:   'bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400',
    glow:   'bg-violet-400',
  },
  amber: {
    card:   'from-amber-500/10 to-amber-600/5 dark:from-amber-500/20 dark:to-amber-600/5 border-amber-500/25 dark:border-amber-500/20',
    icon:   'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400',
    glow:   'bg-amber-400',
  },
};

export default function KpiCard({ title, value, change, suffix = '', icon: Icon, accent, className }) {
  const positive = change > 0;
  const neutral  = change === 0 || change == null;
  const ChangeIcon = neutral ? Minus : positive ? TrendingUp : TrendingDown;
  const a = ACCENT[accent] ?? ACCENT.indigo;

  return (
    <div className={clsx(
      'relative overflow-hidden rounded-2xl bg-gradient-to-br border p-5 flex flex-col gap-4',
      'shadow-glass-light dark:shadow-glass glass-hover transition-all duration-200',
      a.card, className
    )}>
      <div className={clsx('absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-10 dark:opacity-20', a.glow)} />

      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</p>
          <p className="mt-1.5 text-2xl font-bold text-slate-900 dark:text-white">
            {suffix ? `${Number(value).toFixed(2)}${suffix}` : fmt(value)}
          </p>
        </div>
        {Icon && (
          <span className={clsx('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', a.icon)}>
            <Icon size={17} />
          </span>
        )}
      </div>

      {change != null && (
        <div className="flex items-center gap-1.5">
          <ChangeIcon
            size={13}
            className={neutral ? 'text-slate-400' : positive ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}
          />
          <span className={clsx('text-xs font-semibold', neutral ? 'text-slate-400' : positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
            {neutral ? 'No change' : `${positive ? '+' : ''}${change}%`}
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500">vs last month</span>
        </div>
      )}
    </div>
  );
}
