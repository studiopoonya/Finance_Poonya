import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, RefreshCw, ChevronLeft, ChevronRight,
  TrendingUp, TrendingDown, Pencil, Trash2, X, Save,
  Filter, Plus, ArrowUpCircle, ArrowDownCircle, Wallet,
  Tag, CreditCard, Building2, User, Calendar, Hash,
  CheckCircle2, AlertCircle,
} from 'lucide-react';
import clsx from 'clsx';
import { getTransactions, updateTransaction, deleteTransaction, createTransaction, getBankAccounts } from '../../lib/api';

// ── Kategori detail per bisnis photobooth ──────────────────────────────────────
const CATEGORIES = {
  revenue: [
    'Wedding', 'Corporate Event', 'Birthday Party', 'Social Event',
    'Photo Booth Rental', 'Endorsement', 'Komisi', 'Lain-lain',
  ],
  expense: [
    'Gaji & Honor', 'Marketing & Iklan', 'Equipment & Perlengkapan',
    'Sewa Tempat', 'Transportasi', 'Konsumsi', 'Charity',
    'Subscription & Software', 'Maintenance & Perawatan',
    'Training & Edukasi', 'Tabungan', 'Dana Darurat',
    'Investasi', 'Endorsement', 'Nabung Ruko', 'Lain-lain',
  ],
};

const PAYMENT_METHODS = [
  { value: 'transfer',  label: 'Transfer Bank' },
  { value: 'cash',      label: 'Cash / Tunai'  },
  { value: 'qris',      label: 'QRIS'           },
  { value: 'debit',     label: 'Kartu Debit'    },
  { value: 'credit',    label: 'Kartu Kredit'   },
];

const EVENT_TYPES = [
  { value: 'wedding',   label: 'Wedding'         },
  { value: 'corporate', label: 'Corporate Event'  },
  { value: 'birthday',  label: 'Birthday Party'   },
  { value: 'social',    label: 'Social Event'     },
  { value: 'other',     label: 'Lainnya'          },
];

const TYPE_COLOR = {
  revenue: { badge: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700/50', amount: 'text-emerald-600 dark:text-emerald-400', row: 'border-l-2 border-l-emerald-400' },
  expense: { badge: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-700/50', amount: 'text-red-600 dark:text-red-400', row: 'border-l-2 border-l-red-400' },
};

const fmt = n => 'Rp ' + new Intl.NumberFormat('id-ID').format(Math.round(parseFloat(n) || 0));
const fmtDate = d => d ? new Date(d + 'T00:00:00').toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
const MONTHS_SHORT = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const MONTHS_FULL  = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

// ── Shared input components ────────────────────────────────────────────────────
const inputCls = 'w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-violet-400 dark:focus:border-violet-500 transition-colors';
const labelCls = 'block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5';

function Field({ label, children }) {
  return <div><label className={labelCls}>{label}</label>{children}</div>;
}

// ── Mock data ──────────────────────────────────────────────────────────────────
const MOCK = {
  summary: { total_revenue: 45000000, total_expense: 28000000, net: 17000000, count_revenue: 8, count_expense: 15 },
  breakdown: [
    { type: 'revenue', category: 'Wedding',          count: 4, total: 28000000 },
    { type: 'revenue', category: 'Corporate Event',  count: 3, total: 15000000 },
    { type: 'revenue', category: 'Birthday Party',   count: 1, total: 2000000  },
    { type: 'expense', category: 'Gaji & Honor',     count: 5, total: 12000000 },
    { type: 'expense', category: 'Marketing & Iklan',count: 3, total: 5000000  },
    { type: 'expense', category: 'Equipment & Perlengkapan', count: 2, total: 4500000 },
    { type: 'expense', category: 'Subscription & Software',  count: 3, total: 3000000 },
    { type: 'expense', category: 'Transportasi',     count: 2, total: 2500000  },
    { type: 'expense', category: 'Konsumsi',         count: 2, total: 1000000  },
  ],
  transactions: {
    data: [
      { id: 1, transaction_date: '2026-05-24', merchant: 'Wedding Budi & Sari',    amount: 12000000, type: 'revenue', category: 'Wedding',         payment_method: 'transfer', client_name: 'Budi Santoso', event_type: 'wedding',   event_date: '2026-05-24', reference_number: 'INV-202605-0001', notes: 'Paket premium 8 jam', ai_verified: true,  bank_account: { account_name: 'Marketing', bank_name: 'saqu' } },
      { id: 2, transaction_date: '2026-05-22', merchant: 'Gaji Staff Mei',         amount: 8000000,  type: 'expense', category: 'Gaji & Honor',     payment_method: 'transfer', client_name: null, event_type: null, event_date: null, reference_number: null, notes: '4 orang staff', ai_verified: false, bank_account: { account_name: 'Marketing', bank_name: 'saqu' } },
      { id: 3, transaction_date: '2026-05-20', merchant: 'Meta Ads Campaign',      amount: 2500000,  type: 'expense', category: 'Marketing & Iklan',payment_method: 'credit',   client_name: null, event_type: null, reference_number: null, notes: 'Iklan wedding season', ai_verified: false, bank_account: null },
      { id: 4, transaction_date: '2026-05-18', merchant: 'Corporate PT Maju Jaya', amount: 8000000,  type: 'revenue', category: 'Corporate Event',  payment_method: 'transfer', client_name: 'PT Maju Jaya', event_type: 'corporate', event_date: '2026-05-18', reference_number: 'INV-202605-0002', notes: null, ai_verified: true, bank_account: { account_name: 'Subscription', bank_name: 'saqu' } },
      { id: 5, transaction_date: '2026-05-15', merchant: 'Adobe Creative Cloud',   amount: 780000,   type: 'expense', category: 'Subscription & Software', payment_method: 'credit', reference_number: null, notes: null, ai_verified: false, bank_account: null },
      { id: 6, transaction_date: '2026-05-14', merchant: 'Birthday Rina',          amount: 3500000,  type: 'revenue', category: 'Birthday Party',   payment_method: 'qris',     client_name: 'Rina Kusuma', event_type: 'birthday', event_date: '2026-05-14', reference_number: 'INV-202605-0003', notes: null, ai_verified: true, bank_account: { account_name: 'Dana Darurat', bank_name: 'saqu' } },
      { id: 7, transaction_date: '2026-05-12', merchant: 'Bensin & Parkir',        amount: 450000,   type: 'expense', category: 'Transportasi',     payment_method: 'cash',     reference_number: null, notes: 'Liputan 3 event', ai_verified: false, bank_account: null },
      { id: 8, transaction_date: '2026-05-10', merchant: 'Charity Orphanage',      amount: 500000,   type: 'expense', category: 'Charity',          payment_method: 'transfer', reference_number: null, notes: null, ai_verified: false, bank_account: { account_name: 'Charity', bank_name: 'saqu' } },
    ],
    current_page: 1, last_page: 1, total: 8,
  },
};

// ── Transaction Form Modal ────────────────────────────────────────────────────
function TransactionModal({ tx, onClose, onSaved, bankAccounts }) {
  const isNew = !tx;
  const [type, setType] = useState(tx?.type ?? 'revenue');
  const [form, setForm] = useState({
    transaction_date: tx?.transaction_date ?? new Date().toISOString().slice(0, 10),
    merchant:         tx?.merchant         ?? '',
    amount:           tx?.amount           ?? '',
    category:         tx?.category         ?? '',
    sub_category:     tx?.sub_category     ?? '',
    payment_method:   tx?.payment_method   ?? 'transfer',
    bank_account_id:  tx?.bank_account_id  ?? '',
    client_name:      tx?.client_name      ?? '',
    event_type:       tx?.event_type       ?? '',
    event_date:       tx?.event_date       ?? '',
    reference_number: tx?.reference_number ?? '',
    notes:            tx?.notes            ?? '',
    ai_verified:      tx?.ai_verified      ?? false,
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleTypeChange = t => {
    setType(t);
    setForm(f => ({ ...f, category: '' }));
  };

  const handleSave = async () => {
    if (!form.merchant.trim()) { setError('Keterangan/Nama wajib diisi.'); return; }
    if (!form.amount || parseFloat(form.amount) <= 0) { setError('Nominal wajib diisi dan lebih dari 0.'); return; }
    setSaving(true); setError('');
    try {
      const payload = { ...form, type, amount: parseFloat(form.amount), bank_account_id: form.bank_account_id || null };
      if (isNew) await createTransaction(payload);
      else       await updateTransaction(tx.id, payload);
      onSaved();
    } catch (e) {
      setError(e?.response?.data?.message ?? 'Gagal menyimpan.');
    } finally {
      setSaving(false);
    }
  };

  const bankGrouped = bankAccounts.reduce((acc, b) => {
    const key = b.bank_name;
    if (!acc[key]) acc[key] = [];
    acc[key].push(b);
    return acc;
  }, {});
  const BANK_LABELS = { line_bank: 'LINE BANK', saqu: 'SAQU' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="glass rounded-2xl border border-black/8 dark:border-white/10 shadow-2xl w-full max-w-lg my-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700/50">
          <h3 className="font-semibold text-slate-900 dark:text-white text-base">
            {isNew ? 'Tambah Transaksi' : 'Edit Transaksi'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={18} /></button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 rounded-xl px-4 py-2.5 text-sm">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          {/* Type toggle */}
          <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-600">
            <button onClick={() => handleTypeChange('revenue')}
              className={clsx('flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-all', type === 'revenue'
                ? 'bg-emerald-500 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700')}>
              <ArrowUpCircle size={15} /> Pemasukan
            </button>
            <button onClick={() => handleTypeChange('expense')}
              className={clsx('flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-all', type === 'expense'
                ? 'bg-red-500 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700')}>
              <ArrowDownCircle size={15} /> Pengeluaran
            </button>
          </div>

          {/* Date + Amount */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tanggal">
              <input type="date" value={form.transaction_date} onChange={e => set('transaction_date', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Nominal (Rp)">
              <input type="number" value={form.amount} onChange={e => set('amount', e.target.value)} min="0" placeholder="0" className={inputCls} />
            </Field>
          </div>

          {/* Keterangan */}
          <Field label={type === 'revenue' ? 'Nama Event / Keterangan' : 'Nama Pengeluaran / Vendor'}>
            <input type="text" value={form.merchant} onChange={e => set('merchant', e.target.value)}
              placeholder={type === 'revenue' ? 'Contoh: Wedding Budi & Sari' : 'Contoh: Gaji Staff Mei'}
              className={inputCls} />
          </Field>

          {/* Category */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Kategori">
              <select value={form.category} onChange={e => set('category', e.target.value)} className={inputCls}>
                <option value="">— Pilih —</option>
                {CATEGORIES[type].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Metode Bayar">
              <select value={form.payment_method} onChange={e => set('payment_method', e.target.value)} className={inputCls}>
                {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </Field>
          </div>

          {/* Bank Account */}
          <Field label="Rekening Bank">
            <select value={form.bank_account_id} onChange={e => set('bank_account_id', e.target.value)} className={inputCls}>
              <option value="">— Tidak ditentukan —</option>
              {Object.entries(bankGrouped).map(([bank, accs]) => (
                <optgroup key={bank} label={BANK_LABELS[bank] || bank}>
                  {accs.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.account_name}{a.account_number ? ` (${a.account_number})` : ''}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </Field>

          {/* Revenue-specific fields */}
          {type === 'revenue' && (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/50 rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Detail Pemasukan</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nama Klien">
                  <input type="text" value={form.client_name} onChange={e => set('client_name', e.target.value)}
                    placeholder="Nama klien" className={inputCls} />
                </Field>
                <Field label="Tipe Event">
                  <select value={form.event_type} onChange={e => set('event_type', e.target.value)} className={inputCls}>
                    <option value="">— Pilih —</option>
                    {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Tanggal Event">
                <input type="date" value={form.event_date} onChange={e => set('event_date', e.target.value)} className={inputCls} />
              </Field>
            </div>
          )}

          {/* Reference + Notes */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="No. Referensi / Invoice">
              <input type="text" value={form.reference_number} onChange={e => set('reference_number', e.target.value)}
                placeholder="INV-2026-001" className={inputCls} />
            </Field>
            <Field label="Sub-Kategori">
              <input type="text" value={form.sub_category} onChange={e => set('sub_category', e.target.value)}
                placeholder="Lebih spesifik..." className={inputCls} />
            </Field>
          </div>

          <Field label="Catatan">
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} placeholder="Catatan tambahan..."
              className={clsx(inputCls, 'resize-none')} />
          </Field>

          {/* Verified toggle */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <div onClick={() => set('ai_verified', !form.ai_verified)}
              className={clsx('w-10 h-5 rounded-full transition-colors relative', form.ai_verified ? 'bg-violet-500' : 'bg-slate-200 dark:bg-slate-700')}>
              <div className={clsx('w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all shadow', form.ai_verified ? 'left-5' : 'left-0.5')} />
            </div>
            <span className="text-sm text-slate-600 dark:text-slate-300">Sudah diverifikasi</span>
          </label>
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
            Batal
          </button>
          <button onClick={handleSave} disabled={saving}
            className={clsx('flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-colors disabled:opacity-50',
              type === 'revenue' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700')}>
            {saving ? <><RefreshCw size={14} className="animate-spin" /> Menyimpan...</> : <><Save size={14} /> Simpan</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Category Breakdown Panel ──────────────────────────────────────────────────
function BreakdownPanel({ breakdown, totalRevenue, totalExpense }) {
  const revItems = breakdown.filter(b => b.type === 'revenue');
  const expItems = breakdown.filter(b => b.type === 'expense');

  const Bar = ({ total, max, color }) => (
    <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
      <div className={clsx('h-full rounded-full', color)} style={{ width: `${max > 0 ? Math.round(total / max * 100) : 0}%` }} />
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="glass rounded-2xl p-4">
        <h3 className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-3">Sumber Pemasukan</h3>
        <div className="space-y-2">
          {revItems.length === 0 ? <p className="text-xs text-slate-400">Tidak ada data</p> : revItems.map(r => (
            <div key={r.category} className="flex items-center gap-2">
              <span className="flex-1 text-xs text-slate-600 dark:text-slate-300 truncate">{r.category}</span>
              <Bar total={r.total} max={totalRevenue} color="bg-emerald-400" />
              <span className="text-xs font-mono text-slate-500 w-24 text-right">{fmt(r.total)}</span>
              <span className="text-xs text-slate-400 w-6 text-right">{r.count}x</span>
            </div>
          ))}
          <div className="pt-1 border-t border-slate-100 dark:border-slate-700/50 flex justify-between text-xs font-bold">
            <span className="text-emerald-600 dark:text-emerald-400">Total</span>
            <span className="text-emerald-600 dark:text-emerald-400">{fmt(totalRevenue)}</span>
          </div>
        </div>
      </div>
      <div className="glass rounded-2xl p-4">
        <h3 className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider mb-3">Rincian Pengeluaran</h3>
        <div className="space-y-2">
          {expItems.length === 0 ? <p className="text-xs text-slate-400">Tidak ada data</p> : expItems.map(r => (
            <div key={r.category} className="flex items-center gap-2">
              <span className="flex-1 text-xs text-slate-600 dark:text-slate-300 truncate">{r.category}</span>
              <Bar total={r.total} max={totalExpense} color="bg-red-400" />
              <span className="text-xs font-mono text-slate-500 w-24 text-right">{fmt(r.total)}</span>
              <span className="text-xs text-slate-400 w-6 text-right">{r.count}x</span>
            </div>
          ))}
          <div className="pt-1 border-t border-slate-100 dark:border-slate-700/50 flex justify-between text-xs font-bold">
            <span className="text-red-600 dark:text-red-400">Total</span>
            <span className="text-red-600 dark:text-red-400">{fmt(totalExpense)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Ledger() {
  const [data,          setData]       = useState(null);
  const [bankAccounts,  setBanks]      = useState([]);
  const [loading,       setLoading]    = useState(true);
  const [isMock,        setIsMock]     = useState(false);
  const [page,          setPage]       = useState(1);
  const [showBreakdown, setBreakdown]  = useState(true);

  // Filters
  const [search,   setSearch]   = useState('');
  const [typeF,    setTypeF]    = useState('');
  const [catF,     setCatF]     = useState('');
  const [monthF,   setMonthF]   = useState(String(new Date().getMonth() + 1));
  const [yearF,    setYearF]    = useState(String(new Date().getFullYear()));
  const [payF,     setPayF]     = useState('');

  // Modal state
  const [modal,    setModal]    = useState(null); // null | 'new' | tx-object
  const [deleteTx, setDeleteTx] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, per_page: 20 };
      if (typeF)   params.type   = typeF;
      if (catF)    params.category = catF;
      if (monthF)  params.month  = monthF;
      if (yearF)   params.year   = yearF;
      if (payF)    params.payment_method = payF;
      if (search)  params.search = search;
      const d = await getTransactions(params);
      setData(d);
      setIsMock(false);
    } catch {
      setData(MOCK);
      setIsMock(true);
    } finally {
      setLoading(false);
    }
  }, [page, typeF, catF, monthF, yearF, payF, search]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    getBankAccounts().then(r => setBanks(r.accounts || [])).catch(() => setBanks([]));
  }, []);

  const handleDelete = async () => {
    if (!deleteTx) return;
    setDeleting(true);
    try { await deleteTransaction(deleteTx.id); setDeleteTx(null); load(); }
    catch { /* ignore */ }
    finally { setDeleting(false); }
  };

  const resetFilters = () => { setTypeF(''); setCatF(''); setPayF(''); setSearch(''); setPage(1); };

  const txList   = data?.transactions?.data ?? [];
  const summary  = data?.summary  ?? {};
  const breakdown = data?.breakdown ?? [];
  const hasFilter = typeF || catF || payF || search;
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  const PM_LABEL = { transfer: 'Transfer', cash: 'Cash', qris: 'QRIS', debit: 'Debit', credit: 'Kredit' };
  const ET_LABEL = { wedding: 'Wedding', corporate: 'Corporate', birthday: 'Birthday', social: 'Social', other: 'Lainnya' };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Pencatatan Keuangan</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Pemasukan & Pengeluaran — {MONTHS_FULL[parseInt(monthF)] || 'Semua'} {yearF}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
            <RefreshCw size={15} />
          </button>
          <button onClick={() => setModal('new')}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition-colors">
            <Plus size={15} /> Tambah Transaksi
          </button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Pemasukan', value: fmt(summary.total_revenue), sub: `${summary.count_revenue ?? 0} transaksi`, icon: ArrowUpCircle,   color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/40' },
          { label: 'Total Pengeluaran', value: fmt(summary.total_expense), sub: `${summary.count_expense ?? 0} transaksi`, icon: ArrowDownCircle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/40' },
          { label: 'Selisih (Net)', value: fmt(summary.net), sub: summary.net >= 0 ? 'Surplus' : 'Defisit', icon: Wallet, color: summary.net >= 0 ? 'text-violet-600 dark:text-violet-400' : 'text-red-600 dark:text-red-400', bg: 'bg-violet-100 dark:bg-violet-900/40' },
          { label: 'Total Transaksi', value: (data?.transactions?.total ?? txList.length), sub: 'transaksi tercatat', icon: Tag, color: 'text-slate-600 dark:text-slate-300', bg: 'bg-slate-100 dark:bg-slate-700' },
        ].map(k => (
          <div key={k.label} className="glass rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className={clsx('p-2 rounded-xl flex-shrink-0', k.bg, k.color)}><k.icon size={18} /></div>
              <div className="min-w-0">
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{k.label}</p>
                <p className={clsx('text-lg font-bold leading-tight', k.color)}>{k.value}</p>
                <p className="text-xs text-slate-400">{k.sub}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Breakdown toggle */}
      <button onClick={() => setBreakdown(v => !v)}
        className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium transition-colors">
        <Tag size={13} />
        {showBreakdown ? 'Sembunyikan' : 'Tampilkan'} Rincian per Kategori
      </button>

      {showBreakdown && <BreakdownPanel breakdown={breakdown} totalRevenue={summary.total_revenue ?? 0} totalExpense={summary.total_expense ?? 0} />}

      {/* Filters */}
      <div className="glass rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          <Filter size={13} /> Filter Transaksi
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {/* Period */}
          <select value={monthF} onChange={e => { setMonthF(e.target.value); setPage(1); }}
            className="text-sm border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200">
            <option value="">Semua Bulan</option>
            {MONTHS_SHORT.slice(1).map((m, i) => <option key={i+1} value={String(i+1)}>{m}</option>)}
          </select>
          <select value={yearF} onChange={e => { setYearF(e.target.value); setPage(1); }}
            className="text-sm border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200">
            {years.map(y => <option key={y} value={String(y)}>{y}</option>)}
          </select>

          {/* Type */}
          <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-600">
            {['', 'revenue', 'expense'].map(t => (
              <button key={t} onClick={() => { setTypeF(t); setPage(1); }}
                className={clsx('px-3 py-2 text-xs font-medium transition-all', typeF === t
                  ? t === 'revenue' ? 'bg-emerald-500 text-white' : t === 'expense' ? 'bg-red-500 text-white' : 'bg-violet-600 text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700')}>
                {t === '' ? 'Semua' : t === 'revenue' ? 'Pemasukan' : 'Pengeluaran'}
              </button>
            ))}
          </div>

          {/* Category */}
          <select value={catF} onChange={e => { setCatF(e.target.value); setPage(1); }}
            className="text-sm border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200">
            <option value="">Semua Kategori</option>
            {[...CATEGORIES.revenue, ...CATEGORIES.expense].filter((v, i, a) => a.indexOf(v) === i).map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Payment method */}
          <select value={payF} onChange={e => { setPayF(e.target.value); setPage(1); }}
            className="text-sm border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200">
            <option value="">Semua Metode</option>
            {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>

          {/* Search */}
          <div className="relative flex-1 min-w-40">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Cari nama, klien, referensi..."
              className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200" />
          </div>

          {hasFilter && (
            <button onClick={resetFilters} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600">
              <X size={12} /> Reset
            </button>
          )}
        </div>
      </div>

      {isMock && (
        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-xl px-4 py-2.5 text-xs">
          <AlertCircle size={13} /> Demo data — backend offline
        </div>
      )}

      {/* Transaction list */}
      <div className="glass rounded-2xl overflow-hidden">
        {/* Table header */}
        <div className="hidden md:grid md:grid-cols-[110px_1fr_140px_120px_140px_80px] gap-3 px-5 py-3 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/50">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tanggal</span>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Keterangan</span>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kategori</span>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Metode / Bank</span>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Nominal</span>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Aksi</span>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-slate-200 dark:bg-slate-800/50 animate-pulse" />)}
          </div>
        ) : txList.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Tag size={32} className="mx-auto mb-2 opacity-40" />
            <p>Tidak ada transaksi ditemukan.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700/30">
            {txList.map(tx => (
              <div key={tx.id}
                className={clsx('grid grid-cols-1 md:grid-cols-[110px_1fr_140px_120px_140px_80px] gap-3 px-5 py-4 items-start md:items-center hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors', TYPE_COLOR[tx.type]?.row)}>

                {/* Date */}
                <div className="flex items-center gap-2 md:block">
                  <Calendar size={12} className="text-slate-400 md:hidden flex-shrink-0" />
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{fmtDate(tx.transaction_date)}</span>
                </div>

                {/* Description */}
                <div className="min-w-0">
                  <div className="flex items-start gap-2 flex-wrap">
                    <p className="font-semibold text-slate-800 dark:text-white text-sm">{tx.merchant}</p>
                    {tx.ai_verified && <CheckCircle2 size={13} className="text-violet-500 mt-0.5 flex-shrink-0" title="Diverifikasi" />}
                    <span className={clsx('text-[10px] px-1.5 py-0.5 rounded-full border font-semibold', TYPE_COLOR[tx.type]?.badge)}>
                      {tx.type === 'revenue' ? 'MASUK' : 'KELUAR'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    {tx.client_name && <span className="text-xs text-slate-500 flex items-center gap-1"><User size={10} />{tx.client_name}</span>}
                    {tx.event_type  && <span className="text-xs text-violet-500">{ET_LABEL[tx.event_type] || tx.event_type}</span>}
                    {tx.reference_number && <span className="text-xs text-slate-400 flex items-center gap-1"><Hash size={10} />{tx.reference_number}</span>}
                    {tx.notes && <span className="text-xs text-slate-400 truncate max-w-xs">{tx.notes}</span>}
                  </div>
                </div>

                {/* Category */}
                <div>
                  <span className="text-xs px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 font-medium">
                    {tx.category || '—'}
                  </span>
                  {tx.sub_category && <p className="text-[10px] text-slate-400 mt-0.5 pl-1">{tx.sub_category}</p>}
                </div>

                {/* Payment / Bank */}
                <div className="space-y-1">
                  {tx.payment_method && (
                    <div className="flex items-center gap-1 text-xs text-slate-500"><CreditCard size={10} />{PM_LABEL[tx.payment_method] || tx.payment_method}</div>
                  )}
                  {tx.bank_account && (
                    <div className="flex items-center gap-1 text-xs text-slate-400"><Building2 size={10} />{tx.bank_account.account_name} <span className="text-[10px] uppercase opacity-60">({tx.bank_account.bank_name})</span></div>
                  )}
                </div>

                {/* Amount */}
                <div className="text-right">
                  <p className={clsx('font-bold text-base', TYPE_COLOR[tx.type]?.amount)}>
                    {tx.type === 'revenue' ? '+' : '-'}{fmt(tx.amount)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-1.5">
                  <button onClick={() => setModal(tx)} className="p-1.5 rounded-lg text-slate-400 hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => setDeleteTx(tx)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {data?.transactions?.last_page > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-slate-700/50">
            <span className="text-xs text-slate-500">Halaman {data.transactions.current_page} / {data.transactions.last_page} ({data.transactions.total} transaksi)</span>
            <div className="flex gap-1">
              <button disabled={page === 1} onClick={() => setPage(p => p-1)}
                className="p-1.5 rounded-lg text-slate-500 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
                <ChevronLeft size={15} />
              </button>
              <button disabled={page >= data.transactions.last_page} onClick={() => setPage(p => p+1)}
                className="p-1.5 rounded-lg text-slate-500 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {(modal === 'new' || (modal && typeof modal === 'object')) && (
        <TransactionModal
          tx={modal === 'new' ? null : modal}
          bankAccounts={bankAccounts}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}

      {deleteTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="glass rounded-2xl border border-black/8 dark:border-white/10 shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h3 className="font-semibold text-slate-900 dark:text-white">Hapus Transaksi?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              <strong className="text-slate-700 dark:text-slate-200">{deleteTx.merchant}</strong> — {fmt(deleteTx.amount)}<br />
              Data tidak bisa dikembalikan setelah dihapus.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTx(null)} className="flex-1 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700">Batal</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-700 text-white disabled:opacity-50">
                {deleting ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
