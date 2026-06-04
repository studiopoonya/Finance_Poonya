import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  PlusCircle, Trash2, TrendingUp, TrendingDown, Clock, AlertTriangle,
} from 'lucide-react';
import clsx from 'clsx';
import { getBudgets, createBudget, deleteBudget, getCashRunway } from '../../lib/api';

const MONTHS = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const SHORT_M = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

const CATEGORIES = {
  revenue: ['Wedding Photography', 'Corporate Event', 'Birthday Party', 'Social Event', 'Other Revenue'],
  expense: ['Equipment', 'Staff', 'Marketing', 'Operasional', 'Transport', 'Sewa', 'Utilities', 'Lainnya'],
};

const fmt = n => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n ?? 0);
const fmtShort = n => {
  if (!n) return 'Rp 0';
  if (Math.abs(n) >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}jt`;
  return `Rp ${(n / 1_000).toFixed(0)}rb`;
};

const EMPTY_FORM = { month: new Date().getMonth() + 1, year: new Date().getFullYear(), category: '', type: 'revenue', amount: '', notes: '' };

function RunwayCard({ runway }) {
  if (!runway) return null;
  const { cash_balance, avg_monthly_burn, runway_months } = runway;
  const level = runway_months === null ? 'gray' : runway_months >= 6 ? 'green' : runway_months >= 3 ? 'amber' : 'red';
  const colors = {
    green: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700/50',
    amber: 'bg-amber-50  dark:bg-amber-900/20  border-amber-200  dark:border-amber-700/50',
    red:   'bg-red-50    dark:bg-red-900/20    border-red-200    dark:border-red-700/50',
    gray:  'bg-slate-50  dark:bg-slate-800/50  border-slate-200  dark:border-slate-700',
  };
  return (
    <div className={clsx('rounded-2xl border p-5', colors[level])}>
      <div className="flex items-start gap-4">
        <div className={clsx('p-3 rounded-xl', level === 'green' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600' : level === 'amber' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600' : 'bg-red-100 dark:bg-red-900/40 text-red-600')}>
          <Clock size={22} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-slate-800 dark:text-white">Cash Runway</h3>
          <p className="text-3xl font-bold mt-1 text-slate-900 dark:text-white">
            {runway_months !== null ? `${runway_months} bulan` : '∞'}
          </p>
          <div className="flex gap-6 mt-2 text-sm text-slate-500 dark:text-slate-400">
            <span>Kas: <strong className="text-slate-700 dark:text-slate-200">{fmtShort(cash_balance)}</strong></span>
            <span>Burn/bln: <strong className="text-slate-700 dark:text-slate-200">{fmtShort(avg_monthly_burn)}</strong></span>
          </div>
        </div>
        {level === 'red' && <AlertTriangle size={20} className="text-red-500 mt-1" />}
        {level === 'amber' && <AlertTriangle size={20} className="text-amber-500 mt-1" />}
      </div>
    </div>
  );
}

function BudgetModal({ onClose, onSave }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.category || !form.amount) { setError('Kategori dan anggaran wajib diisi.'); return; }
    setSaving(true);
    try {
      await createBudget({ ...form, amount: parseFloat(form.amount) });
      onSave();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan.');
    } finally {
      setSaving(false);
    }
  };

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="glass rounded-2xl w-full max-w-md shadow-2xl">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Tambah Budget</h2>
          {error && <p className="mb-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Bulan</label>
                <select value={form.month} onChange={e => set('month', e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                  {MONTHS.slice(1).map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Tahun</label>
                <select value={form.year} onChange={e => set('year', e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Tipe</label>
              <div className="flex gap-2">
                {['revenue', 'expense'].map(t => (
                  <button type="button" key={t} onClick={() => { set('type', t); set('category', ''); }}
                    className={clsx('flex-1 py-2 rounded-lg text-sm font-medium transition-all border', form.type === t
                      ? t === 'revenue' ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-red-500 border-red-500 text-white'
                      : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400')}>
                    {t === 'revenue' ? 'Pendapatan' : 'Pengeluaran'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Kategori</label>
              <select value={form.category} onChange={e => set('category', e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                <option value="">Pilih kategori...</option>
                {CATEGORIES[form.type].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Anggaran (Rp)</label>
              <input type="number" value={form.amount} onChange={e => set('amount', e.target.value)} min="0" placeholder="0"
                className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Catatan</label>
              <input type="text" value={form.notes} onChange={e => set('notes', e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200" />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose}
                className="flex-1 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-xl py-2 text-sm font-medium">
                Batal
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 bg-violet-600 hover:bg-violet-700 text-white rounded-xl py-2 text-sm font-semibold disabled:opacity-50">
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function Budget() {
  const [budgets,  setBudgets]  = useState([]);
  const [runway,   setRunway]   = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [year,  setYear]  = useState(new Date().getFullYear());
  const [month, setMonth] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const MOCK_BUDGETS = [
    { id: 1, month: 5, year: 2025, category: 'Wedding Photography', type: 'revenue', amount: 50000000, actual: 55000000, variance: 5000000, variance_pct: 10 },
    { id: 2, month: 5, year: 2025, category: 'Corporate Event',     type: 'revenue', amount: 30000000, actual: 25000000, variance: -5000000, variance_pct: -16.7 },
    { id: 3, month: 5, year: 2025, category: 'Staff',               type: 'expense', amount: 20000000, actual: 18000000, variance: 2000000, variance_pct: 10 },
    { id: 4, month: 5, year: 2025, category: 'Marketing',           type: 'expense', amount: 8000000,  actual: 9500000,  variance: -1500000, variance_pct: -18.75 },
    { id: 5, month: 5, year: 2025, category: 'Equipment',           type: 'expense', amount: 5000000,  actual: 4000000,  variance: 1000000, variance_pct: 20 },
  ];
  const MOCK_RUNWAY = { cash_balance: 33000000, avg_monthly_burn: 9000000, runway_months: 3.7 };

  const load = () => {
    setLoading(true);
    Promise.all([
      getBudgets({ year, month }).catch(() => ({ data: MOCK_BUDGETS })),
      getCashRunway().catch(() => MOCK_RUNWAY),
    ]).then(([bRes, rRes]) => {
      setBudgets(bRes.data || MOCK_BUDGETS);
      setRunway(rRes);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [year, month]);

  const handleDelete = async id => {
    if (!window.confirm('Hapus budget ini?')) return;
    try { await deleteBudget(id); load(); } catch { /* ignore */ }
  };

  const filtered = typeFilter === 'all' ? budgets : budgets.filter(b => b.type === typeFilter);

  const totalBudgetRev  = budgets.filter(b => b.type === 'revenue').reduce((s, b) => s + parseFloat(b.amount || 0), 0);
  const totalActualRev  = budgets.filter(b => b.type === 'revenue').reduce((s, b) => s + (b.actual || 0), 0);
  const totalBudgetExp  = budgets.filter(b => b.type === 'expense').reduce((s, b) => s + parseFloat(b.amount || 0), 0);
  const totalActualExp  = budgets.filter(b => b.type === 'expense').reduce((s, b) => s + (b.actual || 0), 0);

  const chartData = budgets.map(b => ({
    name: b.category.split(' ')[0],
    Budget: parseFloat(b.amount || 0),
    Aktual: b.actual || 0,
    fill: b.type === 'revenue' ? '#10b981' : '#ef4444',
  }));

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Budget & Cash Runway</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Anggaran vs Realisasi</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select value={year} onChange={e => setYear(parseInt(e.target.value))}
            className="text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200">
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={month} onChange={e => setMonth(e.target.value)}
            className="text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200">
            <option value="">Semua Bulan</option>
            {MONTHS.slice(1).map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
          </select>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition-colors">
            <PlusCircle size={16} />
            Tambah Budget
          </button>
        </div>
      </div>

      {/* Cash Runway */}
      <RunwayCard runway={runway} />

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Budget Pendapatan', value: fmt(totalBudgetRev), icon: TrendingUp, color: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600' },
          { label: 'Aktual Pendapatan', value: fmt(totalActualRev), icon: TrendingUp, color: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600' },
          { label: 'Budget Pengeluaran', value: fmt(totalBudgetExp), icon: TrendingDown, color: 'bg-red-100 dark:bg-red-900/40 text-red-600' },
          { label: 'Aktual Pengeluaran', value: fmt(totalActualExp), icon: TrendingDown, color: 'bg-red-100 dark:bg-red-900/40 text-red-600' },
        ].map(k => (
          <div key={k.label} className="glass rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className={clsx('p-2 rounded-lg', k.color)}><k.icon size={16} /></div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{k.label}</p>
                <p className="text-base font-bold text-slate-900 dark:text-white">{k.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="glass rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">Budget vs Aktual</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={v => `${(v/1000000).toFixed(0)}jt`} tick={{ fontSize: 10 }} />
              <Tooltip formatter={v => fmt(v)} />
              <Legend />
              <Bar dataKey="Budget" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Aktual" fill="#06b6d4" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700/50">
          <h3 className="font-semibold text-slate-800 dark:text-white">Rincian Budget</h3>
          <div className="flex gap-1">
            {['all', 'revenue', 'expense'].map(t => (
              <button key={t} onClick={() => setTypeFilter(t)}
                className={clsx('px-3 py-1 rounded-lg text-xs font-medium transition-all', typeFilter === t
                  ? 'bg-violet-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700')}>
                {t === 'all' ? 'Semua' : t === 'revenue' ? 'Pendapatan' : 'Pengeluaran'}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="h-32 flex items-center justify-center text-slate-400">Memuat...</div>
          ) : filtered.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-slate-400">Belum ada budget</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  {['Periode', 'Kategori', 'Tipe', 'Budget', 'Aktual', 'Selisih', '%', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {filtered.map(b => {
                  const good = b.variance >= 0;
                  return (
                    <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{SHORT_M[b.month]} {b.year}</td>
                      <td className="px-4 py-3 font-medium text-slate-800 dark:text-white">{b.category}</td>
                      <td className="px-4 py-3">
                        <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium', b.type === 'revenue' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400')}>
                          {b.type === 'revenue' ? 'Pendapatan' : 'Pengeluaran'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{fmt(b.amount)}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{fmt(b.actual ?? 0)}</td>
                      <td className={clsx('px-4 py-3 font-medium', good ? 'text-emerald-600' : 'text-red-500')}>
                        {b.variance !== undefined ? (good ? '+' : '') + fmt(b.variance) : '-'}
                      </td>
                      <td className={clsx('px-4 py-3 text-xs font-medium', good ? 'text-emerald-600' : 'text-red-500')}>
                        {b.variance_pct !== null ? `${good ? '+' : ''}${b.variance_pct}%` : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleDelete(b.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && <BudgetModal onClose={() => setShowModal(false)} onSave={() => { setShowModal(false); load(); }} />}
    </div>
  );
}
