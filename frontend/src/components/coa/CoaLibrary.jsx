import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  BookOpen, Search, ChevronRight, ChevronDown,
  TrendingUp, TrendingDown, Landmark, Layers,
  Link2, RefreshCw, Plus, Pencil, Trash2, X, Save,
} from 'lucide-react';
import clsx from 'clsx';
import {
  getChartOfAccounts, createChartOfAccount,
  updateChartOfAccount, deleteChartOfAccount,
} from '../../lib/api';

// ─────────────────────────────────────────────────────────────────────────────
const CATEGORY_META = {
  current_asset:       { label: 'Aset Lancar',           color: 'blue',    icon: Landmark    },
  fixed_asset:         { label: 'Aset Tetap',             color: 'indigo',  icon: Landmark    },
  current_liability:   { label: 'Kewajiban Jk. Pendek',  color: 'amber',   icon: TrendingDown},
  long_term_liability: { label: 'Kewajiban Jk. Panjang', color: 'orange',  icon: TrendingDown},
  equity:              { label: 'Ekuitas',                color: 'violet',  icon: Layers      },
  revenue:             { label: 'Pendapatan',             color: 'emerald', icon: TrendingUp  },
  cogs:                { label: 'Harga Pokok (COGS)',     color: 'rose',    icon: TrendingDown},
  operating_expense:   { label: 'Biaya Operasional',      color: 'rose',    icon: TrendingDown},
  other_income:        { label: 'Pendapatan Lain-lain',   color: 'teal',    icon: TrendingUp  },
  other_expense:       { label: 'Biaya Lain-lain',        color: 'slate',   icon: TrendingDown},
};

const LEVEL_INDENT = { group: 0, subgroup: 1, detail: 2 };

const COLOR = {
  emerald: { bg: 'bg-emerald-100 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-300 dark:border-emerald-500/20', badge: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20' },
  rose:    { bg: 'bg-rose-100 dark:bg-rose-500/10',       text: 'text-rose-600 dark:text-rose-400',       border: 'border-rose-300 dark:border-rose-500/20',       badge: 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/20' },
  indigo:  { bg: 'bg-indigo-100 dark:bg-indigo-500/10',   text: 'text-indigo-600 dark:text-indigo-400',   border: 'border-indigo-300 dark:border-indigo-500/20',   badge: 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/20' },
  violet:  { bg: 'bg-violet-100 dark:bg-violet-500/10',   text: 'text-violet-600 dark:text-violet-400',   border: 'border-violet-300 dark:border-violet-500/20',   badge: 'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-500/20' },
  amber:   { bg: 'bg-amber-100 dark:bg-amber-500/10',     text: 'text-amber-600 dark:text-amber-400',     border: 'border-amber-300 dark:border-amber-500/20',     badge: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/20' },
  blue:    { bg: 'bg-blue-100 dark:bg-blue-500/10',       text: 'text-blue-600 dark:text-blue-400',       border: 'border-blue-300 dark:border-blue-500/20',       badge: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/20' },
  teal:    { bg: 'bg-teal-100 dark:bg-teal-500/10',       text: 'text-teal-600 dark:text-teal-400',       border: 'border-teal-300 dark:border-teal-500/20',       badge: 'bg-teal-100 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-500/20' },
  slate:   { bg: 'bg-slate-100 dark:bg-slate-500/10',     text: 'text-slate-600 dark:text-slate-400',     border: 'border-slate-300 dark:border-slate-500/20',     badge: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-600' },
  orange:  { bg: 'bg-orange-100 dark:bg-orange-500/10',   text: 'text-orange-600 dark:text-orange-400',   border: 'border-orange-300 dark:border-orange-500/20',   badge: 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-500/20' },
};

const TX_CATEGORIES = ['Equipment', 'Marketing', 'Software', 'Rent', 'Supplies', 'Event Revenue', 'Event Staff', 'Gaji', 'Other'];

// ─────────────────────────────────────────────────────────────────────────────
// Account Modal (Add / Edit)
// ─────────────────────────────────────────────────────────────────────────────
function AccountModal({ account, allAccounts, onClose, onSaved }) {
  const isNew = !account;
  const [form, setForm] = useState({
    code:             account?.code ?? '',
    name:             account?.name ?? '',
    account_level:    account?.account_level ?? 'detail',
    statement_type:   account?.statement_type ?? 'balance_sheet',
    normal_balance:   account?.normal_balance ?? 'debit',
    report_category:  account?.report_category ?? 'current_asset',
    parent_code:      account?.parent_code ?? '',
    maps_to_category: account?.maps_to_category ?? '',
    description:      account?.description ?? '',
    sort_order:       account?.sort_order ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.code || !form.name) { setError('Kode dan Nama akun wajib diisi.'); return; }
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        parent_code:      form.parent_code || null,
        maps_to_category: form.maps_to_category || null,
        description:      form.description || null,
        sort_order:       form.sort_order !== '' ? Number(form.sort_order) : null,
      };
      if (isNew) {
        await createChartOfAccount(payload);
      } else {
        await updateChartOfAccount(account.code, payload);
      }
      onSaved();
    } catch (e) {
      const msg = e?.response?.data?.errors
        ? Object.values(e.response.data.errors).flat().join(' ')
        : e?.response?.data?.message ?? 'Gagal menyimpan akun.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const parentOptions = allAccounts.filter(a => a.code !== account?.code && a.account_level !== 'detail');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="glass rounded-2xl border border-black/8 dark:border-white/10 shadow-glass-light dark:shadow-glass w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col gap-5 p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-slate-900 dark:text-white font-semibold">
            {isNew ? 'Tambah Akun Baru' : `Edit Akun ${account.code}`}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <X size={18} />
          </button>
        </div>

        {error && (
          <p className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl px-3 py-2">
            {error}
          </p>
        )}

        <div className="grid grid-cols-1 gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Kode Akun *">
              <Input value={form.code} placeholder="e.g. 1101" onChange={e => set('code', e.target.value)} disabled={!isNew} />
            </Field>
            <Field label="Sort Order">
              <Input type="number" value={form.sort_order} placeholder="auto" onChange={e => set('sort_order', e.target.value)} />
            </Field>
          </div>
          <Field label="Nama Akun *">
            <Input value={form.name} placeholder="e.g. Kas Bank – BCA" onChange={e => set('name', e.target.value)} />
          </Field>
          <Field label="Deskripsi">
            <Input value={form.description} placeholder="Opsional — keterangan singkat" onChange={e => set('description', e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Level">
              <ModalSelect value={form.account_level} onChange={e => set('account_level', e.target.value)}>
                <option value="group">Group</option>
                <option value="subgroup">Subgroup</option>
                <option value="detail">Detail</option>
              </ModalSelect>
            </Field>
            <Field label="Laporan">
              <ModalSelect value={form.statement_type} onChange={e => set('statement_type', e.target.value)}>
                <option value="balance_sheet">Neraca</option>
                <option value="income_statement">Laba Rugi</option>
              </ModalSelect>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Saldo Normal">
              <ModalSelect value={form.normal_balance} onChange={e => set('normal_balance', e.target.value)}>
                <option value="debit">Debit (D)</option>
                <option value="credit">Kredit (K)</option>
              </ModalSelect>
            </Field>
            <Field label="Kategori Laporan">
              <ModalSelect value={form.report_category} onChange={e => set('report_category', e.target.value)}>
                {Object.entries(CATEGORY_META).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </ModalSelect>
            </Field>
          </div>
          <Field label="Parent Akun (opsional)">
            <ModalSelect value={form.parent_code} onChange={e => set('parent_code', e.target.value)}>
              <option value="">— Tidak ada parent —</option>
              {parentOptions.map(a => (
                <option key={a.code} value={a.code}>{a.code} — {a.name}</option>
              ))}
            </ModalSelect>
          </Field>
          <Field label="Maps to Category (opsional)">
            <ModalSelect value={form.maps_to_category} onChange={e => set('maps_to_category', e.target.value)}>
              <option value="">— Tidak di-link —</option>
              {TX_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </ModalSelect>
          </Field>
        </div>

        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {saving ? <><RefreshCw size={14} className="animate-spin" /> Saving…</> : <><Save size={14} /> Simpan</>}
          </button>
        </div>
      </div>
    </div>
  );
}

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
        'w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm',
        'text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600',
        'focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-500/50 transition-colors',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
      {...props}
    />
  );
}

function ModalSelect({ children, ...props }) {
  return (
    <select
      className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-500/50 appearance-none cursor-pointer transition-colors"
      {...props}
    >
      {children}
    </select>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Delete Confirm
// ─────────────────────────────────────────────────────────────────────────────
function DeleteConfirm({ account, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const handle = async () => {
    setDeleting(true);
    setError('');
    try {
      await deleteChartOfAccount(account.code);
      onDeleted();
    } catch (e) {
      setError(e?.response?.data?.error ?? 'Gagal menghapus akun.');
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="glass rounded-2xl border border-black/8 dark:border-white/10 shadow-glass-light dark:shadow-glass w-full max-w-sm p-6 flex flex-col gap-4">
        <h3 className="text-slate-900 dark:text-white font-semibold">Hapus Akun?</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Akun <strong className="text-slate-700 dark:text-slate-200">{account.code} — {account.name}</strong> akan dihapus permanen.
        </p>
        {error && <p className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl px-3 py-2">{error}</p>}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-all">Batal</button>
          <button onClick={handle} disabled={deleting} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors disabled:opacity-50">
            {deleting ? 'Menghapus…' : 'Hapus'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Account Row
// ─────────────────────────────────────────────────────────────────────────────
function AccountRow({ account, isExpanded, onToggle, hasChildren, onEdit, onDelete }) {
  const meta   = CATEGORY_META[account.report_category] ?? CATEGORY_META.operating_expense;
  const color  = COLOR[meta.color] ?? COLOR.slate;
  const indent = LEVEL_INDENT[account.account_level] ?? 0;
  const isGroup    = account.account_level === 'group';
  const isSubgroup = account.account_level === 'subgroup';

  return (
    <div
      className={clsx(
        'group flex items-start gap-3 py-2.5 px-3 rounded-xl transition-all',
        hasChildren && 'cursor-pointer',
        isGroup
          ? 'bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-white/5 mt-4 first:mt-0'
          : isSubgroup
            ? 'bg-slate-50/80 dark:bg-white/[0.02] mt-1'
            : 'hover:bg-slate-50 dark:hover:bg-white/[0.03]',
      )}
      style={{ paddingLeft: `${12 + indent * 20}px` }}
      onClick={hasChildren ? onToggle : undefined}
    >
      {/* Expand toggle */}
      <div className="w-4 h-4 flex items-center justify-center mt-0.5 shrink-0">
        {hasChildren ? (
          isExpanded
            ? <ChevronDown  size={13} className="text-slate-400 dark:text-slate-500" />
            : <ChevronRight size={13} className="text-slate-400 dark:text-slate-500" />
        ) : (
          <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700 inline-block" />
        )}
      </div>

      {/* Code */}
      <span className={clsx(
        'font-mono text-xs shrink-0 w-10',
        isGroup    ? 'text-slate-900 dark:text-white font-bold'
        : isSubgroup ? 'text-slate-600 dark:text-slate-300 font-semibold'
        : 'text-slate-400 dark:text-slate-500'
      )}>
        {account.code}
      </span>

      {/* Name + description */}
      <div className="flex-1 min-w-0">
        <span className={clsx(
          'text-sm',
          isGroup    ? 'text-slate-900 dark:text-white font-bold uppercase tracking-wide'
          : isSubgroup ? 'text-slate-700 dark:text-slate-200 font-semibold'
          : 'text-slate-600 dark:text-slate-300'
        )}>
          {account.name}
        </span>
        {account.description && !isGroup && (
          <p className="text-slate-500 dark:text-slate-600 text-[11px] mt-0.5 leading-tight truncate">{account.description}</p>
        )}
      </div>

      {/* Badges */}
      <div className="flex items-center gap-2 shrink-0">
        {account.maps_to_category && (
          <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
            <Link2 size={9} />{account.maps_to_category}
          </span>
        )}
        {account.account_level === 'detail' && (
          <span className={clsx('text-[10px] px-2 py-0.5 rounded-full border font-medium',
            account.normal_balance === 'debit'
              ? 'bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20'
              : 'bg-violet-100 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-500/20'
          )}>
            {account.normal_balance === 'debit' ? 'D' : 'K'}
          </span>
        )}
        {!isGroup && (
          <span className={clsx('text-[10px] px-2 py-0.5 rounded-full border hidden lg:inline-flex', color.badge)}>
            {meta.label}
          </span>
        )}
        {/* Edit / Delete (visible on row hover) */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => onEdit(account)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all"
          >
            <Pencil size={12} />
          </button>
          <button
            onClick={() => onDelete(account)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Statement Section
// ─────────────────────────────────────────────────────────────────────────────
function StatementSection({ title, accounts, expanded, setExpanded, query, onEdit, onDelete }) {
  const childrenOf = useMemo(() => {
    const map = {};
    accounts.forEach(a => {
      if (a.parent_code) {
        map[a.parent_code] = map[a.parent_code] ?? [];
        map[a.parent_code].push(a.code);
      }
    });
    return map;
  }, [accounts]);

  const visible = useMemo(() => {
    if (!query) return accounts;
    const q = query.toLowerCase();
    return accounts.filter(a =>
      a.code.includes(q) ||
      a.name.toLowerCase().includes(q) ||
      (a.description ?? '').toLowerCase().includes(q) ||
      (a.maps_to_category ?? '').toLowerCase().includes(q)
    );
  }, [accounts, query]);

  const toggle = (code) => setExpanded(p => ({ ...p, [code]: !p[code] }));

  const isVisible = (account) => {
    if (query) return true;
    if (!account.parent_code) return true;
    const parentExpanded = expanded[account.parent_code] !== false;
    if (account.account_level === 'detail') {
      const grandparent = accounts.find(a => a.code === account.parent_code)?.parent_code;
      return parentExpanded && (grandparent ? expanded[grandparent] !== false : true);
    }
    return parentExpanded;
  };

  return (
    <div className="glass rounded-2xl border border-black/8 dark:border-white/5 overflow-hidden shadow-glass-light dark:shadow-glass">
      <div className="px-6 py-4 border-b border-black/6 dark:border-white/5 flex items-center justify-between">
        <h3 className="text-slate-900 dark:text-white font-bold text-sm">{title}</h3>
        <span className="text-xs text-slate-500">{accounts.length} akun</span>
      </div>
      <div className="px-3 py-3 space-y-0.5">
        {visible.filter(isVisible).map(account => (
          <AccountRow
            key={account.code}
            account={account}
            hasChildren={!!childrenOf[account.code]}
            isExpanded={expanded[account.code] !== false}
            onToggle={() => toggle(account.code)}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Summary Bar
// ─────────────────────────────────────────────────────────────────────────────
function SummaryBar({ data }) {
  const income      = data.income_statement ?? [];
  const totalRev    = income.filter(a => a.report_category === 'revenue').reduce((s, a) => s + a.transaction_total, 0);
  const totalCogs   = income.filter(a => a.report_category === 'cogs').reduce((s, a) => s + a.transaction_total, 0);
  const totalOpex   = income.filter(a => a.report_category === 'operating_expense').reduce((s, a) => s + a.transaction_total, 0);
  const grossProfit = totalRev - totalCogs;
  const grossMargin = totalRev > 0 ? ((grossProfit / totalRev) * 100).toFixed(1) : 0;

  const stats = [
    { label: 'Total Akun',       value: data.summary?.total_accounts ?? 0,           suffix: ' akun', color: 'text-slate-900 dark:text-white'      },
    { label: 'Revenue (YTD)',    value: `$${(totalRev / 1000).toFixed(1)}K`,          suffix: '',      color: 'text-emerald-600 dark:text-emerald-400'},
    { label: 'COGS (YTD)',       value: `$${(totalCogs / 1000).toFixed(1)}K`,         suffix: '',      color: 'text-rose-600 dark:text-rose-400'    },
    { label: 'Gross Margin',     value: grossMargin,                                   suffix: '%',     color: grossMargin >= 50 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400' },
    { label: 'Op. Expense (YTD)', value: `$${(totalOpex / 1000).toFixed(1)}K`,        suffix: '',      color: 'text-rose-600 dark:text-rose-400'    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
      {stats.map(s => (
        <div key={s.label} className="glass rounded-xl border border-black/8 dark:border-white/5 px-4 py-3">
          <p className="text-[11px] text-slate-500 uppercase tracking-wide">{s.label}</p>
          <p className={clsx('text-lg font-bold mt-0.5', s.color)}>{s.value}{s.suffix}</p>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Legend
// ─────────────────────────────────────────────────────────────────────────────
function Legend() {
  return (
    <div className="glass rounded-xl border border-black/8 dark:border-white/5 px-5 py-4 mb-6">
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Legenda</p>
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        {[
          { label: 'D = Normal Debit (saldo normal di sisi debit)',   color: 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'     },
          { label: 'K = Normal Kredit (saldo normal di sisi kredit)', color: 'bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400'},
          { label: 'Link → mapped ke kategori transaksi di sistem',   color: 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400'},
          { label: 'Angka hijau = total revenue dari kategori itu',   color: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'},
          { label: 'Angka merah = total expense dari kategori itu',   color: 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400'       },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-2">
            <span className={clsx('text-[10px] px-2 py-0.5 rounded-full font-medium', l.color)}>●</span>
            <span className="text-xs text-slate-500">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock
// ─────────────────────────────────────────────────────────────────────────────
const MOCK = {
  balance_sheet: [
    { code:'1000',name:'ASET',account_level:'group',statement_type:'balance_sheet',normal_balance:'debit',report_category:'current_asset',parent_code:null,maps_to_category:null,description:null,transaction_total:0,sort_order:10 },
    { code:'1100',name:'Aset Lancar',account_level:'subgroup',statement_type:'balance_sheet',normal_balance:'debit',report_category:'current_asset',parent_code:'1000',maps_to_category:null,description:null,transaction_total:0,sort_order:11 },
    { code:'1101',name:'Kas Bank – BCA',account_level:'detail',statement_type:'balance_sheet',normal_balance:'debit',report_category:'current_asset',parent_code:'1100',maps_to_category:null,description:'Rekening operasional utama PT (BCA)',transaction_total:0,sort_order:12 },
    { code:'1102',name:'Kas Bank – Line Bank',account_level:'detail',statement_type:'balance_sheet',normal_balance:'debit',report_category:'current_asset',parent_code:'1100',maps_to_category:null,description:null,transaction_total:0,sort_order:13 },
    { code:'1103',name:'Kas Bank – Saqu',account_level:'detail',statement_type:'balance_sheet',normal_balance:'debit',report_category:'current_asset',parent_code:'1100',maps_to_category:null,description:'Rekening tabungan/float',transaction_total:0,sort_order:14 },
    { code:'1104',name:'Persediaan',account_level:'detail',statement_type:'balance_sheet',normal_balance:'debit',report_category:'current_asset',parent_code:'1100',maps_to_category:'Supplies',description:'Stok supplies: film, cetak, backdrop',transaction_total:0,sort_order:15 },
    { code:'1200',name:'Aset Tetap',account_level:'subgroup',statement_type:'balance_sheet',normal_balance:'debit',report_category:'fixed_asset',parent_code:'1000',maps_to_category:null,description:null,transaction_total:0,sort_order:20 },
    { code:'1201',name:'Peralatan',account_level:'detail',statement_type:'balance_sheet',normal_balance:'debit',report_category:'fixed_asset',parent_code:'1200',maps_to_category:'Equipment',description:'Kamera, printer, backdrop, lighting',transaction_total:3600,sort_order:21 },
    { code:'2000',name:'KEWAJIBAN',account_level:'group',statement_type:'balance_sheet',normal_balance:'credit',report_category:'current_liability',parent_code:null,maps_to_category:null,description:null,transaction_total:0,sort_order:30 },
    { code:'3000',name:'EKUITAS',account_level:'group',statement_type:'balance_sheet',normal_balance:'credit',report_category:'equity',parent_code:null,maps_to_category:null,description:null,transaction_total:0,sort_order:50 },
    { code:'3300',name:'Laba Ditahan',account_level:'detail',statement_type:'balance_sheet',normal_balance:'credit',report_category:'equity',parent_code:'3000',maps_to_category:null,description:'Retained Earnings',transaction_total:0,sort_order:53 },
  ],
  income_statement: [
    { code:'4000',name:'PENDAPATAN',account_level:'group',statement_type:'income_statement',normal_balance:'credit',report_category:'revenue',parent_code:null,maps_to_category:null,description:null,transaction_total:0,sort_order:60 },
    { code:'4001',name:'Pendapatan Jasa – Wedding',account_level:'detail',statement_type:'income_statement',normal_balance:'credit',report_category:'revenue',parent_code:'4000',maps_to_category:'Event Revenue',description:'Sewa photobooth untuk pernikahan',transaction_total:18450,sort_order:61 },
    { code:'4002',name:'Pendapatan Jasa – Corporate',account_level:'detail',statement_type:'income_statement',normal_balance:'credit',report_category:'revenue',parent_code:'4000',maps_to_category:null,description:'Sewa photobooth untuk acara korporat',transaction_total:0,sort_order:62 },
    { code:'5000',name:'HARGA POKOK PENJUALAN',account_level:'group',statement_type:'income_statement',normal_balance:'debit',report_category:'cogs',parent_code:null,maps_to_category:null,description:'COGS: biaya langsung menghasilkan revenue',transaction_total:0,sort_order:70 },
    { code:'5001',name:'Tenaga Kerja Event (COGS)',account_level:'detail',statement_type:'income_statement',normal_balance:'debit',report_category:'cogs',parent_code:'5000',maps_to_category:'Event Staff',description:'Operator, fotografer freelance per event',transaction_total:0,sort_order:71 },
    { code:'6000',name:'BIAYA OPERASIONAL',account_level:'group',statement_type:'income_statement',normal_balance:'debit',report_category:'operating_expense',parent_code:null,maps_to_category:null,description:null,transaction_total:0,sort_order:80 },
    { code:'6101',name:'Biaya Gaji Karyawan Tetap',account_level:'detail',statement_type:'income_statement',normal_balance:'debit',report_category:'operating_expense',parent_code:'6000',maps_to_category:'Gaji',description:'Gaji bulanan karyawan tetap',transaction_total:4200,sort_order:82 },
    { code:'6201',name:'Biaya Iklan Digital',account_level:'detail',statement_type:'income_statement',normal_balance:'debit',report_category:'operating_expense',parent_code:'6000',maps_to_category:'Marketing',description:'Meta Ads, Google Ads, TikTok Ads',transaction_total:1800,sort_order:91 },
  ],
  summary: { total_accounts: 55, detail_accounts: 35, mapped_accounts: 14 },
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
export default function CoaLibrary() {
  const [data,     setData]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [isMock,   setIsMock]   = useState(false);
  const [query,    setQuery]    = useState('');
  const [expanded, setExpanded] = useState({});
  const [tab,      setTab]      = useState('all');
  const [editAcc,  setEditAcc]  = useState(null);
  const [deleteAcc,setDeleteAcc]= useState(null);
  const [showAdd,  setShowAdd]  = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await getChartOfAccounts();
      setData(d);
      setIsMock(false);
    } catch {
      setData(MOCK);
      setIsMock(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const allAccounts = useMemo(() => [
    ...(data?.balance_sheet    ?? []),
    ...(data?.income_statement ?? []),
  ], [data]);

  const tabs = [
    { key: 'all',              label: 'Semua Akun' },
    { key: 'balance_sheet',    label: 'Neraca'     },
    { key: 'income_statement', label: 'Laba Rugi'  },
  ];

  return (
    <div className="p-6 lg:p-8 min-h-screen">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <BookOpen className="text-indigo-500 dark:text-indigo-400" size={22} />
            Chart of Accounts
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Library akun — standar investor-grade untuk bisnis photobooth
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 glass border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs transition-all hover:bg-slate-50 dark:hover:bg-white/5"
          >
            <RefreshCw size={12} /> Reload
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors shadow-lg shadow-indigo-500/20"
          >
            <Plus size={13} /> Tambah Akun
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-10 rounded-xl bg-slate-200 dark:bg-slate-800/50 animate-pulse" />)}
        </div>
      ) : (
        <>
          <SummaryBar data={data} />
          <Legend />

          {/* Search + tabs */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Cari kode, nama, atau kategori akun…"
                className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-500/50 transition-colors"
              />
            </div>
            <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 rounded-xl p-1">
              {tabs.map(t => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={clsx(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                    tab === t.key
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {isMock && (
            <div className="mb-4 flex items-center gap-2 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl px-4 py-2.5 text-xs">
              Demo data — jalankan backend + migrate untuk lihat data real
            </div>
          )}

          {/* CoA sections */}
          <div className="space-y-5">
            {(tab === 'all' || tab === 'balance_sheet') && (
              <StatementSection
                title="📊 Neraca (Balance Sheet)"
                accounts={data.balance_sheet}
                expanded={expanded}
                setExpanded={setExpanded}
                query={query}
                onEdit={setEditAcc}
                onDelete={setDeleteAcc}
              />
            )}
            {(tab === 'all' || tab === 'income_statement') && (
              <StatementSection
                title="📈 Laba Rugi (Income Statement)"
                accounts={data.income_statement}
                expanded={expanded}
                setExpanded={setExpanded}
                query={query}
                onEdit={setEditAcc}
                onDelete={setDeleteAcc}
              />
            )}
          </div>

          {/* Investor note */}
          <div className="mt-6 glass rounded-2xl border border-indigo-300 dark:border-indigo-500/20 px-6 py-5">
            <p className="text-indigo-600 dark:text-indigo-300 font-semibold text-sm mb-2">💡 Kenapa CoA ini berbeda dari versi sebelumnya?</p>
            <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              <li>→ <strong className="text-slate-700 dark:text-slate-300">COGS (5000)</strong> dipisah dari OpEx → investor bisa hitung <strong className="text-emerald-600 dark:text-emerald-400">Gross Margin</strong></li>
              <li>→ <strong className="text-slate-700 dark:text-slate-300">Revenue</strong> dipecah per segmen (Wedding/Corporate/Social) → terlihat mana yang tumbuh</li>
              <li>→ <strong className="text-slate-700 dark:text-slate-300">Ekuitas</strong> punya <strong className="text-violet-600 dark:text-violet-400">Laba Ditahan (3300)</strong> → standar laporan keuangan audited</li>
              <li>→ <strong className="text-slate-700 dark:text-slate-300">Kewajiban</strong> dipisah jangka pendek vs panjang → debt structure jelas untuk investor</li>
              <li>→ Hover pada baris akun untuk muncul tombol edit dan hapus</li>
            </ul>
          </div>
        </>
      )}

      {/* Modals */}
      {(showAdd || editAcc) && (
        <AccountModal
          account={editAcc}
          allAccounts={allAccounts}
          onClose={() => { setShowAdd(false); setEditAcc(null); }}
          onSaved={() => { setShowAdd(false); setEditAcc(null); load(); }}
        />
      )}
      {deleteAcc && (
        <DeleteConfirm
          account={deleteAcc}
          onClose={() => setDeleteAcc(null)}
          onDeleted={() => { setDeleteAcc(null); load(); }}
        />
      )}
    </div>
  );
}
