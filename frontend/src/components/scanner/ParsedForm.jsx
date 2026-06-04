import React from 'react';
import { Save, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import clsx from 'clsx';

const CATEGORIES = ['Equipment', 'Marketing', 'Software', 'Rent', 'Supplies', 'Event Revenue', 'Other'];

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}

function Input({ className, ...props }) {
  return (
    <input
      className={clsx(
        'w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white',
        'placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-500/60 dark:focus:bg-slate-800',
        'transition-colors',
        className
      )}
      {...props}
    />
  );
}

function Select({ children, className, ...props }) {
  return (
    <select
      className={clsx(
        'w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white',
        'focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-500/60 appearance-none cursor-pointer',
        'transition-colors',
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export default function ParsedForm({ parsed, isMock, onSave, saving, manualMode = false }) {
  const [form, setForm] = React.useState({
    transaction_date: parsed?.date ?? '',
    merchant:         parsed?.merchant ?? '',
    amount:           parsed?.amount ?? '',
    type:             parsed?.type ?? 'expense',
    category:         parsed?.category ?? '',
    notes:            parsed?.notes ?? '',
    ai_verified:      !manualMode,
    ai_confidence:    parsed?.confidence ?? null,
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const confidence = form.ai_confidence;
  const confLabel  = confidence >= 0.9 ? 'High' : confidence >= 0.7 ? 'Medium' : 'Low';

  return (
    <div className="glass rounded-2xl border border-black/8 dark:border-white/5 p-6 shadow-glass-light dark:shadow-glass flex flex-col gap-5 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-slate-900 dark:text-white font-semibold">
            {manualMode ? 'Manual Transaction Entry' : 'AI Extraction Result'}
          </h3>
          <p className="text-slate-500 text-xs mt-0.5">
            {manualMode ? 'Fill in the transaction details below' : 'Verify and edit before saving'}
          </p>
        </div>
        {!manualMode && confidence != null && (
          <div className={clsx('flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border', {
            'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400': confidence >= 0.9,
            'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400':  confidence >= 0.7 && confidence < 0.9,
            'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400':   confidence < 0.7,
          })}>
            {confidence >= 0.9
              ? <CheckCircle2  size={12} />
              : <AlertTriangle size={12} />
            }
            {confLabel} confidence · {Math.round(confidence * 100)}%
          </div>
        )}
      </div>

      {isMock && !manualMode && (
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl px-4 py-2.5 text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2">
          <AlertTriangle size={13} className="shrink-0" />
          Running in demo mode — set ANTHROPIC_API_KEY in .env for live OCR
        </div>
      )}

      {/* Form fields */}
      <div className="grid grid-cols-1 gap-4 flex-1">
        <Field label="Transaction Date">
          <Input type="date" value={form.transaction_date} onChange={e => set('transaction_date', e.target.value)} />
        </Field>

        <Field label="Merchant / Description">
          <Input type="text" value={form.merchant} placeholder="e.g. Canon Store" onChange={e => set('merchant', e.target.value)} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Amount (USD)">
            <Input type="number" step="0.01" min="0" value={form.amount} placeholder="0.00" onChange={e => set('amount', e.target.value)} />
          </Field>
          <Field label="Type">
            <Select value={form.type} onChange={e => set('type', e.target.value)}>
              <option value="expense">Expense</option>
              <option value="revenue">Revenue</option>
            </Select>
          </Field>
        </div>

        <Field label="Category">
          <Select value={form.category} onChange={e => set('category', e.target.value)}>
            <option value="">— Select category —</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>
        </Field>

        <Field label="Notes (optional)">
          <textarea
            rows={2}
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            placeholder="Any additional context..."
            className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-500/60 resize-none transition-colors"
          />
        </Field>

        {!manualMode && (
          <div className="flex items-center justify-between py-2 px-3.5 bg-slate-50 dark:bg-white/[0.02] rounded-xl border border-slate-200 dark:border-white/5">
            <div>
              <p className="text-slate-700 dark:text-slate-300 text-xs font-medium">Mark as AI Verified</p>
              <p className="text-slate-500 dark:text-slate-600 text-[11px] mt-0.5">Confirms the extraction was reviewed</p>
            </div>
            <button
              type="button"
              onClick={() => set('ai_verified', !form.ai_verified)}
              className={clsx(
                'w-10 h-5 rounded-full transition-colors relative',
                form.ai_verified ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-700'
              )}
            >
              <span className={clsx(
                'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
                form.ai_verified ? 'translate-x-5' : 'translate-x-0.5'
              )} />
            </button>
          </div>
        )}
      </div>

      {/* Save button */}
      <button
        onClick={() => onSave(form)}
        disabled={saving || !form.merchant || !form.amount}
        className={clsx(
          'flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm transition-all',
          'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        {saving ? (
          <><RefreshCw size={15} className="animate-spin" /> Saving…</>
        ) : (
          <><Save size={15} /> {manualMode ? 'Add Transaction' : 'Save Transaction'}</>
        )}
      </button>
    </div>
  );
}
