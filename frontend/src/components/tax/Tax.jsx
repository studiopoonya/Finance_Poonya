import { useState, useEffect } from 'react';
import { PlusCircle, CheckCircle, Trash2, AlertCircle, Receipt } from 'lucide-react';
import clsx from 'clsx';
import { getTaxRecords, createTaxRecord, updateTaxRecord, deleteTaxRecord } from '../../lib/api';

const fmt = n => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n ?? 0);
const fmtDate = d => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

const MONTHS = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const FULL_MONTHS = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

const TAX_TYPES = {
  pph23:   { label: 'PPh 23',   desc: 'Pajak atas jasa, sewa, royalti (2%)', rate: 2 },
  ppn_out: { label: 'PPN Keluar', desc: 'Pajak penjualan barang/jasa (11%)', rate: 11 },
  ppn_in:  { label: 'PPN Masukan', desc: 'Kredit pajak pembelian', rate: 11 },
  pph25:   { label: 'PPh 25',   desc: 'Angsuran pajak penghasilan bulanan', rate: null },
  pph21:   { label: 'PPh 21',   desc: 'Pajak atas gaji karyawan', rate: 5 },
};

const MOCK = {
  summary: { total_tax: 3500000, pending_tax: 2000000, paid_tax: 1500000, pending_count: 3 },
  records: [
    { id: 1, period_month: 4, period_year: 2025, tax_type: 'ppn_out', description: 'PPN Wedding Budi & Sari', base_amount: 15000000, tax_rate: 11, tax_amount: 1650000, status: 'paid',    paid_at: '2025-05-10' },
    { id: 2, period_month: 5, period_year: 2025, tax_type: 'pph23',   description: 'PPh 23 Jasa Fotografer', base_amount: 8000000,  tax_rate: 2,  tax_amount: 160000,  status: 'pending', paid_at: null },
    { id: 3, period_month: 5, period_year: 2025, tax_type: 'ppn_out', description: 'PPN Corporate Event',    base_amount: 8000000,  tax_rate: 11, tax_amount: 880000,  status: 'pending', paid_at: null },
    { id: 4, period_month: 5, period_year: 2025, tax_type: 'pph25',   description: 'Angsuran PPh 25 Mei',   base_amount: 3300000,  tax_rate: 0,  tax_amount: 310000,  status: 'pending', paid_at: null },
  ],
};

const EMPTY_FORM = {
  period_month: new Date().getMonth() + 1, period_year: new Date().getFullYear(),
  tax_type: 'ppn_out', description: '', base_amount: '', tax_rate: 11, notes: '',
};

function TaxModal({ onClose, onSave }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const taxAmount = (parseFloat(form.base_amount) || 0) * (parseFloat(form.tax_rate) || 0) / 100;

  const handleTypeChange = type => {
    const preset = TAX_TYPES[type];
    set('tax_type', type);
    if (preset?.rate !== null) set('tax_rate', preset.rate ?? form.tax_rate);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.description || !form.base_amount) { setError('Deskripsi dan DPP wajib diisi.'); return; }
    setSaving(true);
    try {
      await createTaxRecord({ ...form, base_amount: parseFloat(form.base_amount), tax_rate: parseFloat(form.tax_rate) || 0 });
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
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Catat Pajak</h2>
          {error && <p className="mb-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Bulan</label>
                <select value={form.period_month} onChange={e => set('period_month', parseInt(e.target.value))}
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                  {FULL_MONTHS.slice(1).map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Tahun</label>
                <select value={form.period_year} onChange={e => set('period_year', parseInt(e.target.value))}
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Jenis Pajak</label>
              <div className="grid grid-cols-3 gap-1.5">
                {Object.entries(TAX_TYPES).map(([k, v]) => (
                  <button type="button" key={k} onClick={() => handleTypeChange(k)}
                    className={clsx('px-2 py-1.5 rounded-lg text-xs font-medium border transition-all', form.tax_type === k
                      ? 'bg-violet-600 border-violet-600 text-white'
                      : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-violet-400')}>
                    {v.label}
                  </button>
                ))}
              </div>
              <p className="mt-1 text-xs text-slate-400">{TAX_TYPES[form.tax_type]?.desc}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Deskripsi *</label>
              <input type="text" value={form.description} onChange={e => set('description', e.target.value)} required
                placeholder="Contoh: PPN Jasa Wedding Mei 2025"
                className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">DPP (Dasar Pengenaan Pajak)</label>
                <input type="number" value={form.base_amount} onChange={e => set('base_amount', e.target.value)} min="0"
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Tarif (%)</label>
                <input type="number" value={form.tax_rate} onChange={e => set('tax_rate', e.target.value)} min="0" max="100" step="0.01"
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200" />
              </div>
            </div>
            {taxAmount > 0 && (
              <div className="bg-violet-50 dark:bg-violet-900/20 rounded-lg px-4 py-2 text-sm text-violet-700 dark:text-violet-400">
                Pajak terutang: <strong>{fmt(taxAmount)}</strong>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Catatan</label>
              <input type="text" value={form.notes} onChange={e => set('notes', e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200" />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose}
                className="flex-1 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-xl py-2.5 text-sm font-medium">
                Batal
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 bg-violet-600 hover:bg-violet-700 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50">
                {saving ? 'Menyimpan...' : 'Catat Pajak'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function Tax() {
  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [year,  setYear]  = useState(new Date().getFullYear());
  const [month, setMonth] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await getTaxRecords({ year, month, tax_type: typeFilter });
      setData(res);
    } catch {
      setData(MOCK);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [year, month, typeFilter]);

  const handleMarkPaid = async id => {
    try { await updateTaxRecord(id, { status: 'paid', paid_at: new Date().toISOString().slice(0, 10) }); load(); } catch { /* ignore */ }
  };

  const handleDelete = async id => {
    if (!window.confirm('Hapus catatan pajak ini?')) return;
    try { await deleteTaxRecord(id); load(); } catch { /* ignore */ }
  };

  const summary = data?.summary || {};
  const records = data?.records || [];
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Pelacakan Pajak</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">PPh 21/23/25 & PPN</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select value={year} onChange={e => setYear(parseInt(e.target.value))}
            className="text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200">
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={month} onChange={e => setMonth(e.target.value)}
            className="text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200">
            <option value="">Semua Bulan</option>
            {FULL_MONTHS.slice(1).map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
          </select>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
            className="text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200">
            <option value="">Semua Jenis</option>
            {Object.entries(TAX_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition-colors">
            <PlusCircle size={16} />
            Catat Pajak
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Pajak', value: fmt(summary.total_tax), icon: Receipt, bg: 'bg-violet-100 dark:bg-violet-900/40', text: 'text-violet-600 dark:text-violet-400' },
          { label: 'Sudah Dibayar', value: fmt(summary.paid_tax), icon: CheckCircle, bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Belum Dibayar', value: fmt(summary.pending_tax), icon: AlertCircle, bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-600 dark:text-red-400' },
          { label: 'Antrian Pembayaran', value: `${summary.pending_count ?? 0} item`, icon: AlertCircle, bg: 'bg-amber-100 dark:bg-amber-900/40', text: 'text-amber-600 dark:text-amber-400' },
        ].map(k => (
          <div key={k.label} className="glass rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className={clsx('p-2 rounded-lg', k.bg, k.text)}><k.icon size={18} /></div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{k.label}</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{k.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pending alert */}
      {(summary.pending_count ?? 0) > 0 && (
        <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-xl p-4">
          <AlertCircle size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            <strong>{summary.pending_count} kewajiban pajak</strong> belum dibayar senilai <strong>{fmt(summary.pending_tax)}</strong>. Segera selesaikan untuk menghindari denda.
          </p>
        </div>
      )}

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="h-40 flex items-center justify-center text-slate-400">Memuat...</div>
          ) : records.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Receipt size={32} />
              <p>Belum ada catatan pajak</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  {['Periode', 'Jenis Pajak', 'Deskripsi', 'DPP', 'Tarif', 'Pajak Terutang', 'Status', 'Tgl Bayar', 'Aksi'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {records.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {MONTHS[r.period_month]} {r.period_year}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400">
                        {TAX_TYPES[r.tax_type]?.label || r.tax_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200 max-w-[200px] truncate">{r.description}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{fmt(r.base_amount)}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{r.tax_rate}%</td>
                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-white">{fmt(r.tax_amount)}</td>
                    <td className="px-4 py-3">
                      <span className={clsx('px-2.5 py-1 rounded-full text-xs font-medium', r.status === 'paid'
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400')}>
                        {r.status === 'paid' ? 'Lunas' : 'Belum Bayar'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{fmtDate(r.paid_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {r.status === 'pending' && (
                          <button onClick={() => handleMarkPaid(r.id)} title="Tandai Lunas"
                            className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
                            <CheckCircle size={15} />
                          </button>
                        )}
                        <button onClick={() => handleDelete(r.id)} title="Hapus"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && <TaxModal onClose={() => setShowModal(false)} onSave={() => { setShowModal(false); load(); }} />}
    </div>
  );
}
