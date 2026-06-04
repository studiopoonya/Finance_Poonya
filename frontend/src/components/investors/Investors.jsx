import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Plus, Pencil, Trash2, X, Save, RefreshCw,
  TrendingUp, DollarSign, Percent, Activity,
} from 'lucide-react';
import clsx from 'clsx';
import { getInvestors, createInvestor, updateInvestor, deleteInvestor } from '../../lib/api';

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK = {
  investors: [
    { id: 1, name: 'Budi Santoso',   email: 'budi@example.com',   company: 'Santoso Holdings',  investment_amount: 25000, investment_date: '2024-01-15', equity_percentage: 15.00, status: 'active',  notes: 'Lead investor, co-founder round.' },
    { id: 2, name: 'Citra Dewi',     email: 'citra@example.com',  company: null,                investment_amount: 10000, investment_date: '2024-03-01', equity_percentage:  6.00, status: 'active',  notes: null },
    { id: 3, name: 'PT Maju Jaya',   email: 'info@majujaya.id',   company: 'PT Maju Jaya',      investment_amount:  5000, investment_date: '2024-06-10', equity_percentage:  3.00, status: 'pending', notes: 'Menunggu dokumen legal.' },
  ],
  summary: { total_invested: 40000, active_count: 2, total_count: 3, total_equity_pct: 24, net_profit: 9400 },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_STYLE = {
  active:  'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
  exited:  'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-600',
  pending: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
};

function Input({ className, ...props }) {
  return (
    <input
      className={clsx(
        'w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm',
        'text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600',
        'focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-500/50 transition-colors',
        className
      )}
      {...props}
    />
  );
}

function Sel({ className, children, ...props }) {
  return (
    <select
      className={clsx(
        'w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm',
        'text-slate-900 dark:text-white focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-500/50 appearance-none cursor-pointer transition-colors',
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

// ─── Investor Modal ───────────────────────────────────────────────────────────
function InvestorModal({ investor, onClose, onSaved }) {
  const isNew = !investor;
  const [form, setForm] = useState({
    name:               investor?.name ?? '',
    email:              investor?.email ?? '',
    company:            investor?.company ?? '',
    investment_amount:  investor?.investment_amount ?? '',
    investment_date:    investor?.investment_date ?? '',
    equity_percentage:  investor?.equity_percentage ?? '',
    status:             investor?.status ?? 'active',
    notes:              investor?.notes ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name || !form.investment_amount) { setError('Nama dan Investment Amount wajib diisi.'); return; }
    setSaving(true);
    setError('');
    try {
      if (isNew) {
        await createInvestor(form);
      } else {
        await updateInvestor(investor.id, form);
      }
      onSaved();
    } catch (e) {
      setError(e?.response?.data?.message ?? 'Gagal menyimpan investor.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="glass rounded-2xl border border-black/8 dark:border-white/10 shadow-glass-light dark:shadow-glass w-full max-w-md max-h-[90vh] overflow-y-auto flex flex-col gap-5 p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-slate-900 dark:text-white font-semibold">
            {isNew ? 'Tambah Investor' : 'Edit Investor'}
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
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nama *</label>
            <Input type="text" value={form.name} placeholder="Budi Santoso" onChange={e => set('name', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email</label>
              <Input type="email" value={form.email} placeholder="investor@email.com" onChange={e => set('email', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Perusahaan</label>
              <Input type="text" value={form.company} placeholder="PT Maju Jaya" onChange={e => set('company', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Investment ($) *</label>
              <Input type="number" step="0.01" min="0" value={form.investment_amount} placeholder="10000" onChange={e => set('investment_amount', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Equity (%)</label>
              <Input type="number" step="0.01" min="0" max="100" value={form.equity_percentage} placeholder="5.00" onChange={e => set('equity_percentage', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tanggal Investasi</label>
              <Input type="date" value={form.investment_date} onChange={e => set('investment_date', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</label>
              <Sel value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="exited">Exited</option>
              </Sel>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Notes</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="Catatan tentang investor ini..."
              className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-500/50 resize-none transition-colors"
            />
          </div>
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

// ─── Delete Confirm ───────────────────────────────────────────────────────────
function DeleteConfirm({ investor, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false);

  const handle = async () => {
    setDeleting(true);
    try { await deleteInvestor(investor.id); onDeleted(); }
    catch { setDeleting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="glass rounded-2xl border border-black/8 dark:border-white/10 shadow-glass-light dark:shadow-glass w-full max-w-sm p-6 flex flex-col gap-4">
        <h3 className="text-slate-900 dark:text-white font-semibold">Hapus Investor?</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Data investor <strong className="text-slate-700 dark:text-slate-200">{investor.name}</strong> akan dihapus permanen.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
            Batal
          </button>
          <button onClick={handle} disabled={deleting} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors disabled:opacity-50">
            {deleting ? 'Menghapus…' : 'Hapus'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Investors() {
  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [isMock,    setIsMock]    = useState(false);
  const [editInv,   setEditInv]   = useState(null);
  const [deleteInv, setDeleteInv] = useState(null);
  const [showAdd,   setShowAdd]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await getInvestors();
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

  const investors = data?.investors ?? [];
  const summary   = data?.summary   ?? {};

  const roi = summary.total_invested > 0
    ? ((summary.net_profit / summary.total_invested) * 100).toFixed(1)
    : 0;

  const kpis = [
    { label: 'Total Investasi',  value: `$${Number(summary.total_invested ?? 0).toLocaleString()}`, icon: DollarSign, color: 'text-indigo-600 dark:text-indigo-400',  bg: 'bg-indigo-100 dark:bg-indigo-500/15' },
    { label: 'Investor Aktif',   value: summary.active_count ?? 0,                                  icon: Users,      color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-500/15' },
    { label: 'Total Equity',     value: `${Number(summary.total_equity_pct ?? 0).toFixed(1)}%`,     icon: Percent,    color: 'text-violet-600 dark:text-violet-400',   bg: 'bg-violet-100 dark:bg-violet-500/15' },
    { label: 'ROI (Estimasi)',   value: `${roi}%`,                                                  icon: TrendingUp, color: roi >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400', bg: roi >= 0 ? 'bg-emerald-100 dark:bg-emerald-500/15' : 'bg-rose-100 dark:bg-rose-500/15' },
  ];

  return (
    <div className="p-6 lg:p-8 min-h-screen">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Users className="text-indigo-500 dark:text-indigo-400" size={22} />
            Investors
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Kelola data investor dan pantau kinerja portofolio</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 glass border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs transition-all hover:bg-slate-50 dark:hover:bg-white/5">
            <RefreshCw size={12} /> Reload
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors shadow-lg shadow-indigo-500/20"
          >
            <Plus size={13} /> Tambah Investor
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {kpis.map(k => (
          <div key={k.label} className="glass rounded-2xl border border-black/8 dark:border-white/5 p-5 shadow-glass-light dark:shadow-glass flex items-center gap-4">
            <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', k.bg)}>
              <k.icon size={18} className={k.color} />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 uppercase tracking-wide">{k.label}</p>
              <p className={clsx('text-xl font-bold mt-0.5', k.color)}>{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      {isMock && (
        <div className="mb-4 flex items-center gap-2 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl px-4 py-2.5 text-xs">
          Demo data — jalankan backend untuk melihat data real
        </div>
      )}

      {/* Investor Table */}
      <div className="glass rounded-2xl border border-black/8 dark:border-white/5 shadow-glass-light dark:shadow-glass overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-slate-200 dark:bg-slate-800/50 animate-pulse" />)}
          </div>
        ) : (
          <>
            {/* Table header */}
            <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-6 py-3 border-b border-black/6 dark:border-white/5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <span>Investor</span>
              <span className="text-right">Investment</span>
              <span className="text-right">Equity</span>
              <span>Tgl Masuk</span>
              <span>Status</span>
              <span>Aksi</span>
            </div>

            {investors.length === 0 ? (
              <div className="py-16 text-center">
                <Users size={32} className="mx-auto text-slate-300 dark:text-slate-700 mb-3" />
                <p className="text-slate-400 text-sm">Belum ada investor. Tambah investor pertama!</p>
              </div>
            ) : (
              investors.map((inv, i) => (
                <div
                  key={inv.id}
                  className={clsx(
                    'grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-6 py-4 items-center transition-colors',
                    'hover:bg-slate-50 dark:hover:bg-white/[0.02]',
                    i > 0 && 'border-t border-black/4 dark:border-white/[0.03]'
                  )}
                >
                  {/* Name + company + email */}
                  <div className="min-w-0">
                    <p className="text-slate-900 dark:text-white font-semibold text-sm">{inv.name}</p>
                    {inv.company && <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">{inv.company}</p>}
                    {inv.email   && <p className="text-slate-400 dark:text-slate-500 text-[11px]">{inv.email}</p>}
                    {inv.notes   && <p className="text-slate-400 dark:text-slate-500 text-[11px] italic mt-0.5 truncate max-w-xs">{inv.notes}</p>}
                  </div>

                  {/* Investment */}
                  <div className="text-right">
                    <p className="text-slate-900 dark:text-white font-semibold text-sm">
                      ${Number(inv.investment_amount).toLocaleString()}
                    </p>
                    <p className="text-slate-400 text-[11px]">invested</p>
                  </div>

                  {/* Equity */}
                  <div className="text-right">
                    <p className="text-violet-600 dark:text-violet-400 font-semibold text-sm">
                      {Number(inv.equity_percentage ?? 0).toFixed(1)}%
                    </p>
                    <p className="text-slate-400 text-[11px]">equity</p>
                  </div>

                  {/* Date */}
                  <span className="text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">
                    {inv.investment_date
                      ? new Date(inv.investment_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
                      : '—'
                    }
                  </span>

                  {/* Status */}
                  <span className={clsx('text-[11px] px-2.5 py-1 rounded-full border font-medium', STATUS_STYLE[inv.status] ?? STATUS_STYLE.pending)}>
                    {inv.status === 'active' ? 'Active' : inv.status === 'exited' ? 'Exited' : 'Pending'}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setEditInv(inv)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => setDeleteInv(inv)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}

            {/* Footer summary */}
            {investors.length > 0 && (
              <div className="flex items-center justify-between px-6 py-3 border-t border-black/6 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01]">
                <span className="text-xs text-slate-500">{investors.length} investor terdaftar</span>
                <span className="text-xs text-slate-500">
                  Total investasi: <strong className="text-slate-700 dark:text-slate-300">${Number(summary.total_invested ?? 0).toLocaleString()}</strong>
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Investor note */}
      <div className="mt-6 glass rounded-2xl border border-indigo-300 dark:border-indigo-500/20 px-6 py-5">
        <div className="flex items-center gap-2 mb-2">
          <Activity size={14} className="text-indigo-500 dark:text-indigo-400" />
          <p className="text-indigo-600 dark:text-indigo-300 font-semibold text-sm">Cara Membaca Dashboard Investor</p>
        </div>
        <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
          <li>→ <strong className="text-slate-700 dark:text-slate-300">Total Investasi</strong> = jumlah semua modal yang sudah masuk dari investor aktif</li>
          <li>→ <strong className="text-slate-700 dark:text-slate-300">Total Equity</strong> = persentase kepemilikan yang sudah diberikan ke investor</li>
          <li>→ <strong className="text-slate-700 dark:text-slate-300">ROI Estimasi</strong> = Net Profit ÷ Total Investasi × 100%</li>
          <li>→ Status <strong className="text-emerald-600 dark:text-emerald-400">Active</strong> = investor masih aktif, <strong className="text-amber-600 dark:text-amber-400">Pending</strong> = proses legal, <strong className="text-slate-500">Exited</strong> = sudah exit</li>
        </ul>
      </div>

      {/* Modals */}
      {(showAdd || editInv) && (
        <InvestorModal
          investor={editInv}
          onClose={() => { setShowAdd(false); setEditInv(null); }}
          onSaved={() => { setShowAdd(false); setEditInv(null); load(); }}
        />
      )}
      {deleteInv && (
        <DeleteConfirm
          investor={deleteInv}
          onClose={() => setDeleteInv(null)}
          onDeleted={() => { setDeleteInv(null); load(); }}
        />
      )}
    </div>
  );
}
