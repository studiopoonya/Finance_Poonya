import { useState, useEffect } from 'react';
import { PlusCircle, Edit2, Trash2, Package, TrendingDown, Archive } from 'lucide-react';
import clsx from 'clsx';
import { getAssets, createAsset, updateAsset, deleteAsset } from '../../lib/api';

const fmt = n => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n ?? 0);
const fmtDate = d => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

const CATEGORIES = ['Equipment', 'Vehicle', 'Furniture', 'Technology', 'Other'];

const MOCK = {
  summary: { total_cost: 75000000, total_nbv: 52000000, total_accum: 23000000, active_count: 5 },
  assets: [
    { id: 1, name: 'Kamera Sony A7R V', category: 'Equipment', purchase_date: '2023-01-15', purchase_cost: 35000000, useful_life_years: 5, salvage_value: 5000000, is_active: true, annual_depreciation: 6000000, accumulated_depreciation: 12000000, net_book_value: 23000000 },
    { id: 2, name: 'Lighting Profoto B10', category: 'Equipment', purchase_date: '2022-06-01', purchase_cost: 15000000, useful_life_years: 5, salvage_value: 1000000, is_active: true, annual_depreciation: 2800000, accumulated_depreciation: 8400000, net_book_value: 6600000 },
    { id: 3, name: 'DJI Ronin 4D', category: 'Equipment', purchase_date: '2024-03-10', purchase_cost: 25000000, useful_life_years: 5, salvage_value: 3000000, is_active: true, annual_depreciation: 4400000, accumulated_depreciation: 3300000, net_book_value: 21700000 },
  ],
};

const EMPTY_FORM = {
  name: '', category: 'Equipment', purchase_date: '', purchase_cost: '',
  useful_life_years: 5, salvage_value: 0, serial_number: '', notes: '', is_active: true,
};

function AssetModal({ asset, onClose, onSave }) {
  const [form, setForm] = useState(asset ? {
    name: asset.name, category: asset.category, purchase_date: asset.purchase_date,
    purchase_cost: asset.purchase_cost, useful_life_years: asset.useful_life_years,
    salvage_value: asset.salvage_value, serial_number: asset.serial_number || '',
    notes: asset.notes || '', is_active: asset.is_active,
  } : { ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const annualDep = form.purchase_cost && form.useful_life_years
    ? ((parseFloat(form.purchase_cost) || 0) - (parseFloat(form.salvage_value) || 0)) / (parseInt(form.useful_life_years) || 1)
    : 0;

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.name || !form.purchase_date || !form.purchase_cost) { setError('Nama, tanggal, dan biaya wajib diisi.'); return; }
    setSaving(true);
    try {
      const payload = { ...form, purchase_cost: parseFloat(form.purchase_cost), salvage_value: parseFloat(form.salvage_value) || 0, useful_life_years: parseInt(form.useful_life_years) || 5 };
      if (asset) { await updateAsset(asset.id, payload); }
      else       { await createAsset(payload); }
      onSave();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="glass rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            {asset ? 'Edit Aset' : 'Tambah Aset'}
          </h2>
          {error && <p className="mb-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Nama Aset *</label>
              <input type="text" value={form.name} onChange={e => set('name', e.target.value)} required
                className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Kategori</label>
                <select value={form.category} onChange={e => set('category', e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Tanggal Beli *</label>
                <input type="date" value={form.purchase_date} onChange={e => set('purchase_date', e.target.value)} required
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Harga Beli (Rp) *</label>
                <input type="number" value={form.purchase_cost} onChange={e => set('purchase_cost', e.target.value)} min="0" required
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Nilai Sisa (Rp)</label>
                <input type="number" value={form.salvage_value} onChange={e => set('salvage_value', e.target.value)} min="0"
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Masa Manfaat (Tahun)</label>
                <input type="number" value={form.useful_life_years} onChange={e => set('useful_life_years', e.target.value)} min="1" max="50"
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">No. Seri</label>
                <input type="text" value={form.serial_number} onChange={e => set('serial_number', e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200" />
              </div>
            </div>
            {annualDep > 0 && (
              <div className="bg-violet-50 dark:bg-violet-900/20 rounded-lg px-4 py-2 text-sm text-violet-700 dark:text-violet-400">
                Depresiasi / tahun: <strong>{fmt(annualDep)}</strong>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Catatan</label>
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
                className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 resize-none" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} className="rounded" />
              <span className="text-sm text-slate-600 dark:text-slate-300">Aset aktif</span>
            </label>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose}
                className="flex-1 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-xl py-2.5 text-sm font-medium">
                Batal
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 bg-violet-600 hover:bg-violet-700 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50">
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function Assets() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(null);
  const [categoryFilter, setCategory] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await getAssets(categoryFilter ? { category: categoryFilter } : {});
      setData(res);
    } catch {
      setData(MOCK);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [categoryFilter]);

  const handleDelete = async id => {
    if (!window.confirm('Hapus aset ini?')) return;
    try { await deleteAsset(id); load(); } catch { /* ignore */ }
  };

  const summary = data?.summary || {};
  const assets  = data?.assets  || [];

  const pctDepreciated = summary.total_cost > 0 ? Math.round(summary.total_accum / summary.total_cost * 100) : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Aset & Depresiasi</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Daftar peralatan & jadwal depresiasi</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={categoryFilter} onChange={e => setCategory(e.target.value)}
            className="text-sm border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200">
            <option value="">Semua Kategori</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={() => setModal('create')}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition-colors">
            <PlusCircle size={16} />
            Tambah Aset
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Biaya',  value: fmt(summary.total_cost),  icon: Package,     bg: 'bg-violet-100 dark:bg-violet-900/40', text: 'text-violet-600 dark:text-violet-400' },
          { label: 'Nilai Buku',   value: fmt(summary.total_nbv),   icon: Archive,     bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Akum. Depresiasi', value: fmt(summary.total_accum), icon: TrendingDown, bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-500 dark:text-red-400' },
          { label: '% Terdepresiasi', value: `${pctDepreciated}%`, icon: TrendingDown, bg: 'bg-amber-100 dark:bg-amber-900/40', text: 'text-amber-600 dark:text-amber-400' },
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

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="h-40 flex items-center justify-center text-slate-400">Memuat...</div>
          ) : assets.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Package size={32} />
              <p>Belum ada aset</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  {['Nama Aset', 'Kategori', 'Tgl Beli', 'Harga Beli', 'Dep/Tahun', 'Akum. Dep', 'Nilai Buku', 'Status', 'Aksi'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {assets.map(a => {
                  const pct = a.purchase_cost > 0 ? Math.round(a.accumulated_depreciation / a.purchase_cost * 100) : 0;
                  return (
                    <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800 dark:text-white">{a.name}</p>
                        {a.serial_number && <p className="text-xs text-slate-400">{a.serial_number}</p>}
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{a.category}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{fmtDate(a.purchase_date)}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{fmt(a.purchase_cost)}</td>
                      <td className="px-4 py-3 text-red-500">{fmt(a.annual_depreciation)}</td>
                      <td className="px-4 py-3">
                        <div>
                          <span className="text-slate-700 dark:text-slate-200">{fmt(a.accumulated_depreciation)}</span>
                          <div className="w-20 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-1">
                            <div className="h-full bg-red-400 rounded-full" style={{ width: `${Math.min(100, pct)}%` }} />
                          </div>
                          <span className="text-xs text-slate-400">{pct}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-emerald-600 dark:text-emerald-400">{fmt(a.net_book_value)}</td>
                      <td className="px-4 py-3">
                        <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium', a.is_active ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-500')}>
                          {a.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setModal(a)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleDelete(a.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {(modal === 'create' || (modal && typeof modal === 'object')) && (
        <AssetModal
          asset={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); load(); }}
        />
      )}
    </div>
  );
}
