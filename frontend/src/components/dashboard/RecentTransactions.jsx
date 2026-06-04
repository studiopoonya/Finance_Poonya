import React from 'react';
import { CheckCircle2, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import clsx from 'clsx';

export default function RecentTransactions({ transactions = [] }) {
  return (
    <div className="glass rounded-2xl border border-black/8 dark:border-white/5 p-6 shadow-glass-light dark:shadow-glass flex flex-col h-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-slate-900 dark:text-white font-semibold text-sm">Recent Transactions</h3>
          <p className="text-slate-500 text-xs mt-0.5">Latest financial activity</p>
        </div>
        <button className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 text-xs font-medium transition-colors">
          View all →
        </button>
      </div>

      <div className="space-y-1 overflow-auto flex-1">
        {transactions.map(tx => (
          <div
            key={tx.id}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-black/[0.03] dark:hover:bg-white/5 transition-colors"
          >
            <span className={clsx(
              'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs',
              tx.type === 'revenue'
                ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-100 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400'
            )}>
              {tx.type === 'revenue' ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}
            </span>

            <div className="flex-1 min-w-0">
              <p className="text-slate-800 dark:text-slate-200 text-xs font-medium truncate">{tx.merchant}</p>
              <p className="text-slate-500 text-[11px] mt-0.5">
                {tx.category} · {new Date(tx.transaction_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
            </div>

            <div className="text-right shrink-0">
              <p className={clsx('text-sm font-semibold', tx.type === 'revenue' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
                {tx.type === 'revenue' ? '+' : '-'}${Number(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <span className="flex items-center justify-end gap-1 mt-0.5">
                {tx.ai_verified
                  ? <CheckCircle2 size={11} className="text-emerald-500" />
                  : <Clock        size={11} className="text-amber-500"   />
                }
                <span className="text-[10px] text-slate-400 dark:text-slate-600">{tx.ai_verified ? 'AI verified' : 'Pending'}</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
