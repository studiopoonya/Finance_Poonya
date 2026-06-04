import { useState, useEffect, useCallback } from 'react';
import {
  Save, Copy, PlusCircle, Trash2, CheckCircle, AlertTriangle,
  ChevronDown, Building2, RefreshCw, BookOpen,
} from 'lucide-react';
import clsx from 'clsx';
import {
  getMonthlyBalances, saveMonthlyBalances, copyMonthlyBalances,
  getReconciliation, saveReconciliation, copyReconciliation,
} from '../../lib/api';

// ── Constants ─────────────────────────────────────────────────────────────────
const MONTHS = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

const BANK_LABELS = { line_bank: 'LINE BANK', saqu: 'SAQU', bca: 'BCA', mandiri: 'Mandiri', bni: 'BNI' };

const fmt = n => new Intl.NumberFormat('id-ID').format(Math.round(n ?? 0));
const parseNum = v => parseFloat(String(v).replace(/[^0-9.-]/g, '')) || 0;

// Mock data matching PT POONYA KITA BERSAMA's structure
const MOCK_BALANCE = {
  period_month: 12, period_year: 2025,
  is_balanced: true,
  total_debit: 180673016, total_credit: 180673016,
  rows: [
    { id: 1, account_code: '1101', account_name: 'KAS BANK PT',        debit: 11603650,  credit: 0,         sort_order: 0 },
    { id: 2, account_code: '1102', account_name: 'KAS LINE BANK',      debit: 57256,     credit: 0,         sort_order: 1 },
    { id: 3, account_code: '1103', account_name: 'PERSEDIAAN',         debit: 12118832,  credit: 0,         sort_order: 2 },
    { id: 4, account_code: '1107', account_name: 'PIUTANG LAIN-LAIN',  debit: 1367800,   credit: 0,         sort_order: 3 },
    { id: 5, account_code: '1105', account_name: 'SEWA DIBAYAR DIMUKA',debit: 666667,    credit: 0,         sort_order: 4 },
    { id: 6, account_code: '1106', account_name: 'KAS BANK SAQU',      debit: 33849665,  credit: 0,         sort_order: 5 },
    { id: 7, account_code: '1201', account_name: 'PERALATAN',          debit: 62009146,  credit: 0,         sort_order: 6 },
    { id: 8, account_code: '1203', account_name: 'PHOTOBOX',           debit: 33000000,  credit: 0,         sort_order: 7 },
    { id: 9, account_code: '1204', account_name: 'ASET TAK BERWUJUD',  debit: 26000000,  credit: 0,         sort_order: 8 },
    { id: 10, account_code: '3100', account_name: 'MODAL',             debit: 0,         credit: 180673016, sort_order: 9 },
  ],
};

const MOCK_RECON = {
  period_month: 12, period_year: 2025,
  grouped: {
    line_bank: [
      { bank_account_id: 1, bank_name: 'line_bank', internal_code: '16451859791', account_number: '10071881879', account_name: 'Angel Investor', opening_balance: 1263864, closing_balance: 0 },
      { bank_account_id: 2, bank_name: 'line_bank', internal_code: '16451859792', account_number: '10071879556', account_name: 'Marketing',      opening_balance: 3895196, closing_balance: 0 },
      { bank_account_id: 3, bank_name: 'line_bank', internal_code: '16451859793', account_number: null,          account_name: 'Poonya Box',      opening_balance: 57065,   closing_balance: 57112 },
      { bank_account_id: 4, bank_name: 'line_bank', internal_code: '16451859794', account_number: null,          account_name: 'Poonya Moments',  opening_balance: 0,       closing_balance: 0 },
      { bank_account_id: 5, bank_name: 'line_bank', internal_code: '16451859795', account_number: '10071880473', account_name: 'Subscription',    opening_balance: 6496440, closing_balance: 144 },
      { bank_account_id: 6, bank_name: 'line_bank', internal_code: '16451859795', account_number: '10071881283', account_name: 'Tabungan',         opening_balance: 2511976, closing_balance: 0 },
      { bank_account_id: 7, bank_name: 'line_bank', internal_code: '16451859795', account_number: '10071879769', account_name: 'Maintenance',      opening_balance: 0,       closing_balance: 0 },
      { bank_account_id: 8, bank_name: 'line_bank', internal_code: '16451859795', account_number: '10071881526', account_name: 'Training',         opening_balance: 0,       closing_balance: 0 },
      { bank_account_id: 9, bank_name: 'line_bank', internal_code: '16451859795', account_number: '10071881372', account_name: 'Entertain',        opening_balance: 0,       closing_balance: 0 },
      { bank_account_id: 10, bank_name: 'line_bank', internal_code: '16451859796', account_number: '10071879246', account_name: 'Dana Darurat',    opening_balance: 4937140, closing_balance: 0 },
      { bank_account_id: 11, bank_name: 'line_bank', internal_code: '16451859797', account_number: '10071880082', account_name: 'Charity',         opening_balance: 1670707, closing_balance: 0 },
    ],
    saqu: [
      { bank_account_id: 12, bank_name: 'saqu', account_number: '10071879246', account_name: 'Dana Darurat',   opening_balance: 10219756, closing_balance: 10581410 },
      { bank_account_id: 13, bank_name: 'saqu', account_number: '10071879556', account_name: 'Marketing',      opening_balance: 6475718,  closing_balance: 6769925  },
      { bank_account_id: 14, bank_name: 'saqu', account_number: '10071879769', account_name: 'Maintenance',    opening_balance: 1666097,  closing_balance: 2079519  },
      { bank_account_id: 15, bank_name: 'saqu', account_number: '10071880082', account_name: 'Charity',        opening_balance: 504764,   closing_balance: 682776   },
      { bank_account_id: 16, bank_name: 'saqu', account_number: '10071880473', account_name: 'Subscription',   opening_balance: 9303006,  closing_balance: 10639921 },
      { bank_account_id: 17, bank_name: 'saqu', account_number: '10071881283', account_name: 'Tabungan',       opening_balance: 1879643,  closing_balance: 2644485  },
      { bank_account_id: 18, bank_name: 'saqu', account_number: '10071881372', account_name: 'Entertain',      opening_balance: 41881,    closing_balance: 118575   },
      { bank_account_id: 19, bank_name: 'saqu', account_number: '10071881453', account_name: 'Endorsement',    opening_balance: 0,        closing_balance: 0        },
      { bank_account_id: 20, bank_name: 'saqu', account_number: '10071881526', account_name: 'Training',       opening_balance: 2140616,  closing_balance: 2336296  },
      { bank_account_id: 21, bank_name: 'saqu', account_number: '10071881879', account_name: 'Angel Investor', opening_balance: 1618184,  closing_balance: 1904779  },
      { bank_account_id: 22, bank_name: 'saqu', account_number: '10071883286', account_name: 'Nabung Ruko',    opening_balance: 0,        closing_balance: 0        },
    ],
  },
};

// ── Number input cell ─────────────────────────────────────────────────────────
function NumCell({ value, onChange, className }) {
  const [raw, setRaw] = useState(value > 0 ? String(value) : '');

  useEffect(() => {
    setRaw(value > 0 ? String(value) : '');
  }, [value]);

  return (
    <input
      type="text"
      inputMode="numeric"
      value={raw}
      onChange={e => {
        const v = e.target.value.replace(/[^0-9]/g, '');
        setRaw(v);
        onChange(parseFloat(v) || 0);
      }}
      onFocus={e => e.target.select()}
      className={clsx(
        'w-full px-2 py-1.5 text-right text-sm bg-transparent border-0 focus:outline-none focus:bg-white dark:focus:bg-slate-700/50 rounded transition-colors font-mono',
        className
      )}
      placeholder="0"
    />
  );
}

// ── Neraca Saldo Tab ──────────────────────────────────────────────────────────
function NeracaSaldoTab({ month, year }) {
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [msg,     setMsg]     = useState(null);
  const [showCopy, setShowCopy] = useState(false);
  const [copyFrom, setCopyFrom] = useState({ month: month > 1 ? month - 1 : 12, year: month > 1 ? year : year - 1 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await getMonthlyBalances({ month, year });
      setRows(d.rows.length > 0 ? d.rows : []);
    } catch {
      setRows(MOCK_BALANCE.rows);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => { load(); }, [load]);

  const addRow = () => setRows(r => [...r, { id: Date.now(), account_code: '', account_name: '', debit: 0, credit: 0, sort_order: r.length }]);
  const removeRow = id => setRows(r => r.filter(row => row.id !== id));
  const updateRow = (id, field, value) => setRows(r => r.map(row => row.id === id ? { ...row, [field]: value } : row));

  const totalDebit  = rows.reduce((s, r) => s + parseNum(r.debit),  0);
  const totalCredit = rows.reduce((s, r) => s + parseNum(r.credit), 0);
  const isBalanced  = Math.abs(totalDebit - totalCredit) < 1;

  const handleSave = async () => {
    setSaving(true);
    setMsg(null);
    try {
      await saveMonthlyBalances({ period_month: month, period_year: year, rows: rows.filter(r => r.account_code) });
      setMsg({ ok: true, text: 'Neraca saldo berhasil disimpan.' });
    } catch (e) {
      setMsg({ ok: false, text: e.response?.data?.message || 'Gagal menyimpan.' });
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async () => {
    try {
      const d = await copyMonthlyBalances({ from_month: copyFrom.month, from_year: copyFrom.year, to_month: month, to_year: year });
      setRows(d.rows);
      setShowCopy(false);
      setMsg({ ok: true, text: `Data disalin dari ${MONTHS[copyFrom.month]} ${copyFrom.year}.` });
    } catch (e) {
      setMsg({ ok: false, text: e.response?.data?.message || 'Gagal menyalin data.' });
    }
  };

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-2">
          {/* Balance indicator */}
          <div className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border', isBalanced
            ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700/50 text-emerald-700 dark:text-emerald-400'
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700/50 text-red-600 dark:text-red-400')}>
            {isBalanced ? <CheckCircle size={13} /> : <AlertTriangle size={13} />}
            {isBalanced ? 'BALANCE' : 'TIDAK BALANCE'}
          </div>
          <span className="text-xs text-slate-500">
            Debit: <strong className="text-slate-700 dark:text-slate-200">Rp {fmt(totalDebit)}</strong>
            {' '}| Kredit: <strong className="text-slate-700 dark:text-slate-200">Rp {fmt(totalCredit)}</strong>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button onClick={() => setShowCopy(v => !v)}
              className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              <Copy size={14} />
              Salin dari Bulan Lain
              <ChevronDown size={12} />
            </button>
            {showCopy && (
              <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-xl p-4 w-64">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-3">Salin dari periode:</p>
                <div className="flex gap-2 mb-3">
                  <select value={copyFrom.month} onChange={e => setCopyFrom(f => ({ ...f, month: parseInt(e.target.value) }))}
                    className="flex-1 text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1.5 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                    {MONTHS.slice(1).map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
                  </select>
                  <select value={copyFrom.year} onChange={e => setCopyFrom(f => ({ ...f, year: parseInt(e.target.value) }))}
                    className="w-20 text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1.5 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowCopy(false)} className="flex-1 text-xs border border-slate-200 dark:border-slate-600 rounded-lg py-1.5 text-slate-500">Batal</button>
                  <button onClick={handleCopy} className="flex-1 text-xs bg-violet-600 hover:bg-violet-700 text-white rounded-lg py-1.5 font-medium">Salin</button>
                </div>
              </div>
            )}
          </div>
          <button onClick={addRow}
            className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl border border-violet-300 dark:border-violet-600 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors">
            <PlusCircle size={14} />
            Tambah Akun
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold shadow-sm disabled:opacity-50 transition-colors">
            <Save size={14} />
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>

      {msg && (
        <div className={clsx('flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm border', msg.ok
          ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 text-emerald-700 dark:text-emerald-400'
          : 'bg-red-50 dark:bg-red-900/20 border-red-200 text-red-600')}>
          {msg.ok ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
          {msg.text}
        </div>
      )}

      {/* Spreadsheet table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 dark:bg-slate-800/80">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase w-28">No. Akun</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Nama Akun</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase w-44">Debit (Rp)</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase w-44">Kredit (Rp)</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {loading ? (
                <tr><td colSpan={5} className="py-12 text-center text-slate-400">Memuat...</td></tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <BookOpen size={32} className="mx-auto mb-2 opacity-40" />
                    Belum ada data. Klik "+ Tambah Akun" atau salin dari bulan sebelumnya.
                  </td>
                </tr>
              ) : rows.map((row, idx) => (
                <tr key={row.id ?? idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 group">
                  <td className="px-2 py-1">
                    <input type="text" value={row.account_code} onChange={e => updateRow(row.id, 'account_code', e.target.value)}
                      className="w-full px-2 py-1.5 text-sm bg-transparent border-0 focus:outline-none focus:bg-white dark:focus:bg-slate-700/50 rounded font-mono"
                      placeholder="1101" />
                  </td>
                  <td className="px-2 py-1">
                    <input type="text" value={row.account_name} onChange={e => updateRow(row.id, 'account_name', e.target.value)}
                      className="w-full px-2 py-1.5 text-sm bg-transparent border-0 focus:outline-none focus:bg-white dark:focus:bg-slate-700/50 rounded uppercase font-medium"
                      placeholder="Nama akun..." />
                  </td>
                  <td className="px-2 py-1 bg-emerald-50/30 dark:bg-emerald-900/10">
                    <NumCell value={parseNum(row.debit)} onChange={v => updateRow(row.id, 'debit', v)}
                      className="text-emerald-700 dark:text-emerald-400" />
                  </td>
                  <td className="px-2 py-1 bg-blue-50/30 dark:bg-blue-900/10">
                    <NumCell value={parseNum(row.credit)} onChange={v => updateRow(row.id, 'credit', v)}
                      className="text-blue-700 dark:text-blue-400" />
                  </td>
                  <td className="px-2 py-1">
                    <button onClick={() => removeRow(row.id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all">
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            {rows.length > 0 && (
              <tfoot className="bg-slate-100 dark:bg-slate-800/80 border-t-2 border-slate-300 dark:border-slate-600">
                <tr>
                  <td colSpan={2} className="px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 uppercase">TOTAL</td>
                  <td className="px-4 py-3 text-right font-bold font-mono text-emerald-700 dark:text-emerald-400">Rp {fmt(totalDebit)}</td>
                  <td className="px-4 py-3 text-right font-bold font-mono text-blue-700 dark:text-blue-400">Rp {fmt(totalCredit)}</td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Bank Reconciliation Tab ───────────────────────────────────────────────────
function BankReconTab({ month, year, bankName }) {
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [msg,     setMsg]     = useState(null);
  const [showCopy, setShowCopy] = useState(false);
  const [copyFrom, setCopyFrom] = useState({ month: month > 1 ? month - 1 : 12, year: month > 1 ? year : year - 1 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await getReconciliation({ month, year, bank_name: bankName });
      const grouped = d.grouped || {};
      setRows(grouped[bankName] || []);
    } catch {
      const mockGrouped = MOCK_RECON.grouped;
      setRows(mockGrouped[bankName] || []);
    } finally {
      setLoading(false);
    }
  }, [month, year, bankName]);

  useEffect(() => { load(); }, [load]);

  const update = (id, field, value) =>
    setRows(r => r.map(row => row.bank_account_id === id ? { ...row, [field]: value } : row));

  const totalOpen  = rows.reduce((s, r) => s + parseNum(r.opening_balance), 0);
  const totalClose = rows.reduce((s, r) => s + parseNum(r.closing_balance), 0);

  const handleSave = async () => {
    setSaving(true);
    setMsg(null);
    try {
      await saveReconciliation({
        period_month: month, period_year: year,
        rows: rows.map(r => ({ bank_account_id: r.bank_account_id, opening_balance: parseNum(r.opening_balance), closing_balance: parseNum(r.closing_balance) })),
      });
      setMsg({ ok: true, text: 'Rekonsiliasi bank berhasil disimpan.' });
    } catch (e) {
      setMsg({ ok: false, text: e.response?.data?.message || 'Gagal menyimpan.' });
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async () => {
    try {
      const d = await copyReconciliation({ from_month: copyFrom.month, from_year: copyFrom.year, to_month: month, to_year: year });
      const grouped = d.grouped || {};
      setRows(grouped[bankName] || []);
      setShowCopy(false);
      setMsg({ ok: true, text: `Saldo akhir ${MONTHS[copyFrom.month]} ${copyFrom.year} dijadikan saldo awal.` });
    } catch (e) {
      setMsg({ ok: false, text: e.response?.data?.message || 'Gagal menyalin.' });
    }
  };

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);
  const isLinBank = bankName === 'line_bank';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span>Saldo Awal Total: <strong className="text-slate-700 dark:text-slate-200 font-mono">Rp {fmt(totalOpen)}</strong></span>
          <span>Saldo Akhir Total: <strong className="text-slate-700 dark:text-slate-200 font-mono">Rp {fmt(totalClose)}</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button onClick={() => setShowCopy(v => !v)}
              className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              <Copy size={14} />
              Ambil dari Bulan Lain
              <ChevronDown size={12} />
            </button>
            {showCopy && (
              <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-xl p-4 w-64">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Ambil dari periode:</p>
                <p className="text-xs text-slate-400 mb-3">Saldo akhir bulan tersebut jadi saldo awal bulan ini.</p>
                <div className="flex gap-2 mb-3">
                  <select value={copyFrom.month} onChange={e => setCopyFrom(f => ({ ...f, month: parseInt(e.target.value) }))}
                    className="flex-1 text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1.5 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                    {MONTHS.slice(1).map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
                  </select>
                  <select value={copyFrom.year} onChange={e => setCopyFrom(f => ({ ...f, year: parseInt(e.target.value) }))}
                    className="w-20 text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1.5 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowCopy(false)} className="flex-1 text-xs border border-slate-200 dark:border-slate-600 rounded-lg py-1.5 text-slate-500">Batal</button>
                  <button onClick={handleCopy} className="flex-1 text-xs bg-violet-600 hover:bg-violet-700 text-white rounded-lg py-1.5 font-medium">Ambil</button>
                </div>
              </div>
            )}
          </div>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold shadow-sm disabled:opacity-50 transition-colors">
            <Save size={14} />
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>

      {msg && (
        <div className={clsx('flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm border', msg.ok
          ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 text-emerald-700 dark:text-emerald-400'
          : 'bg-red-50 dark:bg-red-900/20 border-red-200 text-red-600')}>
          {msg.ok ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
          {msg.text}
        </div>
      )}

      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 dark:bg-slate-800/80">
              <tr>
                {isLinBank && <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Kode Internal</th>}
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">No. Rekening</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Nama Rekening</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase w-44">Saldo Awal (Rp)</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase w-44">Saldo Akhir (Rp)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {loading ? (
                <tr><td colSpan={isLinBank ? 5 : 4} className="py-12 text-center text-slate-400">Memuat...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={isLinBank ? 5 : 4} className="py-12 text-center text-slate-400">Tidak ada rekening {BANK_LABELS[bankName]} terdaftar.</td></tr>
              ) : rows.map(row => (
                <tr key={row.bank_account_id} className="hover:bg-slate-50 dark:hover:bg-slate-700/20">
                  {isLinBank && (
                    <td className="px-4 py-2 font-mono text-xs text-slate-500 dark:text-slate-400">{row.internal_code || '-'}</td>
                  )}
                  <td className="px-4 py-2 font-mono text-xs text-slate-600 dark:text-slate-300">{row.account_number || '-'}</td>
                  <td className="px-4 py-2 font-medium text-slate-800 dark:text-white">{row.account_name}</td>
                  <td className="px-2 py-1 bg-emerald-50/30 dark:bg-emerald-900/10">
                    <NumCell value={parseNum(row.opening_balance)} onChange={v => update(row.bank_account_id, 'opening_balance', v)}
                      className="text-emerald-700 dark:text-emerald-400" />
                  </td>
                  <td className="px-2 py-1 bg-blue-50/30 dark:bg-blue-900/10">
                    <NumCell value={parseNum(row.closing_balance)} onChange={v => update(row.bank_account_id, 'closing_balance', v)}
                      className="text-blue-700 dark:text-blue-400" />
                  </td>
                </tr>
              ))}
            </tbody>
            {rows.length > 0 && (
              <tfoot className="bg-slate-100 dark:bg-slate-800/80 border-t-2 border-slate-300 dark:border-slate-600">
                <tr>
                  <td colSpan={isLinBank ? 3 : 2} className="px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 uppercase">TOTAL</td>
                  <td className="px-4 py-3 text-right font-bold font-mono text-emerald-700 dark:text-emerald-400">Rp {fmt(totalOpen)}</td>
                  <td className="px-4 py-3 text-right font-bold font-mono text-blue-700 dark:text-blue-400">Rp {fmt(totalClose)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'neraca',    label: 'Neraca Saldo',  icon: BookOpen },
  { key: 'line_bank', label: 'LINE BANK',     icon: Building2 },
  { key: 'saqu',      label: 'Bank SAQU',     icon: Building2 },
];

export default function MonthlyOpening() {
  const [activeTab, setActiveTab] = useState('neraca');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year,  setYear]  = useState(new Date().getFullYear());

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Input Awal Bulan</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Neraca Saldo Awal & Rekonsiliasi Bank — {MONTHS[month]} {year}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select value={month} onChange={e => setMonth(parseInt(e.target.value))}
            className="text-sm border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200">
            {MONTHS.slice(1).map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
          </select>
          <select value={year} onChange={e => setYear(parseInt(e.target.value))}
            className="text-sm border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200">
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 rounded-xl p-4">
        <RefreshCw size={16} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-800 dark:text-blue-300">
          <strong>Cara pakai:</strong> Pilih bulan &amp; tahun, lalu isi data di masing-masing tab.
          Gunakan tombol <strong>"Salin dari Bulan Lain"</strong> untuk otomatis ambil data periode sebelumnya.
          Untuk rekonsiliasi bank — saldo akhir bulan lalu otomatis jadi saldo awal bulan ini.
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl p-1 w-fit">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                activeTab === t.key
                  ? 'bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              )}>
              <Icon size={15} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab content — re-mount on period change to force fresh load */}
      <div key={`${activeTab}-${month}-${year}`}>
        {activeTab === 'neraca'    && <NeracaSaldoTab month={month} year={year} />}
        {activeTab === 'line_bank' && <BankReconTab   month={month} year={year} bankName="line_bank" />}
        {activeTab === 'saqu'      && <BankReconTab   month={month} year={year} bankName="saqu" />}
      </div>
    </div>
  );
}
