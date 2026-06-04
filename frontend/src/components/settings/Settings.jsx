import React, { useEffect, useState, useCallback } from 'react';
import {
  Settings2, Eye, EyeOff, Save, Wifi, WifiOff,
  CheckCircle2, AlertTriangle, Loader2, RefreshCw,
  Bot, Building2, Palette,
} from 'lucide-react';
import clsx from 'clsx';
import { getSettings, updateSettings, testAiConnection } from '../../lib/api';

// ─────────────────────────────────────────────────────────────────────────────
// Reusable field components
// ─────────────────────────────────────────────────────────────────────────────

function FieldLabel({ children }) {
  return <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{children}</label>;
}

function TextInput({ value, onChange, placeholder, className, ...rest }) {
  return (
    <input
      type="text"
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={clsx(
        'w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white',
        'placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-500/60 transition-colors',
        className
      )}
      {...rest}
    />
  );
}

function SecretInput({ value, onChange, isSet }) {
  const [visible, setVisible] = useState(false);
  const [draft,   setDraft]   = useState('');

  const handleChange = e => {
    setDraft(e.target.value);
    onChange(e.target.value);
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          value={draft}
          onChange={handleChange}
          placeholder={isSet ? 'Key sudah tersimpan — ketik untuk mengganti' : 'sk-ant-api03-...'}
          className={clsx(
            'w-full border rounded-xl px-4 py-2.5 text-sm font-mono pr-10 focus:outline-none transition-colors',
            'bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white',
            'placeholder:text-slate-400 dark:placeholder:text-slate-500',
            isSet && !draft
              ? 'border-emerald-300 dark:border-emerald-500/30'
              : 'border-slate-200 dark:border-white/10 focus:border-indigo-400 dark:focus:border-indigo-500/60'
          )}
        />
        <button
          type="button"
          onClick={() => setVisible(v => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          {visible ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
      {isSet && !draft && (
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 size={12} />
          <span>API key sudah dikonfigurasi</span>
        </div>
      )}
    </div>
  );
}

function SelectInput({ value, onChange, options }) {
  return (
    <select
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-500/60 appearance-none cursor-pointer transition-colors"
    >
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section wrapper
// ─────────────────────────────────────────────────────────────────────────────

function Section({ icon: Icon, title, description, badge, children }) {
  return (
    <div className="glass rounded-2xl border border-black/8 dark:border-white/5 overflow-hidden shadow-glass-light dark:shadow-glass">
      <div className="flex items-start gap-4 px-6 py-5 border-b border-black/6 dark:border-white/5">
        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-500/15 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
          <Icon size={16} className="text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-slate-900 dark:text-white font-semibold text-sm">{title}</h3>
            {badge && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/20">
                {badge}
              </span>
            )}
          </div>
          {description && <p className="text-slate-500 text-xs mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="px-6 py-5 space-y-5">
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Connection test banner
// ─────────────────────────────────────────────────────────────────────────────

function ConnectionBanner({ status }) {
  if (!status) return null;

  return (
    <div className={clsx(
      'flex items-start gap-3 px-4 py-3.5 rounded-xl text-sm border transition-all',
      status.ok
        ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
        : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-300'
    )}>
      {status.ok
        ? <CheckCircle2  size={15} className="mt-0.5 shrink-0" />
        : <AlertTriangle size={15} className="mt-0.5 shrink-0" />
      }
      <span>{status.message}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Save toast
// ─────────────────────────────────────────────────────────────────────────────

function Toast({ show, message, ok }) {
  return (
    <div className={clsx(
      'fixed bottom-6 right-6 flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-xl text-sm font-medium transition-all duration-300 z-50',
      ok
        ? 'bg-emerald-50 dark:bg-emerald-500/20 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
        : 'bg-rose-50 dark:bg-rose-500/20 border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300',
      show ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'
    )}>
      {ok ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
      {message}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Model options
// ─────────────────────────────────────────────────────────────────────────────

const MODEL_OPTIONS = [
  { value: 'claude-opus-4-7',              label: 'Claude Opus 4.7 — Most capable (Recommended)' },
  { value: 'claude-sonnet-4-6',            label: 'Claude Sonnet 4.6 — Balanced speed & quality'  },
  { value: 'claude-haiku-4-5-20251001',    label: 'Claude Haiku 4.5 — Fastest & cheapest'         },
];

const MONTH_OPTIONS = [
  { value: '01', label: 'January' }, { value: '02', label: 'February' },
  { value: '03', label: 'March'   }, { value: '04', label: 'April'    },
  { value: '05', label: 'May'     }, { value: '06', label: 'June'     },
  { value: '07', label: 'July'    }, { value: '08', label: 'August'   },
  { value: '09', label: 'September'}, { value: '10', label: 'October' },
  { value: '11', label: 'November'}, { value: '12', label: 'December' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

export default function Settings() {
  const [fields,      setFields]      = useState({});
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [testing,     setTesting]     = useState(false);
  const [connStatus,  setConnStatus]  = useState(null);
  const [toast,       setToast]       = useState({ show: false, message: '', ok: true });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const groups = await getSettings();
      const map = {};
      Object.values(groups).flat().forEach(row => {
        map[row.key] = { value: row.value, type: row.type, label: row.label, is_set: row.is_set };
      });
      setFields(map);
    } catch {
      setFields({
        anthropic_api_key: { value: null,                 type: 'secret',  label: 'Anthropic API Key',  is_set: false },
        claude_model:      { value: 'claude-opus-4-7',    type: 'select',  label: 'Claude Model',       is_set: true  },
        app_name:          { value: 'PhotoBooth Finance', type: 'text',    label: 'Application Name',   is_set: true  },
        business_name:     { value: '',                   type: 'text',    label: 'Business Name',      is_set: false },
        currency:          { value: 'USD',                type: 'text',    label: 'Currency Code',      is_set: true  },
        fiscal_year_start: { value: '01',                 type: 'select',  label: 'Fiscal Year Start',  is_set: true  },
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const setVal = (key, value) =>
    setFields(f => ({ ...f, [key]: { ...f[key], value } }));

  const showToast = (message, ok = true) => {
    setToast({ show: true, message, ok });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3500);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Skip secret fields that are already set and the user left blank (no change intended)
      const payload = Object.entries(fields)
        .filter(([, f]) => !(f.type === 'secret' && f.is_set && !f.value))
        .map(([key, f]) => ({ key, value: f.value }));
      await updateSettings(payload);
      showToast('Settings saved successfully.', true);
      load();
    } catch {
      showToast('Failed to save. Is the backend running?', false);
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setConnStatus(null);
    try {
      const result = await testAiConnection();
      setConnStatus(result);
    } catch {
      setConnStatus({ ok: false, message: 'Could not reach the backend to run the test.' });
    } finally {
      setTesting(false);
    }
  };

  const f = (key) => fields[key] ?? { value: '', type: 'text', is_set: false };

  return (
    <div className="p-6 lg:p-8 min-h-screen max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Settings2 className="text-indigo-500 dark:text-indigo-400" size={22} />
            Settings
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Configure your API keys, business info, and preferences.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={load}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 glass border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs transition-all hover:bg-slate-50 dark:hover:bg-white/5"
          >
            <RefreshCw size={12} />
            Reload
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl px-4 py-2 text-sm font-semibold transition-colors shadow-lg shadow-indigo-500/20"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-slate-200 dark:bg-slate-800/50 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-5">

          {/* AI Configuration */}
          <Section
            icon={Bot}
            title="AI Configuration"
            description="Anthropic Claude powers receipt scanning and categorization."
            badge="Claude Vision"
          >
            <div>
              <FieldLabel>Anthropic API Key</FieldLabel>
              <SecretInput
                value={f('anthropic_api_key').value}
                isSet={f('anthropic_api_key').is_set}
                onChange={v => setVal('anthropic_api_key', v)}
              />
              <p className="text-slate-500 dark:text-slate-600 text-xs mt-2">
                Get your key from{' '}
                <span className="text-indigo-600 dark:text-indigo-400">console.anthropic.com</span>
                {' '}→ API Keys. Stored securely in the database.
              </p>
            </div>

            <div>
              <FieldLabel>Claude Model</FieldLabel>
              <SelectInput
                value={f('claude_model').value}
                onChange={v => setVal('claude_model', v)}
                options={MODEL_OPTIONS}
              />
            </div>

            {/* Test Connection */}
            <div className="pt-1">
              <div className="flex items-center gap-3 mb-3">
                <button
                  onClick={handleTestConnection}
                  disabled={testing}
                  className={clsx(
                    'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all',
                    'glass border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  {testing
                    ? <Loader2 size={14} className="animate-spin" />
                    : connStatus?.ok
                      ? <Wifi    size={14} className="text-emerald-500 dark:text-emerald-400" />
                      : connStatus
                        ? <WifiOff size={14} className="text-rose-500 dark:text-rose-400" />
                        : <Wifi    size={14} />
                  }
                  {testing ? 'Testing…' : 'Test Connection'}
                </button>
                <p className="text-slate-500 dark:text-slate-600 text-xs">
                  Sends a minimal request to verify your API key works.
                </p>
              </div>
              <ConnectionBanner status={connStatus} />
            </div>
          </Section>

          {/* Business Info */}
          <Section
            icon={Building2}
            title="Business Info"
            description="Displayed on reports and investor documents."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <FieldLabel>Application Name</FieldLabel>
                <TextInput
                  value={f('app_name').value}
                  onChange={v => setVal('app_name', v)}
                  placeholder="PhotoBooth Finance"
                />
              </div>
              <div>
                <FieldLabel>Business Name</FieldLabel>
                <TextInput
                  value={f('business_name').value}
                  onChange={v => setVal('business_name', v)}
                  placeholder="My PhotoBooth Co."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <FieldLabel>Currency Code</FieldLabel>
                <TextInput
                  value={f('currency').value}
                  onChange={v => setVal('currency', v)}
                  placeholder="USD"
                  maxLength={3}
                />
              </div>
              <div>
                <FieldLabel>Fiscal Year Start</FieldLabel>
                <SelectInput
                  value={f('fiscal_year_start').value}
                  onChange={v => setVal('fiscal_year_start', v)}
                  options={MONTH_OPTIONS}
                />
              </div>
            </div>
          </Section>

          {/* System Info */}
          <Section icon={Palette} title="System Info">
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Stack',    'Laravel 11 + React 18'],
                ['Database', 'MySQL via XAMPP'],
                ['AI Model', f('claude_model').value || 'claude-opus-4-7'],
                ['API Key',  f('anthropic_api_key').is_set ? 'Configured ✓' : 'Not set'],
              ].map(([k, v]) => (
                <div key={k} className="bg-slate-100 dark:bg-slate-800/40 rounded-xl px-4 py-3 flex items-center justify-between">
                  <span className="text-xs text-slate-500">{k}</span>
                  <span className={clsx(
                    'text-xs font-medium',
                    k === 'API Key' && f('anthropic_api_key').is_set
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-700 dark:text-slate-300'
                  )}>{v}</span>
                </div>
              ))}
            </div>
          </Section>

        </div>
      )}

      <Toast {...toast} />
    </div>
  );
}
