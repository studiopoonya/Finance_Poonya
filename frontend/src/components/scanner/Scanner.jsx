import React, { useState, useCallback } from 'react';
import {
  ScanLine, Loader2, CheckCircle2, AlertCircle, ArrowLeft, PenLine,
} from 'lucide-react';
import clsx from 'clsx';
import DropZone   from './DropZone';
import ParsedForm from './ParsedForm';
import { scanReceipt, createTransaction } from '../../lib/api';

const TABS = [
  { key: 'ai',     label: 'AI Scan',      icon: ScanLine  },
  { key: 'manual', label: 'Manual Entry',  icon: PenLine   },
];

const EMPTY_PARSED = {
  date:       new Date().toISOString().slice(0, 10),
  merchant:   '',
  amount:     '',
  type:       'expense',
  category:   '',
  notes:      '',
  confidence: null,
};

export default function Scanner() {
  const [tab,      setTab]     = useState('ai');
  const [stage,    setStage]   = useState('idle');
  const [file,     setFile]    = useState(null);
  const [result,   setResult]  = useState(null);
  const [errorMsg, setErrorMsg]= useState('');
  const [saving,   setSaving]  = useState(false);

  const handleFile = useCallback(f => {
    setFile(f);
    if (!f) { setStage('idle'); setResult(null); }
  }, []);

  const handleScan = useCallback(async () => {
    if (!file) return;
    setStage('scanning');
    try {
      const fd = new FormData();
      fd.append('receipt', file);
      const data = await scanReceipt(fd);
      setResult(data);
      setStage('review');
    } catch (e) {
      setErrorMsg(e?.response?.data?.error ?? 'Failed to connect to the OCR service.');
      setStage('error');
    }
  }, [file]);

  const handleSave = useCallback(async (form) => {
    setSaving(true);
    try {
      await createTransaction({
        ...form,
        receipt_image_path: result?.receipt_path ?? null,
        ai_raw_response:    result?.raw ? [result.raw] : null,
        ai_confidence:      form.ai_confidence,
      });
      setStage('done');
    } catch (e) {
      setErrorMsg(e?.response?.data?.message ?? 'Failed to save transaction.');
      setStage('error');
    } finally {
      setSaving(false);
    }
  }, [result]);

  const handleManualSave = useCallback(async (form) => {
    setSaving(true);
    try {
      await createTransaction({ ...form, ai_verified: false, ai_confidence: null });
      setStage('done');
    } catch (e) {
      setErrorMsg(e?.response?.data?.message ?? 'Failed to save transaction.');
      setStage('error');
    } finally {
      setSaving(false);
    }
  }, []);

  const reset = () => {
    setStage('idle');
    setFile(null);
    setResult(null);
    setErrorMsg('');
  };

  const handleTabChange = (key) => {
    setTab(key);
    reset();
  };

  const isDone  = stage === 'done';
  const isError = stage === 'error';

  return (
    <div className="p-6 lg:p-8 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        {(stage !== 'idle' || tab === 'manual') && stage !== 'done' && stage !== 'error' && (
          <button onClick={reset} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
            <ArrowLeft size={18} />
          </button>
        )}
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <ScanLine className="text-indigo-500 dark:text-indigo-400" size={22} />
            AI Receipt Scanner
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Upload a receipt for AI extraction, or enter transaction details manually.
          </p>
        </div>
      </div>

      {/* Tabs (only when not done/error) */}
      {!isDone && !isError && (
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 rounded-xl p-1 mb-6 w-fit">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => handleTabChange(t.key)}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                tab === t.key
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              )}
            >
              <t.icon size={14} />
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Done */}
      {isDone && (
        <div className="flex flex-col items-center justify-center py-20 gap-6">
          <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-500/15 border border-emerald-300 dark:border-emerald-500/30 flex items-center justify-center">
            <CheckCircle2 size={36} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-slate-900 dark:text-white">Transaction Saved!</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
              {tab === 'manual' ? 'Transaction has been added to your ledger.' : 'The receipt has been processed and added to your ledger.'}
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={reset} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-colors">
              {tab === 'manual' ? 'Add Another' : 'Scan Another'}
            </button>
            <a href="/" className="px-5 py-2.5 glass text-slate-600 dark:text-slate-300 text-sm font-medium rounded-xl border border-slate-200 dark:border-white/10 transition-all hover:bg-slate-50 dark:hover:bg-white/5">
              Back to Dashboard
            </a>
          </div>
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="flex flex-col items-center justify-center py-20 gap-6">
          <div className="w-20 h-20 rounded-full bg-rose-100 dark:bg-rose-500/15 border border-rose-300 dark:border-rose-500/30 flex items-center justify-center">
            <AlertCircle size={36} className="text-rose-600 dark:text-rose-400" />
          </div>
          <div className="text-center max-w-sm">
            <p className="text-xl font-bold text-slate-900 dark:text-white">Something went wrong</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">{errorMsg}</p>
          </div>
          <button onClick={reset} className="px-5 py-2.5 bg-rose-600/80 hover:bg-rose-600 text-white text-sm font-semibold rounded-xl transition-colors">
            Try Again
          </button>
        </div>
      )}

      {/* Manual Entry tab */}
      {!isDone && !isError && tab === 'manual' && (
        <div className="max-w-lg">
          <ParsedForm
            parsed={EMPTY_PARSED}
            isMock={false}
            onSave={handleManualSave}
            saving={saving}
            manualMode
          />
        </div>
      )}

      {/* AI Scan tab */}
      {!isDone && !isError && tab === 'ai' && (
        <div className={clsx(
          'grid gap-6 transition-all duration-300',
          stage === 'review' ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1 max-w-lg mx-auto w-full'
        )}>
          <div className="flex flex-col gap-4">
            <DropZone onFile={handleFile} disabled={stage === 'scanning'} />

            {file && stage !== 'review' && (
              <button
                onClick={handleScan}
                disabled={stage === 'scanning'}
                className={clsx(
                  'flex items-center justify-center gap-2.5 w-full py-3.5 rounded-xl font-semibold text-sm transition-all',
                  'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/25',
                  'disabled:opacity-60 disabled:cursor-not-allowed'
                )}
              >
                {stage === 'scanning' ? (
                  <><Loader2 size={16} className="animate-spin" /> Claude Vision is reading your receipt…</>
                ) : (
                  <><ScanLine size={16} /> Analyze with AI</>
                )}
              </button>
            )}

            {stage === 'scanning' && (
              <div className="glass rounded-2xl border border-indigo-300 dark:border-indigo-500/20 p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center shrink-0">
                  <Loader2 size={18} className="text-indigo-500 dark:text-indigo-400 animate-spin" />
                </div>
                <div>
                  <p className="text-slate-900 dark:text-white text-sm font-semibold">Analyzing receipt…</p>
                  <p className="text-slate-500 text-xs mt-0.5">Claude Vision is extracting date, merchant, amount, and category</p>
                </div>
              </div>
            )}
          </div>

          {stage === 'review' && result && (
            <ParsedForm
              parsed={result.parsed}
              isMock={result.is_mock}
              onSave={handleSave}
              saving={saving}
            />
          )}
        </div>
      )}
    </div>
  );
}
