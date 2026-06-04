import { useState, useEffect } from 'react';
import {
  PlusCircle, Search, Eye, Edit2, Trash2, FileText,
  DollarSign, Clock, AlertCircle, CheckCircle,
} from 'lucide-react';
import clsx from 'clsx';
import { getInvoices, createInvoice, updateInvoice, deleteInvoice } from '../../lib/api';

const fmt = n => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n ?? 0);
const fmtDate = d => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

const STATUS = {
  draft:     { label: 'Draft',     cls: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300' },
  sent:      { label: 'Terkirim',  cls: 'bg-blue-100  dark:bg-blue-900/30  text-blue-600  dark:text-blue-400' },
  paid:      { label: 'Lunas',     cls: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' },
  overdue:   { label: 'Terlambat', cls: 'bg-red-100   dark:bg-red-900/30   text-red-600   dark:text-red-400' },
  cancelled: { label: 'Batal',     cls: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' },
};
const EVENT_TYPES = ['wedding', 'corporate', 'social', 'birthday', 'other'];
const EVENT_LABELS = { wedding: 'Wedding', corporate: 'Corporate', social: 'Social', birthday: 'Birthday', other: 'Lainnya' };

const EMPTY_ITEM = { description: '', quantity: 1, unit_price: 0 };
const EMPTY_FORM = {
  client_name: '', client_email: '', client_phone: '',
  event_type: 'other', event_date: '', issue_date: new Date().toISOString().slice(0, 10),
  due_date: '', tax_rate: 11, status: 'draft', notes: '',
  items: [{ ...EMPTY_ITEM }],
};

const MOCK_INVOICES = {
  summary: { total_invoiced: 85000000, total_paid: 55000000, total_pending: 25000000, overdue_count: 1 },
  invoices: {
    data: [
      { id: 1, invoice_number: 'INV-202505-0001', client_name: 'Budi & Sari Wedding', event_type: 'wedding',   issue_date: '2025-05-01', due_date: '2025-05-15', total: 15000000, status: 'paid',  items: [] },
      { id: 2, invoice_number: 'INV-202505-0002', client_name: 'PT Maju Bersama',     event_type: 'corporate', issue_date: '2025-05-05', due_date: '2025-05-20', total: 8000000,  status: 'sent',  items: [] },
      { id: 3, invoice_number: 'INV-202504-0003', client_name: 'Rina Birthday Party', event_type: 'birthday',  issue_date: '2025-04-10', due_date: '2025-04-25', total: 5000000,  status: 'overdue', items: [] },
    ],
    current_page: 1, last_page: 1,
  },
};

function ItemRow({ item, idx, onChange, onRemove, canRemove }) {
  const amount = (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0);
  return (
    <div className="grid grid-cols-12 gap-2 items-center">
      <div className="col-span-5">
        <input type="text" value={item.description} onChange={e => onChange(idx, 'description', e.target.value)}
          placeholder="Deskripsi item" className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200" />
      </div>
      <div className="col-span-2">
        <input type="number" value={item.quantity} onChange={e => onChange(idx, 'quantity', e.target.value)} min="0" step="0.01"
          placeholder="Qty" className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200" />
      </div>
      <div className="col-span-3">
        <input type="number" value={item.unit_price} onChange={e => onChange(idx, 'unit_price', e.target.value)} min="0"
          placeholder="Harga" className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200" />
      </div>
      <div className="col-span-1 text-right text-xs text-slate-500 dark:text-slate-400">{fmt(amount)}</div>
      <div className="col-span-1 flex justify-end">
        {canRemove && (
          <button type="button" onClick={() => onRemove(idx)} className="text-red-400 hover:text-red-600">
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

function InvoiceModal({ invoice, onClose, onSave }) {
  const [form, setForm] = useState(invoice ? {
    client_name: invoice.client_name,
    client_email: invoice.client_email || '',
    client_phone: invoice.client_phone || '',
    event_type: invoice.event_type || 'other',
    event_date: invoice.event_date || '',
    issue_date: invoice.issue_date,
    due_date: invoice.due_date,
    tax_rate: parseFloat(invoice.tax_rate) || 11,
    status: invoice.status,
    notes: invoice.notes || '',
    items: invoice.items?.length > 0 ? invoice.items.map(i => ({ description: i.description, quantity: i.quantity, unit_price: i.unit_price })) : [{ ...EMPTY_ITEM }],
  } : { ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setItem = (idx, key, val) => setForm(f => {
    const items = [...f.items];
    items[idx] = { ...items[idx], [key]: val };
    return { ...f, items };
  });
  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { ...EMPTY_ITEM }] }));
  const removeItem = idx => setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));

  const subtotal = form.items.reduce((s, i) => s + (parseFloat(i.quantity) || 0) * (parseFloat(i.unit_price) || 0), 0);
  const taxAmount = subtotal * (parseFloat(form.tax_rate) || 0) / 100;
  const total = subtotal + taxAmount;

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.client_name) { setError('Nama klien wajib diisi.'); return; }
    if (form.items.some(i => !i.description)) { setError('Semua item harus memiliki deskripsi.'); return; }
    setSaving(true);
    try {
      const payload = { ...form, tax_rate: parseFloat(form.tax_rate) || 0, items: form.items.map((i, idx) => ({ ...i, quantity: parseFloat(i.quantity) || 1, unit_price: parseFloat(i.unit_price) || 0, sort_order: idx })) };
      if (invoice) { await updateInvoice(invoice.id, payload); }
      else         { await createInvoice(payload); }
      onSave();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan invoice.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="glass rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            {invoice ? `Edit Invoice ${invoice.invoice_number}` : 'Buat Invoice Baru'}
          </h2>
          {error && <p className="mb-4 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Nama Klien *</label>
                <input type="text" value={form.client_name} onChange={e => set('client_name', e.target.value)} required
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Email</label>
                <input type="email" value={form.client_email} onChange={e => set('client_email', e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Telepon</label>
                <input type="text" value={form.client_phone} onChange={e => set('client_phone', e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Tipe Event</label>
                <select value={form.event_type} onChange={e => set('event_type', e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                  {EVENT_TYPES.map(t => <option key={t} value={t}>{EVENT_LABELS[t]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Tanggal Event</label>
                <input type="date" value={form.event_date} onChange={e => set('event_date', e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Tanggal Invoice *</label>
                <input type="date" value={form.issue_date} onChange={e => set('issue_date', e.target.value)} required
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Jatuh Tempo *</label>
                <input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} required
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">PPN (%)</label>
                <input type="number" value={form.tax_rate} onChange={e => set('tax_rate', e.target.value)} min="0" max="100" step="0.01"
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Status</label>
                <select value={form.status} onChange={e => set('status', e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                  {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
            </div>

            {/* Line items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Item Layanan</label>
                <button type="button" onClick={addItem} className="text-xs text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1">
                  <PlusCircle size={13} /> Tambah Item
                </button>
              </div>
              <div className="grid grid-cols-12 gap-2 mb-1 text-xs text-slate-400 px-1">
                <span className="col-span-5">Deskripsi</span>
                <span className="col-span-2">Qty</span>
                <span className="col-span-3">Harga</span>
                <span className="col-span-1 text-right">Total</span>
                <span className="col-span-1" />
              </div>
              <div className="space-y-2">
                {form.items.map((item, idx) => (
                  <ItemRow key={idx} item={item} idx={idx} onChange={setItem} onRemove={removeItem} canRemove={form.items.length > 1} />
                ))}
              </div>
              <div className="mt-3 border-t border-slate-200 dark:border-slate-700 pt-3 space-y-1 text-sm">
                <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
                <div className="flex justify-between text-slate-500"><span>PPN {form.tax_rate}%</span><span>{fmt(taxAmount)}</span></div>
                <div className="flex justify-between font-bold text-slate-900 dark:text-white text-base"><span>Total</span><span>{fmt(total)}</span></div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Catatan</label>
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
                className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 resize-none" />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose}
                className="flex-1 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-xl py-2.5 text-sm font-medium">
                Batal
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 bg-violet-600 hover:bg-violet-700 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50">
                {saving ? 'Menyimpan...' : invoice ? 'Simpan Perubahan' : 'Buat Invoice'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function Invoices() {
  const [data,     setData]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(null); // null | 'create' | invoice-object
  const [search,   setSearch]   = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page,     setPage]     = useState(1);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getInvoices({ search, status: statusFilter, page });
      setData(res);
    } catch {
      setData(MOCK_INVOICES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [search, statusFilter, page]);

  const handleDelete = async id => {
    if (!window.confirm('Hapus invoice ini?')) return;
    try { await deleteInvoice(id); load(); } catch { /* ignore */ }
  };

  const handleStatusUpdate = async (id, status) => {
    try { await updateInvoice(id, { status }); load(); } catch { /* ignore */ }
  };

  const summary = data?.summary || {};
  const invoices = data?.invoices?.data || [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Invoice & Billing</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Kelola tagihan klien</p>
        </div>
        <button onClick={() => setModal('create')}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition-colors">
          <PlusCircle size={16} />
          Buat Invoice
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Invoice', value: fmt(summary.total_invoiced), icon: FileText, color: 'text-violet-600', bg: 'bg-violet-100 dark:bg-violet-900/40' },
          { label: 'Sudah Dibayar', value: fmt(summary.total_paid), icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/40' },
          { label: 'Belum Dibayar', value: fmt(summary.total_pending), icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/40' },
          { label: 'Invoice Terlambat', value: summary.overdue_count ?? 0, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/40' },
        ].map(k => (
          <div key={k.label} className="glass rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className={clsx('p-2 rounded-lg', k.bg, k.color)}><k.icon size={18} /></div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{k.label}</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{k.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Cari nama klien atau nomor invoice..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200" />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="text-sm border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200">
          <option value="">Semua Status</option>
          {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="h-40 flex items-center justify-center text-slate-400">Memuat...</div>
          ) : invoices.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center gap-2 text-slate-400">
              <FileText size={32} />
              <p>Belum ada invoice</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  {['No. Invoice', 'Klien', 'Tipe Event', 'Tgl Invoice', 'Jatuh Tempo', 'Total', 'Status', 'Aksi'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-400">{inv.invoice_number}</td>
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-white">{inv.client_name}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 capitalize">{EVENT_LABELS[inv.event_type] || inv.event_type}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{fmtDate(inv.issue_date)}</td>
                    <td className={clsx('px-4 py-3', inv.status === 'overdue' ? 'text-red-500 font-medium' : 'text-slate-500 dark:text-slate-400')}>
                      {fmtDate(inv.due_date)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-white">{fmt(inv.total)}</td>
                    <td className="px-4 py-3">
                      <span className={clsx('px-2.5 py-1 rounded-full text-xs font-medium', STATUS[inv.status]?.cls || STATUS.draft.cls)}>
                        {STATUS[inv.status]?.label || inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {inv.status === 'sent' && (
                          <button onClick={() => handleStatusUpdate(inv.id, 'paid')} title="Tandai Lunas"
                            className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
                            <CheckCircle size={15} />
                          </button>
                        )}
                        <button onClick={() => setModal(inv)} title="Edit"
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
                          <Edit2 size={15} />
                        </button>
                        <button onClick={() => handleDelete(inv.id)} title="Hapus"
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
        {/* Pagination */}
        {data?.invoices?.last_page > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-slate-700/50">
            <span className="text-xs text-slate-500">Halaman {data.invoices.current_page} dari {data.invoices.last_page}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
                className="px-3 py-1 text-xs border border-slate-200 dark:border-slate-600 rounded-lg disabled:opacity-40">
                Prev
              </button>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= data.invoices.last_page}
                className="px-3 py-1 text-xs border border-slate-200 dark:border-slate-600 rounded-lg disabled:opacity-40">
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {(modal === 'create' || (modal && typeof modal === 'object')) && (
        <InvoiceModal
          invoice={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); load(); }}
        />
      )}
    </div>
  );
}
